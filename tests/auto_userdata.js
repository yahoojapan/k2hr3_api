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
 * CREATE:   Tue Oct 9 2018
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
var	r3userdata	= require('../lib/k2hr3userdata');		// for url path

//--------------------------------------------------------------
// Main describe section
//--------------------------------------------------------------
describe('API : USERDATA', function(){					// eslint-disable-line no-undef
	//
	// Common data
	//
	var	alltokens	= {};
	var	regparamstr	= '';

	//
	// Before in describe section
	//
	before(function(done){								// eslint-disable-line no-undef
		// Nothing to do
		tokenutil.before(this, alltokens, done);

		// [NOTE]
		// Using 'tenant0_k2hr3_entest_str_role_01' role for all test.
		//
		var	regparamobj = {
			role:	'tenant0_k2hr3_entest_str_role_01',
			token:	alltokens.roletoken.tenant0_k2hr3_entest_str_role_01
		};
		var	udproc		= new r3userdata.userdataProcess;
		regparamstr		= udproc.encryptRoleInfo(regparamobj);
	});

	//
	// After in describe section
	//
	after(function(){									// eslint-disable-line no-undef
		// Nothing to do
	});

	it('GET /v1/userdata/<correct path> : get userdata by text status 200', function(done){		// eslint-disable-line no-undef
		var	uri	= '/v1/userdata/';
		uri		+= regparamstr;																	// path:	/v1/userdata/<correct path>

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/octet-stream')
			.set('user-agent', 'Cloud-Init')
			.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
			.end(function(err, res){
				//console.log(res);																// For debugging
				expect(res).to.have.status(200);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object').to.be.empty;								// body is empty because it must be 'application/json'
				expect(res.text).to.be.a('undefined');											// text is empty because it must be 'text/plain'
				expect(res.files).to.be.an('object');											// response has some files from 'multipart/mixed'
				expect(res.files[null]).to.be.an('object');										// check only first(null) position( [TODO] checking another )
				expect(res.files[null].size).to.be.a('number');									// file has size member
				expect(res.files[null].path).to.be.an('string').to.not.empty;					// file has temporary path
				expect(res.files[null].name).to.be.an('string').to.not.empty;					// file has real name
				expect(res.files[null].type).to.be.an('string').to.not.empty;					// file is set 'content-type'
				done();
			});
	});

	it('GET /v1/userdata/<invalid path> : get userdata by with invalidpath text status 200', function(done){	// eslint-disable-line no-undef
		// [NOTE]
		// Invalid path case returns 200 and returns error script.
		//
		var	uri	= '/v1/userdata/';
		uri		+= 'invalidpath';																// path:	/v1/userdata/<invalid path>

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/octet-stream')
			.set('user-agent', 'Cloud-Init')
			.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object').to.be.empty;								// body is empty because it must be 'application/json'
				expect(res.text).to.be.a('undefined');											// text is empty because it must be 'text/plain'
				expect(res.files).to.be.an('object');											// response has some files from 'multipart/mixed'
				expect(res.files[null]).to.be.an('object');										// check only first(null) position( [TODO] checking another )
				expect(res.files[null].size).to.be.a('number');									// file has size member
				expect(res.files[null].path).to.be.an('string').to.not.empty;					// file has temporary path
				expect(res.files[null].name).to.be.an('string').to.not.empty;					// file has real name
				expect(res.files[null].type).to.be.an('string').to.not.empty;					// file is set 'content-type'
				done();
			});
	});

	it('GET /v1/userdata/<invalid path> : get userdata by without content-type text status 200', function(done){	// eslint-disable-line no-undef
		// [NOTE]
		// Invalid path case returns 200 and returns error script.
		//
		var	uri	= '/v1/userdata/';
		uri		+= 'invalidpath';																// path:	/v1/userdata/<invalid path>

		chai.request(app)
			.get(uri)
			.set('user-agent', 'Cloud-Init')
			.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object').to.be.empty;								// body is empty because it must be 'application/json'
				expect(res.text).to.be.a('undefined');											// text is empty because it must be 'text/plain'
				expect(res.files).to.be.an('object');											// response has some files from 'multipart/mixed'
				expect(res.files[null]).to.be.an('object');										// check only first(null) position( [TODO] checking another )
				expect(res.files[null].size).to.be.a('number');									// file has size member
				expect(res.files[null].path).to.be.an('string').to.not.empty;					// file has temporary path
				expect(res.files[null].name).to.be.an('string').to.not.empty;					// file has real name
				expect(res.files[null].type).to.be.an('string').to.not.empty;					// file is set 'content-type'
				done();
			});
	});

	it('GET /v1/userdata/<correct path> : get userdata without user-agent by text status 400', function(done){		// eslint-disable-line no-undef
		var	uri	= '/v1/userdata/';
		uri		+= regparamstr;																	// path:	/v1/userdata/<correct path>

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/octet-stream')
			.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object');																// response body is error json
				expect(res.body.result).to.be.a('boolean').to.be.false;												// result is false
				expect(res.body.message).to.be.an('string').to.equal('GET request is not allowed from your client');// error message
				expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');	// 'content-type' is json
				done();
			});
	});

	it('GET /v1/userdata/<correct path> : get userdata without any header by text status 400', function(done){		// eslint-disable-line no-undef
		var	uri	= '/v1/userdata/';
		uri		+= regparamstr;																	// path:	/v1/userdata/<correct path>

		chai.request(app)
			.get(uri)
			.set('accept-encoding', '')															// Chai send gzip encoding as default, thus we set ''
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object');																// response body is error json
				expect(res.body.result).to.be.a('boolean').to.be.false;												// result is false
				expect(res.body.message).to.be.an('string').to.equal('GET request is not allowed from your client');// error message
				expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');	// 'content-type' is json
				done();
			});
	});

	it('GET /v1/userdata/<correct path> : get userdata by gzip status 200', function(done){		// eslint-disable-line no-undef
		var	uri	= '/v1/userdata/';
		uri		+= regparamstr;																	// path:	/v1/userdata/<correct path>

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/octet-stream')
			.set('user-agent', 'Cloud-Init')
			.set('accept-encoding', 'gzip')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object').to.be.empty;										// body is empty because it must be 'application/json'
				expect(res.text).to.be.a('undefined');													// text is empty because it must be 'text/plain'
				expect(res.files).to.be.a('undefined');													// files is empty because it must be 'text/plain'
				expect(res.header).to.be.an('object');													// check response header
				expect(res.header['content-type']).to.be.a('string').to.equal('application/zip');		// 'content-type'
				expect(res.header['content-encoding']).to.be.a('string').to.equal('gzip');				// 'content-encoding'
				expect(res.header['content-transfer-encoding']).to.be.a('string').to.equal('binary');	// 'content-transfer-encoding'
				expect(res.header['content-disposition']).to.be.a('string').to.not.empty;				// 'content-disposition'
				expect(res.header['content-length']).to.be.a('string').to.not.empty;					// 'content-length'
				done();
			});
	});

	it('GET /v1/userdata/<invalid path> : get userdata with invalidpath by gzip status 200', function(done){	// eslint-disable-line no-undef
		// [NOTE]
		// Invalid path case returns 200 and returns error script.
		//
		var	uri	= '/v1/userdata/';
		uri		+= 'invalidpath';																// path:	/v1/userdata/<invalid path>

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/octet-stream')
			.set('user-agent', 'Cloud-Init')
			.set('accept-encoding', 'gzip')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object').to.be.empty;										// body is empty because it must be 'application/json'
				expect(res.text).to.be.a('undefined');													// text is empty because it must be 'text/plain'
				expect(res.files).to.be.a('undefined');													// files is empty because it must be 'text/plain'
				expect(res.header).to.be.an('object');													// check response header
				expect(res.header['content-type']).to.be.a('string').to.equal('application/zip');		// 'content-type'
				expect(res.header['content-encoding']).to.be.a('string').to.equal('gzip');				// 'content-encoding'
				expect(res.header['content-transfer-encoding']).to.be.a('string').to.equal('binary');	// 'content-transfer-encoding'
				expect(res.header['content-disposition']).to.be.a('string').to.not.empty;				// 'content-disposition'
				expect(res.header['content-length']).to.be.a('string').to.not.empty;					// 'content-length'
				done();
			});
	});

	it('GET /v1/userdata/<invalid path> : get userdata without content-type by gzip status 200', function(done){	// eslint-disable-line no-undef
		// [NOTE]
		// Invalid path case returns 200 and returns error script.
		//
		var	uri	= '/v1/userdata/';
		uri		+= 'invalidpath';																// path:	/v1/userdata/<invalid path>

		chai.request(app)
			.get(uri)
			.set('user-agent', 'Cloud-Init')
			.set('accept-encoding', 'gzip')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object').to.be.empty;										// body is empty because it must be 'application/json'
				expect(res.text).to.be.a('undefined');													// text is empty because it must be 'text/plain'
				expect(res.files).to.be.a('undefined');													// files is empty because it must be 'text/plain'
				expect(res.header).to.be.an('object');													// check response header
				expect(res.header['content-type']).to.be.a('string').to.equal('application/zip');		// 'content-type'
				expect(res.header['content-encoding']).to.be.a('string').to.equal('gzip');				// 'content-encoding'
				expect(res.header['content-transfer-encoding']).to.be.a('string').to.equal('binary');	// 'content-transfer-encoding'
				expect(res.header['content-disposition']).to.be.a('string').to.not.empty;				// 'content-disposition'
				expect(res.header['content-length']).to.be.a('string').to.not.empty;					// 'content-length'
				done();
			});
	});

	it('GET /v1/userdata/<correct path> : get userdata without user-agent by gzip status 400', function(done){		// eslint-disable-line no-undef
		var	uri	= '/v1/userdata/';
		uri		+= regparamstr;																	// path:	/v1/userdata/<correct path>

		chai.request(app)
			.get(uri)
			.set('content-type', 'application/octet-stream')
			.set('accept-encoding', 'gzip')
			.end(function(err, res){
				expect(res).to.have.status(400);
				expect(res).to.be.an('object');
				expect(res.body).to.be.an('object');																// response body is error json
				expect(res.body.result).to.be.a('boolean').to.be.false;												// result is false
				expect(res.body.message).to.be.an('string').to.equal('GET request is not allowed from your client');// error message
				expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');	// 'content-type' is json
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
