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

import	apiutil								from '../src/lib/k2hr3apiutil';
import	* as tokenutil						from './auto_token_util';			// Token utility
import	{ app, expect, request, json2url }	from './auto_common';
import type { AllToken }					from './auto_token_util';

//
// Test in Register function
//
export function registerServiceTests(): void {

	//--------------------------------------------------------------
	// Main describe section
	//--------------------------------------------------------------
	describe('API : SERVICE', function(){

		const alltokens: AllToken = tokenutil.createAllToken();

		//
		// Before in describe section
		//
		before(function(done){
			// Nothing to do
			tokenutil.before(this, alltokens, done);
		});

		//
		// After in describe section
		//
		after(function(){
			// Nothing to do
		});

		//
		// Run Test
		//
		it('POST /v1/service. service + verify(url(http))', function(done){
			request.execute(app)
				.post('/v1/service')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					name:'1.1.1.1',
					verify: 'http://localhost/service/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service. service + verify(url(http))', function(done){
			request.execute(app)
				.post('/v1/service')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					name:'yrn:yahoo::::service:1.1.1.2',
					verify: 'http://localhost/service/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service. name + verify(url(https))', function(done){
			request.execute(app)
				.post('/v1/service')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					name:'1.1.2',
					verify: 'https://localhost/service/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service. name + verify(url(https+port)))', function(done){
			request.execute(app)
				.post('/v1/service')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					name:'1.1.3',
					verify: 'https://localhost:4443/service/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service. name + static_string', function(done){
			request.execute(app)
				.post('/v1/service')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					name: '1.1.4',
					verify: 'static_string'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service. name + verify(true)', function(done){
			request.execute(app)
				.post('/v1/service')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					name: '1.1.5',
					verify: true
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service. name + verify(false)', function(done){
			request.execute(app)
				.post('/v1/service')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					name: '1.1.6',
					verify: false
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.1.1 + tenant + clear_tenant(true) + verify(url)', function(done){
			request.execute(app)
				.post('/v1/service/1.2.1.1')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: 'tenant1',
					clear_tenant: true ,
					verify: 'https://localhost/1.2.1.1/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.1.2 + tenant + clear_tenant(true) + verify(url)', function(done){
			request.execute(app)
				.post('/v1/service/yrn:yahoo::::service:1.2.1.2')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: 'yrn:yahoo:::tenant1',
					clear_tenant: true ,
					verify: 'https://localhost/1.2.1.2/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.2.1 + tenant(s) + clear_tenant(true) + verify(url)', function(done){
			request.execute(app)
				.post('/v1/service/1.2.2.1')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: ['tenant0', 'tenant1'],
					clear_tenant: true ,
					verify: 'https://localhost/1.2.2.1/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.2.2 + tenant(s) + clear_tenant(true) + verify(url)', function(done){
			request.execute(app)
				.post('/v1/service/yrn:yahoo::::service:1.2.2.2')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: ['yrn:yahoo:testservice::tenant0', 'yrn:yahoo:testservice::tenant1'],
					clear_tenant: true ,
					verify: 'https://localhost/1.2.2.2/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.3.1 + short tenant(s) + clear_tenant(false) + verify(url)', function(done){
			request.execute(app)
				.post('/v1/service/1.2.3.1')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: ['tenant0', 'tenant1'],
					clear_tenant: false,
					verify: 'https://localhost/1.2.3.1/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.3.2 + full tenant(s) + clear_tenant(false) + verify(url)', function(done){
			request.execute(app)
				.post('/v1/service/yrn:yahoo::::service:1.2.3.2')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: ['yrn:yahoo:::tenant0', 'yrn:yahoo:::tenant1', 'yrn:yahoo:::tenant2'],
					clear_tenant: false,
					verify: 'https://localhost/1.2.3.2/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.4 + tenant(s) + clear_tenant(false) + verify(url_http)', function(done){
			request.execute(app)
				.post('/v1/service/1.2.4')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: ['tenant0', 'tenant1'],
					clear_tenant: false,
					verify: 'http://localhost/1.2.4/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.5 + tenant(s) + clear_tenant(false) + verify(url_http+port)', function(done){
			request.execute(app)
				.post('/v1/service/1.2.5')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: ['tenant0','tenant1'],
					clear_tenant: false,
					verify: 'https://localhost:3000/1.2.5/verify'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.6 + tenant(s) + clear_tenant(false) + verify(static_string)', function(done){
			request.execute(app)
				.post('/v1/service/1.2.6')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					tenant: ['tenant0','tenant1'],
					clear_tenant: false,
					verify: 'testservice_verify_static_string'
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/service/1.2.7 + no tenant + clear_tenant(false) + verify(false)', function(done){
			request.execute(app)
				.post('/v1/service/1.2.7')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					clear_tenant: false,
					verify: false
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service. service + verify(url(http))', function(done){
			const	json =  {
				name: '2.1.1',
				verify: 'http://localhost/service/verify'
			};
			const	url = '/v1/service?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service. name + verify(url(https))', function(done){
			const	json = {
				name:'2.1.2',
				verify: 'https://localhost/service/verify'
			};
			const	url = '/v1/service?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service. name + verify(url(https+port)))', function(done){
			const	json = {
				name:'2.1.3',
				verify: 'https://localhost:4443/service/verify'
			};
			const	url = '/v1/service?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service. name + static_string', function(done){
			const	json = {
				name: '2.1.4',
				verify: 'static_string'
			};
			const	url = '/v1/service?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service. name + verify(true)', function(done){
			const	json = {
				name: '2.1.5',
				verify: true
			};
			const	url = '/v1/service?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service. name + verify(false)', function(done){
			const	json = {
				name: '2.1.6',
				verify: false
			};
			const	url = '/v1/service?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service/testservice + tenant + clear_tenant(true) + verify(url)', function(done){
			const	json = {
				tenant: 'tenant0',
				clear_tenant: true ,
				verify: 'https://localhost/testservice/verify'
			};
			const	url = '/v1/service/testservice?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service/testservice + tenant(s) + clear_tenant(true) + verify(url)', function(done){
			const	json = {
				tenant: ['tenant1'],
				clear_tenant: true ,
				verify: 'https://localhost/testservice/verify'
			};
			const	url = '/v1/service/testservice?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url)', function(done){
			const	json = {
				tenant: ['test_service_tenant123','test_service_456'],
				clear_tenant: false,
				verify: 'https://localhost/testservice/verify'
			};
			const	url = '/v1/service/testservice?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url_http)', function(done){
			const	json = {
				tenant: ['test_service_tenant123','test_service_456'],
				clear_tenant: false,
				verify: 'http://localhost/testservice/verify'
			};
			const	url = '/v1/service/testservice?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(url_http+port)', function(done){
			const	json = {
				tenant: ['test_service_tenant123','test_service_456'],
				clear_tenant: false,
				verify: 'https://localhost:3000/testservice/verify'
			};
			const	url = '/v1/service/testservice?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service/testservice + tenant(s) + clear_tenant(false) + verify(static_string)', function(done){
			const	json = {
				tenant: ['test_service_tenant123','test_service_456'],
				clear_tenant: false,
				verify: 'testservice_verify_static_string'
			};
			const	url = '/v1/service/testservice?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('PUT /v1/service/testservice + no tenant + clear_tenant(false) + verify(false)', function(done){
			const	json = {
				verify: false
			};
			const	url = '/v1/service/testservice?' + json2url(json);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('GET /v1/service. a service', function(done){
			const	url = '/v1/service/testservice';

			request.execute(app)
				.get(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant1))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('GET /v1/service. service', function(done){
			const	url = '/v1/service/testservice?tenant=tenant0';

			request.execute(app)
				.get(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant1))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('HEAD /v1/service. service', function(done){
			const	url = '/v1/service/testservice';

			request.execute(app)
				.get(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant1))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('HEAD /v1/service. service + tenant', function(done){
			const	url = '/v1/service/testservice?tenant=tenant0';

			request.execute(app)
				.get(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant1))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('DELETE /v1/service. a tenant of a service.', function(done){
			const	url = '/v1/service/testservice?tenant=tenant0';

			request.execute(app)
				.delete(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant1))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(204);
					done();
				});
		});

		it('DELETE /v1/service. a service.', function(done){
			const	url = '/v1/service/testservice';

			request.execute(app)
				.delete(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant1))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(204);
					done();
				});
		});
	});
}

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
