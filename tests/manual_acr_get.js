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
function rawGetV1Acr(token, service, inputdata)
{
	var	urlarg	= '';
	if(apiutil.isSafeEntity(inputdata)){
		urlarg += '?crole='		+ inputdata.client_role;
		urlarg += '&cip='		+ inputdata.client_ip;
		urlarg += '&srole='		+ inputdata.service_role;
		if(apiutil.isSafeEntity(inputdata.client_port)){
			urlarg += '&cport='	+ inputdata.client_port;
		}
		if(apiutil.isSafeEntity(inputdata.service_port)){
			urlarg += '&sport='	+ inputdata.service_port;
		}
		if(apiutil.isSafeEntity(inputdata.client_cuk)){
			urlarg += '&ccuk='	+ inputdata.client_cuk;
		}
		if(apiutil.isSafeEntity(inputdata.service_cuk)){
			urlarg += '&scuk='	+ inputdata.service_cuk;
		}
		urlarg = encodeURI(urlarg);
	}

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json'
					  };
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			'/v1/acr/' + service + urlarg,
						'method':			'GET'
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token']	= token;
	}
	options.headers				= headers;

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
// Utility
//
function rawGetParametersForGetResourceType(callback)
{
	var	result	= {
		client_role:	null,
		client_ip:		null,
		client_port:	null,
		client_cuk:		null,
		service_role:	null,
		service_port:	null,
		service_cuk:	null
	};
	var	_callback = callback;

	cliutil.getConsoleInput('  Client Role(full yrn path)                      : ', true, false, function(isbreak, crole)
	{
		if(isbreak){
			_callback('break input');
			return;
		}
		if(!apiutil.isSafeString(crole)){
			_callback('Input data must be not empty.');
			return;
		}
		result.client_role	= crole;

		cliutil.getConsoleInput('  Client IP Address                               : ', true, false, function(isbreak, cip)
		{
			if(isbreak){
				_callback('break input');
				return;
			}
			if(!apiutil.isSafeString(cip)){
				_callback('Input data must be not empty.');
				return;
			}
			result.client_ip	= cip;

			cliutil.getConsoleInput('  Client Port(allow empty)                        : ', true, false, function(isbreak, cport)
			{
				if(isbreak){
					_callback('break input');
					return;
				}
				if(apiutil.isSafeString(cport)){
					result.client_port	= cport;
				}

				cliutil.getConsoleInput('  Client CUK string(allow empty)                  : ', true, false, function(isbreak, ccuk)
				{
					if(isbreak){
						_callback('break input');
						return;
					}
					if(apiutil.isSafeString(ccuk)){
						result.client_cuk	= ccuk;
					}

					cliutil.getConsoleInput('  Service Role(full yrn path)                     : ', true, false, function(isbreak, srole)
					{
						if(isbreak){
							_callback('break input');
							return;
						}
						if(!apiutil.isSafeString(srole)){
							_callback('Input data must be not empty.');
							return;
						}
						result.service_role	= srole;

						cliutil.getConsoleInput('  Service Port(allow empty)                       : ', true, false, function(isbreak, sport)
						{
							if(isbreak){
								_callback('break input');
								return;
							}
							if(apiutil.isSafeString(sport)){
								result.service_port	= sport;
							}

							cliutil.getConsoleInput('  Service CUK string(allow empty)                 : ', true, false, function(isbreak, scuk)
							{
								if(isbreak){
									_callback('break input');
									return;
								}
								if(apiutil.isSafeString(scuk)){
									result.service_cuk	= scuk;
								}
								_callback(null, result);
							});
						});
					});
				});
			});
		});
	});
}

//
// run
//
cliutil.getConsoleInput('Service name                                      : ', true, false, function(isbreak, service)
{
	if(isbreak){
		process.exit(0);
	}
	if(!apiutil.isSafeString(service)){
		console.log('must be service name.');
		process.exit(0);
	}
	var	_service = service;

	cliutil.getConsoleInput('Type(TOKEN=token info, RESOURCE=get resource)     : ', true, false, function(isbreak, type)
	{
		if(isbreak){
			process.exit(0);
		}
		if(apiutil.compareCaseString('TOKEN', type)){
			//
			// type: token information
			//
			cliutil.getConsoleInput('User scoped token                                 : ', true, false, function(isbreak, token)
			{
				if(isbreak){
					process.exit(0);
				}
				if(!apiutil.isSafeString(token)){
					console.log('token must be not empty.');
					process.exit(0);
				}
				var	_token = 'U=' + token;

				//
				// run GET for getting token information
				//
				rawGetV1Acr(_token, _service, null);
			});

		}else if(apiutil.compareCaseString('RESOURCE', type)){
			//
			// type: getting resource
			//
			rawGetParametersForGetResourceType(function(error, inputdata)
			{
				if(null !== error){
					console.log(error);
					process.exit(0);
				}

				//
				// run GET for getting resources
				//
				rawGetV1Acr(null, _service, inputdata);
			});
		}else{
			console.log('type must be TOKEN or RESOURCE.');
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
