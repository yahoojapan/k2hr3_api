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
 * CREATE:   Mon May 18 2020
 * REVISION:
 *
 */

import	apiutil						from '../src/lib/k2hr3apiutil';
import	* as r3userdata				from '../src/lib/k2hr3userdata';	// for url path
import	* as tokenutil				from './auto_token_util';			// Token utility
import	{ app, expect, request }	from './auto_common';
import type { AllToken }			from './auto_token_util';

//
// Test in Register function
//
export function registerExtDataTests(): void {

	//--------------------------------------------------------------
	// Main describe section
	//--------------------------------------------------------------
	describe('API : EXTDATA', function(){
		//
		// Common data
		//
		const	alltokens: AllToken = tokenutil.createAllToken();
		let		regparamstr: string	= '';

		//
		// Before in describe section
		//
		before(function(done){
			// Nothing to do
			tokenutil.before(this, alltokens, done);

			// [NOTE]
			// Using 'tenant0_k2hr3_entest_str_role_01' role for all test.
			//
			const	regparamobj = {
				role:	'tenant0_k2hr3_entest_str_role_01',
				token:	apiutil.getSafeString(alltokens.roletoken.tenant0_k2hr3_entest_str_role_01)
			};
			const	udproc	= new r3userdata.userdataProcess;
			regparamstr		= apiutil.getSafeString(udproc.encryptRoleInfo(regparamobj));
		});

		//
		// After in describe section
		//
		after(function(){
			// Nothing to do
		});

		it('GET /v1/extdata/dummy/<correct path> : get extdata by text status 200', function(done){
			let		uri	= '/v1/extdata/dummy/';
			uri			+= regparamstr;																// path:		/v1/extdata/dummy/<correct path>
			const	ua	= 'dummy-client';															// User-Agent:	dummy-client

			request.execute(app)
				.get(uri)
				.set('content-type', 'application/octet-stream')
				.set('user-agent', ua)
				.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
				.end(function(err: Error | null, res: ChaiHttp.Response){
					//console.log(res);																// For debugging
					expect(res).to.have.status(200);
					expect(res).to.be.an('object');
					expect(res.header['content-type']).to.be.a('string').to.equal('text/x-shellscript; charset=utf-8');	// 'content-type' is script
					expect(res.body).to.be.an('object').to.be.empty;								// body is empty
					expect(res.text).to.be.a('string');												// text is string
					done();
				});
		});

		it('GET /v1/extdata : get extdata by without uri and path text status 400', function(done){
			const	uri	= '/v1/extdata';															// path:		/v1/extdata
			const	ua	= 'dummy-client';															// User-Agent:	dummy-client

			request.execute(app)
				.get(uri)
				.set('content-type', 'application/octet-stream')
				.set('user-agent', ua)
				.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.an('object');
					expect(res.body).to.be.an('object');											// response body is error json
					expect(res.body.result).to.be.a('boolean').to.be.false;							// result is false
					expect(res.body.message).to.be.an('string').to.equal('GET request url does not have extdata path parameter');	// error message
					expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');				// 'content-type' is json
					done();
				});
		});

		it('GET /v1/extdata/dummy : get extdata by without path text status 400', function(done){
			const	uri	= '/v1/extdata/dummy';														// path:		/v1/extdata/dummy
			const	ua	= 'dummy-client';															// User-Agent:	dummy-client

			request.execute(app)
				.get(uri)
				.set('content-type', 'application/octet-stream')
				.set('user-agent', ua)
				.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.an('object');
					expect(res.body).to.be.an('object');											// response body is error json
					expect(res.body.result).to.be.a('boolean').to.be.false;							// result is false
					expect(res.body.message).to.be.an('string').to.equal('GET request url does not have extdata path parameter');	// error message
					expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');				// 'content-type' is json
					done();
				});
		});

		it('GET /v1/extdata/dummy/<invalid path> : get extdata by with invalid path text status 400', function(done){
			let		uri	= '/v1/extdata/dummy/';
			uri			+= 'invalidpath';															// path:		/v1/extdata/dummy/<invalid path>
			const	ua	= 'dummy-client';															// User-Agent:	dummy-client

			request.execute(app)
				.get(uri)
				.set('content-type', 'application/octet-stream')
				.set('user-agent', ua)
				.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.an('object');
					expect(res.body).to.be.an('object');											// response body is error json
					expect(res.body.result).to.be.a('boolean').to.be.false;							// result is false
					expect(res.body.message).to.be.an('string').to.equal('GET /extdata/dummy/<path> is invalid');		// error message
					expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');	// 'content-type' is json
					done();
				});
		});

		it('GET /v1/extdata/<invalid uri>/<correct path> : get extdata by with invalid uri text status 400', function(done){
			let		uri	= '/v1/extdata/invalid/';
			uri			+= regparamstr;																// path:		/v1/extdata/<invalid uri>/<correct path>
			const	ua	= 'dummy-client';															// User-Agent:	dummy-client

			request.execute(app)
				.get(uri)
				.set('content-type', 'application/octet-stream')
				.set('user-agent', ua)
				.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.an('object');
					expect(res.body).to.be.an('object');											// response body is error json
					expect(res.body.result).to.be.a('boolean').to.be.false;							// result is false
					expect(res.body.message).to.be.an('string').to.equal('GET request URL path(invalid) does not exist');	// error message
					expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');		// 'content-type' is json
					done();
				});
		});

		it('GET /v1/extdata/dummy/<correct path> : get extdata by with invalid user-agent text status 400', function(done){
			let		uri	= '/v1/extdata/dummy/';
			uri			+= regparamstr;																// path:		/v1/extdata/dummy/<correct path>
			const	ua	= 'invalid-client';															// User-Agent:	<invalid user-agent>

			request.execute(app)
				.get(uri)
				.set('user-agent', '')
				.set('content-type', 'application/octet-stream')
				.set('user-agent', ua)
				.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.an('object');
					expect(res.body).to.be.an('object');											// response body is error json
					expect(res.body.result).to.be.a('boolean').to.be.false;							// result is false
					expect(res.body.message).to.be.an('string').to.equal('GET request is not allowed from your client');// error message
					expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');	// 'content-type' is json
					done();
				});
		});

		it('GET /v1/extdata/dummy/<correct path> : get extdata by without user-agent text status 400', function(done){
			let	uri	= '/v1/extdata/dummy/';
			uri		+= regparamstr;																	// path:		/v1/extdata/dummy/<correct path>

			request.execute(app)
				.get(uri)
				.set('user-agent', '')
				.set('content-type', 'application/octet-stream')
				.set('accept-encoding', 'identity')													// Chai send gzip encoding as default, thus we set 'identity'
				.end(function(err: Error | null, res: ChaiHttp.Response){
					expect(res).to.have.status(400);
					expect(res).to.be.an('object');
					expect(res.body).to.be.an('object');											// response body is error json
					expect(res.body.result).to.be.a('boolean').to.be.false;							// result is false
					expect(res.body.message).to.be.an('string').to.equal('GET request is not allowed from your client');// error message
					expect(res.header['content-type']).to.be.a('string').to.equal('application/json; charset=utf-8');	// 'content-type' is json
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
