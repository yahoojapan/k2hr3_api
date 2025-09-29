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
 * CREATE:   Thu Nov 2 2017
 * REVISION:
 *
 */

import	apiutil		from '../lib/k2hr3apiutil';
import	resutil		from '../lib/k2hr3resutil';
import	r3tokens	from '../lib/k2hr3tokens';
import	k2hr3		from '../lib/k2hr3dkc';
import	r3logger	from '../lib/dbglogging';
import	express		from 'express';

import type	{ cbTypeK2hr3ApiNoBodyResponse, resTypeBaseResult }	from '../lib/types';
import type	{ resTypeCheckRoleToken }							from '../lib/k2hr3tokens';
import type	{ Request, Response, NextFunction }					from 'express';

const	router	= express.Router();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type valTypeACRTokenInfo = {
	user:		string;
	tenant:		string;
	service:	string;
};

type resTypeACRServiceTenantNames = resTypeBaseResult & {
	tokeninfo:	valTypeACRTokenInfo
};

//
// Common utility function
//
// Create or update service
//
// Result			null(succeed) or error message(failed)
//
const rawCreateServiceTenant = (
	token_info:		resTypeCheckRoleToken | null,
	token:			string | null,
	tenantname:		string | null,
	servicename:	string | null,
	callback:		cbTypeK2hr3ApiNoBodyResponse
): void => {

	if(!apiutil.isFunction(callback)){
		const error = new Error('callback parameter is wrong : callback=' + JSON.stringify(callback));
		r3logger.elog(error.message);
		return;
	}

	//
	// Check service name
	//
	if(!apiutil.isSafeString(servicename)){
		const error = new Error('service name is wrong.');
		r3logger.elog(error.message);
		callback(error);
		return;
	}

	//
	// Check token
	//
	if(	!apiutil.isSafeString(token)				||
		!r3tokens.isResTypeCheckRoleToken(token_info)||
		!apiutil.isString(token_info.user)			)
	{
		const error = new Error('specified wrong token or it is not scoped or no tenant.');
		r3logger.elog(error.message);
		callback(error);
		return;
	}

	//
	// Create service + tenant
	//
	if(token_info.scoped){
		// [NOTE]
		// The token is scoped to tenant, but if the user exists, we use this token as unscoped.
		// By using as an unscoped token, the following function creates a scoped token inside it.
		// Then this logic will not be affected by deletion (one time) of token.
		//
		k2hr3.createServiceTenantByScopedToken(tenantname, servicename, token, callback);
	}else{
		k2hr3.createServiceTenantByUnscopedToken(tenantname, servicename, token, apiutil.getSafeString(token_info.user), callback);
	}
};

