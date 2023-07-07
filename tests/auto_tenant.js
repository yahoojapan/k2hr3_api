/*
 * K2HR3 REST API
 *
 * Copyright 2023 Yahoo Japan Corporation.
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
 * CREATE:   Thu Jul 6 2023
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
describe('API : TENANT', function(){					// eslint-disable-line no-undef
	//
	// Common data
	//
	var	alltokens = {};

	var	autotest_post_tenant_0_id	= '';
	var	autotest_post_tenant_1_id	= '';
	var	autotest_put_tenant_0_id	= '';
	var	autotest_put_tenant_1_id	= '';

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
	// Run Test(POST - CREATE TENANT - SUCCESS/FAILURE)
	//
	it('POST /v1/tenant : create tenant(autotest_post_tenant_0) : success 201', function(done){								// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.send({
				tenant: {
					name:		'autotest_post_tenant_0'
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
					.get('/v1/tenant/autotest_post_tenant_0')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.tenant).to.be.an('object');
						expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_post_tenant_0');
						expect(res.body.tenant.id).to.be.a('string');
						expect(res.body.tenant.desc).to.be.a('string').to.equal('K2HR3 Cluster Local tenant');
						expect(res.body.tenant.display).to.be.a('string').to.equal('local@autotest_post_tenant_0');
						expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

						// backup for "delete" test
						autotest_post_tenant_0_id = res.body.tenant.id;

						done();
					});
			});
	});

	it('POST /v1/tenant : create tenant(local@autotest_post_tenant_1) with all: success 201', function(done){				// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.send({
				tenant: {
					name:		'local@autotest_post_tenant_1',
					desc:		'Description for local@autotest_post_tenant_1',
					display:	'[LOCAL] local@autotest_post_tenant_1',
					users:		['dummyuser']
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
					.get('/v1/tenant/local@autotest_post_tenant_1')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.tenant).to.be.an('object');
						expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_post_tenant_1');
						expect(res.body.tenant.id).to.be.a('string');
						expect(res.body.tenant.desc).to.be.a('string').to.equal('Description for local@autotest_post_tenant_1');
						expect(res.body.tenant.display).to.be.a('string').to.equal('[LOCAL] local@autotest_post_tenant_1');
						expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

						// backup for "delete" test
						autotest_post_tenant_1_id = res.body.tenant.id;

						done();
					});
			});
	});

	it('POST /v1/tenant : create tenant(autotest_post_tenant_0) : failure(exist tenant) 400', function(done){				// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.send({
				tenant: {
					name:		'autotest_post_tenant_0'
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST request failed to update tenant by failed to create tenant by already tenant(local@autotest_post_tenant_0) existed');

				done();
			});
	});

	it('POST /v1/tenant : create tenant(autotest_post_tenant_2) : failure(no token) 400', function(done){					// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant')
			.set('content-type', 'application/json')
			.send({
				tenant: {
					name:		'autotest_post_tenant_2',
					desc:		'Description for autotest_post_tenant_2',
					display:	'[LOCAL] autotest_post_tenant_2',
					users:		['dummyuser']
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST request tenant must specify <User Token>');

				done();
			});
	});

	//
	// Run Test(PUT - CREATE TENANT - SUCCESS/FAILURE)
	//
	it('PUT /v1/tenant : create tenant(autotest_put_tenant_0) : success 201', function(done){								// eslint-disable-line no-undef
		var	uri	= '/v1/tenant';
		uri		+= '?name=autotest_put_tenant_0';										// name:	autotest_put_tenant_0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
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
					.get('/v1/tenant/autotest_put_tenant_0')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.tenant).to.be.an('object');
						expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_put_tenant_0');
						expect(res.body.tenant.id).to.be.a('string');
						expect(res.body.tenant.desc).to.be.a('string').to.equal('K2HR3 Cluster Local tenant');
						expect(res.body.tenant.display).to.be.a('string').to.equal('local@autotest_put_tenant_0');
						expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

						// backup for "delete" test
						autotest_put_tenant_0_id = res.body.tenant.id;

						done();
					});
			});
	});

	it('PUT /v1/tenant : create tenant(local@autotest_put_tenant_1) with all: success 201', function(done){					// eslint-disable-line no-undef
		var	uri	= '/v1/tenant';
		uri		+= '?name=local@autotest_put_tenant_1';									// name:	local@autotest_put_tenant_1
		uri		+= '&desc=Description_for_local@autotest_put_tenant_1';					// desc:	string
		uri		+= '&display=[LOCAL]local@autotest_put_tenant_1';						// display:	string
		uri		+= '&users=' + JSON.stringify(['dummyuser']);							// users:	[dummyuser]

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
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
					.get('/v1/tenant/local@autotest_put_tenant_1')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.tenant).to.be.an('object');
						expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_put_tenant_1');
						expect(res.body.tenant.id).to.be.a('string');
						expect(res.body.tenant.desc).to.be.a('string').to.equal('Description_for_local@autotest_put_tenant_1');
						expect(res.body.tenant.display).to.be.a('string').to.equal('[LOCAL]local@autotest_put_tenant_1');
						expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

						// backup for "delete" test
						autotest_put_tenant_1_id = res.body.tenant.id;

						done();
					});
			});
	});

	it('PUT /v1/tenant : create tenant(autotest_put_tenant_0) : failure(exist tenant) 400', function(done){					// eslint-disable-line no-undef
		var	uri	= '/v1/tenant';
		uri		+= '?name=autotest_put_tenant_0';										// name:	autotest_put_tenant_0

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('PUT request failed to update tenant by failed to create tenant by already tenant(local@autotest_put_tenant_0) existed');

				done();
			});
	});

	it('PUT /v1/tenant : create tenant(autotest_put_tenant_2) : failure(no token) 400', function(done){						// eslint-disable-line no-undef
		var	uri	= '/v1/tenant';
		uri		+= '?name=autotest_put_tenant_2';										// name:	autotest_put_tenant_2
		uri		+= '&desc=Description_for_autotest_put_tenant_2';						// desc:	string
		uri		+= '&display=[LOCAL]autotest_put_tenant_2';								// display:	string
		uri		+= '&users=' + JSON.stringify(['dummyuser']);							// users:	[dummyuser]

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('PUT request tenant must specify <User Token>');

				done();
			});
	});

	//
	// Run Test(POST - UPDATE TENANT - SUCCESS/FAILURE)
	//
	it('POST /v1/tenant/<tenant> : update tenant(autotest_post_tenant_0) : success 200', function(done){					// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant/autotest_post_tenant_0')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.send({
				tenant: {
					id:			autotest_post_tenant_0_id,								// correct id
					desc:		'K2HR3 Cluster Local tenant(updated)',					// changed
					display:	'[UPDATED] autotest_post_tenant_0',						// changed
					users:		['dummyuser']											// not changed(because there is one user in test data)
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/tenant/autotest_post_tenant_0')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.tenant).to.be.an('object');
						expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_post_tenant_0');
						expect(res.body.tenant.id).to.be.a('string').to.equal(autotest_post_tenant_0_id);
						expect(res.body.tenant.desc).to.be.a('string').to.equal('K2HR3 Cluster Local tenant(updated)');
						expect(res.body.tenant.display).to.be.a('string').to.equal('[UPDATED] autotest_post_tenant_0');
						expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

						done();
					});
			});
	});

	it('POST /v1/tenant/<tenant> : update tenant(local@autotest_post_tenant_1) : success 200', function(done){				// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant/local@autotest_post_tenant_1')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.send({
				tenant: {
					id:			autotest_post_tenant_1_id,								// correct id
					desc:		'Updated local@autotest_post_tenant_1',					// changed
					display:	'[UPDATED] local@autotest_post_tenant_1',				// changed
					users:		['dummyuser']											// not changed(because there is one user in test data)
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/tenant/local@autotest_post_tenant_1')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.tenant).to.be.an('object');
						expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_post_tenant_1');
						expect(res.body.tenant.id).to.be.a('string').to.equal(autotest_post_tenant_1_id);
						expect(res.body.tenant.desc).to.be.a('string').to.equal('Updated local@autotest_post_tenant_1');
						expect(res.body.tenant.display).to.be.a('string').to.equal('[UPDATED] local@autotest_post_tenant_1');
						expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

						done();
					});
			});
	});

	it('POST /v1/tenant/<tenant> : update tenant(autotest_post_tenant_3) : failure(not exist tenant) 400', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant/autotest_post_tenant_3')
			.set('content-type', 'application/json')
			.send({
				tenant: {
					id:			'autotest_post_tenant_0_id',							// wrong id
					desc:		'K2HR3 Cluster Local tenant(updated)',					// changed
					display:	'[UPDATED] autotest_post_tenant_3',						// changed
					users:		['dummyuser']											// not changed(because there is one user in test data)
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST request tenant must specify <User Token>');

				done();
			});
	});

	it('POST /v1/tenant/<tenant> : update tenant(autotest_post_tenant_0) : failure(no token) 400', function(done){			// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant/autotest_post_tenant_0')
			.set('content-type', 'application/json')
			.send({
				tenant: {
					id:			autotest_post_tenant_0_id,								// correct id
					desc:		'K2HR3 Cluster Local tenant(updated2)',					// changed
					display:	'[UPDATED2] autotest_post_tenant_0',					// changed
					users:		['dummyuser']											// not changed(because there is one user in test data)
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST request tenant must specify <User Token>');

				done();
			});
	});

	it('POST /v1/tenant/<tenant> : update tenant(autotest_post_tenant_0) : failure(no id) 400', function(done){				// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/tenant/autotest_post_tenant_0')
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.send({
				tenant: {
					desc:		'K2HR3 Cluster Local tenant(updated3)',					// changed
					display:	'[UPDATED3] autotest_post_tenant_0',					// changed
					users:		['dummyuser']											// not changed(because there is one user in test data)
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('POST request tenant(local@autotest_post_tenant_0) body does not have tenant.id string object.');

				done();
			});
	});

	//
	// Run Test(PUT - UPDATE TENANT - SUCCESS/FAILURE)
	//
	it('PUT /v1/tenant/<tenant> : update tenant(autotest_put_tenant_0) : success 200', function(done){						// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/autotest_put_tenant_0';
		uri		+= '?id=' + autotest_put_tenant_0_id;									// correct id
		uri		+= '&desc=Updated_autotest_put_tenant_0';								// changed
		uri		+= '&display=[UPDATED]autotest_put_tenant_0';							// chnaged
		uri		+= '&users=' + JSON.stringify(['dummyuser']);							// not changed(because there is one user in test data)

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/tenant/autotest_put_tenant_0')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.tenant).to.be.an('object');
						expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_put_tenant_0');
						expect(res.body.tenant.id).to.be.a('string').to.equal(autotest_put_tenant_0_id);
						expect(res.body.tenant.desc).to.be.a('string').to.equal('Updated_autotest_put_tenant_0');
						expect(res.body.tenant.display).to.be.a('string').to.equal('[UPDATED]autotest_put_tenant_0');
						expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

						done();
					});
			});
	});

	it('PUT /v1/tenant/<tenant> : update tenant(local@autotest_put_tenant_1) : success 200', function(done){				// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/local@autotest_put_tenant_1';
		uri		+= '?id=' + autotest_put_tenant_1_id;									// correct id
		uri		+= '&desc=Updated_local@autotest_put_tenant_1';							// changed
		uri		+= '&display=[UPDATED]local@autotest_put_tenant_1';						// chnaged
		uri		+= '&users=' + JSON.stringify(['dummyuser']);							// not changed(because there is one user in test data)

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');

				//
				// Check resource data(not expand) set by this case.
				//
				chai.request(app)
					.get('/v1/tenant/local@autotest_put_tenant_1')
					.set('content-type', 'application/json')
					.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
					.end(function(err, res){
						expect(res).to.have.status(200);
						expect(res).to.be.json;
						expect(res.body).to.be.an('object');
						expect(res.body.result).to.be.a('boolean').to.be.true;
						expect(res.body.message).to.be.a('null');
						expect(res.body.tenant).to.be.an('object');
						expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_put_tenant_1');
						expect(res.body.tenant.id).to.be.a('string').to.equal(autotest_put_tenant_1_id);
						expect(res.body.tenant.desc).to.be.a('string').to.equal('Updated_local@autotest_put_tenant_1');
						expect(res.body.tenant.display).to.be.a('string').to.equal('[UPDATED]local@autotest_put_tenant_1');
						expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
						expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

						done();
					});
			});
	});

	it('PUT /v1/tenant/<tenant> : update tenant(autotest_put_tenant_3) : failure(not exist tenant) 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/autotest_put_tenant_3';
		uri		+= '?id=' + autotest_put_tenant_0_id;									// wrong id
		uri		+= '&desc=Updated_autotest_put_tenant_3';								// changed
		uri		+= '&display=[UPDATED]autotest_put_tenant_3';							// chnaged
		uri		+= '&users=' + JSON.stringify(['dummyuser']);							// not changed(because there is one user in test data)

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.have.string('PUT request failed to update tenant by failed to update tenant by could not find tenant(local@autotest_put_tenant_3) with user="dummyuser" and id=');

				done();
			});
	});

	it('PUT /v1/tenant/<tenant> : update tenant(autotest_put_tenant_0) : failure(no token) 400', function(done){			// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/autotest_put_tenant_0';
		uri		+= '?id=' + autotest_put_tenant_0_id;									// correct id
		uri		+= '&desc=Updated2_autotest_put_tenant_0';								// changed
		uri		+= '&display=[UPDATED2]autotest_put_tenant_0';							// chnaged
		uri		+= '&users=' + JSON.stringify(['dummyuser']);							// not changed(because there is one user in test data)

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('PUT request tenant must specify <User Token>');

				done();
			});
	});

	it('PUT /v1/tenant/<tenant> : update tenant(autotest_put_tenant_0) : failure(no id) 400', function(done){				// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/autotest_put_tenant_0';
		uri		+= '?desc=Updated_autotest_put_tenant_0';								// changed
		uri		+= '&display=[UPDATED]autotest_put_tenant_0';							// chnaged
		uri		+= '&users=' + JSON.stringify(['dummyuser']);							// not changed(because there is one user in test data)

		chai.request(app)
			.put(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)								// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('PUT request tenant(local@autotest_put_tenant_0) body does not have tenant.id string object.');

				done();
			});
	});

	//
	// Run Test(GET - TENANT LIST - SUCCESS/FAILURE)
	//
	it('GET /v1/tenant : get tenant list and expanding : success 200', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant?expand=true')										// expand:	true
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.tenants).to.be.an.instanceof(Array).to.have.lengthOf(4);
				expect(res.body.tenants[0]).to.be.an('object');
				expect(res.body.tenants[0].name).to.be.a('string');									// not check string
				expect(res.body.tenants[0].id).to.be.a('string');									// not check string
				expect(res.body.tenants[0].desc).to.be.a('string');									// not check string
				expect(res.body.tenants[0].display).to.be.a('string');								// not check string
				expect(res.body.tenants[0].users).to.be.an.instanceof(Array).to.have.lengthOf(1);	// not check array contents
				expect(res.body.tenants[1]).to.be.an('object');
				expect(res.body.tenants[1].name).to.be.a('string');									// not check string
				expect(res.body.tenants[1].id).to.be.a('string');									// not check string
				expect(res.body.tenants[1].desc).to.be.a('string');									// not check string
				expect(res.body.tenants[1].display).to.be.a('string');								// not check string
				expect(res.body.tenants[1].users).to.be.an.instanceof(Array).to.have.lengthOf(1);	// not check array contents
				expect(res.body.tenants[2]).to.be.an('object');
				expect(res.body.tenants[2].name).to.be.a('string');									// not check string
				expect(res.body.tenants[2].id).to.be.a('string');									// not check string
				expect(res.body.tenants[2].desc).to.be.a('string');									// not check string
				expect(res.body.tenants[2].display).to.be.a('string');								// not check string
				expect(res.body.tenants[2].users).to.be.an.instanceof(Array).to.have.lengthOf(1);	// not check array contents
				expect(res.body.tenants[3]).to.be.an('object');
				expect(res.body.tenants[3].name).to.be.a('string');									// not check string
				expect(res.body.tenants[3].id).to.be.a('string');									// not check string
				expect(res.body.tenants[3].desc).to.be.a('string');									// not check string
				expect(res.body.tenants[3].display).to.be.a('string');								// not check string
				expect(res.body.tenants[3].users).to.be.an.instanceof(Array).to.have.lengthOf(1);	// not check array contents

				done();
			});
	});

	it('GET /v1/tenant : get tenant list and no expanding: success 200', function(done){									// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant?expand=false')										// expand:	false
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.tenants).to.be.an.instanceof(Array).to.have.lengthOf(4);
				expect(res.body.tenants[0]).to.be.a('string');					// not check string
				expect(res.body.tenants[1]).to.be.a('string');					// not check string
				expect(res.body.tenants[2]).to.be.a('string');					// not check string
				expect(res.body.tenants[3]).to.be.a('string');					// not check string

				done();
			});
	});

	it('GET /v1/tenant : get tenant list and expanding : failure(no token) 400', function(done){							// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant?expand=true')										// expand:	true
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request tenant must specify <User Token>');

				done();
			});
	});

	it('GET /v1/tenant : get tenant list and no expanding: failure(no token) 400', function(done){							// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant?expand=false')										// expand:	false
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request tenant must specify <User Token>');

				done();
			});
	});

	//
	// Run Test(GET - TENANT INFORMATION - SUCCESS/FAILURE)
	//
	it('GET /v1/tenant/<tenant> : get tenant(autotest_post_tenant_0) : success 200', function(done){						// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant/autotest_post_tenant_0')							// specify tenant name
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.tenant).to.be.an('object');
				expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_post_tenant_0');
				expect(res.body.tenant.id).to.be.a('string').to.equal(autotest_post_tenant_0_id);
				expect(res.body.tenant.desc).to.be.a('string').to.equal('K2HR3 Cluster Local tenant(updated)');
				expect(res.body.tenant.display).to.be.a('string').to.equal('[UPDATED] autotest_post_tenant_0');
				expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

				done();
			});
	});

	it('GET /v1/tenant/<tenant> : get tenant(local@autotest_post_tenant_1) : success 200', function(done){					// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant/local@autotest_post_tenant_1')						// specify tenant name with prefix
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('null');
				expect(res.body.tenant).to.be.an('object');
				expect(res.body.tenant.name).to.be.a('string').to.equal('local@autotest_post_tenant_1');
				expect(res.body.tenant.id).to.be.a('string').to.equal(autotest_post_tenant_1_id);
				expect(res.body.tenant.desc).to.be.a('string').to.equal('Updated local@autotest_post_tenant_1');
				expect(res.body.tenant.display).to.be.a('string').to.equal('[UPDATED] local@autotest_post_tenant_1');
				expect(res.body.tenant.users).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.tenant.users[0]).to.be.a('string').to.equal('dummyuser');

				done();
			});
	});

	it('GET /v1/tenant/<tenant> : get tenant(autotest_post_tenant_0) : failure(no token) 400', function(done){				// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant/autotest_post_tenant_0')							// specify tenant name
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request tenant must specify <User Token>');

				done();
			});
	});

	it('GET /v1/tenant/<tenant> : get tenant(local@autotest_post_tenant_1) : failure(no token) 400', function(done){		// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant/local@autotest_post_tenant_1')						// specify tenant name
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request tenant must specify <User Token>');

				done();
			});
	});

	it('GET /v1/tenant/<tenant> : get tenant(autotest_post_tenant_X) : failure(no tenant) 400', function(done){				// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/tenant/autotest_post_tenant_X')							// specify tenant name
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('GET request failed to update tenant by could not find tenant(local@autotest_post_tenant_x) with user=undefined and id=undefined');

				done();
			});
	});

	//
	// Run Test(HEAD - TENANT - SUCCESS/FAILURE)
	//
	it('HEAD /v1/tenant/<tenant> : head tenant(autotest_post_tenant_0) : success 200', function(done){						// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/tenant/autotest_post_tenant_0')							// specify tenant name
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/tenant/<tenant> : head tenant(local@autotest_post_tenant_1) : success 200', function(done){				// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/tenant/local@autotest_post_tenant_1')					// specify tenant name with prefix
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('HEAD /v1/tenant/<tenant> : head tenant(autotest_post_tenant_0) : failure(no token) 400', function(done){			// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/tenant/autotest_post_tenant_0')							// specify tenant name
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/tenant/<tenant> : head tenant(local@autotest_post_tenant_1) : failure(no token) 400', function(done){		// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/tenant/local@autotest_post_tenant_1')					// specify tenant name
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('HEAD /v1/tenant/<tenant> : head tenant(autotest_post_tenant_X) : failure(no tenant) 400', function(done){			// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/tenant/autotest_post_tenant_X')							// specify tenant name
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	//
	// Run Test(DELETE - TENANT - SUCCESS/FAILURE)
	//
	it('DELETE /v1/tenant/<tenant> : delete tenant(autotest_put_tenant_0) : success 200', function(done){					// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/autotest_put_tenant_0';							// tenant name
		uri		+= '?id=' + autotest_put_tenant_0_id;							// correct id

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE /v1/tenant/<tenant> : delete tenant(local@autotest_put_tenant_1) : success 200', function(done){				// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/local@autotest_put_tenant_1';						// tenant name
		uri		+= '?id=' + autotest_put_tenant_1_id;							// correct id

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.set('x-auth-token', alltokens.unscopedtoken)						// unscoped token
			.end(function(err, res){
				expect(res).to.have.status(204);

				done();
			});
	});

	it('DELETE /v1/tenant/<tenant> : delete tenant(autotest_post_tenant_0) : failure(no token) 400', function(done){		// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/autotest_post_tenant_0';							// tenant name
		uri		+= '?id=' + autotest_post_tenant_0_id;							// correct id

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('DELETE /v1/tenant/<tenant> : delete tenant(local@autotest_post_tenant_0) : failure(no token) 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/local@autotest_post_tenant_0';					// tenant name
		uri		+= '?id=' + autotest_post_tenant_0_id;							// correct id

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

				done();
			});
	});

	it('DELETE /v1/tenant/<tenant> : delete tenant(autotest_post_tenant_X) : failure(no exist tenant) 400', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/tenant/autotest_post_tenant_X';							// not exist tenant name
		uri		+= '?id=' + autotest_post_tenant_0_id;							// wrong id

		chai.request(app)
			.delete(uri)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(400);

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
