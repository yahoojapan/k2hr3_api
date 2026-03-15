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

import	apiutil		from './k2hr3apiutil';
import	k2hr3		from './k2hr3dkc';
import	r3logger	from './dbglogging';
import	* as fs		from 'fs';
import	* as https	from 'https';

import	{ getK2hr3Keys }			from './k2hr3keys';
import	{ KubeConfig, CoreV1Api }	from '@kubernetes/client-node';

import type	{ IncomingMessage  }	from 'http';
import type	{ V1NamespaceList }		from '@kubernetes/client-node';
import type	{ JWTPayload }			from 'jose';
import type	{ K2hdkc }				from 'k2hdkc';
import type	{ valTypeAllObject, valTypeTokenSeed, resTypeBaseResult, valTypeOsapiTenantInfoList, valTypeOsapiTenantInfo, Osapi }	from './types';
import type	{ valTypeJwtParam, resTypeUserToken, resTypeCreateUserToken, resTypeUserTenantInfo, cbTypeGetUserScopedToken, cbTypeGetUserUnscopedToken, cbTypeGetUserTenantList }	from './k2hr3tokens';

import	{ base64url, jwtVerify, createRemoteJWKSet }	from 'jose';
const	{ decode }			= base64url;

import	{ r3ApiConfig }		from './k2hr3config';
const	apiConf				= new r3ApiConfig();

//---------------------------------------------------------
// Variables and Initializer
//---------------------------------------------------------
//
// Const Variables
//
const	K8S_PUBLISHER_NAME			= 'K8SOIDC';
const	K8S_REGION_NAME				= 'K8sCluster';
const	OIDC_JWKS_URI_KEYNAME		= 'jwks_uri';

//
// Global variables from configuration file
//
let	oidc_audience: string | null		= null;
let	oidc_issuer: string | null			= null;
let	oidc_username: string | null		= null;
let	k8s_api_url: string | null			= null;
let	k8s_ca_cert: string | null			= null;
let	k2hr3_k8s_sa_token: string | null	= null;
let	unscopedtoken_exp: number			= 0;	// Expire limit for unscoped Token created from oidc(default is 0 means as same as oidc limit)

