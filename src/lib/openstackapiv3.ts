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

import	* as https				from 'https';
import	* as http				from 'http';

import	apiutil					from './k2hr3apiutil';
import	r3logger				from './dbglogging';
import	osksep					from './openstackep';			// OpenStack KeyStone EndPoint(=osksep)
import	{ ca }					from './cacerts';

import type	{ K2hdkc }							from 'k2hdkc';
import type	{ ClientRequest, IncomingMessage  }	from 'http';
import type	{ valTypeUrlKeystoneEndpoint }		from './openstackep';
import type	{ resTypeBaseResult, valTypeOsapiTenantInfoList, valTypeOsapiTenantInfo, Osapi }	from './types';
import type	{ resTypeUserToken, cbTypeGetUserScopedToken, cbTypeGetUserUnscopedToken, cbTypeGetUserTenantList }	from './k2hr3tokens';

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
//					user:		user name									(*3)
//					userid:		user id										(*4)
//					scoped:		false										(always false)
//					token:		token string(id)							(*1)
//					expire:		expire string								(*2)
//					region:		region string								(region name for keystone endpoint)
//					token_seed:	seed										({publisher: 'OPENSTACKV3'})
//				}
//
const rawGetUserUnscopedTokenV3 = (
	uname:		string | null,
	passwd:		string | null,
	callback:	cbTypeGetUserUnscopedToken
): void => {

	if(!apiutil.isSafeString(uname)){
		const	error = new Error('some parameters are wrong : uname=' + JSON.stringify(uname));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	if(!apiutil.isSafeString(passwd)){
		passwd = null;
	}
	const	_uname		= uname;
	const	_passwd		= passwd;
	const	_callback	= callback;

	// get end points for keystone
	osksep.getKeystoneEndpoint((err: Error | null, keystone_ep: valTypeUrlKeystoneEndpoint | null): void => {
		if(apiutil.isSafeEntity(err) || !apiutil.isPlainObject(keystone_ep)){
			const error = new Error('could not get keystone end point by ' + (apiutil.isSafeEntity(err) ? apiutil.getSafeString(err.message) : ''));
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		const	body = {
			'auth': {
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

		const	agent	= apiutil.compareCaseString('https:', keystone_ep.protocol) ? https : http;
		const	strbody	= JSON.stringify(body);
		const	headers	= {
			'Content-Type':		'application/json',
			'Content-Length':	strbody.length
		};
		const	options	= {
			'host':				apiutil.getSafeString(keystone_ep.hostname),
			'port':				apiutil.isSafeNumber(keystone_ep.port) ? keystone_ep.port : 0,
			'path': 			apiutil.getSafeString(keystone_ep.pathname) + '/v3/auth/tokens',
			'method':			'POST',
			'headers':			headers,
			'ca':				(apiutil.compareCaseString('https:', keystone_ep.protocol) && null !== ca) ? (ca() ?? undefined) : undefined
		};

		// send request
		const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void => {
			let		body	= '';
			const	status	= res.statusCode;
			const	headers	= res.headers;

			r3logger.dlog('response status: ' + res.statusCode);
			r3logger.dlog('response header: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');

			res.on('data', (chunk: string) => {
				//r3logger.dlog('response chunk: ' + chunk);
				body += chunk;
			});

			res.on('end', (): void => {
				if(300 <= (status ?? 500)){
					const error = new Error('could not get unscoped token by status=' + String(status ?? 500));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				if(!apiutil.isPlainObject(headers) || !apiutil.isSafeString(headers['x-subject-token'])){
					const error = new Error('could not find unscoped token in header(X-Subject-Token)');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				const	tmpToken = apiutil.getSafeString(headers['x-subject-token']);
				//r3logger.dlog('response body: ' + body);

				let	res_body: unknown = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isPlainObject(res_body)					||
					!apiutil.isPlainObject(res_body.token)				||
					!apiutil.isSafeString(res_body.token.expires_at)	||
					!apiutil.isPlainObject(res_body.token.user)			||
					!apiutil.isSafeString(res_body.token.user.id)		||
					!apiutil.isSafeString(res_body.token.user.name)		||
					!apiutil.compareCaseString(res_body.token.user.name, _uname))
				{
					const error = new Error('could not get unscoped token by something wrong response body : ' + body);
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert openstack user id(16 bytes hex string) to UUID(not UUID4)
				const	user_id_uuid4	= apiutil.getSafeString(apiutil.cvtNumberStringToUuid4(res_body.token.user.id, 16));

				// build result
				const	resobj: resTypeUserToken = {
					user:		res_body.token.user.name.toLowerCase(),
					userid:		user_id_uuid4,
					scoped:		false,
					token:		tmpToken,
					expire:		apiutil.getSafeString(res_body.token.expires_at),
					region:		apiutil.getSafeString(keystone_ep.region).toLowerCase(),
					token_seed:	JSON.stringify({ publisher: 'OPENSTACKV3' })
				};
				_callback(null, resobj);
				return;
			});
		});

		req.on('error', (exception: Error) => {
			r3logger.elog('problem with request: ' + exception.message);
			_callback(exception, null);
			return;
		});

		// write data to request body
		req.write(strbody);
		req.end();
	}, true);
};

//
// Get Unscoped token by openstack token from Openstack identity v3 API
//
// Document:	 https://docs.openstack.org/api-ref/identity/v3/?expanded=token-authentication-with-unscoped-authorization-detail#token-authentication-with-unscoped-authorization
//
// Request:		{
//					"auth": {
//						"identity": {
//							"methods": [
//								"token"
//							],
//							"token": {
//								"id": "**********"
//							}
//						}
//					}
//				}
//
//
// Response:
//		Header	"X-Subject-Token: 16e4638398574f1d9364............"			(*1)
//				{
//					"token": {
//						"audit_ids": [
//							"################....."
//						],
//						"expires_at": "2017-06-17T00:20:38.863072Z",		(*2)
//						"issued_at": "2015-11-05T21:00:33.819948Z",
//						"methods": [
//							"token"
//						],
//						"user": {
//							"domain": {
//								"id": "default",
//								"name": "Default"
//							},
//							"id":	"*****************************...",		(*4)
//							"name":	"user name"								(*3)
//							"password_expires_at": null
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
//					token_seed:	seed										({publisher: 'OPENSTACKV3'})
//				}
//
const rawGetUserUnscopedTokenByOstokenV3 = (
	ostoken:	string | null,
	callback:	cbTypeGetUserUnscopedToken
): void => {

	if(!apiutil.isSafeString(ostoken)){
		const	error = new Error('some parameter is wrong : ostoken=' + JSON.stringify(ostoken));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	const	_ostoken	= ostoken;
	const	_callback	= callback;

	// get end points for keystone
	osksep.getKeystoneEndpoint((err: Error | null, keystone_ep: valTypeUrlKeystoneEndpoint | null): void => {
		if(apiutil.isSafeEntity(err) || !apiutil.isPlainObject(keystone_ep)){
			const error = new Error('could not get keystone end point by ' + (apiutil.isSafeEntity(err) ? apiutil.getSafeString(err.message) : ''));
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		const	body = {
			'auth': {
				'identity': {
					'token': {
						'id': _ostoken,
					},
					'methods': ['token']
				}
			}
		};

		const	agent	= apiutil.compareCaseString('https:', keystone_ep.protocol) ? https : http;
		const	strbody	= JSON.stringify(body);
		const	headers	= {
			'Content-Type':		'application/json',
			'Content-Length':	strbody.length
		};
		const	options	= {
			'host':				apiutil.getSafeString(keystone_ep.hostname),
			'port':				apiutil.isSafeNumber(keystone_ep.port) ? keystone_ep.port : 0,
			'path': 			apiutil.getSafeString(keystone_ep.pathname) + '/v3/auth/tokens',
			'method':			'POST',
			'headers':			headers,
			'ca':				(apiutil.compareCaseString('https:', keystone_ep.protocol) && null !== ca) ? (ca() ?? undefined) : undefined
		};

		// send request
		const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void => {
			let		body	= '';
			const	status	= res.statusCode;
			const	headers	= res.headers;

			r3logger.dlog('response status: ' + res.statusCode);
			r3logger.dlog('response header: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');

			res.on('data', (chunk: string) => {
				//r3logger.dlog('response chunk: ' + chunk);
				body += chunk;
			});

			res.on('end', (): void => {
				if(300 <= (status ?? 500)){
					const error = new Error('could not get unscoped token by status=' + String(status ?? 500));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				if(!apiutil.isPlainObject(headers) || !apiutil.isSafeString(headers['x-subject-token'])){
					const error = new Error('could not find unscoped token in header(X-Subject-Token)');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				const	tmpToken = apiutil.getSafeString(headers['x-subject-token']);
				//r3logger.dlog('response body: ' + body);

				let	res_body: unknown = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isPlainObject(res_body)				||
					!apiutil.isPlainObject(res_body.token)			||
					!apiutil.isSafeString(res_body.token.expires_at)||
					!apiutil.isPlainObject(res_body.token.user)		||
					!apiutil.isSafeString(res_body.token.user.id)	||
					!apiutil.isSafeString(res_body.token.user.name)	)
				{
					const error = new Error('could not get unscoped token by something wrong response body : ' + body);
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert openstack user id(16 bytes hex string) to UUID(not UUID4)
				const	user_id_uuid4	= apiutil.getSafeString(apiutil.cvtNumberStringToUuid4(res_body.token.user.id, 16));

				// build result
				const	resobj: resTypeUserToken = {
					user:		res_body.token.user.name.toLowerCase(),
					userid:		user_id_uuid4,
					scoped:		false,
					token:		tmpToken,
					expire:		apiutil.getSafeString(res_body.token.expires_at),
					region:		apiutil.getSafeString(keystone_ep.region).toLowerCase(),
					token_seed:	JSON.stringify({ publisher: 'OPENSTACKV3' })
				};
				_callback(null, resobj);
			});
		});

		req.on('error', (exception: Error) => {
			r3logger.elog('problem with request: ' + exception.message);
			_callback(exception, null);
			return;
		});

		// write data to request body
		req.write(strbody);
		req.end();
	}, true);
};

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
//					user:		user name									(*3)
//					userid:		user id										(*4)
//					scoped:		true										(always true)
//					token:		token string(id)							(*1)
//					expire:		expire string								(*2)
//					region:		region string								(identity's *5 for region name)
//					token_seed:	seed										({publisher: 'OPENSTACKV3'})
//				}
//
const rawGetUserScopedTokenV3 = (
	unscopedtoken:	string | null,
	tenantid:		string | number | null,
	callback:		cbTypeGetUserScopedToken
): void => {

	if(!apiutil.isSafeString(unscopedtoken)){
		const error = new Error('parameter is wrong : unscopedtoken=' + JSON.stringify(unscopedtoken));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	if(!apiutil.isSafeNumeric(tenantid)){
		// id allows hex character string, decimal character string, decimal number value.
		//
		const error = new Error('parameter is wrong : tenantid=' + JSON.stringify(tenantid));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	if(!apiutil.isSafeString(tenantid)){
		// to string
		tenantid = String(tenantid);
	}
	const	_unscopedtoken	= unscopedtoken;
	const	_tenantid		= tenantid;
	const	_callback		= callback;

	// get end points for keystone
	osksep.getKeystoneEndpoint((err: Error | null, keystone_ep: valTypeUrlKeystoneEndpoint | null): void => {
		if(apiutil.isSafeEntity(err) || !apiutil.isPlainObject(keystone_ep)){
			const error = new Error('could not get keystone end point by ' + (apiutil.isSafeEntity(err) ? apiutil.getSafeString(err.message) : ''));
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		const	body = {
			'auth': {
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
		const	agent	= apiutil.compareCaseString('https:', keystone_ep.protocol) ? https : http;
		const	strbody	= JSON.stringify(body);
		const	headers	= {
			'Content-Type':		'application/json',
			'Content-Length':	strbody.length
		};
		const	options	= {
			'host':				apiutil.getSafeString(keystone_ep.hostname),
			'port':				apiutil.isSafeNumber(keystone_ep.port) ? keystone_ep.port : 0,
			'path': 			apiutil.getSafeString(keystone_ep.pathname) + '/v3/auth/tokens',
			'method':			'POST',
			'headers':			headers,
			'ca':				(apiutil.compareCaseString('https:', keystone_ep.protocol) && null !== ca) ? (ca() ?? undefined) : undefined
		};

		// send request
		const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void => {
			let		body	= '';
			const	status	= res.statusCode;
			const	headers	= res.headers;

			r3logger.dlog('response status: ' + res.statusCode);
			r3logger.dlog('response header: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');

			res.on('data', (chunk: string) => {
				//r3logger.dlog('response chunk: ' + chunk);
				body += chunk;
			});

			res.on('end', (): void => {
				if(300 <= (status ?? 500)){
					const error = new Error('could not get scoped token by status=' + String(status ?? 500));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				if(!apiutil.isPlainObject(headers) || !apiutil.isSafeString(headers['x-subject-token'])){
					const error = new Error('could not find unscoped token in header(X-Subject-Token)');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				const	tmpToken = apiutil.getSafeString(headers['x-subject-token']);
				//r3logger.dlog('response body: ' + body);

				let	res_body: unknown = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isPlainObject(res_body)					||
					!apiutil.isPlainObject(res_body.token)				||
					!apiutil.isNotEmptyArray(res_body.token.catalog)	||
					!apiutil.isSafeString(res_body.token.expires_at)	||
					!apiutil.isPlainObject(res_body.token.project)		||
					!apiutil.isSafeString(res_body.token.project.id)	||
					!apiutil.compareCaseString(res_body.token.project.id, _tenantid)	||
					!apiutil.isSafeString(res_body.token.project.name)	||
					!apiutil.isPlainObject(res_body.token.user)			||
					!apiutil.isSafeString(res_body.token.user.id)		||
					!apiutil.isSafeString(res_body.token.user.name)		)
				{
					const error = new Error('could not get scoped token by something wrong response body : ' + body);
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// check & get region
				let	region: string | null = null;
				for(let cnt = 0; cnt < res_body.token.catalog.length && null === region; ++cnt){
					const	tmpCatalog = res_body.token.catalog[cnt];
					if(	!apiutil.isPlainObject(tmpCatalog)				||
						!apiutil.isNotEmptyArray(tmpCatalog.endpoints)	||
						!apiutil.isSafeString(tmpCatalog.type)			)
					{
						r3logger.wlog('one of response for scoped token is something wrong : ' + JSON.stringify(tmpCatalog));
						continue;
					}

					// target region by type=identity
					if(!apiutil.compareCaseString('identity', tmpCatalog.type)){
						continue;
					}

					// check region
					for(let cnt2 = 0; cnt2 < tmpCatalog.endpoints.length; ++cnt2){
						const	tmpEp = tmpCatalog.endpoints[cnt2];
						if(	apiutil.isPlainObject(tmpEp)								&&
							apiutil.isSafeString(tmpEp.interface)					&&
							apiutil.compareCaseString('public', tmpEp.interface)	&&
							apiutil.isSafeString(tmpEp.region)						)
						{
							if(apiutil.compareCaseString(tmpEp.region, keystone_ep.region)){
								// found
								region = tmpEp.region;
								break;
							}else{
								r3logger.wlog('unknown region(' + tmpEp.region + '), we need to find region(' + keystone_ep.region + '), so skip this');
							}
						}else{
							r3logger.dlog('one of response endpoint for scoped token is not target or something wrong : ' + JSON.stringify(tmpEp));
						}
					}
				}
				if(!apiutil.isSafeString(region)){
					const error = new Error('could not find request region in result.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert openstack user id(16 bytes hex string) to UUID(not UUID4)
				const	user_id_uuid4	= apiutil.getSafeString(apiutil.cvtNumberStringToUuid4(res_body.token.user.id, 16));

				// build result
				const	resobj: resTypeUserToken = {
					user:		res_body.token.user.name.toLowerCase(),
					userid:		user_id_uuid4,
					scoped:		false,
					token:		tmpToken,
					expire:		res_body.token.expires_at,
					region:		region.toLowerCase(),
					token_seed:	JSON.stringify({ publisher: 'OPENSTACKV3' })
				};
				_callback(null, resobj);
			});
		});

		req.on('error', (exception: Error) => {
			r3logger.elog('problem with request: ' + exception.message);
			_callback(exception, null);
			return;
		});

		// write data to request body
		req.write(strbody);
		req.end();
	}, true);
};

//
// Verify User Token for OpenStack V3
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
const rawVerifyUserTokenPublisherV3 = (token_seed: string | null): boolean => {

	if(!apiutil.isSafeString(token_seed)){
		return false;
	}

	// parse seed
	if(!apiutil.checkSimpleJSON(token_seed)){
		return false;
	}

	const	seed = apiutil.parseJSON(token_seed);
	if(!apiutil.isValTypeTokenSeed(seed)){
		return false;
	}

	if(	!apiutil.isSafeString(seed.publisher)	||
		(seed.publisher != 'OPENSTACKV3')		)	// publisher must be 'OPENSTACKV3'
	{
		return false;
	}
	return true;
};

const rawWrapVerifyUserTokenPublisherV3 = (token_seed: string | null): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!rawVerifyUserTokenPublisherV3(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
};

const rawVerifyUserTokenV3 = (
	user:		string | null,
	token:		string | null,
	token_seed:	string | null
): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!apiutil.isSafeString(user) || !apiutil.isSafeString(token) || !apiutil.isSafeString(token_seed)){
		resobj.result	= false;
		resobj.message	= 'some parameters are wrong : token=' + JSON.stringify(token) + ', token_seed=<not printable>, user=' + JSON.stringify(user);
		r3logger.elog(resobj.message);
		return resobj;
	}
	// check seed
	if(!rawVerifyUserTokenPublisherV3(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
};

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
const rawGetUserTenantListV3 = (
	unscopedtoken:	string | null,
	userid:			string | null,
	callback:		cbTypeGetUserTenantList
): void => {

	if(!apiutil.isSafeString(unscopedtoken) || !apiutil.isSafeString(userid)){
		const error = new Error('parameter is wrong : unscopedtoken=' + JSON.stringify(unscopedtoken) + ', userid=' + JSON.stringify(userid));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	const	_unscopedtoken	= unscopedtoken;
	const	_callback		= callback;

	// convert user id(UUID) to openstack user id(16 bytes hex string)
	const	_bin_userid	= apiutil.cvtStrToBinUuid4(userid);
	if(null == _bin_userid){
		const error		= new Error('parameter is wrong : userid=' + JSON.stringify(userid));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	const	_userid		= _bin_userid.toString('hex');

	// get end points for keystone
	osksep.getKeystoneEndpoint((err: Error | null, keystone_ep: valTypeUrlKeystoneEndpoint | null): void => {
		if(apiutil.isSafeEntity(err) || !apiutil.isPlainObject(keystone_ep)){
			const error = new Error('could not get keystone end point by ' + (apiutil.isSafeEntity(err) ? apiutil.getSafeString(err.message) : ''));
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		const	agent	= apiutil.compareCaseString('https:', keystone_ep.protocol) ? https : http;
		const	headers = {
			'Content-Type':		'application/json',
			'X-Auth-Token':		_unscopedtoken,
			'Content-Length':	0
		};
		const	options = {
			'host':				apiutil.getSafeString(keystone_ep.hostname),
			'port':				apiutil.isSafeNumber(keystone_ep.port) ? keystone_ep.port : 0,
			'path': 			apiutil.getSafeString(keystone_ep.pathname) + '/v3/users/' + _userid + '/projects',
			'method':			'GET',
			'headers':			headers,
			'ca':				(apiutil.compareCaseString('https:', keystone_ep.protocol) && null !== ca) ? (ca() ?? undefined) : undefined
		};

		// send request
		const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void => {
			let		body	= '';
			const	status	= res.statusCode;

			r3logger.dlog('response status: ' + res.statusCode);
			r3logger.dlog('response header: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');

			res.on('data', (chunk: string) => {
				//r3logger.dlog('response chunk: ' + chunk);
				body += chunk;
			});

			res.on('end', (): void => {
				if(300 <= (status ?? 500)){
					const error = new Error('could not get scoped token by status=' + String(status ?? 500));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				//r3logger.dlog('response body: ' + body);

				let	res_body: unknown = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isPlainObject(res_body)			||
					!apiutil.isNotEmptyArray(res_body.projects)	)
				{
					const error = new Error('failed to get project(tenant) list by unscoped token.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert result array
				const	resobj: valTypeOsapiTenantInfoList = [];
				for(let cnt = 0; cnt < res_body.projects.length; ++cnt){
					const	tmpProject = res_body.projects[cnt];
					if(	!apiutil.isPlainObject(tmpProject)		||
						!apiutil.isSafeString(tmpProject.id)	||
						!apiutil.isSafeString(tmpProject.name)	)
					{
						r3logger.wlog('one of response for project(tenant) list is something wrong : ' + JSON.stringify(tmpProject));
						continue;
					}
					const	tenant: valTypeOsapiTenantInfo = {
						name:			tmpProject.name.toLowerCase(),
						id:				tmpProject.id.toLowerCase(),
						description:	apiutil.getSafeString(tmpProject.description),
						display:		tmpProject.name
					};
					resobj.push(tenant);
				}
				if(0 === resobj.length){
					const error = new Error('could not get any projects(tenant) list by unscoped token.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				_callback(null, resobj);
			});
		});

		req.on('error', (exception: Error) => {
			r3logger.elog('problem with request: ' + exception.message);
			callback(exception, null);
			return;
		});
	}, true);
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export const openstackapiv3: Osapi = {
	getUserUnscopedToken:			rawGetUserUnscopedTokenV3,

	//
	// token	: unscoped/scoped token for openstack
	//
	getUserUnscopedTokenByToken:	rawGetUserUnscopedTokenByOstokenV3,

	//
	// tenantname	: not used
	// tenantid		: for keystone v3 api
	//
	getUserScopedToken:				rawGetUserScopedTokenV3,

	//
	// Verify seed publisher type
	//
	verifyUserTokenPublisher:		rawWrapVerifyUserTokenPublisherV3,

	//
	// Verify token
	//
	// tenant is not used.
	//
	verifyUserToken:
		(dkcobj_permanent: K2hdkc | null, user: string | null, tenant: string | null, token: string | null, token_seed: string | null): resTypeBaseResult => {
			return rawVerifyUserTokenV3(user, token, token_seed);
		},

	//
	// userid		: for keystone v3 api
	//
	getUserTenantList:				rawGetUserTenantListV3
};

//
// Default
//
export default openstackapiv3;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