//
// Mountpath				: '/v1/acr'
//
// POST '/v1/acr/<service>'	: post service/tenant on version 1
// HEADER					: X-Auth-Token	=> Unscoped/Scoped User token or Role Token
// body						:	{
// 									tenant:	=> tenant name(when unscoped user token)
//								}
// response body			: result		=> true/false
//							  message		=> messages
//
router.post('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST request is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, false, true);	// (un)scoped user token
	if(!token_result.result){
		r3logger.elog(apiutil.getSafeString(token_result.message));
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info	= token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	let		tenantname: string | null;
	if(false === token_info.scoped){
		//
		// Unscoped user token : need tenant parameter
		//
		if(	!apiutil.isPlainObject(req.body)		||
			!apiutil.isSafeString(req.body.tenant)	)
		{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Specified unscoped user token, but there is not tenant in body data.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// get user's tenant list
		const	tenant_list = r3tokens.getTenantList(token_info.user);
		if(!apiutil.isArray(tenant_list) || !apiutil.isNotEmptyArray(tenant_list)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'token(' + apiutil.getSafeString(token_result.token) + ') for user (' + apiutil.getSafeString(token_info.user) + ') does not have any tenant.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// check tenant
		if(!r3tokens.checkTenantInTenantList(tenant_list, req.body.tenant.toLowerCase())){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'user (' + apiutil.getSafeString(token_info.user) + ') is not member of tenant(' + apiutil.getSafeString(req.body.tenant) + ').'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		tenantname = req.body.tenant.toLowerCase();

	}else{
		//
		// Scoped user token : not need tenant parameter
		//
		if(	apiutil.isPlainObject(req.body)			&&
			apiutil.isSafeString(req.body.tenant)	)
		{
			if(!apiutil.compareCaseString(token_info.tenant, req.body.tenant)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'Specified scoped user token and tenant in body data, but these are not same tenant name.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);				// 400: Bad Request
				return;
			}
		}
		tenantname = apiutil.getSafeString(token_info.tenant);
	}

	//------------------------------
	// check service path in url
	//------------------------------
	const	requestptn	= new RegExp('^/v1/acr/(.*)');					// regex = /^\/v1\/acr\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST request url does not have service name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	servicename		= reqmatchs[1].toLowerCase();

	//------------------------------
	// create service + tenant
	//------------------------------
	rawCreateServiceTenant(token_info, (token_result.token ?? null), tenantname, servicename, (error: Error | null): void => {
		if(null !== error){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	error.message
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403, result);					// 403: Forbidden(is this status OK?)
		}else{
			const	result: resTypeBaseResult = {
				result: 	true,
				message:	null
			};
			res.status(201);											// 201: Created
			res.send(JSON.stringify(result));
		}
	});
});

//
// Mountpath				: '/v1/acr'
//
// PUT '/v1/acr/<service>'	: post service/tenant on version 1
// HEADER					: X-Auth-Token	=> Unscoped/Scoped User token or Role Token
// URL arguments			: tenant		=> tenant name(when unscoped user token)
// response body			: result		=> true/false
//							  message		=> messages
//
router.put('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request is wrong'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, false, true);	// (un)scoped user token
	if(!token_result.result){
		r3logger.elog(apiutil.getSafeString(token_result.message));
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}
	const	token_info	= token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	let	tenantname: string | null;
	if(false === token_info.scoped){
		//
		// Unscoped user token : need tenant parameter
		//
		if(	!apiutil.isPlainObject(req.query)		||
			!apiutil.isSafeString(req.query.tenant)	)
		{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Specified unscoped user token, but there is not tenant in argument.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// get user's tenant list
		const	tenant_list = r3tokens.getTenantList(token_info.user);
		if(!apiutil.isArray(tenant_list) || !apiutil.isNotEmptyArray(tenant_list)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'token(' + apiutil.getSafeString(token_result.token) + ') for user (' + apiutil.getSafeString(token_info.user) + ') does not have any tenant.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// check tenant
		if(!r3tokens.checkTenantInTenantList(tenant_list, req.query.tenant.toLowerCase())){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'user (' + apiutil.getSafeString(token_info.user) + ') is not member of tenant(' + apiutil.getSafeString(req.query.tenant) + ').'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		tenantname = req.query.tenant.toLowerCase();

	}else{
		//
		// Scoped user token : not need tenant parameter
		//
		if(	apiutil.isPlainObject(req.body)			&&
			apiutil.isSafeString(req.body.tenant)	)
		{
			if(!apiutil.compareCaseString(token_info.tenant, req.body.tenant)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'Specified scoped user token and tenant in body data, but these are not same tenant name.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);				// 400: Bad Request
				return;
			}
		}
		tenantname = apiutil.getSafeString(token_info.tenant);
	}

	//------------------------------
	// check service path in url
	//------------------------------
	const	requestptn	= new RegExp('^/v1/acr/(.*)');					// regex = /^\/v1\/acr\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request url does not have service name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	servicename		= reqmatchs[1].toLowerCase();

	//------------------------------
	// create service + tenant
	//------------------------------
	rawCreateServiceTenant(token_info, (token_result.token ?? null), tenantname, servicename, (error: Error | null): void => {
		if(null !== error){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	error.message
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403, result);					// 403: Forbidden(is this status OK?)
		}else{
			const	result: resTypeBaseResult = {
				result: 	true,
				message:	null
			};
			res.status(201);											// 201: Created
			res.send(JSON.stringify(result));
		}
	});
});

//
// Utility function for getting Service/Tenant Names
//
const rawGetServiceTenantNames = (
	req:	Request,
	res:	Response
): void => {

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request or url is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);		// scoped user token
	if(!token_result.result){
		r3logger.elog(apiutil.getSafeString(token_result.message));
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info	= token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//
	// force remove user token(this is one shot!)
	//
	r3tokens.removeScopedUserToken(token_result.token ?? undefined);

	//------------------------------
	// check service path in url
	//------------------------------
	const	requestptn	= new RegExp('^/v1/acr/(.*)');					// regex = /^\/v1\/acr\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request url does not have service name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// check tenant in service's tenant list
	//------------------------------
	const	resobj = k2hr3.checkTenantInService(servicename, token_info.tenant);
	if(!apiutil.isPlainObject(resobj) || !apiutil.isBoolean(resobj.result) || false === resobj.result){
		if(!apiutil.isSafeEntity(resobj)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get service data from checkTenantInService'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		}else{
			const	result: resTypeBaseResult = {
				result: 	resobj.result,
				message:	apiutil.isString(resobj.message) ? resobj.message : 'Could not get error message in response from checkTenantInService'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		}
		return;
	}
	//------------------------------
	// make result
	//------------------------------
	const	tokeninfo: valTypeACRTokenInfo = {
		user:		apiutil.getSafeString(token_info.user),
		tenant:		apiutil.getSafeString(token_info.tenant),
		service:	servicename
	};
	const	success_result: resTypeACRServiceTenantNames = {
		result: 	true,
		message:	null,
		tokeninfo:	tokeninfo
	};

	r3logger.dlog('succeed');
	res.status(200);													// 200: OK
	res.send(JSON.stringify(success_result));
};

//
// Utility function for getting Service/Tenant Resources
//
const rawGetServiceTenantResources = (
	req:	Request,
	res:	Response
): void => {

	//------------------------------
	// check request
	//------------------------------
	const	sip	= apiutil.getClientIpAddress(req);
	if(	!apiutil.isPlainObject(req)				||
		!apiutil.isSafeString(req.baseUrl)		||
		!apiutil.isPlainObject(req.query)		||
		!apiutil.isSafeString(req.query.cip)	||
		!apiutil.isSafeString(sip)				||
		!apiutil.isSafeString(req.query.crole)	||
		!apiutil.isSafeString(req.query.srole)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request or parameters are wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// port parameters
	//------------------------------
	const	cport = apiutil.cvtToNumber(req.query.cport);
	const	sport = apiutil.cvtToNumber(req.query.sport);

	//------------------------------
	// cuk parameters
	//------------------------------
	const	ccuk	= apiutil.isString(req.query.ccuk) ? req.query.ccuk : null;
	const	scuk	= apiutil.isString(req.query.scuk) ? req.query.scuk : null;

	//------------------------------
	// check service path in url
	//------------------------------
	const	requestptn	= new RegExp('^/v1/acr/(.*)');					// regex = /^\/v1\/acr\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request url does not have service name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// Get ACR resources
	//------------------------------
	const	resource_result = k2hr3.getServiceTenantResources(servicename, sip, sport, scuk, req.query.srole, req.query.cip, cport, ccuk, req.query.crole);
	if(!apiutil.isPlainObject(resource_result) || !apiutil.isBoolean(resource_result.result) || false === resource_result.result){
		if(!apiutil.isSafeEntity(resource_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get ACR resources from getServiceTenantResources'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403, result);					// 403: Forbidden(is this status OK?)
		}else{
			const	result: resTypeBaseResult = {
				result: 	resource_result.result,
				message:	apiutil.isString(resource_result.message) ? resource_result.message : 'Could not get error message in response from getServiceTenantResources'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403, result);					// 403: Forbidden(is this status OK?)
		}
		return;
	}

	r3logger.dlog('succeed : ' + JSON.stringify(resource_result));
	res.status(200);													// 200: OK
	res.send(JSON.stringify(resource_result));
};

//
// Mountpath				: '/v1/acr'
//
// GET '/v1/acr/<service>'	: get service/tenant names on version 1
// HEADER					: X-Auth-Token		=>	Scoped User token
// response body			: result			=>	true/false
//							  message			=>	messages
//							  tokeninfo			=>	user/tenant information for verify
//
//	tokeninfo = {
//		user:				: <user name>		=>	user name string
//		tenant:				: <tenant name>		=>	tenant name string
//		service:			: <service name>	=>	service name string
//	}
//
//
// GET '/v1/acr/<service>'	: get resource proxying service on version 1
// URL argument				:
//		"cip"				: <IP address>		=>	client IP address(client peer address to service) gave by service
//		"cport"				: <port>			=>	client port number specified by client(proxied by service)
//													this value is optional
//		"ccuk"				: <cuk string>		=>	client container unique key
//													this value is optional
//		"sport"				: <port>			=>	service port number specified by service
//													this value is optional
//		"scuk"				: <cuk string>		=>	service container unique key
//													this value is optional
//		"crole"				: <role yrn>		=>	client role full yrn specified by client(proxied by service)
//		"srole"				: <role yrn>		=>	service role full yrn
//
// response body			: result			=>	true/false
//							  message			=>	messages
//							  resource			=>	following format
//
//	response = [								=>	allowed null/undefined, this object is the result of verify from service at creating service/tenant
//		{
//			name			: <resource name>	=>	resource name which is key name(path) for resource
//			expire			: <expire>			=>	undefined/null or integer
//			type			: <resource type>	=>	resource data type(string or object), if date is null or '', this value must be string.
//			data			: <resource data>	=>	resource data which must be string or object or null/undefined.
//			keys = {		: <resource keys>	=>	resource has keys(associative array), or null/undefined.
//				'foo':	bar,:					=>	any value is allowed
//				...
//			}
//		},
//		...
//	]
//
router.get('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	//------------------------------
	// check request type
	//------------------------------
	if(r3tokens.hasAuthTokenHeader(req)){
		//
		// Get service/tenant name
		//
		rawGetServiceTenantNames(req, res);
	}else{
		//
		// Get resources for service/tenant
		//
		rawGetServiceTenantResources(req, res);
	}
});

//
// Mountpath					: '/v1/acr/*'
//
// DELETE '/v1/acr/<service>'	: delete service tenant on version 1
// HEADER						: X-Auth-Token	=> Scoped User token
// response body				: result		=> true/false
//
router.delete('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'DELETE request or url is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);				// scoped user token
	if(!token_result.result){
		r3logger.elog(apiutil.getSafeString(token_result.message));
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info	= token_result.token_info;
	if(	!r3tokens.isResTypeCheckRoleToken(token_info)	||
		!apiutil.isSafeString(token_info.tenant)		||
		!apiutil.isSafeString(token_info.user)			)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	tenantname	= token_info.tenant;
	const	user		= token_info.user;

	//------------------------------
	// check service path in url
	//------------------------------
	const	requestptn	= new RegExp('^/v1/acr/(.*)');					// regex = /^\/v1\/acr\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'DELETE request url does not have service name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	servicename		= reqmatchs[1].toLowerCase();

	//------------------------------
	// remove service + tenant
	//------------------------------
	const	rm_result = k2hr3.removeServiceTenant(user, tenantname, servicename);
	if(!apiutil.isPlainObject(rm_result) || !apiutil.isBoolean(rm_result.result) || false === rm_result.result){
		if(!apiutil.isSafeEntity(rm_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get response from removeServiceTenant'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403);						// 403: Forbidden(is this status OK?)
		}else{
			const	result: resTypeBaseResult = {
				result: 	rm_result.result,
				message:	apiutil.isString(rm_result.message) ? rm_result.message : 'Could not get error message in response from removeServiceTenant'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403);						// 403: Forbidden(is this status OK?)
		}
		return;
	}
	r3logger.dlog('succeed : ' + rm_result.message);
	res.status(204);												// 204: No Content
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
	valTypeACRTokenInfo,
	resTypeACRServiceTenantNames
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
