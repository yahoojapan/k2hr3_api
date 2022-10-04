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

//--------------------------------------------------------------
// Main describe section
//--------------------------------------------------------------
describe('API : VERSION', function(){					// eslint-disable-line no-undef
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
	// Run Test
	//
	it('GET / with status 200', function(done){			// eslint-disable-line no-undef
		chai.request(app)
			.get('/')
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.an('object').to.deep.include({
					version: ['v1']
				});
				done();
			});
	});

	it('GET /v1 with status 200', function(done){		// eslint-disable-line no-undef
		chai.request(app)
			.get('/v1')
			.set('content-type', 'application/json')
			.end(function(err, res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;

				/* eslint-disable indent, no-mixed-spaces-and-tabs */
				expect(res.body).to.be.an('object').to.deep.include({
					'version':		{	'/':										['GET'],
										'/v1':										['GET']},
					'user token':	{	'/v1/user/tokens':							['HEAD', 'GET', 'POST']},
					'host':			{	'/v1/host':									['GET', 'PUT', 'POST', 'DELETE'],
										'/v1/host/{port}':							['PUT', 'POST', 'DELETE'],
										'/v1/host/FQDN':							['DELETE'],
										'/v1/host/FQDN:{port}':						['DELETE'],
										'/v1/host/IP':								['DELETE'],
										'/v1/host/IP:{port}':						['DELETE']},
					'service':		{	'/v1/service':								['PUT', 'POST'],
										'/v1/service/{service}':					['GET', 'HEAD', 'PUT', 'POST', 'DELETE']},
					'role':			{	'/v1/role':									['PUT', 'POST'],
										'/v1/role/{role}':							['HEAD', 'GET', 'PUT', 'POST', 'DELETE'],
										'/v1/role/token/{role}':					['GET']},
					'resource':		{	'/v1/resource':								['PUT', 'POST'],
										'/v1/resource/{resource}':					['HEAD', 'GET', 'DELETE']},
					'policy':		{	'/v1/policy':								['PUT', 'POST'],
										'/v1/policy/{policy}':						['HEAD', 'GET', 'DELETE']},
					'list':			{	'/v1/list':									['HEAD', 'GET'],
										'/v1/list/{role, resource, policy}/{path}':	['HEAD', 'GET']},
					'acr':			{	'/v1/acr/{service}':						['GET', 'PUT', 'POST', 'DELETE']}
				});
				/* eslint-enable indent, no-mixed-spaces-and-tabs */

				done();
			});
	});
});

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
