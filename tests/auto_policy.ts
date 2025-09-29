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
export function registerPolicyTests(): void {

	//--------------------------------------------------------------
	// Main describe section
	//--------------------------------------------------------------
	describe('API : POLICY', function(){

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

		it('POST /v1/policy with status 201, allowing a full access policy.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case1',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					done();
				});
		});

		it('POST /v1/policy with status 201, allowing a read only access policy.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case2',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/policy with status 201, allowing a write only access policy.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case3',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/policy with status 201, allowing a no access policy.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case4',
						effect: 'allow',
						action:[],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/policy with status 201, denying a full access policy.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case5',
						effect: 'deny',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/policy with status 201, denying a read only access policy.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case6',
						effect: 'deny',
						action:[
							'yrn:yahoo::::action:read'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/policy with status 201, denying a write only access policy.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case7',
						effect: 'deny',
						action:[
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/policy with status 201, denying a no access policy.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case8',
						effect: 'deny',
						action:[],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('POST /v1/policy with invalid request header(no x-auth-token).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case1',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('There is no x-auth-token header');
					done();
				});
		});

		it('POST /v1/policy with invalid request header(broken x-auth-token).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', 'U=error_dummy_token')
				.set('content-type', 'application/json')
				.send({
					policy: {
						name:'post_case1',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(401);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');
					done();
				});
		});

		it('POST /v1/policy with invalid request body(no policy/name).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : undefined');
					done();
				});
		});

		it('POST /v1/policy with invalid request body(broken policy/name).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : ""');
					done();
				});
		});

		it('POST /v1/policy with invalid request body(policy/name is not a String).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: 1,
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : 1');
					done();
				});
		});

		it('POST /v1/policy without policy/effect.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.11.1',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('POST /v1/policy with invalid request body(broken policy/effect).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.11.2',
						effect: 'ok',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					done();
				});
		});

		it('POST /v1/policy with invalid request body(policy/effect is not a String).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.11.3',
						effect: 1,
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:effect field is wrong : 1');
					done();
				});
		});

		it('POST /v1/policy without policy/action.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.1',
						effect: 'allow',
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('POST /v1/policy with invalid request body(broken policy/action).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.2',
						effect: 'allow',
						action:[
							'ok'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					done();
				});
		});

		it('POST /v1/policy with invalid request body(policy/action is not an Array).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.3',
						effect: 'allow',
						action: 1,
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:action field is wrong : 1');
					done();
				});
		});

		it('POST /v1/policy without policy/resource.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.1',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('POST /v1/policy with invalid request body(broken policy/resource).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.2',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['not_found_resource'],
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					done();
				});
		});

		it('POST /v1/policy with invalid request body(policy/resource is not an Array).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.3',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:1,
						alias:[],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:resource field is wrong : 1');
					done();
				});
		});

		it('POST /v1/policy without policy/alias.', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.1',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('POST /v1/policy with invalid request body(broken policy/alias).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.2',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:['はろー、せかい'],
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					done();
				});
		});

		it('POST /v1/policy with invalid request body(policy/alias is not an Array).', function(done){
			request.execute(app)
				.post('/v1/policy')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.send({
					policy: {
						name: '1.12.3',
						effect: 'allow',
						action:[
							'yrn:yahoo::::action:read',
							'yrn:yahoo::::action:write'
						],
						resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
						alias:1,
						reference:'0',
					}
				})
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:alias field is wrong : 1');
					done();
				});
		});

		it('PUT /v1/policy with status 201, allowing a full access policy.', function(done){
			const	json = {
				policy: {
					name: 'put_case1',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					done();
				});
		});

		it('PUT /v1/policy with status 201, allowing a read only access policy.', function(done){
			const	json = {
				policy: {
					name:'put_case2',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

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

		it('PUT /v1/policy with status 201, allowing a write only access policy.', function(done){
			const	json = {
				policy: {
					name:'put_case3',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

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

		it('PUT /v1/policy with status 201, allowing a no access policy.', function(done){
			const	json = {
				policy: {
					name:'put_case4',
					effect: 'allow',
					action:[],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

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

		it('PUT /v1/policy with status 201, denying a full access policy.', function(done){
			const	json = {
				policy: {
					name:'put_case5',
					effect: 'deny',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

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

		it('PUT /v1/policy with status 201, denying a read access policy.', function(done){
			const	json = {
				policy: {
					name:'put_case6',
					effect: 'deny',
					action:[
						'yrn:yahoo::::action:read'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

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

		it('PUT /v1/policy with status 201, denying a write access policy.', function(done){
			const	json = {
				policy: {
					name:'put_case7',
					effect: 'deny',
					action:[
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

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

		it('PUT /v1/policy with status 201, denying a no access policy.', function(done){
			const	json = {
				policy: {
					name:'2.8',
					effect: 'deny',
					action:[],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

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

		it('PUT /v1/policy with invalid request header(no x-auth-token).', function(done){
			const	json = {
				policy: {
					name:'2.9.1',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('There is no x-auth-token header');
					done();
				});
		});

		it('PUT /v1/policy with invalid request header(broken x-auth-token).', function(done){
			const	json = {
				policy: {
					name:'2.9.2',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', 'U=error_dummy_token')
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(401);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(no policy/name).', function(done){
			const	json = {
				policy: {
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : undefined');
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(broken policy/name).', function(done){
			const	json = {
				policy: {
					name:'',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : ""');
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(policy/name is not a String).', function(done){
			const	json = {
				policy: {
					name:1,
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('PUT /v1/policy without policy/effect.', function(done){
			const	json = {
				policy: {
					name:'2.11.1',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(broken policy/effect).', function(done){
			const	json = {
				policy: {
					name:'2.11.2',
					effect: 'ok',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(policy/effect is not a String).', function(done){
			const	json = {
				policy: {
					name:'2.11.3',
					effect: 1,
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:effect field is wrong : "1"');
					done();
				});
		});

		it('PUT /v1/policy without policy/action.', function(done){
			const	json = {
				policy: {
					name:'2.12.1',
					effect: 'allow',
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(broken policy/action).', function(done){
			const	json = {
				policy: {
					name:'2.12.2',
					effect: 'allow',
					action:[
						'ok'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(policy/action is not an Array).', function(done){
			const	json = {
				policy: {
					name:'2.12.3',
					effect: 'deny',
					action: 1,
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:action field is wrong : "1"');
					done();
				});
		});

		it('PUT /v1/policy without policy/resource.', function(done){
			const	json = {
				policy: {
					name:'2.13.1',
					effect: 'allow',
					action:[],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(broken policy/resource).', function(done){
			const	json = {
				policy: {
					name:'2.13.2',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['not_found_resource'],
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(policy/resource is not an Array).', function(done){
			const	json = {
				policy: {
					name:'2.13.3',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:1,
					alias:[],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:resource field is wrong : "1"');
					done();
				});
		});

		it('PUT /v1/policy without policy/alias.', function(done){
			const	json = {
				policy: {
					name:'2.14.1',
					effect: 'allow',
					action:[
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.true;
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(broken policy/alias).', function(done){
			const	json = {
				policy: {
					name:'2.14.2',
					effect: 'allow',
					action:[],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:['はろー、せかい'],
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					done();
				});
		});

		it('PUT /v1/policy with invalid request body(policy/alias is not an Array).', function(done){
			const	json = {
				policy: {
					name:'2.14.3',
					effect: 'allow',
					action:[],
					resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
					alias:1,
					reference:'0',
				}
			};
			const	url = '/v1/policy?' + json2url(json.policy);

			request.execute(app)
				.put(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('policy:alias field is wrong : "1"');
					done();
				});
		});

		it('GET /v1/policy with status 200.', function(done){
			const	url = '/v1/policy/k2hr3_entest_str_pol_01';

			request.execute(app)
				.get(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					done();
				});
		});

		it('GET /v1/policy with a service with status 200.', function(done){
			const	url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';

			request.execute(app)
				.get(url)
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body.result).to.be.a('boolean').to.be.true;
					expect(res.body.message).to.be.a('null');
					expect(res.body.policy.effect).to.have.string('allow');
					expect(res.body.policy.action).to.have.lengthOf(1);
					expect(res.body.policy.action[0]).to.have.string('yrn:yahoo::::action:read');
					expect(res.body.policy.resource).to.have.lengthOf(1);
					expect(res.body.policy.resource[0]).to.have.string('yrn:yahoo:testservice::tenant0:resource:test_service_resource');
					expect(res.body.policy.condition).to.have.lengthOf(0);
					expect(res.body.policy.alias).to.have.lengthOf(0);
					expect(res.body.policy.reference).to.equal(0);
					done();
				});
		});

		it('GET /v1/policy with invalid request header(no x-auth-token).', function(done){
			const	url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';

			request.execute(app)
				.get(url)
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('There is no x-auth-token header');
					done();
				});
		});

		it('GET /v1/policy with invalid request header(broken x-auth-token).', function(done){
			const	url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';

			request.execute(app)
				.get(url)
				.set('x-auth-token', 'U=error_dummy_token')
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(401);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.result).to.be.a('boolean').to.be.false;
					expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');
					done();
				});
		});

		it('HEAD /v1/policy with a service with status 204.', function(done){
			const	url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy?tenant=tenant0&service=testservice&action=yrn:yahoo::::action:read&resource=yrn:yahoo:testservice::tenant0:resource:test_service_resource';

			request.execute(app)
				.head(url)
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(204);
					done();
				});
		});

		it('HEAD /v1/policy with a service with status 403 as unauthorized action.', function(done){
			const	url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy?tenant=tenant0&service=testservice&action=yrn:yahoo::::action:write&resource=yrn:yahoo:testservice::tenant0:resource:test_service_resource';

			request.execute(app)
				.head(url)
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(403);
					done();
				});
		});

		it('DELETE /v1/policy without token header.', function(done){
			const	url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';

			request.execute(app)
				.delete(url)
				.set('content-type', 'application/json')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					done();
				});
		});

		it('DELETE /v1/policy with invalid token.', function(done){
			const	url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';

			request.execute(app)
				.delete(url)
				.set('content-type', 'application/json')
				.set('x-auth-token', 'U=error_dummy_token')
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(401);
					done();
				});
		});

		it('DELETE /v1/policy against no existent policy.', function(done){
			const	url = '/v1/policy/yrn:oohay:hogeservice::tenant0:policy:acr-policy';

			request.execute(app)
				.delete(url)
				.set('content-type', 'application/json')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(204);
					done();
				});
		});

		it('DELETE /v1/policy tenant0\'s policy by tenant1', function(done){
			const	url = '/v1/policy/yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_01';

			request.execute(app)
				.delete(url)
				.set('content-type', 'application/json')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant1))
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(204);
					done();
				});
		});

		it('DELETE /v1/policy with valid token.', function(done){
			const	url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';

			request.execute(app)
				.delete(url)
				.set('content-type', 'application/json')
				.set('x-auth-token', apiutil.getSafeString(alltokens.scopedtoken.tenant0))
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
