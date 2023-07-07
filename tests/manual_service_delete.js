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
 * CREATE:   Mon Nor 6 2017
 * REVISION:
 *
 */

'use strict';

var	http		= require('http');
var	https		= require('https');

var	cacerts		= require('../lib/cacerts');
var	apiutil		= require('../lib/k2hr3apiutil');
var cliutil		= require('../lib/k2hr3cliutil');

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Hostname and port from env
//
var hostname	= apiutil.getSafeString(process.env.APIHOST);
var	hostport	= apiutil.getSafeString(process.env.APIPORT);
var	is_https	= apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function rawDeleteV1Service(token, service, tenant)
{
	var	basepath	= '/v1/service/' + service;
	if(apiutil.isSafeString(tenant)){
		basepath	+= '?tenant=' + encodeURI(tenant);
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'X-Auth-Token':		'U=' + token
					  };
	var	options		= {
						'host':				hostname,
						'port':				hostport,
						'path': 			basepath,
						'method':			'DELETE',
						'headers':			headers
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	r3logger.dlog('request options   = ' + JSON.stringify(options));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));

	var	httpobj;
	if(is_https){
		if(null !== cacerts.ca){
			options.ca = cacerts.ca;
		}
		options.rejectUnauthorized	= false;			// always insecure for this manual test
		options.agent	= new https.Agent(options);
		httpobj			= https;
	}else{
		options.agent	= new http.Agent(options);
		httpobj			= http;
	}

	var	req	= httpobj.request(options, function(res)
	{
		var	response = '';
		console.log('RESPONSE CODE = ' + res.statusCode);
		r3logger.dlog('response status   = ' + res.statusCode);
		r3logger.dlog('response header   = ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');

		res.on('data', function (chunk)
		{
			r3logger.dlog('response chunk    = ' + chunk);
			response += chunk;
		});

		res.on('end', function(result)					// eslint-disable-line no-unused-vars
		{
			r3logger.mlog(r3logger.dump(response));		// response is object(or not)
			console.log('RESPONSE BODY = ' + JSON.stringify(response));
			process.exit(0);
		});
	});

	req.on('error', function(e)
	{
		r3logger.elog('problem with request: ' + e.message);
	});

	req.end();
}

//
// run
//
cliutil.getConsoleInput('Scoped user token for service owner tenant               : ', true, false, function(isbreak, token)
{
	if(isbreak){
		process.exit(0);
	}
	var	_token = token;

	cliutil.getConsoleInput('Service name                                             : ', true, false, function(isbreak, service)
	{
		if(isbreak){
			process.exit(0);
		}
		if(!apiutil.isSafeString(service)){
			console.log('must be service name.');
			process.exit(0);
		}
		var	_service = service;

		cliutil.getConsoleInput('Remove tenant name(empty(null)->remove service)          : ', true, false, function(isbreak, tenant)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_tenant = tenant;
			if(!apiutil.isSafeString(tenant)){
				_tenant = null;
			}
			//
			// run DELETE
			//
			rawDeleteV1Service(_token, _service, _tenant);
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
