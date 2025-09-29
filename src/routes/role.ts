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
import	k2hr3userdata	from '../lib/k2hr3userdata';
import	k2hr3			from '../lib/k2hr3dkc';
import	r3logger		from '../lib/dbglogging';
import	express			from 'express';
import	{ r3ApiConfig }	from '../lib/k2hr3config';

import	{ getK2hr3Keys, type K2hr3Keys }					from '../lib/k2hr3keys';
import type	{ Request, Response, NextFunction }				from 'express';
import type	{ resTypeBaseResult }							from '../lib/types';
import type	{ dkcTypeHostRawValueSet }						from '../lib/k2hr3dkc';
import type	{ resTypeCheckKindToken, resTypeGetRoleToken }	from '../lib/k2hr3tokens';

const	apiConf	= new r3ApiConfig();
const	r3keys	= getK2hr3Keys;
const	router	= express.Router();

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type resTypeRoleToken = resTypeGetRoleToken & {
	registerpath:		string;
};

// [NOTE]
// Same as dkcTypeOneRoleHostBaseValue, except the port member is a string.
// This type is only used within this file.
//
type valTypeQueryRoleHostBaseValue = {
	host:			string | null;
	port?:			string | number | null;
	cuk?:			string | null;
	extra?:			string | null;
	tag?:			string | null;
	inboundip?:		string | null;
	outboundip?:	string | null;
};

//
// check typs
//
const rawIsValTypeQueryRoleHostBaseValue = (val: unknown): val is valTypeQueryRoleHostBaseValue => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	const _obj						= val as Record<string, unknown>;
	const _isStringOrNull			= (key: string) => (null === _obj[key] || apiutil.isString(_obj[key]));
	const _isStringOrNullOrUndef	= (key: string) => (undefined === _obj[key] || null === _obj[key] || apiutil.isString(_obj[key]));
	const _isStrNumOrNullOrUndef	= (key: string) => (undefined === _obj[key] || null === _obj[key] || apiutil.isString(_obj[key]) || apiutil.isSafeNumber(_obj[key]));

	return (
		_isStringOrNull('host')				&&
		_isStrNumOrNullOrUndef('port')		&&
		_isStringOrNullOrUndef('cuk')		&&
		_isStringOrNullOrUndef('extra')		&&
		_isStringOrNullOrUndef('tag')		&&
		_isStringOrNullOrUndef('inboundip')	&&
		_isStringOrNullOrUndef('outboundip')
	);
};

const rawIsValTypeQueryRoleHostBaseValueArray = (arr: unknown): arr is valTypeQueryRoleHostBaseValue[] => {

	return (Array.isArray(arr) && arr.every((element) => rawIsValTypeQueryRoleHostBaseValue(element)));
};

//---------------------------------------------------------
// Configuration
//	* Get role full path which is allowed to remove ip address
//	* Get expiration for role tokens
//---------------------------------------------------------
let	delhost_role_yrn: string | null	= null;
let	expire_rtoken: number			= 0;
let	expire_reg_rtoken: number		= 0;

(() => {
	const	admincfgobj	= apiConf.getK2hr3AdminConfig();
	if(apiutil.isPlainObject(admincfgobj) && apiutil.isSafeString(admincfgobj.tenant) && apiutil.isSafeString(admincfgobj.delhostrole)){
		const	keys		= r3keys(null, admincfgobj.tenant.trim());
		delhost_role_yrn	= keys.ROLE_TOP_KEY + ':' + admincfgobj.delhostrole.trim();
	}else{
		r3logger.elog('Could not find tenant/role in configuration for deleting host by cuk.');
		delhost_role_yrn	= null;
	}
	expire_rtoken		= apiConf.getExpireTimeRoleToken();
	expire_reg_rtoken	= apiConf.getExpireTimeRegRoleToken();
})();

//---------------------------------------------------------
// Router POST
//---------------------------------------------------------
//
// Mountpath						: '/v1/role'
// POST '/v1/role{/<role{/...}>}'	: post role on version 1
// HEADER							: X-Auth-Token	=> User token or Role token
// response body					: result		=> true/false
//									  message		=> messages
//
// This mount point is for creating(update) role or creating(update) host in role.
//
router.post('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST request or url or query is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	// check api type
	if('/v1/role' === decodeURI(req.baseUrl)){
		//------------------------------
		// create role type
		//------------------------------
		postRole(req, res, next);

	}else{
		// check host api
		const	keys		= r3keys();
		const	requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);	// regex = /^\/v1\/role\/(.*)/
		const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
		if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request url does not have role name'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		// role name
		const	name	= reqmatchs[1].toLowerCase();

		//------------------------------
		// create host type
		//------------------------------
		postRoleHost(name, req, res, next);
	}
});

//---------------------------------------------------------
// Router PUT
//---------------------------------------------------------
// Mountpath					: '/v1/role'
// PUT '/v1/role{/<role{/...}>}': put role on version 1
// HEADER						: X-Auth-Token	=> User token or Role token
// response body				: result		=> true/false
//								  message		=> messages
//
// This mount point is for creating(update) role and creating(update) host in role.
//
router.put('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req)			||
		!apiutil.isSafeString(req.baseUrl)	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request or url or query is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	// check api type
	if('/v1/role' === decodeURI(req.baseUrl)){
		//------------------------------
		// create role type
		//------------------------------
		putRole(req, res, next);

	}else{
		// check host api
		const	keys		= r3keys();
		const	requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);		// regex = /^\/v1\/role\/(.*)/
		const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
		if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request url does not have role name'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		// role name
		const	name	= reqmatchs[1].toLowerCase();

		//------------------------------
		// create host type
		//------------------------------
		putRoleHost(name, req, res, next);
	}
});

