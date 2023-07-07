/*
 * K2HR3 REST API
 *
 * Copyright 2023 Yahoo Japan Corporation.
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
 * CREATE:   Mon Sep 3 2023
 * REVISION:
 *
 */

'use strict';

var express	= require('express');
var router	= express.Router();

var	r3token	= require('../lib/k2hr3tokens');
var	apiutil	= require('../lib/k2hr3apiutil');
var	resutil	= require('../lib/k2hr3resutil');
var	k2hr3	= require('../lib/k2hr3dkc');
var	r3keys	= require('../lib/k2hr3keys').getK2hr3Keys;

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//=========================================================
// CAUTION
//---------------------------------------------------------
// This note is common to the TENANT API.
//
// TENANT API requires User Unscoped Token or User Scoped
// Token.
// Note that even if a User Scoped Token is specified, that
// scoped Tenant will be ignored.
// To specify the tenant of each API, use URI path or parameter
// instead of Token.
// Specify the tenant only by the tenant name, not by the YRN
// full path.
//
//---------------------------------------------------------

//=========================================================
// Common Utility function
//=========================================================
//
// Utility for parsing common input parameters
//
// This function parse token(user or role or not have this) from HTTP request(req),
// and tenant name, etc.
//
// return	{
//				result: 						true/false
//				message:						null or error message
//				status_code:					status code(default 200)
//				parameters:	{
//								token_type:		null or 'user' or 'role'
//								token_str:		token string(if user token or role token)
//								token_info:		null or object(returned from checkToken)
//								user_name:		null or user name(if user token)
//								tenant_name:	null or tenant name in request uri path
//								keys:			k2hr3keys object
//							}
//			}
//
function rawParseBaseParamInRequest(req)
{
	var	result = {
		result:			true,
		message:		null,
		status_code:	200
	};
	var	parameters = {
		token_type:		null,
		token_str:		null,
		token_info:		null,
		token_tenant:	null,
		user_name:		null,
		tenant_name:	null,
		keys:			r3keys()										// temporary
	};

	//
	// check token for API mode
	//
	if(r3token.hasAuthTokenHeader(req)){
		var	token_result = r3token.checkToken(req, false, true);		// (un)scoped, user
		if(!token_result.result){
			result.result		= token_result.result;
			result.message		= token_result.message;
			result.status_code	= token_result.status;
			r3logger.elog(result.message);
			return result;
		}
		parameters.token_str	= token_result.token;
		parameters.token_type	= token_result.token_type;
		parameters.token_info	= token_result.token_info;
		parameters.user_name	= apiutil.getSafeString(parameters.token_info.user);
	}

	//
	// get tenant name from uri
	//
	var	requestptn	= new RegExp('^/v1/tenant/(.*)');					// regex = /^\/v1\/tenant\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		parameters.tenant_name = null;
	}else{
		// check tenant name
		if(0 !== reqmatchs[1].indexOf(parameters.keys.VALUE_PREFIX_LOCAL_TENANT)){
			// Not have prefix("local@")
			parameters.tenant_name = parameters.keys.VALUE_PREFIX_LOCAL_TENANT + reqmatchs[1];
			parameters.tenant_name = parameters.tenant_name.toLowerCase();
		}else{
			parameters.tenant_name = reqmatchs[1].toLowerCase();
		}
	}

	// keys
	parameters.keys = r3keys(parameters.user_name, parameters.tenant_name);

	// no error
	result.parameters = parameters;

	return result;
}

