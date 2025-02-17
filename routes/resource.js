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
 * CREATE:   Wed Jun 8 2017
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
// Utility for parsing common input parameters
//
// This function parse token(user or role or not have this) from HTTP request(req),
// and role name/resource name(and yrn), etc.
// If request URI has resource name(path), do not specify default_resource_name value.
// The other hand, when default_resource_name is specified, the request URI can not
// have resource name(path) in it.
//
// return		:	{
//						res_obj:	{
//										result: 		true/false
//										message:		null or error message
//									},
//						res_code:						status code(default 200)
//						parameters:	{
//										token_type:		null or 'user' or 'role'
//										token_str:		token string(if user token or role token)
//										token_info:		null or object(returned from checkToken)
//										user_name:		null or user name(if user token)
//										tenant_name:	null or user name(if user token or role token)
//										keys:			k2hr3keys object
//										res_yrn:		target resource yrn
//										res_name:		target resource name
//										res_tenant:		resource's tenant
//										res_service:	resource's service when resource is full yrn, null when not full yrn 
//									}
//					}
//
function rawParseBaseParamRequestAPI(req, is_allow_service, default_resource_name)
{
	var	res_obj = {
		result:		true,
		message:	null
	};
	var	result = {
		res_obj:	res_obj,
		res_code:	200
	};
	var	parameters = {
		token_type:		null,
		token_str:		null,
		token_info:		null,
		user_name:		null,
		tenant_name:	null,
		keys:			null,
		res_yrn:		null,
		res_name:		null,
		res_tenant:		null,
		res_service:	null
	};

	//
	// check token for API mode
	//
	if(r3token.hasAuthTokenHeader(req)){
		var	token_result = r3token.checkToken(req, true);									// scoped, both token
		if(!token_result.result){
			result.res_obj.result	= token_result.result;
			result.res_obj.message	= token_result.message;
			result.res_code			= token_result.status;
			r3logger.elog(result.res_obj.message);
			return result;
		}
		parameters.token_str	= token_result.token;
		parameters.token_type	= token_result.token_type;
		parameters.token_info	= token_result.token_info;
		parameters.user_name	= apiutil.getSafeString(parameters.token_info.user);
		parameters.tenant_name	= apiutil.getSafeString(parameters.token_info.tenant).toLowerCase();
		parameters.keys			= r3keys(parameters.token_info.user, parameters.token_info.tenant);
	}else{
		parameters.keys			= r3keys();
	}

	//
	// check service parameter in request
	//
	var	service_param = null;
	if(is_allow_service){
		if(apiutil.compareCaseString('POST', req.method)){
			if(apiutil.isSafeEntity(req.body) && apiutil.isSafeString(req.body.service)){
				service_param = apiutil.getSafeString(req.body.service).trim();
			}
		}else{
			if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.service)){
				service_param = apiutil.getSafeString(req.query.service).trim();
			}
		}
	}

	//
	// get resource full yrn
	//
	var	requestptn	= new RegExp('^/v1/resource/(.*)');										// regex = /^\/v1\/resource\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		if(!apiutil.isSafeString(default_resource_name)){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Default resource name is not specified or wrong value : ' + JSON.stringify(default_resource_name);
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		parameters.res_yrn = apiutil.getSafeString(default_resource_name);
	}else{
		parameters.res_yrn = reqmatchs[1];
	}
	parameters.res_yrn = parameters.res_yrn.toLowerCase();

	//
	// make resource name from resource yrn
	//
	var	nameptn		= new RegExp('^' + parameters.keys.MATCH_ANY_TENANT_RESOURCE);			// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	var	namematchs	= parameters.res_yrn.match(nameptn);
	if(apiutil.isEmptyArray(namematchs) || namematchs.length < 4){
		// res_yrn is not full yrn to resource, then check wrong resource name
		nameptn		= new RegExp('^' + parameters.keys.NO_TENANT_KEY);						// regex = /^yrn:yahoo:/
		if(parameters.res_yrn.match(nameptn)){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query has wrong yrn full path to resource';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// no token need full yrn to resource(other token has tenant name)
		if(null === parameters.token_type){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query does not have yrn full path to resource';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// make resource yrn from resource name(sometimes, a case of user token come here.)
		parameters.res_name		= parameters.res_yrn;
		parameters.res_tenant	= parameters.tenant_name;									// resource is only name, then resource's tenant is same.
		parameters.res_service	= apiutil.isSafeString(service_param) ? service_param.toLowerCase() : null;

		parameters.keys			= r3keys(parameters.token_info.user, parameters.res_tenant, parameters.res_service);
		parameters.res_yrn		= parameters.keys.RESOURCE_TOP_KEY + ':' + parameters.res_name;

	}else{
		// res_yrn is full yrn to resource, then need to check tenant name
		if(null !== parameters.token_type && !apiutil.compareCaseString(namematchs[2], apiutil.getSafeString(parameters.token_info.tenant))){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query has wrong yrn full path(tenant=' + namematchs[2] + ') to resource(tenant=' + apiutil.getSafeString(parameters.token_info.tenant) + ')';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// check service name
		if(apiutil.isSafeString(service_param) && !apiutil.compareCaseString(service_param, namematchs[1])){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query has service name(' + service_param + ') and path has service name(' + namematchs[1] + '), but both are not same service name.';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		parameters.res_name		= namematchs[3].toLowerCase();
		parameters.res_tenant	= namematchs[2].toLowerCase();								// resource is yrn, then resource's tenant is set from yrn.
		parameters.res_service	= namematchs[1].toLowerCase();								// resource is not yrn, then service is not specified.

		parameters.keys			= r3keys((apiutil.isSafeEntity(parameters.token_info) && apiutil.isSafeString(parameters.token_info.user) ? parameters.token_info.user : null), (apiutil.isSafeEntity(parameters.token_info) && apiutil.isSafeString(parameters.token_info.tenant) ? parameters.token_info.tenant : null), parameters.res_service);
	}

	// no error
	result.parameters = parameters;
	return result;
}

//
// Mountpath				: '/v1/resource'
//
// POST '/v1/resource'		: post resource on version 1
// HEADER					: X-Auth-Token	=> User token
// body						:	{
//									"resource":	{
//										"name":			<resource name>					=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																							<resource> can include '/' for hierarchical path
//										"type":			<data type>						=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/type"
//																							data type must be string or json.
//																							if data is null or not specified, this value is not used.
//										"data":			<resource data>					=>	value for "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																							data must be encoded by encodeURI, because data is allowed CR, control code etc.
//																							but nodejs is decodeURI automatically
//										"keys":			{foo: bar, ...}					=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/keys"
//																							specify any associative array(SSL certificate, host key, etc)
//																							if null or undefined is specified, not update this member in resource when this resource exists.
//																							if '' or string(JSON), this member is set into "keys".
//										"alias":		[<resource yrn full path>, ...]	=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/@"
//																							specify another resource as "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																							if null or undefined is specified, not update this member in resource when this resource exists.
//																							if '' or zero array, this member in resource is set empty array.
//									}
//								}
// response body			: 	{
//									result: 	true/false
//									message:	 messages
//								}
//
// POST '/v1/resource/name'	: post resource on version 1
// HEADER					: X-Auth-Token	=> Role token
// body						:	{
//									"resource":	{
//										"type":			<data type>						=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/type"
//																							data type must be string or json.
//																							if data is null or not specified, this value is not used.
//										"data":			<resource data>					=>	value for "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																							data must be encoded by encodeURI, because data is allowed CR, control code etc.
//																							but nodejs is decodeURI automatically
//										"keys":			{foo: bar, ...}					=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/keys"
//																							specify any associative array(SSL certificate, host key, etc)
//																							if null or undefined is specified, not update this member in resource when this resource exists.
//																							if '' or string(JSON), this member is set into "keys".
//									}
//								}
// response body			: 	{
//									result: 	true/false
//									message:	 messages
//								}
//
//
// POST '/v1/resource/name'	: post resource on version 1								=>	name is full yrn to resource
// HEADER					: X-Auth-Token	=> undefined
// body						:	{
//									"resource":	{
//										"port":			<port number>					=>	undefined(null) is allowed. if empty value, default port is 0(any)
//										"cuk":			<container unique key>			=>	undefined(null) is allowed. if empty value, any value.
//										"role":			<role full yrn>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>...}"
//										"type":			<data type>						=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/type"
//																							data type must be string or json.
//																							if data is null or not specified, this value is not used.
//										"data":			<resource data>					=>	value for "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																							data must be encoded by encodeURI, because data is allowed CR, control code etc.
//																							but nodejs is decodeURI automatically
//										"keys":			{foo: bar, ...}					=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/keys"
//																							specify any associative array(SSL certificate, host key, etc)
//																							if null or undefined is specified, not update this member in resource when this resource exists.
//																							if '' or string(JSON), this member is set into "keys".
//									}
//								}
// response body			: 	{
//									result: 	true/false
//									message:	 messages
//								}
//
//
router.post('/', function(req, res, next)					// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.body) ||
		!apiutil.isSafeEntity(req.body.resource) )
	{
		result = {
			result: 	false,
			message:	'POST body does not have resource data'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	result = rawParseBaseParamRequestAPI(req, false, apiutil.isSafeEntity(req.body.resource.name) ? req.body.resource.name : null);
	if(!result.res_obj.result){
		r3logger.elog(result.res_obj.message);
		resutil.errResponse(req, res, result.res_code, result.res_obj);
		return;
	}
	var	comparam = result.parameters;

	//------------------------------
	// check resource
	//------------------------------
	if(null !== comparam.token_type && (comparam.tenant_name !== comparam.res_tenant || apiutil.isSafeString(comparam.res_service))){
		r3logger.elog('POST request resource(' + JSON.stringify(comparam.res_name) + ') is under tenant(' + JSON.stringify(comparam.res_tenant) + ') and service(' + JSON.stringify(comparam.res_service) + '), it is not under tenant(' + JSON.stringify(comparam.tenant_name) + ').');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	// data type
	var	type = null;
	if(apiutil.isSafeString(req.body.resource.type)){
		type = apiutil.getSafeString(req.body.resource.type);
		if(!apiutil.compareCaseString('string', type) && !apiutil.compareCaseString('object', type)){
			result = {
				result: 	false,
				message:	'POST resource:type field is wrong : ' + JSON.stringify(req.body.resource.type)
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
	}else{
		type = comparam.keys.VALUE_STRING_TYPE;				// default type is string
	}

	// data
	var	data = null;
	if(apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, type)){
		if(apiutil.isSafeEntity(req.body.resource.data) && '' === req.body.resource.data){
			data = '';
		}else if(apiutil.isSafeString(req.body.resource.data)){
			// data is string(nodejs is decodeURI automatically)
			// this value includes control codes(\n, etc)
			data = apiutil.getSafeString(req.body.resource.data);
		}
	}else{	// type == object
		if(apiutil.isSafeEntity(req.body.resource.data)){
			data = req.body.resource.data;
		}
	}

	// keys
	var	resource_keys = null;
	if(apiutil.isSafeEntity(req.body.resource.keys)){
		if('' === req.body.resource.keys){
			resource_keys = '';
		}else if(req.body.resource.keys instanceof Object){
			resource_keys = req.body.resource.keys;
		}else if(apiutil.isSafeString(req.body.resource.keys)){
			resource_keys = req.body.resource.keys;
			if(apiutil.checkSimpleJSON(resource_keys)){
				resource_keys = JSON.parse(resource_keys);
			}
		}else{
			result = {
				result: 	false,
				message:	'POST resource:keys field is wrong : ' + JSON.stringify(req.body.resource.keys)
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
	}

	// alias
	if('user' !== comparam.token_type && apiutil.isSafeEntity(req.body.resource.alias)){
		result = {
			result: 	false,
			message:	'POST resource:alias field is specified, but it is not allowed by not user token : ' + JSON.stringify(req.body.resource.alias)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	aliases = null;
	if('user' === comparam.token_type){
		var	aliasptn	= new RegExp('^' + comparam.keys.RESOURCE_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:resource:(.*)/
		var	aliaspram	= apiutil.getNormalizeParameter(req.body.resource.alias, aliasptn, null);
		if(false === aliaspram.result){
			result = {
				result: 	false,
				message:	'POST resource:alias field is wrong : ' + JSON.stringify(req.body.resource.alias)
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
		aliases = aliaspram.parameter;
	}

	// role yrn/ip address/port for no token
	var	clientip	= null;
	var	port		= 0;
	var	cuk			= null;
	var	role_yrn	= null;
	if(null !== comparam.token_type && (apiutil.isSafeEntity(req.body.resource.port) || apiutil.isSafeEntity(req.body.resource.cuk) || apiutil.isSafeEntity(req.body.resource.role))){
		result = {
			result: 	false,
			message:	'POST resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.body.resource.port) + ', cuk=' + JSON.stringify(req.body.resource.cuk) + ', role=' + JSON.stringify(req.body.resource.role)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	if(null === comparam.token_type){
		// role
		if(!apiutil.isSafeString(req.body.resource.role)){
			result = {
				result: 	false,
				message:	'POST request does not have role yrn in post data.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
		// [NOTE]
		// not check role is full yrn here.
		role_yrn = apiutil.getSafeString(req.body.resource.role);

		// ip
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			result = {
				result: 	false,
				message:	'POST request does not have ip address for client.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}

		// port
		if(apiutil.isSafeString(req.body.resource.port) && !isNaN(req.body.resource.port)){
			port = parseInt(req.body.resource.port);
		}else{
			port = 0;
		}

		// cuk
		if(apiutil.isSafeString(req.body.resource.cuk) && apiutil.isSafeString(req.body.resource.cuk.trim())){
			cuk = req.body.resource.cuk.trim();
		}
	}

	//------------------------------
	// set all field to resource
	//------------------------------
	if('user' === comparam.token_type){
		result = k2hr3.setResourceAll(comparam.user_name, comparam.tenant_name, comparam.res_name, type, data, resource_keys, aliases);
	}else if('role' === comparam.token_type){
		result = k2hr3.setResourceAllByRole(comparam.token_info.role, comparam.tenant_name, comparam.res_name, type, data, resource_keys);
	}else if(null === comparam.token_type){
		result = k2hr3.setResourceAllByIP(clientip, port, cuk, role_yrn, comparam.res_name, type, data, resource_keys);
	}else{
		// broken token
		result = {
			result: 	false,
			message:	'POST request is failure by internal error(token data broken).'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);			// 500: Internal Error
		return;
	}
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'POST Could not get response from setResourceAll'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'POST Could not get error message in response from setResourceAll';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(201);										// 201: Created
	res.send(JSON.stringify(result));
});

//
// Mountpath				: '/v1/resource'
//
// PUT '/v1/resource'		: post resource on version 1
// HEADER					: X-Auth-Token	=> User token
// url argument				: 
//								"name":			<resource name>						=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																						<resource> can include '/' for hierarchical path
//								"type":			<data type>							=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/type"
//																						type is object or string, default is string.
//								"data":			<resource data>						=>	value for "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																						data must be formatted by JSON, and it is allowed CR, control code etc.
//								"keys":			{foo: bar, ...}						=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/keys"
//																						specify any associative array(SSL certificate, host key, etc), it is formatted by JSON.
//																						if null or undefined is specified, not update this member in resource when this resource exists.
//																						if '' or associative array, this member is set into "keys".
//								"alias":		[<resource yrn full path>, ...]		=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/@"
//																						specify another resource array as "yrn:yahoo:<service>::<tenant>:resource:<resource>", it is formatted by JSON.
//																						if null or undefined is specified, not update this member in resource when this resource exists.
//																						if '' or zero array, this member in resource is set empty array.
// response body			:	{
//									result:		true/false
//							  		message:	messages
//								}
//
// PUT '/v1/resource/name'	: post resource on version 1
// HEADER					: X-Auth-Token	=> Role token
// url argument				: 
//								"type":			<data type>							=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/type"
//																						type is object or string, default is string.
//								"data":			<resource data>						=>	value for "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																						data must be formatted by JSON, and it is allowed CR, control code etc.
//								"keys":			{foo: bar, ...}						=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/keys"
//																						specify any associative array(SSL certificate, host key, etc), it is formatted by JSON.
//																						if null or undefined is specified, not update this member in resource when this resource exists.
//																						if '' or associative array, this member is set into "keys".
// response body			:	{
//									result:		true/false
//							  		message:	messages
//								}
//
// PUT '/v1/resource/name'	: post resource on version 1							=>	name is full yrn to resource
// HEADER					: X-Auth-Token	=> undefined
// url argument				: 
//								"port":			<port number>						=>	undefined(null) is allowed. if empty value, default port is 0(any)
//								"cuk":			<container unique key>				=>	undefined(null) is allowed. if empty value, any value.
//								"role":			<role full yrn>						=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>{/<role>...}"
//								"type":			<data type>							=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/type"
//																						type is object or string, default is string.
//								"data":			<resource data>						=>	value for "yrn:yahoo:<service>::<tenant>:resource:<resource>"
//																						data must be formatted by JSON, and it is allowed CR, control code etc.
//								"keys":			{foo: bar, ...}						=>	key is "yrn:yahoo:<service>::<tenant>:resource:<resource>/keys"
//																						specify any associative array(SSL certificate, host key, etc), it is formatted by JSON.
//																						if null or undefined is specified, not update this member in resource when this resource exists.
//																						if '' or associative array, this member is set into "keys".
// response body			:	{
//									result:		true/false
//							  		message:	messages
//								}
//
router.put('/', function(req, res, next)					// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.query) )
	{
		result = {
			result: 	false,
			message:	'PUT argument does not have any data'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	result = rawParseBaseParamRequestAPI(req, false, apiutil.isSafeEntity(req.query.name) ? req.query.name : null);
	if(!result.res_obj.result){
		r3logger.elog(result.res_obj.message);
		resutil.errResponse(req, res, result.res_code, result.res_obj);
		return;
	}
	var	comparam = result.parameters;

	//------------------------------
	// check resource
	//------------------------------
	if(null !== comparam.token_type && (comparam.tenant_name !== comparam.res_tenant || apiutil.isSafeString(comparam.res_service))){
		r3logger.elog('PUT request resource(' + JSON.stringify(comparam.res_name) + ') is under tenant(' + JSON.stringify(comparam.res_tenant) + ') and service(' + JSON.stringify(comparam.res_service) + '), it is not under tenant(' + JSON.stringify(comparam.tenant_name) + ').');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	// data type
	var	type = null;
	if(apiutil.isSafeString(req.query.type)){
		type = apiutil.getSafeString(req.query.type);
		if(!apiutil.compareCaseString('string', type) && !apiutil.compareCaseString('object', type)){
			result = {
				result: 	false,
				message:	'PUT resource:type field is wrong : ' + JSON.stringify(req.query.type)
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
	}else{
		type = comparam.keys.VALUE_STRING_TYPE;				// default type is string
	}

	// data
	var	data = null;
	if(apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, type)){
		if(apiutil.isSafeEntity(req.query.data) && '' === req.query.data){
			data = '';
		}else if(apiutil.isSafeString(req.query.data)){
			data = apiutil.getSafeString(req.query.data);
			if(apiutil.checkSimpleJSON(req.query.data)){
				data = JSON.parse(req.query.data);			// decode JSON
			}
		}
	}else{	// type == object
		if(apiutil.isSafeString(req.query.data)){
			data = apiutil.getSafeString(req.query.data);
			if(apiutil.checkSimpleJSON(req.query.data)){
				data = JSON.parse(req.query.data);			// decode JSON
			}
		}
	}

	// keys
	var	resource_keys = null;
	if(apiutil.isSafeEntity(req.query.keys) && '' === req.query.keys){
		resource_keys = '';
	}else if(apiutil.isSafeString(req.query.keys)){
		// keys is encoded by JSON, this value is associative array.
		//
		resource_keys = apiutil.getSafeString(req.query.keys);
		if(apiutil.checkSimpleJSON(resource_keys)){
			resource_keys = JSON.parse(resource_keys);
		}
	}

	// alias
	if('user' !== comparam.token_type && apiutil.isSafeEntity(req.query.alias)){
		result = {
			result: 	false,
			message:	'PUT resource:alias field is specified, but it is not allowed by not user token : ' + JSON.stringify(req.query.alias)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	aliases = null;
	if('user' === comparam.token_type){
		if(apiutil.isSafeEntity(req.query.alias) && '' === req.query.alias){
			aliases = '';
		}else if(apiutil.isSafeString(req.query.alias)){
			// alias is encoded by JSON, this value is array.
			//
			var	tmpaliases	= apiutil.getSafeString(req.query.alias);
			if(apiutil.checkSimpleJSON(tmpaliases)){
				tmpaliases	= JSON.parse(tmpaliases);
			}
			var	aliasptn	= new RegExp('^' + comparam.keys.RESOURCE_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:resource:(.*)/
			var	aliaspram	= apiutil.getNormalizeParameter(tmpaliases, aliasptn, null);
			if(false === aliaspram.result){
				result = {
					result: 	false,
					message:	'PUT resource:alias field is wrong : ' + req.query.alias
				};

				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);	// 400: Bad Request
				return;
			}
			aliases = aliaspram.parameter;
		}
	}

	// role yrn/ip address/port for no token
	var	clientip	= null;
	var	port		= 0;
	var	cuk			= null;
	var	role_yrn	= null;
	if(null !== comparam.token_type && (apiutil.isSafeEntity(req.query.port) || apiutil.isSafeEntity(req.query.cuk) || apiutil.isSafeEntity(req.query.role))){
		result = {
			result: 	false,
			message:	'PUT resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.query.port) + ', cuk=' + JSON.stringify(req.query.cuk) + ', role=' + JSON.stringify(req.query.role)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	if(null === comparam.token_type){
		// role
		if(!apiutil.isSafeString(req.query.role)){
			result = {
				result: 	false,
				message:	'PUT request does not have role yrn in post data.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
		// [NOTE]
		// not check role is full yrn here.
		role_yrn = apiutil.getSafeString(req.query.role);

		// ip
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			result = {
				result: 	false,
				message:	'PUT request does not have ip address for client.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}

		// port
		if(apiutil.isSafeString(req.query.port) && !isNaN(req.query.port)){
			port = parseInt(req.query.port);
		}else{
			port = 0;
		}

		// cuk
		if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			cuk = req.query.cuk.trim();
		}
	}

	//------------------------------
	// set all field to resource
	//------------------------------
	if('user' === comparam.token_type){
		result = k2hr3.setResourceAll(comparam.user_name, comparam.tenant_name, comparam.res_name, type, data, resource_keys, aliases);
	}else if('role' === comparam.token_type){
		result = k2hr3.setResourceAllByRole(comparam.token_info.role, comparam.tenant_name, comparam.res_name, type, data, resource_keys);
	}else if(null === comparam.token_type){
		result = k2hr3.setResourceAllByIP(clientip, port, cuk, role_yrn, comparam.res_name, type, data, resource_keys);
	}else{
		// broken token
		result = {
			result: 	false,
			message:	'PUT request is failure by internal error(token data broken).'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);			// 500: Internal Error
		return;
	}
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'PUT Could not get response from setResourceAll'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'PUT Could not get error message in response from setResourceAll';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(201);										// 201: Created
	res.send(JSON.stringify(result));
});

//
// Mountpath				: '/v1/resource/*'
//
// GET '/v1/resource/name'	: get resource on version 1(name is allowed full yrn path)
// HEADER					: X-Auth-Token	= User token
// URL arguments			: expand		= "true"(default) or "false"
//							  service		= service name(optional)
// result					:	{
//									"result":	true or false
//									"message":	error message
//									"resource":	{
//													string:		"string",
//													object:		object
//													keys:		object
//													aliases:	array				<--- only not expand
//												}
//								}
//
// GET '/v1/resource/name'	: get resource on version 1(name is allowed full yrn path)
// HEADER					: X-Auth-Token	= Role token
// URL arguments			: type			= "string"(default) or "object" or "keys"
//							  keyname		= key name(if type is "keys")
//							  service		= service name(optional)
// result					:	{
//									"result":	true or false
//									"message":	error message
//									"resource":	string or object
//								}
//
// GET '/v1/resource/name'	: get resource on version 1(name is allowed full yrn path)
// HEADER					: X-Auth-Token	= undefined
// URL arguments			: port			= port number(undefined is default 0(any))
//							  cuk			= container unique key(empty value, any value)
//							  role			= role full yrn
//							  type			= "string"(default) or "object" or "keys"
//							  keyname		= key name(if type is "keys")
//							  service		= service name(optional)
// result					:	{
//									"result":	true or false
//									"message":	error message
//									"resource":	string or object
//								}
//
// [NOTE]
// The name in '/v1/resource/name' path is allowed resource name or resource full yrn path.
// If the name is not yrn path, resource path created by including tenant and service which
// are specified in role.
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
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.baseUrl) )
	{
		result = {
			result: 	false,
			message:	'GET request or url is wrong'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	result = rawParseBaseParamRequestAPI(req, true, null);
	if(!result.res_obj.result){
		r3logger.elog(result.res_obj.message);
		resutil.errResponse(req, res, result.res_code, result.res_obj);
		return;
	}
	var	comparam = result.parameters;

	//------------------------------
	// check arguments
	//------------------------------
	// expand type(only user token type)
	var	is_expand = true;
	if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.expand)){
		if('user' === comparam.token_type){
			if(apiutil.compareCaseString(comparam.keys.VALUE_TRUE, req.query.expand)){
				is_expand = true;
			}else if(apiutil.compareCaseString(comparam.keys.VALUE_FALSE, req.query.expand)){
				is_expand = false;
			}else{
				result = {
					result: 	false,
					message:	'GET expand url argument parameter(' + JSON.stringify(req.query.expand) + ') is wrong, it must be ' + comparam.keys.VALUE_TRUE + ' or ' + comparam.keys.VALUE_FALSE + '.'
				};

				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);	// 400: Bad Request
				return;
			}
		}else{
			r3logger.wlog('GET found unnessesary expand(' + JSON.stringify(req.query.expand) + ') parameter, skip this.');
		}
	}

	// type, key parameter(role token/no token type)
	var	restype		= null;
	var	reskeyname	= null;
	if(null === comparam.token_type || 'role' === comparam.token_type){
		if(!apiutil.isSafeEntity(req.query) || !apiutil.isSafeString(req.query.type)){
			restype	= comparam.keys.VALUE_STRING_TYPE;
		}else if(apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, req.query.type)){
			restype	= comparam.keys.VALUE_STRING_TYPE;
		}else if(apiutil.compareCaseString(comparam.keys.VALUE_OBJECT_TYPE, req.query.type)){
			restype	= comparam.keys.VALUE_OBJECT_TYPE;
		}else if(apiutil.compareCaseString(comparam.keys.VALUE_KEYS_TYPE, req.query.type)){
			restype	= comparam.keys.VALUE_KEYS_TYPE;
			// key name
			if(!apiutil.isSafeEntity(req.query) || !apiutil.isSafeString(req.query.keyname)){
				result = {
					result: 	false,
					message:	'GET request type=keys, but keyname(' + req.query.keyname + ') parameter is empty.'
				};

				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);		// 400: Bad Request
				return;
			}
			reskeyname = req.query.keyname;
		}else{
			result = {
				result: 	false,
				message:	'GET request type(' + req.query.type + ') parameter is wrong.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
	}

	// role yrn/ip address/port for no token
	var	clientip	= null;
	var	port		= 0;
	var	cuk			= null;
	var	role_yrn	= null;
	if(null !== comparam.token_type && (apiutil.isSafeEntity(req.query.port) || apiutil.isSafeEntity(req.query.cuk) || apiutil.isSafeEntity(req.query.role))){
		result = {
			result: 	false,
			message:	'GET resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.query.port) + ', cuk=' + JSON.stringify(req.query.cuk) + ', role=' + JSON.stringify(req.query.role)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	if(null === comparam.token_type){
		// role
		if(!apiutil.isSafeString(req.query.role)){
			result = {
				result: 	false,
				message:	'GET request does not have role yrn in post data.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}
		// [NOTE]
		// not check role is full yrn here.
		role_yrn = apiutil.getSafeString(req.query.role);

		// ip
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			result = {
				result: 	false,
				message:	'GET request does not have ip address for client.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);		// 400: Bad Request
			return;
		}

		// port
		if(apiutil.isSafeString(req.query.port) && !isNaN(req.query.port)){
			port = parseInt(req.query.port);
		}else{
			port = 0;
		}

		// cuk
		if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			cuk = req.query.cuk.trim();
		}
	}

	//------------------------------
	// Run
	//------------------------------
	if('user' === comparam.token_type){
		result = k2hr3.getResource(comparam.user_name, comparam.tenant_name, comparam.res_service, comparam.res_name, is_expand);
	}else if('role' === comparam.token_type){
		// [NOTE]
		// comparam.token_info.role is role full yrn path, it does not include service name.
		// Because we do not put role token for role under service path.
		//
		result = k2hr3.getResourceByRole(comparam.token_info.role, comparam.res_yrn, restype, reskeyname);

	}else if(null === comparam.token_type){
		// [NOTE]
		// role_yrn allows a path containing service.
		// However, the case is rare and should not be used.
		//
		result = k2hr3.getResourceByIP(clientip, port, cuk, role_yrn, comparam.res_yrn, restype, reskeyname);

	}else{
		// broken token
		result = {
			result: 	false,
			message:	'GET request is failure by internal error(token data broken).'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);			// 500: Internal Error
		return;
	}
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'GET Could not get response from getResource'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'GET Could not get error message in response from getResource';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 404, result);			// 404: Not Found
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(200);										// 200: OK
	res.send(JSON.stringify(result));
});

//
// Mountpath				: '/v1/resource/*'
//
// HEAD '/v1/resource/name'	: get resource on version 1(name is allowed full yrn path)
// HEADER					: X-Auth-Token	= User token
// URL arguments			: type			= "string"(default) or "object" or "keys"
//							  keyname		= key name(if type is "keys")
//							  service		= service name(if resource is under service)
//
// HEAD '/v1/resource/name'	: get resource on version 1(name is allowed full yrn path)
// HEADER					: X-Auth-Token	= Role token
// URL arguments			: type			= "string"(default) or "object" or "keys"
//							  keyname		= key name(if type is "keys")
//							  service		= service name(optional)
//
// HEAD '/v1/resource/name'	: get resource on version 1(name is allowed full yrn path)
// HEADER					: X-Auth-Token	= undefined
// URL arguments			: port			= port number(undefined is default 0(any))
//							  cuk			= container unique key(empty value, any value)
//							  role			= role full yrn
//							  type			= "string"(default) or "object" or "keys"
//							  keyname		= key name(if type is "keys")
//							  service		= service name(optional)
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

	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.baseUrl) )
	{
		r3logger.elog('HEAD request or url or query is wrong');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	var	result = rawParseBaseParamRequestAPI(req, true, null);
	if(!result.res_obj.result){
		r3logger.elog(result.res_obj.message);
		resutil.errResponse(req, res, result.res_code);
		return;
	}
	var	comparam = result.parameters;

	//------------------------------
	// check arguments
	//------------------------------
	// type, key parameter
	var	restype		= null;
	var	reskeyname	= null;
	if(!apiutil.isSafeEntity(req.query) || !apiutil.isSafeString(req.query.type)){
		restype	= comparam.keys.VALUE_STRING_TYPE;
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, req.query.type)){
		restype	= comparam.keys.VALUE_STRING_TYPE;
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_OBJECT_TYPE, req.query.type)){
		restype	= comparam.keys.VALUE_OBJECT_TYPE;
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_KEYS_TYPE, req.query.type)){
		restype	= comparam.keys.VALUE_KEYS_TYPE;
		// key name
		if(!apiutil.isSafeEntity(req.query) || !apiutil.isSafeString(req.query.keyname)){
			r3logger.elog('HEAD request type=keys, but keyname(' + req.query.keyname + ') parameter is empty.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		reskeyname = req.query.keyname;
	}else{
		r3logger.elog('HEAD request type(' + req.query.type + ') parameter is wrong.');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	// role yrn/ip address/port for no token
	var	clientip	= null;
	var	port		= 0;
	var	cuk			= null;
	var	role_yrn	= null;
	if(null !== comparam.token_type && (apiutil.isSafeEntity(req.query.port) || apiutil.isSafeEntity(req.query.cuk) || apiutil.isSafeEntity(req.query.role))){
		r3logger.elog('HEAD resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.query.port) + ', cuk=' + JSON.stringify(req.query.cuk) + ', role=' + JSON.stringify(req.query.role));
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}
	if(null === comparam.token_type){
		// role
		if(!apiutil.isSafeString(req.query.role)){
			r3logger.elog('HEAD request does not have role yrn in post data.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		// [NOTE]
		// not check role is full yrn here.
		role_yrn = apiutil.getSafeString(req.query.role);

		// ip
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			r3logger.elog('HEAD request does not have ip address for client.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}

		// port
		if(apiutil.isSafeString(req.query.port) && !isNaN(req.query.port)){
			port = parseInt(req.query.port);
		}else{
			port = 0;
		}

		// cuk
		if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			cuk = req.query.cuk.trim();
		}
	}

	//------------------------------
	// Run
	//------------------------------
	if('user' === comparam.token_type){
		result = k2hr3.checkResource(comparam.user_name, comparam.tenant_name, comparam.res_service, comparam.res_name, restype, reskeyname);

	}else if('role' === comparam.token_type){
		// [NOTE]
		// comparam.token_info.role is role full yrn path, it does not include service name.
		// Because we do not put role token for role under service path.
		//
		result = k2hr3.checkResourceByRole(comparam.token_info.role, comparam.tenant_name, comparam.res_yrn, restype, reskeyname);

	}else if(null === comparam.token_type){
		// [NOTE]
		// role_yrn allows a path containing service.
		// However, the case is rare and should not be used.
		//
		result = k2hr3.checkResourceByIP(clientip, port, cuk, role_yrn, comparam.res_yrn, restype, reskeyname);
	}else{
		// broken token
		r3logger.elog('HEAD request is failure by internal error(token data broken).');
		resutil.errResponse(req, res, 500);					// 500: Internal Error
		return;
	}
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'HEAD Could not get response from checkResource'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'HEAD Could not get error message in response from checkResource';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403);					// 403: Forbidden
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(204);										// 204: No Content
	res.send();
});

//
// Mountpath					: '/v1/resource/*'
//
// DELETE '/v1/resource/name'	: get resource on version 1
// HEADER						: X-Auth-Token	= User token
// URL arguments				: type			= null(all), "anytype"(=any type data), "string"(=only string data), "object"(=only object data), "keys"(=key), "aliases"(=aliases)
//								  keynames		= null or keyname string or keyname array when type="keys"
//								  aliases		= null or alias key string or alias key array when type="aliases"
//
// DELETE '/v1/resource/name'	: get resource on version 1
// HEADER						: X-Auth-Token	= Role token
// URL arguments				: type			= "anytype"(=any type data), "string"(=only string data), "object"(=only object data), "keys"(=key)
//								  keynames		= null or keyname string or keyname array when type="keys"
//
// DELETE '/v1/resource/name'	: get resource on version 1
// HEADER						: X-Auth-Token	= undefined
// URL arguments				: port			= port number(undefined is default 0(any))
//								  cuk			= container unique key(empty value, any value)
//								  role			= role full yrn
// 								  type			= "anytype"(=any type data), "string"(=only string data), "object"(=only object data), "keys"(=key)
//								  keynames		= null or keyname string or keyname array when type="keys"
//
router.delete('/', function(req, res, next)					// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.baseUrl) )
	{
		r3logger.elog('DELETE request or url or query is wrong');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	var	result = rawParseBaseParamRequestAPI(req, false, null);
	if(!result.res_obj.result){
		r3logger.elog(result.res_obj.message);
		resutil.errResponse(req, res, result.res_code);
		return;
	}
	var	comparam = result.parameters;

	//------------------------------
	// check resource(must be same tenant)
	//------------------------------
	if(null !== comparam.token_type && (comparam.tenant_name !== comparam.res_tenant || apiutil.isSafeString(comparam.res_service))){
		r3logger.elog('DELETE request resource(' + JSON.stringify(comparam.res_name) + ') is under tenant(' + JSON.stringify(comparam.res_tenant) + ') and service(' + JSON.stringify(comparam.res_service) + '), it is not under tenant(' + JSON.stringify(comparam.tenant_name) + ').');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	// type, key parameter(role token/no token type)
	var	datatype	= null;
	var	keynames	= null;
	var	aliases		= null;
	if(!apiutil.isSafeEntity(req.query) || !apiutil.isSafeString(req.query.type)){
		if('user' !== comparam.token_type){
			r3logger.elog('DELETE request type=all(null), this type needs user token.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		datatype	= null;
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_ANYDATA_TYPE, req.query.type)){
		datatype	= comparam.keys.VALUE_ANYDATA_TYPE;
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, req.query.type)){
		datatype	= comparam.keys.VALUE_STRING_TYPE;
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_OBJECT_TYPE, req.query.type)){
		datatype	= comparam.keys.VALUE_OBJECT_TYPE;
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_KEYS_TYPE, req.query.type)){
		datatype	= comparam.keys.VALUE_KEYS_TYPE;
		// key name
		if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.keynames)){
			keynames = req.query.keynames;
			if(apiutil.checkSimpleJSON(keynames)){
				keynames = JSON.parse(keynames);
				if(apiutil.isEmptyArray(keynames)){
					r3logger.elog('DELETE request type(' + req.query.type + ') parameter keynames(' + JSON.stringify(req.query.keynames) + ') is wrong.');
					resutil.errResponse(req, res, 400);		// 400: Bad Request
					return;
				}
			}else{
				keynames = [keynames];
			}
		}
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_ALIAS_TYPE, req.query.type)){
		datatype	= comparam.keys.VALUE_ALIAS_TYPE;
		if('user' !== comparam.token_type){
			r3logger.elog('DELETE request type=aliases, this type needs user token.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		// aliases
		if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.aliases)){
			aliases = req.query.aliases;
			if(apiutil.checkSimpleJSON(aliases)){
				aliases = JSON.parse(aliases);
				if(apiutil.isEmptyArray(aliases)){
					r3logger.elog('DELETE request type(' + req.query.type + ') parameter aliases(' + JSON.stringify(req.query.alias) + ') is wrong.');
					resutil.errResponse(req, res, 400);		// 400: Bad Request
					return;
				}
			}else{
				aliases = [aliases];
			}
		}
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_EXPIRE_TYPE, req.query.type)){
		datatype	= comparam.keys.VALUE_EXPIRE_TYPE;
	}else{
		r3logger.elog('DELETE request type(' + req.query.type + ') parameter is wrong.');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	// role yrn/ip address/port for no token
	var	clientip	= null;
	var	port		= 0;
	var	cuk			= null;
	var	role_yrn	= null;
	if(null !== comparam.token_type && (apiutil.isSafeEntity(req.query.port) || apiutil.isSafeEntity(req.query.cuk) || apiutil.isSafeEntity(req.query.role))){
		r3logger.elog('DELETE resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.query.port) + ', cuk=' + JSON.stringify(req.query.cuk) + ', role=' + JSON.stringify(req.query.role));
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}
	if(null === comparam.token_type){
		// role
		if(!apiutil.isSafeString(req.query.role)){
			r3logger.elog('DELETE request does not have role yrn in post data.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		// [NOTE]
		// not check role is full yrn here.
		role_yrn = apiutil.getSafeString(req.query.role);

		// ip
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			r3logger.elog('DELETE request does not have ip address for client.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}

		// port
		if(apiutil.isSafeString(req.query.port) && !isNaN(req.query.port)){
			port = parseInt(req.query.port);
		}else{
			port = 0;
		}

		// cuk
		if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			cuk = req.query.cuk.trim();
		}
	}

	//------------------------------
	// Run
	//------------------------------
	if('user' === comparam.token_type){
		result = k2hr3.removeResource(comparam.user_name, comparam.tenant_name, comparam.res_name, datatype, keynames, aliases);
	}else if('role' === comparam.token_type){
		result = k2hr3.removeResourceByRole(comparam.token_info.role, comparam.tenant_name, comparam.res_name, datatype, keynames);
	}else if(null === comparam.token_type){
		result = k2hr3.removeResourceByIP(clientip, port, cuk, role_yrn, comparam.res_name, datatype, keynames);
	}else{
		// broken token
		r3logger.elog('DELETE request is failure by internal error(token data broken).');
		resutil.errResponse(req, res, 500);					// 500: Internal Error
		return;
	}
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'DELETE Could not get response from removeResource'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'DELETE Could not get error message in response from removeResource';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 403);					// 403: Forbidden(is this status OK?)
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(204);										// 204: No Content
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
