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
 * CREATE:   Mon Jun 3 2023
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
var hostname = apiutil.getSafeString(process.env.APIHOST);
var	hostport = apiutil.getSafeString(process.env.APIPORT);
var	is_https = apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function getV1Tenant(token, name, is_expand)
{
	var	path;
	var	urlarg;
	if(apiutil.isSafeString(name)){
		path	= '/v1/tenant/' + name;
		urlarg	= '';
	}else{
		path	= '/v1/tenant';
		if(is_expand){
			urlarg = encodeURI('?expand=true');
		}else{
			urlarg = encodeURI('?expand=false');
		}
	}

	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		token
	};
	var	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				path + urlarg,
		'method':				'GET',
		'headers':				headers
	};

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

function headV1Tenant(token, name)
{
	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		token
	};
	var	options = {
		'host':				hostname,
		'port':				hostport,
		'path': 			'/v1/tenant/' + name,
		'method':			'HEAD',
		'headers':			headers
	};

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
cliutil.getConsoleInput('Method(GET/HEAD)                     : ', true, false, function(isbreak, method)
{
	if(isbreak){
		process.exit(0);
	}
	var	_method = method;

	cliutil.getConsoleInput('Unscoped(or Scoped) user token       : ', true, false, function(isbreak, token)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_token = token;

		if(apiutil.compareCaseString('get', _method)){
			cliutil.getConsoleInput('Tenant name(null is get tenant list) : ', true, false, function(isbreak, tenant)
			{
				if(isbreak){
					process.exit(0);
				}

				if(apiutil.isSafeString(tenant)){
					var	_tenant = apiutil.getSafeString(tenant);

					//
					// Run
					//
					getV1Tenant(_token, _tenant, false);

				}else{
					cliutil.getConsoleInput('Expand tenant list(yes(default)/no)  : ', true, false, function(isbreak, expand)
					{
						if(isbreak){
							process.exit(0);
						}

						var	_is_expand;
						if('' === apiutil.getSafeString(expand) || apiutil.compareCaseString('null', apiutil.getSafeString(expand))){
							_is_expand = true;
						}else if(apiutil.compareCaseString('yes', apiutil.getSafeString(expand)) || apiutil.compareCaseString('true', apiutil.getSafeString(expand))){
							_is_expand = true;
						}else if(apiutil.compareCaseString('no', apiutil.getSafeString(expand)) || apiutil.compareCaseString('false', apiutil.getSafeString(expand))){
							_is_expand = false;
						}else{
							console.log('function expand must be empty or yes(true) or no(false) : ' + expand);
							process.exit(0);
						}

						//
						// Run
						//
						getV1Tenant(_token, null, _is_expand);
					});
				}
			});

		}else if(apiutil.compareCaseString('head', _method)){
			cliutil.getConsoleInput('Tenant name                          : ', true, false, function(isbreak, tenant)
			{
				if(isbreak){
					process.exit(0);
				}

				if(!apiutil.isSafeString(tenant)){
					console.log('method HEAD must specify tenant name');
					process.exit(0);
				}
				var	_tenant = apiutil.getSafeString(tenant);

				//
				// Run
				//
				headV1Tenant(_token, _tenant);
			});
		}else{
			console.log('method must be GET or HEAD : ' + _method);
			process.exit(0);
		}
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