//
// Utility for Create/Update tenant for POST/PUT
//
//	is_create		: true/false
//	user_name		: add main user name for tenant
//	tenant_name		: tenant name
//	tenant_id		: tenant id
//	tenant_desc		: tenant description
//	tenant_display	: tenant display name
//	tenant_users	: other tenant user names
//
//	result			{
//						result:		true/false
//						message:	error message
//						rescode:	200/201/4xx/5xx
//					}
//
function rawCreateUpdateTenant(is_create, user_name, tenant_name, tenant_id, tenant_desc, tenant_display, tenant_users)
{
	var	result = {result: true, message: null, rescode: 200};
	var	resobj;

	if(is_create){
		//
		// Create tenant
		//
		resobj = k2hr3.findTenant(tenant_name);
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeEntity(resobj.result) && true === resobj.result){
			result.result	= false;
			result.message	= 'failed to create tenant by already tenant(' + tenant_name + ') existed';
			result.rescode	= 400;
			r3logger.elog(result.message);
			return result;
		}
		result.rescode = 201;								// 201: Created
	}else{
		//
		// Update tenant
		//
		resobj = k2hr3.findTenant(tenant_name, user_name, tenant_id);
		if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || false === resobj.result){
			result.result	= false;
			if(apiutil.isSafeEntity(resobj) && apiutil.isSafeString(resobj.message)){
				result.message	= 'failed to update tenant by ' + resobj.message;
			}else{
				result.message	= 'failed to update tenant by unknown reason';
			}
			result.rescode	= 400;
			r3logger.elog(result.message);
			return result;
		}
		result.rescode = 200;								// 200: OK
	}

	//
	// Create/Update tenant
	//
	resobj = k2hr3.initTenant(tenant_name, tenant_id, tenant_desc, tenant_display, user_name, tenant_users);
	if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || false === resobj.result){
		result.result	= false;
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeString(resobj.message)){
			result.message	= 'failed to create tenant by ' + resobj.message;
		}else{
			result.message	= 'failed to create tenant by unknown reason';
		}
		result.rescode	= 400;
		r3logger.elog(result.message);
		return result;
	}

	return result;
}

