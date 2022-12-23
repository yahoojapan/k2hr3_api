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
function deleteV1Role(token, name, target_host, port, cuk)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0,
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token'] = token;
	}
	var urlarg		= '';
	var	already_set	= false;
	if(apiutil.isSafeString(target_host)){
		urlarg		+= already_set ? '&host=' : '?host=';
		urlarg		+= target_host;
		already_set	= true;
	}
	if(apiutil.isSafeEntity(port) && !isNaN(port)){
		urlarg		+= already_set ? '&port=' : '?port=';
		urlarg		+= String(port);
	}
	if(apiutil.isSafeString(cuk)){
		urlarg		+= already_set ? '&cuk=' : '?cuk=';
		urlarg		+= cuk;
		already_set	= true;
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			'/v1/role/' + name + encodeURI(urlarg),
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
// Request API for test
//
function deleteV1_IPByCuk(addrs, port, cuk)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0,
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	var urlarg		= '';
	var	already_set	= false;
	if(apiutil.isSafeEntity(addrs)){
		urlarg		+= already_set ? '&host=' : '?host=';
		if(apiutil.isArray(addrs)){
			urlarg	+= JSON.stringify(addrs);
		}else{
			urlarg	+= addrs;
		}
		already_set	= true;
	}
	if(apiutil.isSafeString(cuk)){
		urlarg		+= already_set ? '&cuk=' : '?cuk=';
		urlarg		+= cuk;
		already_set	= true;
	}
	if(null !== port && !isNaN(port)){
		urlarg		+= already_set ? '&port=' : '?port=';
		urlarg		+= String(port);
		already_set	= true;
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			'/v1/role' + encodeURI(urlarg),
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
cliutil.getConsoleInput('Delete ROLE/TOKEN(role)/HOST(name or ip)/IP/CUK : ', true, false, function(isbreak, type)
{
	if(isbreak){
		process.exit(0);
	}
	var	_type = type;
	if(apiutil.compareCaseString('ROLE', type)){
		_type = 'role';
	}else if(apiutil.compareCaseString('TOKEN', type)){
		_type = 'token';
	}else if(apiutil.compareCaseString('HOST', type)){
		_type = 'host';
	}else if(apiutil.compareCaseString('IP', type)){
		_type = 'ip';
	}else if(apiutil.compareCaseString('CUK', type)){
		_type = 'cuk';
	}else{
		console.log('token type must be USER or ROLE or HOST or IP : ' + JSON.stringify(type));
		process.exit(0);
	}

	if('cuk' === _type){
		cliutil.getConsoleInput('IP addrs(null=all, one ip, multi ip with ",")   : ', true, false, function(isbreak, addrs)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_addrs = null;
			if(apiutil.isSafeString(addrs)){
				_addrs			= new Array();
				var	tmpaddrarr	= addrs.split(',');
				for(var cnt = 0; cnt < tmpaddrarr.length; ++cnt){
					if(apiutil.isSafeString(tmpaddrarr[cnt].trim())){
						_addrs.push(apiutil.getSafeString(tmpaddrarr[cnt].trim()));
					}
				}
				if(0 == _addrs.length){
					_addrs = null;
				}else if(1 == _addrs.length){
					_addrs = _addrs[0];
				}
			}

			cliutil.getConsoleInput('Delete by CUK(allow empty)                      : ', true, false, function(isbreak, cuk)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_cuk = null;
				if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
					_cuk = cuk.trim();
				}

				cliutil.getConsoleInput('Delete by port(allow empty)                     : ', true, false, function(isbreak, port)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_port = null;
					if(!isNaN(port)){
						_port = parseInt(port);
					}

					// run
					deleteV1_IPByCuk(_addrs, _port, _cuk);
				});
			});
		});

	}else{
		cliutil.getConsoleInput('Role name or path(full yrn for IP)              : ', true, false, function(isbreak, name)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_name = name;

			if('ip' === _type){
				cliutil.getConsoleInput('Delete host port(default 0)                     : ', true, false, function(isbreak, port)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_port = 0;
					if(!apiutil.isSafeEntity(port)){
						_port = 0;
					}else if(!isNaN(port)){
						_port = port;
					}else{
						console.log('port number must be decimal number or empty(empty means 0=any port) : ' + JSON.stringify(port));
						process.exit(0);
					}

					cliutil.getConsoleInput('Delete host CUK(default empty)                  : ', true, false, function(isbreak, cuk)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_cuk = null;
						if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
							_cuk = cuk.trim();
						}

						// run
						deleteV1Role(null, _name, null, _port, _cuk);
					});
				});

			}else if('host' === _type){
				cliutil.getConsoleInput('Scoped user token                               : ', true, false, function(isbreak, token)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_token = 'U=' + token;

					cliutil.getConsoleInput('Delete hostname or ip address                   : ', true, false, function(isbreak, hostname)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_hostname = hostname;
						if(!apiutil.isSafeString(hostname)){
							process.exit(0);
						}

						cliutil.getConsoleInput('Delete host port(default 0)                     : ', true, false, function(isbreak, port)
						{
							if(isbreak){
								process.exit(0);
							}
							var	_port = 0;
							if(!apiutil.isSafeEntity(port)){
								_port = 0;
							}else if(!isNaN(port)){
								_port = port;
							}else{
								console.log('port number must be decimal number or empty(empty means 0=any port) : ' + JSON.stringify(port));
								process.exit(0);
							}

							cliutil.getConsoleInput('Delete host CUK(default empty)                  : ', true, false, function(isbreak, cuk)
							{
								if(isbreak){
									process.exit(0);
								}
								var	_cuk = null;
								if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
									_cuk = cuk.trim();
								}

								// run
								deleteV1Role(_token, _name, _hostname, _port, _cuk);
							});
						});
					});
				});

			}else if('token' === _type){
				cliutil.getConsoleInput('Scoped role token                               : ', true, false, function(isbreak, token)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_token = 'R=' + token;

					// run
					deleteV1Role(_token, _name);
				});

			}else{	// role
				cliutil.getConsoleInput('Scoped user token                               : ', true, false, function(isbreak, token)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_token = 'U=' + token;

					// run
					deleteV1Role(_token, _name);
				});
			}
		});
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
