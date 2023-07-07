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
function postputV1Tenant(method, token, is_create, name, desc, display, users, id)
{
	var	strbody	= '';
	var	headers	= {
		'Content-Type':		'application/json',
		'X-Auth-Token':		token
	};
	var	options	= {
		'host':				hostname,
		'port':				hostport,
		'path': 			'/v1/tenant',
		'method':			method
	};

	var	path;
	if(apiutil.compareCaseString('post', method)){
		var	body;
		if(is_create){
			body = {
				'tenant': {
					'name':			name,
					'desc':			desc,
					'display':		display,
					'users':		users
				}
			};
			path = '/v1/tenant';
		}else{
			body = {
				'tenant': {
					'id':			id,
					'desc':			desc,
					'display':		display,
					'users':		users,
				}
			};
			path = '/v1/tenant/' + name;
		}

		strbody						= JSON.stringify(body);
		headers['Content-Length']	= strbody.length;
		options.headers				= headers;
		options.path				= path;

	}else if(apiutil.compareCaseString('put', method)){
		var urlarg		= '';
		var	already_set	= false;

		if(is_create){
			path		= '/v1/tenant';
			urlarg		= '?name=' + name;
			already_set	= true;
		}else{
			urlarg		= '?id=' + id;
			path		= '/v1/tenant/' + name;
		}
		if('' === desc || apiutil.isSafeString(desc)){
			urlarg		+= already_set ? '&desc=' : '?desc=';
			urlarg		+= desc;
			already_set	= true;
		}
		if('' === display || apiutil.isSafeString(display)){
			urlarg		+= already_set ? '&display=' : '?display=';
			urlarg		+= display;
			already_set	= true;
		}
		if(!apiutil.isEmptyArray(users)){
			urlarg		+= already_set ? '&users=' : '?users=';
			urlarg		+= JSON.stringify(users);
			already_set	= true;
		}

		headers['Content-Length']	= 0;
		options.headers				= headers;
		options.path				= path + encodeURI(urlarg);

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
	if('' !== strbody){
		req.write(strbody);
	}
	req.end();
}

//
// run
//
cliutil.getConsoleInput('Method(POST/PUT)                                         : ', true, false, function(isbreak, method)
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

	cliutil.getConsoleInput('Unscoped(or Scoped) user token                           : ', true, false, function(isbreak, token)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_token = token;

		cliutil.getConsoleInput('Create or Update tenant(create(default)/update)          : ', true, false, function(isbreak, mode)
		{
			if(isbreak){
				process.exit(0);
			}

			var	_is_create;
			if('' === apiutil.getSafeString(mode) || apiutil.compareCaseString('null', apiutil.getSafeString(mode))){
				_is_create = true;
			}else if(apiutil.compareCaseString('create', apiutil.getSafeString(mode))){
				_is_create = true;
			}else if(apiutil.compareCaseString('update', apiutil.getSafeString(mode))){
				_is_create = false;
			}else{
				console.log('function mode must be empty or create or update : ' + mode);
				process.exit(0);
			}

			cliutil.getConsoleInput('tenant name(if not specify, add prefix local@)           : ', true, false, function(isbreak, name)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_name = name;

				cliutil.getConsoleInput('tenant description(allow null)                           : ', true, false, function(isbreak, desc)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_desc = desc;

					cliutil.getConsoleInput('tenant display name(allow null)                          : ', true, false, function(isbreak, display)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_display = display;

						cliutil.getConsoleInput('tenant users(input user name separate with ,)            : ', true, false, function(isbreak, users)
						{
							if(isbreak){
								process.exit(0);
							}

							var	_users = Array();
							var	tmparr = apiutil.getSafeString(users).split(',');
							for(var cnt = 0; cnt < tmparr.length; ++cnt){
								var	tmpstr = apiutil.getSafeString(tmparr[cnt].trim());
								if('' !== tmpstr){
									_users.push(tmpstr);
								}
							}
							if(apiutil.isEmptyArray(_users)){
								_users = null;
							}

							if(_is_create){
								//
								// Create mode
								//
								postputV1Tenant(_method, _token, _is_create, _name, _desc, _display, _users, null);

							}else{
								//								// Update mode
								//
								cliutil.getConsoleInput('tenant id                                                : ', true, false, function(isbreak, id)
								{
									if(isbreak){
										process.exit(0);
									}
									var	_id = id;

									// run
									postputV1Tenant(_method, _token, _is_create, _name, _desc, _display, _users, _id);
								});
							}
						});
					});
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
