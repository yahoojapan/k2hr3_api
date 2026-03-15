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
 * CREATE:   Wed Nov 1 2017
 * REVISION:
 *
 */

import	apiutil				from '../lib/k2hr3apiutil';
import	resutil				from '../lib/k2hr3resutil';
import	r3tokens			from '../lib/k2hr3tokens';
import	k2hr3				from '../lib/k2hr3dkc';
import	r3logger			from '../lib/dbglogging';
import	express				from 'express';
import	{ getK2hr3Keys }	from '../lib/k2hr3keys';

import type	{ valTypeAll, resTypeBaseResult }	from '../lib/types';
import type	{ Request, Response, NextFunction }	from 'express';

const	r3keys	= getK2hr3Keys;
const	router	= express.Router();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type valTypeServiceTenantVerify = {
	verify:		valTypeAll;
	tenant:		string[] | null;
};

type resTypeGetService = resTypeBaseResult & {
	service?:	valTypeServiceTenantVerify;
};

//
// Common utility function
//
// Convert tenant yrn path to tenant name
//
const rawGetTenantNameFromYrn = (tenant: string | null): string | null => {

	if(!apiutil.isSafeString(tenant)){
		return null;
	}
	const	keys	= r3keys();
	const	yrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_MAIN);		// regex = /^yrn:yahoo:(.*)::(.*)/
	const	matches	= tenant.match(yrnptn);
	if(!apiutil.isStringArray(matches) || !apiutil.isNotEmptyArray(matches) || matches.length < 3){
		// not match tenant yrn, then return original tenant
		return tenant;
	}
	tenant = matches[2];												// tenant name
	if(!apiutil.isSafeString(tenant)){
		return null;
	}
	return tenant;
};

