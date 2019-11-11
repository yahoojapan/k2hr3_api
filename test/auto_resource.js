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
describe('API : RESOURCE', function(){					// eslint-disable-line no-undef
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
	// Run Test(POST - NEW SET - SUCCESS)
	//
	it('POST /v1/resource : set all new resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				resource: {
					name:	'autotest_post_dummy_resource1',							// path:	yrn:yahoo:::tenant0:resource:autotest_post_dummy_resource1
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					keys: {																// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					},
					alias: [															// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_post_dummy_resource1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('POST /v1/resource : set all new resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				resource: {
					name:	'autotest_post_dummy_resource2',							// path:	yrn:yahoo:::tenant0:resource:autotest_post_dummy_resource2
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					},
					keys: {																// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					},
					alias: [															// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_post_dummy_resource2?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	//
	// Run Test(POST - ALL SET - SUCCESS)
	//
	it('POST /v1/resource : set all resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				resource: {
					name:	'k2hr3_entest_obj_res_03',									// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					keys: {																// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					},
					alias: [															// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('POST /v1/resource : set all resource by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/k2hr3_entest_obj_res_03')								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.send({
				resource: {
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					},
					keys: {																// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					}
					//																	// alias:	can not specify aliases by role token, then not update this.
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('POST /v1/resource : set all resource by no token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03')	// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.send({
				resource: {
					port:	null,														// port:	null = 0 = any
					cuk:	null,														// cuk:		null
					role:	'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03',		// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					keys: {																// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					}
					//																	// alias:	can not specify aliases by role token, then not update this.
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'orange', fish: 'barracuda'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	//
	// Run Test(POST - A PART SET - SUCCESS)
	//
	it('POST /v1/resource : set obj value resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				resource: {
					name:	'k2hr3_entest_obj_res_03',									// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					}
					//																	// keys:	not set
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'orange', fish: 'barracuda'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('POST /v1/resource : set str value resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				resource: {
					name:	'k2hr3_entest_obj_res_03',									// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					//																	// keys:	not set
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'orange', fish: 'barracuda'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('POST /v1/resource : set keys resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				resource: {
					name:	'k2hr3_entest_obj_res_03',									// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
					//																	// type:	not set
					//																	// data:	not set
					keys: {																// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					}
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('POST /v1/resource : set aliases resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				resource: {
					name:	'k2hr3_entest_obj_res_03',									// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
					//																	// type:	not set
					//																	// data:	not set
					//																	// keys:	not set
					alias: [															// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('POST /v1/resource : set obj value resource by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/k2hr3_entest_obj_res_03')								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.send({
				resource: {
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					}
					//																	// keys:	not set
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('POST /v1/resource : set str value resource by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/k2hr3_entest_obj_res_03')								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.send({
				resource: {
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					//																	// keys:	not set
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('POST /v1/resource : set keys resource by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/k2hr3_entest_obj_res_03')								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.send({
				resource: {
					//																	// type:	not set
					//																	// data:	not set
					keys: {																// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					}
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('POST /v1/resource : set obj value resource by no token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03')	// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.send({
				resource: {
					port:	null,														// port:	null = 0 = any
					cuk:	null,														// cuk:		null
					role:	'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03',		// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					}
					//																	// keys:	not set
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('POST /v1/resource : set str value resource by no token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03')	// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.send({
				resource: {
					port:	null,														// port:	null = 0 = any
					cuk:	null,														// cuk:		null
					role:	'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03',		// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					//																	// keys:	not set
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('POST /v1/resource : set keys resource by no token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03')	// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.send({
				resource: {
					port:	null,														// port:	null = 0 = any
					cuk:	null,														// cuk:		null
					role:	'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03',		// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
					//																	// type:	not set
					//																	// data:	not set
					keys: {																// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					}
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'orange', fish: 'barracuda'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	//
	// Run Test(POST - FAILURE)
	//
	it('POST /v1/resource : failure set all resource by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=error_dummy_token')									// invalid token
			.send({
				resource: {
					name:	'k2hr3_entest_obj_res_03',									// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					keys: {																// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					},
					alias: [															// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]
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

	it('POST /v1/resource : failure set invalid resource by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				wrong_key: {															// wrong main key
					name:	'k2hr3_entest_obj_res_03',									// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					keys: {																// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					},
					alias: [															// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST body does not have resource data');

				done();
			});
	});

	it('POST /v1/resource : failure set all resource by invalid role token with status 401', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/k2hr3_entest_obj_res_03')								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=error_dummy_token')									// invalid token
			.send({
				resource: {
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					},
					keys: {																// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					}
					//																	// alias:	can not specify aliases by role token, then not update this.
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

	it('POST /v1/resource : failure set all resource by not allowed role token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/k2hr3_entest_obj_res_03')								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_str_res_01)
			.send({
				resource: {
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					},
					keys: {																// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					}
					//																	// alias:	can not specify aliases by role token, then not update this.
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('could not create resource("k2hr3_entest_obj_res_03") for tenant(tenant0), role(k2hr3_entest_str_role_01)');

				done();
			});
	});

	it('POST /v1/resource : failure set invalid resource by not allowed role token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/k2hr3_entest_obj_res_03')								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.send({
				wrong_key: {															// wrong main key
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					},
					keys: {																// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					}
					//																	// alias:	can not specify aliases by role token, then not update this.
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST body does not have resource data');

				done();
			});
	});

	it('POST /v1/resource : failure set alias resource by role token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/k2hr3_entest_obj_res_03')								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.send({
				resource: {
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					},
					keys: {																// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					},
					alias: [															// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST resource:alias field is specified, but it is not allowed by not user token : ["yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3","yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4"]');

				done();
			});
	});

	it('POST /v1/resource : failure set all resource by no token(not allowed 127.0.0.1) with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03')	// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.send({
				resource: {
					port:	null,														// port:	null = 0 = any
					cuk:	null,														// cuk:		null
					role:	'yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03',		// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (127.0.0.1 is not this role member)
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					keys: {																// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					}
					//																	// alias:	can not specify aliases by no token, then not update this.
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('ip:port(127.0.0.1:0) is not role(yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03) member.');

				done();
			});
	});

	it('POST /v1/resource : failure set invalid resource by no token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03')	// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.send({
				wrong_key: {															// wrong main key
					port:	null,														// port:	null = 0 = any
					cuk:	null,														// cuk:		null
					role:	'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03',		// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					keys: {																// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					}
					//																	// alias:	can not specify aliases by no token, then not update this.
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST body does not have resource data');

				done();
			});
	});

	it('POST /v1/resource : failure set alias resource by no token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/resource/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03')	// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
			.set('content-type', 'application/json')
			.send({
				resource: {
					port:	null,														// port:	null = 0 = any
					cuk:	null,														// cuk:		null
					role:	'yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03',		// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
					type:	'string',													// type:	string
					data:	'autotest_post:string:value',								// data:	dummy string
					keys: {																// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					},
					alias: [															// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST resource:alias field is specified, but it is not allowed by not user token : ["yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3","yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4"]');

				done();
			});
	});

	//
	// Run Test(PUT - NEW SET - SUCCESS)
	//
	it('PUT /v1/resource : set all new resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_post_dummy_resource3';								// path:	yrn:yahoo:::tenant0:resource:autotest_post_dummy_resource3
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_post_dummy_resource3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('PUT /v1/resource : set all new resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_post_dummy_resource4';								// path:	yrn:yahoo:::tenant0:resource:autotest_post_dummy_resource4
		uri		+= '&type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify({											// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					});
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_post_dummy_resource4?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	//
	// Run Test(PUT - ALL SET - SUCCESS)
	//
	it('PUT /v1/resource : set all resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=k2hr3_entest_obj_res_03';										// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('PUT /v1/resource : set all resource by role token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource/k2hr3_entest_obj_res_03';								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify({											// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					});
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					});
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('PUT /v1/resource : set all resource by no token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';	// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					});
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'orange', fish: 'barracuda'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	//
	// Run Test(PUT - A PART SET - SUCCESS)
	//
	it('PUT /v1/resource : set obj value resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=k2hr3_entest_obj_res_03';										// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '&type=object';														// type:	string
		uri		+= '&data=' + JSON.stringify({											// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					});
																						// keys:	not set
																						// alias:	not set
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'orange', fish: 'barracuda'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('PUT /v1/resource : set str value resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '?name=k2hr3_entest_obj_res_03';										// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		//																				// keys:	not set
		//																				// alias:	not set

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
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'orange', fish: 'barracuda'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('PUT /v1/resource : set keys resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=k2hr3_entest_obj_res_03';										// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
																						// type:	not set
																						// data:	not set
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					});
																						// alias:	not set
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2');

						done();
					});
			});
	});

	it('PUT /v1/resource : set aliases resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=k2hr3_entest_obj_res_03';										// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
																						// type:	not set
																						// data:	not set
																						// keys:	not set
		uri		+= '&alias=' + JSON.stringify([											// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('PUT /v1/resource : set obj value resource by role token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify({											// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					});
																						// keys:	not set
																						// alias:	not set
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.send({
				resource: {
					type:	'object',													// type:	object
					data: {																// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					}
					//																	// keys:	not set
					//																	// alias:	not set
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('PUT /v1/resource : set str value resource by role token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		//																				// keys:	not set
		//																				// alias:	not set

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({foo: 'bar', hoge: 'fuga'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('PUT /v1/resource : set keys resource by role token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
																						// type:	not set
																						// data:	not set
		uri		+= '?keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					});
																						// alias:	not set
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('PUT /v1/resource : set obj value resource by no token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
		uri		+= '&type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify({											// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					});
																						// keys:	not set
																						// alias:	not set
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({autotest_post_obj_key1: 'autotest_post_obj_val1', autotest_post_obj_key2: 'autotest_post_obj_val2'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('PUT /v1/resource : set str value resource by no token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		//																				// keys:	not set
		//																				// alias:	not set

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'apple', fish: 'tuna'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	it('PUT /v1/resource : set keys resource by no token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
																						// type:	not set
																						// data:	not set
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					});
																						// alias:	not set
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_post:string:value');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({fruits: 'orange', fish: 'barracuda'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4');

						done();
					});
			});
	});

	//
	// Run Test(PUT - FAILURE)
	//
	it('PUT /v1/resource : failure set all resource by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=k2hr3_entest_obj_res_03';										// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=error_dummy_token')									// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('PUT /v1/resource : failure set invalid resource by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?wrong_name=k2hr3_entest_obj_res_03';								// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						foo:	'bar',
						hoge:	'fuga'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias2'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Default resource name is not specified or wrong value : null');

				done();
			});
	});

	it('PUT /v1/resource : failure set all resource by invalid role token with status 401', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify({											// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					});
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					});
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=error_dummy_token')									// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('PUT /v1/resource : failure set all resource by not allowed role token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify({											// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					});
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					});
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('could not create resource("k2hr3_entest_obj_res_03") for tenant(tenant0), role(k2hr3_entest_str_role_01)');

				done();
			});
	});

	it('PUT /v1/resource : failure set alias resource by role token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify({											// data:	dummy object value
						autotest_post_obj_key1:	'autotest_post_obj_val1',
						autotest_post_obj_key2:	'autotest_post_obj_val2'
					});
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'apple',
						fish:	'tuna'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('PUT resource:alias field is specified, but it is not allowed by not user token : "[\\"yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3\\",\\"yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4\\"]"');

				done();
			});
	});

	it('PUT /v1/resource : failure set all resource by no token(not allowed 127.0.0.1) with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (127.0.0.1 is not this role member)
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					});
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('ip:port(127.0.0.1:0) is not role(yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03) member.');

				done();
			});
	});

	it('PUT /v1/resource : failure set invalid resource yrn path by no token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	not yrn full path
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					});
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Request query does not have yrn full path to resource');

				done();
			});
	});

	it('PUT /v1/resource : failure set alias resource by no token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_post:string:value');				// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	2 dummy objects
						fruits:	'orange',
						fish:	'barracuda'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	2 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('PUT resource:alias field is specified, but it is not allowed by not user token : "[\\"yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias3\\",\\"yrn:yahoo:::tenant0:resource:autotest_post_dummy_alias4\\"]"');

				done();
			});
	});

	it('POST(DATA RESTORE) /v1/resource : set all resource by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			/* eslint-disable indent, no-mixed-spaces-and-tabs */
			.post('/v1/resource')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				resource: {
					name:	'k2hr3_entest_obj_res_03',									// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
					type:	'object',													// type:	object
					data: {																// data:	object
						k2hr3_entest_obj_res_03_value_key:	'k2hr3_entest_obj_res_03_value_val'
					},
					keys: {																// keys:	3 keys
						k2hr3_entest_obj_res_03_keys_key:	'k2hr3_entest_obj_res_03_keys_val',
						k2hr3_entest_obj_res_03_keys_arr:	[
																'k2hr3_entest_obj_res_03_keys_arr_val00',
																'k2hr3_entest_obj_res_03_keys_arr_val01'
															],
						k2hr3_entest_obj_res_03_keys_obj:	{
																k2hr3_entest_obj_res_03_keys_obj_key00:	'k2hr3_entest_obj_res_03_keys_obj_val00',
																k2hr3_entest_obj_res_03_keys_obj_key01:	'k2hr3_entest_obj_res_03_keys_obj_val01'
															}
					},
					alias:	[]															// alias:	n/a
				}
			/* eslint-enable indent, no-mixed-spaces-and-tabs */
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/k2hr3_entest_obj_res_03?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_value_key: 'k2hr3_entest_obj_res_03_value_val'});
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_keys_key: 'k2hr3_entest_obj_res_03_keys_val', k2hr3_entest_obj_res_03_keys_arr: ['k2hr3_entest_obj_res_03_keys_arr_val00', 'k2hr3_entest_obj_res_03_keys_arr_val01'], k2hr3_entest_obj_res_03_keys_obj: {k2hr3_entest_obj_res_03_keys_obj_key00: 'k2hr3_entest_obj_res_03_keys_obj_val00', k2hr3_entest_obj_res_03_keys_obj_key01:	'k2hr3_entest_obj_res_03_keys_obj_val01'}});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	//
	// Run Test(GET - SUCCESS)
	//
	it('GET /v1/resource : get not expanded resource(k2hr3_entest_str_res_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal('{{#!k2hr3template}};###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name%["host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name%["host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip%["127.10.10.10,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip%["127.3.1.0,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip%["127.3.1.1,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]={{=%tmpval%["host"]}}');
				expect(res.body.resource.object).to.be.a('null');
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_key: 'k2hr3_entest_str_res_03_keys_val', k2hr3_entest_str_res_03_keys_arr: ['k2hr3_entest_str_res_03_keys_arr_val00', 'k2hr3_entest_str_res_03_keys_arr_val01'], k2hr3_entest_str_res_03_keys_obj: {k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'}});
				expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

				done();
			});
	});

	it('GET /v1/resource : get expanded resource(k2hr3_entest_str_res_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?expand=true';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');
				expect(res.body.resource.object).to.be.a('null');
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_key: 'k2hr3_entest_str_res_03_keys_val', k2hr3_entest_str_res_03_keys_arr: ['k2hr3_entest_str_res_03_keys_arr_val00', 'k2hr3_entest_str_res_03_keys_arr_val01'], k2hr3_entest_str_res_03_keys_obj: {k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01:'k2hr3_entest_str_res_03_keys_obj_val01'}, tmpval: {cuk: null, extra: null, host:'127.3.1.1', port:0}});
				expect(res.body.resource.aliases).to.be.undefined;

				done();
			});
	});

	it('GET /v1/resource : get not expanded resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		// for too long string
		var	result_string_array = [
			'{{#!k2hr3template}};',
			'###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02###;',
			'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key={{=%k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key%}};',
			'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr[0]={{=%k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr%[0]}};',
			'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr[1]={{=%k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr%[1]}};',
			'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj.k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00={{=%k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj%{\'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key00\'}+\'_dummy\'}};',
			'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj.k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01={{=%k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj%{\'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key01\'}+\'_dummy\'}};',
			'###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;',
			'k2hr3_entest_str_res_03_keys_key={{=%k2hr3_entest_str_res_03_keys_key%}};',
			'k2hr3_entest_str_res_03_keys_arr[0]={{=%k2hr3_entest_str_res_03_keys_arr%[0]}};',
			'k2hr3_entest_str_res_03_keys_arr[1]={{=%k2hr3_entest_str_res_03_keys_arr%[1]}};',
			'k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00={{=%k2hr3_entest_str_res_03_keys_obj%{\'k2hr3_entest_str_res_03_keys_obj_key00\'}+\'_dummy\'}};',
			'k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01={{=%k2hr3_entest_str_res_03_keys_obj%{\'k2hr3_entest_str_res_03_keys_obj_key01\'}+\'_dummy\'}};',
			'###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/host(ip)###;',
			'{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name%["host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[0]={{=%tmpval%["host"]}};',
			'{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name%["host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[1]={{=%tmpval%["host"]}};',
			'{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name%["host01.k2hr3_entest_str_02.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[2]={{=%tmpval%["host"]}};',
			'{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name%["host02.k2hr3_entest_str_02.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[3]={{=%tmpval%["host"]}};',
			'{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip%["127.10.10.10,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[0]={{=%tmpval%["host"]}};',
			'{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip%["127.3.1.0,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[1]={{=%tmpval%["host"]}};',
			'{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip%["127.3.1.1,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[2]={{=%tmpval%["host"]}};',
			'{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip%["127.1.1.0,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[3]={{=%tmpval%["host"]}}'
		];
		var	result_string = result_string_array.join('');

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal(result_string);
				expect(res.body.resource.object).to.be.a('null');
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_val', 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr': ['k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val00', 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val01'], 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj': {'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key00': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00', 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key01': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01'}});
				expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03');

				done();
			});
	});

	it('GET /v1/resource : get expanded resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?expand=true';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01###;k2hr3_entest_str_res_01_keys_key=k2hr3_entest_str_res_01_keys_val;k2hr3_entest_str_res_01_keys_arr[0]=k2hr3_entest_str_res_01_keys_arr_val00;k2hr3_entest_str_res_01_keys_arr[1]=k2hr3_entest_str_res_01_keys_arr_val01;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val00=k2hr3_entest_str_res_01_keys_obj_val00_dummy;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val01=k2hr3_entest_str_res_01_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[2]=host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[3]=host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[3]=127.0.1.0;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02###;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_val;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr[0]=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val00;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr[1]=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val01;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj.k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00_dummy;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj.k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[2]=host01.k2hr3_entest_str_02.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[3]=host02.k2hr3_entest_str_02.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[3]=127.1.1.0');
				expect(res.body.resource.object).to.be.a('null');
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_key: 'k2hr3_entest_str_res_03_keys_val', k2hr3_entest_str_res_03_keys_arr: ['k2hr3_entest_str_res_03_keys_arr_val00', 'k2hr3_entest_str_res_03_keys_arr_val01'], k2hr3_entest_str_res_03_keys_obj: {'k2hr3_entest_str_res_03_keys_obj_key00': 'k2hr3_entest_str_res_03_keys_obj_val00', 'k2hr3_entest_str_res_03_keys_obj_key01': 'k2hr3_entest_str_res_03_keys_obj_val01'}, k2hr3_entest_str_res_01_keys_key: 'k2hr3_entest_str_res_01_keys_val', k2hr3_entest_str_res_01_keys_arr: ['k2hr3_entest_str_res_01_keys_arr_val00', 'k2hr3_entest_str_res_01_keys_arr_val01'], k2hr3_entest_str_res_01_keys_obj: {'k2hr3_entest_str_res_01_keys_obj_key00': 'k2hr3_entest_str_res_01_keys_obj_val00', 'k2hr3_entest_str_res_01_keys_obj_key01': 'k2hr3_entest_str_res_01_keys_obj_val01'}, 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_val', 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr': ['k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val00', 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val01'], 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj': {'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key00': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00', 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key01': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01'}, 'tmpval': {'cuk': null, 'extra': null, 'host': '127.1.1.0', 'port': 0}});
				expect(res.body.resource.aliases).to.be.undefined;

				done();
			});
	});

	it('GET /v1/resource : get not expanded resource(k2hr3_entest_str_res_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal('{{#!k2hr3template}};###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01###;k2hr3_entest_str_res_01_keys_key={{=%k2hr3_entest_str_res_01_keys_key%}};k2hr3_entest_str_res_01_keys_arr[0]={{=%k2hr3_entest_str_res_01_keys_arr%[0]}};k2hr3_entest_str_res_01_keys_arr[1]={{=%k2hr3_entest_str_res_01_keys_arr%[1]}};k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val00={{=%k2hr3_entest_str_res_01_keys_obj%{\'k2hr3_entest_str_res_01_keys_obj_key00\'}+\'_dummy\'}};k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val01={{=%k2hr3_entest_str_res_01_keys_obj%{\'k2hr3_entest_str_res_01_keys_obj_key01\'}+\'_dummy\'}};###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key={{=%k2hr3_entest_str_res_03_keys_key%}};k2hr3_entest_str_res_03_keys_arr[0]={{=%k2hr3_entest_str_res_03_keys_arr%[0]}};k2hr3_entest_str_res_03_keys_arr[1]={{=%k2hr3_entest_str_res_03_keys_arr%[1]}};k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00={{=%k2hr3_entest_str_res_03_keys_obj%{\'k2hr3_entest_str_res_03_keys_obj_key00\'}+\'_dummy\'}};k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01={{=%k2hr3_entest_str_res_03_keys_obj%{\'k2hr3_entest_str_res_03_keys_obj_key01\'}+\'_dummy\'}};###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/host(ip)###;{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name%["host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[0]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name%["host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[1]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name%["host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[2]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name%["host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[3]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip%["127.10.10.10,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[0]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip%["127.3.1.0,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[1]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip%["127.3.1.1,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[2]={{=%tmpval%["host"]}};{{%tmpval%=%yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip%["127.0.1.0,0,"]}}yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[3]={{=%tmpval%["host"]}}');
				expect(res.body.resource.object).to.be.a('null');
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_01_keys_key: 'k2hr3_entest_str_res_01_keys_val', k2hr3_entest_str_res_01_keys_arr: ['k2hr3_entest_str_res_01_keys_arr_val00', 'k2hr3_entest_str_res_01_keys_arr_val01'], k2hr3_entest_str_res_01_keys_obj: {k2hr3_entest_str_res_01_keys_obj_key00: 'k2hr3_entest_str_res_01_keys_obj_val00', k2hr3_entest_str_res_01_keys_obj_key01: 'k2hr3_entest_str_res_01_keys_obj_val01'}});
				expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03');

				done();
			});
	});

	it('GET /v1/resource : get expanded resource(k2hr3_entest_str_res_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?expand=true';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01###;k2hr3_entest_str_res_01_keys_key=k2hr3_entest_str_res_01_keys_val;k2hr3_entest_str_res_01_keys_arr[0]=k2hr3_entest_str_res_01_keys_arr_val00;k2hr3_entest_str_res_01_keys_arr[1]=k2hr3_entest_str_res_01_keys_arr_val01;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val00=k2hr3_entest_str_res_01_keys_obj_val00_dummy;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val01=k2hr3_entest_str_res_01_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[2]=host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[3]=host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[3]=127.0.1.0');
				expect(res.body.resource.object).to.be.a('null');
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_01_keys_key: 'k2hr3_entest_str_res_01_keys_val', k2hr3_entest_str_res_01_keys_arr: ['k2hr3_entest_str_res_01_keys_arr_val00', 'k2hr3_entest_str_res_01_keys_arr_val01'], k2hr3_entest_str_res_01_keys_obj: {k2hr3_entest_str_res_01_keys_obj_key00: 'k2hr3_entest_str_res_01_keys_obj_val00', k2hr3_entest_str_res_01_keys_obj_key01: 'k2hr3_entest_str_res_01_keys_obj_val01'}, k2hr3_entest_str_res_03_keys_key: 'k2hr3_entest_str_res_03_keys_val', k2hr3_entest_str_res_03_keys_arr: ['k2hr3_entest_str_res_03_keys_arr_val00', 'k2hr3_entest_str_res_03_keys_arr_val01'], k2hr3_entest_str_res_03_keys_obj: {k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'}, 'tmpval': {'cuk': null, 'extra': null, 'host': '127.0.1.0', 'port': 0}});
				expect(res.body.resource.aliases).to.be.undefined;

				done();
			});
	});

	it('GET /v1/resource : get not expanded resource(k2hr3_entest_obj_res_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('null');
				expect(res.body.resource.object).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_value_key: 'k2hr3_entest_obj_res_03_value_val'});
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_keys_key: 'k2hr3_entest_obj_res_03_keys_val', k2hr3_entest_obj_res_03_keys_arr: ['k2hr3_entest_obj_res_03_keys_arr_val00', 'k2hr3_entest_obj_res_03_keys_arr_val01'], k2hr3_entest_obj_res_03_keys_obj: {k2hr3_entest_obj_res_03_keys_obj_key00: 'k2hr3_entest_obj_res_03_keys_obj_val00', k2hr3_entest_obj_res_03_keys_obj_key01: 'k2hr3_entest_obj_res_03_keys_obj_val01'}});
				expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

				done();
			});
	});

	it('GET /v1/resource : get expanded resource(k2hr3_entest_obj_res_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?expand=true';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('null');
				expect(res.body.resource.object).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_value_key: 'k2hr3_entest_obj_res_03_value_val'});
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_keys_key: 'k2hr3_entest_obj_res_03_keys_val', k2hr3_entest_obj_res_03_keys_arr: ['k2hr3_entest_obj_res_03_keys_arr_val00', 'k2hr3_entest_obj_res_03_keys_arr_val01'], k2hr3_entest_obj_res_03_keys_obj: {k2hr3_entest_obj_res_03_keys_obj_key00: 'k2hr3_entest_obj_res_03_keys_obj_val00', k2hr3_entest_obj_res_03_keys_obj_key01: 'k2hr3_entest_obj_res_03_keys_obj_val01'}});
				expect(res.body.resource.aliases).to.be.undefined;

				done();
			});
	});

	it('GET /v1/resource : get not expanded resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('null');
				expect(res.body.resource.object).to.be.an('object').to.deep.equal({'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_value_key': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_value_val'});
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_val', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr': ['k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr_val00', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr_val01'], 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj': {'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_key00': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_val00', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_key01': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_val01'}});
				expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03');

				done();
			});
	});

	it('GET /v1/resource : get expanded resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?expand=true';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');
				expect(res.body.resource.object).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_value_key: 'k2hr3_entest_obj_res_01_value_val', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_value_key': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_value_val'});
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_keys_key: 'k2hr3_entest_obj_res_01_keys_val', k2hr3_entest_obj_res_01_keys_arr: ['k2hr3_entest_obj_res_01_keys_arr_val00', 'k2hr3_entest_obj_res_01_keys_arr_val01'], k2hr3_entest_obj_res_01_keys_obj: {k2hr3_entest_obj_res_01_keys_obj_key00: 'k2hr3_entest_obj_res_01_keys_obj_val00', k2hr3_entest_obj_res_01_keys_obj_key01: 'k2hr3_entest_obj_res_01_keys_obj_val01'}, 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_val', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr': ['k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr_val00', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr_val01'], 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj': {'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_key00': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_val00', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_key01': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_val01'}, k2hr3_entest_str_res_03_keys_key: 'k2hr3_entest_str_res_03_keys_val', k2hr3_entest_str_res_03_keys_arr: ['k2hr3_entest_str_res_03_keys_arr_val00', 'k2hr3_entest_str_res_03_keys_arr_val01'], k2hr3_entest_str_res_03_keys_obj: {k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'}, 'tmpval': {'cuk': null, 'extra': null, 'host': '127.3.1.1', 'port': 0}});
				expect(res.body.resource.aliases).to.be.undefined;

				done();
			});
	});

	it('GET /v1/resource : get not expanded resource(k2hr3_entest_obj_res_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('null');
				expect(res.body.resource.object).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_value_key: 'k2hr3_entest_obj_res_01_value_val'});
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_keys_key: 'k2hr3_entest_obj_res_01_keys_val', k2hr3_entest_obj_res_01_keys_arr: ['k2hr3_entest_obj_res_01_keys_arr_val00', 'k2hr3_entest_obj_res_01_keys_arr_val01'], k2hr3_entest_obj_res_01_keys_obj: {k2hr3_entest_obj_res_01_keys_obj_key00: 'k2hr3_entest_obj_res_01_keys_obj_val00', k2hr3_entest_obj_res_01_keys_obj_key01: 'k2hr3_entest_obj_res_01_keys_obj_val01'}});
				expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03');

				done();
			});
	});

	it('GET /v1/resource : get expanded resource(k2hr3_entest_obj_res_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?expand=true';														// expand:	false
		//																				// service:	not set

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');
				expect(res.body.resource.object).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_value_key: 'k2hr3_entest_obj_res_01_value_val'});
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_keys_key: 'k2hr3_entest_obj_res_01_keys_val', k2hr3_entest_obj_res_01_keys_arr: ['k2hr3_entest_obj_res_01_keys_arr_val00', 'k2hr3_entest_obj_res_01_keys_arr_val01'], k2hr3_entest_obj_res_01_keys_obj: {k2hr3_entest_obj_res_01_keys_obj_key00: 'k2hr3_entest_obj_res_01_keys_obj_val00', k2hr3_entest_obj_res_01_keys_obj_key01: 'k2hr3_entest_obj_res_01_keys_obj_val01'}, k2hr3_entest_str_res_03_keys_key: 'k2hr3_entest_str_res_03_keys_val', k2hr3_entest_str_res_03_keys_arr: ['k2hr3_entest_str_res_03_keys_arr_val00', 'k2hr3_entest_str_res_03_keys_arr_val01'], k2hr3_entest_str_res_03_keys_obj: {k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'}, 'tmpval': {'cuk': null, 'extra': null, 'host': '127.3.1.1', 'port': 0}});
				expect(res.body.resource.aliases).to.be.undefined;

				done();
			});
	});

	it('GET /v1/resource : get not expanded resource(test_service_resource) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&expand=false';														// expand:	false

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal('test service in tenant resource data for debug');
				expect(res.body.resource.object).to.be.a('null');
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({test_service_key: 'test_service_value'});
				expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);

				done();
			});
	});

	it('GET /v1/resource : get expanded resource(test_service_resource) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&expand=true';														// expand:	false

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
				expect(res.body.resource).to.be.an('object');
				expect(res.body.resource.string).to.be.a('string').to.equal('test service in tenant resource data for debug');
				expect(res.body.resource.object).to.be.a('null');
				expect(res.body.resource.expire).to.be.a('null');
				expect(res.body.resource.keys).to.be.an('object').to.deep.equal({test_service_key: 'test_service_value'});
				expect(res.body.resource.aliases).to.be.undefined;

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_str_res_03) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01###;k2hr3_entest_str_res_01_keys_key=k2hr3_entest_str_res_01_keys_val;k2hr3_entest_str_res_01_keys_arr[0]=k2hr3_entest_str_res_01_keys_arr_val00;k2hr3_entest_str_res_01_keys_arr[1]=k2hr3_entest_str_res_01_keys_arr_val01;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val00=k2hr3_entest_str_res_01_keys_obj_val00_dummy;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val01=k2hr3_entest_str_res_01_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[2]=host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[3]=host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[3]=127.0.1.0;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02###;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_val;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr[0]=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val00;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr[1]=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val01;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj.k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00_dummy;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj.k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[2]=host01.k2hr3_entest_str_02.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[3]=host02.k2hr3_entest_str_02.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[3]=127.1.1.0');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({'k2hr3_entest_str_res_03_keys_obj_key00': 'k2hr3_entest_str_res_03_keys_obj_val00', 'k2hr3_entest_str_res_03_keys_obj_key01': 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_key';							// keyname:	k2hr3_entest_str_res_01_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_arr';							// keyname:	k2hr3_entest_str_res_01_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_obj';							// keyname:	k2hr3_entest_str_res_01_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({'k2hr3_entest_str_res_01_keys_obj_key00': 'k2hr3_entest_str_res_01_keys_obj_val00', 'k2hr3_entest_str_res_01_keys_obj_key01': 'k2hr3_entest_str_res_01_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key';	// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr';	// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj';	// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key00': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00', 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key01': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_str_res_01) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01###;k2hr3_entest_str_res_01_keys_key=k2hr3_entest_str_res_01_keys_val;k2hr3_entest_str_res_01_keys_arr[0]=k2hr3_entest_str_res_01_keys_arr_val00;k2hr3_entest_str_res_01_keys_arr[1]=k2hr3_entest_str_res_01_keys_arr_val01;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val00=k2hr3_entest_str_res_01_keys_obj_val00_dummy;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val01=k2hr3_entest_str_res_01_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[2]=host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[3]=host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[3]=127.0.1.0');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_key';							// keyname:	k2hr3_entest_str_res_01_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_arr';							// keyname:	k2hr3_entest_str_res_01_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_obj';							// keyname:	k2hr3_entest_str_res_01_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_01_keys_obj_key00: 'k2hr3_entest_str_res_01_keys_obj_val00', k2hr3_entest_str_res_01_keys_obj_key01: 'k2hr3_entest_str_res_01_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get object resource(k2hr3_entest_obj_res_03) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_value_key: 'k2hr3_entest_obj_res_03_value_val'});

				done();
			});
	});

	it('GET /v1/resource : get object resource(k2hr3_entest_obj_res_03) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_value_key: 'k2hr3_entest_obj_res_03_value_val'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_key';							// keyname:	k2hr3_entest_obj_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_obj_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_arr';							// keyname:	k2hr3_entest_obj_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_obj_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_obj_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_obj';							// keyname:	k2hr3_entest_obj_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_keys_obj_key00: 'k2hr3_entest_obj_res_03_keys_obj_val00', k2hr3_entest_obj_res_03_keys_obj_key01: 'k2hr3_entest_obj_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');

				done();
			});
	});

	it('GET /v1/resource : get object resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_value_key: 'k2hr3_entest_obj_res_01_value_val', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_value_key': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_value_val'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_key';							// keyname:	k2hr3_entest_obj_res_01_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_arr';							// keyname:	k2hr3_entest_obj_res_01_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_obj';							// keyname:	k2hr3_entest_obj_res_01_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_keys_obj_key00: 'k2hr3_entest_obj_res_01_keys_obj_val00', k2hr3_entest_obj_res_01_keys_obj_key01: 'k2hr3_entest_obj_res_01_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key';	// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr';	// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj';	// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_key00': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_val00', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_key01': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_obj_res_01) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');

				done();
			});
	});

	it('GET /v1/resource : get object resource(k2hr3_entest_obj_res_01) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_value_key: 'k2hr3_entest_obj_res_01_value_val'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_key';							// keyname:	k2hr3_entest_obj_res_01_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_arr';							// keyname:	k2hr3_entest_obj_res_01_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_obj';							// keyname:	k2hr3_entest_obj_res_01_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_keys_obj_key00: 'k2hr3_entest_obj_res_01_keys_obj_val00', k2hr3_entest_obj_res_01_keys_obj_key01: 'k2hr3_entest_obj_res_01_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(test_service_resource) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=string';														// type:	string
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('test service in tenant resource data for debug');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(test_service_resource/keys/test_service_key) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=test_service_key';											// keyname:	test_service_key
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('test_service_value');

				done();
			});
	});

	it('POST(ADD IP ADDRESS FOR GET TEST) /v1/role : add ip address(127.0.0.1) to k2hr3_entest_str_role_03 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/k2hr3_entest_str_role_03')									// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// ip:		127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
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

	it('POST(ADD IP ADDRESS FOR GET TEST) /v1/role : add ip address(127.0.0.1) to k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02')			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// ip:		127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
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

	it('POST(ADD IP ADDRESS FOR GET TEST) /v1/role : add ip address(127.0.0.1) to k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02')			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// ip:		127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
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

	it('POST(ADD IP ADDRESS FOR GET TEST) /v1/role : add ip address(127.0.0.1) to test_service_tenant by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/test_service_tenant')										// role:	yrn:yahoo:::tenant0:role:test_service_tenant
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// ip:		127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
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

	it('GET /v1/resource : get string resource(k2hr3_entest_str_res_03) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');
				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=string';																		// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01###;k2hr3_entest_str_res_01_keys_key=k2hr3_entest_str_res_01_keys_val;k2hr3_entest_str_res_01_keys_arr[0]=k2hr3_entest_str_res_01_keys_arr_val00;k2hr3_entest_str_res_01_keys_arr[1]=k2hr3_entest_str_res_01_keys_arr_val01;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val00=k2hr3_entest_str_res_01_keys_obj_val00_dummy;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val01=k2hr3_entest_str_res_01_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[2]=host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[3]=host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[3]=127.0.1.0;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02###;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_val;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr[0]=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val00;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr[1]=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val01;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj.k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00_dummy;k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj.k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[2]=host01.k2hr3_entest_str_02.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/name[3]=host02.k2hr3_entest_str_02.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02/hosts/ip[3]=127.1.1.0');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';											// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';											// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';											// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({'k2hr3_entest_str_res_03_keys_obj_key00': 'k2hr3_entest_str_res_03_keys_obj_val00', 'k2hr3_entest_str_res_03_keys_obj_key01': 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_key';											// keyname:	k2hr3_entest_str_res_01_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_arr';											// keyname:	k2hr3_entest_str_res_01_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_obj';											// keyname:	k2hr3_entest_str_res_01_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({'k2hr3_entest_str_res_01_keys_obj_key00': 'k2hr3_entest_str_res_01_keys_obj_val00', 'k2hr3_entest_str_res_01_keys_obj_key01': 'k2hr3_entest_str_res_01_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key';					// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr';					// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj';					// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key00': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val00', 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_key01': 'k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_str_res_01) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01###;k2hr3_entest_str_res_01_keys_key=k2hr3_entest_str_res_01_keys_val;k2hr3_entest_str_res_01_keys_arr[0]=k2hr3_entest_str_res_01_keys_arr_val00;k2hr3_entest_str_res_01_keys_arr[1]=k2hr3_entest_str_res_01_keys_arr_val01;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val00=k2hr3_entest_str_res_01_keys_obj_val00_dummy;k2hr3_entest_str_res_01_keys_obj.k2hr3_entest_str_res_01_keys_obj_val01=k2hr3_entest_str_res_01_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;k2hr3_entest_str_res_03_keys_key=k2hr3_entest_str_res_03_keys_val;k2hr3_entest_str_res_03_keys_arr[0]=k2hr3_entest_str_res_03_keys_arr_val00;k2hr3_entest_str_res_03_keys_arr[1]=k2hr3_entest_str_res_03_keys_arr_val01;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val00=k2hr3_entest_str_res_03_keys_obj_val00_dummy;k2hr3_entest_str_res_03_keys_obj.k2hr3_entest_obj_res_03_keys_obj_val01=k2hr3_entest_str_res_03_keys_obj_val01_dummy;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[2]=host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/name[3]=host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[2]=127.3.1.1;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/hosts/ip[3]=127.0.1.0');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_key';							// keyname:	k2hr3_entest_str_res_01_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_arr';							// keyname:	k2hr3_entest_str_res_01_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_01_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_obj';							// keyname:	k2hr3_entest_str_res_01_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_01_keys_obj_key00: 'k2hr3_entest_str_res_01_keys_obj_val00', k2hr3_entest_str_res_01_keys_obj_key01: 'k2hr3_entest_str_res_01_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get object resource(k2hr3_entest_obj_res_03) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_value_key: 'k2hr3_entest_obj_res_03_value_val'});

				done();
			});
	});

	it('GET /v1/resource : get object resource(k2hr3_entest_obj_res_03) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_value_key: 'k2hr3_entest_obj_res_03_value_val'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_key';							// keyname:	k2hr3_entest_obj_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_obj_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_arr';							// keyname:	k2hr3_entest_obj_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_obj_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_obj_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_obj';							// keyname:	k2hr3_entest_obj_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_03_keys_obj_key00: 'k2hr3_entest_obj_res_03_keys_obj_val00', k2hr3_entest_obj_res_03_keys_obj_key01: 'k2hr3_entest_obj_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=string';																		// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');

				done();
			});
	});

	it('GET /v1/resource : get object resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=object';																		// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_value_key: 'k2hr3_entest_obj_res_01_value_val', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_value_key': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_value_val'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_key';											// keyname:	k2hr3_entest_obj_res_01_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_arr';											// keyname:	k2hr3_entest_obj_res_01_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_obj';											// keyname:	k2hr3_entest_obj_res_01_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_keys_obj_key00: 'k2hr3_entest_obj_res_01_keys_obj_val00', k2hr3_entest_obj_res_01_keys_obj_key01: 'k2hr3_entest_obj_res_01_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key';					// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr';					// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj';					// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_key00': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_val00', 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_key01': 'k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';											// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';											// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';											// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(k2hr3_entest_obj_res_01) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal(';###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03###;###yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03/host(ip)###;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[0]=host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/name[1]=host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[0]=127.10.10.10;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[1]=127.3.1.0;yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03/hosts/ip[2]=127.3.1.1');

				done();
			});
	});

	it('GET /v1/resource : get object resource(k2hr3_entest_obj_res_01) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_value_key: 'k2hr3_entest_obj_res_01_value_val'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_key';							// keyname:	k2hr3_entest_obj_res_01_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_arr';							// keyname:	k2hr3_entest_obj_res_01_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_obj_res_01_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_obj';							// keyname:	k2hr3_entest_obj_res_01_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_obj_res_01_keys_obj_key00: 'k2hr3_entest_obj_res_01_keys_obj_val00', k2hr3_entest_obj_res_01_keys_obj_key01: 'k2hr3_entest_obj_res_01_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_val');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.resource[0]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val00');
				expect(res.body.resource[1]).to.be.a('string').to.equal('k2hr3_entest_str_res_03_keys_arr_val01');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.an('object').to.deep.equal({k2hr3_entest_str_res_03_keys_obj_key00: 'k2hr3_entest_str_res_03_keys_obj_val00', k2hr3_entest_str_res_03_keys_obj_key01: 'k2hr3_entest_str_res_03_keys_obj_val01'});

				done();
			});
	});

	it('GET /v1/resource : get string resource(test_service_resource) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('test service in tenant resource data for debug');

				done();
			});
	});

	it('GET /v1/resource : get keys resource(test_service_resource/keys/test_service_key) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=test_service_key';											// keyname:	test_service_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.resource).to.be.a('string').to.equal('test_service_value');

				done();
			});
	});

	//
	// Run Test(GET - FAILURE) - only no token here
	//
	// [NOTE]
	// We must do "no token failure test" first.
	// Because it is necessary to execute with the IP address (127.0.0.1) added for the normal test of notoken.
	//
	it('GET /v1/resource : failure get object resource(not_exist_resource) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:not_exist_resource';					// path:	not exist resource
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('role(k2hr3_entest_str_role_01) in tenant(tenant0) does not allow to read access to resource(yrn:yahoo:::tenant0:resource:not_exist_resource).');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(k2hr3_entest_str_res_01) by no token(not exist role) with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:not_exist_role';						// role:	yrn:yahoo:::tenant0:role:not_exist_role
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('ip:port(127.0.0.1:0) is not role(yrn:yahoo:::tenant0:role:not_exist_role) member.');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(k2hr3_entest_str_res_03) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03) by role(k2hr3_entest_str_role_03) in tenant(tenant0) does not have value for type(object) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_03) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_03) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03) by role(k2hr3_entest_str_role_03) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=object';																		// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) in tenant(tenant0) does not have value for type(object) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		//																								// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=not_exist_keyname';														// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(k2hr3_entest_str_res_01) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01) by role(k2hr3_entest_str_role_01) in tenant(tenant0) does not have value for type(object) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_01) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_01) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01) by role(k2hr3_entest_str_role_01) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get string resource(k2hr3_entest_obj_res_03) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03) by role(k2hr3_entest_obj_role_03) in tenant(tenant0) does not have value for type(string) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_03) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_03) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03) by role(k2hr3_entest_obj_role_03) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		//																								// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=not_exist_keyname';														// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_01) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_01) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01) by role(k2hr3_entest_obj_role_01) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(test_service_resource) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=object';														// type:	object
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:testservice::tenant0:resource:test_service_resource) by role(test_service_tenant) in tenant(tenant0) does not have value for type(object) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(test_service_resource) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(test_service_resource) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:testservice::tenant0:resource:test_service_resource) by role(test_service_tenant) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('DELETE(DELETE IP ADDRESS FOR GET TEST) /v1/role : delete ip address(127.0.0.1) from k2hr3_entest_str_role_03 by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_03';											// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE IP ADDRESS FOR GET TEST) /v1/role : delete ip address(127.0.0.1) from k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';				// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE IP ADDRESS FOR GET TEST) /v1/role : delete ip address(127.0.0.1) from k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';				// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE IP ADDRESS FOR GET TEST) /v1/role : delete ip address(127.0.0.1) from test_service_tenant by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/test_service_tenant';												// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	//
	// Run Test(GET - FAILURE) - without no token
	//
	it('GET /v1/resource : failure get not expanded resource(not_exist_resource) by scoped token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/not_exist_resource';												// path:	not exist resource
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:::tenant0:resource:not_exist_resource');

				done();
			});
	});

	it('GET /v1/resource : failure get not expanded resource(wrong k2hr3_entest_str_res_02 path) by scoped token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_02';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_02
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_02');

				done();
			});
	});

	it('GET /v1/resource : failure get not expanded resource(k2hr3_entest_str_res_01) by invalid scope token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=error_dummy_token')									// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/resource : failure get not expanded resource(k2hr3_entest_str_res_01) by wrong scope token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)							// tenant1
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:::tenant1:resource:k2hr3_entest_str_res_01');

				done();
			});
	});

	it('GET /v1/resource : failure get not expanded resource(not_exist_service_resource) by scoped token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/not_exist_service_resource';										// path:	yrn:yahoo:testservice::tenant0:resource:not_exist_service_resource
		uri		+= '?service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&expand=false';														// expand:	false

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:testservice::tenant0:resource:not_exist_service_resource');

				done();
			});
	});

	it('GET /v1/resource : failure get not expanded resource(test_service_resource) by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&expand=false';														// expand:	false

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=error_dummy_token')									// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/resource : failure get not expanded resource(test_service_resource) by wrong scoped token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&expand=false';														// expand:	false

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)							// tenant1
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:testservice::tenant1:resource:test_service_resource');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(not_exist_resource) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/not_exist_resource';												// path:	not exist resource
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can not access to not_exist_resource)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('role(k2hr3_entest_str_role_01) in tenant(tenant0) does not allow to read access to resource(yrn:yahoo:::tenant0:resource:not_exist_resource).');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(k2hr3_entest_str_res_01) by invalid role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=error_dummy_token')									// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(k2hr3_entest_str_res_03) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03) by role(k2hr3_entest_str_role_03) in tenant(tenant0) does not have value for type(object) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_03) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_03) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03) by role(k2hr3_entest_str_role_03) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) in tenant(tenant0) does not have value for type(object) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(k2hr3_entest_str_res_01) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01) by role(k2hr3_entest_str_role_01) in tenant(tenant0) does not have value for type(object) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_01) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_01) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01) by role(k2hr3_entest_str_role_01) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get string resource(k2hr3_entest_obj_res_03) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03) by role(k2hr3_entest_obj_role_03) in tenant(tenant0) does not have value for type(string) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_03) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_03) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03) by role(k2hr3_entest_obj_role_03) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_01) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_01) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01) by role(k2hr3_entest_obj_role_01) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get object resource(test_service_resource) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=object';														// type:	object
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:testservice::tenant0:resource:test_service_resource) by role(test_service_tenant) in tenant(tenant0) does not have value for type(object) data.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(no keyname param) resource(test_service_resource) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request type=keys, but keyname(undefined) parameter is empty.');

				done();
			});
	});

	it('GET /v1/resource : failure get keys(not exist keyname) resource(test_service_resource) by role token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('resource(yrn:yahoo:testservice::tenant0:resource:test_service_resource) by role(test_service_tenant) in tenant(tenant0) does not have value for type(keys[not_exist_keyname]) data.');

				done();
			});
	});

	//
	// Run Test(HEAD - SUCCESS)
	//
	it('HEAD /v1/resource : get string resource(k2hr3_entest_str_res_03) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_key';							// keyname:	k2hr3_entest_str_res_01_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_arr';							// keyname:	k2hr3_entest_str_res_01_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_obj';							// keyname:	k2hr3_entest_str_res_01_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key';	// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr';	// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj';	// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(k2hr3_entest_str_res_01) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_key';							// keyname:	k2hr3_entest_str_res_01_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_arr';							// keyname:	k2hr3_entest_str_res_01_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_obj';							// keyname:	k2hr3_entest_str_res_01_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get object resource(k2hr3_entest_obj_res_03) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get object resource(k2hr3_entest_obj_res_03) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_key';							// keyname:	k2hr3_entest_obj_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_arr';							// keyname:	k2hr3_entest_obj_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_obj';							// keyname:	k2hr3_entest_obj_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get object resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_key';							// keyname:	k2hr3_entest_obj_res_01_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_arr';							// keyname:	k2hr3_entest_obj_res_01_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_obj';							// keyname:	k2hr3_entest_obj_res_01_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key';	// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr';	// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj';	// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(k2hr3_entest_obj_res_01) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get object resource(k2hr3_entest_obj_res_01) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_key';							// keyname:	k2hr3_entest_obj_res_01_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_arr';							// keyname:	k2hr3_entest_obj_res_01_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_obj';							// keyname:	k2hr3_entest_obj_res_01_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_arr) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_obj) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(test_service_resource) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=string';														// type:	string
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(test_service_resource/keys/test_service_key) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=test_service_key';											// keyname:	test_service_key
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('POST(ADD IP ADDRESS FOR HEAD TEST) /v1/role : add ip address(127.0.0.1) to k2hr3_entest_str_role_03 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/k2hr3_entest_str_role_03')									// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// ip:		127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
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

	it('POST(ADD IP ADDRESS FOR HEAD TEST) /v1/role : add ip address(127.0.0.1) to k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02')			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// ip:		127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
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

	it('POST(ADD IP ADDRESS FOR HEAD TEST) /v1/role : add ip address(127.0.0.1) to k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02')			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// ip:		127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
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

	it('POST(ADD IP ADDRESS FOR HEAD TEST) /v1/role : add ip address(127.0.0.1) to test_service_tenant by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/test_service_tenant')										// role:	yrn:yahoo:::tenant0:role:test_service_tenant
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// ip:		127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
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

	it('HEAD /v1/resource : get string resource(k2hr3_entest_str_res_03) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_03/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=string';																		// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';											// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';											// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';											// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_key';											// keyname:	k2hr3_entest_str_res_01_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_arr';											// keyname:	k2hr3_entest_str_res_01_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_obj';											// keyname:	k2hr3_entest_str_res_01_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key';					// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr';					// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02/keys/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj';					// keyname:	k2hr3_entest_str_res_01/k2hr3_entest_str_res_02_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(k2hr3_entest_str_res_01) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_key';							// keyname:	k2hr3_entest_str_res_01_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_arr';							// keyname:	k2hr3_entest_str_res_01_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_01_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_01_keys_obj';							// keyname:	k2hr3_entest_str_res_01_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_str_res_01/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get object resource(k2hr3_entest_obj_res_03) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get object resource(k2hr3_entest_obj_res_03) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_key';							// keyname:	k2hr3_entest_obj_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_arr';							// keyname:	k2hr3_entest_obj_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_03/keys/k2hr3_entest_obj_res_03_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_03_keys_obj';							// keyname:	k2hr3_entest_obj_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=string';																		// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get object resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=object';																		// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_key';											// keyname:	k2hr3_entest_obj_res_01_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_arr';											// keyname:	k2hr3_entest_obj_res_01_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_obj';											// keyname:	k2hr3_entest_obj_res_01_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key';					// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr';					// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj';					// keyname:	k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';											// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';											// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';											// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(k2hr3_entest_obj_res_01) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get object resource(k2hr3_entest_obj_res_01) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_key';							// keyname:	k2hr3_entest_obj_res_01_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_arr';							// keyname:	k2hr3_entest_obj_res_01_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_obj_res_01_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_obj_res_01_keys_obj';							// keyname:	k2hr3_entest_obj_res_01_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_key';							// keyname:	k2hr3_entest_str_res_03_keys_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_arr) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_arr';							// keyname:	k2hr3_entest_str_res_03_keys_arr
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(k2hr3_entest_obj_res_01/keys/k2hr3_entest_str_res_03_keys_obj) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=k2hr3_entest_str_res_03_keys_obj';							// keyname:	k2hr3_entest_str_res_03_keys_obj
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get string resource(test_service_resource) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/resource : get keys resource(test_service_resource/keys/test_service_key) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=test_service_key';											// keyname:	test_service_key
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	//
	// Run Test(HEAD - FAILURE) - only no token here
	//
	// [NOTE]
	// We must do "no token failure test" first.
	// Because it is necessary to execute with the IP address (127.0.0.1) added for the normal test of notoken.
	//
	it('HEAD /v1/resource : failure get object resource(not_exist_resource) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:not_exist_resource';					// path:	not exist resource
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(k2hr3_entest_str_res_01) by no token(not exist role) with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:not_exist_role';						// role:	yrn:yahoo:::tenant0:role:not_exist_role
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(k2hr3_entest_str_res_03) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_03) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_03) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=object';																		// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		//																								// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=not_exist_keyname';														// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(k2hr3_entest_str_res_01) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=object';														// type:	object
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_01) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_01) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get string resource(k2hr3_entest_obj_res_03) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=string';														// type:	string
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_03) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_03) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		//																								// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';		// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';																		// type:	keys
		uri		+= '&keyname=not_exist_keyname';														// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		//				//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_01) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_01) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01';				// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(test_service_resource) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=object';														// type:	object
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(test_service_resource) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(test_service_resource) by no token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:testservice::tenant0:resource:test_service_resource';	// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&role=yrn:yahoo:::tenant0:role:test_service_tenant';				// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('DELETE(DELETE IP ADDRESS FOR HEAD TEST) /v1/role : delete ip address(127.0.0.1) from k2hr3_entest_str_role_03 by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_03';											// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE IP ADDRESS FOR HEAD TEST) /v1/role : delete ip address(127.0.0.1) from k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';				// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE IP ADDRESS FOR HEAD TEST) /v1/role : delete ip address(127.0.0.1) from k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';				// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE IP ADDRESS FOR HEAD TEST) /v1/role : delete ip address(127.0.0.1) from test_service_tenant by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/test_service_tenant';												// role:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	//
	// Run Test(GET - FAILURE) - without no token
	//
	it('HEAD /v1/resource : failure get not expanded resource(not_exist_resource) by scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/not_exist_resource';												// path:	not exist resource
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get not expanded resource(wrong k2hr3_entest_str_res_02 path) by scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_02';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_02
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get not expanded resource(k2hr3_entest_str_res_01) by invalid scope token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=error_dummy_token')									// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/resource : failure get not expanded resource(k2hr3_entest_str_res_01) by wrong scope token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?expand=false';														// expand:	false
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)							// tenant1
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get not expanded resource(not_exist_service_resource) by scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/not_exist_service_resource';										// path:	yrn:yahoo:testservice::tenant0:resource:not_exist_service_resource
		uri		+= '?service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&expand=false';														// expand:	false

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get not expanded resource(test_service_resource) by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&expand=false';														// expand:	false

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=error_dummy_token')									// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/resource : failure get not expanded resource(test_service_resource) by wrong scoped token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?service=testservice';												// service:	yrn:yahoo:testservice
		uri		+= '&expand=false';														// expand:	false

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)							// tenant1
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(not_exist_resource) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/not_exist_resource';												// path:	not exist resource
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can not access to not_exist_resource)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(k2hr3_entest_str_res_01) by invalid role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=error_dummy_token')									// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(k2hr3_entest_str_res_03) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_03) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_03) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03 (this role can access to k2hr3_entest_str_res_03)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_01/k2hr3_entest_str_res_02) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01/k2hr3_entest_str_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01/k2hr3_entest_str_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02 (this role can access to k2hr3_entest_str_res_01/k2hr3_entest_str_role_02)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(k2hr3_entest_str_res_01) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=object';														// type:	object
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_str_res_01) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_str_res_01) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_str_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_str_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01 (this role can access to k2hr3_entest_str_res_01)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get string resource(k2hr3_entest_obj_res_03) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=string';														// type:	string
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_03) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_03) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_03';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_03
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 (this role can access to k2hr3_entest_obj_res_03)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02';					// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02 (this role can access to k2hr3_entest_obj_res_01/k2hr3_entest_obj_res_02)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(k2hr3_entest_obj_res_01) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(k2hr3_entest_obj_res_01) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/k2hr3_entest_obj_res_01';											// path:	yrn:yahoo:::tenant0:resource:k2hr3_entest_obj_res_01
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		//																				// service:	not set

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_01)	// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01 (this role can access to k2hr3_entest_obj_res_01)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get object resource(test_service_resource) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=object';														// type:	object
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(no keyname param) resource(test_service_resource) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		//																				// keyname:	not set
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/resource : failure get keys(not exist keyname) resource(test_service_resource) by role token with status 403', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/test_service_resource';											// path:	yrn:yahoo:testservice::tenant0:resource:test_service_resource
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keyname=not_exist_keyname';										// keyname:	not exist key name
		uri		+= '&service=testservice';												// service:	yrn:yahoo:testservice

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_test_service_tenant)		// role:	yrn:yahoo:::tenant0:role:test_service_tenant (this role can access to yrn:yahoo:testservice::tenant0:resource:test_service_resource)
			.end(function(err, res){
				expect(res).to.have.status(403);

				done();
			});
	});

	//
	// Run Test(DELETE - SUCCESS - scoped token)
	//
	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_scopedtoken_1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_scopedtoken_1';									// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_delete:string:value1');			// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_scopedtoken_2) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_scopedtoken_2';									// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
		uri		+= '&type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify(['autotest_delete:string:value2']);		// data:	dummy array
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_scopedtoken_3) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_scopedtoken_3';									// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_3
		uri		+= '&type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify(['autotest_delete:string:value3']);		// data:	dummy array
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('DELETE /v1/resource : delete not have object resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=object';														// type:	object
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_delete:string:value1');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete string resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=string';														// type:	string
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete not have string resource(autotest_del_scopedtoken_2) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_2';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
		uri		+= '?type=string';														// type:	string
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_2?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.resource.object[0]).to.be.a('string').to.equal('autotest_delete:string:value2');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete object resource(autotest_del_scopedtoken_2) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_2';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
		uri		+= '?type=object';														// type:	object
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_2?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete any resource(autotest_del_scopedtoken_3) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_3';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_3
		uri		+= '?type=anytype';														// type:	anytype
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_3?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_3
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(not_exist_key) resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keynames=not_exist_key';											// keynames:not_exist_key
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(key1) resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keynames=key1';													// keynames:key1
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(key2, key3) resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keynames=' + JSON.stringify(['key2', 'key3']);						// keynames:[key2, key3]
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(all) resource(autotest_del_scopedtoken_2) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_2';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
		uri		+= '?type=keys';														// type:	keys
		//																				// keynames:net set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_2?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.be.empty;
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete aliases(not_exist_alias) resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=aliases';														// type:	aliases
		//																				// keynames:not set
		uri		+= '&aliases=yrn:yahoo:::tenant0:resource:not_exist_alias';				// aliases:	yrn:yahoo:::tenant0:resource:not_exist_alias

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete aliases(autotest_delete_alias1) resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=aliases';														// type:	aliases
		//																				// keynames:not set
		uri		+= '&aliases=yrn:yahoo:::tenant0:resource:autotest_delete_alias1';		// aliases:	yrn:yahoo:::tenant0:resource:autotest_delete_alias1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(4);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete aliases(autotest_delete_alias2, autotest_delete_alias3) resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=aliases';														// type:	aliases
																						// keynames:not set
		uri		+= '&aliases=' + JSON.stringify([										// aliases:	[yrn:yahoo:::tenant0:resource:autotest_delete_alias2, yrn:yahoo:::tenant0:resource:autotest_delete_alias3]
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete aliases(all) resource(autotest_del_scopedtoken_2) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_2';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
		uri		+= '?type=aliases';														// type:	aliases
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_2?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.be.empty;
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.be.empty;

						done();
					});
			});
	});

	it('DELETE /v1/resource : failure delete all resource(autotest_del_scopedtoken_1) by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=';															// type:	null
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'invalid_scoped_token')								// scoped token:	invalid
			.end(function(err, res){
				expect(res).to.have.status(401);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete all resource(autotest_del_scopedtoken_1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
		uri		+= '?type=';															// type:	null
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_1?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(404);
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.false;
						expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_1');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete all resource(autotest_del_scopedtoken_2) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_2';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
		//																				// type:	not set
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_2?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(404);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.false;
						expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_2');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete all resource(autotest_del_scopedtoken_3) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_scopedtoken_3';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_3
		//																				// type:	not set
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_scopedtoken_3?expand=false')		// path:	yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_3
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(404);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.false;
						expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:::tenant0:resource:autotest_del_scopedtoken_3');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete all resource(not_exist_resource) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/not_exist_resource';												// path:	yrn:yahoo:::tenant0:resource:not_exist_resource
		uri		+= '?type=';															// type:	null
		//																				// keynames:not set
		//																				// aliases:	not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/not_exist_resource?expand=false')				// path:	yrn:yahoo:::tenant0:resource:not_exist_resource
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(404);
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.false;
						expect(res.body.message).to.be.a('string').to.equal('Could not get resource data for resource yrn: yrn:yahoo:::tenant0:resource:not_exist_resource');

						done();
					});
			});
	});

	//
	// Run Test(DELETE - SUCCESS - role token)
	//
	// [NOTE]
	// We use yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 test role.
	// And add yrn:yahoo:::tenant0:policy:autotest_del_roletoken test policy.
	//
	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_roletoken_1) by role token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_roletoken_1';									// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_delete:string:value1');			// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_roletoken_2) by role token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_roletoken_2';									// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2
		uri		+= '&type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify(['autotest_delete:string:value2']);		// data:	dummy array
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_roletoken_3) by role token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_roletoken_3';									// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_3
		uri		+= '&type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify(['autotest_delete:string:value3']);		// data:	dummy array
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('POST(ADD POLICY FOR DELETE TEST) /v1/role : set new policy(autotest_pol_del_roletoken) by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				policy: {
					name:		'autotest_pol_del_roletoken',							// policy:		yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken
					effect:		'allow',												// effect:		allow
					action:		[														// action:		read/write
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:	[														// resource:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1, yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2, yrn:yahoo:::tenant0:resource:autotest_del_roletoken_3
						'yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1',
						'yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2',
						'yrn:yahoo:::tenant0:resource:autotest_del_roletoken_3'
					],
					condition:	null,													// condition:	null
					alias:		null													// alias:		null
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

	it('POST(ADD POLICY TO ROLE FOR DELETE TEST) /v1/role : add policy(autotest_pol_del_roletoken) to k2hr3_entest_obj_role_03 by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.send({
				role: {
					name:	'k2hr3_entest_obj_role_03',										// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03'
					policies: [
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03',				// this value already has k2hr3_entest_obj_pol_03 policy, but set it.
						'yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken'				// test policy: yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken
					]
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

	it('DELETE /v1/resource : delete not have object resource(autotest_del_roletoken_1) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_1';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
		uri		+= '?type=object';														// type:	object
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_delete:string:value1');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete string resource(autotest_del_roletoken_1) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_1';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
		uri		+= '?type=string';														// type:	string
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete not have string resource(autotest_del_roletoken_2) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_2';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2
		uri		+= '?type=string';														// type:	string
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_2?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.resource.object[0]).to.be.a('string').to.equal('autotest_delete:string:value2');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete object resource(autotest_del_roletoken_2) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_2';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2
		uri		+= '?type=object';														// type:	object
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_2?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete any resource(autotest_del_roletoken_3) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_3';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_3
		uri		+= '?type=anytype';														// type:	anytype
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_3?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_3
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(not_exist_key) resource(autotest_del_roletoken_1) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_1';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keynames=not_exist_key';											// keynames:not_exist_key

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(key1) resource(autotest_del_roletoken_1) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_1';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keynames=key1';													// keynames:key1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(key2, key3) resource(autotest_del_roletoken_1) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_1';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
		uri		+= '?type=keys';														// type:	keys
		uri		+= '&keynames=' + JSON.stringify(['key2', 'key3']);						// keynames:[key2, key3]

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(all) resource(autotest_del_roletoken_2) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_2';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2
		uri		+= '?type=keys';														// type:	keys
		//																				// keynames:net set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_03)	// role token: tenant0_k2hr3_entest_obj_role_03
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_2?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.be.empty;
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : failure delete any resource(autotest_del_roletoken_1) by invalid role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_1';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
		uri		+= '?type=anytype';														// type:	anytype
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'invalid_scoped_token')								// scoped token:	invalid
			.end(function(err, res){
				expect(res).to.have.status(401);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_roletoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('POST(DELETE POLICY FROM ROLE FOR DELETE TEST) /v1/role : delete policy(autotest_pol_del_roletoken) to k2hr3_entest_obj_role_03 by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.send({
				role: {
					name:	'k2hr3_entest_obj_role_03',										// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03'
					policies: [
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'				// this value already has k2hr3_entest_obj_pol_03 policy, but set it.
					]
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

	it('DELETE(DELETE POLICY FOR DELETE TEST) /v1/role : delete policy(autotest_pol_del_roletoken) by role token with status 204', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.delete('/v1/policy/autotest_pol_del_roletoken')							// policy:		yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE RESOURCE FOR DELETE TEST) /v1/resource : delete resource(autotest_del_roletoken_1) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_1';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_1
		uri		+= '?type=string';														// type:	not set
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE RESOURCE FOR DELETE TEST) /v1/resource : delete resource(autotest_del_roletoken_2) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_2';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_2
		uri		+= '?type=string';														// type:	not set
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE RESOURCE FOR DELETE TEST) /v1/resource : delete resource(autotest_del_roletoken_3) by role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_roletoken_3';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_roletoken_3
		uri		+= '?type=string';														// type:	not set
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	//
	// Run Test(DELETE - SUCCESS - no token)
	//
	// [NOTE]
	// We use yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03 test role.
	// And add yrn:yahoo:::tenant0:policy:autotest_del_roletoken test policy.
	//
	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_notoken_1) by no token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_notoken_1';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
		uri		+= '&type=string';														// type:	string
		uri		+= '&data=' + JSON.stringify('autotest_delete:string:value1');			// data:	dummy string
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_notoken_2) by no token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_notoken_2';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_2
		uri		+= '&type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify(['autotest_delete:string:value2']);		// data:	dummy array
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('PUT(ADD RESOURCE FOR DELETE TEST) /v1/resource : set all new resource(autotest_del_notoken_3) by no token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/resource';
		uri		+= '?name=autotest_del_notoken_3';										// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_3
		uri		+= '&type=object';														// type:	object
		uri		+= '&data=' + JSON.stringify(['autotest_delete:string:value3']);		// data:	dummy array
		uri		+= '&keys=' + JSON.stringify({											// keys:	5 dummy objects
						key1:	'val1',
						key2:	'val2',
						key3:	'val3',
						key4:	'val4',
						key5:	'val5'
					});
		uri		+= '&alias=' + JSON.stringify([											// alias:	5 dummy resource paths
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias1',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias2',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias3',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias4',
						'yrn:yahoo:::tenant0:resource:autotest_delete_alias5'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

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

				done();
			});
	});

	it('POST(ADD POLICY FOR DELETE TEST) /v1/role : set new policy(autotest_pol_del_roletoken) by no token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/policy')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				policy: {
					name:		'autotest_pol_del_roletoken',							// policy:		yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken
					effect:		'allow',												// effect:		allow
					action:		[														// action:		read/write
						'yrn:yahoo::::action:read',
						'yrn:yahoo::::action:write'
					],
					resource:	[														// resource:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1, yrn:yahoo:::tenant0:resource:autotest_del_notoken_2, yrn:yahoo:::tenant0:resource:autotest_del_notoken_3
						'yrn:yahoo:::tenant0:resource:autotest_del_notoken_1',
						'yrn:yahoo:::tenant0:resource:autotest_del_notoken_2',
						'yrn:yahoo:::tenant0:resource:autotest_del_notoken_3'
					],
					condition:	null,													// condition:	null
					alias:		null													// alias:		null
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

	it('POST(ADD POLICY TO ROLE FOR DELETE TEST) /v1/role : add policy(autotest_pol_del_roletoken) to k2hr3_entest_obj_role_03 by no token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.send({
				role: {
					name:	'k2hr3_entest_obj_role_03',										// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03'
					policies: [
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03',				// this value already has k2hr3_entest_obj_pol_03 policy, but set it.
						'yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken'				// test policy: yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken
					]
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

	it('DELETE /v1/resource : delete not have object resource(autotest_del_notoken_1) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_1';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=object';														// type:	object
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.equal('autotest_delete:string:value1');
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete string resource(autotest_del_notoken_1) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_1';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=string';														// type:	string
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete not have string resource(autotest_del_notoken_2) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_2';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_2
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=string';														// type:	string
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_2?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('null');
						expect(res.body.resource.object).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.resource.object[0]).to.be.a('string').to.equal('autotest_delete:string:value2');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete object resource(autotest_del_notoken_2) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_2';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_2
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=object';														// type:	object
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_2?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete any resource(autotest_del_notoken_3) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_3';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_3
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=anytype';														// type:	anytype
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_3?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_3
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(not_exist_key) resource(autotest_del_notoken_1) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_1';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=keys';														// type:	keys
		uri		+= '&keynames=not_exist_key';											// keynames:not_exist_key

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(key1) resource(autotest_del_notoken_1) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_1';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=keys';														// type:	keys
		uri		+= '&keynames=key1';													// keynames:key1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key2: 'val2', key3: 'val3', key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(key2, key3) resource(autotest_del_notoken_1) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_1';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=keys';														// type:	keys
		uri		+= '&keynames=' + JSON.stringify(['key2', 'key3']);						// keynames:[key2, key3]

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : delete keys(all) resource(autotest_del_notoken_2) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_2';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_2
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=keys';														// type:	keys
		//																				// keynames:net set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_2?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_2
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.be.empty;
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('DELETE /v1/resource : failure delete any resource(autotest_del_notoken_1) by invalid ip address with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/yrn:yahoo:::tenant0:resource:autotest_del_notoken_1';				// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
		uri		+= '?role=yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';			// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		//																				//			(this role does not have 127.0.0.1 and yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken policy)
		//																				// port:	not set
		//																				// cuk:		not set
		uri		+= '&type=anytype';														// type:	anytype
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'invalid_scoped_token')								// scoped token:	invalid
			.end(function(err, res){
				expect(res).to.have.status(401);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/resource/autotest_del_notoken_1?expand=false')			// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.resource).to.be.an('object');
						expect(res.body.resource.string).to.be.a('string').to.be.empty;
						expect(res.body.resource.object).to.be.a('null');
						expect(res.body.resource.expire).to.be.a('null');
						expect(res.body.resource.keys).to.be.an('object').to.deep.equal({key4: 'val4', key5: 'val5'});
						expect(res.body.resource.aliases).to.be.an.instanceof(Array).to.have.lengthOf(5);
						expect(res.body.resource.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias1');
						expect(res.body.resource.aliases[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias2');
						expect(res.body.resource.aliases[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias3');
						expect(res.body.resource.aliases[3]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias4');
						expect(res.body.resource.aliases[4]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:resource:autotest_delete_alias5');

						done();
					});
			});
	});

	it('POST(DELETE POLICY FROM ROLE FOR DELETE TEST) /v1/role : delete policy(autotest_pol_del_roletoken) to k2hr3_entest_obj_role_03 by no token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.send({
				role: {
					name:	'k2hr3_entest_obj_role_03',										// role:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03'
					policies: [
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'				// this value already has k2hr3_entest_obj_pol_03 policy, but set it.
					]
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

	it('DELETE(DELETE POLICY FOR DELETE TEST) /v1/role : delete policy(autotest_pol_del_roletoken) by no token with status 204', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.delete('/v1/policy/autotest_pol_del_roletoken')							// policy:		yrn:yahoo:::tenant0:policy:autotest_pol_del_roletoken
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE RESOURCE FOR DELETE TEST) /v1/resource : delete resource(autotest_del_notoken_1) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_notoken_1';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_1
		uri		+= '?type=string';														// type:	not set
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE RESOURCE FOR DELETE TEST) /v1/resource : delete resource(autotest_del_notoken_2) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_notoken_2';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_2
		uri		+= '?type=string';														// type:	not set
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE(DELETE RESOURCE FOR DELETE TEST) /v1/resource : delete resource(autotest_del_notoken_3) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/resource';
		uri		+= '/autotest_del_notoken_3';											// path:	yrn:yahoo:::tenant0:resource:autotest_del_notoken_3
		uri		+= '?type=string';														// type:	not set
		//																				// keynames:not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});
});

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
