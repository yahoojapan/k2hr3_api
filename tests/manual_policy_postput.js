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
var	is_https = apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function postV1Policy(method, token, name, effect, action, resource, alias)
{
	var	strbody = '';
	var	headers = {
		'Content-Type':		'application/json',
		'X-Auth-Token':		token
	};
	var	options = {
		'host':				hostname,
		'port':				hostport,
		'path': 			'/v1/policy',
		'method':			method
	};

	if(apiutil.compareCaseString('post', method)){
		var	body = {
			'policy': {
				'name':			name,
				'effect':		effect,
				'action':		action,
				'resource':		resource,
				'condition':	null,
				'alias':		alias
			}
		};

		strbody						= JSON.stringify(body);
		headers['Content-Length']	= strbody.length;
		options.headers				= headers;
		options.path				= '/v1/policy';

	}else if(apiutil.compareCaseString('put', method)){
		var urlarg		= '';
		var	already_set	= false;
		if('' === name || apiutil.isSafeString(name)){
			urlarg		+= already_set ? '&name=' : '?name=';
			urlarg		+= name;
			already_set	= true;
		}
		if('' === effect || apiutil.isSafeString(effect)){
			urlarg		+= already_set ? '&effect=' : '?effect=';
			urlarg		+= effect;
			already_set	= true;
		}
		if('' === action || apiutil.isSafeString(action)){
			urlarg		+= already_set ? '&action=' : '?action=';
			urlarg		+= action;
			already_set	= true;
		}
		if('' === resource || apiutil.isSafeString(resource)){
			urlarg		+= already_set ? '&resource=' : '?resource=';
			urlarg		+= resource;
			already_set	= true;
		}
		//if('' === condition || apiutil.isSafeString(condition)){
		//	urlarg		+= already_set ? '&condition=' : '?condition=';
		//	urlarg		+= condition;
		//	already_set	= true;
		//}
		if('' === alias || apiutil.isSafeString(alias)){
			urlarg		+= already_set ? '&alias=' : '?alias=';
			urlarg		+= alias;
			already_set	= true;
		}

		headers['Content-Length']	= 0;
		options.headers				= headers;
		options.path				= '/v1/policy' + encodeURI(urlarg);

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

	cliutil.getConsoleInput('Scoped user token for tenant                             : ', true, false, function(isbreak, token)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_token = token;

		cliutil.getConsoleInput('Policy name                                              : ', true, false, function(isbreak, name)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_name = name;

			cliutil.getConsoleInput('       effect(null/allow/deny)                           : ', true, false, function(isbreak, effect)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_effect;
				if('' === apiutil.getSafeString(effect) || apiutil.compareCaseString('null', apiutil.getSafeString(effect))){
					_effect = null;
				}else if(apiutil.compareCaseString('allow', apiutil.getSafeString(effect))){
					_effect = 'allow';
				}else if(apiutil.compareCaseString('deny', apiutil.getSafeString(effect))){
					_effect = 'deny';
				}else{
					console.log('effect must be empty or null or allow or deny : ' + effect);
					process.exit(0);
				}

				cliutil.getConsoleInput('       action(specify null/read/write multiple with \',\') : ', true, false, function(isbreak, action)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_action;
					if('' === apiutil.getSafeString(action) || apiutil.compareCaseString('null', apiutil.getSafeString(action))){
						_action = null;
					}else{
						// parse ','
						var	keys	= r3keys();							// do not need user/tenant
						_action		= new Array(0);
						var	strarray= action.split(',');
						for(var cnt = 0; cnt < strarray.length; ++cnt){
							var	strtmp = strarray[cnt].trim();
							if(apiutil.compareCaseString(keys.VALUE_READ, apiutil.getSafeString(strtmp))){
								_action.push(keys.ACTION_READ_KEY);
							}else if(apiutil.compareCaseString(keys.VALUE_WRITE, apiutil.getSafeString(strtmp))){
								_action.push(keys.ACTION_WRITE_KEY);
							}else{
								console.log('action must be empty or null or array(read / write) : ' + action);
								process.exit(0);
							}
						}
					}

					cliutil.getConsoleInput('       resource(specify null/yrn multiple with \',\')      : ', true, false, function(isbreak, resource)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_resource;
						if('' === apiutil.getSafeString(resource) || apiutil.compareCaseString('null', apiutil.getSafeString(resource))){
							_resource = null;
						}else{
							// parse ','
							_resource		= new Array(0);
							var	strarray= resource.split(',');
							for(var cnt = 0; cnt < strarray.length; ++cnt){
								var	strtmp = strarray[cnt].trim();
								_resource.push(strtmp);
							}
						}

						cliutil.getConsoleInput('       alias(specify null/yrn multiple with \',\')         : ', true, false, function(isbreak, alias)
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
							postV1Policy(_method, _token, _name, _effect, _action, _resource, _alias);
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
