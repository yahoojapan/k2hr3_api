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

// Mountpath			: '/v1/policy'
// POST '/v1/policy'	: post policy on version 1
// response body		: result	=> true/false
//						  message	=> messages
// body					: 
//	{
//		"policy":	{
//			"name":			<policy name>					=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>"
//			"effect":		"allow" or "deny"				=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>/effect"
//																if null or undefined is specified, not update this member in policy when this policy exists.
//																if '' or zero array, this member in policy is set default(default deny)..
//			"action":		[<action yrn full path>, ...]	=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>/action"
//																specify "yrn:yahoo::::action:read" or "yrn:yahoo::::action:write"
//																if null or undefined is specified, not update this member in policy when this policy exists.
//																if '' or zero array, this member in policy is set empty array.
//			"resource":		[<resource yrn full path>, ...]	=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>/resource"
//																specify "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
//																if null or undefined is specified, not update this member in policy when this policy exists.
//																if '' or zero array, this member in policy is set empty array.
//			"condition":	null or undefined				=>	this member is reserved on v1, must be null or undefined.
//			"alias":		[<policy yrn full path>, ...]	=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>/@"
//																specify another policy as "yrn:yahoo:<service>::<tenant>:policy:<policy>"
//																if null or undefined is specified, not update this member in policy when this policy exists.
//																if '' or zero array, this member in policy is set empty array.
//		}
//	}
//
router.post('/', function(req, res, next)					// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.body) ||
		!apiutil.isSafeEntity(req.body.policy) )
	{
		result = {
			result: 	false,
			message:	'POST body does not have policy data'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);	// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info = token_result.token_info;

	//------------------------------
	// check arguments
	//------------------------------
	if(!apiutil.isSafeString(req.body.policy.name)){
		result = {
			result: 	false,
			message:	'policy:name field is wrong : ' + JSON.stringify(req.body.policy.name)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	keys	= r3keys(token_info.user, token_info.tenant);
	var	name	= apiutil.getSafeString(req.body.policy.name);
	name		= name.toLowerCase();
	// policy name is only name or full yrn path
	var	nameptn		= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	var	namematchs	= name.match(nameptn);
	if(!apiutil.isEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}
	// check token's tenant(if same tenant, name is not full yrn)
	nameptn	= new RegExp('^' + keys.NO_TENANT_KEY);			// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		result = {
			result: 	false,
			message:	'POST request url has wrong yrn full path to policy'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	var	effect;
	if(!apiutil.isSafeEntity(req.body.policy.effect)){
		effect = null;										// = not update if policy exists
	}else if('' === req.body.policy.effect){
		effect = false;										// = deny
	}else if(apiutil.compareCaseString(req.body.policy.effect, keys.VALUE_ALLOW)){
		effect = true;										// = allow
	}else if(apiutil.compareCaseString(req.body.policy.effect, keys.VALUE_DENY)){
		effect = false;										// = deny
	}else{
		result = {
			result: 	false,
			message:	'policy:effect field is wrong : ' + JSON.stringify(req.body.policy.effect)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	var	actptns = [keys.ACTION_READ_KEY, keys.ACTION_WRITE_KEY];			// allow string as read/write yrn full path
	var	actpram = apiutil.getNormalizeParameter(req.body.policy.action, null, actptns);
	if(false === actpram.result){
		result = {
			result: 	false,
			message:	'policy:action field is wrong : ' + JSON.stringify(req.body.policy.action)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	actions = actpram.parameter;

	var	resptn	= new RegExp('^' + keys.RESOURCE_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:resource:(.*)/
	var	respram = apiutil.getNormalizeParameter(req.body.policy.resource, resptn, null);
	if(false === respram.result){
		result = {
			result: 	false,
			message:	'policy:resource field is wrong : ' + JSON.stringify(req.body.policy.resource)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	resources = respram.parameter;

	var	condition;
	if(!apiutil.isSafeEntity(req.body.policy.condition) || '' === req.body.policy.condition){
		condition = null;									// now reserved this field
	}else{
		result = {
			result: 	false,
			message:	'policy:condition field is wrong : ' + JSON.stringify(req.body.policy.condition)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	var	aliasptn	= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	var	aliaspram	= apiutil.getNormalizeParameter(req.body.policy.alias, aliasptn, null);
	if(false === aliaspram.result){
		result = {
			result: 	false,
			message:	'policy:alias field is wrong : ' + JSON.stringify(req.body.policy.alias)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	aliases = aliaspram.parameter;

	//------------------------------
	// set all field to policy
	//------------------------------
	result = k2hr3.setPolicyAll(token_info.user, token_info.tenant, name, effect, actions, resources, condition, aliases);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from setPolicyAll'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from setPolicyAll';
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

// Mountpath			: '/v1/policy'
// PUT '/v1/policy'		: put policy on version 1
// response body		: result	=> true/false
//						  message	=> messages
// url argument
//		"name"			: <policy name>						=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>"
//		"effect"		: "allow" or "deny"					=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>/effect"
//																if null or undefined is specified, not update this member in policy when this policy exists.
//																if '' or zero array, this member in policy is set default(default deny)..
//		"action"		: [<action yrn full path>, ...]		=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>/action"
//																specify "yrn:yahoo::::action:read" or "yrn:yahoo::::action:write"
//																if null or undefined is specified, not update this member in policy when this policy exists.
//																if '' or zero array, this member in policy is set empty array.
//		"resource"		: [<resource yrn full path>, ...]	=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>/resource"
//																specify "yrn:yahoo:<service>::<tenant>:resource:<resource>{/<resource>{...}}"
//																if null or undefined is specified, not update this member in policy when this policy exists.
//																if '' or zero array, this member in policy is set empty array.
//		"condition"		: null or undefined					=>	this member is reserved on v1, must be null or undefined.
//		"alias"			: [<policy yrn full path>, ...]		=>	key is "yrn:yahoo:<service>::<tenant>:policy:<policy>/@"
//																specify another policy as "yrn:yahoo:<service>::<tenant>:policy:<policy>"
//																if null or undefined is specified, not update this member in policy when this policy exists.
//																if '' or zero array, this member in policy is set empty array.
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
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);	// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);

		return;
	}
	var	token_info = token_result.token_info;

	//------------------------------
	// check arguments
	//------------------------------
	if(!apiutil.isSafeString(req.query.name)){
		result = {
			result: 	false,
			message:	'policy:name field is wrong : ' + JSON.stringify(req.query.name)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	keys	= r3keys(token_info.user, token_info.tenant);
	var	name	= apiutil.getSafeString(req.query.name);
	name		= name.toLowerCase();

	// policy name is only name or full yrn path
	var	nameptn		= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	var	namematchs	= name.match(nameptn);
	if(!apiutil.isEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}
	// check token's tenant(if same tenant, name is not full yrn)
	nameptn	= new RegExp('^' + keys.NO_TENANT_KEY);			// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		result = {
			result: 	false,
			message:	'PUT request url has wrong yrn full path to policy'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	var	effect;
	if(!apiutil.isSafeEntity(req.query.effect)){
		effect = null;										// = not update if policy exists
	}else if('' === req.query.effect){
		effect = false;										// = deny
	}else if(apiutil.compareCaseString(req.query.effect, keys.VALUE_ALLOW)){
		effect = true;										// = allow
	}else if(apiutil.compareCaseString(req.query.effect, keys.VALUE_DENY)){
		effect = false;										// = deny
	}else{
		result = {
			result: 	false,
			message:	'policy:effect field is wrong : ' + JSON.stringify(req.query.effect)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	var	actptns = [keys.ACTION_READ_KEY, keys.ACTION_WRITE_KEY];			// allow string as read/write yrn full path
	var	actpram = apiutil.getNormalizeParameter(req.query.action, null, actptns);
	if(false === actpram.result){
		result = {
			result: 	false,
			message:	'policy:action field is wrong : ' + JSON.stringify(req.query.action)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	actions = actpram.parameter;

	var	resptn	= new RegExp('^' + keys.RESOURCE_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:resource:(.*)/
	var	respram = apiutil.getNormalizeParameter(req.query.resource, resptn, null);
	if(false === respram.result){
		result = {
			result: 	false,
			message:	'policy:resource field is wrong : ' + JSON.stringify(req.query.resource)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	resources = respram.parameter;

	var	condition;
	if(!apiutil.isSafeEntity(req.query.condition) || '' === req.query.condition){
		condition = null;									// now reserved this field
	}else{
		result = {
			result: 	false,
			message:	'policy:condition field is wrong : ' + JSON.stringify(req.query.condition)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	var	aliasptn	= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	var	aliaspram	= apiutil.getNormalizeParameter(req.query.alias, aliasptn, null);
	if(false === aliaspram.result){
		result = {
			result: 	false,
			message:	'policy:alias field is wrong : ' + JSON.stringify(req.query.alias)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	aliases = aliaspram.parameter;

	//------------------------------
	// set all field to policy
	//------------------------------
	result = k2hr3.setPolicyAll(token_info.user, token_info.tenant, name, effect, actions, resources, condition, aliases);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from setPolicyAll'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from setPolicyAll';
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

// Mountpath				: '/v1/policy/*'
// GET '/v1/policy/name'	: get policy on version 1(name is allowed full yrn path)
// URL arguments			: service	=> undefined or service name
// response body			: result	=> true/false
//							  message	=> error message
//							  policy	=> object
// policy object
//		{
//			"name":			<policy name>
//			"effect":		"allow" or "deny"
//			"action":		[<action yrn full path>, ...]
//			"resource":		[<resource yrn full path>, ...]
//			"condition":	null or undefined
//			"alias":		[<policy yrn full path>, ...]
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
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.baseUrl) )
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
	// service name
	//------------------------------
	var	service = null;
	if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.service)){
		service = apiutil.getSafeString(req.query.service).toLowerCase();
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
	var	keys		= r3keys(token_info.user, token_info.tenant, service);

	//------------------------------
	// check policy name
	//------------------------------
	var	requestptn	= new RegExp('^/v1/policy/(.*)');					// regex = /^\/v1\/policy\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result = {
			result: 	false,
			message:	'GET request url does not have policy name'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	name	= reqmatchs[1];
	name		= name.toLowerCase();

	//
	// make policy name from policy yrn
	//
	var	nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_POLICY);						// regex = /^yrn:yahoo:(.*)::(.*):policy:(.*)/
	var	namematchs	= name.match(nameptn);
	if(apiutil.isEmptyArray(namematchs) || namematchs.length < 4){
		// name is not full yrn to policy, then check wrong policy name
		nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query has wrong yrn full path to policy';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// no token need full yrn to policy(other token has tenant name)
		if(null === token_result.token_type){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query does not have yrn full path to policy';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// no problem, name is policy name

	}else{
		// name is full yrn to policy, then need to check tenant name
		if(null !== token_result.token_type && !apiutil.compareCaseString(namematchs[2], token_info.tenant)){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query has wrong yrn full path(tenant=' + namematchs[2] + ') to policy(tenant=' + token_info.tenant + ')';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// check service name
		if(apiutil.isSafeString(service)){
			if(!apiutil.compareCaseString(service, namematchs[1])){
				result.res_obj.result	= false;
				result.res_obj.message	= 'Request query has service name(' + service + ') and path has service name(' + namematchs[1] + '), but both are not same service name.';
				result.res_code			= 400;												// 400: Bad Request
				r3logger.elog(result.res_obj.message);
				return result;
			}
		}else if(apiutil.isSafeString(namematchs[1])){
			// set service name
			service	= apiutil.getSafeString(namematchs[1]).trim().toLowerCase();
			keys	= r3keys(token_info.user, token_info.tenant, service);
		}
		// set name
		name = namematchs[3].toLowerCase();
	}

	//------------------------------
	// get all policy
	//------------------------------
	result = k2hr3.getPolicyAll(token_info.user, token_info.tenant, service, name);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from getPolicyAll'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from getPolicyAll';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(200);													// 200: OK
	res.send(JSON.stringify(result));
});

// Mountpath				: '/v1/policy/*'
// HEAD '/v1/policy/name'	: head policy on version 1(name is allowed full yrn path)
// Url arguments
//		tenant				: optional for policy/resource not full yrn
//		resource			: resource to full yrn(or name)
//		action				: action(read/write)
// 		service				: undefined or service name
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
		!apiutil.isSafeEntity(req.baseUrl) ||
		!apiutil.isSafeEntity(req.query) )
	{
		r3logger.elog('HEAD request or url or query is wrong');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	// first tenant name
	var	tenant	= null;
	if(apiutil.isSafeString(req.query.tenant)){
		tenant	= apiutil.getSafeString(req.query.tenant).trim().toLowerCase();
	}

	// service name
	var	service = null;
	if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.service)){
		service = apiutil.getSafeString(req.query.service).trim().toLowerCase();
	}

	// keys
	var	keys		= r3keys(null, tenant, service);

	// policy name from path
	var	requestptn	= new RegExp('^/v1/policy/(.*)');		// regex = /^\/v1\/policy\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		r3logger.elog('HEAD request url does not have policy name');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}
	// check policy name is only name or full yrn path
	var	name		= reqmatchs[1];
	name			= name.toLowerCase();

	//
	// make policy name and full yrn path
	//
	var	policy_yrn	= null;
	var	nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_POLICY);						// regex = /^yrn:yahoo:(.*)::(.*):policy:(.*)/
	var	namematchs	= name.match(nameptn);
	if(apiutil.isEmptyArray(namematchs) || namematchs.length < 4){
		// name is not full yrn to policy, then check wrong policy name
		nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);									// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query has wrong yrn full path to policy';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// no token need full yrn to policy(other token has tenant name)
		if(!apiutil.isSafeString(tenant)){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query does not have yrn full path to policy';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// no problem, name is policy name
		policy_yrn					= keys.POLICY_TOP_KEY + ':' + name;

	}else{
		// name is full yrn to policy, then need to check tenant name
		if(apiutil.isSafeString(tenant) && !apiutil.compareCaseString(namematchs[2], tenant)){
			result.res_obj.result	= false;
			result.res_obj.message	= 'Request query has wrong yrn full path(tenant=' + namematchs[2] + ') to policy(tenant=' + tenant + ')';
			result.res_code			= 400;													// 400: Bad Request
			r3logger.elog(result.res_obj.message);
			return result;
		}
		// check service name
		if(apiutil.isSafeString(service)){
			if(!apiutil.compareCaseString(service, namematchs[1])){
				result.res_obj.result	= false;
				result.res_obj.message	= 'Request query has service name(' + service + ') and path has service name(' + namematchs[1] + '), but both are not same service name.';
				result.res_code			= 400;													// 400: Bad Request
				r3logger.elog(result.res_obj.message);
				return result;
			}
		}else if(apiutil.isSafeString(namematchs[1])){
			// set service name
			service	= apiutil.getSafeString(namematchs[1]).trim().toLowerCase();
			keys	= r3keys(null, tenant, service);
		}
		// set name
		name						= namematchs[3].toLowerCase();
		policy_yrn					= keys.POLICY_TOP_KEY + ':' + name;
	}

	// resource
	if(!apiutil.isSafeString(req.query.resource)){
		r3logger.elog('HEAD request argument does not have resource parameter');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}
	// check resource is only resource name or full yrn path
	var	resource		= apiutil.getSafeString(req.query.resource);
	var	resourceptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);	// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	var	resourcematchs	= resource.match(resourceptn);
	if(apiutil.isEmptyArray(resourcematchs) || resourcematchs.length < 4){
		// resource is not matched resource(maybe not full yrn), thus we need tenant parameter
		if(!apiutil.isSafeString(tenant)){
			r3logger.elog('HEAD request query does not have resource by full yrn(if you want to set only resource name, you must specify tenant url argument)');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		// if resource is yrn full path, then it is wrong policy resource
		resourceptn		= new RegExp('^' + keys.NO_TENANT_KEY);				// regex = /^yrn:yahoo:/
		if(resource.match(resourceptn)){
			r3logger.elog('HEAD request query has wrong yrn full path to resource');
			resutil.errResponse(req, res, 400);				// 400: Bad Request
			return;
		}
		// make full yrn for policy resource
		resource = keys.RESOURCE_TOP_KEY + ':' + resource;
	}

	// action
	if(!apiutil.isSafeString(req.query.action)){
		r3logger.elog('HEAD request argument does not have action parameter');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}
	// check action is only action name or full yrn path
	var	action	= apiutil.getSafeString(req.query.action);
	if(keys.VALUE_READ === action){
		action	= keys.ACTION_READ_KEY;
	}else if(keys.VALUE_WRITE === action){
		action	= keys.ACTION_WRITE_KEY;
	}else if(keys.ACTION_READ_KEY !== action && keys.ACTION_WRITE_KEY !== action){
		r3logger.elog('HEAD request query has wrong action value');
		resutil.errResponse(req, res, 400);					// 400: Bad Request
		return;
	}

	//------------------------------
	// check policy
	//------------------------------
	var	result = k2hr3.checkPolicy(policy_yrn, resource, action);
	if(!result.result){
		r3logger.dlog('action(' + action + ') to resource(' + resource + ') is not allowed by policy(' + name + ') : message=' + apiutil.getSafeString(result.message));
		resutil.errResponse(req, res, 403);					// 403: Forbidden
		return;
	}
	r3logger.dlog('action(' + action + ') to resource(' + resource + ') is allowed by policy(' + name + ')');
	res.status(204);										// 204: No Content

	res.send();
});

// Mountpath					: '/v1/policy/*'
// DELETE '/v1/policy/name'		: delete policy on version 1
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
	var	result;

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true, true);	// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	token_info	= token_result.token_info;
	var	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// check policy name
	//------------------------------
	var	requestptn	= new RegExp('^/v1/policy/(.*)');		// regex = /^\/v1\/policy\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		result = {
			result: 	false,
			message:	'GET request url does not have policy name'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	var	name	= reqmatchs[1];
	name		= name.toLowerCase();

	// policy name is only name or full yrn path
	var	nameptn		= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	var	namematchs	= name.match(nameptn);
	if(!apiutil.isEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}
	// check yrn full path(it is NG)
	nameptn			= new RegExp('^' + keys.NO_TENANT_KEY);	// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		result = {
			result: 	false,
			message:	'DELETE request url has wrong yrn full path to policy'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}

	//------------------------------
	// delete policy
	//------------------------------
	result = k2hr3.removePolicy(token_info.user, token_info.tenant, name);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from removePolicy'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from removePolicy';
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