//=========================================================
// Router POST
//=========================================================
//
// Mountpath				: '/v1/tenant'
//
//---------------------------------------------------------
// [POST] No tenant path
//---------------------------------------------------------
// POST '/v1/tenant'		: create tenant version 1
// HEADER					: X-Auth-Token	= <User token>
// body						:	{
//									"tenant":	{
//										"name":			<tenant>				=>	key is "yrn:yahoo:::<tenant>"
//																					thix value type must be string.
//										"desc":			<description>			=>	value for "yrn:yahoo:::<tenant>:desc"
//																					thix value type must be string.
//										"display":		<display name>			=>	key is "yrn:yahoo:::<tenant>:display"
//																					thix value type must be string.
//										"users":		<user> or [user, ...]	=>	key is "yrn:yahoo::::user:<user>"
//																					specify adding user array which is yrn path as "yrn:yahoo::::user:<user>" or "user name"
//									}
//								}
//
// response status code		: 201 or 4xx/5xx
// response body			: 	{
//									result: 	true/false
//									message:	 messages
//								}
//
// Create a tenant as <K2HR3 cluster LOCAL> tenant.
//
// [NOTE]
// If the <K2HR3 cluster LOCAL> tenant already exists, this repsponses an error.
//
// Tenant names must start with "local@"(if not set it, this prefix adds automatically).
// Specify the user by YRN full path or user name.
// If the user indicated by <User Token> does not exist, it will be added.
// New tenant id is set automatically.
//
//---------------------------------------------------------
// [POST] With tenant path
//---------------------------------------------------------
// POST '/v1/tenant/tenant'	: update tenant version 1
// HEADER					: X-Auth-Token	= <User token>
// body						:	{
//									"tenant":	{
//										"id":			<id>					=>	key is "yrn:yahoo:::<tenant>:id"
//																					this value type must be string.
//										"desc":			<description>			=>	value for "yrn:yahoo:::<tenant>:desc"
//																					thix value type must be string.
//										"display":		<display name>			=>	key is "yrn:yahoo:::<tenant>:display"
//																					thix value type must be string.
//										"users":		<user> or [user, ...]	=>	key is "yrn:yahoo::::user:<user>"
//																					specify adding user array which is yrn path as "yrn:yahoo::::user:<user>" or "user name"
//									}
//								}
//
// response status code		: 200 or 4xx/5xx
// response body			: 	{
//									result: 	true/false
//									message:	 messages
//								}
//
// Update existed tenant as <K2HR3 cluster LOCAL> tenant.
//
// [NOTE]
// If the <K2HR3 cluster LOCAL> tenant does not exist, this repsponses an error.
// Tenant names must start with "local@"(if not set it, this prefix adds automatically for search).
// The <User Token> user must be included in the tenant's user list.
//
// Specify the user by YRN full path or user name.
// If the user indicated by <User Token> does not exist, it will be added.
//
router.post('/', function(req, res, next)					// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result = {result: true, message: null};

	if(	!apiutil.isSafeEntity(req)				||
		!apiutil.isSafeEntity(req.baseUrl)		||
		!apiutil.isSafeEntity(req.body)			||
		!apiutil.isSafeEntity(req.body.tenant)	)
	{
		result.result	= false;
		result.message	= 'POST body does not have tenant data';
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	var resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		result.result	= resobj.result;
		result.message	= resobj.message;
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status_code, result);
		return;
	}
	var	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== comparam.token_type){
		result.result	= false;
		result.message	= 'POST request tenant must specify <User Token>';
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	var	is_create		= true;
	var	tenant_name		= null;
	var	tenant_id		= null;
	var	tenant_desc		= null;
	var	tenant_display	= null;
	var	tenant_users	= null;

	if(!apiutil.isSafeString(comparam.tenant_name)){
		//
		// Create mode
		//
		is_create		= true;
		tenant_name		= apiutil.getSafeString(req.body.tenant.name).toLowerCase();
		tenant_id		= apiutil.getStrUuid4();										// Create new id here.

		if(!apiutil.isSafeString(tenant_name)){
			result.result	= false;
			result.message	= 'POST request tenant body does not have tenant.name string object.';
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
		if(0 !== tenant_name.indexOf(comparam.keys.VALUE_PREFIX_LOCAL_TENANT)){
			// Not have prefix("local@")
			tenant_name = comparam.keys.VALUE_PREFIX_LOCAL_TENANT + tenant_name;
		}
	}else{
		//
		// Update mode
		//
		is_create		= false;
		tenant_name		= comparam.tenant_name;
		tenant_id		= apiutil.getSafeString(req.body.tenant.id);
		if(!apiutil.isSafeString(tenant_id)){
			result.result	= false;
			result.message	= 'POST request tenant(' + tenant_name + ') body does not have tenant.id string object.';
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
	}

	if(apiutil.isSafeString(req.body.tenant.desc)){
		tenant_desc = apiutil.getSafeString(req.body.tenant.desc);
	}else{
		tenant_desc = 'K2HR3 Cluster Local tenant';
	}

	if(apiutil.isSafeString(req.body.tenant.display)){
		tenant_display = apiutil.getSafeString(req.body.tenant.display);
	}else{
		tenant_display = tenant_name;
	}

	//
	// Check users
	//
	if(apiutil.getSafeString(req.body.tenant.users)){
		tenant_users = [req.body.tenant.users.trim()];
	}else{
		tenant_users = apiutil.getSafeArray(req.body.tenant.users);
	}
	if(is_create){
		// add own user
		apiutil.tryAddStringToArray(tenant_users, comparam.user_name);
	}else{
		if(!apiutil.findStringInArray(tenant_users, comparam.user_name)){
			result.result	= false;
			result.message	= 'POST request tenant(' + tenant_name + ') does not allow user(' + comparam.user_name + ').';
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
	}
	if(apiutil.isArray(tenant_users)){
		tenant_users.sort();
	}

	//------------------------------
	// Processing
	//------------------------------
	resobj = rawCreateUpdateTenant(is_create, comparam.user_name, tenant_name, tenant_id, tenant_desc, tenant_display, tenant_users);
	if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || !apiutil.isSafeEntity(resobj.rescode) || false === resobj.result){
		result.result	= false;
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeString(resobj.message)){
			result.message	= 'POST request failed to update tenant by ' + resobj.message;
		}else{
			result.message	= 'POST request failed to update tenant by unknown reason';
		}
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeEntity(resobj.rescode)){
			resutil.errResponse(req, res, resobj.rescode, result);
		}else{
			resutil.errResponse(req, res, 500, result);		// 500: Internal error
		}
		r3logger.elog(result.message);
		return;
	}

	r3logger.dlog('succeed : create/update tenant(' + tenant_name + ') by user(' + comparam.user_name + ')');
	res.status(resobj.rescode);								// 200 or 201
	res.send(JSON.stringify(result));
});