//
// Sub router function for POST CREATE ROLE
//
// Mountpath				: '/v1/role'
// POST '/v1/role'			: post role on version 1
// HEADER					: X-Auth-Token	=> User token
// response body			: result		=> true/false
//							  message		=> messages
// body						: 
//	{
//		"role":	{
//			"name":			<role name>						=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>"
//																<role> can include '/' for hierarchical path
//			"policies":		[<policy yrn full path>, ...]	=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/policies"
//																specify policy as "yrn:yahoo:<service>::<tenant>:policy:<policy>"
//																if null or undefined is specified, not update this member in role when this role exists.
//																if '' or zero array, this member in role is set empty array.
//			"alias":		[<role yrn full path>, ...]		=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/@"
//																specify another role as "yrn:yahoo:<service>::<tenant>:role:<role>"
//																if null or undefined is specified, not update this member in role when this role exists.
//																if '' or zero array, this member in role is set empty array.
//		}
//	}
//
// [NOTE]
// This API does not set host into roles as initial. You can add host to role
// by another API which is an API dedicated to adding host.
//
const postRole = (req: Request, res: Response, _: NextFunction): void => {

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isPlainObject(req.body) ||
		!apiutil.isPlainObject(req.body.role) )
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST body does not have role data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
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
	// name
	if(!apiutil.isSafeString(req.body.role.name)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'role:name field is wrong : ' + JSON.stringify(req.body.role.name)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	keys	= r3keys(token_info.user, token_info.tenant);
	let		name	= apiutil.getSafeString(req.body.role.name).toLowerCase();

	// role name is only name or full yrn path
	let		nameptn		= new RegExp('^' + keys.ROLE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:role:(.*)/
	const	namematchs	= name.match(nameptn);
	if(apiutil.isStringArray(namematchs) && apiutil.isNotEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}

	// check name which is not full yrn
	nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);						// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST request query has wrong yrn full path to role'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}

	// policies
	const	policiesptn	= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	const	policiespram= apiutil.getNormalizeParameter(req.body.role.policies, policiesptn, null);
	if(false === policiespram.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'role:policies field is wrong : ' + JSON.stringify(req.body.role.policies)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	policies	= policiespram.parameter;

	// alias
	const	aliasptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	aliaspram	= apiutil.getNormalizeParameter(req.body.role.alias, aliasptn, null);
	if(false === aliaspram.result){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'role:alias field is wrong : ' + JSON.stringify(req.body.role.alias)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		return;
	}
	const	aliases = aliaspram.parameter;

	//------------------------------
	// set all field to role
	//------------------------------
	const	role_result = k2hr3.setRoleAll(token_info.user, token_info.tenant, name, policies, aliases, null, false, null, false);
	if(!apiutil.isPlainObject(role_result) || !apiutil.isBoolean(role_result.result) || false === role_result.result){
		if(!apiutil.isPlainObject(role_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get response from setRoleAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	apiutil.isBoolean(role_result.result) ? role_result.result : false,
				message:	apiutil.isString(role_result.message) ? role_result.message : 'Could not get error message in response from setRoleAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(role_result.message));

	res.status(201);													// 201: Created
	res.send(JSON.stringify(role_result));
};

//
// Sub router function for PUT CREATE ROLE
//
// Mountpath						: '/v1/role'
// PUT '/v1/role{/<role{/...}>}'	: put role on version 1
// HEADER							: X-Auth-Token	=> User token
// response body					: result		=> true/false
//									  message		=> messages
// url argument
//	"name":			<role name>						=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>"
//														<role> can include '/' for hierarchical path
//	"policies":		[<policy yrn full path>, ...]	=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/policies"
//														specify policy as "yrn:yahoo:<service>::<tenant>:policy:<policy>", it is formatted by JSON.
//														if null or undefined is specified, not update this member in role when this role exists.
//														if '' or zero array, this member in role is set empty array.
//	"alias":		[<role yrn full path>, ...]		=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/@"
//														specify another role as "yrn:yahoo:<service>::<tenant>:role:<role>", it is formatted by JSON.
//														if null or undefined is specified, not update this member in role when this role exists.
//														if '' or zero array, this member in role is set empty array.
//
// [NOTE]
// This API does not set host into roles as initial. You can add host to role
// by another API which is an API dedicated to adding host.
//
const putRole = (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isPlainObject(req.query) )
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT argument does not have any data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
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
	// name
	if(!apiutil.isSafeString(req.query.name)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'role:name field is wrong : ' + JSON.stringify(req.query.name)
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}
	const	keys	= r3keys(token_info.user, token_info.tenant);
	let		name	= apiutil.getSafeString(req.query.name).toLowerCase();

	// role name is only name or full yrn path
	let		nameptn		= new RegExp('^' + keys.ROLE_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:role:(.*)/
	const	namematchs	= name.match(nameptn);
	if(apiutil.isStringArray(namematchs) && apiutil.isNotEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}

	// check name which is not full yrn
	nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);							// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'PUT request query has wrong yrn full path to role'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	// policies
	let	policies: string | string[] | null = null;
	if(!apiutil.isString(req.query.policies)){
		policies = null;
	}else if('' === req.query.policies){
		policies = '';
	}else if(apiutil.isSafeString(req.query.policies)){
		// policies is encoded by JSON, this value is array.
		//
		let	tmp_pol = apiutil.getSafeString(req.query.policies);
		if(apiutil.checkSimpleJSON(tmp_pol)){
			tmp_pol	= JSON.parse(tmp_pol);
		}
		const	policiesptn	= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
		const	policiespram= apiutil.getNormalizeParameter(tmp_pol, policiesptn, null);
		if(false === policiespram.result){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'role:policies field is wrong : ' + req.query.policies
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
		policies = policiespram.parameter ?? null;
	}

	// alias
	let	aliases: string | string[] | null = null;
	if(!apiutil.isString(req.query.alias)){
		aliases = null;
	}else if('' === req.query.alias){
		aliases = '';
	}else if(apiutil.isSafeString(req.query.alias)){
		// alias is encoded by JSON, this value is array.
		//
		let	tmp_aliases	= apiutil.getSafeString(req.query.alias);
		if(apiutil.checkSimpleJSON(tmp_aliases)){
			tmp_aliases	= JSON.parse(tmp_aliases);
		}
		const	aliasptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);	// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
		const	aliaspram	= apiutil.getNormalizeParameter(tmp_aliases, aliasptn, null);
		if(false === aliaspram.result){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'role:alias field is wrong : ' + req.query.alias
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
			return;
		}
		aliases = aliaspram.parameter ?? null;
	}

	//------------------------------
	// set all field to role
	//------------------------------
	const role_result = k2hr3.setRoleAll(token_info.user, token_info.tenant, name, policies, aliases, null, false, null, false);
	if(!apiutil.isPlainObject(role_result) || !apiutil.isBoolean(role_result.result) || false === role_result.result){
		if(!apiutil.isPlainObject(role_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get response from setRoleAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	apiutil.isBoolean(role_result.result) ? role_result.result : false,
				message:	apiutil.isString(role_result.message) ? role_result.message : 'Could not get error message in response from setRoleAll'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(role_result.message));

	res.status(201);														// 201: Created
	res.send(JSON.stringify(role_result));
};

//
// Sub router function for POST CREATE HOST
//
// Mountpath					: '/v1/role'
// POST '/v1/role/<role{/...}>'	: post role on version 1
// HEADER						: X-Auth-Token	=> User token or Role token
// response body				: result		=> true/false
//								  message		=> messages
//
// [UserToken] body				: 
//	{
//		"host":	{											=>	specified single host
//			"host":			<hostname / ip address>			=>	key is for "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/{name, ip}/<hostname port cuk>"
//			"port":			<port number>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/name/<hostname port cuk>"
//																this value is number string(0-), allowed null and '' for  this value.
//																if this value is '0', it means any port.
//			"cuk":			<container unique key>			=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/name/<hostname port cuk>"
//																this value is string. if this value is undefined/null/empty string, it means any.
//			"extra":		<extra string data>				=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//																extra is any string including Control code, allowed null and '' for  this value.
//			"tag":			<string data>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//																tag is any string including Control code, allowed null and '' for  this value.
//			"inboundip":	<ip address>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//																inboundip is set ip address string. if you do not use proxy/gateway/bridge/etc, you do not need to set this key.
//			"outboundip":	<ip address>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//																outboundip is set ip address string. if you do not use proxy/gateway/bridge/etc, you do not need to set this key.
//		}
//		"clear_hostname":	<true/false>
//		"clear_ips":		<true/false>
//	}
//	or
//	{
//		"host":	[											=>	specified host as Array(only POST request has this type)
//			{
//				"host":			<hostname / ip address>
//				"port":			<port number>
//				"cuk":			<container unique key>
//				"extra":		<extra string data>
//				"tag":			<string data>
//				"inboundip":	<ip address>
//				"outboundip":	<ip address>
//			}
//			...
//		]
//		"clear_hostname":	<true/false>
//		"clear_ips":		<true/false>
//	}
//
// [RoleToken] body				:
//	{
//		"host":	{
//			"port":			<port number>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<ip port cuk>"
//																this value is number string(0-), allowed null and '' for  this value.
//																if this value is '0', it means any port.
//			"cuk":			<container unique key>			=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/name/<hostname port cuk>"
//																this value is string. if this value is undefined/null/empty string, it means any.
//			"extra":		<extra string data>				=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//																extra is any string including Control code, allowed null and '' for  this value.
//			"tag":			<string data>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//																tag is any string including Control code, allowed null and '' for  this value.
//			"inboundip":	<ip address>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//																inboundip is set ip address string. if you do not use proxy/gateway/bridge/etc, you do not need to set this key.
//			"outboundip":	<ip address>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//																outboundip is set ip address string. if you do not use proxy/gateway/bridge/etc, you do not need to set this key.
//		}
//	}
//
// [NOTE]
// This API only set(add/create) host into role. The host is specified hostname.
// The hostname is any string as like hostname.(ex. "x.yahoo.co.jp", "x[0-9].yahoo.co.jp", "*.yahoo.co.jp", "*", "(.*)", etc)
// If port number is 0, it means any port.
// If cuk is undefined/null/empty string, it means any.
// Extra data can include control-code(CR, etc).
//
const postRoleHost = (role: string, req: Request, res: Response, _: NextFunction): void => {

	if(	!apiutil.isPlainObject(req)													||
		!apiutil.isPlainObject(req.body)											||
		(!apiutil.isArray(req.body.host) && !apiutil.isPlainObject(req.body.host))	)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'POST body does not have host data'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true);						// scoped, both token
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
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	const	is_host_req	= (!apiutil.isArray(req.body.host) && (!apiutil.isPlainObject(req.body.host) || !apiutil.isSafeString(req.body.host.host)));
	const	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// check arguments
	//------------------------------
	// role name check
	let		name		= apiutil.getSafeString(role).toLowerCase();
	let		nameptn		= new RegExp('^' + keys.ROLE_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:role:(.*)/
	const	namematchs	= name.match(nameptn);
	if(apiutil.isStringArray(namematchs) && apiutil.isNotEmptyArray(namematchs) && 2 <= namematchs.length){
		// name is full yrn, then reset only name.
		name = namematchs[1];
	}else{
		// role name is not full yrn, then check other yrn path
		nameptn	= new RegExp('^' + keys.NO_TENANT_KEY);							// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request url has wrong yrn full path to role'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
	}

	//------------------------------
	// build parameters
	//------------------------------
	let	role_result: resTypeBaseResult;
	if(!is_host_req){
		//
		// request from user token
		//
		let	hostArray: valTypeQueryRoleHostBaseValue[]	= [];
		if(rawIsValTypeQueryRoleHostBaseValueArray(req.body.host)){
			hostArray = req.body.host;
		}else if(rawIsValTypeQueryRoleHostBaseValue(req.body.host)){
			hostArray = [req.body.host];
		}

		// check array and make ip array
		let	hostnameArray: dkcTypeHostRawValueSet[] | null	= [];
		let	ipArray: dkcTypeHostRawValueSet[] | null		= [];

		for(let cnt = 0; cnt < hostArray.length; ++cnt){
			if(!apiutil.isSafeString(hostArray[cnt].host)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'host is not specified.'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);					// 400: Bad Request
				return;
			}

			// hostname or ip address
			const	tmp_host				= apiutil.getSafeString(hostArray[cnt].host);
			let		tg_host: string | null	= null;
			let		tg_ip: string | null	= null;
			if(apiutil.isIpAddressString(tmp_host)){
				tg_ip	= tmp_host.toLowerCase();
				tg_host = null;
			}else if(apiutil.isSafeString(tmp_host)){
				tg_host	= tmp_host.toLowerCase();
				tg_ip	= null;
			}

			// port
			let	port: number = 0;
			if(apiutil.isSafeNumeric(hostArray[cnt].port)){
				const	port_tmp = apiutil.cvtToNumber(hostArray[cnt].port);
				if(!apiutil.isSafeNumber(port_tmp)){
					const	result: resTypeBaseResult = {
						result: 	false,
						message:	'POST request has port which is not number: ' + JSON.stringify(hostArray[cnt].port)
					};
					r3logger.elog(result.message);
					resutil.errResponse(req, res, 400, result);				// 400: Bad Request
					return;
				}
				port = port_tmp;
			}

			// cuk
			const	tmp_cuk				= apiutil.getSafeString(hostArray[cnt].cuk).trim();
			let		cuk: string | null	= null;
			if(apiutil.isSafeString(tmp_cuk)){
				cuk = tmp_cuk;
			}

			// extra
			const	tmp_extra			= apiutil.getSafeString(hostArray[cnt].extra);
			let	extra: string | null	= null;
			if(apiutil.isSafeString(tmp_extra)){
				extra = tmp_extra;
			}

			// tag
			const	tmp_tag				= apiutil.getSafeString(hostArray[cnt].tag);
			let		tag: string | null	= null;
			if(apiutil.isSafeString(tmp_tag)){
				tag = tmp_tag;
			}

			// set base host information
			const	host_info: dkcTypeHostRawValueSet = {
				hostname:		tg_host,
				ip:				tg_ip,
				port:			port,
				cuk:			cuk,
				extra:			extra,
				tag:			tag,
				inboundip:		null,
				outboundip:		null
			};

			// set optional keys
			if(apiutil.isSafeString(hostArray[cnt].inboundip)){
				if(!apiutil.isIpAddressString(hostArray[cnt].inboundip)){
					const	result: resTypeBaseResult = {
						result: 	false,
						message:	'POST request has inbound ip address which is not ignore ip address string: ' + JSON.stringify(hostArray[cnt].inboundip)
					};
					r3logger.elog(result.message);
					resutil.errResponse(req, res, 400, result);					// 400: Bad Request
					return;
				}
				host_info.inboundip = apiutil.getSafeString(hostArray[cnt].inboundip);
			}

			if(apiutil.isSafeString(hostArray[cnt].outboundip)){
				if(!apiutil.isIpAddressString(hostArray[cnt].outboundip)){
					const	result: resTypeBaseResult = {
						result: 	false,
						message:	'POST request has outbound ip address which is not ignore ip address string: ' + JSON.stringify(hostArray[cnt].outboundip)
					};
					r3logger.elog(result.message);
					resutil.errResponse(req, res, 400, result);					// 400: Bad Request
					return;
				}
				host_info.outboundip = apiutil.getSafeString(hostArray[cnt].outboundip);
			}

			// push array
			if(null !== tg_host){
				hostnameArray.push(host_info);
			}
			if(null !== tg_ip){
				ipArray.push(host_info);
			}
		}
		if(!apiutil.isNotEmptyArray(hostnameArray)){
			hostnameArray = null;
		}
		if(!apiutil.isNotEmptyArray(ipArray)){
			ipArray = null;
		}

		// flags
		let	clear_hostname	= false;
		let	clear_ips		= false;
		if(apiutil.isBoolean(req.body.clear_hostname)){
			clear_hostname = req.body.clear_hostname;
		}
		if(apiutil.isBoolean(req.body.clear_ips)){
			clear_ips = req.body.clear_ips;
		}

		//
		// Add hostnames and ips ---> Need User Token
		//
		role_result	= k2hr3.updateRoleHosts(token_info.user, token_info.tenant, name, hostnameArray, clear_hostname, ipArray, clear_ips);

	}else{
		//
		// request from host(token)
		//

		// get ip address
		const	ip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(ip)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get ip address from request.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}

		// port
		let	port: number = 0;
		if(apiutil.isPlainObject(req.body.host) && apiutil.isSafeNumeric(req.body.host.port)){
			const	port_tmp = apiutil.cvtToNumber(req.body.host.port);
			if(!apiutil.isSafeNumber(port_tmp)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'POST request has port which is not number: ' + JSON.stringify(req.body.host.port)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);						// 400: Bad Request
				return;
			}
			port = port_tmp;
		}

		// cuk
		let	cuk: string | null = null;
		if(apiutil.isPlainObject(req.body.host) && apiutil.isSafeString(req.body.host.cuk) && apiutil.isSafeString(req.body.host.cuk.trim())){
			cuk = apiutil.getSafeString(req.body.host.cuk).trim();
		}

		// extra
		let	extra: string | null = null;
		if(apiutil.isPlainObject(req.body.host) && apiutil.isSafeString(req.body.host.extra)){
			const	extra_tmp = apiutil.getSafeString(req.body.host.extra);
			if(apiutil.checkSimpleJSON(extra_tmp)){
				const	extra_parsed_tmp = JSON.parse(extra_tmp);
				if(!apiutil.isSafeString(extra_parsed_tmp)){
					const	result: resTypeBaseResult = {
						result: 	false,
						message:	'POST request has extra which is not string: ' + JSON.stringify(req.body.host.extra)
					};
					r3logger.elog(result.message);
					resutil.errResponse(req, res, 400, result);					// 400: Bad Request
					return;
				}
				extra = extra_parsed_tmp;
			}else{
				extra = extra_tmp;
			}
		}

		// tag
		let	tag: string | null = null;
		if(apiutil.isPlainObject(req.body.host) && apiutil.isSafeString(req.body.host.tag)){
			const	tag_tmp = apiutil.getSafeString(req.body.host.tag);
			if(apiutil.checkSimpleJSON(tag_tmp)){
				const	tag_parsed_tmp = JSON.parse(tag_tmp);
				if(!apiutil.isSafeString(tag_parsed_tmp)){
					const	result: resTypeBaseResult = {
						result: 	false,
						message:	'POST request has tag which is not string: ' + JSON.stringify(req.body.host.tag)
					};
					r3logger.elog(result.message);
					resutil.errResponse(req, res, 400, result);					// 400: Bad Request
					return;
				}
				tag = tag_parsed_tmp;
			}else{
				tag = tag_tmp;
			}
		}

		// inboundip(optional)
		let	inboundip: string | null = null;
		if(apiutil.isPlainObject(req.body.host) && apiutil.isSafeString(req.body.host.inboundip)){
			if(!apiutil.isIpAddressString(req.body.host.inboundip)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'POST request has inbound ip address which is not ignore ip address string: ' + JSON.stringify(req.body.host.inboundip)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);						// 400: Bad Request
				return;
			}
			inboundip = apiutil.getSafeString(req.body.host.inboundip);
		}

		// outboundip(optional)
		let	outboundip: string | null = null;
		if(apiutil.isPlainObject(req.body.host) && apiutil.isSafeString(req.body.host.outboundip)){
			if(!apiutil.isIpAddressString(req.body.host.outboundip)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'POST request has outbound ip address which is not ignore ip address string: ' + JSON.stringify(req.body.host.outboundip)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);						// 400: Bad Request
				return;
			}
			outboundip = apiutil.getSafeString(req.body.host.outboundip);
		}

		//
		// Add ip address ---> Role Token or User Token
		//
		role_result	= k2hr3.addHost(token_info.tenant, name, null, ip, port, cuk, extra, tag, inboundip, outboundip);
	}

	//------------------------------
	// check result
	//------------------------------
	if(!apiutil.isPlainObject(role_result) || !apiutil.isBoolean(role_result.result) || false === role_result.result){
		const	mode_type = (is_host_req ? 'addHost' : 'updateRoleHosts');
		if(!apiutil.isPlainObject(role_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	('Could not get response from ' + mode_type)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	apiutil.isString(role_result.message) ? role_result.message : ('Could not get error message in response from ' + mode_type)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(role_result.message));

	res.status(201);													// 201: Created
	res.send(JSON.stringify(role_result));
};

//
// Sub router function for PUT CREATE HOST
//
// Mountpath						: '/v1/role'
// PUT '/v1/role/<role{/...}>'		: put role on version 1
// HEADER							: X-Auth-Token	=> User token or Role token
// response body					: result		=> true/false
//									  message		=> messages
//
// [UserToken] url argument
//	"host":			<hostname or ip address>		=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/{name, ip}/<hostname port cuk>"
//	"port":			<port number>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/name/<hostname port cuk>"
//														this value is number string(0-), allowed null and '' for  this value.
//														if this value is '0', it means any port.
//	"cuk":			<container unique key>			=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/name/<hostname port cuk>"
//														this value is string. if this value is undefined/null/empty string, it means any.
//	"extra":		<extra string data>				=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//														This value must be encoded by JSON.
//														extra is any string including Control code, allowed null and '' for  this value.
//	"tag":			<string data>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//														This value must be encoded by JSON.
//														tag is any string including Control code, allowed null and '' for  this value.
//	"inboundip":	<ip address>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//														inboundip is set ip address string. if you do not use proxy/gateway/bridge/etc, you do not need to set this key.
//	"outboundip":	<ip address>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//														outboundip is set ip address string. if you do not use proxy/gateway/bridge/etc, you do not need to set this key.
//
// [RoleToken] url argument
//	"port":			<port number>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/ip/<ip port cuk>"
//														this value is number string(0-), allowed null and '' for  this value.
//														if this value is '0', it means any port.
//	"cuk":			<container unique key>			=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/name/<hostname port cuk>"
//														this value is string. if this value is undefined/null/empty string, it means any.
//	"extra":		<extra string data>				=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//														This value must be encoded by JSON.
//														extra is any string including Control code, allowed null and '' for  this value.
//	"tag":			<string data>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//														This value must be encoded by JSON.
//														tag is any string including Control code, allowed null and '' for  this value.
//	"inboundip":	<ip address>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//														inboundip is set ip address string. if you do not use proxy/gateway/bridge/etc, you do not need to set this key.
//	"outboundip":	<ip address>					=>	key is "yrn:yahoo:<service>::<tenant>:role:<role>/hosts/..."
//														outboundip is set ip address string. if you do not use proxy/gateway/bridge/etc, you do not need to set this key.
//
// [NOTE]
// This API only set(add/create) host into role. Ether hostname or ip address must be specified.
// If port number is 0, it means any port.
// If cuk is undefined/null/empty string, it means any.
// Extra data can include control-code(CR, etc).
//
const putRoleHost = (role: string, req: Request, res: Response, _: NextFunction): void => {

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
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	const	token_result = r3tokens.checkToken(req, true);						// scoped, both token
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
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	const	is_host_req	= !apiutil.isSafeString(req.query.host);
	const	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// check arguments
	//------------------------------
	// role name check
	let		name		= apiutil.getSafeString(role).toLowerCase();
	let		nameptn		= new RegExp('^' + keys.ROLE_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:role:(.*)/
	const	namematchs	= name.match(nameptn);
	if(apiutil.isStringArray(namematchs) && apiutil.isNotEmptyArray(namematchs) && 2 <= namematchs.length){
		// name is full yrn, then reset only name.
		name = namematchs[1];
	}else{
		// role name is not full yrn, then check other yrn path
		nameptn	= new RegExp('^' + keys.NO_TENANT_KEY);							// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'POST request url has wrong yrn full path to role'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
	}

	// hostname
	let	hostname: string | null	= null;
	let	ip: string | null		= null;
	if(!is_host_req){
		if(!apiutil.isSafeString(req.query.host)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'host is not specified.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
		const	tg_host = apiutil.getSafeString(req.query.host);
		if(apiutil.isIpAddressString(tg_host)){
			ip		= tg_host.toLowerCase();
		}else{
			hostname= tg_host.toLowerCase();
		}
	}else{
		// get ip address
		ip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(ip)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get ip address from request.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
	}

	// port
	let	port: number;
	if(apiutil.isSafeNumeric(req.query.port)){
		const	port_tmp = apiutil.cvtToNumber(req.query.port);
		if(!apiutil.isSafeNumber(port_tmp)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request has port which is not number: ' + JSON.stringify(req.query.port)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
		port = port_tmp;
	}else{
		port = 0;																// default any
	}

	// cuk
	let	cuk: string | null = null;
	if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
		cuk = apiutil.getSafeString(req.query.cuk).trim();
	}

	// extra
	let	extra: string | null = null;
	if(apiutil.isSafeString(req.query.extra)){
		const	extra_tmp = apiutil.getSafeString(req.query.extra);
		if(apiutil.checkSimpleJSON(extra_tmp)){
			const	extra_parsed_tmp = JSON.parse(extra_tmp);					// extra encoded JSON
			if(!apiutil.isSafeString(extra_parsed_tmp)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'PUT request has extra which is not string: ' + JSON.stringify(req.query.extra)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);						// 400: Bad Request
				return;
			}
			extra = extra_parsed_tmp;
		}else{
			extra = extra_tmp;
		}
	}

	// tag
	let	tag: string | null = null;
	if(apiutil.isSafeString(req.query.tag)){
		const	tag_tmp = apiutil.getSafeString(req.query.tag);
		if(apiutil.checkSimpleJSON(tag_tmp)){
			const	tag_parsed_tmp = JSON.parse(tag_tmp);						// tag encoded JSON
			if(!apiutil.isSafeString(tag_parsed_tmp)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'PUT request has tag which is not string: ' + JSON.stringify(req.body.host.tag)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);						// 400: Bad Request
				return;
			}
			tag = tag_parsed_tmp;
		}else{
			tag = tag_tmp;
		}
	}

	// make base host information
	const	host_info: dkcTypeHostRawValueSet = {
		hostname:		hostname,
		ip:				ip,
		port:			port,
		cuk:			cuk,
		extra:			extra,
		tag:			tag,
		inboundip:		null,
		outboundip:		null
	};

	// set inboundip(optional)
	let	inboundip: string | null = null;
	if(apiutil.isSafeString(req.query.inboundip)){
		if(!apiutil.isIpAddressString(req.query.inboundip)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request has inbound ip address which is not ignore ip address string: ' + JSON.stringify(req.query.inboundip)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
		inboundip			= apiutil.getSafeString(req.query.inboundip);
		host_info.inboundip	= inboundip;
	}

	// set outboundip(optional)
	let	outboundip: string | null = null;
	if(apiutil.isSafeString(req.query.outboundip)){
		if(!apiutil.isIpAddressString(req.query.outboundip)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'PUT request has outbound ip address which is not ignore ip address string: ' + JSON.stringify(req.query.outboundip)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
		outboundip			= apiutil.getSafeString(req.query.outboundip);
		host_info.outboundip= outboundip;
	}

	//------------------------------
	// add host to role
	//------------------------------
	let	role_result: resTypeBaseResult;

	if(!is_host_req){
		// Add hostname ---> Need User Token
		if(null === ip){
			role_result = k2hr3.updateRoleHosts(token_info.user, token_info.tenant, name, host_info);
		}else{
			role_result = k2hr3.updateRoleHosts(token_info.user, token_info.tenant, name, null, false, host_info);
		}
	}else{
		// Add ip address ---> Role Token or User Token
		role_result = k2hr3.addHost(token_info.tenant, name, null, ip, port, cuk, extra, tag, inboundip, outboundip);
	}

	if(!apiutil.isPlainObject(role_result) || !apiutil.isBoolean(role_result.result) || false === role_result.result){
		const	mode_type = (is_host_req ? 'addHost' : 'updateRoleHosts');
		if(!apiutil.isSafeEntity(role_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	('Could not get response from ' + mode_type)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	apiutil.isString(role_result.message) ? role_result.message : ('Could not get error message in response from ' + mode_type)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
		}
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(role_result.message));

	res.status(201);															// 201: Created
	res.send(JSON.stringify(role_result));
};

//---------------------------------------------------------
// Router GET
//---------------------------------------------------------
//
// Mountpath							: '/v1/role/<role{/...}>'
//
// GET '/v1/role/<role{/...}>'			: get role on version 1
// HEADER								: X-Auth-Token	=> User token
// URL arguments						: expand		=> "true"(default) or "false"
// response								:	{
//												"result":	true or false
//												"message":	error message
//												"role":	{
//													policies:	array,
//													aliases:	array					<--- only not expand
//													hosts: {							<--- only not expand
//														'hostnames': [					hostname array or empty array
//															<hostname> <port> <cuk> <extra> <tag>,	(if any port, port is *)
//															...
//														],
//														'ips': [						ip address array or empty array
//															<ip address> <port> <cuk> <extra> <tag>,(if any port, port is *)
//															...
//														]
//													}
//												}
//											}
//
// GET '/v1/role/token/<role{/...}>'	: get role token on version 1
// HEADER								: X-Auth-Token	=> User token or Role token
// URL arguments						: expire	=> "expire time(unix time value)" or undefined(default 24H)
// response								:	{
//												"result":		true or false
//												"message":		error message
//												"token":		"role token"
//												"registerpath":	"path for registering"
//											}
//
// GET '/v1/role/token/list/<role{/...}>': get list of role tokens on version 1
// HEADER								: X-Auth-Token	=> User token
// URL arguments						: expand		=> "true"(default) or "false"
// response								:	{
//												result:		true/false
//												message:	null or error message string
//												tokens:	{
//													"token": {
//														date:		create date(UTC ISO 8601)
//														expire:		expire date(UTC ISO 8601)
//														user:		user name if user created this token
//														hostname:	hostname if this token was created by host(name)
//														ip:			ip address if this token was created by ip
//														port:		port number, if specified port when created token
//														cuk:		cuk, if specified cuk when created token
//													},
//													...
//												}
// 											}
//											or
//											{
//												result:		true/false
//												message:	null or error message string
//												tokens: [
//													"role token",
//													....
//												]
// 											}
//
// This mount point is for creating(update) role or creating(update) host in role.
// And get role token by host(ip address) or user(user token), update role token by
// role token.
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
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check token for API mode
	//------------------------------
	let	token_str: string | null					= null;
	let	token_type: string | null					= null;
	let	token_info: resTypeCheckKindToken | null	= null;
	let	keys										= r3keys();

	if(r3tokens.hasAuthTokenHeader(req)){
		const	token_result = r3tokens.checkToken(req, true);						// scoped, both token
		if(!token_result.result){
			const	result: resTypeBaseResult = {
				result: 	token_result.result,
				message:	apiutil.getSafeString(token_result.message),
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, token_result.status, result);
			return;
		}

		if(!r3tokens.isResTypeCheckRoleToken(token_result.token_info)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'specified wrong token or it is not scoped user token'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);								// 400: Bad Request
			return;
		}
		token_info	= token_result.token_info;
		token_str	= token_result.token ?? null;
		token_type	= token_result.token_type ?? null;
		keys		= r3keys(token_info.user, token_info.tenant);
	}

	//------------------------------
	// get role name
	//------------------------------
	// check get token type and parse role name
	let	is_get_token= false;
	let	is_get_list	= false;
	let	requestptn	= new RegExp(keys.MATCH_URI_GET_RTOKEN_LIST);			// regex = /^\/v1\/role\/token\/list\/(.*)/
	let	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isStringArray(reqmatchs) && apiutil.isNotEmptyArray(reqmatchs) && 2 <= reqmatchs.length && '' !== apiutil.getSafeString(reqmatchs[1])){
		// get list of tokens
		is_get_list	= true;
	}else{
		// recheck
		requestptn	= new RegExp(keys.MATCH_URI_GET_RTOKEN);					// regex = /^\/v1\/role\/token\/(.*)/
		reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
		if(apiutil.isStringArray(reqmatchs) && apiutil.isNotEmptyArray(reqmatchs) && 2 <= reqmatchs.length && '' !== apiutil.getSafeString(reqmatchs[1])){
			// get token
			is_get_token= true;
		}else{
			// retry parse role name
			requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);				// regex = /^\/v1\/role\/(.*)/
			reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
			if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET request url does not have role name'
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);						// 400: Bad Request
				return;
			}
		}
	}

	// check role name is only name or full yrn path
	let		name		= reqmatchs[1].toLowerCase();
	let		nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);			// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	namematchs	= name.match(nameptn);
	if(!apiutil.isStringArray(namematchs) || !apiutil.isNotEmptyArray(namematchs) || namematchs.length < 4){
		//
		// name is not full yrn to role, then check wrong role name
		//
		nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);						// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request query has wrong yrn full path to role'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// role name is not full yrn, we need tenant name
		if(!apiutil.isSafeString(keys.ROLE_TOP_KEY)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request role name which is not full yrn, and not token. role name must be full yrn, if token is not specified.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

		// make full yrn for role name
		name = keys.ROLE_TOP_KEY + ':' + name;

	}else{
		//
		// name is full yrn to role.
		// need to check tenant name when token is specified.
		//
		if(apiutil.isSafeString(token_type) && (!apiutil.isPlainObject(token_info) || !apiutil.isSafeString(token_info.tenant) || !apiutil.compareCaseString(namematchs[2], token_info.tenant))){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request query has wrong tenant yrn full path(tenant=' + namematchs[2] + ') or not specify tenant.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	// Run
	if(is_get_token){
		//------------------------------
		// GET ROLE TOKEN
		//------------------------------
		// token_info:	null(undefined)	=> not specify token, put token by host ip address
		//				user token		=> put token by user
		//				role token		=> update token by role
		//
		getRoleToken(name, token_info, token_type, token_str, req, res);

	}else if(is_get_list){
		//------------------------------
		// GET LIST OF ROLE TOKENS
		//------------------------------
		if('user' === apiutil.getSafeString(token_type)){
			getListRoleTokens(name, token_info, req, res);
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request without UserToken for getting list of role(' + name + ') tokens, need User Token.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}

	}else{
		//------------------------------
		// GET ROLE DATA
		//------------------------------
		if('user' === apiutil.getSafeString(token_type) && apiutil.isPlainObject(token_info)){
			getRole(name, token_info, req, res);
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request without UserToken for getting role(' + name + '), need User Token.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}
});

//
// Sub router function for GET ROLE DATA
//
// Mountpath						:	'/v1/role/<role{/...}>'
//
// GET '/v1/role/<role{/...}>'		:	get role on version 1
// HEADER							:	X-Auth-Token	=> User token
// URL arguments					:	expand			=> "true"(default) or "false"
// response							:	{
//											"result":	true or false
//											"message":	error message
//											"role":	{
//												policies:	array,
//												aliases:	array								<--- only not expand
//												hosts: {										<--- only not expand
//													'hostnames': [								hostname array or empty array
//														<hostname> <port> <cuk> <extra> <tag>,	(if any port, port is *)
//														...
//													],
//													'ips': [									ip address array or empty array
//														<ip address> <port> <cuk> <extra> <tag>,(if any port, port is *)
//														...
//													]
//												}
//											}
//										}
//
// This mount point is for creating(update) role or creating(update) host in role.
//
const getRole = (
	role:		string,
	token_info:	resTypeCheckKindToken,
	req:		Request,
	res:		Response
): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isPlainObject(req.query) )
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request query is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	if(	!apiutil.isSafeString(role)						||
		!r3tokens.isResTypeCheckRoleToken(token_info)	||
		!apiutil.isSafeString(token_info.user)			||
		!apiutil.isSafeString(token_info.tenant)		)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request is failure by internal error.'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);						// 500: Internal Error
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	const	keys = r3keys(token_info.user, token_info.tenant);

	// expand type
	let	is_expand = true;
	if(apiutil.isSafeString(req.query.expand)){
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
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	//------------------------------
	// get role
	//------------------------------
	const	role_result = k2hr3.getRole(role, is_expand);
	if(!apiutil.isPlainObject(role_result) || !apiutil.isBoolean(role_result.result) || false === role_result.result){
		if(!apiutil.isPlainObject(role_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get response from getRole'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 404, result);					// 404: Not Found
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	apiutil.isString(role_result.message) ? role_result.message : 'Could not get error message in response from getRole'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 404, result);					// 404: Not Found
		}
		return;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(role_result.message));

	res.status(200);													// 200: OK
	res.send(JSON.stringify(role_result));
};

