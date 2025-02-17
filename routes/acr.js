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

'use strict';

var express	= require('express');
var router	= express.Router();

var	r3token	= require('../lib/k2hr3tokens');
var	apiutil	= require('../lib/k2hr3apiutil');
var	resutil	= require('../lib/k2hr3resutil');
var	k2hr3	= require('../lib/k2hr3dkc');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Common utility function
//
// Create or update service
//
// Result			null(succeed) or error message(failed)
//
function rawCreateServiceTenant(token_info, token, tenantname, servicename, callback)
{
	var	error = null;
	if(!apiutil.isSafeEntity(callback) || 'function' !== typeof callback){
		error = new Error('callback parameter is wrong : callback=' + JSON.stringify(callback));
		r3logger.elog(error.message);
		return;
	}

	//
	// Check service name
	//
	if(!apiutil.isSafeString(servicename)){
		error = new Error('service name is wrong.');
		r3logger.elog(error.message);
		callback(error, false);
		return;
	}

	//
	// Check token
	//
	if(	!apiutil.isSafeString(token)				||
		!apiutil.isSafeEntity(token_info)			||
		!apiutil.isSafeEntity(token_info.scoped)	||
		'boolean' !== typeof token_info.scoped		||
		!apiutil.isSafeString(token_info.user)		)
	{
		error = new Error('specified wrong token or it is not scoped or no tenant.');
		r3logger.elog(error.message);
		callback(error, false);
		return;
	}
	var	user = apiutil.isSafeString(token_info.user) ? token_info.user : null;

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
		k2hr3.createServiceTenantByUnscopedToken(tenantname, servicename, token, user, callback);
	}
	return;
}

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
router.post('/', function(req, res, next)								// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result = { result: true, message: null };
	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		result = {
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
	var	token_result = r3token.checkToken(req, false, true);			// (un)scoped user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info = token_result.token_info;
	var	tenantname = null;

	if(false === token_info.scoped){
		//
		// Unscoped user token : need tenant parameter
		//
		if(	!apiutil.isSafeEntity(req.body)			||
			!apiutil.isSafeString(req.body.tenant)	)
		{
			result = {
				result: 	false,
				message:	'Specified unscoped user token, but there is not tenant in body data.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// get user's tenant list
		var	tenant_list = r3token.getTenantList(token_info.user);
		if(null === tenant_list || apiutil.isEmptyArray(tenant_list)){
			result = {
				result: 	false,
				message:	'token(' + token_result.token + ') for user (' + token_info.user + ') does not have any tenant.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// check tenant
		if(!r3token.checkTenantInTenantList(tenant_list, req.body.tenant.toLowerCase())){
			result = {
				result: 	false,
				message:	'user (' + token_info.user + ') is not member of tenant(' + req.body.tenant + ').'
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
		if(	apiutil.isSafeEntity(req.body)			&&
			apiutil.isSafeString(req.body.tenant)	)
		{
			if(!apiutil.compareCaseString(token_info.tenant, req.body.tenant)){
				result = {
					result: 	false,
					message:	'Specified scoped user token and tenant in body data, but these are not same tenant name.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);				// 400: Bad Request
				return;
			}
		}
		tenantname = token_info.tenant;
	}

	//------------------------------
	// check service path in url
	//------------------------------
	var	requestptn	= new RegExp('^/v1/acr/(.*)');						// regex = /^\/v1\/acr\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result = {
			result: 	false,
			message:	'POST request url does not have service name'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	servicename		= reqmatchs[1].toLowerCase();

	//------------------------------
	// create service + tenant
	//------------------------------
	rawCreateServiceTenant(token_info, token_result.token, tenantname, servicename, function(error)
	{
		var	resobj = { result: true, message: null };
		if(null !== error){
			resobj = {
				result: 	false,
				message:	error.message
			};
			r3logger.elog(resobj.message);
			resutil.errResponse(req, res, 403, resobj);					// 403: Forbidden(is this status OK?)
			return;
		}
		res.status(201);												// 201: Created
		res.send(JSON.stringify(resobj));
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
router.put('/', function(req, res, next)								// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result = { result: true, message: null };
	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		result = {
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
	var	token_result = r3token.checkToken(req, false, true);			// (un)scoped user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info = token_result.token_info;
	var	tenantname = null;

	if(false === token_info.scoped){
		//
		// Unscoped user token : need tenant parameter
		//
		if(	!apiutil.isSafeEntity(req.query)			||
			!apiutil.isSafeString(req.query.tenant)	)
		{
			result = {
				result: 	false,
				message:	'Specified unscoped user token, but there is not tenant in argument.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// get user's tenant list
		var	tenant_list = r3token.getTenantList(token_info.user);
		if(null === tenant_list || apiutil.isEmptyArray(tenant_list)){
			result = {
				result: 	false,
				message:	'token(' + token_result.token + ') for user (' + token_info.user + ') does not have any tenant.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// check tenant
		if(!r3token.checkTenantInTenantList(tenant_list, req.query.tenant.toLowerCase())){
			result = {
				result: 	false,
				message:	'user (' + token_info.user + ') is not member of tenant(' + req.query.tenant + ').'
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
		if(	apiutil.isSafeEntity(req.body)			&&
			apiutil.isSafeString(req.body.tenant)	)
		{
			if(!apiutil.compareCaseString(token_info.tenant, req.body.tenant)){
				result = {
					result: 	false,
					message:	'Specified scoped user token and tenant in body data, but these are not same tenant name.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);				// 400: Bad Request
				return;
			}
		}
		tenantname = token_info.tenant;
	}

	//------------------------------
	// check service path in url
	//------------------------------
	var	requestptn	= new RegExp('^/v1/acr/(.*)');						// regex = /^\/v1\/acr\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result = {
			result: 	false,
			message:	'PUT request url does not have service name'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	servicename		= reqmatchs[1].toLowerCase();

	//------------------------------
	// create service + tenant
	//------------------------------
	rawCreateServiceTenant(token_info, token_result.token, tenantname, servicename, function(error)
	{
		var	resobj = { result: true, message: null };
		if(null !== error){
			resobj = {
				result: 	false,
				message:	error.message
			};
			r3logger.elog(resobj.message);
			resutil.errResponse(req, res, 403, resobj);					// 403: Forbidden(is this status OK?)
			return;
		}
		res.status(201);												// 201: Created
		res.send(JSON.stringify(resobj));
	});
});

//
// Utility function for getting Service/Tenant Names
//
function rawGetServiceTenantNames(req, res)
{
	var	result;
	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		result = {
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
	var	token_result = r3token.checkToken(req, true, true);				// scoped user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info	= token_result.token_info;

	//
	// force remove user token(this is one shot!)
	//
	r3token.removeScopedUserToken(token_result.token);

	//------------------------------
	// check service path in url
	//------------------------------
	var	requestptn	= new RegExp('^/v1/acr/(.*)');						// regex = /^\/v1\/acr\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result = {
			result: 	false,
			message:	'PUT request url does not have service name'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// check tenant in service's tenant list
	//------------------------------
	result = k2hr3.checkTenantInService(servicename, token_info.tenant);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get service data from checkTenantInService'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from checkTenantInService';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		return;
	}

	//------------------------------
	// make result
	//------------------------------
	var	tokeninfo = {
		user:		token_info.user,
		tenant:		token_info.tenant,
		service:	servicename
	};
	result = {
		result: 	true,
		message:	null,
		tokeninfo:	tokeninfo
	};

	r3logger.dlog('succeed');
	res.status(200);													// 200: OK
	res.send(JSON.stringify(result));
}

//
// Utility function for getting Service/Tenant Resources
//
function rawGetServiceTenantResources(req, res)
{
	var	result;

	//------------------------------
	// check request
	//------------------------------
	var	sip		= apiutil.getClientIpAddress(req);
	if(	!apiutil.isSafeEntity(req)				||
		!apiutil.isSafeString(req.baseUrl)		||
		!apiutil.isSafeEntity(req.query)		||
		!apiutil.isSafeString(req.query.cip)	||
		!apiutil.isSafeString(sip)				||
		!apiutil.isSafeString(req.query.crole)	||
		!apiutil.isSafeString(req.query.srole)	)
	{
		result = {
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
	var	cport	= apiutil.isSafeEntity(req.query.cport) ? apiutil.isSafeString(req.query.cport) ? !isNaN(req.query.cport) ? parseInt(req.query.cport) : req.query.cport : req.query.cport : null;
	var	sport	= apiutil.isSafeEntity(req.query.sport) ? apiutil.isSafeString(req.query.sport) ? !isNaN(req.query.sport) ? parseInt(req.query.sport) : req.query.sport : req.query.sport : null;

	//------------------------------
	// cuk parameters
	//------------------------------
	var	ccuk	= apiutil.isSafeEntity(req.query.ccuk) ? req.query.ccuk : null;
	var	scuk	= apiutil.isSafeEntity(req.query.scuk) ? req.query.scuk : null;

	//------------------------------
	// check service path in url
	//------------------------------
	var	requestptn	= new RegExp('^/v1/acr/(.*)');						// regex = /^\/v1\/acr\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result = {
			result: 	false,
			message:	'PUT request url does not have service name'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	servicename	= reqmatchs[1].toLowerCase();

	//------------------------------
	// Get ACR resources
	//------------------------------
	result = k2hr3.getServiceTenantResources(servicename, sip, sport, scuk, req.query.srole, req.query.cip, cport, ccuk, req.query.crole);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get ACR resources from getServiceTenantResources'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from getServiceTenantResources';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403, result);						// 403: Forbidden(is this status OK?)
		return;
	}

	r3logger.dlog('succeed : ' + JSON.stringify(result));
	res.status(200);													// 200: OK
	res.send(JSON.stringify(result));
}

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
router.get('/', function(req, res, next)
{
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
	if(r3token.hasAuthTokenHeader(req)){
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
router.delete('/', function(req, res, next)								// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req)			||
		!apiutil.isSafeEntity(req.baseUrl)	)
	{
		result = {
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
	var	token_result = r3token.checkToken(req, true, true);				// scoped user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	// Check token
	if(	!apiutil.isSafeString(token_result.token_info.tenant)	||
		!apiutil.isSafeString(token_result.token_info.user)		)
	{
		result = {
			result: 	false,
			message:	'specified wrong token or it is not scoped user token'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	tenantname	= token_result.token_info.tenant;
	var	user		= token_result.token_info.user;

	//------------------------------
	// check service path in url
	//------------------------------
	var	requestptn	= new RegExp('^/v1/acr/(.*)');						// regex = /^\/v1\/acr\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result = {
			result: 	false,
			message:	'DELETE request url does not have service name'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	servicename		= reqmatchs[1].toLowerCase();

	//------------------------------
	// remove service + tenant
	//------------------------------
	result = k2hr3.removeServiceTenant(user, tenantname, servicename);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from removeServiceTenant'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from removeServiceTenant';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403);							// 403: Forbidden(is this status OK?)
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(204);												// 204: No Content
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
