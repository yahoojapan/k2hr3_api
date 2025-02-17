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
 * CREATE:   Wed Jun 8 2017
 * REVISION:
 *
 */

'use strict';

var	http		= require('http');
var	https		= require('https');

var	cacerts		= require('../lib/cacerts');
var	apiutil		= require('../lib/k2hr3apiutil');
var cliutil		= require('../lib/k2hr3cliutil');
var	r3keys		= require('../lib/k2hr3keys').getK2hr3Keys;

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Hostname and port from env
//
var hostname = apiutil.getSafeString(process.env.APIHOST);
var	hostport = apiutil.getSafeString(process.env.APIPORT);
var	is_https	= apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function getV1Policy(token, name, service)
{
	var	urlarg		= '';
	if(apiutil.isSafeString(service)){
		urlarg		= encodeURI('?service=' + service);
	}

	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		token
	};
	var	options = {
		'host':				hostname,
		'port':				hostport,
		'path': 			'/v1/policy/' + name + urlarg,
		'method':			'GET',
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

function headV1Policy(tenant, name, action, resource)
{
	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0
	};

	var	urlarg = '?resource=' + resource + '&action=' + action;
	if(apiutil.isSafeString(tenant)){
		urlarg += '&tenant=' + tenant;
	}

	var	options = {
		'host':		hostname,
		'port':		hostport,
		'path': 	'/v1/policy/' + name + encodeURI(urlarg),
		'method':	'HEAD',
		'headers':	headers
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
cliutil.getConsoleInput('Method(GET/HEAD)             : ', true, false, function(isbreak, method)
{
	if(isbreak){
		process.exit(0);
	}

	var	_method = method;
	if(apiutil.compareCaseString('get', _method)){

		cliutil.getConsoleInput('Service name(allow empty)    : ', true, false, function(isbreak, service)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_service = apiutil.isSafeString(service) ? apiutil.getSafeString(service) : null;

			cliutil.getConsoleInput('Scoped user token for tenant : ', true, false, function(isbreak, token)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_token = token;

				cliutil.getConsoleInput('Policy name                  : ', true, false, function(isbreak, name)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_name = name;

					// run
					getV1Policy(_token, _name, _service);
				});
			});
		});

	}else if(apiutil.compareCaseString('head', _method)){
		cliutil.getConsoleInput('Tenant name(allow null)      : ', true, false, function(isbreak, tenant)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_tenant = null;
			if('' === apiutil.getSafeString(tenant) || apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
				_tenant = null;
			}else{
				_tenant = tenant;
			}

			cliutil.getConsoleInput('Policy name                  : ', true, false, function(isbreak, name)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_name = name;

				cliutil.getConsoleInput('Action(read/write)           : ', true, false, function(isbreak, action)
				{
					if(isbreak){
						process.exit(0);
					}
					var	keys	= r3keys();
					var	_action = apiutil.getSafeString(action);
					if(keys.VALUE_READ !== _action && keys.VALUE_WRITE !== _action){
						process.exit(0);
					}

					cliutil.getConsoleInput('Resource                     : ', true, false, function(isbreak, resource)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_resource = null;
						if('' === apiutil.getSafeString(resource) || apiutil.compareCaseString('null', apiutil.getSafeString(resource))){
							_resource = null;
						}else{
							_resource = resource;
						}

						// run
						headV1Policy(_tenant, _name, _action, _resource);
					});
				});
			});
		});
	}else{
		console.log('method must be GET or HEAD : ' + _method);
		process.exit(0);
	}
});

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