//
// Sub router function for GET ROLE TOKEN
//
// Mountpath							: '/v1/role/<role{/...}>'
//
// GET '/v1/role/token/<role{/...}>'	: get role on version 1
// HEADER								: X-Auth-Token	=> undefined User token or Role token
// URL arguments						: expire	=> "expire time(unix time value)" or undefined(default 24H)
//														if 0 is specified, no expire.
// response								:	{
//												"result":		true or false
//												"message":		error message
//												"token":		"role token"
//												"registerpath":	"path for registering"
//											}
//
// This mount point is for creating(update) role or creating(update) host in role.
//
const getRoleToken = (
	role:		string,
	token_info:	resTypeCheckKindToken | null,
	token_type:	string | null,
	token_str:	string | null,
	req:		Request,
	res:		Response
): void => {

	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(!apiutil.isSafeString(role)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request is failure by internal error.'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);								// 500: Internal Error
		return;
	}

	//------------------------------
	// tenant/role name/client ip
	//------------------------------
	let	tenant: string | null;
	if(!r3tokens.isResTypeCheckRoleToken(token_info) || !apiutil.isSafeString(token_info.tenant)){
		// parse role yrn path to tenant and role name
		const	keys		= r3keys();
		const	nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
		const	namematchs	= role.match(nameptn);
		if(!apiutil.isStringArray(namematchs) || !apiutil.isNotEmptyArray(namematchs) || namematchs.length < 4){
			// role is not full yrn
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request is failure by internal error(role yrn path is broken).'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 500, result);							// 500: Internal Error
			return;
		}
		tenant	= namematchs[2];
	}else{
		tenant	= token_info.tenant;
	}

	// client ip
	const	clientip = apiutil.getClientIpAddress(req);
	if(!apiutil.isSafeString(clientip)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request does not have ip address for client.'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	// date/expire
	let	token_date: string = '';
	if(r3tokens.isResTypeCheckRoleToken(token_info) && apiutil.isSafeString(token_info.date)){
		token_date = token_info.date;
	}
	let	token_expire: string = '';
	if(r3tokens.isResTypeCheckRoleToken(token_info) && apiutil.isSafeString(token_info.expire)){
		token_expire = token_info.expire;
	}

	//------------------------------
	// get role token
	//------------------------------
	let	rtoken_result: resTypeGetRoleToken | null;

	if(!apiutil.isSafeString(token_type)){
		// no token
		let	port: number = 0;
		if(apiutil.isSafeNumeric(req.query.port)){
			const	port_tmp = apiutil.cvtToNumber(req.query.port);
			if(!apiutil.isSafeNumber(port_tmp)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET request has port which is not number: ' + JSON.stringify(req.query.port)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);						// 400: Bad Request
				return;
			}
			port = port_tmp;
		}

		// check cuk parameter
		let	cuk: string | null = null;
		if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			cuk = apiutil.getSafeString(req.query.cuk).trim();
		}

		rtoken_result = r3tokens.getRoleTokenByIP(clientip, port, cuk, tenant, role, expire_rtoken);	// strict checking port/cuk

	}else if('role' === apiutil.getSafeString(token_type)){
		// role token
		if(!apiutil.compareRequestIpAddress(req, (null !== token_info ? apiutil.getSafeString(token_info.ip) : ''))){
			// wrong ip address in token
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET request ip address and role token are not same.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}

		// set expire time as same as old token
		let	expire = apiutil.getExpireUnixtimeFromISOStrings(token_date, token_expire);
		if(0 >= expire){
			expire = expire_rtoken;
		}

		// using port/cuk from token inforamtion
		rtoken_result = r3tokens.getRoleTokenByIP(clientip, (null !== token_info ? token_info.port : null), (null !== token_info ? token_info.cuk : null), tenant, role, expire);	// strict checking port/cuk

		// if succeed to get new role token, remove old token
		if(apiutil.isPlainObject(rtoken_result) && apiutil.isBoolean(rtoken_result.result) && rtoken_result.result){
			const	rm_result = r3tokens.removeRoleTokenByIP(token_str, clientip, (null !== token_info ? token_info.port : null), (null !== token_info ? token_info.cuk : null));
			if(!apiutil.isPlainObject(rm_result) || !apiutil.isBoolean(rm_result.result) || false === rm_result.result){
				r3logger.wlog('could not remove old role token(' + token_str + '), but continue...');
			}
		}

	}else if('user' === apiutil.getSafeString(token_type)){
		// user token

		// expire
		let	expire: number = expire_rtoken;										// expire default is 24H
		if(apiutil.isSafeNumeric(req.query.expire)){
			const	tmpExp = apiutil.cvtToNumber(req.query.expire);
			if(!apiutil.isSafeNumber(tmpExp)){
				const	result: resTypeBaseResult = {
					result: 	false,
					message:	'GET request has expire which is not number: ' + JSON.stringify(req.query.expire)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);						// 400: Bad Request
				return;
			}
			if(0 == tmpExp){
				expire = expire_reg_rtoken;										// If 0 is specified, it means no expire
			}else{
				expire = tmpExp;
			}
		}
		rtoken_result = r3tokens.getRoleTokenByUser((null !== token_info ? token_info.user : null), tenant, role, expire);

	}else{
		// broken token
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request is failure by internal error(token data broken).'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);								// 500: Internal Error
		return;
	}

	// check result
	if(!apiutil.isPlainObject(rtoken_result) || !apiutil.isBoolean(rtoken_result.result) || false === rtoken_result.result){
		if(!apiutil.isPlainObject(rtoken_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get role token.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 404, result);							// 404: Not Found
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	apiutil.isString(rtoken_result.message) ? rtoken_result.message : 'Could not get error message in response from get role token'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 404, result);							// 404: Not Found
		}
		return;
	}

	// create url parameter(path) for registering role member
	//
	const	regparamobj	= {
		role:	role,
		token:	rtoken_result.token
	};
	const	udproc		= new k2hr3userdata();
	const	regparamstr	= udproc.encryptRoleInfo(regparamobj);

	if(!apiutil.isSafeString(regparamstr)){
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'Could not create register url parameter with role token.'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 404, result);								// 404: Not Found
		return;
	}

	const	res_result: resTypeRoleToken = {
		result: 		rtoken_result.result,
		message:		rtoken_result.message,
		token:			rtoken_result.token,
		registerpath:	regparamstr
	};
	r3logger.dlog('succeed : ' + apiutil.getSafeString(res_result.message));

	res.status(200);															// 200: OK
	res.send(JSON.stringify(res_result));
};

