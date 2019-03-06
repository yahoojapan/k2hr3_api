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
function getV1Role(token, name, is_expand)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0,
						'X-Auth-Token':		token
					  };
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			'/v1/role/' + name + (is_expand ? '' : '?expand=false'),		// default expand is true
						'method':			'GET',
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

function getV1RoleToken(token, name)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0,
					  };
	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token'] = token;
	}
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			'/v1/role/token/' + name,
						'method':			'GET',
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
			console.log('RESPONSE =\n' + JSON.stringify(response));
			process.exit(0);
		});
	});

	req.on('error', function(e)
	{
		r3logger.elog('problem with request: ' + e.message);
	});
	req.end();
}

function headV1Role(token, roleyrn)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0
					  };
	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token'] = token;
	}
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			'/v1/role/' + roleyrn,
						'method':			'HEAD',
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
cliutil.getConsoleInput('Method(GET/HEAD)             : ', true, false, function(isbreak, method)
{
	if(isbreak){
		process.exit(0);
	}
	var	_method = method;

	if(apiutil.compareCaseString('get', _method)){

		cliutil.getConsoleInput('Get data(DATA)/token(TOKEN)  : ', true, false, function(isbreak, type)
		{
			if(isbreak){
				process.exit(0);
			}
			if(apiutil.compareCaseString('data', type)){
				// get role data
				cliutil.getConsoleInput('Scoped user token            : ', true, false, function(isbreak, token)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_token = token;

					cliutil.getConsoleInput('Role name                    : ', true, false, function(isbreak, name)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_name = name;

						cliutil.getConsoleInput('Role expand(true/false)      : ', true, false, function(isbreak, expand)
						{
							if(isbreak){
								process.exit(0);
							}

							var	_is_expand = false;
							if(apiutil.compareCaseString('true', expand)){
								_is_expand = true;
							}else if(apiutil.compareCaseString('false', expand)){
								_is_expand = false;
							}else{
								console.log('resource expand must be TRUE or FALSE : ' + expand);
								process.exit(0);
							}

							// run
							getV1Role(_token, _name, _is_expand);
						});
					});
				});

			}else if(apiutil.compareCaseString('token', type)){
				// get role token
				cliutil.getConsoleInput('Role name                    : ', true, false, function(isbreak, name)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_name = name;

					cliutil.getConsoleInput('Token type USER/ROLE/NULL    : ', true, false, function(isbreak, type)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_token_type = type;
						if(apiutil.compareCaseString('USER', type)){
							_token_type = 'user';
						}else if(apiutil.compareCaseString('ROLE', type)){
							_token_type = 'role';
						}else{
							// run
							getV1RoleToken(null, _name);
							return;
						}

						cliutil.getConsoleInput('Scoped ' + _token_type + ' token            : ', true, false, function(isbreak, token)
						{
							if(isbreak){
								process.exit(0);
							}
							var	_token;
							if('user' === _token_type){
								_token = 'U=' + token;
							}else{
								_token = 'R=' + token;
							}
							// run
							getV1RoleToken(_token, _name);
						});
					});
				});

			}else{
				console.log('resource type must be DATA or TOKEN : ' + type);
				process.exit(0);
			}
		});

	}else if(apiutil.compareCaseString('head', _method)){

		cliutil.getConsoleInput('Token type USER/ROLE/NULL    : ', true, false, function(isbreak, type)
		{
			if(isbreak){
				process.exit(0);
			}

			var	_type = null;
			if(apiutil.compareCaseString('user', type)){
				_type = 'user';
			}else if(apiutil.compareCaseString('role', type)){
				_type = 'role';
			}else if(!apiutil.isSafeString(type) || apiutil.compareCaseString('null', type)){
				_type = null;
			}else{
				console.log('token type must be USER or ROLE or NULL(empty) : ' + type);
				process.exit(0);
			}

			cliutil.getConsoleInput('Role(full yrn for ROLE/NULL) : ', true, false, function(isbreak, roleyrn)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_roleyrn = roleyrn;

				if('user' === _type || 'role' === _type){

					cliutil.getConsoleInput('Scoped ' + _type + ' token            : ', true, false, function(isbreak, token)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_token;
						if('user' === _type){
							_token = 'U=' + token;
						}else{
							_token = 'R=' + token;
						}
						// run
						headV1Role(_token, _roleyrn);
					});

				}else{
					// run
					headV1Role(null, roleyrn);
				}
			});
		});

	}else{
		console.log('method must be GET or HEAD : ' + _method);
		process.exit(0);
	}
});

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