(() => {
	const	tmp_oidc_config	= apiConf.getOtherObject('k8soidc');
	if(apiutil.isPlainObject(tmp_oidc_config)){
		oidc_audience		= apiutil.isString(tmp_oidc_config.audience)	? tmp_oidc_config.audience		: null;
		oidc_issuer			= apiutil.isString(tmp_oidc_config.issuer)		? tmp_oidc_config.issuer		: null;
		oidc_username		= apiutil.isString(tmp_oidc_config.usernamekey)	? tmp_oidc_config.usernamekey	: null;
		k8s_api_url			= apiutil.isString(tmp_oidc_config.k8sapi_url)	? tmp_oidc_config.k8sapi_url	: null;
		k8s_ca_cert			= apiutil.isString(tmp_oidc_config.k8s_ca_path)	? tmp_oidc_config.k8s_ca_path	: null;

		try{
			k2hr3_k8s_sa_token	= fs.readFileSync(apiutil.getSafeString(tmp_oidc_config.k8s_sa_token), 'utf8');
		}catch{
			k2hr3_k8s_sa_token	= null;
		}

		// unscopedtoken_exp must be number
		if(apiutil.isSafeNumber(tmp_oidc_config.unscopedtoken_exp) && 0 < tmp_oidc_config.unscopedtoken_exp){
			unscopedtoken_exp = tmp_oidc_config.unscopedtoken_exp;
		}
	}
})();

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
const rawCreateUserTokenByK8sUser = (
	user:			string | null,
	user_id:		string | null,
	tenant:			string | null,
	expire_limit?:	number | null
): resTypeCreateUserToken => {

	const	resobj: resTypeCreateUserToken = {result: true, message: null};

	if(!apiutil.isSafeString(user)){														// allow another parameter is null
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}
	const	_user = user.toLowerCase();

	if(!apiutil.isString(user_id) || !apiutil.isSafeStrUuid4(user_id)){						// user_id is uuid4
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : user_id(must be uuid4)=' + JSON.stringify(user_id);
		r3logger.elog(resobj.message);
		return resobj;
	}
	const	_user_id = user_id;

	let	_tenant: string | null = null;
	if(apiutil.isSafeString(tenant)){
		_tenant = tenant;
	}

	let	_expire_limit = 24 * 60 * 60;														// default 24H
	if(0 < unscopedtoken_exp){
		_expire_limit = unscopedtoken_exp;													// override expire limit by config
	}else{
		if(apiutil.isSafeNumber(expire_limit) && 0 < expire_limit){
			_expire_limit = expire_limit;
		}
	}

	const	dkcobj		= k2hr3.getK2hdkc(true, false);										// use permanent object(need to clean)
	const	keys		= getK2hr3Keys(_user, null);
	if(!apiutil.isSafeEntity(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	user_id_uuid4	= _user_id;														// user id must be UUID4
	const	user_ex_id		= apiutil.getStrUuid4();										// set seed(uuid4)

	// make token seed value
	const	now_unixtime	= apiutil.getUnixtime();

	// user token and yrn key
	let		user_token		= '';
	let		user_token_base	= '';

	// create key
	for(let is_loop = true; is_loop; ){
		// make user token
		const	token_elements	= apiutil.makeStringToken256(user_ex_id, user_id_uuid4);
		if(!apiutil.isSafeEntity(token_elements)){
			resobj.result	= false;
			resobj.message	= 'could not make token from ' + JSON.stringify(user_ex_id) + ' and ' + JSON.stringify(_user_id);
			r3logger.elog(resobj.message);
			dkcobj.clean();
			return resobj;
		}
		user_token			= token_elements.str_token;
		user_token_base		= token_elements.str_base;										// token base

		// user token key
		const token_user_key = keys.TOKEN_USER_TOP_KEY + '/' + user_token;					// "yrn:yahoo::::token:user/<user token>"

		// get user token for existing check
		const	value		= dkcobj.getValue(token_user_key, null, true, null);
		if(!apiutil.isSafeEntity(value)){
			// succeed uniq token
			break;
		}
		r3logger.dlog('conflict user token(' + user_token + ') which already is used, so remake token for uniq.');
	}

	const	token_seed: valTypeTokenSeed = {
		publisher:	K8S_PUBLISHER_NAME,			// "K8SOIDC"
		userexid:	user_ex_id,					// seed(uuid4)
		date:		(new Date(now_unixtime * 1000)).toISOString(),						// now date(UTC ISO 8601)
		expire:		(new Date((now_unixtime + _expire_limit) * 1000)).toISOString(),	// expire date(UTC ISO 8601)
		creator:	keys.USER_KEY,				// "yrn:yahoo::::user:<user>"
		base:		user_token_base,			// token bease
		user:		_user,						// user(creator)
		ip:			null,						// ip(creator)
		hostname:	null,						// hostname(creator)
		port:		0,							// port(creator)
		cuk:		null,						// cuk(creator)
		extra:		null,						// extra(creator)
		tenant:		_tenant						// tenant(if scope, not null)
	};

	// Add user token/expire/seed into result object.
	resobj.token		= user_token;
	resobj.expire_at	= token_seed.expire;
	resobj.token_seed	= JSON.stringify(token_seed);
	resobj.userid		= _user_id;

	dkcobj.clean();
	return resobj;
};

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
const rawWrapVerifyUserTokenPublisherForK8s = (token_seed: string | null): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	// parse seed
	if(!apiutil.checkSimpleJSON(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	tmpseed = apiutil.parseJSON(token_seed);
	if(!apiutil.isValTypeTokenSeed(tmpseed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	seed: valTypeTokenSeed = tmpseed;
	if(	!apiutil.isSafeString(seed.publisher)	||
		(seed.publisher != K8S_PUBLISHER_NAME)	)		// publisher must be 'K8SOIDC'
	{
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
};

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
const rawVerifyUserTokenByK8sUser = (
	dkcobj_permanent:	K2hdkc | null,
	user:				string | null,
	tenant:				string | null,
	token:				string | null,
	token_seed:			string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(token) || !apiutil.isSafeString(token_seed) || !apiutil.isSafeString(user)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : token=' + JSON.stringify(token) + ', token_seed=<not printable>, user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}

	// parse seed
	if(!apiutil.checkSimpleJSON(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	tmpseed = apiutil.parseJSON(token_seed);
	if(!apiutil.isValTypeTokenSeed(tmpseed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// check all seed values
	const	seed: valTypeTokenSeed = tmpseed;
	if(	!apiutil.isSafeString(seed.publisher)	||
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
		resobj.message	= 'token is expired by expire date(' + JSON.stringify(seed.expire) + ') in token_seed.';
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
	const	keys	= getK2hr3Keys(seed.user, seed.tenant);
	let		dkcobj	= dkcobj_permanent;
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
	const	userid	= dkcobj.getValue(keys.USER_ID_KEY, null, true, null);					// get user id from "yrn:yahoo::::user:<user>:id"
	if(!apiutil.isSafeString(userid)){
		resobj.result	= false;
		resobj.message	= 'could not get user id for user(' + seed.user + ').';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// make verify token
	const	token_elements	= apiutil.makeStringToken256(seed.userexid, userid, seed.base);
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
};

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
const rawGetUserTenantInfoByUserToken = (token: string | null): resTypeUserTenantInfo => {

	const	resobj: resTypeUserTenantInfo = {result: true, message: null};

	if(!apiutil.isSafeString(token)){
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : token=' + JSON.stringify(token);
		r3logger.elog(resobj.message);
		return resobj;
	}

	const	dkcobj		= k2hr3.getK2hdkc(true, false);											// use permanent object(need to clean)
	let		keys		= getK2hr3Keys();
	if(!apiutil.isSafeEntity(dkcobj)){
		resobj.result	= false;
		resobj.message	= 'Not initialize yet.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// get token key under user key
	const	token_value_key	= keys.TOKEN_USER_TOP_KEY + '/' + token;							// "yrn:yahoo::::token:user/<token>"
	const	user_token_key	= dkcobj.getValue(token_value_key, null, true, null);				// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
	if(!apiutil.isSafeString(user_token_key)){
		resobj.result	= false;
		resobj.message	= 'token key(' + token_value_key + ') for token(' + token + ') is not existed.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// get user name and tenant name from token key yrn path
	const	pattern		= new RegExp('^' + keys.MATCH_ANY_USER_TOKEN);							// regex = /^yrn:yahoo::::user:(.*):tenant\/(.*)\/token\/(.*)/
	const	matches		= user_token_key.match(pattern);										// reverse to user/tenant names
	if(!apiutil.isNotEmptyArray(matches) || matches.length < 4 || '' === apiutil.getSafeString(matches[1])){
		resobj.result	= false;
		resobj.message	= 'token key(' + token_value_key + ') for token(' + token + ') has wrong format value(' + user_token_key + ')';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	const	token_user					= apiutil.getSafeString(matches[1]);
	const	token_tenant: string | null	= apiutil.isString(matches[2]) ? matches[2] : null;

	// get token seed
	const	user_token_seed_key = user_token_key + '/' + keys.SEED_KW;							// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed"
	const	token_seed			= dkcobj.getValue(user_token_seed_key, null, true, null);
	if(!apiutil.isSafeString(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token key(' + token_value_key + ') for token(' + token + ') does not have token seed data.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// verify token
	const	vres = rawVerifyUserTokenByK8sUser(dkcobj, token_user, token_tenant, token, token_seed);
	if(!vres.result){
		resobj.result	= false;
		resobj.message	= 'failed to verify token(' + token + ') with seed by ' + vres.message;
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}

	// get user id
	keys			= getK2hr3Keys(token_user, null);											// remake keys
	const	userid	= dkcobj.getValue(keys.USER_ID_KEY, null, true, null);						// get user id from "yrn:yahoo::::user:<user>:id"
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
};

//---------------------------------------------------------
// Verify (Un)scoped Token
//---------------------------------------------------------
// 
// token			:	unscoped/scoped token
//
const rawVerifyUnscopedToken = (token: string | null): boolean => {

	if(!apiutil.isSafeString(token)){
		r3logger.elog('token(' + JSON.stringify(token) + ') parameter is wrong.');
		return false;
	}

	const	dkcobj	= k2hr3.getK2hdkc(true, false);											// use permanent object(need to clean)
	const	keys	= getK2hr3Keys();
	if(!apiutil.isSafeEntity(dkcobj)){
		r3logger.elog('K2hdkc client is not initialized yet.');
		return false;
	}

	// get token key under user key
	const	token_value_key	= keys.TOKEN_USER_TOP_KEY + '/' + token;						// "yrn:yahoo::::token:user/<token>"
	const	user_token_key	= dkcobj.getValue(token_value_key, null, true, null);			// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>"
	if(!apiutil.isSafeString(user_token_key)){
		r3logger.elog('token key(' + token_value_key + ') for token(' + token + ') is not existed.');
		dkcobj.clean();
		return false;
	}

	// get user name and tenant name from token key yrn path
	const	pattern		= new RegExp('^' + keys.MATCH_ANY_USER_TOKEN);						// regex = /^yrn:yahoo::::user:(.*):tenant\/(.*)\/token\/(.*)/
	const	matches		= user_token_key.match(pattern);									// reverse to user/tenant names
	if(!apiutil.isNotEmptyArray(matches) || matches.length < 4 || '' === apiutil.getSafeString(matches[1])){
		r3logger.elog('token key(' + token_value_key + ') for token(' + token + ') has wrong format value(' + user_token_key + ')');
		dkcobj.clean();
		return false;
	}
	const	token_user					= apiutil.getSafeString(matches[1]);
	let		token_tenant: string | null	= apiutil.getSafeString(matches[2]);
	if('' === token_tenant){
		token_tenant= null;
	}

	// get token seed
	const	user_token_seed_key = user_token_key + '/' + keys.SEED_KW;							// "yrn:yahoo::::user:<user>:tenant/{<tenant>}/token/<token>/seed"
	const	token_seed			= dkcobj.getValue(user_token_seed_key, null, true, null);
	if(!apiutil.isSafeString(token_seed)){
		r3logger.elog('token key(' + token_value_key + ') for token(' + token + ') does not have token seed data.');
		dkcobj.clean();
		return false;
	}

	// verify token
	const	vres = rawVerifyUserTokenByK8sUser(dkcobj, token_user, token_tenant, token, token_seed);
	if(!vres.result){
		r3logger.elog('failed to verify token(' + token + ') with seed by ' + vres.message);
		dkcobj.clean();
		return false;
	}
	dkcobj.clean();
	return true;
};

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
const rawGetUserScopedTokenK8s = (
	token:		string | null,
	tenant:		string | null,
	callback:	cbTypeGetUserScopedToken
): void => {

	if(!apiutil.isSafeString(token) || !apiutil.isSafeString(tenant)){
		const error = new Error('some parameters are wrong : token=' + JSON.stringify(token) + ', tenant=' + JSON.stringify(tenant));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// verify and get user/tenant information
	const	token_info = rawGetUserTenantInfoByUserToken(token);
	if(!token_info.result){
		const error = new Error('could not get any information from token(' + token + '), result : ' + token_info.message);
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// check tenant name
	if(apiutil.isSafeString(token_info.tenant) && token_info.tenant !== tenant){
		const error = new Error('token(' + token + ') has scoped(' + token_info.tenant + '), but it is not as same as the request tenant(' + tenant + ').');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// create scoped token
	const	resobj = rawCreateUserTokenByK8sUser(apiutil.getSafeString(token_info.user), apiutil.getSafeString(token_info.userid), tenant);	// not specify expire limit now(using default).
	if(!resobj.result){
		const error = new Error('could not create user scoped token for uname(' + token_info.user + ')/user id(' + token_info.userid + ') for tenant(' + tenant + ').');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// make result
	const result: resTypeUserToken = {
		user:		apiutil.getSafeString(token_info.user),
		userid:		apiutil.getSafeString(token_info.userid),
		scoped:		true,
		token:		apiutil.getSafeString(resobj.token),
		expire:		apiutil.isString(resobj.expire_at) ? resobj.expire_at : null,
		region:		K8S_REGION_NAME,
		token_seed:	apiutil.getSafeString(resobj.token_seed),
	};

	callback(null, result);
};

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
const rawVerifyTokenAndGetUsername = async (token: string): Promise<string | null> => {

	const jwtParam: valTypeJwtParam = {
		issuer:		oidc_issuer ?? undefined,
		audience:	oidc_audience ?? undefined
	};

	const myPromise = (issuer_url: string, conf_key: string): Promise<string> => {
		return new Promise((resolve, reject) => {
			https.get(issuer_url + '/.well-known/openid-configuration', (res: IncomingMessage): void => {
				if(res.statusCode !== 200){
					res.resume();
					reject('statusCode should be 200, not ' + String(res.statusCode));
				}
				res.setEncoding('utf8');

				let rawData = '';
				res.on('data', (chunk: Buffer): void => {
					rawData += chunk;
				});

				res.on('end', (): void => {
					const parsedData = apiutil.parseJSON(rawData);
					if(apiutil.isPlainObject(parsedData) && apiutil.isString(parsedData[conf_key])){
						resolve(parsedData[conf_key]);
					}else{
						const	errorMsg = ('the ' + conf_key + ' key should exist, but no such a key');
						r3logger.elog(errorMsg);
						reject(errorMsg);
					}
				});

			}).on('error', (err: Error): void => {
				reject(err);
			});
		});
	};

	const asyncFunction = async (): Promise<string | null> => {
		let oidc_jwks_uri: string;
		try{
			oidc_jwks_uri = await myPromise(apiutil.getSafeString(oidc_issuer), OIDC_JWKS_URI_KEYNAME);
			if(!apiutil.isSafeString(oidc_jwks_uri)){
				const	error = new Error('oidc_jwks_uri should be defined, but no oidc_jwks_uri.');
				r3logger.elog(error.message);
				throw error;
			}
		}catch(err: unknown){
			if(err instanceof Error){
				r3logger.elog(err.message);
			}
			throw err;
		}

		const	JWKS = createRemoteJWKSet(new URL(oidc_jwks_uri));
		let		payload: JWTPayload | null;
		try{
			const	jwtResult	= await jwtVerify(token, JWKS, jwtParam);
			payload				= jwtResult.payload;
		}catch(err: unknown){
			if(err instanceof Error){
				r3logger.elog(err.message);
			}
			throw err;
		}

		let		userName: string | null = null;
		if(apiutil.isPlainObject(payload) && apiutil.isSafeString(oidc_username) && apiutil.isString(payload[oidc_username])){
			userName = apiutil.getSafeString(payload[oidc_username]);
		}else{
			if(apiutil.isPlainObject(payload) && apiutil.isSafeString(payload.sub)){
				userName = payload.sub;
			}
		}
		if(!apiutil.isSafeString(userName)){
			const error = new Error('failed to verify token for getting user name.');
			r3logger.elog(error.message);
			throw error;
		}
		return userName;
	};

	return asyncFunction();
};

const rawGetUserUnscopedTokenK8s = (
	token:		string | null,
	callback:	cbTypeGetUserUnscopedToken
): void => {

	if(!apiutil.isSafeString(token)){
		const error = new Error('oidc token parameter is not string or empty.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// Check the id_token.
	//
	//	see. https://openid.net/specs/openid-connect-core-1_0.html#IDToken
	//
	const	parts = token.split('.', 2);
	if(2 !== parts.length){
		const error = new Error('oidc token must have two parts, but it has ' + parts.length + ' parts.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// decode part[1] to payload
	//
	const	payload	= apiutil.parseJSON(new TextDecoder().decode(decode(parts[1])));
	if(!apiutil.isPlainObject(payload)){
		const error = new Error('could not decode json from the part[1] in oidc token.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// payload must have 'sub' key for user id
	//
	let		userid: string;
	if(apiutil.isSafeString(payload.sub)){
		userid = payload.sub;
	}else{
		const error = new Error('token payload should contain sub(userid), but not find sub(userid).');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// get user name from payload
	//
	let		username: string;
	if(apiutil.isSafeString(oidc_username)){
		if(apiutil.isSafeString(payload[oidc_username])){
			username = apiutil.getSafeString(payload[oidc_username]);
		}else{
			const error = new Error('token payload should contain user name(' + oidc_username + '), but not find it.');
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
	const	_callback		= callback;
	const	lower_username	= username.toLowerCase();							// to lower case
	rawVerifyTokenAndGetUsername(token).then((result: string | null): void => {

		const	verified_username = apiutil.getSafeString(result);

		//
		// compare user name
		//
		if(!apiutil.compareCaseString(lower_username, verified_username)){
			const error = new Error('oidc token has ' + lower_username + ' username, but verified username(' + verified_username + ') is different.');
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}

		// core seed
		const	user_id_uuid4	= apiutil.cvtNumberStringToUuid4(userid, 10);	// payload.sub is decimal string
		let		expire_limit: number;
		if(apiutil.isSafeNumber(payload['exp'])){
			expire_limit	= payload['exp'] - apiutil.getUnixtime();
			if(expire_limit <= 0){
				expire_limit= 24 * 60 * 60;										// default 24H
			}
		}else{
			expire_limit	= 24 * 60 * 60;										// default 24H
		}

		// create token
		const	resobj = rawCreateUserTokenByK8sUser(lower_username, user_id_uuid4, null, expire_limit);
		if(!resobj.result){
			const error = new Error('could not create user token for uname(' + lower_username + ') or something wrong result : ' + resobj.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}

		// make result
		const	resultobj: resTypeUserToken = {
			user:		lower_username,
			userid:		apiutil.getSafeString(resobj.userid),
			scoped:		false,
			token:		apiutil.getSafeString(resobj.token),
			expire:		apiutil.isSafeString(resobj.expire_at) ? resobj.expire_at : null,
			region:		K8S_REGION_NAME,
			token_seed:	apiutil.getSafeString(resobj.token_seed)
		};

		_callback(null, resultobj);

	}).catch((err: Error): void => {
		r3logger.elog(err.message);
		_callback(err, null);
	});
};

//---------------------------------------------------------
// Get tenant list by unscoped token
//---------------------------------------------------------
//
// Helper for checking type
//
type WithSetDefaultAuth = {
	setDefaultAuthentication: (arg: { applyToRequest: (opts: valTypeAllObject) => void }) => void;
};

const hasSetDefaultAuthentication = (obj: unknown): obj is WithSetDefaultAuth => {
	return apiutil.isPlainObject(obj) && apiutil.isFunction(obj.setDefaultAuthentication);
};

//
// unscopedtoken:	oidc token(Not use)
//
const rawGetUserTenantListK8s = (
	unscopedtoken:	string | null,
	callback:		cbTypeGetUserTenantList
): void => {

	if(!apiutil.isSafeString(unscopedtoken)){
		const error = new Error('unscopedtoken parameter is wrong.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// Verify unscoped token
	if(!rawVerifyUnscopedToken(unscopedtoken)){
		const error = new Error('unscopedtoken is not safe, varidation is failed.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	const	_callback	= callback;

	//
	// Get Namespaces by Service Access token
	//
	const	cluster = {
		name:			'k2hr3-api-k8soidc-cluster',
		server:			apiutil.getSafeString(k8s_api_url),
		caFile:			apiutil.getSafeString(k8s_ca_cert),
		skipTLSVerify:	false
	};
	const	user = {
		name:			'k2hr3-api-k8soidc-name',
		token:			apiutil.getSafeString(k2hr3_k8s_sa_token)					// [NOTE] k2hr3_k8s_sa_token is global variable
	};

	const	kubeconfig	= new KubeConfig();
	kubeconfig.loadFromClusterAndUser(cluster, user);

	const	k8sApi		= kubeconfig.makeApiClient(CoreV1Api);
	if(hasSetDefaultAuthentication(k8sApi)){
		k8sApi.setDefaultAuthentication({
			applyToRequest:	(opts: valTypeAllObject): void => {					// [NOTE] Make this an arrow function in the future.
				if(!apiutil.isPlainObject(opts.headers)){
					opts.headers			= {};
				}
				opts.headers.Authorization	= 'Bearer ' + k2hr3_k8s_sa_token;	// [NOTE] k2hr3_k8s_sa_token is global variable
				opts.rejectUnauthorized		= false;
			}
		});
	}else{
		const error = new Error('Not found CoreV1Api.setDefaultAuthentication function.');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	const	k8s_ns								= ['kube-node-lease', 'kube-public', 'kube-system', 'kubernetes-dashboard'];
	const	resarr: valTypeOsapiTenantInfoList	= [];
	k8sApi.listNamespace().then((response: V1NamespaceList) => {			// [NOTE] Using Promise
		if(apiutil.isPlainObject(response) && apiutil.isPlainObject(response.body) && apiutil.isArray(response.body.items)){
			for(let pos = 0; pos < response.body.items.length; ++pos){
				// check body...items
				const	tmpItem = response.body.items[pos];
				if(	!apiutil.isPlainObject(tmpItem)				||
					!apiutil.isPlainObject(tmpItem.metadata)	||
					!apiutil.isSafeString(tmpItem.metadata.name))
				{
					r3logger.wlog('one of response for project(tenant) list is something wrong : ' + JSON.stringify(response.body));
					continue;
				}

				// Is the k8s cluster namespace in kubernetes system namespaces?
				if(apiutil.findStringInArray(k8s_ns, tmpItem.metadata.name)){
					continue;
				}

				const	tenant: valTypeOsapiTenantInfo = {
					name:			tmpItem.metadata.name,
					id:				apiutil.getSafeString(tmpItem.metadata.uid),
					description:	tmpItem.metadata.name,
					display:		tmpItem.metadata.name
				};
				resarr.push(tenant);
			}
		}

		if(0 === resarr.length){
			const error = new Error('no tenant exists');
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		_callback(null, resarr);

	}).catch((error: Error): void => {
		r3logger.elog(error.message);
		_callback(error, null);
	});
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export const k8soidc: Osapi = {
	//
	// uname:	username
	// passwd:	passwd
	//
	getUserUnscopedToken:
		(uname: string | null, passwd: string | null, callback: cbTypeGetUserUnscopedToken): void => {
			const	error = new Error('getUserUnscopedToken is not implemented');
			r3logger.elog(error.message);
			callback(error, null);
		},

	//
	// Get Unscoped Token
	//
	// token:	OIDC token
	//
	getUserUnscopedTokenByToken:	rawGetUserUnscopedTokenK8s,

	//
	// Get Scoped Token
	//
	// tenantid: not used
	//
	getUserScopedToken:				rawGetUserScopedTokenK8s,

	//
	// Verify publisher type in seed
	//
	verifyUserTokenPublisher:		rawWrapVerifyUserTokenPublisherForK8s,

	//
	// Verify token
	//
	verifyUserToken:
		(dkcobj_permanent: K2hdkc | null, user: string | null, tenant: string | null, token: string | null, token_seed: string | null): resTypeBaseResult => {
			return rawVerifyUserTokenByK8sUser(dkcobj_permanent, user, tenant, token, token_seed);
		},

	//
	// Get tenant list
	//
	getUserTenantList:
		(unscopedtoken:	string | null, userid: string | null, callback: cbTypeGetUserTenantList): void => {
			rawGetUserTenantListK8s(unscopedtoken, callback);
		}
};

//
// Default
//
export default k8soidc;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