//
// Sub router function for GET LIST OF ROLE TOKENS
//
// Mountpath								: '/v1/role/list/token/<role{/...}>'
//
// GET '/v1/role/token/list/<role{/...}>'	: get list of role tokens on version 1
// HEADER									: X-Auth-Token	=> User token
// URL arguments							: expand		=> "true"(default) or "false"
//
// response									:	{
//													result:		true/false
//													message:	null or error message string
//													tokens:	{
//														"token": {
//															date:			create date(UTC ISO 8601)
//															expire:			expire date(UTC ISO 8601)
//															user:			user name if user created this token
//															hostname:		hostname if this token was created by host(name)
//															ip:				ip address if this token was created by ip
//															port:			port number, if specified port when created token
//															cuk:			cuk, if specified cuk when created token
//															registerpath:	register path in user data script
//														},
//														...
//													}
// 												}
//												or
//												{
//													result:		true/false
//													message:	null or error message string
//													tokens: [
//														"role token",
//														....
//													]
// 												}
//
// This mount point is for listing of all role tokens in role.
//
const getListRoleTokens = (
	role:		string,
	token_info:	resTypeCheckKindToken | null,
	req:		Request,
	res:		Response
): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isPlainObject(req.query) )
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request query is wrong'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	const	keys	= r3keys();
	let		expand	= true;
	if(apiutil.isSafeString(req.query.expand)){
		if(apiutil.compareCaseString(keys.VALUE_TRUE, req.query.expand)){
			expand = true;
		}else if(apiutil.compareCaseString(keys.VALUE_FALSE, req.query.expand)){
			expand = false;
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'GET expand url argument parameter(' + JSON.stringify(req.query.expand) + ') is wrong, it must be ' + keys.VALUE_TRUE + ' or ' + keys.VALUE_FALSE + '.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);							// 400: Bad Request
			return;
		}
	}

	// check token
	if(	!apiutil.isSafeString(role)						||
		!r3tokens.isResTypeCheckRoleToken(token_info)	||
		!apiutil.isSafeString(token_info.user)			||
		!apiutil.isSafeString(token_info.tenant)		)
	{
		const	result: resTypeBaseResult = {
			result: 	false,
			message:	'GET request is failure by internal error.'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);								// 500: Internal Error
		return;
	}

	//------------------------------
	// get list of role tokens
	//------------------------------
	const	role_result = r3tokens.getListRoleTokens(role, token_info.tenant, expand);

	// check result
	if(!apiutil.isPlainObject(role_result) || !apiutil.isBoolean(role_result.result) || false === role_result.result){
		if(!apiutil.isPlainObject(role_result)){
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	'Could not get role token list.'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 404, result);							// 404: Not Found
		}else{
			const	result: resTypeBaseResult = {
				result: 	false,
				message:	apiutil.isString(role_result.message) ? role_result.message : 'Could not get error message in response from get role token list'
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 404, result);							// 404: Not Found
		}
		return;
	}

	// add register path into each role token elements
	if(expand && r3tokens.isResTypeObjRoleTokens(role_result.tokens)){
		Object.keys(role_result.tokens).forEach((oneToken: string): void => {
			const	regparamobj	= {
				role:	role,
				token:	oneToken
			};
			const	udproc		= new k2hr3userdata();
			const	regparamstr	= udproc.encryptRoleInfo(regparamobj);
			if(!apiutil.isSafeString(regparamstr) || !r3tokens.isResTypeObjRoleTokens(role_result.tokens)){		// need to check type again(because scope is not same)
				r3logger.elog('Could not create register url parameter with role token(' + JSON.stringify(oneToken) + '), but continue...');
			}else{
				role_result.tokens[oneToken].registerpath = regparamstr;
			}
		});
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(role_result.message));

	res.status(200);															// 200: OK
	res.send(JSON.stringify(role_result));
};

