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
function postV1Role(method, token, name, policies, alias)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	strbody		= '';
	var	headers		= {
						'Content-Type':		'application/json',
						'X-Auth-Token':		token
					  };
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'method':			method
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	if(apiutil.compareCaseString('post', method)){
		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	body	= {	'role':
						{	'name':			name,
							'policies':		policies,
							'alias':		alias
						}
					  };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		strbody						= JSON.stringify(body);
		headers['Content-Length']	= strbody.length;
		options.headers				= headers;
		options.path				= '/v1/role';

	}else if(apiutil.compareCaseString('put', method)){
		// case for PUT
		var urlarg		= '';
		var	already_set	= false;
		if('' === name || apiutil.isSafeString(name)){
			urlarg		+= already_set ? '&name=' : '?name=';
			urlarg		+= name;
			already_set	= true;
		}
		if(apiutil.isSafeEntity(policies)){
			urlarg		+= already_set ? '&policies=' : '?policies=';
			urlarg		+= JSON.stringify(policies);		// policies is converted to JSON
			already_set	= true;
		}
		if(apiutil.isSafeEntity(alias)){
			urlarg		+= already_set ? '&alias=' : '?alias=';
			urlarg		+= JSON.stringify(alias);			// alias is converted to JSON
			already_set	= true;
		}

		headers['Content-Length']	= 0;
		options.headers				= headers;
		options.path				= '/v1/role' + encodeURI(urlarg);

	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	r3logger.dlog('request options   = ' + JSON.stringify(options));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));
	r3logger.dlog('request body      = ' + strbody);

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
	req.on('error', function(e) {
		r3logger.elog('problem with request: ' + e.message);
	});

	// write data to request body
	if('' !== strbody){
		req.write(strbody);
	}
	req.end();
}

function postV1RoleHost(method, is_user_token, token, name, target_host, port, cuk, extra)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	strbody		= '';
	var	_token		= (is_user_token ? ('U=' + token) : ('R=' + token));
	var	headers		= {
						'Content-Type':		'application/json',
						'X-Auth-Token':		_token
					  };
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'method':			method
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	if(apiutil.compareCaseString('post', method)){
		var	host_info				= {};
		if(is_user_token){
			host_info.host			= target_host;
			host_info.ip			= null;
		}
		host_info.port				= port;
		host_info.cuk				= cuk;
		host_info.extra				= extra;

		var	body					= {	'host': host_info };

		strbody						= JSON.stringify(body);
		headers['Content-Length']	= strbody.length;
		options.headers				= headers;
		options.path				= '/v1/role/' + name;

	}else if(apiutil.compareCaseString('put', method)){
		// case for PUT
		var urlarg		= '';
		var	already_set	= false;
		if(is_user_token && apiutil.isSafeString(target_host)){
			urlarg		+= already_set ? '&host=' : '?host=';
			urlarg		+= target_host;
			already_set	= true;
		}
		if(0 <= port){
			urlarg		+= already_set ? '&port=' : '?port=';
			urlarg		+= port;
			already_set	= true;
		}
		if(apiutil.isSafeString(cuk)){
			urlarg		+= already_set ? '&cuk=' : '?cuk=';
			urlarg		+= cuk;
			already_set	= true;
		}
		if(apiutil.isSafeString(extra)){
			urlarg		+= already_set ? '&extra=' : '?extra=';
			urlarg		+= JSON.stringify(extra);			// if extra is existing, it includes control codes, so it is converted to JSON.
			already_set	= true;
		}
		headers['Content-Length']	= 0;
		options.headers				= headers;
		options.path				= '/v1/role/' + name + encodeURI(urlarg);

	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	r3logger.dlog('request options   = ' + JSON.stringify(options));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));
	r3logger.dlog('request body      = ' + strbody);

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
	req.on('error', function(e) {
		r3logger.elog('problem with request: ' + e.message);
	});

	// write data to request body
	if('' !== strbody){
		req.write(strbody);
	}
	req.end();
}

//
// Run for role
//
function inputRoleType(method)
{
	var	_method = method;

	cliutil.getConsoleInput('Scoped user token for tenant                          : ', true, false, function(isbreak, token)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_token = token;

		cliutil.getConsoleInput('Role name(path)                                       : ', true, false, function(isbreak, name)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_name = name;

			cliutil.getConsoleInput('     policies(specify null/yrn with \',\' for multiple) : ', true, false, function(isbreak, policies)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_policies;

				if('' === apiutil.getSafeString(policies) || apiutil.compareCaseString('null', apiutil.getSafeString(policies))){
					_policies = null;
				}else{
					// parse ','
					_policies	= new Array(0);
					var	strarray= policies.split(',');
					for(var cnt = 0; cnt < strarray.length; ++cnt){
						var	strtmp = strarray[cnt].trim();
						_policies.push(strtmp);
					}
				}

				cliutil.getConsoleInput('     alias(specify null/yrn with \',\' for multiple)    : ', true, false, function(isbreak, alias)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_alias;

					if('' === apiutil.getSafeString(alias) || apiutil.compareCaseString('null', apiutil.getSafeString(alias))){
						_alias = null;
					}else{
						// parse ','
						_alias		= new Array(0);
						var	strarray= alias.split(',');
						for(var cnt = 0; cnt < strarray.length; ++cnt){
							var	strtmp = strarray[cnt].trim();
							_alias.push(strtmp);
						}
					}

					// run
					postV1Role(_method, _token, _name, _policies, _alias);
				});
			});
		});
	});
}

