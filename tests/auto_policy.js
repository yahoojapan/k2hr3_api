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
describe('API : POLICY', function(){					// eslint-disable-line no-undef
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

	// 1.1 POST /v1/policy, allowing a full access policy.
	it('POST /v1/policy with status 201, allowing a full access policy.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				done();
			});
	});
	// 1.2 POST /v1/policy, allowing a read only access policy.
	it('POST /v1/policy with status 201, allowing a read only access policy.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 1.3 POST /v1/policy, allowing a write only access policy.
	it('POST /v1/policy with status 201, allowing a write only access policy.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 1.4 POST /v1/policy, allowing a no access policy.
	it('POST /v1/policy with status 201, allowing a no access policy.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 1.5 POST /v1/policy, denying a full access policy.
	it('POST /v1/policy with status 201, denying a full access policy.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});
	// 1.6 POST /v1/policy, denying a read only access policy.
	it('POST /v1/policy with status 201, denying a read only access policy.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 1.7 POST /v1/policy, denying a write only access policy.
	it('POST /v1/policy with status 201, denying a write only access policy.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 1.8 POST /v1/policy, denying a no access policy.
	it('POST /v1/policy with status 201, denying a no access policy.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// Memo: Error Test Cases
	// POST /v1/policy
	// ----CASE----|----INPUT-------|----VALUE-----
	// 1.9         |x-auth-token    | (empty|broken value|invalid value data type)
	// 1.10        |policy/name     | (empty|broken value|invalid value data type)
	// 1.11        |policy/effect   | (empty|broken value|invalid value data type)
	// 1.12        |policy/action   | (empty|broken value|invalid value data type)
	// 1.13        |policy/resource | (empty|broken value|invalid value data type)
	// 1.14        |policy/alias    | (empty|broken value|invalid value data type)

	// 1.9.1 POST /v1/policy
	it('POST /v1/policy with invalid request header(no x-auth-token).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('There is no x-auth-token header');
				done();
			});
	});
	// 1.9.2 POST /v1/policy
	it('POST /v1/policy with invalid request header(broken x-auth-token).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
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
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');
				done();
			});
	});
	// 1.10.1 POST /v1/policy
	it('POST /v1/policy with invalid request body(no policy/name).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : undefined');
				done();
			});
	});
	// 1.10.2 POST /v1/policy
	it('POST /v1/policy with invalid request body(broken policy/name).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : ""');
				done();
			});
	});
	// 1.10.3 POST /v1/policy
	it('POST /v1/policy with invalid request body(policy/name is not a String).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : 1');
				done();
			});
	});
	// 1.11.1 POST /v1/policy
	it('POST /v1/policy without policy/effect.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 1.11.2 POST /v1/policy
	it('POST /v1/policy with invalid request body(broken policy/effect).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				done();
			});
	});
	// 1.11.3 POST /v1/policy
	it('POST /v1/policy with invalid request body(policy/effect is not a String).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:effect field is wrong : 1');
				done();
			});
	});
	// 1.12.1 POST /v1/policy
	it('POST /v1/policy without policy/action.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 1.12.2 POST /v1/policy
	it('POST /v1/policy with invalid request body(broken policy/action).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				done();
			});
	});
	// 1.12.3 POST /v1/policy
	it('POST /v1/policy with invalid request body(policy/action is not an Array).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:action field is wrong : 1');
				done();
			});
	});
	// 1.13.1 POST /v1/policy
	it('POST /v1/policy without policy/resource.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 1.13.2 POST /v1/policy
	it('POST /v1/policy with invalid request body(broken policy/resource).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				done();
			});
	});
	// 1.13.3 POST /v1/policy
	it('POST /v1/policy with invalid request body(policy/resource is not an Array).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:resource field is wrong : 1');
				done();
			});
	});
	// 1.14.1 POST /v1/policy
	it('POST /v1/policy without policy/alias.', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 1.14.2 POST /v1/policy
	it('POST /v1/policy with invalid request body(broken policy/alias).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				done();
			});
	});
	// 1.14.3 POST /v1/policy
	it('POST /v1/policy with invalid request body(policy/alias is not an Array).', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:alias field is wrong : 1');
				done();
			});
	});

	// 2.1 PUT /v1/policy, allowing a full access policy.
	it('PUT /v1/policy with status 201, allowing a full access policy.', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				done();
			});
	});

	// 2.2 PUT /v1/policy, allowing a read only access policy.
	it('PUT /v1/policy with status 201, allowing a read only access policy.', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
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

	// 2.3 PUT /v1/policy, allowing a write only access policy.
	it('PUT /v1/policy with status 201, allowing a write only access policy.', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
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

	// 2.4 PUT /v1/policy, allowing a no access policy.
	it('PUT /v1/policy with status 201, allowing a no access policy.', function(done){										// eslint-disable-line no-undef
		var json = {
			policy: {
				name:'put_case4',
				effect: 'allow',
				action:[],
				resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
				alias:[],
				reference:'0',
			}
		};
		var url = '/v1/policy?' + common.json2url(json.policy);
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

	// 2.5 PUT /v1/policy, denying a full access policy.
	it('PUT /v1/policy with status 201, denying a full access policy.', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
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

	// 2.6 PUT /v1/policy, denying a read only access policy.
	it('PUT /v1/policy with status 201, denying a read access policy.', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
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

	// 2.7 PUT /v1/policy, denying a write only access policy.
	it('PUT /v1/policy with status 201, denying a write access policy.', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
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

	// 2.8 PUT /v1/policy, denying a no access policy.
	it('PUT /v1/policy with status 201, denying a no access policy.', function(done){										// eslint-disable-line no-undef
		var json = {
			policy: {
				name:'2.8',
				effect: 'deny',
				action:[],
				resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
				alias:[],
				reference:'0',
			}
		};
		var url = '/v1/policy?' + common.json2url(json.policy);
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

	// Memo: Error Test Cases
	// PUT /v1/policy
	// ----CASE----|----INPUT-------|----VALUE-----
	// 2.9         |x-auth-token    | (empty|broken value|invalid value data type) 
	// 2.10        |policy/name     | (empty|broken value|invalid value data type)
	// 2.11        |policy/effect   | (empty|broken value|invalid value data type)
	// 2.12        |policy/action   | (empty|broken value|invalid value data type)
	// 2.13        |policy/resource | (empty|broken value|invalid value data type)
	// 2.14        |policy/alias    | (empty|broken value|invalid value data type)

	// 2.9.1 PUT /v1/policy
	it('PUT /v1/policy with invalid request header(no x-auth-token).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('There is no x-auth-token header');
				done();
			});
	});
	// 2.9.2 PUT /v1/policy
	it('PUT /v1/policy with invalid request header(broken x-auth-token).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', 'U=error_dummy_token')
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');
				done();
			});
	});
	// 2.10.1 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(no policy/name).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : undefined');
				done();
			});
	});
	// 2.10.2 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(broken policy/name).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:name field is wrong : ""');
				done();
			});
	});
	// 2.10.3 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(policy/name is not a String).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 2.11.1 PUT /v1/policy
	it('PUT /v1/policy without policy/effect.', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 2.11.2 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(broken policy/effect).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				done();
			});
	});
	// 2.11.3 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(policy/effect is not a String).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:effect field is wrong : "1"');
				done();
			});
	});
	// 2.12.1 PUT /v1/policy
	it('PUT /v1/policy without policy/action.', function(done){										// eslint-disable-line no-undef
		var json = {
			policy: {
				name:'2.12.1',
				effect: 'allow',
				resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
				alias:[],
				reference:'0',
			}
		};
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 2.12.2 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(broken policy/action).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				done();
			});
	});
	// 2.12.3 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(policy/action is not an Array).', function(done){										// eslint-disable-line no-undef
		var json = {
			policy: {
				name:'2.12.3',
				effect: 'deny',
				action: 1,
				resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
				alias:[],
				reference:'0',
			}
		};
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:action field is wrong : "1"');
				done();
			});
	});
	// 2.13.1 PUT /v1/policy
	it('PUT /v1/policy without policy/resource.', function(done){										// eslint-disable-line no-undef
		var json = {
			policy: {
				name:'2.13.1',
				effect: 'allow',
				action:[],
				alias:[],
				reference:'0',
			}
		};
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 2.13.2 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(broken policy/resource).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				done();
			});
	});
	// 2.13.3 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(policy/resource is not an Array).', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:resource field is wrong : "1"');
				done();
			});
	});
	// 2.14.1 PUT /v1/policy
	it('PUT /v1/policy without policy/alias.', function(done){										// eslint-disable-line no-undef
		var json = {
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
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				done();
			});
	});
	// 2.14.2 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(broken policy/alias).', function(done){										// eslint-disable-line no-undef
		var json = {
			policy: {
				name:'2.14.2',
				effect: 'allow',
				action:[],
				resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
				alias:['はろー、せかい'],
				reference:'0',
			}
		};
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				done();
			});
	});
	// 2.14.3 PUT /v1/policy
	it('PUT /v1/policy with invalid request body(policy/alias is not an Array).', function(done){										// eslint-disable-line no-undef
		var json = {
			policy: {
				name:'2.14.3',
				effect: 'allow',
				action:[],
				resource:['yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01'],
				alias:1,
				reference:'0',
			}
		};
		var url = '/v1/policy?' + common.json2url(json.policy);
		chai.request(app)
			.put(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('policy:alias field is wrong : "1"');
				done();
			});
	});

	// 3.1 GET /v1/policy without service.
	it('GET /v1/policy with status 200.', function(done){                                                                           // eslint-disable-line no-undef
		var url = '/v1/policy/k2hr3_entest_str_pol_01';
		chai.request(app)
			.get(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				done();
			});
	});

	// 3.2 GET /v1/policy with service.
	it('GET /v1/policy with a service with status 200.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';
		chai.request(app)
			.get(url)
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.set('content-type', 'application/json')
			.end(function(err, res){
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

	// 3.3.1 GET /v1/policy
	it('GET /v1/policy with invalid request header(no x-auth-token).', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';
		chai.request(app)
			.get(url)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('There is no x-auth-token header');
				done();
			});
	});
	// 3.3.2 GET /v1/policy
	it('GET /v1/policy with invalid request header(broken x-auth-token).', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';
		chai.request(app)
			.get(url)
			.set('x-auth-token', 'U=error_dummy_token')
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');
				done();
			});
	});
	
	// 4.1 HEAD /v1/policy with service.
	it('HEAD /v1/policy with a service with status 204.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy?tenant=tenant0&service=testservice&action=yrn:yahoo::::action:read&resource=yrn:yahoo:testservice::tenant0:resource:test_service_resource';
		chai.request(app)
			.head(url)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);
				done();
			});
	});

	// 4.2 HEAD /v1/policy with service.
	it('HEAD /v1/policy with a service with status 403 as unauthorized action.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy?tenant=tenant0&service=testservice&action=yrn:yahoo::::action:write&resource=yrn:yahoo:testservice::tenant0:resource:test_service_resource';
		chai.request(app)
			.head(url)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);
				done();
			});
	});

	// 5. DELETE /v1/policy
	it('DELETE /v1/policy without token header.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';
		chai.request(app)
			.delete(url)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				done();
			});
	});
	it('DELETE /v1/policy with invalid token.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';
		chai.request(app)
			.delete(url)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=error_dummy_token')
			.end(function(err, res){
				expect(res).to.have.status(401);
				done();
			});
	});
	it('DELETE /v1/policy against no existent policy.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:oohay:hogeservice::tenant0:policy:acr-policy';
		chai.request(app)
			.delete(url)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(204);
				done();
			});
	});
	it('DELETE /v1/policy tenant0\'s policy by tenant1', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_01';
		chai.request(app)
			.delete(url)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)
			.end(function(err, res){
				expect(res).to.have.status(204);
				done();
			});
	});
	it('DELETE /v1/policy with valid token.', function(done){										// eslint-disable-line no-undef
		var url = '/v1/policy/yrn:yahoo:testservice::tenant0:policy:acr-policy';
		chai.request(app)
			.delete(url)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
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