//---------------------------------------------------------
// Router HEAD
//---------------------------------------------------------
//
// Mountpath							: '/v1/role/<role{/...}>'
//
// HEAD '/v1/role/<role{/...}>'			: head role on version 1
// HEADER								: X-Auth-Token	=> User token or Role token or undefined
// response								: nothing
// response status code					: 204 or 4xx/5xx
//
// This mount point is for checking role existing or validation for role token/host ip address in role.
//
router.head('/', (req: Request, res: Response, next: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	if('HEAD' !== req.method){
		// If other method request comes here, so it should be routed another function.
		next();
		return;
	}

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isSafeString(req.baseUrl) )
	{
		r3logger.elog('HEAD request or url or query is wrong');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}

	//------------------------------
	// check token for API mode
	//------------------------------
	let	token_str: string | null					= null;
	let	token_type: string | null					= null;
	let	token_info: resTypeCheckKindToken | null	= null;
	let	keys: K2hr3Keys								= r3keys();

	if(r3tokens.hasAuthTokenHeader(req)){
		const	token_result = r3tokens.checkToken(req, true);					// scoped, both token
		if(!token_result.result){
			r3logger.elog(token_result.message);
			resutil.errResponse(req, res, token_result.status);
			return;
		}

		if(!r3tokens.isResTypeCheckRoleToken(token_result.token_info)){
			r3logger.elog('specified wrong token or it is not scoped user token');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}
		token_info	= token_result.token_info;
		token_str	= token_result.token ?? null;
		token_type	= token_result.token_type ?? null;
		keys		= r3keys(token_info.user, token_info.tenant);
	}

	//------------------------------
	// get role name
	//------------------------------
	// check get token type and parse role name
	const	requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);				// regex = /^\/v1\/role\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		r3logger.elog('HEAD request url does not have role name');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}

	// check role name is only name or full yrn path and tenant name
	let		tenantname: string | null;
	let		rolename: string | null;
	let		roleyrn			= reqmatchs[1].toLowerCase();
	let		roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	roleyrnmatchs	= roleyrn.match(roleyrnptn);
	if(!apiutil.isStringArray(roleyrnmatchs) || !apiutil.isNotEmptyArray(roleyrnmatchs) || roleyrnmatchs.length < 4){
		//
		// roleyrn is not full yrn to role, then check wrong role name
		//
		roleyrnptn		= new RegExp('^' + keys.NO_TENANT_KEY);					// regex = /^yrn:yahoo:/
		if(roleyrn.match(roleyrnptn)){
			r3logger.elog('HEAD request query has wrong yrn full path to role');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}

		// roleyrn is not full yrn, we need tenant name
		if(!apiutil.isSafeString(keys.ROLE_TOP_KEY)){
			r3logger.elog('HEAD request role name which is not full yrn, and not token. role name must be full yrn, if token is not specified.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}
		// make full yrn for role, and set tenant name/role name.
		tenantname	= (apiutil.isPlainObject(token_info) && apiutil.isSafeString(token_info.tenant)) ? token_info.tenant : null;
		rolename	= roleyrn;
		roleyrn		= keys.ROLE_TOP_KEY + ':' + roleyrn;

	}else{
		//
		// roleyrn is full yrn to role.
		// need to check tenant name when token is specified.
		//
		if(null !== token_type && (!apiutil.isPlainObject(token_info) || !apiutil.isSafeString(token_info.tenant) || !apiutil.compareCaseString(roleyrnmatchs[2], token_info.tenant))){
			r3logger.elog('HEAD request query has wrong tenant yrn full path(tenant=' + roleyrnmatchs[2] + ') or not specify tenant.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}
		// set tenant name/role name.
		tenantname	= roleyrnmatchs[2];
		rolename	= roleyrnmatchs[3];
	}

	//------------------------------
	// Run
	//------------------------------
	if(!apiutil.isSafeString(token_type)){
		// check host ip address in role
		const	clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			r3logger.elog('HEAD request does not have ip address for client.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return;
		}

		// port
		let	tg_port: number	= 0;
		if(apiutil.isSafeNumeric(req.query.port)){
			const	port_tmp = apiutil.cvtToNumber(req.query.port);
			if(!apiutil.isSafeNumber(port_tmp)){
				r3logger.elog('HEAD request has port which is not number: ' + JSON.stringify(req.query.port));
				resutil.errResponse(req, res, 400);								// 400: Bad Request
				return;
			}
			tg_port	= port_tmp;
		}

		// cuk
		let	tg_cuk: string | null = null;
		if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			tg_cuk	= req.query.cuk.trim();
		}

		// find host
		const	find_result = k2hr3.findHost(tenantname, rolename, null, clientip, tg_port, tg_cuk, false);		// not strictly checking

		// result
		if(!find_result.result){
			r3logger.elog('HEAD request failure - check host ip(' + clientip + ') address in role(tenant=' + tenantname + ', role=' + rolename + ') host');
			resutil.errResponse(req, res, 403);									// 403: Forbidden
			return;
		}else{
			r3logger.dlog('HEAD request succeed - check host ip(' + clientip + ') address in role(tenant=' + tenantname + ', role=' + rolename + ') host');
			res.status(204);													// 204: No Content
		}

	}else if('role' === apiutil.getSafeString(token_type)){
		// check role token
		const	check_result = r3tokens.checkToken(req, true, false);			// recheck - scoped, both token

		// result
		if(!check_result.result){
			r3logger.elog('HEAD request failure - check role token(' + JSON.stringify(token_str) + ') : ' + apiutil.getSafeString(check_result.message));
			resutil.errResponse(req, res, 403);									// 403: Forbidden
			return;
		}else{
			r3logger.dlog('HEAD request succeed - check role token(' + JSON.stringify(token_str) + ')');
			res.status(204);													// 204: No Content
		}

	}else if('user' === apiutil.getSafeString(token_type)){
		// check role exist
		const	role_result = k2hr3.getRole(roleyrn, true);

		// result
		if(!role_result.result){
			r3logger.elog('HEAD request failure - check role(' + roleyrn + ') exist');
			resutil.errResponse(req, res, 403);									// 403: Forbidden
			return;
		}else{
			r3logger.dlog('HEAD request succeed - check role(' + roleyrn + ') exists');
			res.status(204);													// 204: No Content
		}

	}else{
		// broken token
		r3logger.elog('HEAD request is failure by internal error(token data broken).');
		resutil.errResponse(req, res, 500);										// 500: Internal Error
		return;
	}

	res.send();
});

//---------------------------------------------------------
// Router DELETE
//---------------------------------------------------------
//
// Mountpath							: '/v1/role/<role{/...}>'
//
// DELETE '/v1/role/<role{/...}>'		: delete role member host on version 1
// HEADER								: X-Auth-Token	=> undefined
// URL arguments
//	"port":	<port number>				: this value is number string(0-), allowed null and '' for  this value.
//	"cuk":	<container unique key>		: this value is string. if this value is undefined/null/empty string, it means any.
// response								: nothing
// response status code					: 204 or 4xx/5xx
//
// The role's host member removes itself from the role without any token.
// Whether a role member is a host is automatically determined by client ip, port, and cuk.
//
//
// DELETE '/v1/role/<role{/...}>'		: delete role token on version 1
// HEADER								: X-Auth-Token	=> Role token
// URL arguments						: n/a
// response								: nothing
// response status code					: 204 or 4xx/5xx
//
// Delete the role token by role token.
//
//
// DELETE '/v1/role/<role{/...}>'		: delete role member hosts or ip addresses on version 1
// HEADER								: X-Auth-Token	=> User Scoped token
// URL arguments
//	"host":	<string, JSON string array>	: this value is string for one IP address, or string array encoded JSON string
//										  for IP addresses.
//	"port":	<port number>				: this value is number string(0-), allowed null and '' for  this value.
//	"cuk":	<container unique key>		: this value is string. if this value is undefined/null/empty string, it means any.
// response								: nothing
// response status code					: 204 or 4xx/5xx
//
// Delete the role host(ip address)s member.
//
//
// DELETE '/v1/role/<role{/...}>'		: delete role member hosts or ip addresses on version 1
// HEADER								: X-Auth-Token	=> User Scoped token
// URL arguments						: n/a
// response								: nothing
// response status code					: 204 or 4xx/5xx
//
// Delete the role.
//
//---------------------------------------------------------
//
// Mountpath							: '/v1/role/token/<role token>'
//
// DELETE '/v1/role/token/<role token>'	: delete role token on version 1
// HEADER								: X-Auth-Token	=> User Scoped token
// URL arguments						: undefined
// response								: nothing
// response status code					: 204 or 4xx/5xx
//
// Delete the role token by user.
//
//---------------------------------------------------------
//
// Mountpath							: '/v1/role'
//
// DELETE '/v1/role'					: delete role member by cuk on version 1
// URL arguments
//	"cuk":	<container unique key>		: this value is string.
//										  Specify the Container Unique Id to be deleted.
//										  Role members associated with this Id will be deleted.
//	"host":	<string, JSON string array>	: this value is string for one IP address, or string array encoded JSON string
//										  for IP addresses.
// response								: nothing
// response status code					: 204 or 4xx/5xx
//
//
// This mount point is for deleting ip addresses from roles by container unique key which includes ip addresses.
// The requester must be role member which is allowed to access this mount point for removing IP address by cuk.
//
router.delete('/', (req: Request, res: Response, _: NextFunction): void => {

	r3logger.dlog('CALL:', req.method, req.url, req.baseUrl);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isSafeString(req.baseUrl) )
	{
		r3logger.elog('DELETE request or url or query is wrong');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return;
	}

	//
	// Check Path type and branch
	//
	const	keys			= r3keys();
	let		is_delete_token	= false;
	let		is_delete_ip	= false;
	const	urlpath			= decodeURI(req.baseUrl);
	const	requestptn		= new RegExp(keys.MATCH_URI_GET_RTOKEN);			// regex = /^\/v1\/role\/token\/(.*)/
	const	reqmatchs		= urlpath.match(requestptn);
	if(apiutil.isStringArray(reqmatchs) && apiutil.isNotEmptyArray(reqmatchs) && 2 <= reqmatchs.length && '' !== apiutil.getSafeString(reqmatchs[1])){
		// get token
		is_delete_token	= true;
	}else{
		// recheck simply
		if(apiutil.isSafeString(urlpath) && (urlpath == '/v1/role' || urlpath == '/v1/role/')){
			// urlpath is /v1/role, this is to delete ip address by cuk
			is_delete_ip= true;
		}else{
			// urlpath is not /v1/role, expected /v1/role/<role>, this is to delete role.
		}
	}

	// Run
	if(is_delete_token){
		// delete role token.
		if(!rawDeleteRoleToken(req, res)){
			r3logger.elog('failed to delete role token.');
		}
	}else if(is_delete_ip){
		// delete ip address by cuk
		if(!rawDeleteIpsByCuk(req, res)){
			r3logger.elog('failed to delete ip address by cuk.');
		}
	}else{
		// delete role / role token.
		if(!rawDeleteRoleByPath(req, res)){
			r3logger.elog('failed to delete role.');
		}
	}

	res.send();
});

