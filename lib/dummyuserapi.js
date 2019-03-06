/*
 * K2HR3 REST API
 *
 * Copyright 2017 Yahoo! Japan Corporation.
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
//							userexid:	"user extra id(user generated extra id)"
//							date:		"UTC time at create"
//							expire:		"UTC time at expire"
//							creator:	"User full yrn"
//							base:		"generated 64bit random binary"
//							user:		"user name"
//							ip:			always null
//							hostname:	always null
//							port:		always 0
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
//						userid:		(if need_userid is true, this value is set userid)
// 					}
// 
// [NOTE]
// user token seed value is following
// 					{
//						userexid:	"user extra id(user generated extra id)"
//						date:		"UTC ISO 8601 time at create"
//						expire:		"UTC ISO 8601 time at expire"
//						creator:	"User full yrn"
//						base:		"generated 64bit random binary"
//						user:		"user name"
//						ip:			always null
//						hostname:	always null
//						port:		always 0
//						tenant:		if scoped token, this is "tenant name". if not, this is null
//						verify:		"random 64bit id for verify token"
//					}
// 
function rawCreateUserTokenByDummyUser(user, tenant, need_userid)
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
	if(!apiutil.isSafeEntity(need_userid) || 'boolean' !== typeof need_userid){
		need_userid = false;
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

	// convert user id to 64 bit binary array
	var	userid			= String(apiutil.getUnixtime());									// Dummy user id(= unix time)
	var	user_ex_id		= apiutil.convertStringToBin64(userid);
	if(apiutil.isEmptyArray(user_ex_id) || 4 !== user_ex_id.length){
		resobj.result	= false;
		resobj.message	= 'Failed to convert user id for user(' + user + ') to 64bit binary array.';
		r3logger.elog(resobj.message);
		dkcobj.clean();
		return resobj;
	}
	var	hibit_user_ex = apiutil.getRandomBin64();											// random value for higher 32bit value
	user_ex_id[0] = hibit_user_ex[0];														// over write
	user_ex_id[1] = hibit_user_ex[1];

	// make token seed value
	var	expire_limit	= 24 * 60 * 60;														// default 24H expire for dummy user
	var	now_unixtime	= apiutil.getUnixtime();
	var	token_seed		= {};
	token_seed.userexid	= user_ex_id;														// user extra id based dummy user id
	token_seed.date		= (new Date(now_unixtime * 1000)).toISOString();					// now date(UTC ISO 8601)
	token_seed.expire	= (new Date((now_unixtime + expire_limit) * 1000)).toISOString();	// expire date(UTC ISO 8601)
	token_seed.creator	= keys.USER_KEY;													// "yrn:yahoo::::user:<user>"
	token_seed.base		= apiutil.getRandomBin64();											// base id(random)
	token_seed.user		= user;																// user(creator)
	token_seed.hostname= null;																// hostname(creator)
	token_seed.ip		= null;																// ip(creator)
	token_seed.port		= 0;																// port(creator)
	token_seed.tenant	= tenant;															// tenant(if scope, not null)

	// user token and yrn key
	var	user_token		= '';
	var	token_user_key	= null;

	// create key
	for(var is_loop = true; is_loop; ){														// for eslint
		// set verify value
		token_seed.verify	= apiutil.getRandomBin64();										// random value

		// make user token
		var	hiBinToken		= apiutil.makeXorValue(token_seed.base, token_seed.verify);
		var	lowBinToken		= apiutil.makeXorValue(token_seed.userexid, token_seed.verify);
		user_token			= apiutil.convertBin64ToHexString(hiBinToken);
		user_token			+= apiutil.convertBin64ToHexString(lowBinToken);

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
	if(need_userid){
		resobj.userid	= userid;
	}

	dkcobj.clean();
	return resobj;
}

//---------------------------------------------------------
// Verify User Token From dummy user
//---------------------------------------------------------
// 
// user			:	target user name for token
// tenant		:	target tenant name for token(if token is scoped)
// token		:	check token
// token_seed	:	token seed data
//
// result		:	{
//						result:		true/false
//						message:	null or error message string
// 					}
// 
function rawVerifyUserTokenByDummyUser(user, tenant, token, token_seed)
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
	if(	!apiutil.isSafeEntity(seed)			||
		apiutil.isEmptyArray(seed.userexid)	||
		4 !== seed.userexid.length			||
		!apiutil.isSafeString(seed.date)	||
		!apiutil.isSafeString(seed.expire)	||
		!apiutil.isSafeString(seed.creator)	||
		apiutil.isEmptyArray(seed.base)		||
		4 !== seed.base.length				||
		!apiutil.isSafeString(seed.user)	||
		!apiutil.compareCaseString(seed.user, user)	||
		apiutil.isEmptyArray(seed.verify)	||
		4 !== seed.verify.length			)
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

	// calculate token
	var	hiBinToken		= apiutil.makeXorValue(seed.base, seed.verify);
	var	lowBinToken		= apiutil.makeXorValue(seed.userexid, seed.verify);
	var	cal_token		= apiutil.convertBin64ToHexString(hiBinToken);
	cal_token			+= apiutil.convertBin64ToHexString(lowBinToken);

	// verify
	if(token !== cal_token){
		resobj.result	= false;
		resobj.message	= 'token(' + token + ') and token_seed(not printable) are not matched.';
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
	var	vres = rawVerifyUserTokenByDummyUser(token_user, token_tenant, token, token_seed);
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
	if(!apiutil.isSafeStrings(userid)){
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
	var	resobj = rawCreateUserTokenByDummyUser(uname, null, true);				// not specify expire limit now(using default).
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
	var	resobj = rawCreateUserTokenByDummyUser(token_info.user, tenant, false);					// not specify expire limit now(using default).
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

exports.verifyUserToken = function(user, tenant, token, token_seed)
{
	return rawVerifyUserTokenByDummyUser(user, tenant, token, token_seed);
};

//
// userid		: not used
//
exports.getUserTenantList = function(unscopedtoken, userid, callback)
{
	return rawGetUserTenantListDummy(unscopedtoken, callback);
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
