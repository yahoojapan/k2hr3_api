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
function rawPutPostV1Acr(method, tenant, token, service)
{
	var	strbody		= '';
	var	urlarg		= '';
	if(apiutil.isSafeString(tenant)){
		if(apiutil.compareCaseString('POST', method)){
			strbody	= {
				tenant: tenant
			};
			strbody	= JSON.stringify(strbody);
		}else{
			urlarg	= encodeURI('?tenant=' + tenant);
		}
	}

	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	strbody.length,
		'X-Auth-Token':		'U=' + token
	};
	var	options = {
		'host':				hostname,
		'port':				hostport,
		'path': 			'/v1/acr/' + service + urlarg,
		'method':			method,
		'headers':			headers
	};

	r3logger.dlog('request options   = ' + JSON.stringify(options));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));
	r3logger.dlog('request body      = ' + apiutil.getSafeString(strbody));

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

	// write data to request body
	if(apiutil.compareCaseString('POST', method)){
		req.write(strbody);
	}
	req.end();
}

//
// Utility for inputting token for two pattern
//
// callback(error, tenant name(allow null), token string)
//
function rawInputToken(callback)
{
	var	_callback = callback;

	cliutil.getConsoleInput('Tenant name(allow empty)                          : ', true, false, function(isbreak, tenant)
	{
		if(isbreak){
			_callback('break for inputting tenant name');
			return;
		}
		var	_tenant = apiutil.isSafeString(tenant) ? tenant.toLowerCase() : null;
		var	_message;
		if(null === _tenant){
			_message = 'SCOPED user token                                 : ';
		}else{
			_message = 'UNSCOPED user token                               : ';
		}

		cliutil.getConsoleInput(_message, true, false, function(isbreak, token)
		{
			if(isbreak){
				_callback('break for inputting token');
				return;
			}
			if(!apiutil.isSafeString(token)){
				_callback('token must be string');
				return;
			}
			var	_token = token;
			_callback(null, _tenant, _token);
		});
	});
}

//
// run
//
cliutil.getConsoleInput('Method(POST/PUT)                                  : ', true, false, function(isbreak, method)
{
	if(isbreak){
		process.exit(0);
	}

	var	_method;
	if(apiutil.compareCaseString('post', method)){
		_method	= 'POST';
	}else if(apiutil.compareCaseString('put', method)){
		_method	= 'PUT';
	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	cliutil.getConsoleInput('Create base service name                          : ', true, false, function(isbreak, service)
	{
		if(isbreak){
			process.exit(0);
		}
		if(!apiutil.isSafeString(service)){
			console.log('service must be service name.');
			process.exit(0);
		}
		var	_service = service;

		rawInputToken(function(error, tenant, token)
		{
			if(null !== error){
				console.log(error);
				process.exit(0);
			}
			var	_tenant	= tenant;
			var	_token	= token;

			//
			// run
			//
			rawPutPostV1Acr(_method, _tenant, _token, _service);
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