//
// Utility for deleting role / role token
//
const rawDeleteRoleByPath = (req: Request, res: Response): boolean => {

	//------------------------------
	// check token for API mode
	//------------------------------
	let	token_str: string | null					= null;
	let	token_type: string | null					= null;
	let	token_info: resTypeCheckKindToken | null	= null;
	let	keys: K2hr3Keys								= r3keys();
	if(r3tokens.hasAuthTokenHeader(req)){
		const	token_result = r3tokens.checkToken(req, true);				// scoped, both token
		if(!token_result.result){
			r3logger.elog(token_result.message);
			resutil.errResponse(req, res, token_result.status);
			return false;
		}

		if(!r3tokens.isResTypeCheckRoleToken(token_result.token_info)){
			r3logger.elog('specified wrong token or it is not scoped user token');
			resutil.errResponse(req, res, 400);								// 400: Bad Request
			return false;
		}
		token_info	= token_result.token_info;
		token_str	= token_result.token ?? null;
		token_type	= token_result.token_type ?? null;
		keys		= r3keys(token_info.user, token_info.tenant);
	}

	//------------------------------
	// get role name
	//------------------------------
	// check get token type and parse role name
	const	requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);				// regex = /^\/v1\/role\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		r3logger.elog('DELETE request url does not have role name');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return false;
	}

	// check role name is only name or full yrn path and tenant name
	let		tenantname: string | null;
	let		rolename: string | null;
	let		roleyrn			= reqmatchs[1].toLowerCase();
	let		roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	const	roleyrnmatchs	= roleyrn.match(roleyrnptn);
	if(!apiutil.isStringArray(roleyrnmatchs) || !apiutil.isNotEmptyArray(roleyrnmatchs) || roleyrnmatchs.length < 4){
		//
		// roleyrn is not full yrn to role, then check wrong role name
		//
		roleyrnptn		= new RegExp('^' + keys.NO_TENANT_KEY);					// regex = /^yrn:yahoo:/
		if(roleyrn.match(roleyrnptn)){
			r3logger.elog('DELETE request query has wrong yrn full path to role');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return false;
		}
		// roleyrn is not full yrn, we need tenant name
		if(!apiutil.isSafeString(keys.ROLE_TOP_KEY)){
			r3logger.elog('DELETE request role name which is not full yrn, and not token. role name must be full yrn, if token is not specified.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return false;
		}
		// make full yrn for role, and set tenant name/role name.
		tenantname	= (apiutil.isPlainObject(token_info) && apiutil.isSafeString(token_info.tenant)) ? token_info.tenant : null;
		rolename	= roleyrn;
		roleyrn		= keys.ROLE_TOP_KEY + ':' + roleyrn;

	}else{
		//
		// roleyrn is full yrn to role.
		// need to check tenant name when token is specified.
		//
		if(null !== token_type && (!apiutil.isPlainObject(token_info) || !apiutil.isSafeString(token_info.tenant) || !apiutil.compareCaseString(roleyrnmatchs[2], token_info.tenant))){
			r3logger.elog('DELETE request query has wrong tenant yrn full path(tenant=' + roleyrnmatchs[2] + ') or not specify tenant.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return false;
		}
		// set tenant name/role name.
		tenantname	= roleyrnmatchs[2];
		rolename	= roleyrnmatchs[3];
	}

	//------------------------------
	// Run
	//------------------------------
	if(!apiutil.isSafeString(token_type)){
		// remove host ip address in role
		const	clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			r3logger.elog('DELETE request does not have ip address for client.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return false;
		}

		// check port
		let	port: number = 0;
		if(apiutil.isSafeNumeric(req.query.port)){
			const	port_tmp = apiutil.cvtToNumber(req.query.port);
			if(!apiutil.isSafeNumber(port_tmp)){
				r3logger.elog('DELETE request has port which is not number: ' + JSON.stringify(req.query.port));
				resutil.errResponse(req, res, 400);								// 400: Bad Request
				return false;
			}
			port = port_tmp;
		}

		// check cuk parameter
		let	cuk: string | null = null;
		if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			cuk = apiutil.getSafeString(req.query.cuk).trim();
		}

		// remove host(check requester and requester is target)
		const	rm_result = k2hr3.removeHost(tenantname, rolename, clientip, port, cuk, clientip, port, cuk);

		// result
		if(!rm_result.result){
			r3logger.elog('DELETE request failure - remove host by ip(' + clientip + ':' + String(port) + ') address, cuk(' + JSON.stringify(cuk) + ') in role(tenant=' + tenantname + ', role=' + rolename + ') host');
			resutil.errResponse(req, res, 403);									// 403: Forbidden
			return false;
		}else{
			r3logger.dlog('DELETE request succeed - remove host by ip(' + clientip + ':' + String(port) + ') address, cuk(' + JSON.stringify(cuk) + ') in role(tenant=' + tenantname + ', role=' + rolename + ') host');
			res.status(204);													// 204: No Content
		}

	}else if('role' === apiutil.getSafeString(token_type) && apiutil.isPlainObject(token_info)){
		// remove role token
		const	clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			r3logger.elog('DELETE request does not have ip address for client.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return false;
		}

		// check full role yrn path in token and path
		if(!apiutil.isSafeString(token_info.role) || token_info.role != roleyrn){
			r3logger.elog('DELETE request is something wrong, the role token(' + JSON.stringify(token_info.role) + ') and role path(' + JSON.stringify(roleyrn) + ') do not match.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return false;
		}

		// check for k8s cuk/port
		let	port: number		= 0;
		let	cuk: string | null;
		if(apiutil.isSafeString(token_info.extra) && token_info.extra === keys.VALUE_K8S_V1){
			// cuk
			if(!apiutil.isPlainObject(req.query) || !apiutil.isSafeString(req.query.cuk) || !apiutil.isSafeString(req.query.cuk.trim())){
				r3logger.elog('DELETE request need cuk parameter for deleting role token which is made for k8s.');
				resutil.errResponse(req, res, 400);								// 400: Bad Request
				return false;
			}
			cuk = apiutil.getSafeString(req.query.cuk).trim();

			if(!apiutil.isSafeString(token_info.cuk) || token_info.cuk != cuk){
				r3logger.elog('DELETE request cuk(' + JSON.stringify(cuk) + ') parameter is invalid.');
				resutil.errResponse(req, res, 400);								// 400: Bad Request
				return false;
			}

			// port
			if(apiutil.isPlainObject(req.query) && apiutil.isSafeNumeric(req.query.port)){
				const	port_tmp = apiutil.cvtToNumber(req.query.port);
				if(!apiutil.isSafeNumber(port_tmp)){
					r3logger.elog('DELETE request has port which is not number: ' + JSON.stringify(req.query.port));
					resutil.errResponse(req, res, 400);							// 400: Bad Request
					return false;
				}
				port = port_tmp;
			}
			if(!apiutil.isSafeNumber(token_info.port) || token_info.port != port){
				r3logger.elog('DELETE request port(' + JSON.stringify(port) + ') parameter is invalid.');
				resutil.errResponse(req, res, 400);								// 400: Bad Request
				return false;
			}
		}

		// remove role token
		const rm_result = r3tokens.removeRoleTokenByIP(token_str, clientip, token_info.port, token_info.cuk);

		// result
		if(!rm_result.result){
			r3logger.elog('DELETE request failure - remove role token(' + JSON.stringify(token_str) + ')');
			resutil.errResponse(req, res, 403);									// 403: Forbidden
			return false;
		}else{
			r3logger.dlog('DELETE request succeed - remove role token(' + JSON.stringify(token_str) + ')');
			res.status(204);													// 204: No Content
		}

	}else if('user' === apiutil.getSafeString(token_type) && apiutil.isPlainObject(token_info)){
		if(apiutil.isPlainObject(req.query) && apiutil.isSafeString(req.query.host)){
			// remove host(hostname or ip address) in role
			let		tg_host: string[];
			const	tmp_str_host	= apiutil.getSafeString(req.query.host);
			const	tmp_arr_host	= apiutil.parseJSON(req.query.host);
			if(apiutil.isStringArray(tmp_arr_host) && apiutil.isNotEmptyArray(tmp_arr_host)){
				tg_host	= tmp_arr_host;
			}else{
				tg_host	= [tmp_str_host];
			}

			// check port
			let	port: number = 0;
			if(apiutil.isSafeNumeric(req.query.port)){
				const	port_tmp = apiutil.cvtToNumber(req.query.port);
				if(!apiutil.isSafeNumber(port_tmp)){
					r3logger.elog('GET request has port which is not number: ' + JSON.stringify(req.query.port));
					resutil.errResponse(req, res, 400);							// 400: Bad Request
					return false;
				}
				port = port_tmp;
			}

			// check cuk parameter
			let	cuk: string | null = null;
			if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
				cuk = apiutil.getSafeString(req.query.cuk).trim();
			}

			// remove host(not check requester)
			const	rm_result = k2hr3.removeHost(tenantname, rolename, tg_host, port, cuk);

			// result
			if(!rm_result.result){
				r3logger.elog('DELETE request failure - remove host(' + apiutil.getSafeString(tg_host) + ':' + String(port) + ') address, cuk(' + JSON.stringify(cuk) + ') in role(tenant=' + tenantname + ', role=' + rolename + ') host');
				resutil.errResponse(req, res, 403);								// 403: Forbidden
				return false;
			}else{
				r3logger.dlog('DELETE request succeed - remove host(' + apiutil.getSafeString(tg_host) + ':' + String(port) + ') address, cuk(' + JSON.stringify(cuk) + ') in role(tenant=' + tenantname + ', role=' + rolename + ') host');
				res.status(204);												// 204: No Content
			}
		}else{
			// remove role
			const	rm_result = k2hr3.removeRole(token_info.user, tenantname, rolename);

			// result
			if(!rm_result.result){
				r3logger.elog('DELETE request failure - remove role(' + rolename + ') exist');
				resutil.errResponse(req, res, 403);								// 403: Forbidden
				return false;
			}else{
				r3logger.dlog('DELETE request succeed - remove role(' + rolename + ') exists');
				res.status(204);												// 204: No Content
			}
		}

	}else{
		// broken token
		r3logger.elog('DELETE request is failure by internal error(token data broken).');
		resutil.errResponse(req, res, 500);										// 500: Internal Error
		return false;
	}
	return true;
};

