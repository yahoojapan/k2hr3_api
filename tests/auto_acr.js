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
 * CREATE:   Tue Dec 19 2017
 * REVISION:
 *
 */

'use strict';

var	common		= require('./auto_common');				// Common objects for Chai
var	chai		= common.chai;
var	chaiHttp	= common.chaiHttp;						// eslint-disable-line no-unused-vars
var	app			= common.app;
var	assert		= common.assert;						// eslint-disable-line no-unused-vars
var	expect		= common.expect;
var	tokenutil	= require('./auto_token_util');			// Token utility

//--------------------------------------------------------------
// Main describe section
//--------------------------------------------------------------
describe('API : ACR', function(){						// eslint-disable-line no-undef
	var	alltokens	= {};
	var	parentobj	= this;								// for calling tokenutil.before

	//
	// Before in describe section
	//
	before(function(done){								// eslint-disable-line no-undef
		// Nothing to do
		tokenutil.before(parentobj, alltokens, done);
	});

	//
	// After in describe section
	//
	after(function(){									// eslint-disable-line no-undef
		// Nothing to do
	});

	//
	// Run Test(GET - SCOPED TOKEN INFO - SUCCESS/FAILURE)
	//
	it('GET /v1/acr : failure get user token information for service(not_exist_service) in tenant0 by scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/not_exist_service';												// path:	yrn:yahoo:not_exist_service::tenant0

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(403);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Not found yrn:yahoo::::service:not_exist_service subkey under yrn:yahoo::::service key(there is no master service key)');

				//
				// Check removing token
				//
				chai.request(app)
					.get(uri)
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(401);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.false;
						expect(res.body.message).to.have.string('token(');
						expect(res.body.message).to.have.string(') is not existed, because it is expired or not set yet.');

						// reset all token
						tokenutil.before(parentobj, alltokens, done);
					});
			});
	});

	it('GET /v1/acr : failure get user token information for service(testservice) in tenant0 by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_user_token')								// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(invalid_user_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	//
	// This case is not run now.
	//
	// [NOTE]
	// Now our test data does not have "tenant2" which is not included testservice member.
	// (tenant0/tenant1 are testservice member(owner), then those scoped token could not occur error.)
	//
	//	it('GET /v1/acr : failure get user token information for service(testservice) in tenant0 by another scoped token with status 403', function(done){	// eslint-disable-line no-undef
	//		var	uri	= '/v1/acr';
	//		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0
	//	
	//		chai.request(app)
	//			.get(uri)
	//			.set('content-type', 'application/json')
	//			.set('x-auth-token', alltokens.scopedtoken.tenant2)							// tenant2
	//			.end(function(err, res){
	//				expect(res).to.have.status(403);
	//				expect(res).to.be.json;
	//				expect(res.body).to.be.an('object');
	//				expect(res.body.result).to.be.a('boolean').to.be.false;
	//				expect(res.body.message).to.be.a('string').to.equal('Not found yrn:yahoo:::32834 key under yrn:yahoo::::service:testservice key');
	//	
	//				//
	//				// Check removing token
	//				//
	//				chai.request(app)
	//					.get(uri)
	//					.set('content-type', 'application/json')
	//					.set('x-auth-token', alltokens.scopedtoken.tenant2)					// tenant2
	//					.end(function(err, res){
	//						expect(res).to.have.status(401);
	//						expect(res).to.be.json;
	//						expect(res.body).to.be.an('object');
	//						expect(res.body.result).to.be.a('boolean').to.be.false;
	//						expect(res.body.message).to.have.string('token(')
	//						expect(res.body.message).to.have.string(') is not existed, because it is expired or not set yet.')
	//	
	//						// reset all token
	//						tokenutil.before(parentobj, alltokens, done);
	//					});
	//			});
	//	});

	it('GET /v1/acr : get user token information for service(testservice) in tenant0 by member scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.tokeninfo).to.be.an('object');
				expect(res.body.tokeninfo.user).to.be.a('string').to.equal('dummyuser');
				expect(res.body.tokeninfo.tenant).to.be.a('string').to.equal('tenant0');
				expect(res.body.tokeninfo.service).to.be.a('string').to.equal('testservice');

				//
				// Check removing token
				//
				chai.request(app)
					.get(uri)
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(401);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.false;
						expect(res.body.message).to.have.string('token(');
						expect(res.body.message).to.have.string(') is not existed, because it is expired or not set yet.');

						// reset all token
						tokenutil.before(parentobj, alltokens, done);
					});
			});
	});

	it('GET /v1/acr : get user token information for service(testservice) in tenant1 by owner scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant1

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)							// tenant1
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.tokeninfo).to.be.an('object');
				expect(res.body.tokeninfo.user).to.be.a('string').to.equal('dummyuser');
				expect(res.body.tokeninfo.tenant).to.be.a('string').to.equal('tenant1');
				expect(res.body.tokeninfo.service).to.be.a('string').to.equal('testservice');

				//
				// Check removing token
				//
				chai.request(app)
					.get(uri)
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant1)					// tenant1
					.end(function(err, res){
						expect(res).to.have.status(401);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.false;
						expect(res.body.message).to.have.string('token(');
						expect(res.body.message).to.have.string(') is not existed, because it is expired or not set yet.');

						// reset all token
						tokenutil.before(parentobj, alltokens, done);
					});
			});
	});

	//
	// Run Test(GET - ALL SERVICE RESOURCE - SUCCESS/FAILURE)
	//
	it('GET /v1/acr : failure get all resource for service(testservice) in tenant0 by not allowed client ip with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0
		uri		+= '?cip=127.0.0.1';													// cip:		127.0.0.1(not allowed ip)
		uri		+= '&cport=8000';														// cport:	8000
		uri		+= '&crole=yrn:yahoo:::tenant0:role:test_service_tenant';				// crole:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&ccuk=';															// ccuk:	null
		uri		+= '&sport=8000';														// sport:	8000
		uri		+= '&srole=yrn:yahoo:::tenant1:role:test_service_owner';				// srole:	yrn:yahoo:::tenant1:role:test_service_owner
		uri		+= '&scuk=';															// scuk:	null

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('client ip(127.0.0.1) and port(8000) and cuk(null) is not client role(yrn:yahoo:::tenant0:role:test_service_tenant) member.');

				done();
			});
	});

	it('GET /v1/acr : failure get all resource for service(testservice) in tenant0 without parameter(cip) with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0
		//																				// cip:		not set
		uri		+= '?cport=8000';														// cport:	8000
		uri		+= '&crole=yrn:yahoo:::tenant0:role:test_service_tenant';				// crole:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&ccuk=';															// ccuk:	null
		uri		+= '&sport=8000';														// sport:	8000
		uri		+= '&srole=yrn:yahoo:::tenant1:role:test_service_owner';				// srole:	yrn:yahoo:::tenant1:role:test_service_owner
		uri		+= '&scuk=';															// scuk:	null

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request or parameters are wrong');

				done();
			});
	});

	it('GET /v1/acr : failure get all resource for service(testservice) in tenant0 without parameter(crole) with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0
		uri		+= '?cip=127.1.0.1';													// cip:		127.1.0.1
		uri		+= '&cport=8000';														// cport:	8000
		//																				// crole:	not set
		uri		+= '&ccuk=';															// ccuk:	null
		uri		+= '&sport=8000';														// sport:	8000
		uri		+= '&srole=yrn:yahoo:::tenant1:role:test_service_owner';				// srole:	yrn:yahoo:::tenant1:role:test_service_owner
		uri		+= '&scuk=';															// scuk:	null

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request or parameters are wrong');

				done();
			});
	});

	it('GET /v1/acr : failure get all resource for service(testservice) in tenant0 without parameter(srole) with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0
		uri		+= '?cip=127.1.0.1';													// cip:		127.1.0.1
		uri		+= '&cport=8000';														// cport:	8000
		uri		+= '&crole=yrn:yahoo:::tenant0:role:test_service_tenant';				// crole:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&ccuk=';															// ccuk:	null
		uri		+= '&sport=8000';														// sport:	8000
		//																				// srole:	not set
		uri		+= '&scuk=';															// scuk:	null

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request or parameters are wrong');

				done();
			});
	});

	it('GET /v1/acr : get all resource for service(testservice) in tenant0 with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0
		uri		+= '?cip=127.1.0.1';													// cip:		127.1.0.1
		uri		+= '&cport=8000';														// cport:	8000
		uri		+= '&crole=yrn:yahoo:::tenant0:role:test_service_tenant';				// crole:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&ccuk=';															// ccuk:	null
		uri		+= '&sport=8000';														// sport:	8000
		uri		+= '&srole=yrn:yahoo:::tenant1:role:test_service_owner';				// srole:	yrn:yahoo:::tenant1:role:test_service_owner
		uri		+= '&scuk=';															// scuk:	null

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resources).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.resources[0]).to.be.an('object');
				expect(res.body.resources[0].name).to.be.a('string').to.equal('test_service_resource');
				expect(res.body.resources[0].type).to.be.a('string').to.equal('string');
				expect(res.body.resources[0].data).to.be.a('string').to.equal('test service in tenant resource data for debug');
				expect(res.body.resources[0].keys).to.be.an('object');
				expect(res.body.resources[0].keys.test_service_key).to.equal('test_service_value');

				done();
			});
	});

	it('GET /v1/acr : get all resource for service(testservice) in tenant0 without parameter(cport,ccuk) with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0
		uri		+= '?cip=127.1.0.1';													// cip:		127.1.0.1
		//																				// cport:	not set
		uri		+= '&crole=yrn:yahoo:::tenant0:role:test_service_tenant';				// crole:	yrn:yahoo:::tenant0:role:test_service_tenant
		//																				// ccuk:	not set
		uri		+= '&sport=8000';														// sport:	8000
		uri		+= '&srole=yrn:yahoo:::tenant1:role:test_service_owner';				// srole:	yrn:yahoo:::tenant1:role:test_service_owner
		uri		+= '&scuk=';															// scuk:	null

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resources).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.resources[0]).to.be.an('object');
				expect(res.body.resources[0].name).to.be.a('string').to.equal('test_service_resource');
				expect(res.body.resources[0].type).to.be.a('string').to.equal('string');
				expect(res.body.resources[0].data).to.be.a('string').to.equal('test service in tenant resource data for debug');
				expect(res.body.resources[0].keys).to.be.an('object');
				expect(res.body.resources[0].keys.test_service_key).to.equal('test_service_value');

				done();
			});
	});

	it('GET /v1/acr : get all resource for service(testservice) in tenant0 without parameter(sport,scuk) with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0
		uri		+= '?cip=127.1.0.1';													// cip:		127.1.0.1
		uri		+= '&cport=8000';														// cport:	8000
		uri		+= '&crole=yrn:yahoo:::tenant0:role:test_service_tenant';				// crole:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&ccuk=';															// ccuk:	null
		//																				// sport:	not set
		uri		+= '&srole=yrn:yahoo:::tenant1:role:test_service_owner';				// srole:	yrn:yahoo:::tenant1:role:test_service_owner
		//																				// scuk:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resources).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.resources[0]).to.be.an('object');
				expect(res.body.resources[0].name).to.be.a('string').to.equal('test_service_resource');
				expect(res.body.resources[0].type).to.be.a('string').to.equal('string');
				expect(res.body.resources[0].data).to.be.a('string').to.equal('test service in tenant resource data for debug');
				expect(res.body.resources[0].keys).to.be.an('object');
				expect(res.body.resources[0].keys.test_service_key).to.equal('test_service_value');

				done();
			});
	});

	//
	// Run Test(DELETE - SUCCESS/FAILURE)
	//
	it('DELETE /v1/acr : delete not exist service(not_exist_service) in tenant0 by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/not_exist_service';												// path:	yrn:yahoo:not_exist_service::tenant0

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE /v1/acr : delete service(testservice) in tenant0 by another tenant scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)							// tenant1
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource under service
				//
				chai.request(app)
					.get('/v1/resource/test_service_resource?service=testservice&expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('test service in tenant resource data for debug');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({test_service_key: 'test_service_value'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/acr : delete service(testservice) in tenant0 by invalid scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_user_token')								// invalid user token
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('DELETE /v1/acr : delete service(testservice) in tenant0 by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource under service
				//
				chai.request(app)
					.get('/v1/resource/test_service_resource?service=testservice&expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(404);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.false;
						expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:testservice::tenant0:resource:test_service_resource');

						done();
					});
			});
	});

	//
	// Run Test(POST - SUCCESS/FAILURE)
	//
	it('(SERVICE POST FOR ACR TEST) /v1/service : create new service(acr_test_service) in tenant1 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		//
		// Create service with tenant1 owner
		//
		chai.request(app)
			.post('/v1/service')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)							// tenant1
			.send({
				name:	'acr_test_service',
				verify:	{																// verify = static resource
					name:	'acr_test_service_resource',
					expire:	null,
					type:	'string',
					data:	'test service resource data for acr test in tenant0 owner',
					keys:	{
						foo:	'bar'
					}
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Added tenant0 to service member
				//
				chai.request(app)
					.post('/v1/service/acr_test_service')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant1)					// tenant1
					.send({
						tenant:			'yrn:yahoo:::tenant0',							// tenant0
						clear_tenant:	false,
						verify:	{														// verify = static resource
							name:	'acr_test_service_resource',
							expire:	null,
							type:	'string',
							data:	'test service resource data for acr test in tenant0 owner',
							keys:	{
								foo:	'bar'
							}
						}
					})
					.end(function(err, res){
						expect(res).to.have.status(201);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');

						done();
					});
			});
	});

	it('POST /v1/acr : failure create service(acr_test_service) in tenant0 by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::tenant0

		chai.request(app)
			.post(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_scoped_token')								// invalid token
			.send('')																	// body is empty
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(invalid_scoped_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('POST /v1/acr : failure create service(not_exist_service) in tenant0 by scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/not_exist_service';												// path:	yrn:yahoo:not_exist_service::tenant0

		chai.request(app)
			.post(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send('')																	// body is empty
			.end(function(err, res){
				expect(res).to.have.status(403);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('key(yrn:yahoo::::service:not_exist_service:verify) does not have safe verify url nor JSON string : null');

				done();
			});
	});

	it('POST /v1/acr : create service(acr_test_service) in tenant0 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::tenant0

		chai.request(app)
			.post(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send('')																	// body is empty
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource under service
				//
				chai.request(app)
					.get('/v1/resource/acr_test_service_resource?service=acr_test_service&expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('test service resource data for acr test in tenant0 owner');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('POST /v1/acr : failure create service(acr_test_service) in tenant0 by invalid unscoped scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::tenant0

		chai.request(app)
			.post(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_scoped_token')								// invalid token
			.send({																		// tenant0
				tenant:	'tenant0'
			})
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(invalid_scoped_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('POST /v1/acr : failure create service(not_exist_service) in tenant0 by unscoped scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/not_exist_service';												// path:	yrn:yahoo:not_exist_service::tenant0

		chai.request(app)
			.post(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped user token
			.send({																		// tenant0
				tenant:	'tenant0'
			})
			.end(function(err, res){
				expect(res).to.have.status(403);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('key(yrn:yahoo::::service:not_exist_service:verify) does not have safe verify url nor JSON string : null');

				done();
			});
	});

	it('POST /v1/acr : failure create service(acr_test_service) in invalid tenant by unscoped scoped token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::invalid_tenant

		chai.request(app)
			.post(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped user token
			.send({																		// invalid tenant
				tenant:	'invalid_tenant'
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('user (dummyuser) is not member of tenant(invalid_tenant).');

				done();
			});
	});

	it('POST /v1/acr : create service(acr_test_service) in tenant0 by unscoped scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::tenant0

		chai.request(app)
			.post(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped user token
			.send({																		// tenant0
				tenant:	'tenant0'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource under service
				//
				chai.request(app)
					.get('/v1/resource/acr_test_service_resource?service=acr_test_service&expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('test service resource data for acr test in tenant0 owner');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('POST /v1/acr : create service(testservice) in tenant0 by scoped token with status 200(but error 401/403 in mocha)', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0

		chai.request(app)
			.post(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send('')																	// body is empty
			.end(function(err, res){
				//
				// [NOTE]
				// We could not check create service for tenant with mocha.
				// Because we could not get listening port before start test at loading test data
				// which had verify url.
				// Then we got connect error here.
				//
				expect(res.status).to.satisfy(function(status){
					return (status == 403 || status == 401);
				});
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string');
				expect(res.body.message).to.satisfy(function(message){
					return (-1 != message.indexOf('connect ECONNREFUSED') || -1 != message.indexOf('got error response for verify request by status=401') || -1 != message.indexOf('parameter is wrong : verifyurl='));
				});

				done();

				//
				// We expect following when it works.
				//
				//	expect(res).to.have.status(200);
				//	expect(res).to.be.json;
				//	expect(res.body).to.be.an('object');
				//	expect(res.body.result).to.be.a('boolean').to.be.true;
				//	expect(res.body.message).to.be.a('null');
				//
				//	//
				//	// Check resource under service
				//	//
				//	chai.request(app)
				//		.get('/v1/resource/test_service_resource?service=testservice&expand=false')
				//		.set('content-type', 'application/json')
				//		.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
				//		.end(function(err, res){
				//			expect(res).to.have.status(200);
				//			expect(res).to.be.json;
				//			expect(res.body).to.be.an('object');
				//			expect(res.body.result).to.be.a('boolean').to.be.true;
				//			expect(res.body.message).to.be.a('null');
				//			expect(res.body.resource).to.be.an('object');
				//			expect(res.body.resource.string).to.be.a('string').to.equal('test service in tenant resource data for debug');
				//			expect(res.body.resource.object).to.be.a('null');
				//			expect(res.body.resource.expire).to.be.a('null');
				//			expect(res.body.resource.keys).to.be.an('object').to.deep.equal({test_service_key: 'test_service_value'});
				//			expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
				//
				//			done();
				//		});
			});
	});

	//
	// Run Test(PUT - SUCCESS/FAILURE)
	//
	it('PUT /v1/acr : failure create service(acr_test_service) in tenant0 by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::tenant0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_scoped_token')								// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(invalid_scoped_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('PUT /v1/acr : failure create service(not_exist_service) in tenant0 by scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/not_exist_service';												// path:	yrn:yahoo:not_exist_service::tenant0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(403);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('key(yrn:yahoo::::service:not_exist_service:verify) does not have safe verify url nor JSON string : null');

				done();
			});
	});

	it('PUT /v1/acr : create service(acr_test_service) in tenant0 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::tenant0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource under service
				//
				chai.request(app)
					.get('/v1/resource/acr_test_service_resource?service=acr_test_service&expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('test service resource data for acr test in tenant0 owner');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('PUT /v1/acr : failure create service(acr_test_service) in tenant0 by invalid unscoped scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::tenant0
		uri		+= '?tenant=tenant0';													// tenant0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_scoped_token')								// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(invalid_scoped_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('PUT /v1/acr : failure create service(not_exist_service) in tenant0 by unscoped scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/not_exist_service';												// path:	yrn:yahoo:not_exist_service::tenant0
		uri		+= '?tenant=tenant0';													// tenant0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped user token
			.end(function(err, res){
				expect(res).to.have.status(403);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('key(yrn:yahoo::::service:not_exist_service:verify) does not have safe verify url nor JSON string : null');

				done();
			});
	});

	it('PUT /v1/acr : failure create service(acr_test_service) in invalid tenant by unscoped scoped token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::invalid_tenant
		uri		+= '?tenant=invalid_tenant';											// invalid tenant

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped user token
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('user (dummyuser) is not member of tenant(invalid_tenant).');

				done();
			});
	});

	it('PUT /v1/acr : create service(acr_test_service) in tenant0 by unscoped scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/acr_test_service';													// path:	yrn:yahoo:acr_test_service::tenant0
		uri		+= '?tenant=tenant0';													// tenant0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped user token
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource under service
				//
				chai.request(app)
					.get('/v1/resource/acr_test_service_resource?service=acr_test_service&expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('test service resource data for acr test in tenant0 owner');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('PUT /v1/acr : create service(testservice) in tenant0 by scoped token with status 200(but error 401/403 in mocha)', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/acr';
		uri		+= '/testservice';														// path:	yrn:yahoo:testservice::tenant0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				//
				// [NOTE]
				// We could not check create service for tenant with mocha.
				// Because we could not get listening port before start test at loading test data
				// which had verify url.
				// Then we got connect error here.
				//
				expect(res.status).to.satisfy(function(status){
					return (status == 403 || status == 401);
				});
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string');
				expect(res.body.message).to.satisfy(function(message){
					return (-1 != message.indexOf('connect ECONNREFUSED') || -1 != message.indexOf('got error response for verify request by status=401') || -1 != message.indexOf('parameter is wrong : verifyurl='));
				});

				done();

				//
				// We expect following when it works.
				//
				//	expect(res).to.have.status(200);
				//	expect(res).to.be.json;
				//	expect(res.body).to.be.an('object');
				//	expect(res.body.result).to.be.a('boolean').to.be.true;
				//	expect(res.body.message).to.be.a('null');
				//
				//	//
				//	// Check resource under service
				//	//
				//	chai.request(app)
				//		.get('/v1/resource/test_service_resource?service=testservice&expand=false')
				//		.set('content-type', 'application/json')
				//		.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
				//		.end(function(err, res){
				//			expect(res).to.have.status(200);
				//			expect(res).to.be.json;
				//			expect(res.body).to.be.an('object');
				//			expect(res.body.result).to.be.a('boolean').to.be.true;
				//			expect(res.body.message).to.be.a('null');
				//			expect(res.body.resource).to.be.an('object');
				//			expect(res.body.resource.string).to.be.a('string').to.equal('test service in tenant resource data for debug');
				//			expect(res.body.resource.object).to.be.a('null');
				//			expect(res.body.resource.expire).to.be.a('null');
				//			expect(res.body.resource.keys).to.be.an('object').to.deep.equal({test_service_key: 'test_service_value'});
				//			expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
				//
				//			done();
				//		});
			});
	});
});

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
