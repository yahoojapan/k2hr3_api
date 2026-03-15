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

import	apiutil			from '../lib/k2hr3apiutil';
import	resutil			from '../lib/k2hr3resutil';
import	r3tokens		from '../lib/k2hr3tokens';
import	k2hr3			from '../lib/k2hr3dkc';
import	r3logger		from '../lib/dbglogging';
import	express			from 'express';

import	{ getK2hr3Keys, type K2hr3Keys }					from '../lib/k2hr3keys';
import type	{ resTypeCheckKindToken }						from '../lib/k2hr3tokens';
import type	{ dkcTypeTenantInfo, dkcTypeTenantInfoList }	from '../lib/k2hr3dkc';
import type	{ resTypeBaseResult, resTypeStatusResult }		from '../lib/types';
import type	{ Request, Response, NextFunction }				from 'express';

const	r3keys	= getK2hr3Keys;
const	router	= express.Router();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type valTypeTenantReqBaseParam = {
	token_type:		string | null;
	token_str:		string | null;
	token_info:		resTypeCheckKindToken | null;
	user_name:		string | null;
	tenant_name:	string | null;
	token_tenant:	string | null;
	keys:			K2hr3Keys;
};

type valTypeTenantReqParam = resTypeStatusResult & {
	parameters:		valTypeTenantReqBaseParam
};

type resTypeGetTenantList = resTypeBaseResult & {			// as same as resTypeLocalTenantList
	tenants?:		string[] | dkcTypeTenantInfoList;
};

