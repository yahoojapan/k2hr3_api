/*
 * K2HR3 REST API
 *
 * Copyright 2017 Yahoo Japan Corporation.
 *
 * K2HR3 is K2hdkc based Resource and Roles and policy Rules, gathers 
 * common management information for the cloud.
 * K2HR3 can dynamically manage information as "who", "what", "operate".
 * These are stored as roles, resources, policies in K2hdkc, and the
 * client system can dynamically read and modify these information.
 *
 * For the full copyright and license information, please view
 * the license file that was distributed with this source code.
 *
 * AUTHOR:   Hirotaka Wakabayashi
 * CREATE:   Fri, Aug 20 2021
 * REVISION:
 *
 */

//------------------------------------------------------------------------
// Usage
//------------------------------------------------------------------------
// To enable this module, make the following settings in the K2HR3 API
// configuration file(ex, production.json/local.json/etc).
//
//	{
//		'keystone': {
//			'type':			'k8soidc'
//		}
//	}
//
// Set the value of the 'keystone'->'type' object to 'k8soidc'.
//
// Next, this module requires its own information, so the following
// settings in configuration file are required.
//
//	{
//		'k8soidc': {
//			'audience':			'<client id for open id connect>',
//			'issuer':			'<issue url for open id connect>',
//			'usernamekey':		'<user name key name in token>',
//			'k8sapi_url':		'<kubernetes api url>',
//			'k8s_ca_path':		'<CA cert file path for kubernetes api url>',
//			'k8s_sa_token':		'<Service account token for kubernetes>'
//			'unscopedtoken_exp':'<Expire limit for unscoped Token created from oidc>'
//		}
//	}
//
// Set the 'k8soidc' object as above. This object should contain the
// following keys(objects). The contents of each setting are explained.
//
//	[audience]
//		Set the client id for Open id connect. This key and value are
//		required.
//	[issuer]
//		Set the issuer URL of Open id connect. This key and value are
//		required.
//	[usernamekey]
//		Specify the key name that is the Username set in the Token of
//		Open id connect. If there is no key representing Username in
//		Token, it can be omitted. If omitted, the value of the 'sub'
//		key is treated as the Username.
//	[k8sapi_url]
//		Specify the URL of the Kubernetes API. This module accesses
//		the Kubernetes API to get the list of Kubernetes Namespaces.
//		For example, that is 'https://kubernetes.default.svc'. This key
//		and value are required.
//	[k8s_ca_path]
//		Specify the path of the CA certificate to access the Kubernetes
//		API. If you're running the K2HR3 API inside a Kubernetes pod,
//		it's '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'.
//		This key and value are required.
//	[k8s_sa_token]
//		Specify the Token of the Service Account to access the Kubernetes
//		API. If you're running the K2HR3 API inside a Kubernetes pod,
//		it's '/var/run/secrets/kubernetes.io/serviceaccount/token'.
//		This key and value are required.
//	[unscopedtoken_exp]
//		Specifies the expiration date of the Unscoped token created by
//		OIDC. This value is specified in seconds(s).
//		If this value does not exist or is less than or equal to 0,
//		the default value will be used. The default value is the same
//		as the OIDC token expiration date.
//
//------------------------------------------------------------------------

'use strict';

var	apiutil		= require('./k2hr3apiutil');
var	k2hr3		= require('./k2hr3dkc');
var	r3keys		= require('./k2hr3keys').getK2hr3Keys;

// Debug logging objects
var	r3logger	= require('../lib/dbglogging');

// decode oidc token libraries
var	{ decode }					= require('jose').base64url;
var	{ jwtVerify }				= require('jose');
var	{ createRemoteJWKSet }		= require('jose');

// kubernetes client api
var	k8sclientapi				= require('@kubernetes/client-node');
var	fs							= require('fs');

// https library
var https	= require('https');

// const variables
var	K8S_PUBLISHER_NAME			= 'K8SOIDC';
var	K8S_REGION_NAME				= 'K8sCluster';
var	OIDC_JWKS_URI_KEYNAME		= 'jwks_uri';

