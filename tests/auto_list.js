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
describe('API : LIST', function(){						// eslint-disable-line no-undef
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

	// 1.1 GET /v1/list/policy HTTP/1.1
	it('GET /v1/list/policy with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(6);
				done();
			});
	});

	// 1.1.1 GET /v1/list/policy/acr-policy HTTP/1.1
	it('GET /v1/list/policy/acr-policy with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/policy/acr-policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(0);
				done();
			});
	});

	// 1.2 GET /v1/list/policy?expand=true HTTP/1.1
	it('GET /v1/list/policy?expand=true with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/policy?expand=true')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(6);
				done();
			});
	});

	// 1.4 GET /v1/list/policy HTTP/1.1
	it('GET /v1/list/policy with invalid x-auth-token header', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/policy')
			.set('x-auth-token', 'x')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.have.string('token(x) is not existed, because it is expired or not set yet.');
				done();
			});
	});

	// 1.5 GET /v1/list/policy?expand=x HTTP/1.1
	it('GET /v1/list/policy?expand=x with invalid expand urlparam', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/policy?expand=x')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.have.string('GET/HEAD expand url argument parameter("x") is wrong, it must be true or false.');
				done();
			});
	});

	// 2.1 GET /v1/list/resource HTTP/1.1
	it('GET /v1/list/resource with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/resource')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(4);
				done();
			});
	});

	// 2.1.1 GET /v1/list/resource/test_service_resource HTTP/1.1
	it('GET /v1/list/resource/test_service_resource with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/resource/test_service_resource')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(0);
				done();
			});
	});

	// 2.2 GET /v1/list/resource?expand=true HTTP/1.1
	it('GET /v1/list/resource?expand=true with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/resource?expand=true')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(4);
				done();
			});
	});

	// 2.4 GET /v1/list/resource HTTP/1.1
	it('GET /v1/list/resource with invalid x-auth-token header', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/resource')
			.set('x-auth-token', 'x')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.have.string('token(x) is not existed, because it is expired or not set yet.');
				done();
			});
	});

	// 2.5 GET /v1/list/resource?expand=x HTTP/1.1
	it('GET /v1/list/resource?expand=x with invalid expand urlparam', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/resource?expand=x')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.have.string('GET/HEAD expand url argument parameter("x") is wrong, it must be true or false.');
				done();
			});
	});

	// 3.1 GET /v1/list/role HTTP/1.1
	it('GET /v1/list/role with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/role')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(6);
				done();
			});
	});

	// 3.1.1 GET /v1/list/role/acr-role HTTP/1.1
	it('GET /v1/list/role/acr-role with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/role/acr-role')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(0);
				done();
			});
	});

	// 3.2 GET /v1/list/role?expand=true HTTP/1.1
	it('GET /v1/list/role?expand=true with status 200', function(done){		// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/role?expand=true')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(6);
				done();
			});
	});

	// 3.4 GET /v1/list/role HTTP/1.1
	it('GET /v1/list/role with invalid x-auth-token header', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/role')
			.set('x-auth-token', 'x')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.have.string('token(x) is not existed, because it is expired or not set yet.');
				done();
			});
	});

	// 3.5 GET /v1/list/role?expand=x HTTP/1.1
	it('GET /v1/list/role?expand=x with invalid expand urlparam', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/role?expand=x')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.have.string('GET/HEAD expand url argument parameter("x") is wrong, it must be true or false.');
				done();
			});
	});

	// 4.1 GET /v1/list/service HTTP/1.1
	it('GET /v1/list/service with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(1);
				expect(res.body.children[0]).to.deep.equal({'name':'testservice','children':[]});
				done();
			});
	});

	// 4.2 GET /v1/list/service?expand=true HTTP/1.1
	it('GET /v1/list/service?expand=true with status 200', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/service?expand=true')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.true;
				expect(res.body.message).to.be.null;
				expect(res.body.children).to.have.lengthOf(1);
				expect(res.body.children[0]).to.deep.equal({'name':'testservice','children':[]});
				done();
			});
	});

	// 4.4 GET /v1/list/service HTTP/1.1
	it('GET /v1/list/service with invalid x-auth-token header', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/service')
			.set('x-auth-token', 'x')
			.end(function(err, res){
				expect(res).to.have.status(401);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.have.string('token(x) is not existed, because it is expired or not set yet.');
				done();
			});
	});

	// 4.5 GET /v1/list/service?expand=x HTTP/1.1
	it('GET /v1/list/service?expand=x with invalid expand urlparam', function(done){	// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1/list/service?expand=x')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object');
				expect(res.body.result).to.be.a('boolean').to.be.false;
				expect(res.body.message).to.have.string('GET/HEAD expand url argument parameter("x") is wrong, it must be true or false.');
				done();
			});
	});

	// 5. HEAD /v1/list/service HTTP/1.1
	it('HEAD /v1/list/service with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/list/service')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;
				done();
			});
	});

	// 6. HEAD /v1/list/resource HTTP/1.1
	it('HEAD /v1/list/resource with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/list/resource')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;
				done();
			});
	});
	// 6.1 HEAD /v1/list/resource/test_service_resource HTTP/1.1
	it('HEAD /v1/list/resource/test_service_resource with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/list/resource/test_service_resource')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;
				done();
			});
	});

	// 7. HEAD /v1/list/policy HTTP/1.1
	it('HEAD /v1/list/policy with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/list/policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;
				done();
			});
	});
	// 7.1 HEAD /v1/list/policy/acr-policy HTTP/1.1
	it('HEAD /v1/list/policy/acr-policy with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/list/policy/acr-policy')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;
				done();
			});
	});

	// 8. HEAD /v1/list/role HTTP/1.1
	it('HEAD /v1/list/role with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/list/role')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;
				done();
			});
	});
	// 8.1 HEAD /v1/list/role/acr-role HTTP/1.1
	it('HEAD /v1/list/role/acr-role with status 204', function(done){										// eslint-disable-line no-undef
		chai.request(app)
			.head('/v1/list/role/acr-role')
			.set('x-auth-token', alltokens.scopedtoken.tenant0)
			.end(function(err, res){
				expect(res).to.have.status(204);
				expect(res.body).to.be.empty;
				done();
			});
	});
});

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
