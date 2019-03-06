/*
 * K2HR3 REST API
 *
 * Copyright 2017 Yahoo! Japan Corporation.
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

var	http		= require('http');
var	https		= require('https');

var	cacerts		= require('../lib/cacerts');
var	apiutil		= require('./k2hr3apiutil');
var	osksep		= require('./openstackep');				// OpenStack KeyStone EndPoint(=osksep)

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Get Unscoped token by user name and passwd from Openstack identity v3 API
//
// Document:	 https://developer.openstack.org/api-ref/identity/v3/?expanded=password-authentication-with-unscoped-authorization-detail
//
// Request:		{
//					"auth": {
//						"identity": {
//							"password": {
//								"user": {
//									"domain": {
//										"id": "default"
//									},
//									"password":	"*********",
//									"name":		"*********"
//								}
//							},
//							"methods": ["password"]
//						}
//					}
//				}
//
// Response:
//		Header	"X-Subject-Token: 16e4638398574f1d9364............"			(*1)
//		Body	{
//					"token": {
//						"audit_ids": [
//							"################....."
//						],
//						"expires_at": "2017-06-17T00:20:38.863072Z",		(*2)
//						"extras": {},
//						"issued_at": "2017-06-16T00:20:38.863143Z",
//						"methods": [
//							"password"
//						],
//						"user": {
//							"domain": {
//								"id": "default",
//								"name": "Default"
//							},
//							"id":	"*****************************...",		(*4)
//							"name":	"user name"								(*3)
//						}
//					}
//				}
//
// callback(error, result):
//				result = {
//					user:	user name										(*3)
//					userid:	user id											(*4)
//					scoped:	false											(always false)
//					token:	token string(id)								(*1)
//					expire:	expire string									(*2)
//					region:	region string									(region name for keystone endpoint)
//				}
//
function rawGetUserUnscopedTokenV3(uname, passwd, callback)
{
	if(!apiutil.isSafeStrings(uname, passwd)){
		var	error = new Error('some parameters are wrong : uname=' + JSON.stringify(uname) + ', passwd=<not printed>');
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	var	_uname		= uname;
	var	_passwd		= passwd;
	var	_callback	= callback;

	// get end points for keystone
	osksep.getKeystoneEndpoint(function(err, keystone_ep)
	{
		if(null !== err){
			var	error = new Error('could not get keystone end point by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	body	= {	'auth': {
							'identity': {
									'password': {
										'user': {
											'domain': {
												'id': 'default'
											},
											'password':	_passwd,
											'name':		_uname
										}
									},
									'methods': ['password']
								}
							}
						};
		var	strbody	= JSON.stringify(body);
		var	headers	= {
						'Content-Type':		'application/json',
						'Content-Length':	strbody.length
					  };
		var	options	= {	'host':				keystone_ep.hostname,
						'port':				keystone_ep.port,
						'path': 			keystone_ep.pathname + '/v3/auth/tokens',
						'method':			'POST',
						'headers':			headers
					  };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		var	httpobj;
		if(apiutil.compareCaseString('https:', keystone_ep.protocol)){
			if(null !== cacerts.ca){
				options.ca = cacerts.ca;
			}
			options.agent	= new https.Agent(options);
			httpobj			= https;
		}else{
			options.agent	= new http.Agent(options);
			httpobj			= http;
		}

		// send request
		var	req = httpobj.request(options, function(res)
		{
			var	body	= '';
			var	status	= res.statusCode;
			var	headers	= res.headers;
			var	error;

			r3logger.dlog('response status: ' + res.statusCode);
			r3logger.dlog('response header: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');

			res.on('data', function(chunk)
			{
				//r3logger.dlog('response chunk: ' + chunk);
				body += chunk;
			});

			res.on('end', function(result)								// eslint-disable-line no-unused-vars
			{
				if(300 <= status){
					error = new Error('could not get unscoped token by status=' + String(status));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				if(!apiutil.isSafeEntity(headers) || !apiutil.isSafeString(headers['x-subject-token'])){
					error = new Error('could not find unscoped token in header(X-Subject-Token)');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				//r3logger.dlog('response body: ' + body);

				var	res_body = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isSafeEntity(res_body)						||
					!apiutil.isSafeEntity(res_body.token)				||
					!apiutil.isSafeString(res_body.token.expires_at)	||
					!apiutil.isSafeEntity(res_body.token.user)			||
					!apiutil.isSafeString(res_body.token.user.id)		||
					!apiutil.isSafeString(res_body.token.user.name)		||
					!apiutil.compareCaseString(res_body.token.user.name, _uname))
				{
					error = new Error('could not get unscoped token by something wrong response body : ' + body);
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// build result
				var	resobj		= {};
				resobj.user		= res_body.token.user.name.toLowerCase();
				resobj.userid	= res_body.token.user.id.toLowerCase();
				resobj.scoped	= false;
				resobj.token	= headers['x-subject-token'];
				resobj.expire	= res_body.token.expires_at;
				resobj.region	= keystone_ep.region.toLowerCase();
				_callback(null, resobj);
			});
		});
		req.on('error', function(exception) {
			r3logger.elog('problem with request: ' + exception.message);
			_callback(exception);
			return;
		});

		// write data to request body
		req.write(strbody);
		req.end();
	}, true);
}

//
// Get Scoped token by unscoped token and tenant name from Openstack identity v3 API
//
// Document:	 https://developer.openstack.org/api-ref/identity/v3/?expanded=token-authentication-with-scoped-authorization-detail
//
// Request:		{
//					"auth": {
//						"identity": {
//							"methods": [
//								"token"
//							],
//							"token": {
//								"id": "<unscoped token>"
//							}
//						},
//						"scope": {
//							"project": {
//								"id": "<project(tenant) id>"
//							}
//						}
//					}
//				}
//
// Response:
//		Header	"X-Subject-Token: 16e4638398574f1d9364............"				(*1)
//		Body	{
//					"token": {
//						"audit_ids": [
//							"######################",
//							"######################"
//						],
//						"catalog": [
//							{
//								"endpoints": [
//									{
//										"id":			"*****************************...",
//										"interface":	"public"				(=public, others are admin/internal),
//										"region":		"***************",		(*5)
//										"region_id":	###############
//										"url":			"http://keystone/v2.0"
//									},
//									...
//								],
//								"id":	"*****************************...",
//								"name":	"keystone",
//								"type":	"identity"								(=identity)
//							},
//							...
//						],
//						"expires_at":	"2017-06-17T00:46:16.923305Z",			(*2)
//						"extras":		{},
//						"issued_at":	"2017-06-16T01:07:56.325351Z",
//						"methods": [
//							"token",
//							"password"
//						],
//						"project": {
//							"domain": {
//								"id":	"default",
//								"name":	"Default"
//							},
//							"id":		"*****************************...",		(=project id)
//							"name":		"project name"							(*5: project(tenant) name)
//						},
//						"roles": [
//							{
//								"id":	"*****************************...",
//								"name":	"_member_"
//							}
//						],
//						"user": {
//							"domain": {
//								"id":	"default",
//								"name":	"Default"
//							},
//							"id":		"*****************************...",		(*4: user id)
//							"name":		"user name"								(*3: user name)
//						}
//					}
//				}
//
// callback(error, result):
//				result = {
//					user:	user name										(*3)
//					userid:	user id											(*4)
//					scoped:	true											(always true)
//					token:	token string(id)								(*1)
//					expire:	expire string									(*2)
//					region:	region string									(identity's *5 for region name)
//				}
//
function rawGetUserScopedTokenV3(unscopedtoken, tenantid, callback)
{
	var	error;
	if(!apiutil.isSafeString(unscopedtoken)){
		error = new Error('parameter is wrong : unscopedtoken=' + JSON.stringify(unscopedtoken));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	if(!apiutil.isSafeString(tenantid) && isNaN(tenantid)){
		// id allows hex character string, decimal character string, decimal number value.
		//
		error = new Error('parameter is wrong : tenantid=' + JSON.stringify(tenantid));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	if(!apiutil.isSafeString(tenantid)){
		// to string
		tenantid = String(tenantid);
	}
	var	_unscopedtoken	= unscopedtoken;
	var	_tenantid		= tenantid;
	var	_callback		= callback;

	// get end points for keystone
	osksep.getKeystoneEndpoint(function(err, keystone_ep)
	{
		var	error;
		if(null !== err){
			error = new Error('could not get keystone end point by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	body	= {	'auth': {
							'identity': {
								'methods': [
									'token'
								],
								'token': {
									'id': _unscopedtoken
								}
							},
							'scope': {
								'project': {
									'id': _tenantid
								}
							}
						}
					};
		var	strbody	= JSON.stringify(body);
		var	headers	= {
						'Content-Type':		'application/json',
						'Content-Length':	strbody.length
					  };
		var	options	= {	'host':				keystone_ep.hostname,
						'port':				keystone_ep.port,
						'path': 			keystone_ep.pathname + '/v3/auth/tokens',
						'method':			'POST',
						'headers':			headers
					  };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		var	httpobj;
		if(apiutil.compareCaseString('https:', keystone_ep.protocol)){
			if(null !== cacerts.ca){
				options.ca = cacerts.ca;
			}
			options.agent	= new https.Agent(options);
			httpobj			= https;
		}else{
			options.agent	= new http.Agent(options);
			httpobj			= http;
		}

		// send request
		var	req = httpobj.request(options, function(res)
		{
			var	body	= '';
			var	status	= res.statusCode;
			var	headers	= res.headers;

			r3logger.dlog('response status: ' + res.statusCode);
			r3logger.dlog('response header: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');

			res.on('data', function(chunk)
			{
				//r3logger.dlog('response chunk: ' + chunk);
				body += chunk;
			});

			res.on('end', function(result)									// eslint-disable-line no-unused-vars
			{
				if(300 <= status){
					error = new Error('could not get scoped token by status=' + String(status));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				if(!apiutil.isSafeEntity(headers) || !apiutil.isSafeString(headers['x-subject-token'])){
					error = new Error('could not find unscoped token in header(X-Subject-Token)');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				//r3logger.dlog('response body: ' + body);

				var	res_body = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isSafeEntity(res_body)							||
					!apiutil.isSafeEntity(res_body.token)					||
					apiutil.isEmptyArray(res_body.token.catalog)			||
					!apiutil.isSafeEntity(res_body.token.expires_at)		||
					!apiutil.isSafeEntity(res_body.token.project)			||
					!apiutil.isSafeString(res_body.token.project.id)		||
					!apiutil.compareCaseString(res_body.token.project.id, _tenantid)	||
					!apiutil.isSafeString(res_body.token.project.name)		||
					!apiutil.isSafeEntity(res_body.token.user)				||
					!apiutil.isSafeString(res_body.token.user.id)			||
					!apiutil.isSafeString(res_body.token.user.name)			)
				{
					error = new Error('could not get scoped token by something wrong response body : ' + body);
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// check & get region
				var	region = null;
				for(var cnt = 0; cnt < res_body.token.catalog.length && null === region; ++cnt){
					if(	!apiutil.isSafeEntity(res_body.token.catalog[cnt])			||
						apiutil.isEmptyArray(res_body.token.catalog[cnt].endpoints)	||
						!apiutil.isSafeString(res_body.token.catalog[cnt].type)		)
					{
						r3logger.wlog('one of response for scoped token is something wrong : ' + JSON.stringify(res_body.token.catalog[cnt]));
						continue;
					}

					// target region by type=identity
					if(!apiutil.compareCaseString('identity', res_body.token.catalog[cnt].type)){
						continue;
					}

					// check region
					for(var cnt2 = 0; cnt2 < res_body.token.catalog[cnt].endpoints.length; ++cnt2){
						if(	apiutil.isSafeEntity(res_body.token.catalog[cnt].endpoints[cnt2])							&&
							apiutil.isSafeString(res_body.token.catalog[cnt].endpoints[cnt2].interface)					&&
							apiutil.compareCaseString('public', res_body.token.catalog[cnt].endpoints[cnt2].interface)	&&
							apiutil.isSafeString(res_body.token.catalog[cnt].endpoints[cnt2].region)					)
						{
							if(apiutil.compareCaseString(res_body.token.catalog[cnt].endpoints[cnt2].region, keystone_ep.region)){
								// found
								region = res_body.token.catalog[cnt].endpoints[cnt2].region;
								break;
							}else{
								r3logger.wlog('unknown region(' + res_body.token.catalog[cnt].endpoints[cnt2].region + '), we need to find region(' + keystone_ep.region + '), so skip this');
							}
						}else{
							r3logger.dlog('one of response endpoint for scoped token is not target or something wrong : ' + JSON.stringify(res_body.token.catalog[cnt].endpoints[cnt2]));
						}
					}
				}
				if(null === region){
					error = new Error('could not find request region in result.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// build result
				var	resobj		= {};
				resobj.user		= res_body.token.user.name.toLowerCase();
				resobj.userid	= res_body.token.user.id.toLowerCase();
				resobj.scoped	= true;
				resobj.token	= headers['x-subject-token'];
				resobj.expire	= res_body.token.expires_at;
				resobj.region	= region.toLowerCase();
				_callback(null, resobj);
			});
		});
		req.on('error', function(exception) {
			r3logger.elog('problem with request: ' + exception.message);
			_callback(exception);
			return;
		});

		// write data to request body
		req.write(strbody);
		req.end();
	}, true);
}

//
// Get tenant list by unscoped token from Openstack identity v3 API
//
// Document:	https://developer.openstack.org/api-ref/identity/v3/?expanded=list-projects-detail
//
// Request:		X-Auth-Token: <unscoped token>
//				https://keystone/v3/users/<user id>/projects
//
// Response:	{
//					"links": {
//						"next":				null,
//						"previous":			null,
//						"self":				"https://keystone/v3/users/<user id>/projects"
//					},
//					"projects": [
//						{
//							"description":	null,											(*1)
//							"domain_id":	"default",
//							"enabled":		true,
//							"id":			"<project id>",									(*2)
//							"is_domain":	false,
//							"links": {
//								"self":		"https://keystone/v3/projects/<project id>"
//							},
//							"name":			"******",										(*3)
//							"parent_id":	null
//						},
//						...
//					]
//				}
//
// callback(error, result):
//				result = [
//					{
//						name:			project(tenant) name								(*3)
//						id:				project(tenant) id									(*2)
//						description:	project(tenant) description							(*1)
//						display:		display name										(*3)
//					},
//					...
//				]
// 
// [TODO]
// Should not we use "tenant id" instead of "tenant name" for "name"?
// We need this consideration.
// 
function rawGetUserTenantListV3(unscopedtoken, userid, callback)
{
	if(!apiutil.isSafeStrings(unscopedtoken, userid)){
		var	error = new Error('parameter is wrong : unscopedtoken=' + JSON.stringify(unscopedtoken) + ', userid=' + JSON.stringify(userid));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	var	_unscopedtoken	= unscopedtoken;
	var	_userid			= userid;
	var	_callback		= callback;

	// get end points for keystone
	osksep.getKeystoneEndpoint(function(err, keystone_ep)
	{
		var	error;
		if(null !== err){
			error = new Error('could not get keystone end point by ' + err.message);
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	headers		= {
							'Content-Type':		'application/json',
							'X-Auth-Token':		_unscopedtoken,
							'Content-Length':	0
						  };
		var	options		= {	'host':				keystone_ep.hostname,
							'port':				keystone_ep.port,
							'path': 			keystone_ep.pathname + '/v3/users/' + _userid + '/projects',
							'method':			'GET',
							'headers':			headers
						  };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		var	httpobj;
		if(apiutil.compareCaseString('https:', keystone_ep.protocol)){
			if(null !== cacerts.ca){
				options.ca = cacerts.ca;
			}
			options.agent	= new https.Agent(options);
			httpobj			= https;
		}else{
			options.agent	= new http.Agent(options);
			httpobj			= http;
		}

		// send request
		var	req = httpobj.get(options, function(res)
		{
			var	body	= '';
			var	status	= res.statusCode;

			r3logger.dlog('response status: ' + res.statusCode);
			r3logger.dlog('response header: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');

			res.on('data', function(chunk)
			{
				//r3logger.dlog('response chunk: ' + chunk);
				body += chunk;
			});

			res.on('end', function(result)									// eslint-disable-line no-unused-vars
			{
				if(300 <= status){
					error = new Error('could not get scoped token by status=' + String(status));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				//r3logger.dlog('response body: ' + body);

				var	res_body = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isSafeEntity(res_body)			||
					apiutil.isEmptyArray(res_body.projects)	)
				{
					error = new Error('failed to get project(tenant) list by unscoped token.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert result array
				var	resobj = new Array(0);
				for(var cnt = 0; cnt < res_body.projects.length; ++cnt){
					if(	!apiutil.isSafeEntity(res_body.projects[cnt])		||
						!apiutil.isSafeString(res_body.projects[cnt].id)	||
						!apiutil.isSafeString(res_body.projects[cnt].name)	)
					{
						r3logger.wlog('one of response for project(tenant) list is something wrong : ' + JSON.stringify(res_body.projects[cnt]));
						continue;
					}
					var	tenant			= {};
					tenant.name			= res_body.projects[cnt].name.toLowerCase();
					tenant.id			= res_body.projects[cnt].id.toLowerCase();
					tenant.description	= apiutil.getSafeString(res_body.projects[cnt].description);
					tenant.display		= res_body.projects[cnt].name;
					resobj.push(tenant);
				}
				if(0 === resobj.length){
					error = new Error('could not get any projects(tenant) list by unscoped token.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				_callback(null, resobj);
			});
		});

		req.on('error', function(exception) {
			r3logger.elog('problem with request: ' + exception.message);
			callback(exception);
			return;
		});
	}, true);
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.getUserUnscopedToken = function(uname, passwd, callback)
{
	return rawGetUserUnscopedTokenV3(uname, passwd, callback);
};

//
// tenantname	: not used
// tenantid		: for keystone v3 api
//
exports.getUserScopedToken = function(unscopedtoken, tenantname, tenantid, callback)
{
	return rawGetUserScopedTokenV3(unscopedtoken, tenantid, callback);
};

//
// Verify token
//
// [NOTE]
// The token is created by openstack(keystone), then we do not need to verify.
// And this function will not be called on token by keystone, because this case
// does not have token seed data.
//
exports.verifyUserToken = function(user, tenant, token, token_seed)				// eslint-disable-line no-unused-vars
{
	r3logger.wlog('Why is this verify token function called...');
	return true;
};

//
// userid		: for keystone v3 api
//
exports.getUserTenantList = function(unscopedtoken, userid, callback)
{
	return rawGetUserTenantListV3(unscopedtoken, userid, callback);
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