//=========================================================
// Router PUT
//=========================================================
//
// Mountpath				: '/v1/tenant'
//
//---------------------------------------------------------
// [PUT] No tenant path
//---------------------------------------------------------
// PUT '/v1/tenant'			: create tenant version 1
// HEADER					: X-Auth-Token	= <User token>
// url argument				: 
//								"name":			<tenant>				=>	key is "yrn:yahoo:::<tenant>"
//																			<tenant> must include the prefix "R3CLUSTERLOCAL-".
//								"desc":			<description>			=>	value for "yrn:yahoo:::<tenant>:desc"
//																			thix value type must be string.
//								"display":		<display name>			=>	key is "yrn:yahoo:::<tenant>:display"
//																			thix value type must be string.
//								"users":		<user> or [user, ...]	=>	key is "yrn:yahoo::::user:<user>"
//																			specify adding user array which is yrn path as "yrn:yahoo::::user:<user>" or "user name"
//
// response status code		: 201 or 4xx/5xx
// response body			: 	{
//									result: 	true/false
//									message:	 messages
//								}
//
// Create a tenant as <K2HR3 cluster LOCAL> tenant.
//
// [NOTE]
// If the <K2HR3 cluster LOCAL> tenant already exists, this repsponses an error.
//
// Tenant names must start with "R3CLUSTERLOCAL-".
// Specify the user by YRN full path or user name.
// If the user indicated by <User Token> does not exist, it will be added.
// New tenant id("R3CLUSTERLOCAL-xxxxxx") is set automatically.
//
//---------------------------------------------------------
// [PUT] With tenant path
//---------------------------------------------------------
// PUT '/v1/tenant/tenant'	: update tenant version 1
// HEADER					: X-Auth-Token	= <User token>
// url argument				: 
//								"id":			<id>					=>	key is "yrn:yahoo:::<tenant>:id"
//																			this value type must be string.
//								"desc":			<description>			=>	value for "yrn:yahoo:::<tenant>:desc"
//																			thix value type must be string.
//								"display":		<display name>			=>	key is "yrn:yahoo:::<tenant>:display"
//																			thix value type must be string.
//								"users":		<user> or [user, ...]	=>	key is "yrn:yahoo::::user:<user>"
//																			specify adding user array which is yrn path as "yrn:yahoo::::user:<user>" or "user name"
//
// response status code		: 200 or 4xx/5xx
// response body			: 	{
//									result: 	true/false
//									message:	 messages
//								}
//
// Update existed tenant as <K2HR3 cluster LOCAL> tenant.
//
// [NOTE]
// If the <K2HR3 cluster LOCAL> tenant does not exist, this repsponses an error.
// The <User Token> user must be included in the tenant's user list.
//
// Specify the user by YRN full path or user name.
// If the user indicated by <User Token> does not exist, it will be added.
//
router.put('/', function(req, res, next)					// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result = {result: true, message: null};

	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	||
		!apiutil.isSafeEntity(req.query)	)
	{
		result.result	= false;
		result.message	= 'PUT request is something wrong';
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	var	resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		result.result	= resobj.result;
		result.message	= resobj.message;
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status_code, result);
		return;
	}
	var	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== comparam.token_type){
		result.result	= false;
		result.message	= 'PUT request tenant must specify <User Token>';
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	var	is_create		= true;
	var	tenant_name		= null;
	var	tenant_id		= null;
	var	tenant_desc		= null;
	var	tenant_display	= null;
	var	tenant_users	= null;

	if(!apiutil.isSafeString(comparam.tenant_name)){
		//
		// Create mode
		//
		is_create		= true;
		tenant_name		= apiutil.getSafeString(req.query.name).toLowerCase();
		tenant_id		= apiutil.getStrUuid4();										// Create new id here.

		if(!apiutil.isSafeString(tenant_name)){
			result.result	= false;
			result.message	= 'PUT request tenant body does not have tenant.name string object.';
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
		if(0 !== tenant_name.indexOf(comparam.keys.VALUE_PREFIX_LOCAL_TENANT)){
			// Not have prefix("local@")
			tenant_name = comparam.keys.VALUE_PREFIX_LOCAL_TENANT + tenant_name;
		}
	}else{
		//
		// Update mode
		//
		is_create		= false;
		tenant_name		= comparam.tenant_name;
		tenant_id		= apiutil.getSafeString(req.query.id);
		if(!apiutil.isSafeString(tenant_id)){
			result.result	= false;
			result.message	= 'PUT request tenant(' + tenant_name + ') body does not have tenant.id string object.';
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
	}

	if(apiutil.isSafeString(req.query.desc)){
		tenant_desc = apiutil.getSafeString(req.query.desc);
	}else{
		tenant_desc = 'K2HR3 Cluster Local tenant';
	}

	if(apiutil.isSafeString(req.query.display)){
		tenant_display = apiutil.getSafeString(req.query.display);
	}else{
		tenant_display = tenant_name;
	}

	//
	// Check users
	//
	if(apiutil.checkSimpleJSON(req.query.users)){
		tenant_users = apiutil.parseJSON(req.query.users);
		if(!apiutil.isArray(tenant_users) && apiutil.isSafeString(tenant_users)){
			tenant_users = [tenant_users];
		}else if(!apiutil.isArray(tenant_users)){
			tenant_users = [];
		}
	}else if(apiutil.isArray(req.query.users)){
		tenant_users = req.query.users;
	}else if(apiutil.isSafeString(req.query.users)){
		tenant_users = [req.query.users];
	}else{
		tenant_users = [];
	}
	if(is_create){
		// add own user
		apiutil.tryAddStringToArray(tenant_users, comparam.user_name);
	}else{
		if(!apiutil.findStringInArray(tenant_users, comparam.user_name)){
			result.result	= false;
			result.message	= 'PUT request tenant(' + tenant_name + ') does not allow user(' + comparam.user_name + ').';
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
	}
	if(apiutil.isArray(tenant_users)){
		tenant_users.sort();
	}

	//------------------------------
	// Processing
	//------------------------------
	resobj = rawCreateUpdateTenant(is_create, comparam.user_name, tenant_name, tenant_id, tenant_desc, tenant_display, tenant_users);
	if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || !apiutil.isSafeEntity(resobj.rescode) || false === resobj.result){
		result.result	= false;
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeString(resobj.message)){
			result.message	= 'PUT request failed to update tenant by ' + resobj.message;
		}else{
			result.message	= 'PUT request failed to update tenant by unknown reason';
		}
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeEntity(resobj.rescode)){
			resutil.errResponse(req, res, resobj.rescode, result);
		}else{
			resutil.errResponse(req, res, 500, result);		// 500: Internal error
		}
		r3logger.elog(result.message);
		return;
	}

	r3logger.dlog('succeed : create/update tenant(' + tenant_name + ') by user(' + comparam.user_name + ')');
	res.status(resobj.rescode);								// 200 or 201
	res.send(JSON.stringify(result));
});