//
// Common utility function
//
// Create or update service
//
// Result				null(succeed) or error message(failed)
//
const rawUpdateService = (
	owner:			string | null,
	servicename:	string | null,
	verify:			valTypeAll,
	tenants:		string[] | null,
	is_clear:		boolean,
	is_create:		boolean
): Error | null => {

	if(!apiutil.isSafeString(owner) || !apiutil.isSafeString(servicename)){
		const	error = new Error('Internal error: rawUpdateService');
		return error;
	}
	if(!apiutil.isValTypeAll(verify)){
		verify = null;
	}
	if(!apiutil.isStringArray(tenants) || !apiutil.isNotEmptyArray(tenants)){
		tenants = null;
	}

	let	processed = false;

	//------------------------------
	// set(update) all field / update verify field
	//------------------------------
	if(is_create || null !== verify){
		//
		// [NOTE]
		// initService() === updateServiceVerify()
		//
		const	ini_result = k2hr3.initService(owner, servicename, verify);
		if(!apiutil.isPlainObject(ini_result) || !apiutil.isBoolean(ini_result.result) || false === ini_result.result){
			let	error: Error | null = null;
			if(!apiutil.isPlainObject(ini_result)){
				error = new Error('Could not get response from initService');
			}else{
				if(!apiutil.isString(ini_result.message)){
					error = new Error('Could not get error message in response from initService');
				}
			}
			return error;
		}
		processed = true;
	}

	//------------------------------
	// add tenants
	//------------------------------
	const	allowtenants: string[]	= (apiutil.isStringArray(tenants) && apiutil.isNotEmptyArray(tenants)) ? tenants : [];
	const	denytenants: string[]	= [];
	if(is_clear || apiutil.isNotEmptyArray(allowtenants)){
		// get all service data
		const	allres = k2hr3.getService(owner, servicename);
		if(!apiutil.isPlainObject(allres) || !apiutil.isBoolean(allres.result) || false === allres.result){
			let	error: Error;
			if(!apiutil.isPlainObject(allres)){
				error = new Error('Could not get response from getService');
			}else{
				if(!apiutil.isString(allres.message)){
					error = new Error('Could not get error message in response from getService');
				}else{
					error = new Error(apiutil.getSafeString(allres.message));
				}
			}
			return error;
		}

		// check
		if(allres.service && k2hr3.isDkcTypeServiceRawValue(allres.service) && apiutil.isStringArray(allres.service.tenant)){
			const	keys = r3keys(null, owner, null);
			for(let cnt = 0; cnt < allres.service.tenant.length; ++cnt){
				let	found = false;
				for(let cnt2 = 0; cnt2 < allowtenants.length; ++cnt2){
					if(apiutil.compareCaseString(allres.service.tenant[cnt], allowtenants[cnt2])){
						// cut already existing tenant
						allowtenants.splice(cnt2, 1);
						found = true;
						break;
					}
				}
				if(!found){
					// does not remove owner tenant
					if(!apiutil.compareCaseString(allres.service.tenant[cnt], keys.MASTER_TENANT_TOP_KEY)){
						// add new deny tenant
						denytenants.push(allres.service.tenant[cnt]);
					}
				}
			}
		}
	}

	// add new allow tenants
	for(let cnt = 0; cnt < allowtenants.length; ++cnt){
		const	addtenant = rawGetTenantNameFromYrn(allowtenants[cnt]);
		if(!apiutil.isSafeString(addtenant)){
			const	error = new Error('To allow Tenant name(' + allowtenants[cnt] + ') is something wrong.');
			return error;
		}

		const	allow_result = k2hr3.allowTenantToService(owner, servicename, addtenant);
		if(!apiutil.isPlainObject(allow_result) || !apiutil.isBoolean(allow_result.result) || false === allow_result.result){
			let	error: Error;
			if(!apiutil.isPlainObject(allow_result)){
				error = new Error('Could not get response from allowTenantToService');
			}else{
				error = new Error('Could not get error message in response from allowTenantToService');
			}
			return error;
		}
		processed = true;
	}

	// remove new deny tenants
	if(is_clear && apiutil.isNotEmptyArray(denytenants)){
		for(let cnt = 0; cnt < denytenants.length; ++cnt){
			const	denytenant = rawGetTenantNameFromYrn(denytenants[cnt]);
			if(!apiutil.isSafeString(denytenant)){
				const	error = new Error('To allow Tenant name(' + denytenants[cnt] + ') is something wrong.');
				return error;
			}

			const	deny_result = k2hr3.denyTenantFromService(owner, servicename, denytenant);
			if(!apiutil.isPlainObject(deny_result) || !apiutil.isBoolean(deny_result.result) || false === deny_result.result){
				let	error: Error;
				if(!apiutil.isPlainObject(deny_result)){
					error = new Error('Could not get response from denyTenantToService');
				}else{
					error = new Error('Could not get error message in response from denyTenantToService');
				}
				return error;
			}
			processed = true;
		}
	}

	if(!processed){
		const	error = new Error('Internal error: rawUpdateService');
		return error;
	}

	r3logger.dlog('succeed');
	return null;
};

