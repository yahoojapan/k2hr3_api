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
function deleteV1Tenant(token, name, id, remove_all)
{
	var	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		token
	};

	var	options;
	if(remove_all){
		options = {
			'host':				hostname,
			'port':				hostport,
			'path': 			'/v1/tenant' + encodeURI('?tenant=' + name) + '&' + encodeURI('id=' + id),
			'method':			'DELETE',
			'headers':			headers
		};
	}else{
		options = {
			'host':				hostname,
			'port':				hostport,
			'path': 			'/v1/tenant/' + name + encodeURI('?id=' + id),
			'method':			'DELETE',
			'headers':			headers
		};
	}

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
cliutil.getConsoleInput('Unscoped(or Scoped) user token       : ', true, false, function(isbreak, token)
{
	if(isbreak){
		process.exit(0);
	}
	var	_token = token;

	cliutil.getConsoleInput('Tenant name                          : ', true, false, function(isbreak, tenant)
	{
		if(isbreak){
			process.exit(0);
		}

		if(!apiutil.isSafeString(tenant)){
			console.log('method DELETE must specify tenant name');
			process.exit(0);
		}
		var	_tenant = apiutil.getSafeString(tenant);

		cliutil.getConsoleInput('Tenant id                            : ', true, false, function(isbreak, id)
		{
			if(isbreak){
				process.exit(0);
			}

			if(!apiutil.isSafeString(id)){
				console.log('method DELETE must specify tenant id');
				process.exit(0);
			}
			var	_id = apiutil.getSafeString(id);

			cliutil.getConsoleInput('Remove tenant(yes/no(default))       : ', true, false, function(isbreak, remove_all)
			{
				if(isbreak){
					process.exit(0);
				}

				var	_remove_all;
				if(!apiutil.isSafeString(remove_all) || 'no' == remove_all || 'n' == remove_all){
					_remove_all = false;
				}else if('yes' == remove_all || 'y' == remove_all){
					_remove_all = true;

					if(0 !== _tenant.indexOf('local@')){
						console.log('Need tenant name started with local@ for remove it.');
						process.exit(0);
					}
				}else{
					console.log('input must be yes or no(null)');
					process.exit(0);
				}

				//
				// Run
				//
				deleteV1Tenant(_token, _tenant, _id, _remove_all);
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
