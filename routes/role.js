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

var express		= require('express');
var router		= express.Router();

var	r3token		= require('../lib/k2hr3tokens');
var	apiutil		= require('../lib/k2hr3apiutil');
var	resutil		= require('../lib/k2hr3resutil');
var	r3userdata	= require('../lib/k2hr3userdata');
var	k2hr3		= require('../lib/k2hr3dkc');
var	r3keys		= require('../lib/k2hr3keys').getK2hr3Keys;

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//---------------------------------------------------------
// Configuration
//	* Get role full path which is allowed to remove ip address
//	* Get expiration for role tokens
//---------------------------------------------------------
var	delhost_role_yrn	= null;
var	expire_rtoken		= 0;
var	expire_reg_rtoken	= 0;

(function()
{
	var	r3Conf			= require('../lib/k2hr3config').r3ApiConfig;
	var	apiConf			= new r3Conf();

	var	admincfgobj		= apiConf.getK2hr3AdminConfig();
	if(apiutil.isSafeEntity(admincfgobj) && apiutil.isSafeString(admincfgobj.tenant) && apiutil.isSafeString(admincfgobj.delhostrole)){
		var	keys		= r3keys(null, admincfgobj.tenant.trim());
		delhost_role_yrn= keys.ROLE_TOP_KEY + ':' + admincfgobj.delhostrole.trim();
	}else{
		r3logger.elog('Could not find tenant/role in configuration for deleting host by cuk.');
		delhost_role_yrn= null;
	}
	expire_rtoken		= apiConf.getExpireTimeRoleToken();
	expire_reg_rtoken	= apiConf.getExpireTimeRegRoleToken();
}());

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
router.post('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.baseUrl) )
	{
		result = {
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
		var	keys		= r3keys();
		var	requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);		// regex = /^\/v1\/role\/(.*)/
		var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
		if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
			result = {
				result: 	false,
				message:	'POST request url does not have role name'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		// role name
		var	name	= reqmatchs[1];
		name		= name.toLowerCase();

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
router.put('/', function(req, res, next)
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.baseUrl) )
	{
		result = {
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
		var	keys		= r3keys();
		var	requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);		// regex = /^\/v1\/role\/(.*)/
		var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
		if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
			result = {
				result: 	false,
				message:	'POST request url does not have role name'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		// role name
		var	name	= reqmatchs[1];
		name		= name.toLowerCase();

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
function postRole(req, res, next)										// eslint-disable-line no-unused-vars
{
	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.body) ||
		!apiutil.isSafeEntity(req.body.role) )
	{
		result = {
			result: 	false,
			message:	'POST body does not have role data'
		};

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
	// check arguments
	//------------------------------
	// name
	if(!apiutil.isSafeString(req.body.role.name)){
		result = {
			result: 	false,
			message:	'role:name field is wrong : ' + JSON.stringify(req.body.role.name)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	keys	= r3keys(token_info.user, token_info.tenant);
	var	name	= apiutil.getSafeString(req.body.role.name);
	name		= name.toLowerCase();

	// role name is only name or full yrn path
	var	nameptn		= new RegExp('^' + keys.ROLE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:role:(.*)/
	var	namematchs	= name.match(nameptn);
	if(!apiutil.isEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}
	// check name which is not full yrn
	nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);					// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		r3logger.elog('POST request query has wrong yrn full path to role');
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	// policies
	var	policiesptn	= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
	var	policiespram= apiutil.getNormalizeParameter(req.body.role.policies, policiesptn, null);
	if(false === policiespram.result){
		result = {
			result: 	false,
			message:	'role:policies field is wrong : ' + JSON.stringify(req.body.role.policies)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	policies	= policiespram.parameter;

	// alias
	var	aliasptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	aliaspram	= apiutil.getNormalizeParameter(req.body.role.alias, aliasptn, null);
	if(false === aliaspram.result){
		result = {
			result: 	false,
			message:	'role:alias field is wrong : ' + JSON.stringify(req.body.role.alias)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	aliases = aliaspram.parameter;

	//------------------------------
	// set all field to role
	//------------------------------
	result = k2hr3.setRoleAll(token_info.user, token_info.tenant, name, policies, aliases, null, false, null, false);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from setRoleAll'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from setRoleAll';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(201);													// 201: Created
	res.send(JSON.stringify(result));
}

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
function putRole(req, res, next)										// eslint-disable-line no-unused-vars
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
	// check arguments
	//------------------------------
	// name
	if(!apiutil.isSafeString(req.query.name)){
		result = {
			result: 	false,
			message:	'role:name field is wrong : ' + JSON.stringify(req.query.name)
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	var	keys	= r3keys(token_info.user, token_info.tenant);
	var	name	= apiutil.getSafeString(req.query.name);
	name		= name.toLowerCase();

	// role name is only name or full yrn path
	var	nameptn		= new RegExp('^' + keys.ROLE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:role:(.*)/
	var	namematchs	= name.match(nameptn);
	if(!apiutil.isEmptyArray(namematchs) && 2 <= namematchs.length){
		name = namematchs[1];
	}
	// check name which is not full yrn
	nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);					// regex = /^yrn:yahoo:/
	if(name.match(nameptn)){
		result = {
			result: 	false,
			message:	'PUT request query has wrong yrn full path to role'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	// policies
	var	policies = null;
	if('' === req.query.policies){
		policies = '';
	}else if(apiutil.isSafeString(req.query.policies)){
		// policies is encoded by JSON, this value is array.
		//
		var	tmppolicies	= apiutil.getSafeString(req.query.policies);
		if(apiutil.checkSimpleJSON(tmppolicies)){
			tmppolicies	= JSON.parse(tmppolicies);
		}
		var	policiesptn	= new RegExp('^' + keys.POLICY_TOP_KEY + ':(.*)');		// regex = /^yrn:yahoo:<service>::<tenant>:policy:(.*)/
		var	policiespram= apiutil.getNormalizeParameter(tmppolicies, policiesptn, null);
		if(false === policiespram.result){
			result = {
				result: 	false,
				message:	'role:policies field is wrong : ' + req.query.policies
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		policies = policiespram.parameter;
	}

	// alias
	var	aliases = null;
	if('' === req.query.alias){
		aliases = '';
	}else if(apiutil.isSafeString(req.query.alias)){
		// alias is encoded by JSON, this value is array.
		//
		var	tmpaliases	= apiutil.getSafeString(req.query.alias);
		if(apiutil.checkSimpleJSON(tmpaliases)){
			tmpaliases	= JSON.parse(tmpaliases);
		}
		var	aliasptn	= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);	// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
		var	aliaspram	= apiutil.getNormalizeParameter(tmpaliases, aliasptn, null);
		if(false === aliaspram.result){
			result = {
				result: 	false,
				message:	'role:alias field is wrong : ' + req.query.alias
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		aliases = aliaspram.parameter;
	}

	//------------------------------
	// set all field to role
	//------------------------------
	result = k2hr3.setRoleAll(token_info.user, token_info.tenant, name, policies, aliases, null, false, null, false);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from setRoleAll'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from setRoleAll';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(201);													// 201: Created
	res.send(JSON.stringify(result));
}

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
function postRoleHost(role, req, res, next)								// eslint-disable-line no-unused-vars
{
	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.body) ||
		!apiutil.isSafeEntity(req.body.host) )
	{
		result = {
			result: 	false,
			message:	'POST body does not have host data'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true);					// scoped, both token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	is_host_req	= (!apiutil.isArray(req.body.host) && !apiutil.isSafeString(req.body.host.host));
	var	token_info	= token_result.token_info;
	var	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// check arguments
	//------------------------------
	// role name check
	var	name		= apiutil.getSafeString(role);
	name			= name.toLowerCase();
	var	nameptn		= new RegExp('^' + keys.ROLE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:role:(.*)/
	var	namematchs	= name.match(nameptn);
	if(!apiutil.isEmptyArray(namematchs) && 2 <= namematchs.length){
		// name is full yrn, then reset only name.
		name = namematchs[1];
	}else{
		// role name is not full yrn, then check other yrn path
		nameptn	= new RegExp('^' + keys.NO_TENANT_KEY);					// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			result = {
				result: 	false,
				message:	'POST request url has wrong yrn full path to role'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	//------------------------------
	// build parameters
	//------------------------------
	var	port;
	var	cuk;
	var	extra;
	var	tag;
	var	host_info;
	if(!is_host_req){
		//
		// request from user token
		//
		var	hostArray;
		if(apiutil.isArray(req.body.host)){
			hostArray = req.body.host;
		}else{
			hostArray = [ req.body.host ];
		}

		// check array and make ip array
		var	hostnameArray	= [];
		var	ipArray			= [];
		for(var cnt = 0; cnt < hostArray.length; ++cnt){
			if(!apiutil.isSafeString(hostArray[cnt].host)){
				result = {
					result: 	false,
					message:	'host is not specified.'
				};

				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);					// 400: Bad Request
				return;
			}
			// hostname or ip address
			var	tg_host = apiutil.getSafeString(hostArray[cnt].host);
			var	tg_ip	= null;
			if(apiutil.isIpAddressString(tg_host)){
				tg_ip	= tg_host.toLowerCase();
				tg_host = null;
			}else{
				tg_host	= tg_host.toLowerCase();
				tg_ip	= null;
			}

			// port
			port = 0;														// default any
			if(apiutil.isSafeEntity(hostArray[cnt].port)){
				if(isNaN(hostArray[cnt].port)){
					result = {
						result: 	false,
						message:	'POST request has port which is not number: ' + JSON.stringify(hostArray[cnt].port)
					};

					r3logger.elog(result.message);
					resutil.errResponse(req, res, 400, result);				// 400: Bad Request
					return;
				}
				port = parseInt(hostArray[cnt].port);
			}

			// cuk
			cuk = null;														// default any
			if(apiutil.isSafeString(hostArray[cnt].cuk) && apiutil.isSafeString(hostArray[cnt].cuk.trim())){
				cuk = apiutil.getSafeString(hostArray[cnt].cuk).trim();
			}

			// extra
			extra = null;
			if(apiutil.isSafeString(hostArray[cnt].extra)){
				extra = apiutil.getSafeString(hostArray[cnt].extra);
			}

			// tag
			tag = null;
			if(apiutil.isSafeString(hostArray[cnt].tag)){
				tag = apiutil.getSafeString(hostArray[cnt].tag);
			}

			// set base host information
			if(null !== tg_host){
				host_info = {
					ip:			null,
					hostname:	tg_host,
					port:		port,
					cuk:		cuk,
					extra:		extra,
					tag:		tag
				};
			}else{	// null !== tg_ip
				host_info = {
					ip:			tg_ip,
					hostname:	null,
					port:		port, 
					cuk:		cuk,
					extra:		extra,
					tag:		tag
				};
			}

			// set optional keys
			if(apiutil.isSafeString(hostArray[cnt].inboundip)){
				if(!apiutil.isIpAddressString(hostArray[cnt].inboundip)){
					result = {
						result: 	false,
						message:	'POST request has inbound ip address which is not ignore ip address string: ' + JSON.stringify(hostArray[cnt].inboundip)
					};
					r3logger.elog(result.message);
					resutil.errResponse(req, res, 400, result);				// 400: Bad Request
					return;
				}
				host_info.inboundip = apiutil.getSafeString(hostArray[cnt].inboundip);
			}

			if(apiutil.isSafeString(hostArray[cnt].outboundip)){
				if(!apiutil.isIpAddressString(hostArray[cnt].outboundip)){
					result = {
						result: 	false,
						message:	'POST request has outbound ip address which is not ignore ip address string: ' + JSON.stringify(hostArray[cnt].outboundip)
					};
					r3logger.elog(result.message);
					resutil.errResponse(req, res, 400, result);				// 400: Bad Request
					return;
				}
				host_info.outboundip = apiutil.getSafeString(hostArray[cnt].outboundip);
			}

			// push array
			if(null !== tg_host){
				hostnameArray.push(host_info);
			}else{	// null !== tg_ip
				ipArray.push(host_info);
			}
		}
		if(apiutil.isEmptyArray(hostnameArray)){
			hostnameArray = null;
		}
		if(apiutil.isEmptyArray(ipArray)){
			ipArray = null;
		}

		var	clear_hostname	= false;
		var	clear_ips		= false;
		if(apiutil.isSafeEntity(req.body.clear_hostname) && 'boolean' === typeof req.body.clear_hostname){
			clear_hostname = req.body.clear_hostname;
		}
		if(apiutil.isSafeEntity(req.body.clear_ips) && 'boolean' === typeof req.body.clear_ips){
			clear_ips = req.body.clear_ips;
		}

		//
		// Add hostnames and ips ---> Need User Token
		//
		result = k2hr3.updateRoleHosts(token_info.user, token_info.tenant, name, hostnameArray, clear_hostname, ipArray, clear_ips);

	}else{
		//
		// request from host(token)
		//

		// get ip address
		var	ip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(ip)){
			result = {
				result: 	false,
				message:	'Could not get ip address from request.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
			return;
		}

		// port
		port = 0;															// default any
		if(apiutil.isSafeEntity(req.body.host.port)){
			if(isNaN(req.body.host.port)){
				result = {
					result: 	false,
					message:	'POST request has port which is not number: ' + JSON.stringify(req.body.host.port)
				};

				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);					// 400: Bad Request
				return;
			}
			port = parseInt(req.body.host.port);
		}

		// cuk
		cuk = null;														// default any
		if(apiutil.isSafeString(req.body.host.cuk) && apiutil.isSafeString(req.body.host.cuk.trim())){
			cuk = apiutil.getSafeString(req.body.host.cuk).trim();
		}

		// extra
		extra = null;
		if(apiutil.isSafeString(req.body.host.extra)){
			extra = apiutil.getSafeString(req.body.host.extra);
			if(apiutil.checkSimpleJSON(extra)){
				extra	= JSON.parse(extra);
			}
		}

		// tag
		tag = null;
		if(apiutil.isSafeString(req.body.host.tag)){
			tag = apiutil.getSafeString(req.body.host.tag);
			if(apiutil.checkSimpleJSON(tag)){
				tag	= JSON.parse(tag);
			}
		}

		// inboundip(optional)
		var	inboundip = null;
		if(apiutil.isSafeString(req.body.host.inboundip)){
			if(!apiutil.isIpAddressString(req.body.host.inboundip)){
				result = {
					result: 	false,
					message:	'POST request has inbound ip address which is not ignore ip address string: ' + JSON.stringify(req.body.host.inboundip)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);				// 400: Bad Request
				return;
			}
			inboundip = apiutil.getSafeString(req.body.host.inboundip);
		}

		// outboundip(optional)
		var	outboundip = null;
		if(apiutil.isSafeString(req.body.host.outboundip)){
			if(!apiutil.isIpAddressString(req.body.host.outboundip)){
				result = {
					result: 	false,
					message:	'POST request has outbound ip address which is not ignore ip address string: ' + JSON.stringify(req.body.host.outboundip)
				};
				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);				// 400: Bad Request
				return;
			}
			outboundip = apiutil.getSafeString(req.body.host.outboundip);
		}

		//
		// Add ip address ---> Role Token or User Token
		//
		result = k2hr3.addHost(token_info.tenant, name, null, ip, port, cuk, extra, tag, inboundip, outboundip);
	}

	//------------------------------
	// check result
	//------------------------------
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from addHost'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from addHost';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(201);													// 201: Created
	res.send(JSON.stringify(result));
}

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
function putRoleHost(role, req, res, next)								// eslint-disable-line no-unused-vars
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
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check token
	//------------------------------
	var	token_result = r3token.checkToken(req, true);					// scoped, both token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		var	_status = token_result.status;
		delete token_result.status;
		resutil.errResponse(req, res, _status, token_result);
		return;
	}
	var	is_host_req	= !apiutil.isSafeString(req.query.host);
	var	token_info	= token_result.token_info;
	var	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// check arguments
	//------------------------------
	// role name check
	var	name		= apiutil.getSafeString(role);
	name			= name.toLowerCase();
	var	nameptn		= new RegExp('^' + keys.ROLE_TOP_KEY + ':(.*)');	// regex = /^yrn:yahoo:<service>::<tenant>:role:(.*)/
	var	namematchs	= name.match(nameptn);
	if(!apiutil.isEmptyArray(namematchs) && 2 <= namematchs.length){
		// name is full yrn, then reset only name.
		name = namematchs[1];
	}else{
		// role name is not full yrn, then check other yrn path
		nameptn	= new RegExp('^' + keys.NO_TENANT_KEY);					// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			result = {
				result: 	false,
				message:	'POST request url has wrong yrn full path to role'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	// hostname
	var	hostname= null;
	var	ip		= null;
	if(!is_host_req){
		if(!apiutil.isSafeString(req.query.host)){
			result = {
				result: 	false,
				message:	'host is not specified.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		var	tg_host = apiutil.getSafeString(req.query.host);
		if(apiutil.isIpAddressString(tg_host)){
			ip		= tg_host.toLowerCase();
		}else{
			hostname= tg_host.toLowerCase();
		}
	}else{
		// get ip address
		ip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(ip)){
			result = {
				result: 	false,
				message:	'Could not get ip address from request.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	// port
	var	port;
	if(apiutil.isSafeString(req.query.port)){
		if(isNaN(req.query.port)){
			result = {
				result: 	false,
				message:	'PUT request has port which is not number: ' + JSON.stringify(req.query.port)
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		port = parseInt(req.query.port);
	}else{
		port = 0;														// default any
	}

	// cuk
	var	cuk;
	if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
		cuk = apiutil.getSafeString(req.query.cuk).trim();
	}else{
		cuk = null;
	}

	// extra
	var	extra;
	if(apiutil.isSafeString(req.query.extra)){
		extra		= apiutil.getSafeString(req.query.extra);
		if(apiutil.checkSimpleJSON(extra)){
			extra	= JSON.parse(extra);								// extra encoded JSON
		}
	}else{
		extra		= null;
	}

	// tag
	var	tag;
	if(apiutil.isSafeString(req.query.tag)){
		tag		= apiutil.getSafeString(req.query.tag);
		if(apiutil.checkSimpleJSON(tag)){
			tag	= JSON.parse(tag);										// tag encoded JSON
		}
	}else{
		tag		= null;
	}

	// make base host information
	var	host_info = { ip: ip, hostname: hostname, port: port, cuk: cuk, extra: extra, tag: tag };

	// set inboundip(optional)
	var inboundip = null;
	if(apiutil.isSafeString(req.query.inboundip)){
		if(!apiutil.isIpAddressString(req.query.inboundip)){
			result = {
				result: 	false,
				message:	'PUT request has inbound ip address which is not ignore ip address string: ' + JSON.stringify(req.query.inboundip)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);				// 400: Bad Request
			return;
		}
		inboundip			= apiutil.getSafeString(req.query.inboundip);
		host_info.inboundip	= inboundip;
	}

	// set outboundip(optional)
	var outboundip = null;
	if(apiutil.isSafeString(req.query.outboundip)){
		if(!apiutil.isIpAddressString(req.query.outboundip)){
			result = {
				result: 	false,
				message:	'PUT request has outbound ip address which is not ignore ip address string: ' + JSON.stringify(req.query.outboundip)
			};
			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);				// 400: Bad Request
			return;
		}
		outboundip			= apiutil.getSafeString(req.query.outboundip);
		host_info.outboundip= outboundip;
	}

	//------------------------------
	// add host to role
	//------------------------------
	if(!is_host_req){
		// Add hostname ---> Need User Token
		if(null === ip){
			result = k2hr3.updateRoleHosts(token_info.user, token_info.tenant, name, host_info);
		}else{
			result = k2hr3.updateRoleHosts(token_info.user, token_info.tenant, name, null, false, host_info);
		}
	}else{
		// Add ip address ---> Role Token or User Token
		result = k2hr3.addHost(token_info.tenant, name, null, ip, port, cuk, extra, tag, inboundip, outboundip);
	}
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from addHost'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from addHost';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(201);													// 201: Created
	res.send(JSON.stringify(result));
}

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
	// check token for API mode
	//------------------------------
	var	token_str	= null;
	var	token_type	= null;
	var	token_info	= null;
	var	keys		= r3keys();
	if(r3token.hasAuthTokenHeader(req)){
		var	token_result = r3token.checkToken(req, true);				// scoped, both token
		if(!token_result.result){
			r3logger.elog(token_result.message);
			var	_status = token_result.status;
			delete token_result.status;
			resutil.errResponse(req, res, _status, token_result);
			return;
		}
		token_str	= token_result.token;
		token_type	= token_result.token_type;
		token_info	= token_result.token_info;
		keys		= r3keys(token_info.user, token_info.tenant);
	}

	//------------------------------
	// get role name
	//------------------------------
	// check get token type and parse role name
	var	is_get_token= false;
	var	is_get_list	= false;
	var	requestptn	= new RegExp(keys.MATCH_URI_GET_RTOKEN_LIST);		// regex = /^\/v1\/role\/token\/list\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(!apiutil.isEmptyArray(reqmatchs) && 2 <= reqmatchs.length && '' !== apiutil.getSafeString(reqmatchs[1])){
		// get list of tokens
		is_get_list	= true;
	}else{
		// recheck
		requestptn	= new RegExp(keys.MATCH_URI_GET_RTOKEN);			// regex = /^\/v1\/role\/token\/(.*)/
		reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
		if(!apiutil.isEmptyArray(reqmatchs) && 2 <= reqmatchs.length && '' !== apiutil.getSafeString(reqmatchs[1])){
			// get token
			is_get_token= true;
		}else{
			// retry parse role name
			requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);		// regex = /^\/v1\/role\/(.*)/
			reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
			if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
				result = {
					result: 	false,
					message:	'GET request url does not have role name'
				};

				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);				// 400: Bad Request
				return;
			}
		}
	}

	// check role name is only name or full yrn path
	var	name		= reqmatchs[1];
	name			= name.toLowerCase();
	var	nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);		// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	namematchs	= name.match(nameptn);
	if(apiutil.isEmptyArray(namematchs) || namematchs.length < 4){
		//
		// name is not full yrn to role, then check wrong role name
		//
		nameptn		= new RegExp('^' + keys.NO_TENANT_KEY);				// regex = /^yrn:yahoo:/
		if(name.match(nameptn)){
			result = {
				result: 	false,
				message:	'GET request query has wrong yrn full path to role'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
		// role name is not full yrn, we need tenant name
		if(!apiutil.isSafeEntity(keys.ROLE_TOP_KEY)){
			result = {
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
		if(null !== token_type && (!apiutil.isSafeEntity(token_info) || !apiutil.isSafeString(token_info.tenant) || !apiutil.compareCaseString(namematchs[2], token_info.tenant))){
			result = {
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
			result = {
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
		if('user' === apiutil.getSafeString(token_type)){
			getRole(name, token_info, req, res);
		}else{
			result = {
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
function getRole(role, token_info, req, res)
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.query) )
	{
		result = {
			result: 	false,
			message:	'GET request query is wrong'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}
	if(	!apiutil.isSafeString(role)				||
		!apiutil.isSafeEntity(token_info)		||
		!apiutil.isSafeString(token_info.user)	||
		!apiutil.isSafeString(token_info.tenant))
	{
		result = {
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
	var	keys = r3keys(token_info.user, token_info.tenant);

	// expand type
	var	is_expand = true;
	if(apiutil.isSafeString(req.query.expand)){
		if(apiutil.compareCaseString(keys.VALUE_TRUE, req.query.expand)){
			is_expand = true;
		}else if(apiutil.compareCaseString(keys.VALUE_FALSE, req.query.expand)){
			is_expand = false;
		}else{
			result = {
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
	result = k2hr3.getRole(role, is_expand);
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get response from getRole'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from getRole';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 404, result);						// 404: Not Found
		return;
	}
	r3logger.dlog('succeed : ' + result.message);
	res.status(200);													// 200: OK
	res.send(JSON.stringify(result));
}

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
function getRoleToken(role, token_info, token_type, token_str, req, res)
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(!apiutil.isSafeString(role)){
		result = {
			result: 	false,
			message:	'GET request is failure by internal error.'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);						// 500: Internal Error
		return;
	}

	//------------------------------
	// tenant/role name/client ip
	//------------------------------
	var	tenant;
	if(!apiutil.isSafeEntity(token_info) || !apiutil.isSafeString(token_info.tenant)){
		// parse role yrn path to tenant and role name
		var	keys		= r3keys();
		var	nameptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);	// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
		var	namematchs	= role.match(nameptn);
		if(apiutil.isEmptyArray(namematchs) || namematchs.length < 4){
			// role is not full yrn
			result = {
				result: 	false,
				message:	'GET request is failure by internal error(role yrn path is broken).'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 500, result);					// 500: Internal Error
			return;
		}
		tenant	= namematchs[2];
	}else{
		tenant	= token_info.tenant;
	}

	// client ip
	var	clientip = apiutil.getClientIpAddress(req);
	if(!apiutil.isSafeString(clientip)){
		result = {
			result: 	false,
			message:	'GET request does not have ip address for client.'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// get role token
	//------------------------------
	var	expire;
	if(!apiutil.isSafeString(token_type)){
		// no token

		// check port
		var	port;
		if(apiutil.isSafeString(req.query.port)){
			if(isNaN(req.query.port)){
				result = {
					result: 	false,
					message:	'GET request has port which is not number: ' + JSON.stringify(req.query.port)
				};

				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);					// 400: Bad Request
				return;
			}
			port = parseInt(req.query.port);
		}else{
			port = 0;														// default any
		}

		// check cuk parameter
		var	cuk;
		if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			cuk = apiutil.getSafeString(req.query.cuk).trim();
		}else{
			cuk = null;
		}

		result = r3token.getRoleTokenByIP(clientip, port, cuk, tenant, role, expire_rtoken);	// strict checking port/cuk

	}else if('role' === apiutil.getSafeString(token_type)){
		// role token
		if(!apiutil.compareRequestIpAddress(req, token_info.ip)){
			// wrong ip address in token
			result = {
				result: 	false,
				message:	'GET request ip address and role token are not same.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);						// 400: Bad Request
			return;
		}

		// set expire time as same as old token
		expire = apiutil.getExpireUnixtimeFromISOStrings(token_info.date, token_info.expire);
		if(0 >= expire){
			expire = expire_rtoken;
		}

		// using port/cuk from token inforamtion
		result = r3token.getRoleTokenByIP(clientip, token_info.port, token_info.cuk, tenant, role, expire);	// strict checking port/cuk

		// if succeed to get new role token, remove old token
		if(apiutil.isSafeEntity(result) && apiutil.isSafeEntity(result.result) && result.result){
			var	rm_result = r3token.removeRoleTokenByIP(token_str, clientip, token_info.port, token_info.cuk);
			if(!apiutil.isSafeEntity(rm_result) || !apiutil.isSafeEntity(rm_result.result) || false === rm_result.result){
				r3logger.wlog('could not remove old role token(' + token_str + '), but continue...');
			}
		}

	}else if('user' === apiutil.getSafeString(token_type)){
		// user token

		// expire
		if(apiutil.isSafeString(req.query.expire)){
			if(isNaN(req.query.expire)){
				result = {
					result: 	false,
					message:	'GET request has expire which is not number: ' + JSON.stringify(req.query.expire)
				};

				r3logger.elog(result.message);
				resutil.errResponse(req, res, 400, result);					// 400: Bad Request
				return;
			}
			expire = parseInt(req.query.expire);
			if(0 == expire){
				expire = expire_reg_rtoken;									// If 0 is specified, it means no expire
			}
		}else{
			expire = expire_rtoken;											// expire is 24H
		}

		result = r3token.getRoleTokenByUser(token_info.user, tenant, role, expire);

	}else{
		// broken token
		result = {
			result: 	false,
			message:	'GET request is failure by internal error(token data broken).'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);						// 500: Internal Error
		return;
	}

	// check result
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get role token.'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from get role token';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 404, result);						// 404: Not Found
		return;
	}

	// create url parameter(path) for registering role member
	//
	var	regparamobj = {
		role:	role,
		token:	result.token
	};
	var	udproc		= new r3userdata.userdataProcess;
	var	regparamstr	= udproc.encryptRoleInfo(regparamobj);
	if(!apiutil.isSafeString(regparamstr)){
		result = {
			result: 	false,
			message:	'Could not create register url parameter with role token.'
		};
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 404, result);						// 404: Not Found
		return;
	}else{
		result.registerpath = regparamstr;
	}

	r3logger.dlog('succeed : ' + result.message);
	res.status(200);													// 200: OK
	res.send(JSON.stringify(result));
}

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
function getListRoleTokens(role, token_info, req, res)
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	var	result;
	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.query) )
	{
		result = {
			result: 	false,
			message:	'GET request query is wrong'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 400, result);						// 400: Bad Request
		return;
	}

	//------------------------------
	// check arguments
	//------------------------------
	var	keys	= r3keys();
	var	expand	= true;
	if(apiutil.isSafeString(req.query.expand)){
		if(apiutil.compareCaseString(keys.VALUE_TRUE, req.query.expand)){
			expand = true;
		}else if(apiutil.compareCaseString(keys.VALUE_FALSE, req.query.expand)){
			expand = false;
		}else{
			result = {
				result: 	false,
				message:	'GET expand url argument parameter(' + JSON.stringify(req.query.expand) + ') is wrong, it must be ' + keys.VALUE_TRUE + ' or ' + keys.VALUE_FALSE + '.'
			};

			r3logger.elog(result.message);
			resutil.errResponse(req, res, 400, result);					// 400: Bad Request
			return;
		}
	}

	// check token
	if(	!apiutil.isSafeString(role)				||
		!apiutil.isSafeEntity(token_info)		||
		!apiutil.isSafeString(token_info.user)	||
		!apiutil.isSafeString(token_info.tenant))
	{
		result = {
			result: 	false,
			message:	'GET request is failure by internal error.'
		};

		r3logger.elog(result.message);
		resutil.errResponse(req, res, 500, result);						// 500: Internal Error
		return;
	}

	//------------------------------
	// get list of role tokens
	//------------------------------
	result = r3token.getListRoleTokens(role, token_info.tenant, expand);

	// check result
	if(!apiutil.isSafeEntity(result) || !apiutil.isSafeEntity(result.result) || false === result.result){
		if(!apiutil.isSafeEntity(result)){
			result = {
				result: 	false,
				message:	'Could not get role token list.'
			};
		}else{
			if(!apiutil.isSafeEntity(result.result)){
				result.result	= false;
			}
			if(!apiutil.isSafeEntity(result.message)){
				result.message	= 'Could not get error message in response from get role token list';
			}
		}
		r3logger.elog(result.message);
		resutil.errResponse(req, res, 404, result);						// 404: Not Found
		return;
	}

	// add register path into each role token elements
	if(expand){
		Object.keys(result.tokens).forEach(function(oneToken){
			var	regparamobj = {
				role:	role,
				token:	oneToken
			};
			var	udproc		= new r3userdata.userdataProcess;
			var	regparamstr	= udproc.encryptRoleInfo(regparamobj);
			if(!apiutil.isSafeString(regparamstr)){
				r3logger.elog('Could not create register url parameter with role token(' + JSON.stringify(oneToken) + '), but continue...');
				regparamstr	= null;
			}
			result.tokens[oneToken].registerpath = regparamstr;
		});
	}

	r3logger.dlog('succeed : ' + result.message);
	res.status(200);													// 200: OK
	res.send(JSON.stringify(result));
}

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
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return;
	}

	//------------------------------
	// check token for API mode
	//------------------------------
	var	token_str	= null;
	var	token_type	= null;
	var	token_info	= null;
	var	keys		= r3keys();
	if(r3token.hasAuthTokenHeader(req)){
		var	token_result = r3token.checkToken(req, true);				// scoped, both token
		if(!token_result.result){
			r3logger.elog(token_result.message);
			resutil.errResponse(req, res, token_result.status);
			return;
		}
		token_str	= token_result.token;
		token_type	= token_result.token_type;
		token_info	= token_result.token_info;
		keys		= r3keys(token_info.user, token_info.tenant);
	}

	//------------------------------
	// get role name
	//------------------------------
	// check get token type and parse role name
	var	requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);			// regex = /^\/v1\/role\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		r3logger.elog('HEAD request url does not have role name');
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return;
	}

	// check role name is only name or full yrn path and tenant name
	var	tenantname		= null;
	var	rolename		= null;
	var	roleyrn			= reqmatchs[1];
	roleyrn				= roleyrn.toLowerCase();
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);	// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	roleyrnmatchs	= roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(roleyrnmatchs) || roleyrnmatchs.length < 4){
		//
		// roleyrn is not full yrn to role, then check wrong role name
		//
		roleyrnptn		= new RegExp('^' + keys.NO_TENANT_KEY);			// regex = /^yrn:yahoo:/
		if(roleyrn.match(roleyrnptn)){
			r3logger.elog('HEAD request query has wrong yrn full path to role');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return;
		}
		// roleyrn is not full yrn, we need tenant name
		if(!apiutil.isSafeEntity(keys.ROLE_TOP_KEY)){
			r3logger.elog('HEAD request role name which is not full yrn, and not token. role name must be full yrn, if token is not specified.');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return;
		}
		// make full yrn for role, and set tenant name/role name.
		tenantname	= token_info.tenant;
		rolename	= roleyrn;
		roleyrn		= keys.ROLE_TOP_KEY + ':' + roleyrn;

	}else{
		//
		// roleyrn is full yrn to role.
		// need to check tenant name when token is specified.
		//
		if(null !== token_type && (!apiutil.isSafeEntity(token_info) || !apiutil.isSafeString(token_info.tenant) || !apiutil.compareCaseString(roleyrnmatchs[2], token_info.tenant))){
			r3logger.elog('HEAD request query has wrong tenant yrn full path(tenant=' + roleyrnmatchs[2] + ') or not specify tenant.');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return;
		}
		// set tenant name/role name.
		tenantname	= roleyrnmatchs[2];
		rolename	= roleyrnmatchs[3];
	}

	//------------------------------
	// Run
	//------------------------------
	var	result;
	if(null === token_type){
		// check host ip address in role
		var	clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			r3logger.elog('HEAD request does not have ip address for client.');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return;
		}
		// port
		var	tg_port	= 0;
		if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.port)){
			if(isNaN(req.query.port)){
				r3logger.elog('HEAD request has port which is not number: ' + JSON.stringify(req.query.port));
				resutil.errResponse(req, res, 400);						// 400: Bad Request
				return false;
			}
			tg_port	= parseInt(req.query.port);
		}
		// cuk
		var	tg_cuk	= null;
		if(apiutil.isSafeEntity(req.query) && apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			tg_cuk	= req.query.cuk.trim();
		}

		// find host
		result = k2hr3.findHost(tenantname, rolename, null, clientip, tg_port, tg_cuk, false);		// not strictly checking

		// result
		if(!result.result){
			r3logger.elog('HEAD request failure - check host ip(' + clientip + ') address in role(tenant=' + tenantname + ', role=' + rolename + ') host');
			resutil.errResponse(req, res, 403);							// 403: Forbidden
			return;
		}else{
			r3logger.dlog('HEAD request succeed - check host ip(' + clientip + ') address in role(tenant=' + tenantname + ', role=' + rolename + ') host');
			res.status(204);											// 204: No Content
		}

	}else if('role' === apiutil.getSafeString(token_type)){
		// check role token
		result = r3token.checkToken(req, true, false);					// recheck - scoped, both token

		// result
		if(!result.result){
			r3logger.elog(result.message);
			r3logger.elog('HEAD request failure - check role token(' + JSON.stringify(token_str) + ')');
			delete result.status;
			resutil.errResponse(req, res, 403);							// 403: Forbidden
			return;
		}else{
			r3logger.dlog('HEAD request succeed - check role token(' + JSON.stringify(token_str) + ')');
			delete result.status;
			res.status(204);											// 204: No Content
		}

	}else if('user' === apiutil.getSafeString(token_type)){
		// check role exist
		result = k2hr3.getRole(roleyrn, true);

		// result
		if(!result.result){
			r3logger.elog('HEAD request failure - check role(' + roleyrn + ') exist');
			resutil.errResponse(req, res, 403);							// 403: Forbidden
			return;
		}else{
			r3logger.dlog('HEAD request succeed - check role(' + roleyrn + ') exists');
			res.status(204);											// 204: No Content
		}

	}else{
		// broken token
		r3logger.elog('HEAD request is failure by internal error(token data broken).');
		resutil.errResponse(req, res, 500);								// 500: Internal Error
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
router.delete('/', function(req, res, next)								// eslint-disable-line no-unused-vars
{
	r3logger.dlog('CALL:', req.method, req.url);

	res.type('application/json; charset=utf-8');

	if(	!apiutil.isSafeEntity(req) ||
		!apiutil.isSafeEntity(req.baseUrl) )
	{
		r3logger.elog('DELETE request or url or query is wrong');
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return;
	}

	//
	// Check Path type and branch
	//
	var	keys			= r3keys();
	var	is_delete_token	= false;
	var	is_delete_ip	= false;
	var	urlpath			= decodeURI(req.baseUrl);
	var	requestptn		= new RegExp(keys.MATCH_URI_GET_RTOKEN);		// regex = /^\/v1\/role\/token\/(.*)/
	var	reqmatchs		= urlpath.match(requestptn);
	if(!apiutil.isEmptyArray(reqmatchs) && 2 <= reqmatchs.length && '' !== apiutil.getSafeString(reqmatchs[1])){
		// get token
		is_delete_token	= true;
	}else{
		// recheck simply
		if(urlpath == '/v1/role' || urlpath == '/v1/role/'){
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
function rawDeleteRoleByPath(req, res)
{
	//------------------------------
	// check token for API mode
	//------------------------------
	var	token_str	= null;
	var	token_type	= null;
	var	token_info	= null;
	var	keys		= r3keys();
	if(r3token.hasAuthTokenHeader(req)){
		var	token_result = r3token.checkToken(req, true);				// scoped, both token
		if(!token_result.result){
			r3logger.elog(token_result.message);
			resutil.errResponse(req, res, token_result.status);
			return false;
		}
		token_str	= token_result.token;
		token_type	= token_result.token_type;
		token_info	= token_result.token_info;
		keys		= r3keys(token_info.user, token_info.tenant);
	}

	//------------------------------
	// get role name
	//------------------------------
	// check get token type and parse role name
	var	requestptn	= new RegExp(keys.MATCH_URI_GET_ROLE_DATA);			// regex = /^\/v1\/role\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		r3logger.elog('HEAD request url does not have role name');
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return false;
	}

	// check role name is only name or full yrn path and tenant name
	var	tenantname		= null;
	var	rolename		= null;
	var	roleyrn			= reqmatchs[1];
	roleyrn				= roleyrn.toLowerCase();
	var	roleyrnptn		= new RegExp('^' + keys.MATCH_ANY_TENANT_ROLE);	// regex = /^yrn:yahoo:(.*)::(.*):role:(.*)/
	var	roleyrnmatchs	= roleyrn.match(roleyrnptn);
	if(apiutil.isEmptyArray(roleyrnmatchs) || roleyrnmatchs.length < 4){
		//
		// roleyrn is not full yrn to role, then check wrong role name
		//
		roleyrnptn		= new RegExp('^' + keys.NO_TENANT_KEY);			// regex = /^yrn:yahoo:/
		if(roleyrn.match(roleyrnptn)){
			r3logger.elog('HEAD request query has wrong yrn full path to role');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return false;
		}
		// roleyrn is not full yrn, we need tenant name
		if(!apiutil.isSafeEntity(keys.ROLE_TOP_KEY)){
			r3logger.elog('HEAD request role name which is not full yrn, and not token. role name must be full yrn, if token is not specified.');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return false;
		}
		// make full yrn for role, and set tenant name/role name.
		tenantname	= token_info.tenant;
		rolename	= roleyrn;
		roleyrn		= keys.ROLE_TOP_KEY + ':' + roleyrn;

	}else{
		//
		// roleyrn is full yrn to role.
		// need to check tenant name when token is specified.
		//
		if(null !== token_type && (!apiutil.isSafeEntity(token_info) || !apiutil.isSafeString(token_info.tenant) || !apiutil.compareCaseString(roleyrnmatchs[2], token_info.tenant))){
			r3logger.elog('HEAD request query has wrong tenant yrn full path(tenant=' + roleyrnmatchs[2] + ') or not specify tenant.');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return false;
		}
		// set tenant name/role name.
		tenantname	= roleyrnmatchs[2];
		rolename	= roleyrnmatchs[3];
	}

	//------------------------------
	// Run
	//------------------------------
	var	clientip;
	var	port;
	var	cuk;
	var	result;
	if(null === token_type){
		// remove host ip address in role
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			r3logger.elog('DELETE request does not have ip address for client.');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return false;
		}

		// check port
		if(apiutil.isSafeString(req.query.port)){
			if(isNaN(req.query.port)){
				r3logger.elog('DELETE request has port which is not number: ' + JSON.stringify(req.query.port));
				resutil.errResponse(req, res, 400);						// 400: Bad Request
				return;
			}
			port = parseInt(req.query.port);
		}else{
			port = 0;													// default any
		}

		// check cuk parameter
		if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
			cuk = apiutil.getSafeString(req.query.cuk).trim();
		}else{
			cuk = null;
		}

		// remove host(check requester and requester is target)
		result = k2hr3.removeHost(tenantname, rolename, clientip, port, cuk, clientip, port, cuk);

		// result
		if(!result.result){
			r3logger.elog('DELETE request failure - remove host by ip(' + clientip + ':' + String(port) + ') address, cuk(' + JSON.stringify(cuk) + ') in role(tenant=' + tenantname + ', role=' + rolename + ') host');
			resutil.errResponse(req, res, 403);							// 403: Forbidden
			return false;
		}else{
			r3logger.dlog('DELETE request succeed - remove host by ip(' + clientip + ':' + String(port) + ') address, cuk(' + JSON.stringify(cuk) + ') in role(tenant=' + tenantname + ', role=' + rolename + ') host');
			res.status(204);											// 204: No Content
		}

	}else if('role' === apiutil.getSafeString(token_type)){
		// remove role token
		clientip = apiutil.getClientIpAddress(req);
		if(!apiutil.isSafeString(clientip)){
			r3logger.elog('DELETE request does not have ip address for client.');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return false;
		}

		// check full role yrn path in token and path
		if(token_info.role != roleyrn){
			r3logger.elog('DELETE request is something wrong, the role token(' + JSON.stringify(token_info.role) + ') and role path(' + JSON.stringify(roleyrn) + ') do not match.');
			resutil.errResponse(req, res, 400);							// 400: Bad Request
			return false;
		}

		// check for k8s cuk/port
		if(token_info.extra == keys.VALUE_K8S_V1){
			// cuk
			if(!apiutil.isSafeString(req.query.cuk) || !apiutil.isSafeString(req.query.cuk.trim())){
				r3logger.elog('DELETE request need cuk parameter for deleting role token which is made for k8s.');
				resutil.errResponse(req, res, 400);						// 400: Bad Request
				return false;
			}
			cuk = apiutil.getSafeString(req.query.cuk).trim();

			if(token_info.cuk != cuk){
				r3logger.elog('DELETE request cuk(' + JSON.string(cuk) + ') parameter is invalid.');
				resutil.errResponse(req, res, 400);						// 400: Bad Request
				return false;
			}

			// port
			if(apiutil.isSafeString(req.query.port)){
				if(isNaN(req.query.port)){
					r3logger.elog('DELETE request has port which is not number: ' + JSON.stringify(req.query.port));
					resutil.errResponse(req, res, 400);					// 400: Bad Request
					return;
				}
				port = parseInt(req.query.port);
			}else{
				port = 0;												// default any
			}
			if(token_info.port != port){
				r3logger.elog('DELETE request port(' + JSON.stringify(port) + ') parameter is invalid.');
				resutil.errResponse(req, res, 400);						// 400: Bad Request
				return false;
			}
		}

		// remove role token
		result = r3token.removeRoleTokenByIP(token_str, clientip, token_info.port, token_info.cuk);

		// result
		if(!result.result){
			r3logger.elog('DELETE request failure - remove role token(' + JSON.stringify(token_str) + ')');
			resutil.errResponse(req, res, 403);							// 403: Forbidden
			return false;
		}else{
			r3logger.dlog('DELETE request succeed - remove role token(' + JSON.stringify(token_str) + ')');
			res.status(204);											// 204: No Content
		}

	}else if('user' === apiutil.getSafeString(token_type)){
		if(apiutil.isSafeString(req.query.host)){
			// remove host(hostname or ip address) in role
			var	tg_host	= apiutil.getSafeString(req.query.host);
			var	tmp_host= apiutil.parseJSON(req.query.host);
			if(!apiutil.isEmptyArray(tmp_host)){
				tg_host	= tmp_host;
			}

			// check port
			if(apiutil.isSafeString(req.query.port)){
				if(isNaN(req.query.port)){
					r3logger.elog('GET request has port which is not number: ' + JSON.stringify(req.query.port));
					resutil.errResponse(req, res, 400);						// 400: Bad Request
					return;
				}
				port = parseInt(req.query.port);
			}else{
				port = 0;													// default any
			}

			// check cuk parameter
			if(apiutil.isSafeString(req.query.cuk) && apiutil.isSafeString(req.query.cuk.trim())){
				cuk = apiutil.getSafeString(req.query.cuk).trim();
			}else{
				cuk = null;
			}

			// remove host(not check requester)
			result = k2hr3.removeHost(tenantname, rolename, tg_host, port, cuk);

			// result
			if(!result.result){
				r3logger.elog('DELETE request failure - remove host(' + apiutil.getSafeString(tg_host) + ':' + String(port) + ') address, cuk(' + JSON.stringify(cuk) + ') in role(tenant=' + tenantname + ', role=' + rolename + ') host');
				resutil.errResponse(req, res, 403);						// 403: Forbidden
				return false;
			}else{
				r3logger.dlog('DELETE request succeed - remove host(' + apiutil.getSafeString(tg_host) + ':' + String(port) + ') address, cuk(' + JSON.stringify(cuk) + ') in role(tenant=' + tenantname + ', role=' + rolename + ') host');
				res.status(204);										// 204: No Content
			}
		}else{
			// remove role
			result = k2hr3.removeRole(token_info.user, tenantname, rolename);

			// result
			if(!result.result){
				r3logger.elog('DELETE request failure - remove role(' + rolename + ') exist');
				resutil.errResponse(req, res, 403);						// 403: Forbidden
				return false;
			}else{
				r3logger.dlog('DELETE request succeed - remove role(' + rolename + ') exists');
				res.status(204);										// 204: No Content
			}
		}

	}else{
		// broken token
		r3logger.elog('DELETE request is failure by internal error(token data broken).');
		resutil.errResponse(req, res, 500);								// 500: Internal Error
		return false;
	}
	return true;
}

//
// Utility for deleting ip address by cuk
//
function rawDeleteIpsByCuk(req, res)
{
	var	keys = r3keys();

	var	clientip = apiutil.getClientIpAddress(req);
	if(!apiutil.isSafeString(clientip)){
		r3logger.elog('DELETE request does not have ip address for client');
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return false;
	}

	//------------------------------
	// check arguments
	//------------------------------
	if(!apiutil.isSafeEntity(req.query)){
		r3logger.elog('DELETE request has no query parameter');
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return false;
	}
	var	tg_host	= null;
	if(apiutil.isSafeEntity(req.query.host)){
		var	tmp_host = req.query.host.trim();
		if(apiutil.checkSimpleJSON(tmp_host)){
			tmp_host = JSON.parse(tmp_host);
		}
		if(apiutil.isSafeString(tmp_host) && apiutil.isSafeString(tmp_host.trim())){
			tg_host	= new Array();
			tg_host.push(tmp_host.trim());
		}else if(!apiutil.isEmptyArray(tmp_host)){
			tg_host	= tmp_host.slice(0, tmp_host.length);
		}else{
			r3logger.dlog('DELETE request has no host parameter, it means removing all host in cuk: ' + JSON.stringify(req.query.cuk));
		}
	}

	// cuk parameter
	if(!apiutil.isSafeString(req.query.cuk) || !apiutil.isSafeString(req.query.cuk.trim())){
		r3logger.elog('DELETE request has invalid cuk parameter: ' + JSON.stringify(req.query.cuk));
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return false;
	}
	var	tg_cuk	= req.query.cuk.trim();

	var	tg_extra= k2hr3.getExtraFromCuk(tg_cuk);
	var	adminips;

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
			adminips = k2hr3.findRoleHost(null, delhost_role_yrn, null, clientip, 0, null, null, false);	// not strict checking for admin delhost host
			if(!apiutil.isSafeEntity(adminips)){
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
		adminips = k2hr3.findRoleHost(null, delhost_role_yrn, null, clientip, 0, null, null, false);		// not strict checking for admin delhost host
		if(!apiutil.isSafeEntity(adminips)){
			r3logger.elog('DELETE request from ip address(' + JSON.stringify(clientip) + ') is not role(' + JSON.stringify(delhost_role_yrn) + ') member.');
			resutil.errResponse(req, res, 400);						// 400: Bad Request
			return false;
		}
	}else{
		// Currently supports only openstack and kubernetes
		r3logger.elog('DELETE request has unknown extra type in cuk parameter: ' + JSON.stringify(req.query.cuk));
		resutil.errResponse(req, res, 400);							// 400: Bad Request
		return false;
	}

	//------------------------------
	// Run
	//------------------------------
	var	resobj = k2hr3.removeIpsByCuk(tg_cuk, tg_host, true);
	if(!apiutil.isSafeEntity(resobj) || !apiutil.isSafeEntity(resobj.result) || false === resobj.result){
		var	message = null;
		if(apiutil.isSafeEntity(resobj) && apiutil.isSafeEntity(resobj.message)){
			message = 'DELETE request failed by ' + resobj.message;
		}else{
			message = 'DELETE request failed by unknown reason.';
		}
		r3logger.elog(message);
		resutil.errResponse(req, res, 403);								// 403: Forbidden(is this status OK?)
		return false;
	}
	r3logger.dlog('succeed : ' + resobj.message);
	res.status(204);													// 204: No Content

	return true;
}

//
// Utility for deleting role token
//
function rawDeleteRoleToken(req, res)
{
	//------------------------------
	// check token
	//------------------------------
	if(!r3token.hasAuthTokenHeader(req)){
		r3logger.elog('DELETE request does not have any auth token.');
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return false;
	}
	var	token_result = r3token.checkToken(req, true, true);				// scoped, user token
	if(!token_result.result){
		r3logger.elog(token_result.message);
		resutil.errResponse(req, res, token_result.status);
		return false;
	}
	var	token_info	= token_result.token_info;
	var	keys		= r3keys(token_info.user, token_info.tenant);

	//------------------------------
	// get role token from uri
	//------------------------------
	// check get token type and parse role name
	var	requestptn	= new RegExp(keys.MATCH_URI_GET_RTOKEN);			// regex = /^\/v1\/role\/token\/(.*)/
	var	reqmatchs	= decodeURI(req.baseUrl).match(requestptn);
	if(apiutil.isEmptyArray(reqmatchs) || reqmatchs.length < 2 || '' === apiutil.getSafeString(reqmatchs[1])){
		r3logger.elog('DELETE request url does not have token string nor yrn path');
		resutil.errResponse(req, res, 400);								// 400: Bad Request
		return false;
	}
	var	token_string	= apiutil.getSafeString(reqmatchs[1]);

	//------------------------------
	// Run
	//------------------------------
	if(!r3token.removeRoleTokenByPath(token_string, token_info.tenant)){
		r3logger.elog('failed to remove role token.');
		r3logger.elog('DELETE request failure - remove role token(' + token_string + ')');
		resutil.errResponse(req, res, 403);								// 403: Forbidden
		return false;
	}else{
		r3logger.dlog('DELETE request succeed - remove role token(' + token_string + ')');
		res.status(204);												// 204: No Content
	}

	return true;
}

module.exports = router;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
