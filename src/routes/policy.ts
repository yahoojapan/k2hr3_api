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

import	apiutil				from '../lib/k2hr3apiutil';
import	resutil				from '../lib/k2hr3resutil';
import	r3tokens			from '../lib/k2hr3tokens';
import	k2hr3				from '../lib/k2hr3dkc';
import	r3logger			from '../lib/dbglogging';
import	express				from 'express';
import	{ getK2hr3Keys }	from '../lib/k2hr3keys';

import type	{ resTypeBaseResult }				from '../lib/types';
import type	{ Request, Response, NextFunction }	from 'express';

const	r3keys	= getK2hr3Keys;
const	router	= express.Router();

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
router.post('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)				||
		!apiutil.isPlainObject(req.body)		||
		!apiutil.isPlainObject(req.body.policy)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST body does not have policy data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);			// scoped, user token
	if(!token_result.result){
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
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
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	if(!apiutil.isSafeString(req.body.policy.name)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:name field is wrong : ' + JSON.stringify(req.body.policy.name)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	keys	= r3keys(token_info.user, token_info.tenant);
	let		name	= apiutil.getSafeString(req.body.policy.name).toLowerCase();

	// policy name is only name or full yrn path
	let		nameptn		= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	const	namematchs	= name.match(nameptn);
	if(apiutil.isStringArray(namematchs) && apiutil.isNotEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}

	// check token's tenant(if same tenant, name is not full yrn)
	nameptn	= new RegExp('^' + keys.NO_TENANT_KEY);							// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST request url has wrong yrn full path to policy'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	let	effect: boolean | null;
	if(!apiutil.isSafeEntity(req.body.policy.effect)){
		effect = null;														// = not update if policy exists
	}else if(apiutil.isString(req.body.policy.effect) && '' === req.body.policy.effect){
		effect = false;														// = deny
	}else if(apiutil.isString(req.body.policy.effect) && apiutil.compareCaseString(req.body.policy.effect, keys.VALUE_ALLOW)){
		effect = true;														// = allow
	}else if(apiutil.isString(req.body.policy.effect) && apiutil.compareCaseString(req.body.policy.effect, keys.VALUE_DENY)){
		effect = false;														// = deny
	}else{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:effect field is wrong : ' + JSON.stringify(req.body.policy.effect)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	const	actptns = [keys.ACTION_READ_KEY, keys.ACTION_WRITE_KEY];		// allow string as read/write yrn full path
	const	actpram = apiutil.getNormalizeParameter(req.body.policy.action, null, actptns);
	if(false === actpram.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:action field is wrong : ' + JSON.stringify(req.body.policy.action)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	actions = actpram.parameter;

	const	resptn	= new RegExp('^' + keys.RESOURCE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:resource:(.*)/
	const	respram = apiutil.getNormalizeParameter(req.body.policy.resource, resptn, null);
	if(false === respram.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:resource field is wrong : ' + JSON.stringify(req.body.policy.resource)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	resources = respram.parameter;

	const	condition = null;												// now reserved this field
	if(null !== req.body.policy.condition && undefined !== req.body.policy.condition && !apiutil.isSafeString(req.body.policy.condition)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:condition field is wrong : ' + JSON.stringify(req.body.policy.condition)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	const	aliasptn	= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	const	aliaspram	= apiutil.getNormalizeParameter(req.body.policy.alias, aliasptn, null);
	if(false === aliaspram.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:alias field is wrong : ' + JSON.stringify(req.body.policy.alias)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		return;
	}
	const	aliases = aliaspram.parameter;

	//------------------------------
	// set all field to policy
	//------------------------------
	const	pol_result = k2hr3.setPolicyAll(token_info.user, token_info.tenant, name, effect, actions, resources, condition, aliases);
	if(!apiutil.isPlainObject(pol_result) || !apiutil.isBoolean(pol_result.result) || false === pol_result.result){
		if(!apiutil.isPlainObject(pol_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get response from setPolicyAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	apiutil.isBoolean(pol_result.result) ? pol_result.result : false,
				message:	apiutil.isString(pol_result.message) ? pol_result.message : 'Could not get error message in response from setPolicyAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);			// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + pol_result.message);

	res.status(201);										// 201: Created
	res.send(JSON.stringify(pol_result));
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
router.put('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isSafeEntity(req.query) )
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT argument does not have any data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);			// scoped, user token
	if(!token_result.result){
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
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
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	if(!apiutil.isSafeString(req.query.name)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:name field is wrong : ' + JSON.stringify(req.query.name)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	keys	= r3keys(token_info.user, token_info.tenant);
	let		name	= apiutil.getSafeString(req.query.name).toLowerCase();

	// policy name is only name or full yrn path
	let		nameptn		= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	const	namematchs	= name.match(nameptn);
	if(apiutil.isStringArray(namematchs) && apiutil.isNotEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}

	// check token's tenant(if same tenant, name is not full yrn)
	nameptn	= new RegExp('^' + keys.NO_TENANT_KEY);							// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request url has wrong yrn full path to policy'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	let	effect: boolean | null;
	if(!apiutil.isString(req.query.effect)){
		effect = null;														// = not update if policy exists
	}else if(!apiutil.isSafeString(req.query.effect)){
		effect = false;														// = deny
	}else if(apiutil.compareCaseString(req.query.effect, keys.VALUE_ALLOW)){
		effect = true;														// = allow
	}else if(apiutil.compareCaseString(req.query.effect, keys.VALUE_DENY)){
		effect = false;														// = deny
	}else{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:effect field is wrong : ' + JSON.stringify(req.query.effect)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	const	actptns = [keys.ACTION_READ_KEY, keys.ACTION_WRITE_KEY];		// allow string as read/write yrn full path
	const	actpram = apiutil.getNormalizeParameter(req.query.action, null, actptns);
	if(false === actpram.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:action field is wrong : ' + JSON.stringify(req.query.action)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	actions = actpram.parameter;

	const	resptn	= new RegExp('^' + keys.RESOURCE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:resource:(.*)/
	const	respram = apiutil.getNormalizeParameter(req.query.resource, resptn, null);
	if(false === respram.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:resource field is wrong : ' + JSON.stringify(req.query.resource)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	resources = respram.parameter;

	const	condition = null;												// now reserved this field
	if(null !== req.query.condition && undefined !== req.query.condition && !apiutil.isSafeString(req.query.condition)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:condition field is wrong : ' + JSON.stringify(req.query.condition)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	const	aliasptn	= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	const	aliaspram	= apiutil.getNormalizeParameter(req.query.alias, aliasptn, null);
	if(false === aliaspram.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'policy:alias field is wrong : ' + JSON.stringify(req.query.alias)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	aliases = aliaspram.parameter;

	//------------------------------
	// set all field to policy
	//------------------------------
	const	pol_result = k2hr3.setPolicyAll(token_info.user, token_info.tenant, name, effect, actions, resources, condition, aliases);
	if(!apiutil.isPlainObject(pol_result) || !apiutil.isBoolean(pol_result.result) || false === pol_result.result){
		if(!apiutil.isPlainObject(pol_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get response from setPolicyAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	apiutil.isBoolean(pol_result.result) ? pol_result.result : false,
				message:	apiutil.isString(pol_result.message) ? pol_result.message : 'Could not get error message in response from setPolicyAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + pol_result.message);

	res.status(201);														// 201: Created
	res.send(JSON.stringify(pol_result));
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
router.get('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	if('GET' !== req.method){
		// HEAD request comes here, so it should be routed to head function.
		next();
		return;
	}
	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isSafeString(req.baseUrl) )
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
	// service name
	//------------------------------
	let	service: string | null = null;
	if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.service)){
		service = apiutil.getSafeString(req.query.service).toLowerCase();
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
	const	keys		= r3keys(token_info.user, token_info.tenant, service);

	//------------------------------
	// check policy name
	//------------------------------
	const	requestptn	= new RegExp('^/v1/policy/(.*)');				// regex = /^\/v1\/policy\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request url does not have policy name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	let		name		= reqmatchs[1].toLowerCase();

	//
	// make policy name from policy yrn
	//
	let		nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_POLICY);	// regex = /^yrn:yahoo:(.*)::(.*):policy:(.*)/
	const	namematchs	= name.match(nameptn);
	if(!apiutil.isStringArray(namematchs) || !apiutil.isNotEmptyArray(namematchs) || namematchs.length < 4){
		// name is not full yrn to policy, then check wrong policy name
		nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);				// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Request query has wrong yrn full path to policy'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		// no token need full yrn to policy(other token has tenant name)
		if(!apiutil.isString(token_result.token_type)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Request query does not have yrn full path to policy'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		// no problem, name is policy name

	}else{
		// name is full yrn to policy, then need to check tenant name
		if(apiutil.isString(token_result.token_type) && !apiutil.compareCaseString(namematchs[2], token_info.tenant)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Request query has wrong yrn full path(tenant=' + namematchs[2] + ') to policy(tenant=' + apiutil.getSafeString(token_info.tenant) + ')'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		// check service name
		if(apiutil.isSafeString(service)){
			if(!apiutil.compareCaseString(service, namematchs[1])){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'Request query has service name(' + (service ?? '') + ') and path has service name(' + (namematchs as string[])[1] + '), but both are not same service name.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);				// 400: Bad Request
				return;
			}
		}else if(apiutil.isSafeString(namematchs[1])){
			// set service name
			service	= apiutil.getSafeString(namematchs[1]).trim().toLowerCase();
			//keys	= r3keys(token_info.user, token_info.tenant, service);
		}
		// set name
		name = namematchs[3].toLowerCase();
	}

	//------------------------------
	// get all policy
	//------------------------------
	const	pol_result = k2hr3.getPolicyAll(token_info.user, token_info.tenant, service, name);
	if(!apiutil.isPlainObject(pol_result) || !apiutil.isBoolean(pol_result.result) || false === pol_result.result){
		if(!apiutil.isPlainObject(pol_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get response from getPolicyAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	apiutil.isBoolean(pol_result.result) ? pol_result.result : false,
				message:	apiutil.isString(pol_result.message) ? pol_result.message : 'Could not get error message in response from getPolicyAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + pol_result.message);

	res.status(200);													// 200: OK
	res.send(JSON.stringify(pol_result));
});

// Mountpath				: '/v1/policy/*'
// HEAD '/v1/policy/name'	: head policy on version 1(name is allowed full yrn path)
// Url arguments
//		tenant				: optional for policy/resource not full yrn
//		resource			: resource to full yrn(or name)
//		action				: action(read/write)
// 		service				: undefined or service name
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
		!apiutil.isSafeString(req.baseUrl)	||
		!apiutil.isPlainObject(req.query)	)
	{
		r3logger.elog('HEAD request or url or query is wrong');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	// first tenant name
	let	tenant: string | null = null;
	if(req.query.tenant && apiutil.isSafeString(req.query.tenant)){
		tenant	= apiutil.getSafeString(req.query.tenant).trim().toLowerCase();
	}

	// service name
	let	service: string | null = null;
	if(apiutil.isSafeString(req.query.service)){
		service = apiutil.getSafeString(req.query.service).trim().toLowerCase();
	}

	// keys
	let		keys		= r3keys(null, tenant, service);

	// policy name from path
	const	requestptn	= new RegExp('^/v1/policy/(.*)');						// regex = /^\/v1\/policy\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		r3logger.elog('HEAD request url does not have policy name');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}
	// check policy name is only name or full yrn path
	let		name		= reqmatchs[1].toLowerCase();

	//
	// make policy name and full yrn path
	//
	let		policy_yrn: string | null;
	let		nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_POLICY);		// regex = /^yrn:yahoo:(.*)::(.*):policy:(.*)/
	const	namematchs	= name.match(nameptn);
	if(!apiutil.isStringArray(namematchs) || !apiutil.isNotEmptyArray(namematchs) || namematchs.length < 4){
		// name is not full yrn to policy, then check wrong policy name
		nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);						// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			r3logger.elog('Request query has wrong yrn full path to policy');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}
		// no token need full yrn to policy(other token has tenant name)
		if(!apiutil.isSafeString(tenant)){
			r3logger.elog('Request query does not have yrn full path to policy');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}
		// no problem, name is policy name
		policy_yrn	= keys.POLICY_TOP_KEY + ':' + name;

	}else{
		// name is full yrn to policy, then need to check tenant name
		if(apiutil.isSafeString(tenant) && !apiutil.compareCaseString(namematchs[2], tenant)){
			r3logger.elog('Request query has wrong yrn full path(tenant=' + namematchs[2] + ') to policy(tenant=' + apiutil.getSafeString(tenant) + ')');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}
		// check service name
		if(apiutil.isSafeString(service)){
			if(!apiutil.compareCaseString(service, namematchs[1])){
				r3logger.elog('Request query has service name(' + apiutil.getSafeString(service) + ') and path has service name(' + namematchs[1] + '), but both are not same service name.');
				resutil.errResponse(req, res, 400);								// 400: Bad Request
				return;
			}
		}else if(apiutil.isSafeString(namematchs[1])){
			// set service name
			service	= apiutil.getSafeString(namematchs[1]).trim().toLowerCase();
			keys	= r3keys(null, tenant, service);
		}
		// set name
		name		= namematchs[3].toLowerCase();
		policy_yrn	= keys.POLICY_TOP_KEY + ':' + name;
	}

	// resource
	if(!apiutil.isSafeString(req.query.resource)){
		r3logger.elog('HEAD request argument does not have resource parameter');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}

	// check resource is only resource name or full yrn path
	let		resource		= apiutil.getSafeString(req.query.resource);
	let		resourceptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_RESOURCE);	// regex = /^yrn:yahoo:(.*)::(.*):resource:(.*)/
	const	resourcematchs	= resource.match(resourceptn);
	if(!apiutil.isStringArray(resourcematchs) || !apiutil.isNotEmptyArray(resourcematchs) || resourcematchs.length < 4){
		// resource is not matched resource(maybe not full yrn), thus we need tenant parameter
		if(!apiutil.isSafeString(tenant)){
			r3logger.elog('HEAD request query does not have resource by full yrn(if you want to set only resource name, you must specify tenant url argument)');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}
		// if resource is yrn full path, then it is wrong policy resource
		resourceptn		= new RegExp('^' + keys.NO_TENANT_KEY);					// regex = /^yrn:yahoo:/
		if(resource.match(resourceptn)){
			r3logger.elog('HEAD request query has wrong yrn full path to resource');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}
		// make full yrn for policy resource
		resource = keys.RESOURCE_TOP_KEY + ':' + resource;
	}

	// action
	if(!apiutil.isSafeString(req.query.action)){
		r3logger.elog('HEAD request argument does not have action parameter');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}
	// check action is only action name or full yrn path
	let	action	= apiutil.getSafeString(req.query.action);
	if(keys.VALUE_READ === action){
		action	= keys.ACTION_READ_KEY;
	}else if(keys.VALUE_WRITE === action){
		action	= keys.ACTION_WRITE_KEY;
	}else if(keys.ACTION_READ_KEY !== action && keys.ACTION_WRITE_KEY !== action){
		r3logger.elog('HEAD request query has wrong action value');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}

	//------------------------------
	// check policy
	//------------------------------
	const	result = k2hr3.checkPolicy(policy_yrn, resource, action);
	if(!result.result){
		r3logger.dlog('action(' + JSON.stringify(action) + ') to resource(' + JSON.stringify(resource) + ') is not allowed by policy(' + JSON.stringify(name) + ') : message=' + apiutil.getSafeString(result.message));
		resutil.errResponse(req, res, 403);										// 403: Forbidden
		return;
	}
	r3logger.dlog('action(' + JSON.stringify(action) + ') to resource(' + JSON.stringify(resource) + ') is allowed by policy(' + JSON.stringify(name) + ')');

	res.status(204);															// 204: No Content
	res.send();
});

//
// Mountpath					: '/v1/policy/*'
// DELETE '/v1/policy/name'		: delete policy on version 1
//
router.delete('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isSafeString(req.baseUrl) )
	{
		r3logger.elog('DELETE request or url or query is wrong');
		resutil.errResponse(req, res, 400);									// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true, true);			// scoped, user token
	if(!token_result.result){
		const	result: resTypeBaseResult = {
			result: 	token_result.result,
			message:	apiutil.getSafeString(token_result.message),
		};
		r3logger.elog(result.message);
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
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// check policy name
	//------------------------------
	const	requestptn	= new RegExp('^/v1/policy/(.*)');					// regex = /^\/v1\/policy\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request url does not have policy name'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	let		name		= reqmatchs[1].toLowerCase();

	// policy name is only name or full yrn path
	let		nameptn		= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	const	namematchs	= name.match(nameptn);
	if(apiutil.isStringArray(namematchs) && apiutil.isNotEmptyArray(namematchs) && 2 <= namematchs.length){
		name			= namematchs[1];
	}
	// check yrn full path(it is NG)
	nameptn				= new RegExp('^' + keys.NO_TENANT_KEY);				// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'DELETE request url has wrong yrn full path to policy'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	//------------------------------
	// delete policy
	//------------------------------
	const	pol_result = k2hr3.removePolicy(token_info.user, token_info.tenant, name);
	if(!apiutil.isPlainObject(pol_result) || !apiutil.isBoolean(pol_result.result) || false === pol_result.result){
		if(!apiutil.isPlainObject(pol_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get response from removePolicy'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403);								// 403: Forbidden(is this status OK?)
		}else{
			const	result: resTypeBaseResult = {
				result: 	apiutil.isBoolean(pol_result.result) ? pol_result.result : false,
				message:	apiutil.isString(pol_result.message) ? pol_result.message : 'Could not get error message in response from removePolicy'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 403);								// 403: Forbidden(is this status OK?)
		}
		return;
	}
	r3logger.dlog('succeed : ' + pol_result.message);

	res.status(204);														// 204: No Content
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
