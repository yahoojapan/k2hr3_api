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

import	apiutil			from '../lib/k2hr3apiutil';
import	resutil			from '../lib/k2hr3resutil';
import	r3tokens		from '../lib/k2hr3tokens';
import	k2hr3			from '../lib/k2hr3dkc';
import	r3logger		from '../lib/dbglogging';
import	express			from 'express';

import { getK2hr3Keys, type K2hr3Keys }								from '../lib/k2hr3keys';
import type { dkcTypeResourceRawKeysValue }							from '../lib/k2hr3dkc';
import type	{ Request, Response, NextFunction }						from 'express';
import type	{ resTypeCheckKindToken }								from '../lib/k2hr3tokens';
import type	{ valTypeAll, resTypeBaseResult, resTypeStatusResult }	from '../lib/types';

const	r3keys	= getK2hr3Keys;
const	router	= express.Router();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type valTypeResourceReqBaseParam = {
	token_type:		string | null;
	token_str:		string | null;
	token_info:		resTypeCheckKindToken | null;
	user_name:		string | null;
	tenant_name:	string | null;
	keys:			K2hr3Keys;
	res_yrn:		string | null;
	res_name:		string | null;
	res_tenant:		string | null;
	res_service:	string | null;
};

type valTypeResourceReqParam = resTypeStatusResult & {
	parameters:		valTypeResourceReqBaseParam
};

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
//						status:						status code(default 200)
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
const rawParseBaseParamRequestAPI = (
	req:					Request,
	is_allow_service:		boolean,
	default_resource_name:	string | null
): valTypeResourceReqParam => {

	const	parameters: valTypeResourceReqBaseParam = {
		token_type:		null,
		token_str:		null,
		token_info:		null,
		user_name:		null,
		tenant_name:	null,
		keys:			r3keys(),
		res_yrn:		null,
		res_name:		null,
		res_tenant:		null,
		res_service:	null
	};
	const	result: valTypeResourceReqParam = {
		result:			true,
		message:		null,
		status:			200,
		parameters:		parameters
	};

	//
	// check token for API mode
	//
	if(r3tokens.hasAuthTokenHeader(req)){
		const	token_result = r3tokens.checkToken(req, true);							// scoped, both token
		if(!token_result.result){
			result.result	= token_result.result;
			result.message	= token_result.message;
			result.status	= token_result.status;
			r3logger.elog(result.message);
			return result;
		}
		const	token_info	= token_result.token_info;
		if(!r3tokens.isResTypeCheckRoleToken(token_info)){
			result.result	= false;
			result.message	= 'specified wrong token or it is not scoped user token';
			result.status	= 400;														// 400: Bad Request
			r3logger.elog(result.message);
			return result;
		}
		result.parameters.token_type	= apiutil.isSafeString(token_result.token_type) ? token_result.token_type : null;
		result.parameters.token_str		= apiutil.isSafeString(token_result.token) ? token_result.token : null;
		result.parameters.token_info	= token_info;
		result.parameters.user_name		= apiutil.getSafeString(token_info.user);
		result.parameters.tenant_name	= apiutil.getSafeString(token_info.tenant).toLowerCase();
		result.parameters.keys			= r3keys(token_info.user, token_info.tenant);
	}
	const	tmpTenant: string | null	= r3tokens.isResTypeCheckRoleToken(result.parameters.token_info) ? (apiutil.isSafeString(result.parameters.token_info.tenant) ? result.parameters.token_info.tenant : null) : null;
	const	tmpUser: string | null		= r3tokens.isResTypeCheckRoleToken(result.parameters.token_info) ? (apiutil.isSafeString(result.parameters.token_info.user) ? result.parameters.token_info.user : null) : null;

	//
	// check service parameter in request
	//
	let	service_param: string | null = null;
	if(is_allow_service){
		if(apiutil.compareCaseString('POST', req.method)){
 			if(apiutil.isPlainObject(req.body) && apiutil.isSafeString(req.body.service)){
				service_param = apiutil.getSafeString(req.body.service).trim();
			}
		}else{
 			if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.service)){
				service_param = apiutil.getSafeString(req.query.service).trim();
			}
		}
	}

	//
	// get resource full yrn
	//
	const	requestptn	= new RegExp('^/v1/resource/(.*)');								// regex = /^\/v1\/resource\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		if(!apiutil.isSafeString(default_resource_name)){
			result.result	= false;
			result.message	= 'Default resource name is not specified or wrong value : ' + JSON.stringify(default_resource_name);
			result.status	= 400;														// 400: Bad Request
			r3logger.elog(result.message);
			return result;
		}
		result.parameters.res_yrn = apiutil.getSafeString(default_resource_name).toLowerCase();
	}else{
		result.parameters.res_yrn = reqmatchs[1].toLowerCase();
	}

	//
	// make resource name from resource yrn
	//
	let		nameptn		= new RegExp('^' + result.parameters.keys.MATCH_ANY_TENANT_RESOURCE);	// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	const	namematchs	= result.parameters.res_yrn.match(nameptn);
	if(!apiutil.isStringArray(namematchs) || !apiutil.isNotEmptyArray(namematchs) || namematchs.length < 4){
		// res_yrn is not full yrn to resource, then check wrong resource name
		nameptn		= new RegExp('^' + result.parameters.keys.NO_TENANT_KEY);			// regex = /^yrn:yahoo:/
		if(result.parameters.res_yrn.match(nameptn)){
			result.result	= false;
			result.message	= 'Request query has wrong yrn full path to resource';
			result.status	= 400;														// 400: Bad Request
			r3logger.elog(result.message);
			return result;
		}
		// no token need full yrn to resource(other token has tenant name)
		if(!apiutil.isSafeString(result.parameters.token_type)){
			result.result	= false;
			result.message	= 'Request query does not have yrn full path to resource';
			result.status	= 400;														// 400: Bad Request
			r3logger.elog(result.message);
			return result;
		}
		// make resource yrn from resource name(sometimes, a case of user token come here.)
		result.parameters.res_name		= result.parameters.res_yrn;
		result.parameters.res_tenant	= result.parameters.tenant_name;				// resource is only name, then resource's tenant is same.
		result.parameters.res_service	= apiutil.isSafeString(service_param) ? service_param.toLowerCase() : null;
		result.parameters.keys			= r3keys(tmpUser, result.parameters.res_tenant, result.parameters.res_service);
		result.parameters.res_yrn		= result.parameters.keys.RESOURCE_TOP_KEY + ':' + result.parameters.res_name;

	}else{
		// res_yrn is full yrn to resource, then need to check tenant name
		if(apiutil.isSafeString(result.parameters.token_type) && !apiutil.compareCaseString(namematchs[2], tmpTenant)){
			result.result	= false;
			result.message	= 'Request query has wrong yrn full path(tenant=' + namematchs[2] + ') to resource(tenant=' + apiutil.getSafeString(tmpTenant) + ')';
			result.status	= 400;														// 400: Bad Request
			r3logger.elog(result.message);
			return result;
		}
		// check service name
		if(apiutil.isSafeString(service_param) && !apiutil.compareCaseString(service_param, namematchs[1])){
			result.result	= false;
			result.message	= 'Request query has service name(' + service_param + ') and path has service name(' + namematchs[1] + '), but both are not same service name.';
			result.status	= 400;														// 400: Bad Request
			r3logger.elog(result.message);
			return result;
		}
		result.parameters.res_name		= namematchs[3].toLowerCase();
		result.parameters.res_tenant	= namematchs[2].toLowerCase();	// resource is yrn, then resource's tenant is set from yrn.
		result.parameters.res_service	= namematchs[1].toLowerCase();	// resource is not yrn, then service is not specified.
		result.parameters.keys			= r3keys(tmpUser, tmpTenant, result.parameters.res_service);
	}

	return result;
};

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
router.post('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isPlainObject(req.body) ||
		!apiutil.isPlainObject(req.body.resource) )
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST body does not have resource data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);									// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	const	resobj = rawParseBaseParamRequestAPI(req, false, apiutil.isSafeString(req.body.resource.name) ? req.body.resource.name : null);
	if(!resobj.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	resobj.message
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, resobj.status, result);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check resource
	//------------------------------
	if(	apiutil.isString(comparam.token_type) &&
		(	apiutil.isSafeString(comparam.tenant_name) !== apiutil.isSafeString(comparam.res_tenant)	||
			apiutil.getSafeString(comparam.tenant_name) !== apiutil.getSafeString(comparam.res_tenant)	||
			apiutil.isSafeString(comparam.res_service)
		)
	){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST request resource(' + JSON.stringify(comparam.res_name) + ') is under tenant(' + JSON.stringify(comparam.res_tenant) + ') and service(' + JSON.stringify(comparam.res_service) + '), it is not under tenant(' + JSON.stringify(comparam.tenant_name) + ').'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);									// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	// data type
	let	type: string;
	if(apiutil.isSafeString(req.body.resource.type)){
		type = apiutil.getSafeString(req.body.resource.type);
		if(!apiutil.compareCaseString('string', type) && !apiutil.compareCaseString('object', type)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST resource:type field is wrong : ' + JSON.stringify(req.body.resource.type)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}
	}else{
		type = comparam.keys.VALUE_STRING_TYPE;										// default type is string
	}

	// data
	let	data: valTypeAll = null;
	if(apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, type)){
		if(apiutil.isString(req.body.resource.data) && '' === req.body.resource.data){
			data = '';
		}else if(apiutil.isSafeString(req.body.resource.data)){
			// data is string(nodejs is decodeURI automatically)
			// this value includes control codes(\n, etc)
			data = apiutil.getSafeString(req.body.resource.data);
		}
	}else{	// type == object
		if(apiutil.isValTypeAll(req.body.resource.data)){
			data = req.body.resource.data;
		}
	}

	// keys
	let	resource_keys: string | dkcTypeResourceRawKeysValue | null = null;
	if(apiutil.isSafeEntity(req.body.resource.keys)){
		if(apiutil.isString(req.body.resource.keys) && '' === req.body.resource.keys){
			resource_keys = '';
		}else if(k2hr3.isDkcTypeResourceRawKeysValue(req.body.resource.keys)){
			resource_keys = req.body.resource.keys;
		}else if(apiutil.isSafeString(req.body.resource.keys)){
			const	tmp_keys = apiutil.getSafeString(req.body.resource.keys);
			if(apiutil.checkSimpleJSON(tmp_keys)){
				const	tmp_parsed_keys = JSON.parse(tmp_keys);
				if(apiutil.isSafeString(tmp_parsed_keys)){
					resource_keys = tmp_parsed_keys;
				}else if(k2hr3.isDkcTypeResourceRawKeysValue(tmp_parsed_keys)){
					resource_keys = tmp_parsed_keys;
				}else{
					resource_keys = null;
				}
			}else{
				resource_keys = tmp_keys;
			}
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST resource:keys field is wrong : ' + JSON.stringify(req.body.resource.keys)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}
	}

	// alias
	if('user' !== apiutil.getSafeString(comparam.token_type) && apiutil.isSafeEntity(req.body.resource.alias)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST resource:alias field is specified, but it is not allowed by not user token : ' + JSON.stringify(req.body.resource.alias)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);									// 400: Bad Request
		return;
	}
	let	aliases: string | string[] | null = null;
	if('user' === apiutil.getSafeString(comparam.token_type)){
		const	aliasptn	= new RegExp('^' + comparam.keys.RESOURCE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:resource:(.*)/
		const	aliaspram	= apiutil.getNormalizeParameter(req.body.resource.alias, aliasptn, null);
		if(false === aliaspram.result){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST resource:alias field is wrong : ' + JSON.stringify(req.body.resource.alias)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}
		aliases = aliaspram.parameter ?? null;
	}

	// role yrn/ip address/port for no token
	let	clientip: string | null	= null;
	let	port: number			= 0;
	let	cuk: string | null		= null;
	let	role_yrn: string | null	= null;
	if(apiutil.isSafeString(comparam.token_type) && (apiutil.isSafeEntity(req.body.resource.port) || apiutil.isSafeEntity(req.body.resource.cuk) || apiutil.isSafeEntity(req.body.resource.role))){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.body.resource.port) + ', cuk=' + JSON.stringify(req.body.resource.cuk) + ', role=' + JSON.stringify(req.body.resource.role)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);									// 400: Bad Request
		return;
	}
	if(!apiutil.isSafeString(comparam.token_type)){
		// role
		if(!apiutil.isSafeString(req.body.resource.role)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request does not have role yrn in post data.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}

		// [NOTE]
		// not check role is full yrn here.
		role_yrn = apiutil.getSafeString(req.body.resource.role);

		// ip
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request does not have ip address for client.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}

		// port
		if(apiutil.isSafeNumeric(req.body.resource.port)){
			const	tmpPort = apiutil.cvtToNumber(req.body.resource.port);
			if(apiutil.isSafeNumber(tmpPort)){
				port = tmpPort;
			}else{
				port = 0;
			}
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
	let	res_result: resTypeBaseResult | null;
	if('user' === apiutil.getSafeString(comparam.token_type)){
		res_result = k2hr3.setResourceAll(comparam.user_name, comparam.tenant_name, comparam.res_name, type, data, resource_keys, aliases);
	}else if('role' === apiutil.getSafeString(comparam.token_type)){
		res_result = k2hr3.setResourceAllByRole((comparam.token_info?.role ?? null), comparam.tenant_name, comparam.res_name, type, data, resource_keys);
	}else if(!apiutil.isSafeString(comparam.token_type)){
		res_result = k2hr3.setResourceAllByIP(clientip, port, cuk, role_yrn, comparam.res_name, type, data, resource_keys);
	}else{
		// broken token
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST request is failure by internal error(token data broken).'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);									// 500: Internal Error
		return;
	}
	if(!apiutil.isPlainObject(res_result) || !apiutil.isBoolean(res_result.result) || false === res_result.result){
		if(!apiutil.isPlainObject(res_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST Could not get response from setResourceAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	apiutil.isSafeString(res_result.message) ? res_result.message : 'POST Could not get error message in response from setResourceAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(res_result.message));

	const	success_result: resTypeBaseResult = {
		result: 	true,
		message:	null
	};
	res.status(201);																// 201: Created
	res.send(JSON.stringify(success_result));
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
router.put('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isPlainObject(req.query)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT argument does not have any data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);									// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	const	resobj = rawParseBaseParamRequestAPI(req, false, (apiutil.isString(req.query.name) ? req.query.name : null));
	if(!resobj.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	resobj.message
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, resobj.status, result);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check resource
	//------------------------------
	if(	apiutil.isString(comparam.token_type) &&
		(	apiutil.isSafeString(comparam.tenant_name) !== apiutil.isSafeString(comparam.res_tenant)	||
			apiutil.getSafeString(comparam.tenant_name) !== apiutil.getSafeString(comparam.res_tenant)	||
			apiutil.isSafeString(comparam.res_service)
		)
	){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request resource(' + JSON.stringify(comparam.res_name) + ') is under tenant(' + JSON.stringify(comparam.res_tenant) + ') and service(' + JSON.stringify(comparam.res_service) + '), it is not under tenant(' + JSON.stringify(comparam.tenant_name) + ').'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);									// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	// data type
	let	type: string;
	if(apiutil.isSafeString(req.query.type)){
		type = apiutil.getSafeString(req.query.type);
		if(!apiutil.compareCaseString('string', type) && !apiutil.compareCaseString('object', type)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT resource:type field is wrong : ' + JSON.stringify(req.query.type)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}
	}else{
		type = comparam.keys.VALUE_STRING_TYPE;										// default type is string
	}

	// data
	let	data: string | null  = null;
	if(apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, type)){
		if(apiutil.isString(req.query.data) && '' === req.query.data){
			data = '';
		}else if(apiutil.isSafeString(req.query.data)){
			const	tmpData = apiutil.getSafeString(req.query.data);
			if(apiutil.checkSimpleJSON(tmpData)){
				data = JSON.parse(tmpData);											// decode JSON
			}else if(apiutil.isSafeString(tmpData)){
				data = tmpData;
			}
		}
	}else{	// type == object
		if(apiutil.isSafeString(req.query.data)){
			const	tmpData = apiutil.getSafeString(req.query.data);
			if(apiutil.checkSimpleJSON(tmpData)){
				data = JSON.parse(tmpData);											// decode JSON
			}else if(apiutil.isSafeString(tmpData)){
				data = tmpData;
			}
		}
	}

	// keys
	let	resource_keys: string | dkcTypeResourceRawKeysValue | null = null;
	if(apiutil.isString(req.query.keys) && '' === req.query.keys){
		resource_keys = '';
	}else if(apiutil.isSafeString(req.query.keys)){
		// keys is encoded by JSON, this value is associative array.
		//
		const	tmp_keys = apiutil.getSafeString(req.query.keys);
		if(apiutil.checkSimpleJSON(tmp_keys)){
			const	tmp_parsed_keys = JSON.parse(tmp_keys);
			if(apiutil.isSafeString(tmp_parsed_keys)){
				resource_keys = tmp_parsed_keys;
			}else if(k2hr3.isDkcTypeResourceRawKeysValue(tmp_parsed_keys)){
				resource_keys = tmp_parsed_keys;
			}else{
				resource_keys = null;
			}
		}else{
			resource_keys = tmp_keys;
		}
	}

	// alias
	if('user' !== apiutil.getSafeString(comparam.token_type) && apiutil.isSafeEntity(req.query.alias)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT resource:alias field is specified, but it is not allowed by not user token : ' + JSON.stringify(req.query.alias)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);									// 400: Bad Request
		return;
	}
	let	aliases: string | string[] | null = null;
	if('user' === apiutil.getSafeString(comparam.token_type)){
		if(apiutil.isString(req.query.alias) && '' === req.query.alias){
			aliases = '';
		}else if(apiutil.isSafeString(req.query.alias)){
			// alias is encoded by JSON, this value is array.
			//
			let	tmpaliases		= apiutil.getSafeString(req.query.alias);
			if(apiutil.checkSimpleJSON(tmpaliases)){
				tmpaliases		= JSON.parse(tmpaliases);
			}
			const	aliasptn	= new RegExp('^' + comparam.keys.RESOURCE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:resource:(.*)/
			const	aliaspram	= apiutil.getNormalizeParameter(tmpaliases, aliasptn, null);
			if(false === aliaspram.result){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'PUT resource:alias field is wrong : ' + req.query.alias
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);							// 400: Bad Request
				return;
			}
			aliases = aliaspram.parameter ?? null;
		}
	}

	// role yrn/ip address/port for no token
	let	clientip: string | null	= null;
	let	port: number			= 0;
	let	cuk: string | null		= null;
	let	role_yrn: string | null	= null;
	if(apiutil.isSafeString(comparam.token_type) && (apiutil.isSafeEntity(req.query.port) || apiutil.isSafeEntity(req.query.cuk) || apiutil.isSafeEntity(req.query.role))){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.query.port) + ', cuk=' + JSON.stringify(req.query.cuk) + ', role=' + JSON.stringify(req.query.role)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);									// 400: Bad Request
		return;
	}
	if(!apiutil.isSafeString(comparam.token_type)){
		// role
		if(!apiutil.isSafeString(req.query.role)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request does not have role yrn in post data.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}

		// [NOTE]
		// not check role is full yrn here.
		role_yrn = apiutil.getSafeString(req.query.role);

		// ip
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request does not have ip address for client.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}

		// port
		if(apiutil.isSafeNumeric(req.query.port)){
			const	tmpPort = apiutil.cvtToNumber(req.query.port);
			if(apiutil.isSafeNumber(tmpPort)){
				port = tmpPort;
			}else{
				port = 0;
			}
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
	let	res_result: resTypeBaseResult;
	if('user' === apiutil.getSafeString(comparam.token_type)){
		res_result = k2hr3.setResourceAll(comparam.user_name, comparam.tenant_name, comparam.res_name, type, data, resource_keys, aliases);
	}else if('role' === apiutil.getSafeString(comparam.token_type)){
		res_result = k2hr3.setResourceAllByRole((comparam.token_info?.role ?? null), comparam.tenant_name, comparam.res_name, type, data, resource_keys);
	}else if(!apiutil.isSafeString(comparam.token_type)){
		res_result = k2hr3.setResourceAllByIP(clientip, port, cuk, role_yrn, comparam.res_name, type, data, resource_keys);
	}else{
		// broken token
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request is failure by internal error(token data broken).'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);									// 500: Internal Error
		return;
	}
	if(!apiutil.isPlainObject(res_result) || !apiutil.isBoolean(res_result.result) || false === res_result.result){
		if(!apiutil.isPlainObject(res_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT Could not get response from setResourceAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	apiutil.isSafeEntity(res_result.message) ? res_result.message : 'PUT Could not get error message in response from setResourceAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(res_result.message));

	const	success_result: resTypeBaseResult = {
		result: 	true,
		message:	null
	};
	res.status(201);																// 201: Created
	res.send(JSON.stringify(success_result));
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
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request or url is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);				// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	const	resobj = rawParseBaseParamRequestAPI(req, true, null);
	if(!resobj.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	resobj.message
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, resobj.status, result);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check arguments
	//------------------------------
	// expand type(only user token type)
	let	is_expand: boolean = true;
	if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.expand)){
		if('user' === apiutil.getSafeString(comparam.token_type)){
			if(apiutil.compareCaseString(comparam.keys.VALUE_TRUE, req.query.expand)){
				is_expand = true;
			}else if(apiutil.compareCaseString(comparam.keys.VALUE_FALSE, req.query.expand)){
				is_expand = false;
			}else{
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET expand url argument parameter(' + JSON.stringify(req.query.expand) + ') is wrong, it must be ' + comparam.keys.VALUE_TRUE + ' or ' + comparam.keys.VALUE_FALSE + '.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);		// 400: Bad Request
				return;
			}
		}else{
			r3logger.wlog('GET found unnessesary expand(' + JSON.stringify(req.query.expand) + ') parameter, skip this.');
		}
	}

	// type, key parameter(role token/no token type)
	let	restype: string | null		= null;
	let	reskeyname: string | null	= null;
	if(!apiutil.isSafeString(comparam.token_type) || 'role' === apiutil.getSafeString(comparam.token_type)){
		if(!apiutil.isPlainObject(req.query) || !apiutil.isSafeString(req.query.type)){
			restype	= comparam.keys.VALUE_STRING_TYPE;
		}else if(apiutil.isSafeString(req.query.type) && apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, req.query.type)){
			restype	= comparam.keys.VALUE_STRING_TYPE;
		}else if(apiutil.isSafeString(req.query.type) && apiutil.compareCaseString(comparam.keys.VALUE_OBJECT_TYPE, req.query.type)){
			restype	= comparam.keys.VALUE_OBJECT_TYPE;
		}else if(apiutil.isSafeString(req.query.type) && apiutil.compareCaseString(comparam.keys.VALUE_KEYS_TYPE, req.query.type)){
			restype	= comparam.keys.VALUE_KEYS_TYPE;
			// key name
			if(!apiutil.isPlainObject(req.query) || !apiutil.isSafeString(req.query.keyname)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET request type=keys, but keyname(' + req.query.keyname + ') parameter is empty.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);		// 400: Bad Request
				return;
			}
			reskeyname = req.query.keyname;
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request type(' + req.query.type + ') parameter is wrong.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			return;
		}
	}

	// role yrn/ip address/port for no token
	let	clientip: string | null	= null;
	let	port: number			= 0;
	let	cuk: string | null		= null;
	let	role_yrn: string | null	= null;
	if(apiutil.isSafeString(comparam.token_type) && (apiutil.isSafeEntity(req.query.port) || apiutil.isSafeEntity(req.query.cuk) || apiutil.isSafeEntity(req.query.role))){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.query.port) + ', cuk=' + JSON.stringify(req.query.cuk) + ', role=' + JSON.stringify(req.query.role)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);				// 400: Bad Request
		return;
	}
	if(!apiutil.isSafeString(comparam.token_type)){
		// role
		if(!apiutil.isSafeString(req.query.role)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request does not have role yrn in post data.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			return;
		}
		// [NOTE]
		// not check role is full yrn here.
		role_yrn = apiutil.getSafeString(req.query.role);

		// ip
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request does not have ip address for client.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);			// 400: Bad Request
			return;
		}

		// port
		if(apiutil.isSafeNumeric(req.query.port)){
			const	tmpPort = apiutil.cvtToNumber(req.query.port);
			if(apiutil.isSafeNumber(tmpPort)){
				port = tmpPort;
			}else{
				port = 0;
			}
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
	let	jsonres: string;
	let	result_value: boolean;
	let	result_msg: string | null;
	if('user' === apiutil.getSafeString(comparam.token_type)){
		const	res_result	= k2hr3.getResource(comparam.user_name, comparam.tenant_name, comparam.res_service, comparam.res_name, is_expand);
		result_value		= res_result.result;
		result_msg			= res_result.message;
		jsonres				= JSON.stringify(res_result);

	}else if('role' === apiutil.getSafeString(comparam.token_type)){
		// [NOTE]
		// comparam.token_info.role is role full yrn path, it does not include service name.
		// Because we do not put role token for role under service path.
		//
		const	res_result	= k2hr3.getResourceByRole((comparam.token_info?.role ?? null), comparam.res_yrn, restype, reskeyname);
		result_value		= res_result.result;
		result_msg			= res_result.message;
		jsonres				= JSON.stringify(res_result);

	}else if(!apiutil.getSafeString(comparam.token_type)){
		// [NOTE]
		// role_yrn allows a path containing service.
		// However, the case is rare and should not be used.
		//
		const	res_result	= k2hr3.getResourceByIP(clientip, port, cuk, role_yrn, comparam.res_yrn, restype, reskeyname);
		result_value		= res_result.result;
		result_msg			= res_result.message;
		jsonres				= JSON.stringify(res_result);
	}else{
		// broken token
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request is failure by internal error(token data broken).'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);				// 500: Internal Error
		return;
	}

	if(false === result_value){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	apiutil.isString(result_msg) ? result_msg : 'GET Could not get error message in response from getResource'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 404, result);				// 404: Not Found
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(result_msg));

	res.status(200);											// 200: OK
	res.send(jsonres);
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
		r3logger.elog('HEAD request or url or query is wrong');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	const	resobj = rawParseBaseParamRequestAPI(req, true, null);
	if(!resobj.result){
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check arguments
	//------------------------------
	// type, key parameter
	let	restype: string | null;
	let	reskeyname: string | null	= null;
	if(!apiutil.isPlainObject(req.query) || !apiutil.isSafeString(req.query.type)){
		restype	= comparam.keys.VALUE_STRING_TYPE;
	}else if(apiutil.isSafeString(req.query.type) && apiutil.compareCaseString(comparam.keys.VALUE_STRING_TYPE, req.query.type)){
		restype	= comparam.keys.VALUE_STRING_TYPE;
	}else if(apiutil.isSafeString(req.query.type) && apiutil.compareCaseString(comparam.keys.VALUE_OBJECT_TYPE, req.query.type)){
		restype	= comparam.keys.VALUE_OBJECT_TYPE;
	}else if(apiutil.isSafeString(req.query.type) && apiutil.compareCaseString(comparam.keys.VALUE_KEYS_TYPE, req.query.type)){
		restype	= comparam.keys.VALUE_KEYS_TYPE;
		// key name
		if(!apiutil.isPlainObject(req.query) || !apiutil.isSafeString(req.query.keyname)){
			r3logger.elog('HEAD request type=keys, but keyname(' + JSON.stringify(req.query.keyname) + ') parameter is empty.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		reskeyname = apiutil.isString(req.query.keyname) ? req.query.keyname : null;
	}else{
		r3logger.elog('HEAD request type(' + JSON.stringify(req.query.type) + ') parameter is wrong.');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	// role yrn/ip address/port for no token
	let	clientip: string | null	= null;
	let	port: number			= 0;
	let	cuk: string | null		= null;
	let	role_yrn: string | null	= null;
	if(apiutil.isSafeString(comparam.token_type) && (apiutil.isSafeEntity(req.query.port) || apiutil.isSafeEntity(req.query.cuk) || apiutil.isSafeEntity(req.query.role))){
		r3logger.elog('HEAD resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.query.port) + ', cuk=' + JSON.stringify(req.query.cuk) + ', role=' + JSON.stringify(req.query.role));
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}
	if(!apiutil.isSafeString(comparam.token_type)){
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
		if(apiutil.isSafeNumeric(req.query.port)){
			const	tmpPort = apiutil.cvtToNumber(req.query.port);
			if(apiutil.isSafeNumber(tmpPort)){
				port = tmpPort;
			}else{
				port = 0;
			}
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
	let	result_value: boolean;
	let	result_msg: string | null;
	if('user' === apiutil.getSafeString(comparam.token_type)){
		const	res_result	= k2hr3.checkResource(comparam.user_name, comparam.tenant_name, comparam.res_service, comparam.res_name, restype, reskeyname);
		result_value		= res_result.result;
		result_msg			= res_result.message;

	}else if('role' === apiutil.getSafeString(comparam.token_type) && apiutil.isPlainObject(comparam.token_info) && apiutil.isString(comparam.token_info.role)){
		// [NOTE]
		// comparam.token_info.role is role full yrn path, it does not include service name.
		// Because we do not put role token for role under service path.
		//
		const	res_result	= k2hr3.checkResourceByRole(comparam.token_info.role, comparam.tenant_name, comparam.res_yrn, restype, reskeyname);
		result_value		= res_result.result;
		result_msg			= res_result.message;

	}else if(!apiutil.getSafeString(comparam.token_type)){
		// [NOTE]
		// role_yrn allows a path containing service.
		// However, the case is rare and should not be used.
		//
		const	res_result	= k2hr3.checkResourceByIP(clientip, port, cuk, role_yrn, comparam.res_yrn, restype, reskeyname);
		result_value		= res_result.result;
		result_msg			= res_result.message;

	}else{
		// broken token
		r3logger.elog('HEAD request is failure by internal error(token data broken).');
		resutil.errResponse(req, res, 500);					// 500: Internal Error
		return;
	}

	if(false === result_value){
		r3logger.elog(apiutil.isString(result_msg) ? result_msg : 'HEAD Could not get error message in response from checkResource');
		resutil.errResponse(req, res, 403);					// 403: Forbidden
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(result_msg));

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
router.delete('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		r3logger.elog('DELETE request or url or query is wrong');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	//------------------------------
	// check common parameters(token, role, resource etc)
	//------------------------------
	const	resobj = rawParseBaseParamRequestAPI(req, false, null);
	if(!resobj.result){
		r3logger.elog(resobj.message);
		resutil.errResponse(req, res, resobj.status);
		return;
	}
	const	comparam = resobj.parameters;

	//------------------------------
	// check resource(must be same tenant)
	//------------------------------
	if(	apiutil.isString(comparam.token_type) &&
		(	apiutil.isSafeString(comparam.tenant_name) !== apiutil.isSafeString(comparam.res_tenant)	||
			apiutil.getSafeString(comparam.tenant_name) !== apiutil.getSafeString(comparam.res_tenant)	||
			apiutil.isSafeString(comparam.res_service)
		)
	){
		r3logger.elog('DELETE request resource(' + JSON.stringify(comparam.res_name) + ') is under tenant(' + JSON.stringify(comparam.res_tenant) + ') and service(' + JSON.stringify(comparam.res_service) + '), it is not under tenant(' + JSON.stringify(comparam.tenant_name) + ').');
		resutil.errResponse(req, res, 400);				// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	// type, key parameter(role token/no token type)
	let	datatype: string | null;
	let	keynames: string[] | null	= null;
	let	aliases: string[] | null	= null;
	if(!apiutil.isPlainObject(req.query) || !apiutil.isSafeString(req.query.type)){
		if('user' !== apiutil.getSafeString(comparam.token_type)){
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
		if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.keynames)){
			const	keynames_tmp = req.query.keynames;
			if(apiutil.checkSimpleJSON(keynames_tmp)){
				const	keynames_parsed = JSON.parse(keynames_tmp);
				if(!apiutil.isStringArray(keynames_parsed) || !apiutil.isNotEmptyArray(keynames_parsed)){
					r3logger.elog('DELETE request type(' + req.query.type + ') parameter keynames(' + JSON.stringify(req.query.keynames) + ') is wrong.');
					resutil.errResponse(req, res, 400);		// 400: Bad Request
					return;
				}
				keynames = keynames_parsed;
			}else{
				keynames = [keynames_tmp];
			}
		}
	}else if(apiutil.compareCaseString(comparam.keys.VALUE_ALIAS_TYPE, req.query.type)){
		datatype	= comparam.keys.VALUE_ALIAS_TYPE;
		if('user' !== apiutil.getSafeString(comparam.token_type)){
			r3logger.elog('DELETE request type=aliases, this type needs user token.');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		// aliases
		if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.aliases)){
			const	aliases_tmp = req.query.aliases;
			if(apiutil.checkSimpleJSON(aliases_tmp)){
				const	aliases_parsed = JSON.parse(aliases_tmp);
				if(!apiutil.isStringArray(aliases_parsed) || !apiutil.isNotEmptyArray(aliases_parsed)){
					r3logger.elog('DELETE request type(' + req.query.type + ') parameter aliases(' + JSON.stringify(req.query.alias) + ') is wrong.');
					resutil.errResponse(req, res, 400);		// 400: Bad Request
					return;
				}
				aliases = aliases_parsed;
			}else{
				aliases = [aliases_tmp];
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
	let	clientip: string | null	= null;
	let	port: number			= 0;
	let	cuk: string | null		= null;
	let	role_yrn: string | null	= null;
	if(apiutil.isSafeString(comparam.token_type) && (apiutil.isSafeEntity(req.query.port) || apiutil.isSafeEntity(req.query.cuk) || apiutil.isSafeEntity(req.query.role))){
		r3logger.elog('DELETE resource:port/cuk/role field is specified, but it is not allowed by no token : port=' + JSON.stringify(req.query.port) + ', cuk=' + JSON.stringify(req.query.cuk) + ', role=' + JSON.stringify(req.query.role));
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}
	if(!apiutil.isSafeString(comparam.token_type)){
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
		if(apiutil.isSafeNumeric(req.query.port)){
			const	tmpPort = apiutil.cvtToNumber(req.query.port);
			if(apiutil.isSafeNumber(tmpPort)){
				port = tmpPort;
			}else{
				port = 0;
			}
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
	let	result_value: boolean;
	let	result_msg: string | null;
	if('user' === apiutil.getSafeString(comparam.token_type)){
		const	res_result	= k2hr3.removeResource(comparam.user_name, comparam.tenant_name, comparam.res_name, datatype, keynames, aliases);
		result_value		= res_result.result;
		result_msg			= res_result.message;

	}else if('role' === apiutil.getSafeString(comparam.token_type) && apiutil.isPlainObject(comparam.token_info) && apiutil.isString(comparam.token_info.role)){
		const	res_result= k2hr3.removeResourceByRole(comparam.token_info.role, comparam.tenant_name, comparam.res_name, datatype, keynames);
		result_value		= res_result.result;
		result_msg			= res_result.message;

	}else if(!apiutil.getSafeString(comparam.token_type)){
		const	res_result	= k2hr3.removeResourceByIP(clientip, port, cuk, role_yrn, comparam.res_name, datatype, keynames);
		result_value		= res_result.result;
		result_msg			= res_result.message;

	}else{
		// broken token
		r3logger.elog('DELETE request is failure by internal error(token data broken).');
		resutil.errResponse(req, res, 500);					// 500: Internal Error
		return;
	}
	if(false === result_value){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	apiutil.isString(result_msg) ? result_msg : 'DELETE Could not get error message in response from removeResource'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 404, result);			// 404: Not Found
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(result_msg));

	res.status(204);										// 204: No Content
	res.send();
});

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Functions
//
export default router;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
