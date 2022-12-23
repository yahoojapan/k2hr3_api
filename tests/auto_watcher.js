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
 * CREATE:   Thu Oct 25 2018
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
var watchobj	= require('../lib/ipwatch');			// Watcher process library

//--------------------------------------------------------------
// Main describe section
//--------------------------------------------------------------
describe('PROCESS : WATHCER', function(){				// eslint-disable-line no-undef
	//
	// Common data
	//
	var	alltokens = {};

	//
	// Before in describe section
	//
	before(function(done){								// eslint-disable-line no-undef
		tokenutil.before(this, alltokens, done);
	});

	//
	// After in describe section
	//
	after(function(){									// eslint-disable-line no-undef
		// Nothing to do
	});

	//
	// Run Test(RUN - WATCHER)
	//
	it('RUN WATCHER : run watcher process(lib) oneshot with result null', function(done){									// eslint-disable-line no-undef
		new Promise(function(resolve, reject)											// promise object is used
		{
			watchobj.watchAddressesAlive(function(result)
			{
				if(undefined != result && null != result && 'boolean' == typeof result && result){
					resolve(true);
				}else{
					reject(new Error('something error occurred'));
				}
			});
		}).then(function(res){
			expect(res).to.be.a('boolean').to.be.true;									// oneshot watcher result must be true
		}).then(done, done);
	});

	//
	// Run Test(GET - ROLE:IP - SUCCESS)
	//
	it('CHECK WATCHER RESULT : get auto_test_role role which has only two IP addresses with response 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/auto_test_role';													// path:	yrn:yahoo:::tenant0:role:auto_test_role
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
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(2);
				expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 * auto-test-cuk openstack-auto-v1');
				expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('255.255.255.1 * auto-test-cuk openstack-auto-v1');

				done();
			});
	});

	it('CHECK WATCHER RESULT : get k8s_test_role role which has only two IP addresses with response 200', function(done){	// eslint-disable-line no-undef
		var	uri	= '/v1/role';
		uri		+= '/k8s_test_role';													// path:	yrn:yahoo:::tenant0:role:k8s_test_role
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
				expect(res.body.role.hosts).to.be.an('object');
				expect(res.body.role.hosts.hostnames).to.be.an.instanceof(Array).to.have.lengthOf(0);
				expect(res.body.role.hosts.ips).to.be.an.instanceof(Array);

				if(3 == res.body.role.hosts.ips.length){
					// when run test:all, array is 3
					expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(3);
					expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('255.255.127.1 * eyJrOHNfY29udGFpbmVyX2lkIjoiMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEiLCJrOHNfazJocjNfcmFuZCI6ImFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhIiwiazhzX25hbWVzcGFjZSI6ImF1dG8tdGVzdC1uYW1lc3BhY2UiLCJrOHNfbm9kZV9pcCI6IjI1NS4yNTUuMTI3LjEiLCJrOHNfbm9kZV9uYW1lIjoiYXV0by10ZXN0LW5vZGUtMSIsIms4c19wb2RfaWQiOiJhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYSIsIms4c19wb2RfaXAiOiIyNTUuMTI3LjEyNy4xIiwiazhzX3BvZF9uYW1lIjoiYXV0by10ZXN0LXBvZC0xIiwiazhzX3NlcnZpY2VfYWNjb3VudCI6ImF1dG8tdGVzdC1zYSJ9 k8s-auto-v1');
					expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('255.255.127.2 * eyJrOHNfY29udGFpbmVyX2lkIjoiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIiLCJrOHNfazJocjNfcmFuZCI6ImJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiIiwiazhzX25hbWVzcGFjZSI6ImF1dG8tdGVzdC1uYW1lc3BhY2UiLCJrOHNfbm9kZV9pcCI6IjI1NS4yNTUuMTI3LjIiLCJrOHNfbm9kZV9uYW1lIjoiYXV0by10ZXN0LW5vZGUtMiIsIms4c19wb2RfaWQiOiJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYiIsIms4c19wb2RfaXAiOiIyNTUuMTI3LjEyNy4yIiwiazhzX3BvZF9uYW1lIjoiYXV0by10ZXN0LXBvZC0yIiwiazhzX3NlcnZpY2VfYWNjb3VudCI6ImF1dG8tdGVzdC1zYSJ9 k8s-auto-v1');
					expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('255.255.127.3 * eyJrOHNfY29udGFpbmVyX2lkIjoiMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMiLCJrOHNfazJocjNfcmFuZCI6ImNjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjIiwiazhzX25hbWVzcGFjZSI6ImF1dG8tdGVzdC1uYW1lc3BhY2UiLCJrOHNfbm9kZV9pcCI6IjI1NS4yNTUuMTI3LjMiLCJrOHNfbm9kZV9uYW1lIjoiYXV0by10ZXN0LW5vZGUtMyIsIms4c19wb2RfaWQiOiJjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjYyIsIms4c19wb2RfaXAiOiIyNTUuMTI3LjEyNy4zIiwiazhzX3BvZF9uYW1lIjoiYXV0by10ZXN0LXBvZC0zIiwiazhzX3NlcnZpY2VfYWNjb3VudCI6ImF1dG8tdGVzdC1zYSJ9 k8s-auto-v1');

				}else if(4 == res.body.role.hosts.ips.length){
					// when run test:wacher as single testing, array is 4
					expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(4);
					expect(res.body.role.hosts.ips[0]).to.be.a('string').to.equal('127.0.0.1 * eyJrOHNfY29udGFpbmVyX2lkIjoiNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQiLCJrOHNfazJocjNfcmFuZCI6ImRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkIiwiazhzX25hbWVzcGFjZSI6ImF1dG8tdGVzdC1uYW1lc3BhY2UiLCJrOHNfbm9kZV9pcCI6IjEyNy4wLjAuMSIsIms4c19ub2RlX25hbWUiOiJhdXRvLXRlc3Qtbm9kZS00IiwiazhzX3BvZF9pZCI6ImRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkIiwiazhzX3BvZF9pcCI6IjEyNy4wLjAuMSIsIms4c19wb2RfbmFtZSI6ImF1dG8tdGVzdC1wb2QtNCIsIms4c19zZXJ2aWNlX2FjY291bnQiOiJhdXRvLXRlc3Qtc2EifQ== k8s-auto-v1');
					expect(res.body.role.hosts.ips[1]).to.be.a('string').to.equal('255.255.127.1 * eyJrOHNfY29udGFpbmVyX2lkIjoiMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEiLCJrOHNfazJocjNfcmFuZCI6ImFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhIiwiazhzX25hbWVzcGFjZSI6ImF1dG8tdGVzdC1uYW1lc3BhY2UiLCJrOHNfbm9kZV9pcCI6IjI1NS4yNTUuMTI3LjEiLCJrOHNfbm9kZV9uYW1lIjoiYXV0by10ZXN0LW5vZGUtMSIsIms4c19wb2RfaWQiOiJhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYSIsIms4c19wb2RfaXAiOiIyNTUuMTI3LjEyNy4xIiwiazhzX3BvZF9uYW1lIjoiYXV0by10ZXN0LXBvZC0xIiwiazhzX3NlcnZpY2VfYWNjb3VudCI6ImF1dG8tdGVzdC1zYSJ9 k8s-auto-v1');
					expect(res.body.role.hosts.ips[2]).to.be.a('string').to.equal('255.255.127.2 * eyJrOHNfY29udGFpbmVyX2lkIjoiMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIiLCJrOHNfazJocjNfcmFuZCI6ImJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiIiwiazhzX25hbWVzcGFjZSI6ImF1dG8tdGVzdC1uYW1lc3BhY2UiLCJrOHNfbm9kZV9pcCI6IjI1NS4yNTUuMTI3LjIiLCJrOHNfbm9kZV9uYW1lIjoiYXV0by10ZXN0LW5vZGUtMiIsIms4c19wb2RfaWQiOiJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYiIsIms4c19wb2RfaXAiOiIyNTUuMTI3LjEyNy4yIiwiazhzX3BvZF9uYW1lIjoiYXV0by10ZXN0LXBvZC0yIiwiazhzX3NlcnZpY2VfYWNjb3VudCI6ImF1dG8tdGVzdC1zYSJ9 k8s-auto-v1');
					expect(res.body.role.hosts.ips[3]).to.be.a('string').to.equal('255.255.127.3 * eyJrOHNfY29udGFpbmVyX2lkIjoiMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMiLCJrOHNfazJocjNfcmFuZCI6ImNjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjIiwiazhzX25hbWVzcGFjZSI6ImF1dG8tdGVzdC1uYW1lc3BhY2UiLCJrOHNfbm9kZV9pcCI6IjI1NS4yNTUuMTI3LjMiLCJrOHNfbm9kZV9uYW1lIjoiYXV0by10ZXN0LW5vZGUtMyIsIms4c19wb2RfaWQiOiJjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjYyIsIms4c19wb2RfaXAiOiIyNTUuMTI3LjEyNy4zIiwiazhzX3BvZF9uYW1lIjoiYXV0by10ZXN0LXBvZC0zIiwiazhzX3NlcnZpY2VfYWNjb3VudCI6ImF1dG8tdGVzdC1zYSJ9 k8s-auto-v1');

				}else{
					// force do error
					expect(res.body.role.hosts.ips).to.be.an.instanceof(Array).to.have.lengthOf(0);
				}

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
