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
	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		token
	};
	var	options = {
		'host':				hostname,
		'port':				hostport,
		'path': 			'/v1/role/' + name + (is_expand ? '' : '?expand=false'),		// default expand is true
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

function getV1RoleToken(token, name, expire)
{
	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
	};
	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token'] = token;
	}

	var	urlarg = '';
	if(null !== expire && !isNaN(expire)){
		urlarg = '?expire=' + String(expire);
	}

	var	options = {
		'host':		hostname,
		'port':		hostport,
		'path': 	'/v1/role/token/' + name + urlarg,
		'method':	'GET',
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

function getV1RoleTokenList(token, name, expand)
{
	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
	};
	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token'] = token;
	}
	var	options = {
		'host':		hostname,
		'port':		hostport,
		'path': 	'/v1/role/token/list/' + name + (expand ? '?expand=true' : '?expand=false'),
		'method':	'GET',
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

function headV1Role(token, roleyrn, port, cuk)
{
	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0
	};
	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token'] = token;
	}

	var	urlargs = '';
	if(null !== port){
		urlargs = '?port=' + String(port);
	}
	if(apiutil.isSafeString(cuk)){
		if(apiutil.isSafeString(urlargs)){
			urlargs	+= '&cuk=';
		}else{
			urlargs	= '?cuk=';
		}
		urlargs		+= cuk;
	}

	var	options = {
		'host':		hostname,
		'port':		hostport,
		'path': 	'/v1/role/' + roleyrn + urlargs,
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

		cliutil.getConsoleInput('host or token or tokenlist   : ', true, false, function(isbreak, type)
		{
			if(isbreak){
				process.exit(0);
			}
			if(apiutil.compareCaseString('host', type)){
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

							if('user' == _token_type){
								cliutil.getConsoleInput('expire(default or number or no expire(NO))  : ', true, false, function(isbreak, expire)
								{
									if(isbreak){
										process.exit(0);
									}
									var	_expire = null;
									if(!isNaN(expire)){
										_expire = parseInt(expire);
									}else if(apiutil.compareCaseString('no expire', expire) || apiutil.compareCaseString('no', expire)){
										_expire = 0;
									}

									// run
									getV1RoleToken(_token, _name, _expire);
								});
							}else{
								// run
								getV1RoleToken(_token, _name);
							}
						});
					});
				});

			}else if(apiutil.compareCaseString('tokenlist', type)){
				// get role token list
				cliutil.getConsoleInput('Role name                    : ', true, false, function(isbreak, name)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_name = name;

					cliutil.getConsoleInput('Scoped User token            : ', true, false, function(isbreak, token)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_token = 'U=' + token;

						cliutil.getConsoleInput('expand(default yes) - y/n    : ', true, false, function(isbreak, expand)
						{
							if(isbreak){
								process.exit(0);
							}
							var	_expand = true;
							if(apiutil.compareCaseString('no', expand) || apiutil.compareCaseString('n', expand)){
								_expand = false;
							}else{
								_expand = true;
							}

							// run
							getV1RoleTokenList(_token, _name, _expand);
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

					cliutil.getConsoleInput('port number(allow empty)              : ', true, false, function(isbreak, port)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_port = null;
						if(!isNaN(port)){
							_port = port;
						}

						cliutil.getConsoleInput('cuk(allow empty, need for k8s)        : ', true, false, function(isbreak, cuk)
						{
							if(isbreak){
								process.exit(0);
							}
							var	_cuk = cuk;

							// run
							headV1Role(null, _roleyrn, _port, _cuk);
						});
					});
				}
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