//
// Run for host
//
function inputHostType(method)
{
	var	_method = method;

	cliutil.getConsoleInput('Token type( USER(default) / ROLE )                    : ', true, false, function(isbreak, type)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_is_user_token;
		var _keyward;
		if(!apiutil.isSafeString(type) || apiutil.compareCaseString('null', apiutil.getSafeString(type)) || apiutil.compareCaseString('user', apiutil.getSafeString(type))){
			_is_user_token	= true;
			_keyward		= 'USER';
		}else if(apiutil.compareCaseString('role', apiutil.getSafeString(type))){
			_is_user_token	= false;
			_keyward		= 'ROLE';
		}else{
			process.exit(0);
		}

		cliutil.getConsoleInput('Scoped ' + _keyward + ' token for tenant                          : ', true, false, function(isbreak, token)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_token = token;

			cliutil.getConsoleInput('Role name(path)                                       : ', true, false, function(isbreak, name)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_name = name;

				cliutil.getConsoleInput('     Port number(specify 0...(0 means any port))      : ', true, false, function(isbreak, port)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_port = parseInt(port);

					if(port !== String(_port) && _port < 0){
						console.log('port number must be decimal number: ' + JSON.stringify(port));
						process.exit(0);
					}

					cliutil.getConsoleInput('     CUK string(allow null)                           : ', true, false, function(isbreak, cuk)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_cuk = null;
						if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
							_cuk = cuk.trim();
						}

						cliutil.getConsoleInput('     Extra data TYPE for host(NULL or STRING)         : ', true, false, function(isbreak, is_extra)
						{
							if(isbreak){
								process.exit(0);
							}

							if('' === apiutil.getSafeString(is_extra) || apiutil.compareCaseString('null', is_extra)){

								if(!_is_user_token){
									// run
									postV1RoleHost(_method, _is_user_token, _token, _name, null, _port, null);
								}else{

									cliutil.getConsoleInput('     Host(specify hostname or ip address)             : ', true, false, function(isbreak, target_host)
									{
										if(isbreak){
											process.exit(0);
										}
										if(!apiutil.isSafeString(target_host)){
											process.exit(0);
										}
										var	_target_host = target_host;

										// run
										postV1RoleHost(_method, _is_user_token, _token, _name, _target_host, _port, _cuk, null);
									});
								}

							}else if(apiutil.compareCaseString('string', is_extra) || apiutil.compareCaseString('str', is_extra)){

								cliutil.getConsoleInput('     Extra data for host(specify string)              : \n', true, true, function(isbreak, extra)
								{
									if(isbreak){
										process.exit(0);
									}
									var	_extra;

									if('' === apiutil.getSafeString(extra) || apiutil.compareCaseString('null', apiutil.getSafeString(extra))){
										_extra = null;
									}else{
										_extra = extra;
									}


									if(!_is_user_token){
										// run
										postV1RoleHost(_method, _is_user_token, _token, _name, null, _port, _cuk, _extra);
									}else{

										cliutil.getConsoleInput('     Host(specify hostname or ip address)             : ', true, false, function(isbreak, target_host)
										{
											if(isbreak){
												process.exit(0);
											}
											if(!apiutil.isSafeString(target_host)){
												process.exit(0);
											}
											var	_target_host = target_host;

											// run
											postV1RoleHost(_method, _is_user_token, _token, _name, _target_host, _port, _cuk, _extra);
										});
									}
								});
							}else{
								console.log('flag must be null(empty) or string: ' + JSON.stringify(is_extra));
								process.exit(0);
							}
						});
					});
				});
			});
		});
	});
}

//
// Run
//
cliutil.getConsoleInput('Method(POST/PUT)                                      : ', true, false, function(isbreak, method)
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

	cliutil.getConsoleInput('Use API for Role or Host in Role(ROLE/HOST)           : ', true, false, function(isbreak, apitype)
	{
		if(isbreak){
			process.exit(0);
		}

		if(apiutil.compareCaseString('role', apitype)){
			inputRoleType(_method);

		}else if(apiutil.compareCaseString('host', apitype)){
			inputHostType(_method);

		}else{
			console.log('API type must be ROLE or HOST : ' + apitype);
			process.exit(0);
		}
	});
});

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
