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

//
// Common utility function
//
// Convert tenant yrn path to tenant name
//
function rawGetTenantNameFromYrn(tenant)
{
	if(!apiutil.isSafeString(tenant)){
		return null;
	}
	var	keys	= r3keys();
	var	yrnptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_MAIN);						// regex = /^yrn:yahoo:(.*)::(.*)/
	var	matches	= tenant.match(yrnptn);
	if(apiutil.isEmptyArray(matches) || matches.length < 3){
		// not match tenant yrn, then return original tenant
		return tenant;
	}
	tenant = matches[2];															// tenant name
	if(!apiutil.isSafeString(tenant)){
		return null;
	}
	return tenant;
}

//
// Common utility function
//
// Create or update service
//
// Result				null(succeed) or error message(failed)
//
function rawUpdateService(owner, servicename, verify, tenants, is_clear, is_create)
{
	var	error = null;
	var	result= null;
	if(!apiutil.isSafeString(owner) || !apiutil.isSafeString(servicename)){
		error = new Error('Internal error: rawUpdateService');
		return error;
	}
	if(!apiutil.isSafeEntity(verify)){
		verify = null;
	}
	if(apiutil.isEmptyArray(tenants)){
		tenants = null;
	}

	//------------------------------
	// set(update) all field / update verify field
	//------------------------------
	if(is_create || null !== verify){
		//
		// [NOTE]
		// initService() === updateServiceVerify()
		//
		result = k2hr3.initService(owner, servicename, verify);
		if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
			if(!apiutil.isSafeEntity(result)){
				error = new Error('Could not get response from initService');
			}else{
				if(!apiutil.isSafeEntity(result.message)){
					error = new Error('Could not get error message in response from initService');
				}
			}
			return error;
		}
	}

	//------------------------------
	// add tenants
	//------------------------------
	var	allowtenants= !apiutil.isEmptyArray(tenants) ? tenants : [];
	var	denytenants	= [];
	var	cnt;
	if(is_clear || !apiutil.isEmptyArray(allowtenants)){
		// get all service data
		var	allres = k2hr3.getService(owner, servicename);
		if(!apiutil.isSafeEntity(allres) || !apiutil.isSafeEntity(allres.result) || false === allres.result){
			if(!apiutil.isSafeEntity(allres)){
				error = new Error('Could not get response from getService');
			}else{
				if(!apiutil.isSafeEntity(allres.message)){
					error = new Error('Could not get error message in response from getService');
				}else{
					error = new Error(allres.message);
				}
			}
			return error;
		}
		// check
		if(apiutil.isSafeEntity(allres.service) && apiutil.isArray(allres.service.tenant)){
			var	keys = r3keys(null, owner, null);
			var	cnt2;
			var	found;
			for(cnt = 0; cnt < allres.service.tenant.length; ++cnt){
				found = false;
				for(cnt2 = 0; cnt2 < allowtenants.length; ++cnt2){
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
	for(cnt = 0; cnt < allowtenants.length; ++cnt){
		var	addtenant = rawGetTenantNameFromYrn(allowtenants[cnt]);
		if(null === addtenant){
			error = new Error('To allow Tenant name(' + allowtenants[cnt] + ') is something wrong.');
			return error;
		}
		result = k2hr3.allowTenantToService(owner, servicename, addtenant);
		if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
			if(!apiutil.isSafeEntity(result)){
				error = new Error('Could not get response from allowTenantToService');
			}else{
				error = new Error('Could not get error message in response from allowTenantToService');
			}
			return error;
		}
	}
	// remove new deny tenants
	if(is_clear && !apiutil.isEmptyArray(denytenants)){
		for(cnt = 0; cnt < denytenants.length; ++cnt){
			var	denytenant = rawGetTenantNameFromYrn(denytenants[cnt]);
			if(null === denytenant){
				error = new Error('To allow Tenant name(' + denytenants[cnt] + ') is something wrong.');
				return error;
			}
			result = k2hr3.denyTenantFromService(owner, servicename, denytenant);
			if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
				if(!apiutil.isSafeEntity(result)){
					error = new Error('Could not get response from denyTenantToService');
				}else{
					error = new Error('Could not get error message in response from denyTenantToService');
				}
				return error;
			}
		}
	}

	if(null === result){
		error = new Error('Internal error: rawUpdateService');
		return error;
	}
	r3logger.dlog('succeed : ' + result.message);
	return null;
}

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
router.post('/', function(req, res, next)								// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result = { result: true, message: null };
	if(	!apiutil.isSafeEntity(req) 			||
		!apiutil.isSafeEntity(req.baseUrl)	||
		!apiutil.isSafeEntity(req.body)		)
	{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'POST body does not exist'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info = token_result.token_info;

	//------------------------------
	// check service path in url
	//------------------------------
	var	name		= null;
	var	is_create	= false;
	var	requestptn	= new RegExp('^/v1/service/(.*)');					// regex = /^\/v1\/service\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		is_create	= true;
	}else{
		name		= reqmatchs[1].toLowerCase();
		is_create	= false;
	}

	//------------------------------
	// check arguments
	//------------------------------
	var	verify		= null;
	var	tenant		= null;
	var	is_clear	= false;
	var	cnt;
	if(is_create){
		if(!apiutil.isSafeString(req.body.name)){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'service:name field is wrong : ' + JSON.stringify(req.body.name)
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		name		= req.body.name.toLowerCase();
		if(apiutil.isSafeEntity(req.body.verify)){
			verify = req.body.verify;
		}

	}else{
		if(apiutil.isSafeEntity(req.body.tenant)){
			tenant = req.body.tenant;
			if(apiutil.checkSimpleJSON(tenant)){
				tenant = JSON.parse(tenant);
			}
			if(apiutil.isArray(tenant)){
				var	tmparr = [];
				for(cnt = 0; cnt < tenant.length; ++cnt){
					if(!apiutil.isSafeString(tenant[cnt])){
						continue;
					}
					tmparr.push(tenant[cnt].toLowerCase());
				}
				tenant = tmparr;
			}else if(apiutil.isSafeString(tenant)){
				tenant = [tenant.toLowerCase()];
			}else{
				tenant = null;
			}
			if(apiutil.isEmptyArray(tenant)){
				tenant = null;
			}
		}
		if(apiutil.isSafeEntity(req.body.clear_tenant) && 'boolean' === typeof req.body.clear_tenant && true === req.body.clear_tenant){
			is_clear = true;
		}
		if(apiutil.isSafeEntity(req.body.verify)){
			verify = req.body.verify;
		}
		if(null === tenant && null === verify){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'both tenant and verify are not specified.'
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	//------------------------------
	// create/update service
	//------------------------------
	var	error = rawUpdateService(token_info.tenant, name, verify, tenant, is_clear, is_create);
	if(null !== error){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	error.message
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		return;
	}
	res.status(201);													// 201: Created
	res.send(JSON.stringify(result));
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
router.put('/', function(req, res, next)								// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result = { result: true, message: null };
	if(	!apiutil.isSafeEntity(req) 			||
		!apiutil.isSafeEntity(req.baseUrl)	||
		!apiutil.isSafeEntity(req.query)	)
	{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'PUT argument does not have any data'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info = token_result.token_info;

	//------------------------------
	// check service path in url
	//------------------------------
	var	name		= null;
	var	is_create	= false;
	var	requestptn	= new RegExp('^/v1/service/(.*)');					// regex = /^\/v1\/service\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		is_create	= true;
	}else{
		name		= reqmatchs[1].toLowerCase();
		is_create	= false;
	}

	//------------------------------
	// check arguments
	//------------------------------
	var	verify		= null;
	var	tenant		= null;
	var	is_clear	= false;
	if(is_create){
		if(!apiutil.isSafeString(req.query.name)){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'name argument is wrong : ' + JSON.stringify(req.query.name)
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		name		= req.query.name.toLowerCase();
		if(apiutil.isSafeEntity(req.query.verify)){
			verify = req.query.verify;
			if(apiutil.checkSimpleJSON(verify)){
				verify = JSON.parse(verify);
			}
		}

	}else{
		if(apiutil.isSafeString(req.query.tenant)){
			tenant = req.query.tenant;
			if(apiutil.checkSimpleJSON(tenant)){
				tenant = JSON.parse(tenant);
			}
			if(apiutil.isArray(tenant)){
				var	tmparr = [];
				for(var cnt = 0; cnt < tenant.length; ++cnt){
					if(!apiutil.isSafeString(tenant[cnt])){
						continue;
					}
					tmparr.push(tenant[cnt].toLowerCase());
				}
				tenant = tmparr;
			}else if(apiutil.isSafeString(tenant)){
				tenant = [tenant.toLowerCase()];
			}else{
				tenant = null;
			}
			if(apiutil.isEmptyArray(tenant)){
				tenant = null;
			}
		}
		if(apiutil.isSafeEntity(req.query.clear_tenant)){
			if(	('boolean' === typeof req.query.clear_tenant && true === req.query.clear_tenant) ||
				(apiutil.isSafeString(req.query.clear_tenant) && (apiutil.compareCaseString('true', req.query.clear_tenant) || apiutil.compareCaseString('1', req.query.clear_tenant))) )
			{
				is_clear = true;
			}
		}
		if(apiutil.isSafeEntity(req.query.verify)){
			verify = req.query.verify;
			if(apiutil.checkSimpleJSON(verify)){
				verify = JSON.parse(verify);
			}
		}
		if(null === tenant && null === verify){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'both tenant and verify are not specified.'
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	//------------------------------
	// create/update service
	//------------------------------
	var	error = rawUpdateService(token_info.tenant, name, verify, tenant, is_clear, is_create);
	if(null !== error){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	error.message
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		return;
	}
	res.status(201);													// 201: Created
	res.send(JSON.stringify(result));
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
router.get('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'GET request or url is wrong'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info	= token_result.token_info;

	//------------------------------
	// check service path in url
	//------------------------------
	var	requestptn	= new RegExp('^/v1/service/(.*)');					// regex = /^\/v1\/service\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'GET request url does not have service name'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// get all service
	//------------------------------
	result = k2hr3.getService(token_info.tenant, servicename);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'Could not get service data from getService'
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from getService';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		return;
	}

	//
	// Remove owner/name from result
	//
	if(apiutil.isSafeEntity(result.name)){
		delete result.name;
	}
	if(apiutil.isSafeEntity(result.owner)){
		delete result.owner;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(200);													// 200: OK
	res.send(JSON.stringify(result));
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
router.head('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	if('HEAD' !== req.method){
		// If other method request comes here, so it should be routed another function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'HEAD request or url or query is wrong'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info	= token_result.token_info;

	//------------------------------
	// check service path in url
	//------------------------------
	var	requestptn	= new RegExp('^/v1/service/(.*)');					// regex = /^\/v1\/service\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'GET request url does not have service name'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// check arguments
	//------------------------------
	var	tenantyrn	= null;
	if(apiutil.isSafeString(req.query.tenant)){
		var	keys	= r3keys(null, req.query.tenant.toLowerCase(), null);
		tenantyrn	= keys.MASTER_TENANT_TOP_KEY;						// tenant full yrn : "yrn:yahoo:::<tenant>"
	}

	//------------------------------
	// get all service
	//------------------------------
	result = k2hr3.getService(token_info.tenant, servicename);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'Could not get service data from getService'
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from getService';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	if(null !== tenantyrn){
		// tenant check
		if(!apiutil.isSafeEntity(result.service) || !apiutil.isArray(result.service.tenant) || !apiutil.findStringInArray(result.service.tenant, tenantyrn)){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'Deny tenant(' + req.query.tenant.toLowerCase() + ') for service(' + servicename + ')'
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403);							// 403: Forbidden(is this status OK?)
			return;
		}
	}

	r3logger.dlog('succeed : ' + result.message);
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
router.delete('/', function(req, res, next)								// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'DELETE request or url or query is wrong'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info	= token_result.token_info;

	//------------------------------
	// check service path in url
	//------------------------------
	var	requestptn	= new RegExp('^/v1/service/(.*)');					// regex = /^\/v1\/service\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		result = {
					result: 	false,
					message:	'DELETE request url does not have service name'
				 };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// check arguments
	//------------------------------
	var	tenantname	= null;
	if(apiutil.isSafeString(req.query.tenant)){
		tenantname	= req.query.tenant.toLowerCase();
	}

	//------------------------------
	// Do remove
	//------------------------------
	if(null === tenantname){
		// remove service and all
		result = k2hr3.removeService(token_info.tenant, servicename);
	}else{
		// remove tenant from service's tenant list
		result = k2hr3.removeServiceTenant(token_info.user, tenantname, servicename);
	}
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			result = {
						result: 	false,
						message:	'Could not remove service data from ' + (null === tenantname ? 'removeService' : 'denyTenantFromService')
					 };
			/* eslint-enable indent, no-mixed-spaces-and-tabs */
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from ' + (null === tenantname ? 'removeService' : 'denyTenantFromService');
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403);								// 403: Forbidden(is this status OK?)
		return;
	}

	r3logger.dlog('succeed : ' + result.message);
	res.status(204);													// 204: No Content
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
