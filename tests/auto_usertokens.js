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
 * CREATE:   Mon Dec 25 2017
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

//--------------------------------------------------------------
// Main describe section
//--------------------------------------------------------------
describe('API : USER TOKEN', function(){				// eslint-disable-line no-undef
	//
	// Common data
	//
	let	unscopedToken	= '';
	let	scopedToken		= '';

	//
	// Before in describe section
	//
	before(function(){									// eslint-disable-line no-undef
		// Nothing to do
	});

	//
	// After in describe section
	//
	after(function(){									// eslint-disable-line no-undef
		// Nothing to do
	});

	//
	// Run Test(POST - SUCCESS)
	//
	it('POST /v1/user/tokens : unscoped token by user credential(no tenant) with status 201', function(done){						// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/user/tokens')
			.set('content-type', 'application/json')
			.send({
				auth: {
					tenantName:	null,
					passwordCredentials: {
						username:	'dummyuser',
						password:   null
					}
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('string').to.equal('succeed');
				expect(res.body.scoped).to.be.a('boolean').to.be.false;
				expect(res.body.token).to.be.a('string').is.not.empty;

				unscopedToken = 'U=' + res.body.token;
				done();
			});
	});

	it('POST /v1/user/tokens : scoped token by user credential(and tenant) with status 201', function(done){						// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/user/tokens')
			.set('content-type', 'application/json')
			.send({
				auth: {
					tenantName:	'tenant0',
					passwordCredentials: {
						username:	'dummyuser',
						password:   null
					}
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('string').to.equal('succeed');
				expect(res.body.scoped).to.be.a('boolean').to.be.true;
				expect(res.body.token).to.be.a('string').is.not.empty;

				scopedToken = 'U=' + res.body.token;
				done();
			});
	});

	it('POST /v1/user/tokens : scoped token by unscoped token with status 201', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', unscopedToken)
			.send({
				auth: {
					tenantName:	'tenant0'
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('string').to.equal('succeed');
				expect(res.body.scoped).to.be.a('boolean').to.be.true;
				expect(res.body.token).to.be.a('string').is.not.empty;

				scopedToken = 'U=' + res.body.token;
				done();
			});
	});


	//
	// Run Test(POST - FAILURE)
	//
	it('POST /v1/user/tokens : failure unscoped token by invalid user credential(no tenant) with status 400', function(done){		// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/user/tokens')
			.set('content-type', 'application/json')
			.send({
				auth: {
					tenantName:	null,
					passwordCredentials: {
						username:	null,			// any string for user name is allowed, then set null.
						password:   null
					}
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Some parameter(user name or unscoped token) is wrong.');

				done();
			});
	});

	it('POST /v1/user/tokens : failure scoped token by invalid user credential(and tenant) with status 400', function(done){		// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/user/tokens')
			.set('content-type', 'application/json')
			.send({
				auth: {
					tenantName:	'tenant0',
					passwordCredentials: {
						username:	null,			// any string for user name is allowed, then set null.
						password:   null
					}
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('Some parameter(user name or unscoped token) is wrong.');

				done();
			});
	});

	it('POST /v1/user/tokens : failure scoped token by user credential(and invalid tenant) with status 404', function(done){		// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/user/tokens')
			.set('content-type', 'application/json')
			.send({
				auth: {
					tenantName:	'tenantERROR',
					passwordCredentials: {
						username:	'dummyuser',
						password:   null
					}
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.have.string('could not get scoped user token for user=dummyuser, tenant=tenantERROR by could not get scoped user token for user dummyuser by some parameters are wrong : token=');

				done();
			});
	});

	it('POST /v1/user/tokens : failure scoped token by invalid unscoped token with status 404', function(done){						// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', 'error_dummy_token')
			.send({
				auth: {
					tenantName:	'tenant0'
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('could not get scoped user token for other token, tenant=tenant0 by could not get user access token by could not get user access token by getUserUnscopedTokenByToken is not implemented');

				done();
			});
	});

	it('POST /v1/user/tokens : failure scoped token by invalid tenant name and unscoped token with status 404', function(done){		// eslint-disable-line no-undef
		chai.request(app)
			.post('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', unscopedToken)
			.send({
				auth: {
					tenantName:	'tenantERROR'
				}
			})
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.have.string('could not get scoped user token for user=dummyuser, tenant=tenantERROR by could not get scoped user token for user dummyuser by some parameters are wrong : token=');

				done();
			});
	});

	//
	// Run Test(PUT - SUCCESS)
	//
	it('PUT /v1/user/tokens : unscoped token by user credential(no tenant) with status 201', function(done){						// eslint-disable-line no-undef
		let	url	= '/v1/user/tokens';
		url		+= '?tenantname=';
		url		+= '&username=dummyuser';
		url		+= '&password=';
		chai.request(app)
			.put(url)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('string').to.equal('succeed');
				expect(res.body.scoped).to.be.a('boolean').to.be.false;
				expect(res.body.token).to.be.a('string').is.not.empty;

				unscopedToken = 'U=' + res.body.token;
				done();
			});
	});

	it('PUT /v1/user/tokens : scoped token by user credential(and tenant) with status 201', function(done){							// eslint-disable-line no-undef
		let	url	= '/v1/user/tokens';
		url		+= '?tenantname=tenant0';
		url		+= '&username=dummyuser';
		url		+= '&password=';
		chai.request(app)
			.put(url)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('string').to.equal('succeed');
				expect(res.body.scoped).to.be.a('boolean').to.be.true;
				expect(res.body.token).to.be.a('string').is.not.empty;

				scopedToken = 'U=' + res.body.token;
				done();
			});
	});

	it('PUT /v1/user/tokens : scoped token by unscoped token with status 201', function(done){										// eslint-disable-line no-undef
		let	url	= '/v1/user/tokens';
		url		+= '?tenantname=tenant0';
		chai.request(app)
			.put(url)
			.set('content-type', 'application/json')
			.set('x-auth-token', unscopedToken)
			.end(function(err, res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('string').to.equal('succeed');
				expect(res.body.scoped).to.be.a('boolean').to.be.true;
				expect(res.body.token).to.be.a('string').is.not.empty;

				scopedToken = 'U=' + res.body.token;
				done();
			});
	});

	//
	// Run Test(PUT - FAILURE)
	//
	it('PUT /v1/user/tokens : failure unscoped token by invalid user credential(no tenant) with status 400', function(done){		// eslint-disable-line no-undef
		let	url	= '/v1/user/tokens';
		url		+= '?tenantname=';
		url		+= '&username=';					// any string for user name is allowed, then set null.
		url		+= '&password=';
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

	it('PUT /v1/user/tokens : failure scoped token by invalid user credential(and tenant) with status 400', function(done){			// eslint-disable-line no-undef
		let	url	= '/v1/user/tokens';
		url		+= '?tenantname=tenant0';
		url		+= '&username=';					// any string for user name is allowed, then set null.
		url		+= '&password=';
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

	it('PUT /v1/user/tokens : failure scoped token by user credential(and invalid tenant) with status 404', function(done){			// eslint-disable-line no-undef
		let	url	= '/v1/user/tokens';
		url		+= '?tenantname=tenantERROR';
		url		+= '&username=dummyuser';
		url		+= '&password=';
		chai.request(app)
			.put(url)
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.have.string('could not get scoped user token for user=dummyuser, tenant=tenantERROR by could not get scoped user token for user dummyuser by some parameters are wrong : token=');

				done();
			});
	});

	it('PUT /v1/user/tokens : failure scoped token by invalid unscoped token with status 404', function(done){						// eslint-disable-line no-undef
		let	url	= '/v1/user/tokens';
		url		+= '?tenantname=tenant0';
		chai.request(app)
			.put(url)
			.set('content-type', 'application/json')
			.set('x-auth-token', 'error_dummy_token')
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('could not get scoped user token for other token, tenant=tenant0 by could not get user access token by could not get user access token by getUserUnscopedTokenByToken is not implemented');

				done();
			});
	});

	it('PUT /v1/user/tokens : failure scoped token by invalid tenant name and unscoped token with status 404', function(done){		// eslint-disable-line no-undef
		let	url	= '/v1/user/tokens';
		url		+= '?tenantname=tenantERROR';
		chai.request(app)
			.put(url)
			.set('content-type', 'application/json')
			.set('x-auth-token', unscopedToken)
			.end(function(err, res){
				expect(res).to.have.status(404);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.have.string('could not get scoped user token for user=dummyuser, tenant=tenantERROR by could not get scoped user token for user dummyuser by some parameters are wrong : token=');

				done();
			});
	});

	//
	// Run Test(GET - SUCCESS)
	//
	it('GET /v1/user/tokens : tenant list by unscoped token with status 200', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', unscopedToken)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('string').to.equal('succeed');
				expect(res.body.scoped).to.be.a('boolean').to.be.false;
				expect(res.body.user).to.be.a('string').to.equal('dummyuser');
				expect(res.body.tenants).to.be.an.instanceof(Array).to.have.lengthOf(5);
				expect(res.body.tenants[0]).to.deep.equal({name: 'tenant0', id: '1000', description: 'dummy tenant no.0', display: 'dummy_tenant_0'});
				expect(res.body.tenants[1]).to.deep.equal({name: 'tenant1', id: '1001', description: 'dummy tenant no.1', display: 'dummy_tenant_1'});
				expect(res.body.tenants[2]).to.deep.equal({name: 'tenant2', id: '1002', description: 'dummy tenant no.2', display: 'dummy_tenant_2'});
				expect(res.body.tenants[3]).to.deep.equal({name: 'tenant3', id: '1003', description: 'dummy tenant no.3', display: 'dummy_tenant_3'});
				expect(res.body.tenants[4]).to.deep.equal({name: 'tenant4', id: '1004', description: 'dummy tenant no.4', display: 'dummy_tenant_4'});

				done();
			});
	});

	it('GET /v1/user/tokens : tenant list by scoped token with status 200', function(done){											// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', scopedToken)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.a('string').to.equal('succeed');
				expect(res.body.scoped).to.be.a('boolean').to.be.true;
				expect(res.body.user).to.be.a('string').to.equal('dummyuser');
				expect(res.body.tenants).to.be.an.instanceof(Array).to.have.lengthOf(1);
				expect(res.body.tenants[0]).to.deep.equal({name: 'tenant0', id: '1000', description: 'dummy tenant no.0', display: 'dummy_tenant_0'});

				done();
			});
	});

	//
	// Run Test(GET - FAILURE)
	//
	it('GET /v1/user/tokens : failure tenant list by invalid unscoped token with status 401', function(done){						// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', 'error_dummy_token')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	it('GET /v1/user/tokens : failure tenant list by invalid scoped token with status 401', function(done){							// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', 'error_dummy_token')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.be.a('string').to.equal('token(error_dummy_token) is not existed, because it is expired or not set yet.');

				done();
			});
	});

	//
	// Run Test(HEAD - SUCCESS)
	//
	it('HEAD /v1/user/tokens : tenant list by unscoped token with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', unscopedToken)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;

				done();
			});
	});

	it('HEAD /v1/user/tokens : tenant list by scoped token with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', scopedToken)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;

				done();
			});
	});

	//
	// Run Test(HEAD - FAILURE)
	//
	it('HEAD /v1/user/tokens : failure tenant list by invalid unscoped token with status 401', function(done){						// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', 'error_dummy_token')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res.body).to.be.empty;

				done();
			});
	});

	it('HEAD /v1/user/tokens : failure tenant list by invalid scoped token with status 401', function(done){						// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/user/tokens')
			.set('content-type', 'application/json')
			.set('x-auth-token', 'error_dummy_token')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res.body).to.be.empty;

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
