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
 * AUTHOR:   Takeshi Nakatani
 * CREATE:   Mon Dec 25 2017
 * REVISION:
 *
 */

'use strict';

var	apiutil		= require('./k2hr3apiutil');
var	k2hr3		= require('./k2hr3dkc');
var	r3keys		= require('./k2hr3keys').getK2hr3Keys;

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Dummy endpoint and etc
//
const dummy_region_name		= 'dummy_endpoint';
const dummy_endpoint_url	= 'https://dummyep.k2hr3api.yahoo.co.jp/';

//
// Endpoint for user's server group(tenant) information for dummy
//
var	dummy_ep 	= null;
var dummyapi_ep = function()
{
	if(apiutil.isSafeEntity(dummy_ep)){
		return dummy_ep;
	}
	var	keys	= r3keys();
	var	res_ep	= k2hr3.getKeystoneEndpoint(dummy_region_name);
	if(	res_ep.result														&&
		apiutil.isSafeEntity(res_ep.keystones)								&&
		apiutil.isSafeEntity(res_ep.keystones[dummy_region_name])			&&
		apiutil.isSafeString(res_ep.keystones[dummy_region_name].url)		&&
		apiutil.isSafeString(res_ep.keystones[dummy_region_name].type)		&&
		keys.VALUE_KEYSTONE_SUB === res_ep.keystones[dummy_region_name].type)
	{
		// already has endpoint
		dummy_ep		= apiutil.urlParse(res_ep.keystones[dummy_region_name].url);
		dummy_ep.region	= dummy_region_name;
	}else{
		// not register yet, then register it.
		res_ep	= k2hr3.setKeystoneEndpointAll(dummy_region_name, dummy_endpoint_url, keys.VALUE_KEYSTONE_SUB, 0);
		if(res_ep.result){
			// succeed, retry to get
			res_ep = k2hr3.getKeystoneEndpoint(dummy_region_name);
			if(	res_ep.result														&&
				apiutil.isSafeEntity(res_ep.keystones)								&&
				apiutil.isSafeEntity(res_ep.keystones[dummy_region_name])			&&
				apiutil.isSafeString(res_ep.keystones[dummy_region_name].url)		&&
				apiutil.isSafeString(res_ep.keystones[dummy_region_name].type)		&&
				keys.VALUE_KEYSTONE_SUB === res_ep.keystones[dummy_region_name].type)
			{
				dummy_ep		= apiutil.urlParse(res_ep.keystones[dummy_region_name].url);
				dummy_ep.region	= dummy_region_name;
			}else{
				// failed to re-get
				r3logger.elog('could not set and re-get dummy endpoint into k2hdkc, then build endpoint url object in local. but create it locally.');
				dummy_ep		= apiutil.urlParse(dummy_endpoint_url);
				dummy_ep.region	= dummy_region_name;
			}
		}else{
			// failed to set
			r3logger.elog('could not set dummy endpoint into k2hdkc, then build endpoint url object in local. but create it locally.');
			dummy_ep		= apiutil.urlParse(dummy_endpoint_url);
			dummy_ep.region	= dummy_region_name;
		}
	}
	// for debug
	r3logger.dlog('dummy get group information for user : end point = ' + JSON.stringify(dummy_ep));

	return dummy_ep;
};

//---------------------------------------------------------
// [User Token for case of dummy]
//---------------------------------------------------------
//
// Token:				Token Id(################)
// X-Auth-Token:		U=Token Id
// Token Id:			The "Token Id" is a unique hex number string for 128bit.
//						"Token Id" = "(<base id(64bit:8byte)> ^ <crypt id(64bit:8byte)>)" + "(<userex id(64bit:8byte)> ^ <crypt id(64bit:8byte)>)"
// User Token Key:		"yrn:yahoo::::token:user/<Token Id>"
// User Token Seed:		{
//							publisher:	"DUMMYUSERAPI"
//							userexid:	"user extra id(user generated extra id)"
//							date:		"UTC time at create"
//							expire:		"UTC time at expire"
//							creator:	"User full yrn"
//							base:		"generated 64bit random binary"
//							user:		"user name"
//							ip:			always null
//							hostname:	always null
//							port:		always 0
//							cuk:		always null
//							extra:		always null
//							tenant:		if scoped token, this is "tenant name". if not, this is null
//							verify:		"random 64bit id for verify token"
//						}
//
// [NOTE]
// "user id from dummy" which is in "Token Id" is included from dummy user.
// This Seed value is secret, any API could not get this value directly.
//
// Keys in K2hdkc has the following relationship. "seed" is special key/value for dummy and like it.
//	Token key:				"yrn:yahoo::::token:user/<token>"
//								value	=> "yrn:yahoo::::user:dummy:tenant/{<tenant>}/token/<token>"
//	User token key:			"yrn:yahoo::::user:dummy:tenant/{<tenant>}/token/<token>"
//								value	=> "region name"
//								subkeys	=> "yrn:yahoo::::user:dummy:tenant/{<tenant>}/token/<token>/seed"
//	User token seed key:	"yrn:yahoo::::user:dummy:tenant/{<tenant>}/token/<token>/seed"
//								value	=> JSON seed information(token value)
//

