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
describe('API : ROLE', function(){						// eslint-disable-line no-undef
	//
	// Common data
	//
	var	alltokens = {};

	var	user_roletoken_tenant0_k2hr3_entest_obj_role_01	= '';
	var	user_roletoken_tenant0_k2hr3_entest_obj_role_02	= '';
	var	user_roletoken_tenant0_k2hr3_entest_obj_role_03	= '';
	var	user_roletoken_tenant0_k2hr3_entest_str_role_01	= '';
	var	user_roletoken_tenant0_k2hr3_entest_str_role_02	= '';
	var	user_roletoken_tenant0_k2hr3_entest_str_role_03	= '';
	var	user_roletoken_tenant0_test_service_tenant		= '';
	var	user_roletoken_testservice_tenant0_acr_role		= '';
	var	ip_roletoken_tenant0_k2hr3_entest_obj_role_01	= '';
	var	ip_roletoken_tenant0_k2hr3_entest_obj_role_02	= '';
	var	ip_roletoken_tenant0_k2hr3_entest_obj_role_03	= '';
	var	ip_roletoken_tenant0_k2hr3_entest_str_role_01	= '';
	var	ip_roletoken_tenant0_k2hr3_entest_str_role_02	= '';
	var	ip_roletoken_tenant0_k2hr3_entest_str_role_03	= '';
	var	ip_roletoken_tenant0_test_service_tenant		= '';
	var	ip_roletoken_testservice_tenant0_acr_role		= '';

	var	user_roletoken_tenant0_autotest_post_dummy_role1= '';	// eslint-disable-line no-unused-vars
	var	user_roletoken_tenant0_autotest_post_dummy_role3= '';	// eslint-disable-line no-unused-vars
	var	user_roletoken_tenant0_autotest_put_dummy_role1	= '';	// eslint-disable-line no-unused-vars
	var	user_roletoken_tenant0_autotest_put_dummy_role4	= '';	// eslint-disable-line no-unused-vars
	var	ip_roletoken_tenant0_autotest_post_dummy_role1	= '';	// eslint-disable-line no-unused-vars
	var	ip_roletoken_tenant0_autotest_post_dummy_role3	= '';	// eslint-disable-line no-unused-vars
	var	ip_roletoken_tenant0_autotest_put_dummy_role1	= '';	// eslint-disable-line no-unused-vars
	var	ip_roletoken_tenant0_autotest_put_dummy_role4	= '';	// eslint-disable-line no-unused-vars

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
	// Run Test(POST - NEW SET - SUCCESS/FAILURE)
	//
	it('POST /v1/role : set all new role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				role: {
					name:	'autotest_post_dummy_role1',								// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
					policies: [															// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					],
					alias: [															// alias:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_post_dummy_role2'
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
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: []});

						done();
					});
			});
	});

	it('POST /v1/role : failure(no token) set all new role(autotest_post_error_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.send({
				role: {
					name:	'autotest_post_error_role1',								// path:		yrn:yahoo:::tenant0:role:autotest_post_error_role1
					policies: [															// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					],
					alias: [															// alias:		yrn:yahoo:::tenant0:role:autotest_post_error_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_post_error_role2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('There is no x-auth-token header');

				done();
			});
	});

	it('POST /v1/role : failure(invalid user token) set all new role(autotest_post_error_role1) by scoped token with status 401', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_token')										// invalid token
			.send({
				role: {
					name:	'autotest_post_error_role1',								// path:		yrn:yahoo:::tenant0:role:autotest_post_error_role1
					policies: [															// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					],
					alias: [															// alias:		yrn:yahoo:::tenant0:role:autotest_post_error_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_post_error_role2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token(invalid_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('POST /v1/role : failure(invalid role token) set all new role(autotest_post_error_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=invalid_token')										// invalid token
			.send({
				role: {
					name:	'autotest_post_error_role1',								// path:		yrn:yahoo:::tenant0:role:autotest_post_error_role1
					policies: [															// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					],
					alias: [															// alias:		yrn:yahoo:::tenant0:role:autotest_post_error_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_post_error_role2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('x-auth-token header token is not role token');

				done();
			});
	});

	it('POST /v1/role : failure set all new role(no role name) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				role: {
					policies: [															// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					],
					alias: [															// alias:		yrn:yahoo:::tenant0:role:autotest_post_error_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_post_error_role2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('role:name field is wrong : undefined');

				done();
			});
	});

	it('POST /v1/role : failure(no data) set all new role(autotest_post_error_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				wrong_role: {
					name:	'autotest_post_error_role1',								// path:		yrn:yahoo:::tenant0:role:autotest_post_error_role1
					policies: [															// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					],
					alias: [															// alias:		yrn:yahoo:::tenant0:role:autotest_post_error_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_post_error_role2'
					]
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('POST body does not have role data');

				done();
			});
	});

	//
	// Run Test(POST - ADD HOST - SUCCESS/FAILURE)
	//
	it('POST /v1/role : add one host to role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'role.auto.test.k2hr3.dummy.yahoo.co.jp',				// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
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

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: []});

						done();
					});
			});
	});

	it('POST /v1/role : failure(no token) add host to role(autotest_post_dummy_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.send({
				host: {
					host:		'role.auto.test.k2hr3.dummy.yahoo.co.jp',				// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('There is no x-auth-token header');

				done();
			});
	});

	it('POST /v1/role : failure(invalid user token) add host to role(autotest_post_dummy_role1) by scoped token with status 401', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_token')										// invalid token
			.send({
				host: {
					host:		'role.auto.test.k2hr3.dummy.yahoo.co.jp',				// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
			})
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token(invalid_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('POST /v1/role : failure(invalid role token) add host to role(autotest_post_dummy_role1) by scoped token with status 401', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=invalid_token')										// invalid token
			.send({
				host: {
					host:		'role.auto.test.k2hr3.dummy.yahoo.co.jp',				// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
			})
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token(invalid_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('POST /v1/role : add one host to role(new autotest_post_dummy_role3) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role3')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role3
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'role.auto.test.k2hr3.dummy.yahoo.co.jp',				// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
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

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: []});

						done();
					});
			});
	});

	it('POST /v1/role : failure(no data) add host to role(autotest_post_dummy_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				wrong_host: {
					host:		'role.auto.test.k2hr3.dummy.yahoo.co.jp',				// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		false
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('POST body does not have host data');

				done();
			});
	});

	it('POST /v1/role : add no host name to role(autotest_post_dummy_role3) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role3')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role3
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
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

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('POST /v1/role : add empty host data to role(autotest_post_dummy_role3) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role3')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role3
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
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

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('POST /v1/role : add empty host array to role(autotest_post_dummy_role3) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role3')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role3
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: [],
				clear_hostname:	false,
				clear_ips:		false
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
					.get('/v1/role/autotest_post_dummy_role3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('POST /v1/role : add some host to role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: [
					{
						host:		'role1.auto.test.k2hr3.dummy.yahoo.co.jp',			// host:	role1.auto.test.k2hr3.dummy.yahoo.co.jp
						port:		8000,												// port:	8000
						cuk:		null,												// cuk:		null
						extra:		null												// extra:	null
					},
					{
						host:		'role2.auto.test.k2hr3.dummy.yahoo.co.jp',			// host:	role2.auto.test.k2hr3.dummy.yahoo.co.jp
						port:		null,												// port:	null(any)
						cuk:		null,												// cuk:		null
						extra:		null												// extra:	null
					},
					{
						host:		'role3.auto.test.k2hr3.dummy.yahoo.co.jp',			// host:	role3.auto.test.k2hr3.dummy.yahoo.co.jp
						port:		8000,												// port:	8000
						cuk:		'cuk',												// cuk:		cuk
						extra:		'extra'												// extra:	extra
					},
				],
				clear_hostname:	false,
				clear_ips:		false
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
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * ', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp 8000 ', 'role2.auto.test.k2hr3.dummy.yahoo.co.jp * ', 'role3.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra'], ips: []});

						done();
					});
			});
	});

	it('POST /v1/role : add some same host with aonther port to role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: [
					{
						host:		'role1.auto.test.k2hr3.dummy.yahoo.co.jp',			// host:	role1.auto.test.k2hr3.dummy.yahoo.co.jp
						port:		0,													// port:	0(any) : 8000 -> 0
						cuk:		null,												// cuk:		null
						extra:		null												// extra:	null
					},
					{
						host:		'role2.auto.test.k2hr3.dummy.yahoo.co.jp',			// host:	role2.auto.test.k2hr3.dummy.yahoo.co.jp
						port:		8000,												// port:	8000 : 0 <- 8000
						cuk:		null,												// cuk:		null
						extra:		null												// extra:	null
					},
					{
						host:		'role3.auto.test.k2hr3.dummy.yahoo.co.jp',			// host:	role3.auto.test.k2hr3.dummy.yahoo.co.jp
						port:		9000,												// port:	9000 : 8000 + 9000
						cuk:		'cuk',												// cuk:		cuk
						extra:		'extra'												// extra:	extra
					},
				],
				clear_hostname:	false,
				clear_ips:		false
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
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * ', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * ', 'role2.auto.test.k2hr3.dummy.yahoo.co.jp 8000 ', 'role3.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra', 'role3.auto.test.k2hr3.dummy.yahoo.co.jp 9000 cuk extra'], ips: []});

						done();
					});
			});
	});

	it('POST /v1/role : add one host with clear to role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'role0.auto.test.k2hr3.dummy.yahoo.co.jp',				// host:	role0.auto.test.k2hr3.dummy.yahoo.co.jp
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	true,													// clear all hostname
				clear_ips:		false
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
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role0.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: []});

						done();
					});
			});
	});

	it('POST /v1/role : add one ip to role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
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

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role0.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('POST /v1/role : add some ip to role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: [
					{
						host:		'127.0.0.2',										// host:	127.0.0.2
						port:		8000,												// port:	8000
						cuk:		null,												// cuk:		null
						extra:		null												// extra:	null
					},
					{
						host:		'127.0.0.3',										// host:	127.0.0.3
						port:		null,												// port:	null(any)
						cuk:		null,												// cuk:		null
						extra:		null												// extra:	null
					},
					{
						host:		'127.0.0.4',										// host:	127.0.0.4
						port:		8000,												// port:	8000
						cuk:		'cuk',												// cuk:		cuk
						extra:		'extra'												// extra:	extra
					},
				],
				clear_hostname:	false,
				clear_ips:		false
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
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role0.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ', '127.0.0.2 8000 ', '127.0.0.3 * ', '127.0.0.4 8000 cuk extra']});

						done();
					});
			});
	});

	it('POST /v1/role : add some same ip with another port to role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: [
					{
						host:		'127.0.0.2',										// host:	127.0.0.2
						port:		0,													// port:	0(any) : 8000 -> 0
						cuk:		'cuk',												// cuk:		cuk
						extra:		'extra'												// extra:	extra
					},
					{
						host:		'127.0.0.3',										// host:	127.0.0.3
						port:		8000,												// port:	8000 : 0 <- 8000
						cuk:		'cuk',												// cuk:		cuk
						extra:		'extra'												// extra:	extra
					},
					{
						host:		'127.0.0.4',										// host:	127.0.0.4
						port:		9000,												// port:	9000 : 8000 + 9000
						cuk:		'cuk',												// cuk:		cuk
						extra:		'extra'												// extra:	extra
					},
				],
				clear_hostname:	false,
				clear_ips:		false
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
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role0.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ', '127.0.0.2 * cuk extra', '127.0.0.3 8000 cuk extra', '127.0.0.4 8000 cuk extra', '127.0.0.4 9000 cuk extra']});

						done();
					});
			});
	});

	it('POST /v1/role : add one ip with clear to role(autotest_post_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/autotest_post_dummy_role1')									// path:		yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.send({
				host: {
					host:		'127.0.0.1',											// host:	127.0.0.1
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
				},
				clear_hostname:	false,
				clear_ips:		true													// clear all hostname
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
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role0.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('POST /v1/role : add ip to role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02')// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)					// token:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
			.send({
				host: {
					port:		0,														// port:	0(any)
					cuk:		null,													// cuk:		null
					extra:		null													// extra:	null
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
					.get('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 * ');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.2.0 * ');
						expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.1.2.1 * ');
						expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('127.10.10.10 * ');

						done();
					});
			});
	});

	it('POST /v1/role : overwrite ip to role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by role token with status 201', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/role/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02')// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)					// token:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
			.send({
				host: {
					port:		8000,													// port:	8000 : 0 -> 8000
					cuk:		'cuk',													// cuk:		cuk
					extra:		'extra'													// extra:	extra
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
					.get('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 8000 cuk extra');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.2.0 * ');
						expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.1.2.1 * ');
						expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('127.10.10.10 * ');

						done();
					});
			});
	});

	//
	// Run Test(PUT - NEW SET - SUCCESS/FAILURE)
	//
	it('PUT /v1/role : set all new role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/role';
		uri		+= '?name=autotest_put_dummy_role1';									// path:		yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '&policies=' + JSON.stringify([										// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					]);
		uri		+= '&alias=' + JSON.stringify([											// alias:		yrn:yahoo:::tenant0:role:autotest_put_dummy_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_put_dummy_role2'
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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: []});

						done();
					});
			});
	});

	it('PUT /v1/role : failure(no token) set all new role(autotest_post_error_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/role';
		uri		+= '?name=autotest_post_error_role1';									// path:		yrn:yahoo:::tenant0:role:autotest_post_error_role1
		uri		+= '&policies=' + JSON.stringify([										// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					]);
		uri		+= '&alias=' + JSON.stringify([											// alias:		yrn:yahoo:::tenant0:role:autotest_put_dummy_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_put_dummy_role2'
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
				expect(res.body.message).to.be.an('string').to.equal('There is no x-auth-token header');

				done();
			});
	});

	it('PUT /v1/role : failure(invalid user token) set all new role(autotest_post_error_role1) by scoped token with status 401', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/role';
		uri		+= '?name=autotest_post_error_role1';									// path:		yrn:yahoo:::tenant0:role:autotest_post_error_role1
		uri		+= '&policies=' + JSON.stringify([										// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					]);
		uri		+= '&alias=' + JSON.stringify([											// alias:		yrn:yahoo:::tenant0:role:autotest_put_dummy_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_put_dummy_role2'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_token')										// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token(invalid_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('PUT /v1/role : failure(invalid role token) set all new role(autotest_post_error_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/role';
		uri		+= '?name=autotest_post_error_role1';									// path:		yrn:yahoo:::tenant0:role:autotest_post_error_role1
		uri		+= '&policies=' + JSON.stringify([										// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					]);
		uri		+= '&alias=' + JSON.stringify([											// alias:		yrn:yahoo:::tenant0:role:autotest_put_dummy_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_put_dummy_role2'
					]);
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=invalid_token')										// invalid token
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('x-auth-token header token is not role token');

				done();
			});
	});

	it('PUT /v1/role : failure set all new role(no role name) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/role';
		uri		+= '?policies=' + JSON.stringify([										// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					]);
		uri		+= '&alias=' + JSON.stringify([											// alias:		yrn:yahoo:::tenant0:role:autotest_put_dummy_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_put_dummy_role2'
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
				expect(res.body.message).to.be.an('string').to.equal('role:name field is wrong : undefined');

				done();
			});
	});

	it('PUT /v1/role : failure(no data) set all new role(autotest_post_error_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/role';
		uri		+= '?wrong_name=autotest_post_error_role1';								// path:		yrn:yahoo:::tenant0:role:autotest_post_error_role1
		uri		+= '&wrong_policies=' + JSON.stringify([								// policies:	yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03
						'yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03'
					]);
		uri		+= '&wrong_alias=' + JSON.stringify([									// alias:		yrn:yahoo:::tenant0:role:autotest_put_dummy_role2(not exist)
						'yrn:yahoo:::tenant0:role:autotest_put_dummy_role2'
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
				expect(res.body.message).to.be.an('string').to.equal('role:name field is wrong : undefined');

				done();
			});
	});

	//
	// Run Test(PUT - ADD HOST - SUCCESS/FAILURE)
	//
	it('PUT /v1/role : add one host to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role.auto.test.k2hr3.dummy.yahoo.co.jp';						// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: []});

						done();
					});
			});
	});

	it('PUT /v1/role : failure(no token) add one host to role(autotest_put_dummy_role1) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role.auto.test.k2hr3.dummy.yahoo.co.jp';						// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('There is no x-auth-token header');

				done();
			});
	});

	it('PUT /v1/role : failure(invalid user token) add one host to role(autotest_put_dummy_role1) by scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role.auto.test.k2hr3.dummy.yahoo.co.jp';						// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_token')										// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token(invalid_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('PUT /v1/role : failure(invalid role token) add one host to role(autotest_put_dummy_role1) by scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role.auto.test.k2hr3.dummy.yahoo.co.jp';						// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=invalid_token')										// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token(invalid_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('PUT /v1/role : add one host to role(new autotest_put_dummy_role4) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role4';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role4
		uri		+= '?host=role.auto.test.k2hr3.dummy.yahoo.co.jp';						// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

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
					.get('/v1/role/autotest_put_dummy_role4?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: []});

						done();
					});
			});
	});

	it('PUT /v1/role : failure(no data) add one host to role(autotest_put_dummy_role4) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role4';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role4
		uri		+= '?wrong_host=role.auto.test.k2hr3.dummy.yahoo.co.jp';				// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&wrong_port=0';														// port:	0(any)
		uri		+= '&wrong_cuk=';														// cuk:		null
		uri		+= '&wrong_extra=';														// extra:	null

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
					.get('/v1/role/autotest_put_dummy_role4?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('PUT /v1/role : add no host name to role(autotest_put_dummy_role4) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role4';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role4
		uri		+= '?port=0';															// port:	0(any)
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

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
					.get('/v1/role/autotest_put_dummy_role4?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('PUT /v1/role : add empty host data to role(autotest_put_dummy_role4) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role4';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role4
		uri		+= '?host=';															// host:	null
		uri		+= '&port=';															// port:	null
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

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
					.get('/v1/role/autotest_put_dummy_role4?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('PUT /v1/role : add second host to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role1.auto.test.k2hr3.dummy.yahoo.co.jp';						// host:	role1.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=8000';														// port:	8000
		uri		+= '&cuk=cuk';															// cuk:		cuk
		uri		+= '&extra=' + JSON.stringify('extra');									// extra:	extra

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * ', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra'], ips: []});

						done();
					});
			});
	});

	it('PUT /v1/role : add same host with aonther port(0) to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role1.auto.test.k2hr3.dummy.yahoo.co.jp';						// host:	role1.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=0';															// port:	0(any) : 8000 -> 0
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp * ', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: []});

						done();
					});
			});
	});

	it('PUT /v1/role : add same host with aonther port(8000) to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role.auto.test.k2hr3.dummy.yahoo.co.jp';						// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=8000';														// port:	8000 : 0 -> 8000
		uri		+= '&cuk=cuk';															// cuk:		cuk
		uri		+= '&extra=' + JSON.stringify('extra');									// extra:	extra

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: []});

						done();
					});
			});
	});

	it('PUT /v1/role : add one ip to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('PUT /v1/role : add second ip to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=127.0.0.2';													// ip:		127.0.0.2
		uri		+= '&port=8000';														// port:	8000
		uri		+= '&cuk=cuk';															// cuk:		cuk
		uri		+= '&extra=' + JSON.stringify('extra');									// extra:	extra

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ', '127.0.0.2 8000 cuk extra']});

						done();
					});
			});
	});

	it('PUT /v1/role : add same ip with aonther port(0) to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=127.0.0.2';													// ip:		127.0.0.2
		uri		+= '&port=0';															// port:	0(any) : 8000 -> 0
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 * ', '127.0.0.2 * ']});

						done();
					});
			});
	});

	it('PUT /v1/role : add same ip with aonther port(8000) to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1
		uri		+= '&port=8000';														// port:	8000 : 0 -> 8000
		uri		+= '&cuk=cuk';															// cuk:		cuk
		uri		+= '&extra=' + JSON.stringify('extra');									// extra:	extra

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 8000 cuk extra', '127.0.0.2 * ']});

						done();
					});
			});
	});

	it('PUT /v1/role : readd same ip with any port(0) to role(autotest_put_dummy_role1) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=127.0.0.1';													// ip:		127.0.0.1
		uri		+= '&port=0';															// port:	0 : 8000 -> 0
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=' + JSON.stringify('extra');									// extra:	extra

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
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 *  extra', '127.0.0.2 * ']});

						done();
					});
			});
	});

	it('PUT /v1/role : add ip to role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by role token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?port=0';																		// port:	0(any)
		uri		+= '&cuk=';																			// cuk:		null
		uri		+= '&extra=';									 									// extra:	null

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)				// token:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
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
					.get('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 * ');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.2.0 * ');
						expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.1.2.1 * ');
						expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('127.10.10.10 * ');

						done();
					});
			});
	});

	it('PUT /v1/role : overwrite ip to role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by role token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?port=8000';																	// port:	8000 : 0 -> 8000
		uri		+= '&cuk=cuk';																		// cuk:		cuk
		uri		+= '&extra=' + JSON.stringify('extra');												// extra:	extra

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.roletoken.tenant0_k2hr3_entest_obj_role_02)				// token:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
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
					.get('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 8000 cuk extra');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.2.0 * ');
						expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.1.2.1 * ');
						expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('127.10.10.10 * ');

						done();
					});
			});
	});

	//
	// Run Test(GET - ROLE - SUCCESS)
	//
	it('GET /v1/role : get not expanded role(k2hr3_entest_obj_role_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_01');
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_01.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_01.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(3);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.2.0 * ');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.0.2.1 * ');
				expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.10.10.10 * ');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(full yrn k2hr3_entest_obj_role_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_01');
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_01.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_01.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(3);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.2.0 * ');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.0.2.1 * ');
				expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.10.10.10 * ');

				done();
			});
	});

	it('GET /v1/role : failure get not expanded role(k2hr3_entest_obj_role_01) by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		uri		+= '?expand=false';														// expand:	false

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_token')										// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token(invalid_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(not_exist_role) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/not_exist_role';													// path:	yrn:yahoo:::tenant0:role:not_exist_role
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: []});

				done();
			});
	});

	it('GET /v1/role : failure get not expanded role(no role name) by scoped token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '';																	// path:	not set
		uri		+= '?expand=false';														// expand:	false

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request url does not have role name');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 8000 cuk extra');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.2.0 * ');
				expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.1.2.1 * ');
				expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('127.10.10.10 * ');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(k2hr3_entest_obj_role_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_03';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_03.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_03.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 * ');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.10.10.10 * ');
				expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.3.1.0 * ');
				expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('127.3.1.1 * ');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(k2hr3_entest_str_role_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_01');
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03');
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(3);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.1.0 * ');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.0.1.1 * ');
				expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.10.10.10 * ');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_02');
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03');
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_str_02.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_str_02.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(3);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.1.1.0 * ');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.1.1 * ');
				expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.10.10.10 * ');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(k2hr3_entest_str_role_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_03';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_03');
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_str_03.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_str_03.k2hr3.yahoo.co.jp * ');
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(3);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.10.10.10 * ');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.3.1.0 * ');
				expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.3.1.1 * ');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(test_service_tenant) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/test_service_tenant';												// path:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:testservice::tenant0:role:acr-role');
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.1.0.1 * ');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.10.10.10 * ');

				done();
			});
	});

	it('GET /v1/role : get not expanded role(testservice - acr-role) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:testservice::tenant0:role:acr-role';						// path:	yrn:yahoo:testservice::tenant0:role:acr-role
		uri		+= '?expand=false';														// expand:	false

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:testservice::tenant0:policy:acr-policy');
				expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.10.10.10 * ');

				done();
			});
	});

	it('GET /v1/role : get expanded role(k2hr3_entest_obj_role_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01
		uri		+= '?expand=true';														// expand:	true

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
				expect(res.body.role.policies[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_01');

				done();
			});
	});

	it('GET /v1/role : get expanded role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?expand=true';														// expand:	true

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(3);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
				expect(res.body.role.policies[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_01');
				expect(res.body.role.policies[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');

				done();
			});
	});

	it('GET /v1/role : get expanded role(k2hr3_entest_obj_role_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_03';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03
		uri		+= '?expand=true';														// expand:	true

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');

				done();
			});
	});

	it('GET /v1/role : get expanded role(k2hr3_entest_str_role_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		uri		+= '?expand=true';														// expand:	true

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_03');
				expect(res.body.role.policies[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_01');

				done();
			});
	});

	it('GET /v1/role : get expanded role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02
		uri		+= '?expand=true';														// expand:	true

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(3);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_03');
				expect(res.body.role.policies[1]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_01');
				expect(res.body.role.policies[2]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_02');

				done();
			});
	});

	it('GET /v1/role : get expanded role(k2hr3_entest_str_role_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_03';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03
		uri		+= '?expand=true';														// expand:	true

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_03');

				done();
			});
	});

	it('GET /v1/role : get expanded role(test_service_tenant) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/test_service_tenant';												// path:	yrn:yahoo:::tenant0:role:test_service_tenant
		uri		+= '?expand=true';														// expand:	true

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:testservice::tenant0:policy:acr-policy');

				done();
			});
	});

	it('GET /v1/role : get expanded role(testservice - acr-role) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:testservice::tenant0:role:acr-role';						// path:	yrn:yahoo:testservice::tenant0:role:acr-role
		uri		+= '?expand=true';														// expand:	true

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
				expect(res.body.role).to.be.an('object');
				expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:testservice::tenant0:policy:acr-policy');

				done();
			});
	});

	//
	// Run Test(GET - ROLE TOKEN - SUCCESS/FAILURE)
	//
	it('GET /v1/role/token : failure get role token(not_exist_role) by scoped token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/not_exist_role';													// path:	yrn:yahoo:::tenant0:role:not_exist_role

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('could not get role id(yrn:yahoo:::tenant0:role:not_exist_role/id) value, or it is wrong value(null).');

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

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
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				user_roletoken_tenant0_k2hr3_entest_obj_role_01 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(full yrn k2hr3_entest_obj_role_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

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
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				user_roletoken_tenant0_k2hr3_entest_obj_role_01 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : failure(invalid token) get role token(k2hr3_entest_obj_role_01) by scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=wrong_token')										// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(wrong_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02

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
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				user_roletoken_tenant0_k2hr3_entest_obj_role_02 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_03';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03

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
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				user_roletoken_tenant0_k2hr3_entest_obj_role_03 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_str_role_01) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01

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
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				user_roletoken_tenant0_k2hr3_entest_str_role_01 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02

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
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				user_roletoken_tenant0_k2hr3_entest_str_role_02 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_str_role_03) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_03';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03

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
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				user_roletoken_tenant0_k2hr3_entest_str_role_03 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(test_service_tenant) by scoped token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/test_service_tenant';												// path:	yrn:yahoo:::tenant0:role:test_service_tenant

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
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				user_roletoken_tenant0_test_service_tenant = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : failure get role token(testservice - acr-role) by scoped token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:testservice::tenant0:role:acr-role';						// path:	yrn:yahoo:testservice::tenant0:role:acr-role

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('could not get role id(yrn:yahoo:::tenant0:role:acr-role/id) value, or it is wrong value(null).');

				user_roletoken_testservice_tenant0_acr_role = '';

				done();
			});
	});

	it('GET /v1/role/token : failure get role token(not_exist_role) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:not_exist_role';							// path:	yrn:yahoo:::tenant0:role:not_exist_role

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Not found ip(127.0.0.1) with port(0) in tenant(tenant0) + role(not_exist_role)');

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_01) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_k2hr3_entest_obj_role_01 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : failure get role token(not full yrn k2hr3_entest_obj_role_01) by no token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01';											// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request role name which is not full yrn, and not token. role name must be full yrn, if token is not specified.');

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_k2hr3_entest_obj_role_02 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_03) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_k2hr3_entest_obj_role_03 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : failure(not exist ip) get role token(k2hr3_entest_str_role_01) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('Not found ip(127.0.0.1) with port(0) in tenant(tenant0) + role(k2hr3_entest_str_role_01)');

				ip_roletoken_tenant0_k2hr3_entest_str_role_01 = '';

				done();
			});
	});

	it('GET /v1/role/token : failure(not exist ip) get role token(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('Not found ip(127.0.0.1) with port(0) in tenant(tenant0) + role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02)');

				ip_roletoken_tenant0_k2hr3_entest_str_role_02 = '';

				done();
			});
	});

	it('GET /v1/role/token : failure(not exist ip) get role token(k2hr3_entest_str_role_03) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';				// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('Not found ip(127.0.0.1) with port(0) in tenant(tenant0) + role(k2hr3_entest_str_role_03)');

				ip_roletoken_tenant0_k2hr3_entest_str_role_03 = '';

				done();
			});
	});

	it('GET /v1/role/token : failure(not exist ip) get role token(test_service_tenant) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:test_service_tenant';						// path:	yrn:yahoo:::tenant0:role:test_service_tenant

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('Not found ip(127.0.0.1) with port(0) in tenant(tenant0) + role(test_service_tenant)');

				ip_roletoken_tenant0_test_service_tenant = '';

				done();
			});
	});

	it('GET /v1/role/token : failure get role token(testservice - acr-role) by no token with status 404', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:testservice::tenant0:role:acr-role';						// path:	yrn:yahoo:testservice::tenant0:role:acr-role

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)							// tenant0
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('could not get role id(yrn:yahoo:::tenant0:role:acr-role/id) value, or it is wrong value(null).');

				ip_roletoken_testservice_tenant0_acr_role = '';

				done();
			});
	});

	it('GET(FOR DUMMY ROLE) /v1/role/token : get role token(autotest_post_dummy_role1) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:autotest_post_dummy_role1';				// path:	yrn:yahoo:::tenant0:role:autotest_post_dummy_role1

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_autotest_post_dummy_role1 = res.body.token;

				done();
			});
	});

	it('GET(FOR DUMMY ROLE) /v1/role/token : get role token(autotest_post_dummy_role3) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:autotest_post_dummy_role3';				// path:	yrn:yahoo:::tenant0:role:autotest_post_dummy_role3

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_autotest_post_dummy_role3 = res.body.token;

				done();
			});
	});

	it('GET(FOR DUMMY ROLE) /v1/role/token : get role token(autotest_put_dummy_role1) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:autotest_put_dummy_role1';				// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_autotest_put_dummy_role1 = res.body.token;

				done();
			});
	});

	it('GET(FOR DUMMY ROLE) /v1/role/token : get role token(autotest_put_dummy_role4) by no token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:autotest_put_dummy_role4';				// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role4

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_autotest_put_dummy_role4 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : failure get role token(not_exist_role) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/not_exist_role';														// path:	yrn:yahoo:::tenant0:role:not_exist_role

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_01)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request ip address and role token are not same.');

				done();
			});
	});

	it('GET /v1/role/token : failure(role token by user) get role token(k2hr3_entest_obj_role_01) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_01)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request ip address and role token are not same.');

				done();
			});
	});

	it('GET /v1/role/token : failure(role token by user) get role token(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_02)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request ip address and role token are not same.');

				done();
			});
	});

	it('GET /v1/role/token : failure(role token by user) get role token(k2hr3_entest_obj_role_03) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_03';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_03)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request ip address and role token are not same.');

				done();
			});
	});

	it('GET /v1/role/token : failure(role token by user) get role token(k2hr3_entest_str_role_01) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_str_role_01)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request ip address and role token are not same.');

				done();
			});
	});

	it('GET /v1/role/token : failure(role token by user) get role token(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_str_role_02)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request ip address and role token are not same.');

				done();
			});
	});

	it('GET /v1/role/token : failure(role token by user) get role token(k2hr3_entest_str_role_03) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_03';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_str_role_03)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request ip address and role token are not same.');

				done();
			});
	});

	it('GET /v1/role/token : failure(role token by user) get role token(test_service_tenant) by role token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/test_service_tenant';													// path:	yrn:yahoo:::tenant0:role:test_service_tenant

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_test_service_tenant)			// role token by user
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('GET request ip address and role token are not same.');

				done();
			});
	});

	it('GET /v1/role/token : failure(role token by user) get role token(testservice - acr-role) by role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:testservice::tenant0:role:acr-role';							// path:	yrn:yahoo:testservice::tenant0:role:acr-role

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_testservice_tenant0_acr_role)		// role token by user(= empty)
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token() is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_01) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_01)		// role token by ip
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_k2hr3_entest_obj_role_01 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(full yrn k2hr3_entest_obj_role_01) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_01)		// role token by ip
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_k2hr3_entest_obj_role_01 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : failure(invalid token) get role token(k2hr3_entest_obj_role_01) by role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=wrong_token')											// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(wrong_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_02)		// role token by ip
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_k2hr3_entest_obj_role_02 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : get role token(k2hr3_entest_obj_role_03) by role token with status 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_obj_role_03';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_03)		// role token by ip
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.token).to.be.an('string').to.not.empty;
				expect(res.body.registerpath).to.be.an('string').to.not.empty;

				ip_roletoken_tenant0_k2hr3_entest_obj_role_03 = res.body.token;

				done();
			});
	});

	it('GET /v1/role/token : failure(wrong ip token) get role token(k2hr3_entest_str_role_01) by role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_str_role_01)		// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token() is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/role/token : failure(wrong ip token) get role token(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_str_role_02)		// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token() is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/role/token : failure(wrong ip token) get role token(k2hr3_entest_str_role_03) by role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/k2hr3_entest_str_role_03';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_str_role_03)		// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token() is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/role/token : failure(wrong ip token) get role token(test_service_tenant) by role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/test_service_tenant';													// path:	yrn:yahoo:::tenant0:role:test_service_tenant

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_test_service_tenant)			// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token() is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/role/token : failure(wrong ip token) get role token(testservice - acr-role) by role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role/token';
		uri		+= '/yrn:yahoo:testservice::tenant0:role:acr-role';							// path:	yrn:yahoo:testservice::tenant0:role:acr-role

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_testservice_tenant0_acr_role)			// role token by ip(= empty)
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.an('string').to.equal('token() is not existed, because it is expired or not set yet.');

				done();
			});
	});

	//
	// Run Test(HEAD - SUCCESS/FAILURE)
	//
	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_01) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(full yrn k2hr3_entest_obj_role_01) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : failure check access to role(k2hr3_entest_obj_role_01) by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_token')											// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/role : failure check access to role(not_exist_role) by invalid scoped token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/not_exist_role';														// path:	yrn:yahoo:::tenant0:role:not_exist_role

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'U=invalid_token')											// invalid token
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_03) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_03';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_str_role_01) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : failure check access to role(k2hr3_entest_obj_role_01) by no scoped token with status 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_str_role_03) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_03';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(test_service_tenant) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/test_service_tenant';													// path:	yrn:yahoo:::tenant0:role:test_service_tenant

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(testservice - acr-role) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:testservice::tenant0:role:acr-role';							// path:	yrn:yahoo:testservice::tenant0:role:acr-role

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_01) by user role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_01)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(full yrn k2hr3_entest_obj_role_01) by user role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_01)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by user role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_02)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_03) by user role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_03';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_03)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_str_role_01) by user role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_str_role_01)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by user role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_str_role_02)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_str_role_03) by user role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_03';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_str_role_03)	// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(test_service_tenant) by user role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/test_service_tenant';													// path:	yrn:yahoo:::tenant0:role:test_service_tenant

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_test_service_tenant)			// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : failure check access to role(testservice - acr-role) by user role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:testservice::tenant0:role:acr-role';							// path:	yrn:yahoo:testservice::tenant0:role:acr-role

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_testservice_tenant0_acr_role)		// role token by user(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_01) by ip role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_01)		// role token by ip
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by ip role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_02)		// role token by ip
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : check access to role(k2hr3_entest_obj_role_03) by ip role token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_03)		// role token by ip
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/role : failure check access to role(k2hr3_entest_str_role_01) by ip role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_str_role_01)		// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/role : failure check access to role(k2hr3_entest_str_role_01/k2hr3_entest_str_role_02) by ip role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02';	// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01/k2hr3_entest_str_role_02

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_str_role_02)		// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});
	
	it('HEAD /v1/role : failure check access to role(k2hr3_entest_str_role_03) by ip role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_str_role_03)		// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/role : failure check access to role(test_service_tenant) by ip role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:test_service_tenant';							// path:	yrn:yahoo:::tenant0:role:test_service_tenant

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_test_service_tenant)			// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	it('HEAD /v1/role : failure check access to role(testservice - acr-role) by ip role token with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:yrn:yahoo:testservice::tenant0:role:acr-role';// path:	yrn:yahoo:testservice::tenant0:role:acr-role

		chai.request(app)
			.head(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_testservice_tenant0_acr_role)			// role token by ip(empty)
			.end(function(err, res){
				expect(res).to.have.status(401);

				done();
			});
	});

	//
	// Run Test(DELETE - SUCCESS/FAILURE)
	//
	it('GET ROLE TOKEN BY USER FOR DUMMIES : dummy roles(autotest_post_dummy_role1, autotest_post_dummy_role3, autotest_put_dummy_role1, autotest_put_dummy_role4) with status 201', function(done){	// eslint-disable-line no-undef
		var	r3token	= require('../lib/k2hr3tokens');
		var	apiutil	= require('../lib/k2hr3apiutil');

		var	result;
		var	expire	= 24 * 60 * 60;																	// expire is 24H
		var	base_id	= apiutil.convertHexString128ToBin64(alltokens.scopedtoken.tenant0.slice(2));	// [NOTE] cut prefix 'U='

		// Get user role token for yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
		result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:autotest_post_dummy_role1', expire);
		expect(result).to.be.an('object');
		expect(result.result).to.be.a('boolean').to.be.true;
		expect(result.token).to.be.an('string').to.not.empty;
		user_roletoken_tenant0_autotest_post_dummy_role1 = result.token;

		// Get user role token for yrn:yahoo:::tenant0:role:autotest_post_dummy_role3
		result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:autotest_post_dummy_role3', expire);
		expect(result).to.be.an('object');
		expect(result.result).to.be.a('boolean').to.be.true;
		expect(result.token).to.be.an('string').to.not.empty;
		user_roletoken_tenant0_autotest_post_dummy_role3 = result.token;

		// Get user role token for yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:autotest_put_dummy_role1', expire);
		expect(result).to.be.an('object');
		expect(result.result).to.be.a('boolean').to.be.true;
		expect(result.token).to.be.an('string').to.not.empty;
		user_roletoken_tenant0_autotest_put_dummy_role1 = result.token;

		// Get user role token for yrn:yahoo:::tenant0:role:autotest_put_dummy_role4
		result = r3token.getRoleTokenByUser('dummyuser', 'tenant0', base_id, 'yrn:yahoo:::tenant0:role:autotest_put_dummy_role4', expire);
		expect(result).to.be.an('object');
		expect(result.result).to.be.a('boolean').to.be.true;
		expect(result.token).to.be.an('string').to.not.empty;
		user_roletoken_tenant0_autotest_put_dummy_role4 = result.token;

		done();
	});

	it('DELETE /v1/role : delete not exist hostname from role(k2hr3_entest_str_role_01) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_str_role_01';												// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_01
		uri		+= '?host=not.exist.hostname.yahoo.co.jp';

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/k2hr3_entest_str_role_01?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_str_pol_01');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_str_role_03');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_str_01.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_str_01.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(3);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.1.0 * ');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.0.1.1 * ');
						expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.10.10.10 * ');

						done();
					});
			});
	});

	it('DELETE /v1/role : delete not exist port from role(autotest_put_dummy_role1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';												// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role.auto.test.k2hr3.dummy.yahoo.co.jp';							// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=9000';															// port:	9000(not exist)

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: ['role.auto.test.k2hr3.dummy.yahoo.co.jp 8000 cuk extra', 'role1.auto.test.k2hr3.dummy.yahoo.co.jp * '], ips: ['127.0.0.1 *  extra', '127.0.0.2 * ']});

						done();
					});
			});
	});

	it('DELETE /v1/role : delete 127.0.0.1 with wrong port from role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';	// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?port=9000';																	// port:	9000(not exist)

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 8000 cuk extra');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.2.0 * ');
						expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.1.2.1 * ');
						expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('127.10.10.10 * ');

						done();
					});
			});
	});

	it('DELETE /v1/role : delete 127.0.0.1 with port from role(autotest_post_dummy_role1) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:autotest_post_dummy_role1';					// path:	yrn:yahoo:::tenant0:role:autotest_post_dummy_role1
		uri		+= '?port=8000';															// port:	8000 -> included port any

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_post_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('role0.auto.test.k2hr3.dummy.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete 127.0.0.1 without port from role(autotest_post_dummy_role3) by no token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/yrn:yahoo:::tenant0:role:autotest_post_dummy_role3';					// path:	yrn:yahoo:::tenant0:role:autotest_post_dummy_role3

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('role.auto.test.k2hr3.dummy.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete user role token for role(k2hr3_entest_obj_role_01) with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01';														// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_01)			// role token by user
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.head('/v1/role//k2hr3_entest_obj_role_01')
					.set('content-type', 'application/json')
					.set('x-auth-token', 'R=' + user_roletoken_tenant0_k2hr3_entest_obj_role_01)	// role token by user
					.end(function(err, res){
						expect(res).to.have.status(401);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete ip role token for role(k2hr3_entest_obj_role_01) with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01';														// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_01)				// role token by ip
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.head('/v1/role//k2hr3_entest_obj_role_01')
					.set('content-type', 'application/json')
					.set('x-auth-token', 'R=' + ip_roletoken_tenant0_k2hr3_entest_obj_role_01)	// role token by ip
					.end(function(err, res){
						expect(res).to.have.status(401);

						done();
					});
			});
	});

	it('DELETE /v1/role : failure delete invalid role token for role(autotest_post_dummy_role3) with status 401', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_post_dummy_role3';											// path:	yrn:yahoo:::tenant0:role:autotest_post_dummy_role3

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'R=invalid_token')											// invalid role token
			.end(function(err, res){
				expect(res).to.have.status(401);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('role.auto.test.k2hr3.dummy.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete not same cuk/included port from role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?host=127.0.0.1';														// host:	127.0.0.1
		uri		+= '&port=';																// port:	0(any) -> existed port is 8000
		uri		+= '&cuk=not_same_cuk';														// cuk:		not same cuk

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 8000 cuk extra');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.2.0 * ');
						expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.1.2.1 * ');
						expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('127.10.10.10 * ');

						done();
					});
			});
	});

	it('DELETE /v1/role : delete same cuk/included port from role(k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02';					// path:	yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02
		uri		+= '?host=127.0.0.1';														// host:	127.0.0.1
		uri		+= '&port=';																// port:	0(any) -> existed port is 8000
		uri		+= '&cuk=cuk';																// cuk:		same cuk(or null is succeed to deleting)

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/k2hr3_entest_obj_role_01/k2hr3_entest_obj_role_02?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_02');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:k2hr3_entest_obj_role_03');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('host01.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.hostnames[1]).to.be.a('string').to.equal('host02.k2hr3_entest_obj_02.k2hr3.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(3);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.1.2.0 * ');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.1.2.1 * ');
						expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('127.10.10.10 * ');

						done();
					});
			});
	});

	it('DELETE /v1/role : delete no cuk/included port from role(autotest_put_dummy_role1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';												// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1
		uri		+= '?host=role.auto.test.k2hr3.dummy.yahoo.co.jp';							// host:	role.auto.test.k2hr3.dummy.yahoo.co.jp
		uri		+= '&port=';																// port:	0(any) -> existed port is 8000
		uri		+= '&cuk=';																	// cuk:		not set

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.policies[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:policy:k2hr3_entest_obj_pol_03');
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.aliases[0]).to.be.a('string').to.equal('yrn:yahoo:::tenant0:role:autotest_put_dummy_role2');
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('role1.auto.test.k2hr3.dummy.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(2);
						expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 *  extra');
						expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('127.0.0.2 * ');

						done();
					});
			});
	});

	it('DELETE /v1/role : delete role(not_exist_role) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/not_exist_role';														// path:	yrn:yahoo:::tenant0:role:not_exist_role

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/not_exist_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete role(autotest_post_dummy_role1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_post_dummy_role1';											// path:	yrn:yahoo:::tenant0:role:autotest_post_dummy_role1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete role(autotest_post_dummy_role3) by invalid scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_post_dummy_role3';											// path:	yrn:yahoo:::tenant0:role:autotest_post_dummy_role3

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant1)								// tenant1
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.role.hosts.hostnames[0]).to.be.a('string').to.equal('role.auto.test.k2hr3.dummy.yahoo.co.jp * ');
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete role(autotest_post_dummy_role3) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_post_dummy_role3';											// path:	yrn:yahoo:::tenant0:role:autotest_post_dummy_role3

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_post_dummy_role3?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete role(autotest_put_dummy_role1) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role1';												// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_put_dummy_role1?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	it('DELETE /v1/role : delete role(autotest_put_dummy_role4) by scoped token with status 204', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_put_dummy_role4';												// path:	yrn:yahoo:::tenant0:role:autotest_put_dummy_role4

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)								// tenant0
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_put_dummy_role4?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)						// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object');
						expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);

						done();
					});
			});
	});

	//
	// Run Test(PREPARE - CUK IP DELETE)
	//
	it('PUT /v1/role : prepare - set amin role(autotest_delhost_role) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/role';
		uri		+= '?name=autotest_delhost_role';										// path:		yrn:yahoo:::tenant0:role:autotest_delhost_role
		uri		+= '&policies=';														// policies:	empty
		uri		+= '&alias=';															// alias:		empty
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
				// Check role data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_delhost_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: []});

						done();
					});
			});
	});

	it('PUT /v1/role : prepare - add localhost to amin role(autotest_delhost_role) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_delhost_role';											// path:	yrn:yahoo:::tenant0:role:autotest_delhost_role
		uri		+= '?host=127.0.0.1';													// host:	127.0.0.1(localhost)
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=';																// cuk:		null
		uri		+= '&extra=';															// extra:	null

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
				// Check role data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_delhost_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: ['127.0.0.1 * ']});

						done();
					});
			});
	});

	it('PUT /v1/role : prepare - set target role(autotest_del_target_role) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	uri	= '/v1/role';
		uri		+= '?name=autotest_del_target_role';									// path:		yrn:yahoo:::tenant0:role:autotest_del_target_role
		uri		+= '&policies=';														// policies:	empty
		uri		+= '&alias=';															// alias:		empty
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
				// Check role data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_del_target_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: []});

						done();
					});
			});
	});

	it('PUT /v1/role : prepare - add 192.168.0.1 to target role(autotest_del_target_role) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_del_target_role';											// path:	yrn:yahoo:::tenant0:role:autotest_del_target_role
		uri		+= '?host=192.168.0.1';													// host:	192.168.0.1(dummy)
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=test-auto-cuk';												// cuk:		test-auto-cuk
		uri		+= '&extra=openstack-auto-v1';											// extra:	openstack-auto-v1

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
				// Check role data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_del_target_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: ['192.168.0.1 * test-auto-cuk openstack-auto-v1']});

						done();
					});
			});
	});

	it('PUT /v1/role : prepare - add 192.168.0.2 to target role(autotest_del_target_role) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_del_target_role';											// path:	yrn:yahoo:::tenant0:role:autotest_del_target_role
		uri		+= '?host=192.168.0.2';													// host:	192.168.0.2(dummy)
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=test-auto-cuk';												// cuk:		test-auto-cuk
		uri		+= '&extra=openstack-auto-v1';											// extra:	openstack-auto-v1

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
				// Check role data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_del_target_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: ['192.168.0.1 * test-auto-cuk openstack-auto-v1', '192.168.0.2 * test-auto-cuk openstack-auto-v1']});

						done();
					});
			});
	});

	it('PUT /v1/role : prepare - add 192.168.0.3 to target role(autotest_del_target_role) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/autotest_del_target_role';											// path:	yrn:yahoo:::tenant0:role:autotest_del_target_role
		uri		+= '?host=192.168.0.3';													// host:	192.168.0.3(dummy)
		uri		+= '&port=0';															// port:	0(any)
		uri		+= '&cuk=test-auto-cuk';												// cuk:		test-auto-cuk
		uri		+= '&extra=openstack-auto-v1';											// extra:	openstack-auto-v1

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
				// Check role data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_del_target_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: ['192.168.0.1 * test-auto-cuk openstack-auto-v1', '192.168.0.2 * test-auto-cuk openstack-auto-v1', '192.168.0.3 * test-auto-cuk openstack-auto-v1']});

						done();
					});
			});
	});

	//
	// Run Test(CUK IP - DELETE - SUCCESS/FAILURE)
	//
	it('DELETE /v1/role : delete only 192.168.0.1 by cuk from target role(autotest_del_target_role) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '?host=192.168.0.1';													// host:	192.168.0.1(dummy)
		uri		+= '&cuk=test-auto-cuk';												// cuk:		test-auto-cuk
		uri		+= '&extra=openstack-auto-v1';											// extra:	openstack-auto-v1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check role data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_del_target_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: ['192.168.0.2 * test-auto-cuk openstack-auto-v1', '192.168.0.3 * test-auto-cuk openstack-auto-v1']});

						done();
					});
			});
	});

	it('DELETE /v1/role : delete all ip addresses by cuk from target role(autotest_del_target_role) by scoped token with status 201', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '?cuk=test-auto-cuk';												// cuk:		test-auto-cuk
		uri		+= '&extra=openstack-auto-v1';											// extra:	openstack-auto-v1

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(204);

				//
				// Check role data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/role/autotest_del_target_role?expand=false')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.scopedtoken.tenant0)					// tenant0
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.role).to.be.an('object');
						expect(res.body.role.policies).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.aliases).to.be.an.instanceof(Array).to.have.lengthOf(0);
						expect(res.body.role.hosts).to.be.an('object').to.deep.equal({hostnames: [], ips: []});

						done();
					});
			});
	});
});

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
