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
var hostname	= apiutil.getSafeString(process.env.APIHOST);
var	hostport	= apiutil.getSafeString(process.env.APIPORT);
var	is_https	= apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function getV1ChildrenList(method, token, type, service, path, is_expand)
{
	var	entrypath	= '/v1/list/';
	if(apiutil.isSafeString(service)){
		entrypath	+= service + '/';
	}
	entrypath		+= type;
	if(apiutil.isSafeString(path)){
		entrypath	+= '/' + path;
	}
	if(undefined !== is_expand && 'boolean' === typeof is_expand){
		var	keys	= r3keys();
		if(is_expand){
			entrypath	+= '?expand=' + keys.VALUE_TRUE;
		}else{
			entrypath	+= '?expand=' + keys.VALUE_FALSE;
		}
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0,
						'X-Auth-Token':		token
					  };
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			entrypath,
						'method':			method,
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
cliutil.getConsoleInput('Method(GET/HEAD)                   : ', true, false, function(isbreak, method)
{
	if(isbreak){
		process.exit(0);
	}

	var	_method = method.toUpperCase();
	if(!apiutil.compareCaseString('get', _method) && !apiutil.compareCaseString('head', _method)){
		console.log('method must be GET or HEAD : ' + _method);
		process.exit(0);
	}

	cliutil.getConsoleInput('type(service/role/resource/policy) : ', true, false, function(isbreak, type)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_type;
		if(apiutil.compareCaseString('service', apiutil.getSafeString(type))){
			_type = 'service';
		}else if(apiutil.compareCaseString('role', apiutil.getSafeString(type))){
			_type = 'role';
		}else if(apiutil.compareCaseString('resource', apiutil.getSafeString(type))){
			_type = 'resource';
		}else if(apiutil.compareCaseString('policy', apiutil.getSafeString(type))){
			_type = 'policy';
		}else{
			console.log('type must be service / role / resource / policy : ' + type);
			process.exit(0);
		}

		cliutil.getConsoleInput('Scoped user token for tenant       : ', true, false, function(isbreak, token)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_token = token;
			if(!apiutil.isSafeString(_token)){
				console.log('method must be specified token.');
				process.exit(0);
			}

			if(apiutil.compareCaseString('service', apiutil.getSafeString(_type))){
				//
				// service type, this is only listing service name.
				//
				getV1ChildrenList(_method, _token, _type, null);
				return;
			}

			cliutil.getConsoleInput('Service name(allow empty)          : ', true, false, function(isbreak, service)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_service = service;

				cliutil.getConsoleInput('path(allow empty)                  : ', true, false, function(isbreak, path)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_path;
					if('' === apiutil.getSafeString(path) || apiutil.compareCaseString('null', apiutil.getSafeString(path))){
						_path = null;
					}else{
						_path = path;
					}

					if('policy' !== _type){
						// role/resource can expand.
						cliutil.getConsoleInput('expand(true/false(default))        : ', true, false, function(isbreak, is_expand)
						{
							if(isbreak){
								process.exit(0);
							}
							var	keys = r3keys();
							var	_is_expand;
							if('' === is_expand || apiutil.compareCaseString('null', apiutil.getSafeString(is_expand)) || apiutil.compareCaseString(keys.VALUE_FALSE, apiutil.getSafeString(is_expand))){
								_is_expand = false;
							}else if(apiutil.compareCaseString(keys.VALUE_TRUE, apiutil.getSafeString(is_expand))){
								_is_expand = true;
							}else{
								console.log('expand must be true or false or null(empty) : ' + is_expand);
								process.exit(0);
							}
							// run
							getV1ChildrenList(_method, _token, _type, _service, _path, _is_expand);
						});
					}else{
						// run
						getV1ChildrenList(_method, _token, _type, _service, _path);
					}
				});
			});
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