//
// Global variables from configuration file
//
var	oidc_config			= null;
var	oidc_audience		= null;
var	oidc_issuer			= null;
var	oidc_jwks_uri		= null;
var	oidc_username		= null;
var	k8s_api_url			= null;
var	k8s_ca_cert			= null;
var	k2hr3_k8s_sa_token	= null;
var	unscopedtoken_exp	= 0;			// Expire limit for unscoped Token created from oidc(default is 0 means as same as oidc limit)

(function()
{
	var	r3Conf	= require('./k2hr3config').r3ApiConfig;
	var	apiConf	= new r3Conf();
	oidc_config	= apiConf.getOtherObject('k8soidc');

	if(apiutil.isSafeEntity(oidc_config)){
		oidc_audience		= oidc_config.audience;
		oidc_issuer			= oidc_config.issuer;
		oidc_username		= oidc_config.usernamekey;
		k8s_api_url			= oidc_config.k8sapi_url;
		k8s_ca_cert			= oidc_config.k8s_ca_path;
		k2hr3_k8s_sa_token	= fs.readFileSync(oidc_config.k8s_sa_token, 'utf8');

		// unscopedtoken_exp must be number
		if(apiutil.isSafeEntity(oidc_config.unscopedtoken_exp) && !isNaN(oidc_config.unscopedtoken_exp) && 0 < oidc_config.unscopedtoken_exp){
			unscopedtoken_exp = oidc_config.unscopedtoken_exp;
		}
	}
}());

