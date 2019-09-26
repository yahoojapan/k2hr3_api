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
// Get Unscoped token by user name and passwd from Openstack identity v2 API
//
// Document:	 https://developer.openstack.org/api-ref/identity/v2/?expanded=authenticate-detail
//
// Request:		{
//					"auth": {
//						"tenantName": "",
//						"passwordCredentials": {
//							"username": "user",
//							"password": "passphrase"
//						}
//					}
//				}
//
// Response:	{
//					"access": {
//						"metadata": {
//							"is_admin": 0,
//							"roles": []
//						},
//						"serviceCatalog": [],
//						"token": {
//							"audit_ids": [
//								"######################"
//							],
//							"expires": "2017-06-16T07:12:01Z",				(*2)
//							"id": "*************************......",		(*1)
//							"issued_at": "2017-06-15T07:12:01.822673"
//						},
//						"user": {
//							"id": "************************.....",			(*4)
//							"name": "name",									(*3)
//							"roles": [],
//							"roles_links": [],
//							"username": "user"
//						}
//					}
//				}
//
// callback(error, result):
//				result = {
//					user:		user name									(*3)
//					userid:		user id										(*4)
//					scoped:		false										(always false)
//					token:		token string(id)							(*1)
//					expire:		expire string								(*2)
//					region:		region string								(region name for keystone endpoint)
//					token_seed:	seed										({publisher: 'OPENSTACKV2'})
//				}
//
function rawGetUserUnscopedTokenV2(uname, passwd, callback)
{
	if(!apiutil.isSafeString(uname)){
		var	error = new Error('some parameters are wrong : uname=' + JSON.stringify(uname));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	if(!apiutil.isSafeString(passwd)){
		passwd = null;
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
							'tenantName':	'',						// unscoped token by no tenant name
							'passwordCredentials':	{
								'username':	_uname,
								'password':	_passwd
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
						'path': 			keystone_ep.pathname + '/v2.0/tokens',
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
				//r3logger.dlog('response body: ' + body);

				var	res_body = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isSafeEntity(res_body)						||
					!apiutil.isSafeEntity(res_body.access)				||
					!apiutil.isSafeEntity(res_body.access.user)			||
					!apiutil.isSafeEntity(res_body.access.user.name)	||
					!apiutil.compareCaseString(res_body.access.user.name, _uname)	||
					!apiutil.isSafeString(res_body.access.user.id)		||
					!apiutil.isSafeEntity(res_body.access.token)		||
					!apiutil.isSafeString(res_body.access.token.id)		||
					!apiutil.isSafeString(res_body.access.token.expires))
				{
					error = new Error('could not get unscoped token by something wrong response body');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert openstack user id(16 bytes hex string) to UUID(not UUID4)
				var	user_id_uuid4	= apiutil.cvtNumberStringToUuid4(res_body.access.user.id, 16);

				// build result
				var	resobj			= {};
				resobj.user			= res_body.access.user.name.toLowerCase();
				resobj.userid		= user_id_uuid4;
				resobj.scoped		= false;
				resobj.token		= res_body.access.token.id.toLowerCase();
				resobj.expire		= res_body.access.token.expires;
				resobj.region		= keystone_ep.region.toLowerCase();
				resobj.token_seed	= JSON.stringify({ publisher: 'OPENSTACKV2' });
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
	}, false);
}

//
// Get Scoped token by unscoped token and tenant name from Openstack identity v2 API
//
// Document:	 https://developer.openstack.org/api-ref/identity/v2/?expanded=authenticate-detail
//
// Request:		{
//					"auth": {
//						"tenantName": "tenant",
//						"token" : {
//							"id": "**********************....."
//						}
//					}
//				}
//
// Response:	{
//					"access": {
//						"metadata": {
//							"is_admin": 0,
//							"roles": [
//								"************************......."
//							]
//						},
//						"serviceCatalog": [
//							{
//								"endpoints": [
//									{
//										"adminURL": "http://xxx.yahoo.co.jp:8776/v1/3b737f48168d32c23928b....",
//										"id": "*****************.......",
//										"internalURL": "http://xxx.yahoo.co.jp:8776/v1/3b737f48168d32c23928b....",
//										"publicURL": "https://yyy.yahoo.co.jp:8776/v1/3b737f48168d32c23928b55f....",
//										"region": "region name"				(*4)
//									}
//								],
//								"endpoints_links": [],
//								"name": "cinder",
//								"type": "identity"							(*4)
//							},
//							...
//						],
//						"token": {
//							"audit_ids": [
//								"######################",
//								"######################"
//							],
//							"expires": "2017-06-16T07:06:31Z",				(*2)
//							"id": "********************************",		(*1)
//							"issued_at": "2017-06-15T07:31:12.027688",
//							"tenant": {
//								"description": null,
//								"enabled": true,
//								"id": "************************...",
//								"name": "tenant name"						(*5: tenant name)
//							}
//						},
//						"user": {
//							"id": "************************...",			(*4)
//							"name": "user",									(*3)
//							"roles": [
//								{
//									"name": "_member_"
//								}
//							],
//							"roles_links": [],
//							"username": "user name"
//						}
//					}
//				}
//
// callback(error, result):
//				result = {
//					user:		user name									(*3)
//					userid:		user id										(*4)
//					scoped:		true										(always true)
//					token:		token string(id)							(*1)
//					expire:		expire string								(*2)
//					region:		region string								(identity's *4 for region name)
//					token_seed:	seed										({publisher: 'OPENSTACKV2'})
//				}
//
function rawGetUserScopedTokenV2(unscopedtoken, tenant, callback)
{
	if(!apiutil.isSafeStrings(unscopedtoken, tenant)){
		var	error = new Error('some parameters are wrong : unscopedtoken=' + JSON.stringify(unscopedtoken) + ', tenant=' + JSON.stringify(tenant));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	var	_unscopedtoken	= unscopedtoken;
	var	_tenant			= tenant;
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
							'tenantName':	_tenant,
							'token':	{
								'id':		_unscopedtoken
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
						'path': 			keystone_ep.pathname + '/v2.0/tokens',
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
				if(	!apiutil.isSafeEntity(res_body)							||
					!apiutil.isSafeEntity(res_body.access)					||
					apiutil.isEmptyArray(res_body.access.serviceCatalog)	||
					!apiutil.isSafeEntity(res_body.access.user)				||
					!apiutil.isSafeString(res_body.access.user.name)		||
					!apiutil.isSafeString(res_body.access.user.id)			||
					!apiutil.isSafeEntity(res_body.access.token)			||
					!apiutil.isSafeString(res_body.access.token.id)			||
					!apiutil.isSafeEntity(res_body.access.token.expires)	||
					!apiutil.isSafeEntity(res_body.access.token.tenant)		||
					!apiutil.isSafeString(res_body.access.token.tenant.name)||
					!apiutil.compareCaseString(res_body.access.token.tenant.name, _tenant))
				{
					error = new Error('could not get scoped token by something wrong response body');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// check & get region
				var	region = null;
				for(var cnt = 0; cnt < res_body.access.serviceCatalog.length && null === region; ++cnt){
					if(	!apiutil.isSafeEntity(res_body.access.serviceCatalog[cnt])			||
						apiutil.isEmptyArray(res_body.access.serviceCatalog[cnt].endpoints)	||
						!apiutil.isSafeString(res_body.access.serviceCatalog[cnt].type)		)
					{
						r3logger.wlog('one of response for scoped token is something wrong : ' + JSON.stringify(res_body.access.serviceCatalog[cnt]));
						continue;
					}

					// target region by type=identity
					if(!apiutil.compareCaseString('identity', res_body.access.serviceCatalog[cnt].type)){
						continue;
					}

					// check region
					for(var cnt2 = 0; cnt2 < res_body.access.serviceCatalog[cnt].endpoints.length; ++cnt2){
						if(	apiutil.isSafeEntity(res_body.access.serviceCatalog[cnt].endpoints[cnt2])		&&
							apiutil.isSafeString(res_body.access.serviceCatalog[cnt].endpoints[cnt2].region))
						{
							if(apiutil.compareCaseString(res_body.access.serviceCatalog[cnt].endpoints[cnt2].region, keystone_ep.region)){
								// found
								region = res_body.access.serviceCatalog[cnt].endpoints[cnt2].region;
								break;
							}else{
								r3logger.wlog('unknown region(' + res_body.access.serviceCatalog[cnt].endpoints[cnt2].region + '), we need to find region(' + keystone_ep.region + '), so skip this');
							}
						}else{
							r3logger.wlog('one of response endpoint for scoped token is something wrong : ' + JSON.stringify(res_body.access.serviceCatalog[cnt].endpoints[cnt2]));
						}
					}
				}
				if(null === region){
					error = new Error('could not find request region in result.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert openstack user id(16 bytes hex string) to UUID(not UUID4)
				var	user_id_uuid4	= apiutil.cvtNumberStringToUuid4(res_body.access.user.id, 16);

				// build result
				var	resobj			= {};
				resobj.user			= res_body.access.user.name.toLowerCase();
				resobj.userid		= user_id_uuid4;
				resobj.scoped		= true;
				resobj.token		= res_body.access.token.id.toLowerCase();
				resobj.expire		= res_body.access.token.expires;
				resobj.region		= region.toLowerCase();
				resobj.token_seed	= JSON.stringify({ publisher: 'OPENSTACKV2' });
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
	}, false);
}

//
// Verify User Token for OpenStack V2
//
// user				:	target user name for token
// token			:	check token
// token_seed		:	token seed data
//
// result			:	{
//							result:		true/false
//							message:	null or error message string
// 						}
// 
function rawVerifyUserTokenPublisherV2(token_seed)
{
	if(!apiutil.isSafeString(token_seed)){
		return false;
	}

	// parse seed
	var	seed = token_seed;
	if(apiutil.checkSimpleJSON(token_seed)){
		seed = JSON.parse(token_seed);
	}
	if(	!apiutil.isSafeEntity(seed)				||
		!apiutil.isSafeString(seed.publisher)	||
		(seed.publisher != 'OPENSTACKV2')		)		// publisher must be 'OPENSTACKV2'
	{
		return false;
	}
	return true;
}

function rawWrapVerifyUserTokenPublisherV2(token_seed)
{
	var	resobj = {result: true, message: null};

	if(!rawVerifyUserTokenPublisherV2(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
}

function rawVerifyUserTokenV2(user, token, token_seed)
{
	var	resobj = {result: true, message: null};

	if(!apiutil.isSafeStrings(user, token, token_seed)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : token=' + JSON.stringify(token) + ', token_seed=<not printable>, user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}
	// check seed
	if(!rawVerifyUserTokenPublisherV2(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
}

//
// Get tenant list by unscoped token from Openstack identity v2 API
//
// Document:	https://developer.openstack.org/api-ref/identity/v2/?expanded=list-tenants-detail
//
// Request:		X-Auth-Token: <unscoped token>
//
// Response:	{
// 					"tenants": [
// 						{
// 							"description": null,							(*1)
// 							"enabled": true,
// 							"id": "***************************.....",		(*2)
// 							"name": "tenant name"							(*3)
// 						},
// 						{
// 							"description": null,
// 							"enabled": true,
// 							"id": "**************************......",
// 							"name": "tenant name"
// 						}
// 					],
// 					"tenants_links": []
// 				}
//
// callback(error, result):
//				result = [
//					{
//						name:			tenant name							(*3)
//						id:				tenant id							(*2)
//						description:	tenant description					(*1)
//						display:		display name						(*3)
//					},
//					...
//				]
// 
// [TODO]
// Should not we use "tenant id" instead of "tenant name" for "name"?
// We need this consideration.
// 
function rawGetUserTenantListV2(unscopedtoken, callback)
{
	if(!apiutil.isSafeString(unscopedtoken)){
		var	error = new Error('parameter is wrong : unscopedtoken=' + JSON.stringify(unscopedtoken));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	var	_unscopedtoken	= unscopedtoken;
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
							'path': 			keystone_ep.pathname + '/v2.0/tenants',
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
					apiutil.isEmptyArray(res_body.tenants)	)
				{
					error = new Error('failed to get tenant list by unscoped token.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert result array
				var	resobj = new Array(0);
				for(var cnt = 0; cnt < res_body.tenants.length; ++cnt){
					if(	!apiutil.isSafeEntity(res_body.tenants[cnt])		||
						!apiutil.isSafeString(res_body.tenants[cnt].id)		||
						!apiutil.isSafeString(res_body.tenants[cnt].name)	)
					{
						r3logger.wlog('one of response for tenant list is something wrong : ' + JSON.stringify(res_body.tenants[cnt]));
						continue;
					}
					var	tenant			= {};
					tenant.name			= res_body.tenants[cnt].name.toLowerCase();
					tenant.id			= res_body.tenants[cnt].id.toLowerCase();
					tenant.description	= apiutil.getSafeString(res_body.tenants[cnt].description);
					tenant.display		= res_body.tenants[cnt].name;
					resobj.push(tenant);
				}
				if(0 === resobj.length){
					error = new Error('could not get any tenant list by unscoped token.');
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
	}, false);
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.getUserUnscopedToken = function(uname, passwd, callback)
{
	return rawGetUserUnscopedTokenV2(uname, passwd, callback);
};

//
// tenantname	: for keystone v2 api
// tenantid		: not used
//
exports.getUserScopedToken = function(unscopedtoken, tenantname, tenantid, callback)
{
	return rawGetUserScopedTokenV2(unscopedtoken, tenantname, callback);
};

//
// Verify seed publisher type
//
exports.verifyUserTokenPublisher = function(token_seed)
{
	return rawWrapVerifyUserTokenPublisherV2(token_seed);
};

//
// Verify token
//
// tenant is not used.
//
exports.verifyUserToken = function(user, tenant, token, token_seed)				// eslint-disable-line no-unused-vars
{
	return rawVerifyUserTokenV2(user, token, token_seed);
};

//
// userid		: not used
//
exports.getUserTenantList = function(unscopedtoken, userid, callback)
{
	return rawGetUserTenantListV2(unscopedtoken, callback);
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