//
// Mountpath					: '/v1/service'
//
// POST '/v1/service'			: post service on version 1
// HEADER						: X-Auth-Token	=>	Scoped User token
// response body				: result		=>	true/false
//								  message		=>	messages
// body							: 
//	{
//		"name":		<service name>				=>	key is "yrn:yahoo::::service:<service>"
//		"verify":	<verify url>				=>	key is "yrn:yahoo::::service:<service>:verify"
//													when the value is URL, it is save as URL string.
//													the value is allowed null or undefined, then verify url value is null.
//													the value is allowed string(not URL), it is saved and converted by JSON.
//	}
//
// POST '/v1/service/<service>'	: post tenant or verify for service on version 1
// HEADER						: X-Auth-Token	=>	Scoped User token
// response body				: result		=>	true/false
//								  message		=>	messages
// body							: 
//	{
//		"tenant":		<tenant name> or array	=>	key is "yrn:yahoo::::service:<service>:tenant"
//													if this key is specified, adding tenants to service
//													the value is string for tenant name, or array of tenant name list
//		"clear_tenant":	true/false				=>	true means clear existing tenant without "tenant".
//													default false
//		"verify":		<verify url>			=>	key is "yrn:yahoo::::service:<service>:verify"
//													if this key is specified, updating verify url.
//													when the value is URL, it is save as URL string.
//													the value is allowed string(not URL), it is saved and converted by JSON.
//		}
//	}
//
// [NOTE]
// Verify URL is used as following formatted:
//
//	GET http://<verify host[:port]>{/<path>}?service=<service name>&tenant=<tenant name>&tenantid=<tenant id>&user=<user name>&userid=<user id>
//
//	service		: service name
// 	tenant		: tenant name
//	tenantid	: tenant id
//	user		: user name
//	userid		: user id
//
// And it's response is following:
//	response body	= [							=>	undefined/null or resource array(if one element, allows only it not array)
//		{
//			name								=>	resource name which is key name(path) for resource
//			expire								=>	undefined/null or integer
//			type								=>	resource data type(string or object), if date is null or '', this value must be string.
//			data								=>	resource data which must be string or object or null/undefined.
//			keys = {							=>	resource has keys(associative array), or null/undefined.
//				'foo':	bar,					=>		any value is allowed
//				...
//			}
//		},
//		...
//	]
//
router.post('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) 		||
		!apiutil.isSafeString(req.baseUrl)	||
		!apiutil.isPlainObject(req.body)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST body does not exist'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);		// scoped, user token
	if(!token_result.result){
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info = token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check service path in url
	//------------------------------
	let		is_create: boolean;
	let		name: string | null	= null;
	const	requestptn			= new RegExp('^/v1/service/(.*)');		// regex = /^\/v1\/service\/(.*)/
	const	reqmatchs			= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		is_create	= true;
	}else{
		name		= reqmatchs[1].toLowerCase();
		is_create	= false;
	}

	//------------------------------
	// check arguments
	//------------------------------
	let	verify: valTypeAll		= null;
	let	tenant: string[] | null	= null;
	let	is_clear: boolean		= false;
	if(is_create){
		if(!apiutil.isSafeString(req.body.name)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'service:name field is wrong : ' + JSON.stringify(req.body.name)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		name		= req.body.name.toLowerCase();
		if(apiutil.isValTypeAll(req.body.verify)){
			verify = req.body.verify;
		}

	}else{
		if(apiutil.isSafeString(req.body.tenant)){
			const	tenant_tmp = req.body.tenant;
			if(apiutil.checkSimpleJSON(tenant_tmp)){
				const	tenant_raw = JSON.parse(tenant_tmp);
				if(apiutil.isStringArray(tenant_raw)){
					tenant = [];
					for(let cnt = 0; cnt < tenant_raw.length; ++cnt){
						tenant.push(tenant_raw[cnt].toLowerCase());
					}
				}else if(apiutil.isSafeString(tenant_raw)){
					tenant = [tenant_raw.toLowerCase()];
				}else{
					tenant = null;
				}
			}else{
				tenant = [tenant_tmp.toLowerCase()];
			}
			if(!apiutil.isNotEmptyArray(tenant)){
				tenant = null;
			}
		}
		if(apiutil.isBoolean(req.body.clear_tenant) && true === req.body.clear_tenant){
			is_clear = true;
		}
		if(apiutil.isValTypeAll(req.body.verify)){
			verify = req.body.verify;
		}
		if(null === tenant && null === verify){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'both tenant and verify are not specified.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	//------------------------------
	// create/update service
	//------------------------------
	const	error = rawUpdateService((token_info.tenant ?? null), name, verify, tenant, is_clear, is_create);
	if(null !== error){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	error.message
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		return;
	}

	const	success_result: resTypeBaseResult = { result: true, message: null };
	res.status(201);													// 201: Created
	res.send(JSON.stringify(success_result));
});

//
// Mountpath					: '/v1/service/*'
//
// PUT '/v1/service'			: post service on version 1
// HEADER						: X-Auth-Token		=>	Scoped User token
// response body				: result			=>	true/false
//								  message			=>	messages
// URL argument
//		"name"					: <service name>	=>	key is "yrn:yahoo::::service:<service>"
//		"verify"				: <verify url>		=>	key is "yrn:yahoo::::service:<service>:verify"
//														when the value is URL, it is save as URL string.
//														the value is allowed null or undefined, then verify url value is null.
//														the value is allowed string(not URL), it is saved and converted by JSON.
//
// PUT '/v1/service/<service>'	: post tenant or verify for service on version 1
// HEADER						: X-Auth-Token		=>	Scoped User token
// response body				: result			=>	true/false
//								  message			=>	messages
// URL argument
//		"tenant"				: <tenant name> 	=>	key is "yrn:yahoo::::service:<service>:tenant"
//														if this key is specified, adding tenants to service
//														the value is string for tenant name of tenant name list
//		"clear_tenant"			: true/false		=>	true means clear existing tenant without "tenant".
//														default false
//		"verify"				: <verify url>		=>	key is "yrn:yahoo::::service:<service>:verify"
//														when the value is URL, it is save as URL string.
//														the value is allowed string(not URL), it is saved and converted by JSON.
//
// [NOTE] see POST
//
router.put('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) 		||
		!apiutil.isSafeString(req.baseUrl)	||
		!apiutil.isPlainObject(req.query)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT argument does not have any data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);		// scoped, user token
	if(!token_result.result){
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info = token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check service path in url
	//------------------------------
	let		is_create: boolean;
	let		name: string | null	= null;
	const	requestptn			= new RegExp('^/v1/service/(.*)');		// regex = /^\/v1\/service\/(.*)/
	const	reqmatchs			= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		is_create	= true;
	}else{
		name		= reqmatchs[1].toLowerCase();
		is_create	= false;
	}

	//------------------------------
	// check arguments
	//------------------------------
	let	verify: valTypeAll		= null;
	let	tenant: string[] | null	= null;
	let	is_clear: boolean		= false;
	if(is_create){
		if(!apiutil.isSafeString(req.query.name)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'name argument is wrong : ' + JSON.stringify(req.query.name)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		name		= req.query.name.toLowerCase();
		if(apiutil.isValTypeAll(req.query.verify)){
			if(apiutil.isString(req.query.verify) && apiutil.checkSimpleJSON(req.query.verify)){
				const	tmp_verify = JSON.parse(req.query.verify);
				if(apiutil.isValTypeAll(tmp_verify)){
					verify = tmp_verify;
				}
			}else{
				verify = req.query.verify;
			}
		}

	}else{
		if(apiutil.isSafeString(req.query.tenant)){
			const	tenant_tmp = req.query.tenant;
			if(apiutil.checkSimpleJSON(tenant_tmp)){
				const	tenant_raw = JSON.parse(tenant_tmp);
				if(apiutil.isStringArray(tenant_raw)){
					tenant = [];
					for(let cnt = 0; cnt < tenant_raw.length; ++cnt){
						tenant.push(tenant_raw[cnt].toLowerCase());
					}
				}else if(apiutil.isSafeString(tenant_raw)){
					tenant = [tenant_raw.toLowerCase()];
				}else{
					tenant = null;
				}
			}else{
				tenant = [tenant_tmp.toLowerCase()];
			}
			if(!apiutil.isNotEmptyArray(tenant)){
				tenant = null;
			}
		}
		if(	(apiutil.isBoolean(req.query.clear_tenant) && true === req.query.clear_tenant)	||
			(apiutil.isSafeString(req.query.clear_tenant) && (apiutil.compareCaseString('true', req.query.clear_tenant) || apiutil.compareCaseString('1', req.query.clear_tenant))) )
		{
			is_clear = true;
		}
		if(apiutil.isValTypeAll(req.query.verify)){
			if(apiutil.isString(req.query.verify) && apiutil.checkSimpleJSON(req.query.verify)){
				const	tmp_verify = JSON.parse(req.query.verify);
				if(apiutil.isValTypeAll(tmp_verify)){
					verify = tmp_verify;
				}
			}else{
				verify = req.query.verify;
			}
		}
		if(null === tenant && null === verify){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'both tenant and verify are not specified.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	//------------------------------
	// create/update service
	//------------------------------
	const	error = rawUpdateService((token_info.tenant ?? null), name, verify, tenant, is_clear, is_create);
	if(null !== error){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	error.message
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		return;
	}

	const	success_result: resTypeBaseResult = { result: true, message: null };
	res.status(201);													// 201: Created
	res.send(JSON.stringify(success_result));
});

//
// Mountpath					: '/v1/service/*'
//
// GET '/v1/service/<service>'	: get service on version 1
// HEADER						: X-Auth-Token	=> Scoped User token
// response body				: result	=> true/false
//								  message	=> error message
//								  service	=> object
// service object
//		{
//			"verify":	<verify url> or <verify object>
//			"tenant":	[
//				<tenant yrn full path>,
//				...
//			]
//		}
//
router.get('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeGetService = {
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
	const	token_result = r3tokens.checkToken(req, true, true);		// scoped, user token
	if(!token_result.result){
		const	result: resTypeGetService = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info = token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check service path in url
	//------------------------------
	const	requestptn	= new RegExp('^/v1/service/(.*)');				// regex = /^\/v1\/service\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeGetService = {
			result: 	false,
			message:	'GET request url does not have service name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// get all service
	//------------------------------
	const	allres = k2hr3.getService(token_info.tenant, servicename);
	if(!apiutil.isPlainObject(allres) || !k2hr3.isDkcTypeServiceRawValue(allres.service) || !apiutil.isBoolean(allres.result) || false === allres.result){
		if(!apiutil.isPlainObject(allres)){
			const	result: resTypeGetService = {
				result: 	false,
				message:	'Could not get service data from getService'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		}else{
			const	result: resTypeGetService = {
				result: 	apiutil.isBoolean(allres.result) ? allres.result : false,
				message:	apiutil.isString(allres.message) ? allres.message : 'Could not get error message in response from getService'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		}
		return;
	}

	//
	// Remove owner/name from result
	//
	r3logger.dlog('succeed : ' + allres.message);

	const	service_info: valTypeServiceTenantVerify = {
		verify:		allres.service.verify,
		tenant:		allres.service.tenant
	};
	const	success_result: resTypeGetService = {
		result: 	true,
		message:	null,
		service:	service_info
	};

	res.status(200);													// 200: OK
	res.send(JSON.stringify(success_result));
});

//
// Mountpath					: '/v1/service/*'
//
// HEAD '/v1/service/<service>'	: head service on version 1
// HEADER						: X-Auth-Token	=> Scoped User token
//
// HEAD '/v1/service/<service>'	: head tenant is allowed in service's tenant list on version 1
// HEADER						: X-Auth-Token	=> Scoped User token
// URL argument					:
//		"tenant"				: <tenant name> =>	key is "yrn:yahoo::::service:<service>:tenant"
//													if this key is specified, check tenant is allowed.
//
router.head('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	if('HEAD' !== req.method){
		// If other method request comes here, so it should be routed another function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'HEAD request or url or query is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);		// scoped, user token
	if(!token_result.result){
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info = token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check service path in url
	//------------------------------
	const	requestptn	= new RegExp('^/v1/service/(.*)');				// regex = /^\/v1\/service\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request url does not have service name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// check arguments
	//------------------------------
	let	tenantyrn: string | null = null;
	if(apiutil.isSafeString(req.query.tenant)){
		const	keys	= r3keys(null, req.query.tenant.toLowerCase(), null);
		tenantyrn		= keys.MASTER_TENANT_TOP_KEY;					// tenant full yrn : "yrn:yahoo:::<tenant>"
	}

	//------------------------------
	// get all service
	//------------------------------
	const	allres = k2hr3.getService(token_info.tenant, servicename);
	if(!apiutil.isPlainObject(allres) || !apiutil.isBoolean(allres.result) || false === allres.result){
		if(!apiutil.isSafeEntity(allres)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get service data from getService'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	apiutil.isBoolean(allres.result) ? allres.result : false,
				message:	apiutil.isString(allres.message) ? allres.message : 'Could not get error message in response from getService'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
		}
		return;
	}

	if(apiutil.isSafeString(tenantyrn)){
		// tenant check
		if(!k2hr3.isDkcTypeServiceRawValue(allres.service) || !apiutil.isStringArray(allres.service.tenant) || !apiutil.findStringInArray(allres.service.tenant, tenantyrn)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Deny tenant(' + apiutil.getSafeString(req.query.tenant).toLowerCase() + ') for service(' + servicename + ')'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403);							// 403: Forbidden(is this status OK?)
			return;
		}
	}

	r3logger.dlog('succeed : ' + apiutil.getSafeString(allres.message));
	res.status(204);													// 204: No Content
	res.send();
});

//
// Mountpath						: '/v1/service/*'
//
// DELETE '/v1/service/<service>'	: delete service on version 1
//									  remove service and all related to service.
// HEADER							: X-Auth-Token	=> Scoped User token
//
// DELETE '/v1/service/<service>'	: delete tenant from service's tenant list on version 1
// HEADER							: X-Auth-Token	=> Scoped User token
// URL argument						:
//		"tenant"					: <tenant name> =>	key is "yrn:yahoo::::service:<service>:tenant"
//														if this key is specified, removing tenant from service
//
router.delete('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'DELETE request or url or query is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);		// scoped, user token
	if(!token_result.result){
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, token_result.status, result);
		return;
	}

	const	token_info = token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check service path in url
	//------------------------------
	const	requestptn	= new RegExp('^/v1/service/(.*)');				// regex = /^\/v1\/service\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'DELETE request url does not have service name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	const	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// check arguments
	//------------------------------
	let	tenantname: string | null = null;
	if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.tenant)){
		tenantname	= req.query.tenant.toLowerCase();
	}
	const strRemoveType = apiutil.isSafeString(tenantname) ? 'denyTenantFromService' : 'removeService';

	//------------------------------
	// Do remove
	//------------------------------
	let	rm_result: resTypeBaseResult | null;
	if(null === tenantname){
		// remove service and all
		rm_result = k2hr3.removeService(token_info.tenant, servicename);
	}else{
		// remove tenant from service's tenant list
		rm_result = k2hr3.removeServiceTenant(token_info.user, tenantname, servicename);
	}
	if(!apiutil.isPlainObject(rm_result) || !apiutil.isBoolean(rm_result.result) || false === rm_result.result){
		if(!apiutil.isPlainObject(rm_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not remove service data from ' + strRemoveType
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403);							// 403: Forbidden(is this status OK?)
		}else{
			const	result: resTypeBaseResult = {
				result: 	apiutil.isBoolean(rm_result.result) ? rm_result.result : false,
				message:	apiutil.isString(rm_result.message) ? rm_result.message : 'Could not get error message in response from ' + strRemoveType
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403);							// 403: Forbidden(is this status OK?)
		}
		return;
	}

	r3logger.dlog('succeed : ' + apiutil.getSafeString(rm_result.message));
	res.status(204);													// 204: No Content
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
	valTypeServiceTenantVerify,
	resTypeGetService
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