//---------------------------------------------------------
// User Token for k8s oidc
//---------------------------------------------------------
// 
// user			:	user name which is verified authentication
// user_id		:	user id which is verified authentication
// expire_limit	:	specify expire second(default 24H = 24 * 60 * 60 sec), and allow empty
// 
// result		:	{
//						result:		true/false
//						message:	null or error message string
//						token:		undefined(error) or user token string
//						expire_at:	expire date(UTC ISO 8601)
//						token_seed:	JSON token seed data
//						userid:		user id
// 					}
// 
// [NOTE]
// user token seed value is following
// 					{
//						publisher:	"K8SOIDC"
//						userexid:	"user extra id(a part of seed uuid4)"
//						date:		"UTC ISO 8601 time at create"
//						expire:		"UTC ISO 8601 time at expire"
//						creator:	"User full yrn"
//						base:		"32byte hex string"
//						user:		"user name"
//						ip:			always null
//						hostname:	always null
//						port:		always 0
//						cuk:		always null
//						extra:		always null
//						tenant:		if scoped token, this is "tenant name". if not, this is null
//					}
//
function rawCreateUserTokenByK8sUser(user, user_id, tenant, expire_limit)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(user)){														// allow another parameter is null
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeStrUuid4(user_id)){													// user_id is uuid4
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : user_id(must be uuid4)=' + JSON.stringify(user_id);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(tenant)){
		tenant = null;
	}
	if(0 < unscopedtoken_exp){
		expire_limit = unscopedtoken_exp;													// override expire limit by config
	}else{
		if(!apiutil.isSafeEntity(expire_limit) || isNaN(expire_limit) || expire_limit <= 0){
			expire_limit = 24 * 60 * 60;													// default 24H
		}
	}

	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	user				= user.toLowerCase();
	var	keys			= r3keys(user, null);
	if(!apiutil.isSafeEntity(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	var	user_id_uuid4	= user_id;															// user id must be UUID4
	var	user_ex_id		= apiutil.getStrUuid4();											// set seed(uuid4)

	// make token seed value
	var	now_unixtime	= apiutil.getUnixtime();
	var	token_seed		= {};
	token_seed.publisher= K8S_PUBLISHER_NAME;												// "K8SOIDC"
	token_seed.userexid	= user_ex_id;														// seed(uuid4)
	token_seed.date		= (new Date(now_unixtime * 1000)).toISOString();					// now date(UTC ISO 8601)
	token_seed.expire	= (new Date((now_unixtime + expire_limit) * 1000)).toISOString();	// expire date(UTC ISO 8601)
	token_seed.creator	= keys.USER_KEY;													// "yrn:yahoo::::user:<user>"
	token_seed.user		= user;																// user(creator)
	token_seed.hostname	= null;																// hostname(creator)
	token_seed.ip		= null;																// ip(creator)
	token_seed.port		= 0;																// port(creator)
	token_seed.cuk		= null;																// cuk(creator)
	token_seed.extra	= null;																// extra(creator)
	token_seed.tenant	= tenant;															// tenant(if scope, not null)

	// user token and yrn key
	var	user_token		= '';
	var	token_user_key	= null;

	// create key
	for(var is_loop = true; is_loop; ){														// for eslint
		// make user token
		var	token_elements	= apiutil.makeStringToken256(user_ex_id, user_id_uuid4);
		if(!apiutil.isSafeEntity(token_elements)){
			resobj.result	= false;
			resobj.message	= 'could not make token from ' + JSON.stringify(user_ex_id) + ' and ' + JSON.stringify(user_id);
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
		user_token			= token_elements.str_token;
		token_seed.base		= token_elements.str_base;										// token base

		// user token key
		token_user_key		= keys.TOKEN_USER_TOP_KEY + '/' + user_token;					// "yrn:yahoo::::token:user/<user token>"

		// get user token for existing check
		var	value			= dkcobj.getValue(token_user_key, null, true, null);
		if(!apiutil.isSafeEntity(value)){
			// succeed uniq token
			break;
		}
		r3logger.dlog('conflict user token(' + user_token + ') which already is used, so remake token for uniq.');
	}

	// Add user token/expire/seed into result object.
	resobj.token		= user_token;
	resobj.expire_at	= token_seed.expire;
	resobj.token_seed	= JSON.stringify(token_seed);
	resobj.userid		= user_id;

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// Verify User Token Publisher For k8s oidc
//---------------------------------------------------------
// 
// token_seed		:	token seed data
//
// result			:	{
//							result:		true/false
//							message:	null or error message string
// 						}
// 
function rawWrapVerifyUserTokenPublisherForK8s(token_seed)
{
	var	resobj = {result: true, message: null};

	var	seed = apiutil.parseJSON(token_seed);
	if(	!apiutil.isSafeEntity(seed)				||
		!apiutil.isSafeString(seed.publisher)	||
		(seed.publisher != K8S_PUBLISHER_NAME)	)		// publisher must be 'K8SOIDC'
	{
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
}

//---------------------------------------------------------
// Verify User Token (OIDC Token)
//---------------------------------------------------------
// 
// dkcobj_permanent	:	dkcobj object
// user				:	target user name for token
// tenant			:	target tenant name for token(if token is scoped)
// token			:	check token
// token_seed		:	token seed data
//
// result			:	{
//							result:		true/false
//							message:	null or error message string
// 						}
// 
function rawVerifyUserTokenByK8sUser(dkcobj_permanent, user, tenant, token, token_seed)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(token, token_seed, user)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : token=' + JSON.stringify(token) + ', token_seed=<not printable>, user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check all seed values
	var	seed = apiutil.parseJSON(token_seed);
	if(	!apiutil.isSafeEntity(seed)				||
		!apiutil.isSafeString(seed.publisher)	||
		(seed.publisher != K8S_PUBLISHER_NAME)	||		// publisher must be 'K8SOIDC'
		!apiutil.isSafeString(seed.userexid)	||
		!apiutil.isSafeString(seed.date)		||
		!apiutil.isSafeString(seed.expire)		||
		!apiutil.isSafeString(seed.creator)		||
		!apiutil.isSafeString(seed.base)		||
		!apiutil.isSafeString(seed.user)		||
		!apiutil.compareCaseString(seed.user, user))
	{
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check expire
	if(apiutil.isExpired(seed.expire)){
		resobj.result	= false;
		resobj.message	= 'token is expired by expire date(' + seed.expire + ') in token_seed.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check tenant name(if tenant is specified, seed must have same tenant name)
	if(apiutil.isSafeString(seed.tenant) !== apiutil.isSafeString(tenant) || (apiutil.isSafeString(seed.tenant) && !apiutil.compareCaseString(seed.tenant, tenant))){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is (un)scoped, but tenant name is (not) specified. Then unmatched.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// k2hdkc
	var	keys	= r3keys(seed.user, seed.tenant);
	var	dkcobj	= dkcobj_permanent;
	if(!apiutil.isSafeEntity(dkcobj)){
		dkcobj	= k2hr3.getK2hdkc(true, false);												// use permanent object(need to clean)
		if(!apiutil.isSafeEntity(dkcobj)){
			resobj.result	= false;
			resobj.message	= 'Not initialize yet.';
			r3logger.elog(resobj.message);
			return resobj;
		}
	}

	// get user id
	var	userid	= dkcobj.getValue(keys.USER_ID_KEY, null, true, null);						// get user id from "yrn:yahoo::::user:<user>:id"
	if(!apiutil.isSafeEntity(dkcobj_permanent)){
		dkcobj.clean();
	}
	if(!apiutil.isSafeString(userid)){
		resobj.result	= false;
		resobj.message	= 'could not get user id for user(' + seed.user + ').';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// make verify token
	var	token_elements	= apiutil.makeStringToken256(seed.userexid, userid, seed.base);
	if(!apiutil.isSafeEntity(token_elements)){
		resobj.result	= false;
		resobj.message	= 'could not make verify token from ' + JSON.stringify(seed.userexid) + ' and ' + JSON.stringify(userid) + ' and ' + JSON.stringify(seed.base);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(token !== token_elements.str_token){
		resobj.result	= false;
		resobj.message	= 'token(' + token + ') verify is failure, verify token is ' + token_elements.str_token + '.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	return resobj;
}

//---------------------------------------------------------
// Get User/Tenant information by User Token
//---------------------------------------------------------
//
// Result:	{
//				result:		true/false
//				message:	null or error message string
//				user:		user name
//				userid:		user id
//				tenant:		if token is scoped token, this value is set tenant name.
//			}
//
function rawGetUserTenantInfoByUserToken(token)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(token)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : token=' + JSON.stringify(token);
		r3logger.elog(resobj.message);
		return resobj;
	}
	var	dkcobj			= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	var	keys			= r3keys();
	if(!apiutil.isSafeEntity(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// get token key under user key
	var	token_value_key	= keys.TOKEN_USER_TOP_KEY + '/' + token;							// "yrn:yahoo::::token:user/<token>"
	var	user_token_key	= dkcobj.getValue(token_value_key, null, true, null);				// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
	if(!apiutil.isSafeString(user_token_key)){
		resobj.result	= false;
		resobj.message	= 'token key(' + token_value_key + ') for token(' + token + ') is not existed.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// get user name and tenant name from token key yrn path
	var	pattern		= new RegExp('^' + keys.MATCH_ANY_USER_TOKEN);							// regex = /^yrn:yahoo::::user:(.*):tenant\/(.*)\/token\/(.*)/
	var	matches		= user_token_key.match(pattern);										// reverse to user/tenant names
	if(apiutil.isEmptyArray(matches) || matches.length < 4 || '' === apiutil.getSafeString(matches[1])){
		resobj.result	= false;
		resobj.message	= 'token key(' + token_value_key + ') for token(' + token + ') has wrong format value(' + user_token_key + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	var	token_user	= apiutil.getSafeString(matches[1]);
	var	token_tenant= apiutil.getSafeString(matches[2]);
	if('' === token_tenant){
		token_tenant= null;
	}

	// get token seed
	var	user_token_seed_key = user_token_key + '/' + keys.SEED_KW;							// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed"
	var	token_seed			= dkcobj.getValue(user_token_seed_key, null, true, null);
	if(!apiutil.isSafeString(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token key(' + token_value_key + ') for token(' + token + ') does not have token seed data.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// verify token
	var	vres = rawVerifyUserTokenByK8sUser(dkcobj, token_user, token_tenant, token, token_seed);
	if(!vres.result){
		resobj.result	= false;
		resobj.message	= 'failed to verify token(' + token + ') with seed by ' + vres.message;
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// get user id
	keys		= r3keys(token_user, null);													// remake keys
	var	userid	= dkcobj.getValue(keys.USER_ID_KEY, null, true, null);						// get user id from "yrn:yahoo::::user:<user>:id"
	if(!apiutil.isSafeString(userid)){
		resobj.result	= false;
		resobj.message	= 'could not get user id for user(' + token_user + ').';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	dkcobj.clean();

	// make result
	resobj.user		= token_user;
	resobj.userid	= userid;
	resobj.tenant	= token_tenant;

	return resobj;
}

//---------------------------------------------------------
// Verify (Un)scoped Token
//---------------------------------------------------------
// 
// token			:	unscoped/scoped token
//
function rawVerifyUnscopedToken(token)
{
	if(!apiutil.isSafeString(token)){
		r3logger.elog('token(' + JSON.stringify(token) + ') parameter is wrong.');
		return false;
	}

	var	dkcobj	= k2hr3.getK2hdkc(true, false);												// use permanent object(need to clean)
	var	keys	= r3keys();
	if(!apiutil.isSafeEntity(dkcobj)){
		r3logger.elog('K2hdkc client is not initialized yet.');
		return false;
	}

	// get token key under user key
	var	token_value_key	= keys.TOKEN_USER_TOP_KEY + '/' + token;							// "yrn:yahoo::::token:user/<token>"
	var	user_token_key	= dkcobj.getValue(token_value_key, null, true, null);				// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
	if(!apiutil.isSafeString(user_token_key)){
		r3logger.elog('token key(' + token_value_key + ') for token(' + token + ') is not existed.');
		dkcobj.clean();
		return false;
	}

	// get user name and tenant name from token key yrn path
	var	pattern		= new RegExp('^' + keys.MATCH_ANY_USER_TOKEN);							// regex = /^yrn:yahoo::::user:(.*):tenant\/(.*)\/token\/(.*)/
	var	matches		= user_token_key.match(pattern);										// reverse to user/tenant names
	if(apiutil.isEmptyArray(matches) || matches.length < 4 || '' === apiutil.getSafeString(matches[1])){
		r3logger.elog('token key(' + token_value_key + ') for token(' + token + ') has wrong format value(' + user_token_key + ')');
		dkcobj.clean();
		return false;
	}
	var	token_user	= apiutil.getSafeString(matches[1]);
	var	token_tenant= apiutil.getSafeString(matches[2]);
	if('' === token_tenant){
		token_tenant= null;
	}

	// get token seed
	var	user_token_seed_key = user_token_key + '/' + keys.SEED_KW;							// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed"
	var	token_seed			= dkcobj.getValue(user_token_seed_key, null, true, null);
	if(!apiutil.isSafeString(token_seed)){
		r3logger.elog('token key(' + token_value_key + ') for token(' + token + ') does not have token seed data.');
		dkcobj.clean();
		return false;
	}

	// verify token
	var	vres = rawVerifyUserTokenByK8sUser(dkcobj, token_user, token_tenant, token, token_seed);
	if(!vres.result){
		r3logger.elog('failed to verify token(' + token + ') with seed by ' + vres.message);
		dkcobj.clean();
		return false;
	}
	dkcobj.clean();
	return true;
}

//---------------------------------------------------------
// Get Scoped token from k8s user token
//---------------------------------------------------------
//
// callback(error, result):
//				result = {
//					user:		user name
//					userid:		user id
//					scoped:		always true
//					token:		token string
//					expire:		expire string(UTC ISO 8601)
//					region:		region string
//					token_seed:	JSON token seed data
//				}
//
// [NOTE]
// The token is allowed scoped token, but it must be same tenant token.
//
function rawGetUserScopedTokenK8s(token, tenant, callback)
{
	var	error;

	if(!apiutil.isSafeStrings(token, tenant)){
		error = new Error('some parameters are wrong : token=' + JSON.stringify(token) + ', tenant=' + JSON.stringify(tenant));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// verify and get user/tenant information
	var	token_info = rawGetUserTenantInfoByUserToken(token);
	if(!token_info.result){
		error = new Error('could not get any information from token(' + token + '), result : ' + token_info.message);
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// check tenant name
	if(apiutil.isSafeString(token_info.tenant) && token_info.tenant !== tenant){
		error = new Error('token(' + token + ') has scoped(' + token_info.tenant + '), but it is not as same as the request tenant(' + tenant + ').');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// create scoped token
	var	resobj = rawCreateUserTokenByK8sUser(token_info.user, token_info.userid, tenant);		// not specify expire limit now(using default).
	if(!resobj.result){
		error = new Error('could not create user scoped token for uname(' + token_info.user + ')/user id(' + token_info.userid + ') for tenant(' + tenant + ').');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// make result
	var	result	= {};
	result.user			= token_info.user;
	result.userid		= token_info.userid;
	result.scoped		= true;
	result.token		= resobj.token;
	result.expire		= resobj.expire_at;
	result.region		= K8S_REGION_NAME;
	result.token_seed	= resobj.token_seed;

	callback(null, result);
}

//---------------------------------------------------------
// Get Unscoped token by oidc token
//---------------------------------------------------------
//
// callback(error, result):
//		result = {
//			user:		user name				User name in token: set user name if specified user name key name in config. if not specified, set user id
//			userid:		user id					User id in token: payload in token has 'sub' key, it is user id.
//			scoped:		false					(always false)
//			token:		token string(id)		OIDC Token
//			expire:		expire string			expire in token: payload in token has 'exp' key, it is expire unix time.
//			region:		region string			(always n/a)
//			token_seed:	seed					({publisher: 'K8SOIDC'})
//		}
//

//
// Utility - Verify OIDC token and get user name
//
// token:	oidc token
//
async function rawVerifyTokenAndGetUsername(token)
{
	var	jwtParam	= {
		issuer:		oidc_issuer,
		audience:	oidc_audience
	};

	var myPromise = function(issuer_url, conf_key){
		return new Promise(function(resolve, reject){
			https.get(oidc_issuer + '/.well-known/openid-configuration', function(res){
				if(res.statusCode !== 200){
					res.resume();
					reject('statusCode should be 200, not ', res.statusCode);
				}
				res.setEncoding('utf8');
				let rawData = '';
				res.on('data', function(chunk){ rawData += chunk; });
				res.on('end', function(){
					var parsedData = apiutil.parseJSON(rawData);
					if(apiutil.isSafeEntity(parsedData[conf_key])){
						resolve(parsedData[conf_key]);
					}else{
						var errorMsg = ('the ' + conf_key + ' key should exist, but no such a key');
						r3logger.elog(errorMsg);
						reject(errorMsg);
					}
				});
			}).on('error', function(err){
				r3logger.elog(err.message);
				reject(err.message);
			});
		});
	};

	// 1. Calls async here.
	async function asyncFunction(){
		// 2. Calls await() here.
		try{
			oidc_jwks_uri = await myPromise(oidc_issuer, OIDC_JWKS_URI_KEYNAME);
			if(!apiutil.isSafeString(oidc_jwks_uri)){
				var	error = new Error('oidc_jwks_uri should be defined, but no oidc_jwks_uri.');
				r3logger.elog(error.message);
				throw error;
			}
		}catch(err){
			r3logger.elog(err.message);
			throw err;
		}
		var JWKS = createRemoteJWKSet(new URL(oidc_jwks_uri));
		var { payload, protectedHeader } = await jwtVerify(token, JWKS, jwtParam).catch(function(err){		// eslint-disable-line no-unused-vars
			r3logger.elog(err.message);
			throw err;
		});

		var	userName	= null;
		if(apiutil.isSafeString(oidc_username)){
			userName = payload[oidc_username];
		}else{
			if(apiutil.isSafeString(payload.sub)){
				userName = payload.sub;
			}
		}
		if(!apiutil.isSafeString(userName)){
			error = new Error('failed to verify token for getting user name.');
			r3logger.elog(error.message);
			throw error;
		}
		return userName;
	}
	return asyncFunction();
}

function rawGetUserUnscopedTokenK8s(token, callback)
{
	if(!apiutil.isSafeString(token)){
		var error = new Error('oidc token parameter is not string or empty.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// Check the id_token.
	//
	//	see. https://openid.net/specs/openid-connect-core-1_0.html#IDToken
	//
	var	parts = token.split('.', 2);
	if(2 !== parts.length){
		error = new Error('oidc token must have two parts, but it has ' + parts.length + ' parts.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// decode part[1] to payload
	//
	var	payload	= apiutil.parseJSON(new TextDecoder().decode(decode(parts[1])));
	if(!apiutil.isSafeEntity(payload)){
		error = new Error('could not decode json from the part[1] in oidc token.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// payload must have 'sub' key for user id
	//
	var	userid;
	if(apiutil.isSafeString(payload.sub)){
		userid = payload.sub;
	}else{
		error = new Error('token payload should contain sub(userid), but not find sub(userid).');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// get user name from payload
	//
	var	username;
	if(apiutil.isSafeString(oidc_username)){
		if(apiutil.isSafeString(payload[oidc_username])){
			username = payload[oidc_username];
		}else{
			error = new Error('token payload should contain user name(' + oidc_username + '), but not find it.');
			r3logger.elog(error.message);
			callback(error, null);
			return;
		}
	}else{
		// If user name key is not specified, user id will be used instead.
		username = userid;
	}

	//
	// verify token by JWT library and get user name
	//
	var	_callback		= callback;
	var	lower_username	= username.toLowerCase();								// to lower case
	var	verified_username;
	rawVerifyTokenAndGetUsername(token).then(function(result){
		verified_username	= result;

		//
		// compare user name
		//
		if(!apiutil.compareCaseString(lower_username, verified_username)){
			error = new Error('oidc token has ' + lower_username + ' username, but verified username(' + verified_username + ') is different.');
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}

		// core seed
		var	user_id_uuid4	= apiutil.cvtNumberStringToUuid4(userid, 10);		// payload.sub is decimal string
		var	expire_limit;
		if(apiutil.isSafeEntity(payload['exp']) && !isNaN(payload['exp'])){
			expire_limit	= payload['exp'] - apiutil.getUnixtime();
			if(expire_limit <= 0){
				expire_limit= 24 * 60 * 60;										// default 24H
			}
		}else{
			expire_limit	= 24 * 60 * 60;										// default 24H
		}

		// create token
		var	resobj			= rawCreateUserTokenByK8sUser(lower_username, user_id_uuid4, null, expire_limit);
		if(!resobj.result){
			error = new Error('could not create user token for uname(' + lower_username + ') or something wrong result : ' + resobj.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}

		// make result
		var	resultobj			= {};
		resultobj.user			= lower_username;
		resultobj.userid		= resobj.userid;
		resultobj.scoped		= false;
		resultobj.token			= resobj.token;
		resultobj.expire		= resobj.expire_at;
		resultobj.region		= K8S_REGION_NAME;
		resultobj.token_seed	= resobj.token_seed;

		_callback(null, resultobj);

	}).catch(function(err){
		r3logger.elog(err.message);
		_callback(err, null);
		return;
	});

	return;
}

//---------------------------------------------------------
// Get tenant list by unscoped token
//---------------------------------------------------------
//
// unscopedtoken:	oidc token(Not use)
//
function rawGetUserTenantListK8s(unscopedtoken, callback)
{
	if(!apiutil.isSafeString(unscopedtoken)){
		var error = new Error('unscopedtoken parameter is wrong.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// Verify unscoped token
	if(!rawVerifyUnscopedToken(unscopedtoken)){
		error = new Error('unscopedtoken is not safe, varidation is failed.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	var	_callback	= callback;

	//
	// Get Namespaces by Service Access token
	//
	var cluster		= {
		server:			k8s_api_url,
		caFile:			k8s_ca_cert,
		skipTLSVerify:	false
	};
	var user		= {
		token:			k2hr3_k8s_sa_token									// [NOTE] k2hr3_k8s_sa_token is global variable
	};

	var kubeconfig	= new k8sclientapi.KubeConfig();
	kubeconfig.loadFromClusterAndUser(cluster, user);

	var k8sApi		= kubeconfig.makeApiClient(k8sclientapi.CoreV1Api);
	k8sApi.setDefaultAuthentication({
		applyToRequest: function(opts){										// [NOTE] Make this an arrow function in the future.
			opts.headers.Authorization	= 'Bearer ' + k2hr3_k8s_sa_token,	// [NOTE] k2hr3_k8s_sa_token is global variable
			opts.rejectUnauthorized		= false;
		}
	});

	var	k8s_ns		= ['kube-node-lease', 'kube-public', 'kube-system', 'kubernetes-dashboard'];
	var	resarr		= new Array;
	k8sApi.listNamespace().then(function(response){							// [NOTE] Using Promise
		for(var pos = 0; pos < response.body.items.length; ++pos){
			// check body...items
			if(	!apiutil.isSafeEntity(response.body)							||
				!apiutil.isArray(response.body.items)							||
				!apiutil.isSafeEntity(response.body.items[pos].metadata)		||
				!apiutil.isSafeString(response.body.items[pos].metadata.name)	)
			{
				r3logger.wlog('one of response for project(tenant) list is something wrong : ' + JSON.stringify(response.body));
				continue;
			}

			// Is the k8s cluster namespace in kubernetes system namespaces?
			if(apiutil.findStringInArray(k8s_ns, response.body.items[pos].metadata.name)){
				continue;
			}
			var	tenant			= {};
			tenant.name			= response.body.items[pos].metadata.name;
			tenant.id			= response.body.items[pos].metadata.uid;
			tenant.description	= response.body.items[pos].metadata.name;
			tenant.display		= response.body.items[pos].metadata.name;
			resarr.push(tenant);
		}

		if(0 === resarr.length){
			error = new Error('no tenant exists');
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		_callback(null, resarr);

	}).catch (function(error) {
		r3logger.elog(error.message);
		_callback(error, null);
	});
	return;
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// uname:	username
// passwd:	passwd
//
exports.getUserUnscopedToken = function(uname, passwd, callback)	// eslint-disable-line no-unused-vars
{
	var	error = new Error('getUserUnscopedToken is not implemented');
	r3logger.elog(error.message);
	callback(error, null);
};

//
// Get Unscoped Token
//
// token:	OIDC token
//
exports.getUserUnscopedTokenByToken = function(token, callback)
{
	return rawGetUserUnscopedTokenK8s(token, callback);
};

//
// Get Scoped Token
//
// tenantid: not used
//
exports.getUserScopedToken = function(unscopedtoken, tenantname, tenantid, callback)	// eslint-disable-line no-unused-vars
{
	return rawGetUserScopedTokenK8s(unscopedtoken, tenantname, callback);
};

//
// Verify publisher type in seed
//
exports.verifyUserTokenPublisher = function(token_seed)
{
	return rawWrapVerifyUserTokenPublisherForK8s(token_seed);
};

//
// Verify token
//
exports.verifyUserToken = function(user, tenant, token, token_seed)
{
	return rawVerifyUserTokenByK8sUser(null, user, tenant, token, token_seed);
};

//
// Get tenant list
//
exports.getUserTenantList = function(unscopedtoken, userid, callback)	// eslint-disable-line no-unused-vars
{
	return rawGetUserTenantListK8s(unscopedtoken, callback);
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
