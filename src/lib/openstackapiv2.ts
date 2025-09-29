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
const rawGetUserUnscopedTokenV2 = (
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
		if(apiutil.isSafeEntity(err) || !apiutil.isSafeEntity(keystone_ep)){
			const	error = new Error('could not get keystone end point by ' + (apiutil.isSafeEntity(err) ? apiutil.getSafeString(err.message) : ''));
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		const	body = {
			'auth': {
				'tenantName':	'',						// unscoped token by no tenant name
				'passwordCredentials': {
					'username':	_uname,
					'password':	_passwd
				}
			}
		};

		const	agent	= apiutil.compareCaseString('https:', keystone_ep.protocol) ? https : http;
		const	strbody	= JSON.stringify(body);
		const	headers	= {
			'Content-Type':		'application/json',
			'Content-Length':	strbody.length
		};
		const	options = {
			'host':				keystone_ep.hostname ?? '',
			'port':				keystone_ep.port ?? 0,
			'path': 			keystone_ep.pathname + '/v2.0/tokens',
			'method':			'POST',
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
					const error = new Error('could not get unscoped token by status=' + String(status ?? 500));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				//r3logger.dlog('response body: ' + body);

				let	res_body: unknown = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isPlainObject(res_body)					||
					!apiutil.isPlainObject(res_body.access)				||
					!apiutil.isPlainObject(res_body.access.user)		||
					!apiutil.isSafeString(res_body.access.user.name)	||
					!apiutil.compareCaseString(res_body.access.user.name, _uname)	||
					!apiutil.isSafeString(res_body.access.user.id)		||
					!apiutil.isPlainObject(res_body.access.token)		||
					!apiutil.isSafeString(res_body.access.token.id)		||
					!apiutil.isSafeString(res_body.access.token.expires))
				{
					const error = new Error('could not get unscoped token by something wrong response body');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert openstack user id(16 bytes hex string) to UUID(not UUID4)
				const	user_id_uuid4	= apiutil.getSafeString(apiutil.cvtNumberStringToUuid4(res_body.access.user.id, 16));

				// build result
				const	resobj: resTypeUserToken = {
					user:		res_body.access.user.name.toLowerCase(),
					userid:		user_id_uuid4,
					scoped:		false,
					token:		res_body.access.token.id.toLowerCase(),
					expire:		res_body.access.token.expires,
					region:		apiutil.getSafeString(keystone_ep.region).toLowerCase(),
					token_seed:	JSON.stringify({ publisher: 'OPENSTACKV2' })
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
	}, false);
};

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
const rawGetUserScopedTokenV2 = (
	unscopedtoken:	string | null,
	tenant:			string | null,
	callback:		cbTypeGetUserScopedToken
): void => {

	if(!apiutil.isSafeString(unscopedtoken) || !apiutil.isSafeString(tenant)){
		const	error = new Error('some parameters are wrong : unscopedtoken=' + JSON.stringify(unscopedtoken) + ', tenant=' + JSON.stringify(tenant));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	const	_unscopedtoken	= unscopedtoken;
	const	_tenant			= tenant;
	const	_callback		= callback;

	// get end points for keystone
	osksep.getKeystoneEndpoint((err: Error | null, keystone_ep: valTypeUrlKeystoneEndpoint | null): void => {
		if(null !== err || null === keystone_ep){
			const	error = new Error('could not get keystone end point by ' + (err?.message ?? ''));
			r3logger.elog(error.message);
			_callback(error, null);
			return;
		}
		// got safe endpoint for keystone
		//r3logger.dlog(keystone_ep);

		// build parameters for request
		const	body = {
			'auth': {
				'tenantName': _tenant,
				'token': {
					'id': _unscopedtoken
				}
			}
		};
		const	agent	= apiutil.compareCaseString('https:', keystone_ep.protocol) ? https : http;
		const	strbody	= JSON.stringify(body);
		const	headers	= {
			'Content-Type':		'application/json',
			'Content-Length':	strbody.length
		};
		const	options = {
			'host':				keystone_ep.hostname ?? '',
			'port':				keystone_ep.port ?? 0,
			'path': 			keystone_ep.pathname + '/v2.0/tokens',
			'method':			'POST',
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
					const	error = new Error('could not get scoped token by status=' + String(status ?? 500));
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}
				//r3logger.dlog('response body: ' + body);

				let	res_body: unknown = body;
				if(apiutil.checkSimpleJSON(body)){
					res_body = JSON.parse(body);
				}
				if(	!apiutil.isPlainObject(res_body)							||
					!apiutil.isPlainObject(res_body.access)						||
					!apiutil.isNotEmptyArray(res_body.access.serviceCatalog)	||
					!apiutil.isPlainObject(res_body.access.user)				||
					!apiutil.isSafeString(res_body.access.user.name)			||
					!apiutil.isSafeString(res_body.access.user.id)				||
					!apiutil.isPlainObject(res_body.access.token)				||
					!apiutil.isSafeString(res_body.access.token.id)				||
					!apiutil.isSafeString(res_body.access.token.expires)		||
					!apiutil.isPlainObject(res_body.access.token.tenant)		||
					!apiutil.isSafeString(res_body.access.token.tenant.name)	||
					!apiutil.compareCaseString(res_body.access.token.tenant.name, _tenant))
				{
					const	error = new Error('could not get scoped token by something wrong response body');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// check & get region
				let	region: string | null = null;
				for(let cnt = 0; cnt < (res_body?.access?.serviceCatalog?.length ?? 0) && null === region; ++cnt){
					const	tmpCatalog = res_body.access.serviceCatalog[cnt];
					if(	!apiutil.isPlainObject(tmpCatalog)				||
						!apiutil.isNotEmptyArray(tmpCatalog.endpoints)	||
						!apiutil.isSafeString(tmpCatalog.type)			)
					{
						r3logger.wlog('one of response for scoped token is something wrong : ' + JSON.stringify(res_body));
						continue;
					}

					// target region by type=identity
					if(!apiutil.compareCaseString('identity', tmpCatalog.type)){
						continue;
					}

					// check region
					for(let cnt2 = 0; cnt2 < tmpCatalog.endpoints.length; ++cnt2){
						const	tmpEp = tmpCatalog.endpoints[cnt2];
						if(	apiutil.isPlainObject(tmpEp)			&&
							apiutil.isSafeString(tmpEp.region)	)
						{
							if(apiutil.compareCaseString(tmpEp.region, keystone_ep.region)){
								// found
								region = tmpEp.region;
								break;
							}else{
								r3logger.wlog('unknown region(' + tmpEp.region + '), we need to find region(' + keystone_ep.region + '), so skip this');
							}
						}else{
							r3logger.wlog('one of response endpoint for scoped token is something wrong : ' + JSON.stringify(tmpEp));
						}
					}
				}
				if(!apiutil.isString(region)){
					const	error = new Error('could not find request region in result.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert openstack user id(16 bytes hex string) to UUID(not UUID4)
				const	user_id_uuid4	= apiutil.getSafeString(apiutil.cvtNumberStringToUuid4(res_body.access.user.id, 16));

				// build result
				const	resobj: resTypeUserToken = {
					user:		res_body.access.user.name.toLowerCase(),
					userid:		user_id_uuid4,
					scoped:		false,
					token:		res_body.access.token.id.toLowerCase(),
					expire:		res_body.access.token.expires,
					region:		region.toLowerCase(),
					token_seed:	JSON.stringify({ publisher: 'OPENSTACKV2' })
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
	}, false);
};

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
const rawVerifyUserTokenPublisherV2 = (token_seed: string | null): boolean => {

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
		(seed.publisher != 'OPENSTACKV2')		)	// publisher must be 'OPENSTACKV2'
	{
		return false;
	}
	return true;
};

const rawWrapVerifyUserTokenPublisherV2 = (token_seed: string | null): resTypeBaseResult => {

	const	resobj: resTypeBaseResult = {result: true, message: null};

	if(!rawVerifyUserTokenPublisherV2(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
};

const rawVerifyUserTokenV2 = (
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
	if(!rawVerifyUserTokenPublisherV2(token_seed)){
		resobj.result	= false;
		resobj.message	= 'token_seed(not printable) is not safe entity.';
		r3logger.elog(resobj.message);
		return resobj;
	}
	return resobj;
};

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
const rawGetUserTenantListV2 = (
	unscopedtoken:	string | null,
	callback:		cbTypeGetUserTenantList
): void => {

	if(!apiutil.isSafeString(unscopedtoken)){
		const	error = new Error('parameter is wrong : unscopedtoken=' + JSON.stringify(unscopedtoken));
		r3logger.elog(error.message);
		callback(error, null);
		return;
	}
	const	_unscopedtoken	= unscopedtoken;
	const	_callback		= callback;

	// get end points for keystone
	osksep.getKeystoneEndpoint((err: Error | null, keystone_ep: valTypeUrlKeystoneEndpoint | null): void => {
		if(null !== err || null === keystone_ep){
			const	error = new Error('could not get keystone end point by ' + (err?.message ?? ''));
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
			'host':				keystone_ep.hostname ?? '',
			'port':				keystone_ep.port ?? 0,
			'path': 			keystone_ep.pathname + '/v2.0/tenants',
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
					!apiutil.isNotEmptyArray(res_body.tenants)	)
				{
					const error = new Error('failed to get tenant list by unscoped token.');
					r3logger.elog(error.message);
					_callback(error, null);
					return;
				}

				// convert result array
				const	resobj: valTypeOsapiTenantInfoList = [];
				for(let cnt = 0; cnt < res_body.tenants.length; ++cnt){
					const	tmpTenant = res_body.tenants[cnt];
					if(	!apiutil.isPlainObject(tmpTenant)		||
						!apiutil.isSafeString(tmpTenant.id)		||
						!apiutil.isSafeString(tmpTenant.name)	)
					{
						r3logger.wlog('one of response for tenant list is something wrong : ' + JSON.stringify(tmpTenant));
						continue;
					}
					const	tenant: valTypeOsapiTenantInfo = {
						name:			tmpTenant.name.toLowerCase(),
						id:				tmpTenant.id.toLowerCase(),
						description:	apiutil.getSafeString(tmpTenant.description),
						display:		tmpTenant.name
					};
					resobj.push(tenant);
				}
				if(0 === resobj.length){
					const error = new Error('could not get any tenant list by unscoped token.');
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
	}, false);
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export const openstackapiv2: Osapi = {
	getUserUnscopedToken:			rawGetUserUnscopedTokenV2,

	//
	// update token	: not implemented
	//
	getUserUnscopedTokenByToken:
		(token: string | null, callback: cbTypeGetUserUnscopedToken): void => {
			const	error = new Error('getUserUnscopedTokenByToken is not implemented');
			r3logger.elog(error.message);
			callback(error, null);
		},

	//
	// tenantname	: for keystone v2 api
	// tenantid		: not used
	//
	getUserScopedToken:				rawGetUserScopedTokenV2,

	//
	// Verify seed publisher type
	//
	verifyUserTokenPublisher:		rawWrapVerifyUserTokenPublisherV2,

	//
	// Verify token
	//
	// tenant is not used.
	//
	verifyUserToken:
		(dkcobj_permanent: K2hdkc | null, user: string | null, tenant: string | null, token: string | null, token_seed: string | null): resTypeBaseResult => {
			return rawVerifyUserTokenV2(user, token, token_seed);
		},

	//
	// userid		: not used
	//
	getUserTenantList:
		(unscopedtoken:	string | null, userid: string | null, callback: cbTypeGetUserTenantList): void => {
			rawGetUserTenantListV2(unscopedtoken, callback);
		}
};

//
// Default
//
export default openstackapiv2;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
