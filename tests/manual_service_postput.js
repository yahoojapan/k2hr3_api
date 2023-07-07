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
function rawPutPostV1Service(method, token, service, is_create, verify, is_verify_url, tenant)
{
	var	basepath	= '/v1/service';							// Create service	= '/v1/service'
	if(!is_create){
		basepath	+= '/' + service;							// Update			= '/v1/service/<service name>'
	}

	var	strbody		= null;
	if(apiutil.compareCaseString('POST', method)){
		// post
		var	body	= {};
		if(is_create){
			// create service
			body.name = service;
			if(is_verify_url){
				if(apiutil.isSafeString(verify)){
					body.verify = verify;
				}
			}else{
				if(!apiutil.isSafeString(verify)){
					verify = null;
				}
				body.verify = JSON.stringify(verify);
			}
		}else{
			// add tenant or update verify url
			if(apiutil.isSafeString(tenant)){
				body.tenant = tenant;
			}else{
				if(is_verify_url){
					if(apiutil.isSafeString(verify)){
						body.verify = verify;
					}
				}else{
					if(!apiutil.isSafeString(verify)){
						verify = null;
					}
					body.verify = JSON.stringify(verify);
				}
			}
		}
		strbody = JSON.stringify(body);
	}else{
		// put
		if(is_create){
			// create service
			basepath += '?name=' + encodeURI(service);
			if(is_verify_url){
				if(apiutil.isSafeString(verify)){
					basepath += '&verify=' + encodeURI(verify);
				}
			}else{
				if(!apiutil.isSafeString(verify)){
					verify = null;
				}
				basepath += '&verify=' + encodeURI(JSON.stringify(verify));
			}
		}else{
			// add tenant or update verify url
			if(apiutil.isSafeString(tenant)){
				basepath += '?tenant=' + encodeURI(tenant);
			}else{
				if(is_verify_url){
					if(apiutil.isSafeString(verify)){
						basepath += '?verify=' + encodeURI(verify);
					}
				}else{
					if(!apiutil.isSafeString(verify)){
						verify = null;
					}
					basepath += '?verify=' + encodeURI(JSON.stringify(verify));
				}
			}
		}
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'X-Auth-Token':		'U=' + token
					  };
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			basepath,
						'method':			method
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	if(apiutil.compareCaseString('POST', method)){
		headers['Content-Length']	= strbody.length;
	}
	options.headers					= headers;

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
	if(null !== strbody){
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

	cliutil.getConsoleInput('Scoped user token for service owner tenant               : ', true, false, function(isbreak, token)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_token = token;

		cliutil.getConsoleInput('Create service( yes(y)-default / no(n) )                 : ', true, false, function(isbreak, is_create_yes)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_is_create = true;
			if(apiutil.compareCaseString('no', is_create_yes) || apiutil.compareCaseString('n', is_create_yes)){
				_is_create = false;
			}

			if(_is_create){
				// type: create service
				cliutil.getConsoleInput('Create service name                                      : ', true, false, function(isbreak, service)
				{
					if(isbreak){
						process.exit(0);
					}
					if(!apiutil.isSafeString(service)){
						console.log('service must be service name.');
						process.exit(0);
					}
					var	_service = service;

					cliutil.getConsoleInput('Verify URL(allow empty)                                  : ', true, false, function(isbreak, verify)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_verify			= null;
						var	_is_verify_url	= false;
						if(!apiutil.isSafeString(verify)){
							_verify			= null;
							_is_verify_url	= false;
						}else if(apiutil.isSafeUrl(verify)){
							_verify			= verify;
							_is_verify_url	= true;
						}else if(apiutil.checkSimpleJSON(verify)){
							_verify			= JSON.parse(verify);
							_is_verify_url	= false;
						}else{
							_verify			= verify;
							_is_verify_url	= false;
						}

						//
						// run (create service)
						//
						rawPutPostV1Service(_method, _token, _service, _is_create, _verify, _is_verify_url, null);
					});
				});

			}else{
				// type: update service
				cliutil.getConsoleInput('Update service name                                      : ', true, false, function(isbreak, service)
				{
					if(isbreak){
						process.exit(0);
					}
					if(!apiutil.isSafeString(service)){
						console.log('service must be service name.');
						process.exit(0);
					}
					var	_service = service;

					cliutil.getConsoleInput('Add tenant(TENANT) or Update verify URL(VERIFY)          : ', true, false, function(isbreak, update_type)
					{
						if(isbreak){
							process.exit(0);
						}
						if(apiutil.compareCaseString('tenant', update_type)){
							// add tenant
							cliutil.getConsoleInput('Add tenant name                                          : ', true, false, function(isbreak, tenant)
							{
								if(isbreak){
									process.exit(0);
								}
								if(!apiutil.isSafeString(tenant)){
									console.log('method must be tenant name.');
									process.exit(0);
								}
								var	_tenant = tenant;

								//
								// run (add tenant)
								//
								rawPutPostV1Service(_method, _token, _service, _is_create, null, false, _tenant);
							});

						}else if(apiutil.compareCaseString('verify', update_type)){
							// update verify
							cliutil.getConsoleInput('Update verify url(allow null, object, url)               : ', true, false, function(isbreak, verify)
							{
								if(isbreak){
									process.exit(0);
								}
								var	_verify			= null;
								var	_is_verify_url	= false;
								if(!apiutil.isSafeString(verify)){
									_verify			= null;
									_is_verify_url	= false;
								}else if(apiutil.isSafeUrl(verify)){
									_verify			= verify;
									_is_verify_url	= true;
								}else if(apiutil.checkSimpleJSON(verify)){
									_verify			= JSON.parse(verify);
									_is_verify_url	= false;
								}else{
									_verify			= verify;
									_is_verify_url	= false;
								}

								//
								// run (update verify)
								//
								rawPutPostV1Service(_method, _token, _service, _is_create, _verify, _is_verify_url, null);
							});

						}else{
							console.log('Update must be TENANT or VERIFY.');
							process.exit(0);
						}

					});
				});
			}
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
