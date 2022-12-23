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
describe('API : SERVICE', function(){					// eslint-disable-line no-undef
	var	alltokens = {};

	//
	// Before in describe section
	//
	before(function(done){								// eslint-disable-line no-undef
		// Nothing to do
		tokenutil.before(this, alltokens, done);
	});

	//
	// After in describe section
	//
	after(function(){									// eslint-disable-line no-undef
		// Nothing to do
	});

	//
	// Run Test
	//
	// 1.1 add(or update if exists) a service.
	// 1.1.1 | name + verify(url(http))
	// 1.1.2 | name + verify(url(https))
	// 1.1.3 | name + verify(url(https+port))
	// 1.1.4 | name + verify(static_string)
	// 1.1.5 | name + verify(true)
	// 1.1.6 | name + verify(false)
	//
	// 1.1.1.1 POST /v1/service. short name + verify(url(http))
	it('POST /v1/service. service + verify(url(http))', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				name:'1.1.1.1',
				verify: 'http://localhost/service/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.1.1.2 POST /v1/service. full name + verify(url(http))
	it('POST /v1/service. service + verify(url(http))', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				name:'yrn:yahoo::::service:1.1.1.2',
				verify: 'http://localhost/service/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.1.2 POST /v1/service name + verify(url(https))
	it('POST /v1/service. name + verify(url(https))', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				name:'1.1.2',
				verify: 'https://localhost/service/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.1.3 POST /v1/service. name + verify(url(https+port))
	it('POST /v1/service. name + verify(url(https+port)))', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				name:'1.1.3',
				verify: 'https://localhost:4443/service/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.1.4 POST /v1/service. name + static_string
	it('POST /v1/service. name + static_string', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				name: '1.1.4',
				verify: 'static_string'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.1.5 POST /v1/service. name + verify(true)
	it('POST /v1/service. name + verify(true)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				name: '1.1.5',
				verify: true
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.1.6 POST /v1/service. name + verify(false)
	it('POST /v1/service. name + verify(false)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				name: '1.1.6',
				verify: false
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 1.2 update service membership.
	// 1.2.1 | a tenant + clear_tenant(true) + verify(url)
	// 1.2.2 | tenants + clear_tenant(true) + verify(url)
	// 1.2.3 | tenants + clear_tenant(false) + verify(url)
	// 1.2.4 | tenants + clear_tenant(false) + verify(url_http)
	// 1.2.5 | tenants + clear_tenant(false) + verify(url_http+port)
	// 1.2.6 | tenants + clear_tenant(false) + verify(static_string)
	// 1.2.7 | tenants + clear_tenant(false) + verify(false)
	//
	// 1.2.1 POST /v1/service/1.2.1 + a tenant + clear_tenant(true) + verify(url)
	// 1.2.1.1 POST /v1/service/1.2.1 + a tenant(short name) + clear_tenant(true) + verify(url)
	it('POST /v1/service/1.2.1.1 + tenant + clear_tenant(true) + verify(url)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/1.2.1.1')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: 'tenant1',
				clear_tenant: true ,
				verify: 'https://localhost/1.2.1.1/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.1.2. POST /v1/service/1.2.1.2 + a tenant(full name) + clear_tenant(true) + verify(url)
	it('POST /v1/service/1.2.1.2 + tenant + clear_tenant(true) + verify(url)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/yrn:yahoo::::service:1.2.1.2')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: 'yrn:yahoo:::tenant1',
				clear_tenant: true ,
				verify: 'https://localhost/1.2.1.2/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.2.1 POST /v1/service/1.2.2.1 + tenant(s)(short name) + clear_tenant(true) + verify(url)
	it('POST /v1/service/1.2.2.1 + tenant(s) + clear_tenant(true) + verify(url)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/1.2.2.1')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: ['tenant0', 'tenant1'],
				clear_tenant: true ,
				verify: 'https://localhost/1.2.2.1/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.2.2 POST /v1/service/1.2.2.2 + tenant(s)(full name) + clear_tenant(true) + verify(url)
	it('POST /v1/service/1.2.2.2 + tenant(s) + clear_tenant(true) + verify(url)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/yrn:yahoo::::service:1.2.2.2')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: ['yrn:yahoo:testservice::tenant0', 'yrn:yahoo:testservice::tenant1'],
				clear_tenant: true ,
				verify: 'https://localhost/1.2.2.2/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.3.1 POST /v1/service/1.2.3.1 + short tenant(s) + clear_tenant(false) + verify(url)
	it('POST /v1/service/1.2.3.1 + short tenant(s) + clear_tenant(false) + verify(url)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/1.2.3.1')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: ['tenant0', 'tenant1'],
				clear_tenant: false,
				verify: 'https://localhost/1.2.3.1/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.3.2 POST /v1/service/1.2.3.2 + full tenant(s) + clear_tenant(false) + verify(url)
	it('POST /v1/service/1.2.3.2 + full tenant(s) + clear_tenant(false) + verify(url)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/yrn:yahoo::::service:1.2.3.2')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: ['yrn:yahoo:::tenant0', 'yrn:yahoo:::tenant1', 'yrn:yahoo:::tenant2'],
				clear_tenant: false,
				verify: 'https://localhost/1.2.3.2/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.4 POST /v1/service/1.2.4 + tenant(s) + clear_tenant(false) + verify(url_http)
	it('POST /v1/service/1.2.4 + tenant(s) + clear_tenant(false) + verify(url_http)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/1.2.4')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: ['tenant0', 'tenant1'],
				clear_tenant: false,
				verify: 'http://localhost/1.2.4/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.5 POST /v1/service/1.2.5 + tenant(s) + clear_tenant(false) + verify(url_http+port)
	it('POST /v1/service/1.2.5 + tenant(s) + clear_tenant(false) + verify(url_http+port)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/1.2.5')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: ['tenant0','tenant1'],
				clear_tenant: false,
				verify: 'https://localhost:3000/1.2.5/verify'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.6 POST /v1/service/1.2.6 + tenant(s) + clear_tenant(false) + verify(static_string)
	it('POST /v1/service/1.2.6 + tenant(s) + clear_tenant(false) + verify(static_string)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/1.2.6')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				tenant: ['tenant0','tenant1'],
				clear_tenant: false,
				verify: 'testservice_verify_static_string'
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.2.7 POST /v1/service/1.2.7 + no tenant + clear_tenant(false) + verify(false)
	it('POST /v1/service/1.2.7 + no tenant + clear_tenant(false) + verify(false)', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/service/1.2.7')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.send({
				clear_tenant: false,
				verify: false
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// PUT is idempotent whereas POST is not idempotent.
	//
	// 2.1 add(or overwrite if exists) a service.
	// 2.1.1 | name + verify(url(http))
	// 2.1.2 | name + verify(url(https))
	// 2.1.3 | name + verify(url(https+port))
	// 2.1.4 | name + verify(static_string)
	// 2.1.5 | name + verify(true)
	// 2.1.6 | name + verify(false)
	//
	// 2.1.1 PUT /v1/service name + verify(url(http))
	it('PUT /v1/service. service + verify(url(http))', function(done){										// eslint-disable-line no-undef
		var json =  {
			name: '2.1.1',
			verify: 'http://localhost/service/verify'
		};
		var url = '/v1/service?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.1.2 PUT /v1/service name + verify(url(https))
	it('PUT /v1/service. name + verify(url(https))', function(done){										// eslint-disable-line no-undef
		var json = {
			name:'2.1.2',
			verify: 'https://localhost/service/verify'
		};
		var url = '/v1/service?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.1.3 PUT /v1/service. name + verify(url(https+port))
	it('PUT /v1/service. name + verify(url(https+port)))', function(done){										// eslint-disable-line no-undef
		var json = {
			name:'2.1.3',
			verify: 'https://localhost:4443/service/verify'
		};
		var url = '/v1/service?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.1.4 PUT /v1/service. name + static_string
	it('PUT /v1/service. name + static_string', function(done){										// eslint-disable-line no-undef
		var json = {
			name: '2.1.4',
			verify: 'static_string'
		};
		var url = '/v1/service?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.1.5 PUT /v1/service. name + verify(true)
	it('PUT /v1/service. name + verify(true)', function(done){										// eslint-disable-line no-undef
		var json = {
			name: '2.1.5',
			verify: true
		};
		var url = '/v1/service?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.1.6 PUT /v1/service. name + verify(false)
	it('PUT /v1/service. name + verify(false)', function(done){										// eslint-disable-line no-undef
		var json = {
			name: '2.1.6',
			verify: false
		};
		var url = '/v1/service?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 2.2 add(or overwrite if exists) a service.
	// 2.2.1 | a tenant + clear_tenant(true) + verify(url)
	// 2.2.2 | tenants + clear_tenant(true) + verify(url)
	// 2.2.3 | tenants + clear_tenant(false) + verify(url)
	// 2.2.4 | tenants + clear_tenant(false) + verify(url_http)
	// 2.2.5 | tenants + clear_tenant(false) + verify(url_http+port)
	// 2.2.6 | tenants + clear_tenant(false) + verify(static_string)
	// 2.2.7 | tenants + clear_tenant(false) + verify(false)
	//
	// 2.2.1 PUT /v1/service/testservice + tenant + clear_tenant(true) + verify(url)
	it('PUT /v1/service/testservice + tenant + clear_tenant(true) + verify(url)', function(done){										// eslint-disable-line no-undef
		var json = {
			tenant: 'tenant0',
			clear_tenant: true ,
			verify: 'https://localhost/testservice/verify'
		};
		var url = '/v1/service/testservice?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.2.2 PUT /v1/service/testservice + tenant(s) + clear_tenant(true) + verify(url)
	it('PUT /v1/service/testservice + tenant(s) + clear_tenant(true) + verify(url)', function(done){										// eslint-disable-line no-undef
		var json = {
			tenant: ['tenant1'],
			clear_tenant: true ,
			verify: 'https://localhost/testservice/verify'
		};
		var url = '/v1/service/testservice?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.2.3 PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url)
	it('PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url)', function(done){										// eslint-disable-line no-undef
		var json = {
			tenant: ['test_service_tenant123','test_service_456'],
			clear_tenant: false,
			verify: 'https://localhost/testservice/verify'
		};
		var url = '/v1/service/testservice?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.2.4 PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url_http)
	it('PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url_http)', function(done){										// eslint-disable-line no-undef
		var json = {
			tenant: ['test_service_tenant123','test_service_456'],
			clear_tenant: false,
			verify: 'http://localhost/testservice/verify'
		};
		var url = '/v1/service/testservice?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.2.5 PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url_http+port)
	it('PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url_http+port)', function(done){										// eslint-disable-line no-undef
		var json = {
			tenant: ['test_service_tenant123','test_service_456'],
			clear_tenant: false,
			verify: 'https://localhost:3000/testservice/verify'
		};
		var url = '/v1/service/testservice?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.2.6 PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(static_string)
	it('PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(static_string)', function(done){										// eslint-disable-line no-undef
		var json = {
			tenant: ['test_service_tenant123','test_service_456'],
			clear_tenant: false,
			verify: 'testservice_verify_static_string'
		};
		var url = '/v1/service/testservice?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 2.2.7 PUT /v1/service/testservice + no tenant + clear_tenant(false) + verify(false)
	it('PUT /v1/service/testservice + no tenant + clear_tenant(false) + verify(false)', function(done){										// eslint-disable-line no-undef
		var json = {
			verify: false
		};
		var url = '/v1/service/testservice?' + common.json2url(json);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 3.1 get a service.
	// 3.1.1 service
	// 3.1.2 service + tenant
	//
	// 3.1.1 GET /v1/service
	it('GET /v1/service. a service', function(done){										// eslint-disable-line no-undef
		var url = '/v1/service/testservice';
		chai.request(app)
			.get(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant1)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 3.1.2 GET /v1/service + tenant
	it('GET /v1/service. service', function(done){										// eslint-disable-line no-undef
		var url = '/v1/service/testservice?tenant=tenant0';
		chai.request(app)
			.get(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant1)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 4.1 head a service.
	// 4.1.1 service
	// 4.1.2 service + tenant
	//
	// 4.1.1 HEAD /v1/service
	it('HEAD /v1/service. service', function(done){										// eslint-disable-line no-undef
		var url = '/v1/service/testservice';
		chai.request(app)
			.get(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant1)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 4.1.2 HEAD /v1/service + tenant
	it('HEAD /v1/service. service + tenant', function(done){										// eslint-disable-line no-undef
		var url = '/v1/service/testservice?tenant=tenant0';
		chai.request(app)
			.get(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant1)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 5.1 delete a service and a tenant.
	// 5.1.1 service
	// 5.1.2 service + tenant
	//
	// 5.1.1 delete a tenant of a service.
	it('DELETE /v1/service. a tenant of a service.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/service/testservice?tenant=tenant0';
		chai.request(app)
			.delete(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant1)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);
				done();
			});
	});
	// 5.1.2 delete a service.
	it('DELETE /v1/service. a service.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/service/testservice';
		chai.request(app)
			.delete(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant1)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);
				done();
			});
	});
});

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