//
// Utility for deleting ip address by cuk
//
const rawDeleteIpsByCuk = (req: Request, res: Response): boolean => {

	const	keys	 = r3keys();
	const	clientip = apiutil.getClientIpAddress(req);
	if(!apiutil.isSafeString(clientip)){
		r3logger.elog('DELETE request does not have ip address for client');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return false;
	}

	//------------------------------
	// check arguments
	//------------------------------
	if(!apiutil.isPlainObject(req.query)){
		r3logger.elog('DELETE request has no query parameter');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return false;
	}

	let	tg_host: string[] = [];
	if(apiutil.isSafeEntity(req.query.host)){
		const tmp_str_host	= apiutil.getSafeString(req.query.host).trim();
		const tmp_arr_host	= apiutil.parseJSON(tmp_str_host);
		if(apiutil.isStringArray(tmp_arr_host) && apiutil.isNotEmptyArray(tmp_arr_host)){
			tg_host	= tmp_arr_host.slice(0, tmp_arr_host.length);
		}else if(apiutil.isSafeString(tmp_str_host)){
			tg_host.push(tmp_str_host);
		}else{
			r3logger.dlog('DELETE request has no host parameter, it means removing all host in cuk: ' + JSON.stringify(req.query.cuk));
		}
	}

	// cuk parameter
	if(!apiutil.isSafeString(req.query.cuk) || !apiutil.isSafeString(req.query.cuk.trim())){
		r3logger.elog('DELETE request has invalid cuk parameter: ' + JSON.stringify(req.query.cuk));
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return false;
	}
	const	tg_cuk	= req.query.cuk.trim();
	const	tg_extra= k2hr3.getExtraFromCuk(tg_cuk);

	// Check client ip address
	if(tg_extra == keys.VALUE_K8S_V1){
		// for kubernetes

		// check client ip address is the host itself to be removed
		// 
		// [NOTE]
		// if result is true, it means client ip address is cuk's node ip address.
		// after that, the comparison between the cuk object data contents and the cuk data
		// in k2hdkc linked to the this ip address is done in removeIpsByCuk() function.
		//
		if(!k2hr3.compareIpAndKubernetesCuk(clientip, tg_cuk)){
			// client ip is not as same as cuk's node ip address, 
			// then retry to compare delhost ip in config and it.
			const	adminips = k2hr3.findRoleHost(null, delhost_role_yrn, null, clientip, 0, null);	// not strict checking for admin delhost host
			if(!apiutil.isArray(adminips)){
				r3logger.elog('DELETE request from ip address(' + JSON.stringify(clientip) + ') is not role(' + JSON.stringify(delhost_role_yrn) + ') member.');
				resutil.errResponse(req, res, 400);								// 400: Bad Request
				return false;
			}
		}

	}else if(tg_extra == keys.VALUE_OPENSTACK_V1){
		// for openstack

		// In case of openstack, when deleting without token, it can be deleted only from
		// the IP address registered as delhost ip in config.
		//
		// Check client ip address is in role admin member ip address.
		const	adminips = k2hr3.findRoleHost(null, delhost_role_yrn, null, clientip, 0, null);		// not strict checking for admin delhost host
		if(!apiutil.isArray(adminips)){
			r3logger.elog('DELETE request from ip address(' + JSON.stringify(clientip) + ') is not role(' + JSON.stringify(delhost_role_yrn) + ') member.');
			resutil.errResponse(req, res, 400);									// 400: Bad Request
			return false;
		}
	}else{
		// Currently supports only openstack and kubernetes
		r3logger.elog('DELETE request has unknown extra type in cuk parameter: ' + JSON.stringify(req.query.cuk));
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return false;
	}

	//------------------------------
	// Run
	//------------------------------
	const	resobj = k2hr3.removeIpsByCuk(tg_cuk, tg_host, true);
	if(!apiutil.isPlainObject(resobj) || !apiutil.isBoolean(resobj.result) || false === resobj.result){
		if(apiutil.isPlainObject(resobj) && apiutil.isString(resobj.message)){
			r3logger.elog('DELETE request failed by ' + resobj.message);
		}else{
			r3logger.elog('DELETE request failed by unknown reason.');
		}
		resutil.errResponse(req, res, 403);										// 403: Forbidden(is this status OK?)
		return false;
	}
	r3logger.dlog('succeed : ' + apiutil.getSafeString(resobj.message));

	res.status(204);															// 204: No Content
	return true;
};