//=========================================================
// Router GET
//=========================================================
//
// Mountpath				: '/v1/tenant{/tenant}'
//
//---------------------------------------------------------
// [GET] No tenant path
//---------------------------------------------------------
// GET '/v1/tenant'			: get tenant list version 1
// HEADER					: X-Auth-Token	= <User token>
// URL arguments			: expand		= "true"(default) or "false"
// response status code		: 200 or 4xx/5xx
// response					: nothing
// response body			:	{
//									result:		true/false,
//									message:	null or error message string
//									tenants:	[
//													{
//														name:		"string",
//														id:			"string",
//														desc:		"string",
//														display:	"string",
//														user:		array[users...]
//													},
//													...
//												]
//								}
//								or
// 								{
//									result:		true/false,
//									message:	null or error message string
//									tenants:	[
//													"tenant",
//													...
//												]
//								}
//
// This mount point retrieves a list of tenants and information about each.
//
//---------------------------------------------------------
// [GET] With tenant path
//---------------------------------------------------------
// GET '/v1/tenant/<tenant>'	: get tenant information on version 1
// HEADER						: X-Auth-Token	= <User token>
// URL arguments				: nothing
// response status code			: 200 or 4xx/5xx
// response						: nothing
// response body				:	{
//										result:		true/false,
//										message:	null or error message string
//										tenant:		{
//														name:		"string",
//														id:			"string",
//														desc:		"string",
//														display:	"string",
//														user:		array[users...]
//													}
//									}
//
router.get('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}

	res.type('application/json; charset=utf-8');

	var	result = {result: true, message: null};

	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		result.result	= false;
		result.message	= 'GET request is something wrong';
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	var	resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		result.result	= resobj.result;
		result.message	= resobj.message;
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status_code, result);
		return;
	}
	var	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== comparam.token_type){
		result.result	= false;
		result.message	= 'GET request tenant must specify <User Token>';
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// Processing
	//------------------------------
	if(!apiutil.isSafeString(comparam.tenant_name)){
		//
		// List mode
		//
		var	keys = r3keys(comparam.user_name);

		//
		// Check expand type
		//
		var	is_expand = true;
		if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.expand)){
			if(apiutil.compareCaseString(keys.VALUE_TRUE, req.query.expand)){
				is_expand = true;
			}else if(apiutil.compareCaseString(keys.VALUE_FALSE, req.query.expand)){
				is_expand = false;
			}else{
				result.result	= false;
				result.message	= 'GET expand url argument parameter(' + JSON.stringify(req.query.expand) + ') is wrong, it must be ' + keys.VALUE_TRUE + ' or ' + keys.VALUE_FALSE + '.';
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);		// 400: Bad Request
				return;
			}
		}

		//
		// Get list
		//
		resobj = k2hr3.listLocalTenant(comparam.user_name, is_expand);
		if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || !apiutil.isArray(resobj.tenants) || false === resobj.result){
			result.result	= false;
			if(apiutil.isSafeEntity(resobj) && apiutil.isSafeString(resobj.message)){
				result.message	= 'GET request failed to update tenant by ' + resobj.message;
			}else{
				result.message	= 'GET request failed to update tenant by unknown reason';
			}
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			return;
		}
		result.tenants = resobj.tenants;

	}else{
		//
		// One tenant
		//
		resobj = k2hr3.findTenant(comparam.tenant_name);
		if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || !apiutil.isSafeEntity(resobj.tenant) || false === resobj.result){
			result.result	= false;
			if(apiutil.isSafeEntity(resobj) && apiutil.isSafeString(resobj.message)){
				result.message	= 'GET request failed to update tenant by ' + resobj.message;
			}else{
				result.message	= 'GET request failed to update tenant by unknown reason';
			}
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			return;
		}
		result.tenant = resobj.tenant;
	}

	r3logger.dlog('succeed : get tenant(s) by user(' + comparam.user_name + ')');
	res.status(200);											// 200: OK
	res.send(JSON.stringify(result));
});