//---------------------------------------------------------
// Create User Token For dummy user
//---------------------------------------------------------
// user			:	user name which is allowed any name
// result		:	{
//						result:		true/false
//						message:	null or error message string
//						token:		undefined(error) or user token string
//						expire_at:	expire date(UTC ISO 8601)
//						token_seed:	JSON token seed data
//						userid:		set userid
// 					}
// 
// [NOTE]
// user token seed value is following
// 					{
//						publisher:	"DUMMYUSERAPI"
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
function rawCreateUserTokenByDummyUser(user, tenant)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(user)){														// allow another parameter is null
		resobj.result	= false;
		resobj.message	= 'parameter is wrong : user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}
	if(!apiutil.isSafeString(tenant)){
		tenant = null;
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

	// check user id exists.
	var	userid = dkcobj.getValue(keys.USER_ID_KEY, null, true, null);						// yrn:yahoo::::user:<user>:id
	if(!apiutil.isSafeString(userid)){
		// make dummy user id
		userid = apiutil.getStrUuid4();														// Dummy user id(uuid4)
	}

	// user seed id(generated every time)
	var	user_ex_id	= apiutil.getStrUuid4();												// seed(uuid4)

	// make token seed value
	var	expire_limit	= 24 * 60 * 60;														// default 24H expire for dummy user
	var	now_unixtime	= apiutil.getUnixtime();
	var	token_seed		= {};
	token_seed.publisher= 'DUMMYUSERAPI';													// "DUMMYUSERAPI"
	token_seed.userexid	= user_ex_id;														// seed(uuid4)
	token_seed.date		= (new Date(now_unixtime * 1000)).toISOString();					// now date(UTC ISO 8601)
	token_seed.expire	= (new Date((now_unixtime + expire_limit) * 1000)).toISOString();	// expire date(UTC ISO 8601)
	token_seed.creator	= keys.USER_KEY;													// "yrn:yahoo::::user:<user>"
	token_seed.user		= user;																// user(creator)
	token_seed.hostname= null;																// hostname(creator)
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
		var	token_elements	= apiutil.makeStringToken256(user_ex_id, userid);
		if(!apiutil.isSafeEntity(token_elements)){
			resobj.result	= false;
			resobj.message	= 'could not make token from ' + JSON.stringify(user_ex_id) + ' and ' + JSON.stringify(userid);
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
	resobj.userid		= userid;

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// Verify User Token Publisher For dummy user
//---------------------------------------------------------
// 
// token_seed		:	token seed data
//
// result			:	{
//							result:		true/false
//							message:	null or error message string
// 						}
// 
function rawVerifyUserTokenPublisherByDummyUser(token_seed)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeString(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}

	// parse seed
	var	seed = token_seed;
	if(apiutil.checkSimpleJSON(token_seed)){
		seed = JSON.parse(token_seed);
	}
	if(	!apiutil.isSafeEntity(seed)				||
		!apiutil.isSafeString(seed.publisher)	||
		(seed.publisher != 'DUMMYUSERAPI')		)		// publisher must be 'DUMMYUSERAPI'
	{
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
}

//---------------------------------------------------------
// Verify User Token From dummy user
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
function rawVerifyUserTokenByDummyUser(dkcobj_permanent, user, tenant, token, token_seed)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(token, token_seed, user)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : token=' + JSON.stringify(token) + ', token_seed=<not printable>, user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}

	// parse seed
	var	seed = token_seed;
	if(apiutil.checkSimpleJSON(token_seed)){
		seed = JSON.parse(token_seed);
	}

	if(	!apiutil.isSafeEntity(seed)				||
		!apiutil.isSafeString(seed.publisher)	||
		(seed.publisher != 'DUMMYUSERAPI')		||		// publisher must be 'DUMMYUSERAPI'
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
// Get User/Tenant information from User Token
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
function rawGetUserTenantInfoFromToken(token)
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
	var	vres = rawVerifyUserTokenByDummyUser(dkcobj, token_user, token_tenant, token, token_seed);
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
// Get Unscoped token by user name for dummy
//---------------------------------------------------------
//
// callback(error, result):
//				result = {
//					user:		user name
//					userid:		user id
//					scoped:		always false
//					token:		token string(id)
//					expire:		expire string(UTC ISO 8601)
//					region:		region string
//					token_seed:	JSON token seed data
//				}
//
function rawGetUserUnscopedTokenDummy(uname, callback)
{
	var	error;

	// [NOTE]
	// user name is allowed any
	//
	if(!apiutil.isSafeString(uname)){
		error = new Error('parameter is wrong : uname=' + JSON.stringify(uname));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	//
	// Create unscoped user token
	//
	var	resobj = rawCreateUserTokenByDummyUser(uname, null);					// not specify expire limit now(using default).
	if(!resobj.result){
		error = new Error('could not create user token for uname(' + uname + ') or something wrong result : ' + resobj.message);
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// make result
	var	result	= {};
	result.user			= uname;
	result.userid		= resobj.userid;
	result.scoped		= false;
	result.token		= resobj.token;
	result.expire		= resobj.expire_at;
	result.region		= dummyapi_ep().region;
	result.token_seed	= resobj.token_seed;

	callback(null, result);
}

//---------------------------------------------------------
// Get Scoped token by user name for dummy
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
function rawGetUserScopedTokenDummy(token, tenant, callback)
{
	var	error;

	if(!apiutil.isSafeStrings(token, tenant)){
		error = new Error('some parameters are wrong : token=' + JSON.stringify(token) + ', tenant=' + JSON.stringify(tenant));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}

	// verify and get user/tenant information
	var	token_info = rawGetUserTenantInfoFromToken(token);
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
	var	resobj = rawCreateUserTokenByDummyUser(token_info.user, tenant);						// not specify expire limit now(using default).
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
	result.region		= dummyapi_ep().region;
	result.token_seed	= resobj.token_seed;

	callback(null, result);
}

//
// Get tenant list from username(not used) for dummy
//
// callback(error, result):
//				result = [
//					{
//						name:			project(tenant) name						(*2 : string)
//						id:				project(tenant) id							(*2)
//						description:	project(tenant) description					(*4)
//						display:		display name								(*3)
//					},
//					...
//				]
// 
function rawGetUserTenantListDummyByUsername(username, callback)
{
	var	error;
	var	_username = username;
	var	_callback = callback;

	// [NOTE]
	// username is not used in this function, but check it.
	//
	if(!apiutil.isSafeString(_username)){
		error = new Error('parameter is wrong : username=' + JSON.stringify(_username));
		r3logger.elog(error.message);
		_callback(error, null);
		return;
	}

	//
	// returns static tenant list
	//
	var	dummyResult = [
		{
			name:			'tenant0',
			id:				'1000',
			description:	'dummy tenant no.0',
			display:		'dummy_tenant_0'
		},
		{
			name:			'tenant1',
			id:				'1001',
			description:	'dummy tenant no.1',
			display:		'dummy_tenant_1'
		},
		{
			name:			'tenant2',
			id:				'1002',
			description:	'dummy tenant no.2',
			display:		'dummy_tenant_2'
		},
		{
			name:			'tenant3',
			id:				'1003',
			description:	'dummy tenant no.3',
			display:		'dummy_tenant_3'
		},
		{
			name:			'tenant4',
			id:				'1004',
			description:	'dummy tenant no.4',
			display:		'dummy_tenant_4'
		}
	];

	_callback(null, dummyResult);
}

//
// Get tenant list from unscoped token for dummy
//
function rawGetUserTenantListDummy(unscopedtoken, callback)
{
	// get user/tenant information from token
	var	token_info = rawGetUserTenantInfoFromToken(unscopedtoken);
	if(!token_info.result){
		var	error = new Error('could not get any information from token(' + unscopedtoken + '), result : ' + token_info.message);
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	return rawGetUserTenantListDummyByUsername(token_info.user, callback);
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// passwd		: not used
//
exports.getUserUnscopedToken = function(uname, passwd, callback)
{
	return rawGetUserUnscopedTokenDummy(uname, callback);
};

//
// update token	: not implemented
//
exports.getUserUnscopedTokenByToken = function(token, callback)
{
	var	error = new Error('getUserUnscopedTokenByToken is not implemented');
	r3logger.elog(error.message);
	callback(error, null);
};

//
// tenantid		: not used
//
// [NOTE]
// This function is not asynchronous.
// And allowed unscopedtoken value is scoped token specially.
//
exports.getUserScopedToken = function(unscopedtoken, tenantname, tenantid, callback)
{
	return rawGetUserScopedTokenDummy(unscopedtoken, tenantname, callback);
};

//
// Verify seed publisher type
//
exports.verifyUserTokenPublisher = function(token_seed)
{
	return rawVerifyUserTokenPublisherByDummyUser(token_seed);
};

exports.verifyUserToken = function(user, tenant, token, token_seed)
{
	return rawVerifyUserTokenByDummyUser(null, user, tenant, token, token_seed);
};

//
// userid		: not used
//
exports.getUserTenantList = function(unscopedtoken, userid, callback)
{
	return rawGetUserTenantListDummy(unscopedtoken, callback);
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