//
// Utility for deleting role token
//
const rawDeleteRoleToken = (req: Request, res: Response): boolean => {

	if(	!apiutil.isPlainObject(req) ||
		!apiutil.isSafeString(req.baseUrl) )
	{
		r3logger.elog('DELETE request or url or query is wrong');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return false;
	}

	//------------------------------
	// check token
	//------------------------------
	if(!r3tokens.hasAuthTokenHeader(req)){
		r3logger.elog('DELETE request does not have any auth token.');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return false;
	}

	const	token_result = r3tokens.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		resutil.errResponse(req, res, token_result.status);
		return false;
	}

	const	token_info	= token_result.token_info;
	if(!r3tokens.isResTypeCheckRoleToken(token_info)){
		r3logger.elog('specified wrong token or it is not scoped user token');
		resutil.errResponse(req, res, 400);										// 400: Bad Request
		return false;
	}
	const	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// get role token from uri
	//------------------------------
	// check get token type and parse role name
	const	requestptn	= new RegExp(keys.MATCH_URI_GET_RTOKEN);					// regex = /^\/v1\/role\/token\/(.*)/
	const	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isStringArray(reqmatchs) || !apiutil.isNotEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		r3logger.elog('DELETE request url does not have token string nor yrn path');
		resutil.errResponse(req, res, 400);											// 400: Bad Request
		return false;
	}
	const	token_string	= apiutil.getSafeString(reqmatchs[1]);

	//------------------------------
	// Run
	//------------------------------
	if(!r3tokens.removeRoleTokenByPath(token_string, (apiutil.isSafeString(token_info.tenant) ? token_info.tenant : null))){
		r3logger.elog('DELETE request failure - remove role token(' + token_string + ')');
		resutil.errResponse(req, res, 403);											// 403: Forbidden
		return false;
	}else{
		r3logger.dlog('DELETE request succeed - remove role token(' + token_string + ')');
		res.status(204);															// 204: No Content
	}
	return true;
};

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
	resTypeRoleToken
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