//=========================================================
// Router HEAD
//=========================================================
//
// Mountpath					: '/v1/tenant/tenant'
//
// HEAD '/v1/tenant/<tenant>'	: head tenant on version 1
// HEADER						: X-Auth-Token	= <User token>
// response status code			: 204 or 4xx/5xx
// response body				: nothing
//
// This mount point is an API for checking the existence of a tenant.
// If the tenant is given, this returns a 204 if that tenant exists and is allowed to be seen.
// If no tenant is given, returns 204 if at least one target tenant exists.
//
router.head('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	if('HEAD' !== req.method){
		// If other method request comes here, so it should be routed another function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		r3logger.elog('HEAD request is something wrong');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	var resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status_code);
		return;
	}
	var	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== comparam.token_type){
		r3logger.elog('HEAD request tenant must specify <User Token>');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// Check uri paths(tenant name)
	//------------------------------
	if(!apiutil.isSafeString(comparam.tenant_name)){
		r3logger.elog('HEAD request tenant must specify <tenant> path');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// Processing
	//------------------------------
	resobj = k2hr3.findTenant(comparam.tenant_name);
	if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || !apiutil.isSafeEntity(resobj.tenant) || false === resobj.result){
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeString(resobj.message)){
			r3logger.elog('HEAD request failed to update tenant by ' + resobj.message);
		}else{
			r3logger.elog('HEAD request failed to update tenant by unknown reason');
		}
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	r3logger.dlog('HEAD request succeed - check tenant(' + comparam.tenant_name + ') exists');
	res.status(204);									// 204: No Content
	res.send();
});

//=========================================================
// Router DELETE
//=========================================================
//
// Mountpath					: '/v1/tenant/<tenant>'
//
// DELETE '/v1/tenant/<tenant>'	: delete tenant on version 1
// HEADER						: X-Auth-Token	= <User token>
// url argument					: "id":	 <id>			=>	key is "yrn:yahoo:::<tenant>:id"
// response status code			: 204 or 4xx/5xx
// response body				: nothing
//
// This mount point deletes the specified <K2HR3 cluster LOCAL> tenant.
//
// [NOTE]
// Only users registered in the tenant to be deleted can delete this tenant.
//
router.delete('/', function(req, res, next)								// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		r3logger.elog('DELETE request or url or query is wrong');
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	var resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status_code);
		return;
	}
	var	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== comparam.token_type){
		r3logger.elog('DELETE request tenant must specify <User Token>');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// Check uri paths(tenant name)
	//------------------------------
	if(!apiutil.isSafeString(comparam.tenant_name)){
		r3logger.elog('DELETE request tenant must specify <tenant> path');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// Check argments(id)
	//------------------------------
	var	tenant_id = apiutil.getSafeString(req.query.id);
	if(!apiutil.isSafeString(tenant_id)){
		r3logger.elog('DELETE request id must specify in argument');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// Processing
	//------------------------------
	resobj = k2hr3.removeUserFromLocalTenant(comparam.tenant_name, comparam.user_name, tenant_id);
	if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || false === resobj.result){
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeString(resobj.message)){
			r3logger.elog('DELETE request failed to remove user from tenant by ' + resobj.message);
		}else{
			r3logger.elog('DELETE request failed to remove user from tenant by unknown reason');
		}
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	r3logger.dlog('DELETE request succeed - remove user from tenant');
	res.status(204);									// 204: No Content
	res.send();
});

module.exports = router;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