type resTypeGetTenantInfo = resTypeBaseResult & {
	tenant?:		dkcTypeTenantInfo;
};

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
//				status:							status code(default 200)
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
const rawParseBaseParamInRequest = (req: Request): valTypeTenantReqParam => {

	const	parameters: valTypeTenantReqBaseParam = {
		token_type:		null,
		token_str:		null,
		token_info:		null,
		token_tenant:	null,
		user_name:		null,
		tenant_name:	null,
		keys:			r3keys()											// temporary
	};
	const	result: valTypeTenantReqParam = {
		result:			true,
		message:		null,
		status:			200,
		parameters:		parameters
	};

	//
	// check token for API mode
	//
	if(r3tokens.hasAuthTokenHeader(req)){
		const	token_result = r3tokens.checkToken(req, false, true);		// (un)scoped, user
		if(!token_result.result){
			result.result		= token_result.result;
			result.message		= token_result.message;
			result.status		= token_result.status;
			r3logger.elog(result.message);
			return result;
		}

		if(!r3tokens.isResTypeCheckRoleToken(token_result.token_info)){
			result.result		= false;
			result.message		= 'specified wrong token or it is not scoped user token';
			result.status		= 400;										// 400: Bad Request
			r3logger.elog(result.message);
			return result;
		}
		result.parameters.token_str		= token_result.token ?? null;
		result.parameters.token_type	= token_result.token_type ?? null;
		result.parameters.token_info	= token_result.token_info;
		result.parameters.user_name		= apiutil.getSafeString(result.parameters.token_info.user);
	}

	//
	// get tenant name from uri
	//
	const	requestptn	= new RegExp('^/v1/tenant/(.*)');					// regex = /^\/v1\/tenant\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result.parameters.tenant_name = null;
	}else{
		// check tenant name
		if(0 !== reqmatchs[1].indexOf(result.parameters.keys.VALUE_PREFIX_LOCAL_TENANT)){
			// Not have prefix("local@")
			const	tmp_tenant_name = result.parameters.keys.VALUE_PREFIX_LOCAL_TENANT + reqmatchs[1];
			result.parameters.tenant_name = tmp_tenant_name.toLowerCase();
		}else{
			result.parameters.tenant_name = reqmatchs[1].toLowerCase();
		}
	}
	// keys
	result.parameters.keys = r3keys(result.parameters.user_name, result.parameters.tenant_name);

	return result;
};

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
const rawCreateUpdateTenant = (
	is_create:		boolean,
	user_name:		string,
	tenant_name:	string,
	tenant_id:		string,
	tenant_desc:	string,
	tenant_display:	string,
	tenant_users:	string[]
): resTypeStatusResult => {

	let	result_status: number;
	if(is_create){
		//
		// Create tenant
		//
		const	resobj = k2hr3.findTenant(tenant_name);
		if(apiutil.isPlainObject(resobj) && apiutil.isBoolean(resobj.result) && true === resobj.result){
			const	result: resTypeStatusResult = {
				result:		false,
				message:	'failed to create tenant by already tenant(' + tenant_name + ') existed',
				status:		400
			};
			r3logger.elog(result.message);
			return result;
		}
		result_status = 201;								// 201: Created
	}else{
		//
		// Update tenant
		//
		const	resobj = k2hr3.findTenant(tenant_name, user_name, tenant_id);
		if(!apiutil.isPlainObject(resobj) || !apiutil.isBoolean(resobj.result) || false === resobj.result){
			if(apiutil.isPlainObject(resobj) && apiutil.isSafeString(resobj.message)){
				const	result: resTypeStatusResult = {
					result:		false,
					message:	'failed to update tenant by ' + apiutil.getSafeString(resobj.message),
					status:		400
				};
				r3logger.elog(result.message);
				return result;
			}else{
				const	result: resTypeStatusResult = {
					result:		false,
					message:	'failed to update tenant by unknown reason',
					status:		400
				};
				r3logger.elog(result.message);
				return result;
			}
		}
		result_status = 200;								// 200: OK
	}

	//
	// Create/Update tenant
	//
	const	init_resobj = k2hr3.initTenant(tenant_name, tenant_id, tenant_desc, tenant_display, user_name, tenant_users);
	if(!apiutil.isPlainObject(init_resobj) || !apiutil.isBoolean(init_resobj.result) || false === init_resobj.result){
		if(apiutil.isPlainObject(init_resobj) && apiutil.isSafeString(init_resobj.message)){
			const	result: resTypeStatusResult = {
				result:		false,
				message:	'failed to create tenant by ' + apiutil.getSafeString(init_resobj.message),
				status:		400
			};
			r3logger.elog(result.message);
			return result;
		}else{
			const	result: resTypeStatusResult = {
				result:		false,
				message:	'failed to create tenant by unknown reason',
				status:		400
			};
			r3logger.elog(result.message);
			return result;
		}
	}

	const	resobj: resTypeStatusResult = {
		result:		true,
		message:	null,
		status:		result_status
	};
	return resobj;
};

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
router.post('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)				||
		!apiutil.isSafeString(req.baseUrl)		||
		!apiutil.isPlainObject(req.body)		||
		!apiutil.isPlainObject(req.body.tenant)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST body does not have tenant data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	const	resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		const	result: resTypeBaseResult = {
			result: 	resobj.result,
			message:	resobj.message
		};
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status, result);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== apiutil.getSafeString(comparam.token_type)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST request tenant must specify <User Token>'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	let	is_create: boolean;
	let	tenant_name: string;
	let	tenant_id: string;
	let	tenant_desc: string;
	let	tenant_display: string;
	let	tenant_users: string[]	= [];
	if(!apiutil.isSafeString(comparam.tenant_name)){
		//
		// Create mode
		//
		is_create		= true;
		tenant_name		= apiutil.getSafeString(req.body.tenant.name).toLowerCase();
		tenant_id		= apiutil.getStrUuid4();										// Create new id here.

		if(!apiutil.isSafeString(tenant_name)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request tenant body does not have tenant.name string object.'
			};
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
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request tenant(' + tenant_name + ') body does not have tenant.id string object.'
			};
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
	if(apiutil.isSafeString(req.body.tenant.users)){
		tenant_users = [req.body.tenant.users.trim()];
	}else if(apiutil.isStringArray(req.body.tenant.users)){
		tenant_users = apiutil.getSafeArray(req.body.tenant.users);
	}
	if(is_create){
		// add own user
		if(apiutil.isSafeString(comparam.user_name)){
			apiutil.tryAddStringToArray(tenant_users, comparam.user_name);
		}
	}else{
		if(!apiutil.isStringArray(tenant_users) || !apiutil.isNotEmptyArray(tenant_users)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request tenant(' + JSON.stringify(tenant_name) + ') does not have any user list.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}

		const	findobj = k2hr3.findTenant(tenant_name, comparam.user_name, tenant_id);
		if(	!apiutil.isPlainObject(findobj)											||
			!apiutil.isBoolean(findobj.result)										||
			false === findobj.result												||
			!k2hr3.isDkcTypeTenantInfo(findobj.tenant)								||
			!apiutil.isSafeString(findobj.tenant.name)								||
			!apiutil.isStringArray(findobj.tenant.users)							||
			!apiutil.findStringInArray(findobj.tenant.users, comparam.user_name)	)
		{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request tenant(' + tenant_name + ') does not allow user(' + comparam.user_name + ').'
			};
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
	const	create_result = rawCreateUpdateTenant(is_create, (comparam.user_name ?? ''), tenant_name, tenant_id, tenant_desc, tenant_display, tenant_users);
	if(!apiutil.isPlainObject(create_result) || !apiutil.isBoolean(create_result.result) || !apiutil.isSafeNumber(create_result.status) || false === create_result.result){
		if(apiutil.isPlainObject(create_result) && apiutil.isSafeString(create_result.message)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request failed to update tenant by ' + apiutil.getSafeString(create_result.message)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, (create_result?.status ?? 500), result);
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request failed to update tenant by unknown reason'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, (apiutil.isSafeNumber(create_result.status) ? create_result.status : 500), result);
		}
		return;
	}
	r3logger.dlog('succeed : create/update tenant(' + JSON.stringify(tenant_name) + ') by user(' + JSON.stringify(comparam.user_name) + ')');

	const	success_result: resTypeBaseResult = {
		result: 	true,
		message:	null
	};
	res.status(create_result.status ?? 200);						// 200 or 201
	res.send(JSON.stringify(success_result));
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
router.put('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	||
		!apiutil.isPlainObject(req.query)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request is something wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	const	resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		const	result: resTypeBaseResult = {
			result: 	resobj.result,
			message:	resobj.message
		};
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status, result);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== apiutil.getSafeString(comparam.token_type)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request tenant must specify <User Token>'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	let	is_create: boolean;
	let	tenant_name: string;
	let	tenant_id: string;
	let	tenant_desc: string;
	let	tenant_display: string;
	let	tenant_users: string[]	= [];
	if(!apiutil.isSafeString(comparam.tenant_name)){
		//
		// Create mode
		//
		is_create		= true;
		tenant_name		= apiutil.getSafeString(req.query.name).toLowerCase();
		tenant_id		= apiutil.getStrUuid4();			// Create new id here.

		if(!apiutil.isSafeString(tenant_name)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request tenant body does not have tenant.name string object.'
			};
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
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request tenant(' + tenant_name + ') body does not have tenant.id string object.'
			};
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
		const	tenant_users_tmp = apiutil.parseJSON(req.query.users);
		if(apiutil.isSafeString(tenant_users_tmp)){
			tenant_users = [tenant_users_tmp];
		}else if(apiutil.isStringArray(tenant_users_tmp)){
			tenant_users = apiutil.getSafeArray(tenant_users_tmp);
		}
	}else if(apiutil.isSafeString(req.query.users)){
		tenant_users = [req.query.users];
	}else if(apiutil.isStringArray(req.query.users)){
		tenant_users = apiutil.getSafeArray(req.query.users);
	}

	if(is_create){
		// add own user
		if(apiutil.isSafeString(comparam.user_name)){
			apiutil.tryAddStringToArray(tenant_users, comparam.user_name);
		}
	}else{
		// check user in current tenant users
		if(!apiutil.isStringArray(tenant_users) || !apiutil.isNotEmptyArray(tenant_users)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request tenant(' + JSON.stringify(tenant_name) + ') does not have any user list.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}

		const	findobj = k2hr3.findTenant(tenant_name, comparam.user_name, tenant_id);
		if(	!apiutil.isPlainObject(findobj)											||
			!apiutil.isBoolean(findobj.result)										||
			false === findobj.result												||
			!k2hr3.isDkcTypeTenantInfo(findobj.tenant)								||
			!apiutil.isSafeString(findobj.tenant.name)								||
			!apiutil.isStringArray(findobj.tenant.users)							||
			!apiutil.findStringInArray(findobj.tenant.users, comparam.user_name)	)
		{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request tenant(' + tenant_name + ') does not allow user(' + comparam.user_name + ').'
			};
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
	const	create_result = rawCreateUpdateTenant(is_create, (comparam.user_name ?? ''), tenant_name, tenant_id, tenant_desc, tenant_display, tenant_users);
	if(!apiutil.isPlainObject(create_result) || !apiutil.isBoolean(create_result.result) || !apiutil.isSafeNumber(create_result.status) || false === create_result.result){
		if(apiutil.isPlainObject(create_result) && apiutil.isSafeString(create_result.message)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request failed to update tenant by ' + apiutil.getSafeString(create_result.message)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, (create_result?.status ?? 500), result);
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request failed to update tenant by unknown reason'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, (apiutil.isSafeNumber(create_result.status) ? create_result.status : 500), result);
		}
		return;
	}
	r3logger.dlog('succeed : create/update tenant(' + JSON.stringify(tenant_name) + ') by user(' + JSON.stringify(comparam.user_name) + ')');

	const	success_result: resTypeBaseResult = {
		result: 	true,
		message:	null
	};
	res.status(create_result.status ?? 200);					// 200 or 201
	res.send(JSON.stringify(success_result));
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
router.get('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request is something wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);					// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	const	resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		const	result: resTypeBaseResult = {
			result: 	resobj.result,
			message:	resobj.message
		};
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status, result);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== apiutil.getSafeString(comparam.token_type)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request tenant must specify <User Token>'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);					// 400: Bad Request
		return;
	}

	//------------------------------
	// Processing
	//------------------------------
	let	jsonres: string;
	if(!apiutil.isSafeString(comparam.tenant_name)){
		//
		// List mode
		//
		const	keys = r3keys(comparam.user_name);

		//
		// Check expand type
		//
		let	is_expand = true;
		if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.expand)){
			if(apiutil.compareCaseString(keys.VALUE_TRUE, req.query.expand)){
				is_expand = true;
			}else if(apiutil.compareCaseString(keys.VALUE_FALSE, req.query.expand)){
				is_expand = false;
			}else{
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET expand url argument parameter(' + JSON.stringify(req.query.expand) + ') is wrong, it must be ' + keys.VALUE_TRUE + ' or ' + keys.VALUE_FALSE + '.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);			// 400: Bad Request
				return;
			}
		}

		//
		// Get list
		//
		const	resobj = k2hr3.listLocalTenant(comparam.user_name, is_expand);
		if(!apiutil.isPlainObject(resobj) || !apiutil.isBoolean(resobj.result) || (!is_expand && !apiutil.isStringArray(resobj.tenants)) || (is_expand && !k2hr3.isDkcTypeTenantInfoList(resobj.tenants)) || false === resobj.result){
			if(apiutil.isPlainObject(resobj) && apiutil.isSafeString(resobj.message)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET request failed to update tenant by ' + apiutil.getSafeString(resobj.message)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			}else{
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET request failed to update tenant by unknown reason'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			}
			return;
		}

		const	result: resTypeGetTenantList = {
			result: 	true,
			message:	null,
			tenants:	resobj.tenants
		};
		jsonres = JSON.stringify(result);

	}else{
		//
		// One tenant
		//
		const	resobj = k2hr3.findTenant(comparam.tenant_name);
		if(!apiutil.isPlainObject(resobj) || !apiutil.isBoolean(resobj.result) || !k2hr3.isDkcTypeTenantInfo(resobj.tenant) || false === resobj.result){
			if(apiutil.isPlainObject(resobj) && apiutil.isSafeString(resobj.message)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET request failed to update tenant by ' + apiutil.getSafeString(resobj.message)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			}else{
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET request failed to update tenant by unknown reason'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			}
			return;
		}

		const	result: resTypeGetTenantInfo = {
			result: 	true,
			message:	null,
			tenant:		resobj.tenant
		};
		jsonres = JSON.stringify(result);

	}
	r3logger.dlog('succeed : get tenant(s) by user(' + JSON.stringify(comparam.user_name) + ')');

	res.status(200);											// 200: OK
	res.send(jsonres);
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
router.head('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	if('HEAD' !== req.method){
		// If other method request comes here, so it should be routed another function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		r3logger.elog('HEAD request is something wrong');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	const	resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== apiutil.getSafeString(comparam.token_type)){
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
	const	find_result = k2hr3.findTenant(comparam.tenant_name);
	if(!apiutil.isPlainObject(find_result) || !apiutil.isBoolean(find_result.result) || !k2hr3.isDkcTypeTenantInfo(find_result.tenant) || false === find_result.result){
		if(apiutil.isPlainObject(find_result) && apiutil.isSafeString(find_result.message)){
			r3logger.elog('HEAD request failed to update tenant by ' + apiutil.getSafeString(find_result.message));
		}else{
			r3logger.elog('HEAD request failed to update tenant by unknown reason');
		}
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	r3logger.dlog('HEAD request succeed - check tenant(' + JSON.stringify(comparam.tenant_name) + ') exists');
	res.status(204);									// 204: No Content
	res.send();
});

//=========================================================
// Router DELETE
//=========================================================
//
// Mountpath				: '/v1/tenant'
//
//---------------------------------------------------------
// [DELETE] No tenant path
//---------------------------------------------------------
// DELETE '/v1/tenant'			: delete tenant version 1
// HEADER						: X-Auth-Token	= <User token>
// url argument					: "tenant"		= <tenant name>
// url argument					: "id"			= <id>			=>	key is "yrn:yahoo:::<tenant>:id"
// response status code			: 204 or 4xx/5xx
// response body				: nothing
//
// This mount point deletes the specified <K2HR3 cluster LOCAL> tenant.
//
//---------------------------------------------------------
// [DELETE] With tenant path
//---------------------------------------------------------
// DELETE '/v1/tenant/tenant'	: delete tenant version 1
// HEADER						: X-Auth-Token	= <User token>
// url argument					: "id"			=  <id>			=>	key is "yrn:yahoo:::<tenant>:id"
// response status code			: 204 or 4xx/5xx
// response body				: nothing
//
// This mount point deletes the specified <K2HR3 cluster LOCAL> tenant.
//
// [NOTE]
// Only users registered in the tenant to be deleted can delete this tenant.
//
router.delete('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		r3logger.elog('DELETE request or url or query is wrong');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, tenant etc)
	//------------------------------
	const	resobj = rawParseBaseParamInRequest(req);
	if(!resobj.result){
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check token type
	//------------------------------
	if('user' !== apiutil.getSafeString(comparam.token_type)){
		r3logger.elog('DELETE request tenant must specify <User Token>');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// Check uri paths
	//------------------------------
	if(!apiutil.isSafeString(comparam.tenant_name)){
		//------------------------------
		// Check argments(tenant)
		//------------------------------
		const	tenant_name = apiutil.isPlainObject(req.query) ? apiutil.getSafeString(req.query.tenant) : '';
		if(!apiutil.isSafeString(tenant_name)){
			r3logger.elog('DELETE request tenant must specify in argument');
			resutil.errResponse(req, res, 400);			// 400: Bad Request
			return;
		}

		//------------------------------
		// Check argments(id)
		//------------------------------
		const	tenant_id = apiutil.isPlainObject(req.query) ? apiutil.getSafeString(req.query.id) : '';
		if(!apiutil.isSafeString(tenant_id)){
			r3logger.elog('DELETE request id must specify in argument');
			resutil.errResponse(req, res, 400);			// 400: Bad Request
			return;
		}

		//------------------------------
		// Processing
		//------------------------------
		const	resobj = k2hr3.removeLocalTenant(tenant_name, comparam.user_name, tenant_id);
		if(!apiutil.isPlainObject(resobj) || !apiutil.isBoolean(resobj.result) || false === resobj.result){
			if(apiutil.isPlainObject(resobj) && apiutil.isSafeString(resobj.message)){
				r3logger.elog('DELETE request failed to remove user from tenant by ' + apiutil.getSafeString(resobj.message));
			}else{
				r3logger.elog('DELETE request failed to remove user from tenant by unknown reason');
			}
			resutil.errResponse(req, res, 400);			// 400: Bad Request
			return;
		}
		r3logger.dlog('DELETE request succeed - remove tenant');

	}else{
		//------------------------------
		// Check argments(id)
		//------------------------------
		const	tenant_id = apiutil.isPlainObject(req.query) ? apiutil.getSafeString(req.query.id) : '';
		if(!apiutil.isSafeString(tenant_id)){
			r3logger.elog('DELETE request id must specify in argument');
			resutil.errResponse(req, res, 400);			// 400: Bad Request
			return;
		}

		//------------------------------
		// Processing
		//------------------------------
		const	resobj = k2hr3.removeUserFromLocalTenant(comparam.tenant_name, comparam.user_name, tenant_id);
		if(!apiutil.isPlainObject(resobj) || !apiutil.isBoolean(resobj.result) || false === resobj.result){
			if(apiutil.isPlainObject(resobj) && apiutil.isSafeString(resobj.message)){
				r3logger.elog('DELETE request failed to remove user from tenant by ' + apiutil.getSafeString(resobj.message));
			}else{
				r3logger.elog('DELETE request failed to remove user from tenant by unknown reason');
			}
			resutil.errResponse(req, res, 400);			// 400: Bad Request
			return;
		}
		r3logger.dlog('DELETE request succeed - remove user from tenant');
	}

	res.status(204);									// 204: No Content
	res.send();
});

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Functions
//
export default router;

//
// Variables
//
export {
	resTypeGetTenantList,
	resTypeGetTenantInfo
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
