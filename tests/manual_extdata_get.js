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
 * CREATE:   Mon May 18 2020
 * REVISION:
 *
 */

'use strict';

var	http		= require('http');
var	https		= require('https');

var	cacerts		= require('../lib/cacerts');
var	apiutil		= require('../lib/k2hr3apiutil');
var cliutil		= require('../lib/k2hr3cliutil');
var	cryptutil	= require('../lib/k2hr3cryptutil');

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
function getV1ExtData(uri, path, ua, is_gzip)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers				= {};
	var	typehead			= 'Content-Type';
	var	uahead				= 'User-Agent';
	var	gziphead			= 'Accept-Encoding';

	headers[typehead]		= 'application/octet-stream';
	if(apiutil.isSafeString(ua)){
		headers[uahead]		= ua;
	}
	if(is_gzip){
		headers[gziphead]	= 'gzip';
	}
	var	options				= {	'host':				hostname,
								'port':				hostport,
								'method':			'GET'
							  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	options.headers	= headers;
	options.path	= '/v1/extdata/' + uri + '/' + path;

	r3logger.dlog('request options   = ' + JSON.stringify(options));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));

	var _is_gzip = is_gzip;
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
		var	response;

		console.log('RESPONSE CODE = ' + res.statusCode);
		r3logger.dlog('response status   = ' + res.statusCode);
		r3logger.dlog('response header   = ' + JSON.stringify(res.headers));

		if(_is_gzip){
			response = [];
		}else{
			res.setEncoding('utf8');
			response = '';
		}

		res.on('data', function(chunk)
		{
			if(_is_gzip){
				response.push(chunk);
			}else{
				r3logger.dlog('response chunk    = ' + chunk);
				response += chunk;
			}
		});

		res.on('end', function(result)					// eslint-disable-line no-unused-vars
		{
			if(_is_gzip){
				// Buffer
				var	buffer = Buffer.concat(response);
				r3logger.mlog(r3logger.dump(buffer));	// response is object(or not)

				var	gunzipString= cryptutil.r3Gunzip(buffer);
				console.log('RESPONSE BODY(GUNZIP) = <<<\n' + gunzipString + '\n<<<');
			}else{
				// Text
				r3logger.mlog(r3logger.dump(response));	// response is object(or not)
				console.log('RESPONSE BODY = ' + response);
			}
			process.exit(0);
		});
	});
	req.on('error', function(e) {
		r3logger.elog('problem with request: ' + e.message);
	});
	req.end();
}

cliutil.getConsoleInput('extdata uri (/v1/extdata/<uri>/<path>)  : ', true, false, function(isbreak, uri)
{
	if(isbreak){
		process.exit(0);
	}
	var	_uri = uri;

	if(!apiutil.isSafeString(_uri)){
		process.exit(0);
	}

	cliutil.getConsoleInput('extdata path (/v1/extdata/<uri>/<path>) : ', true, false, function(isbreak, path)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_path = path;

		if(!apiutil.isSafeString(_path)){
			process.exit(0);
		}

		cliutil.getConsoleInput('User-Agent (allowed empty)              : ', true, false, function(isbreak, ua)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_ua	= apiutil.getSafeString(ua);

			cliutil.getConsoleInput('Response Type (gzip or text(default))   : ', true, false, function(isbreak, type)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_type	= type;
				var	_is_gzip= false;

				if('' === apiutil.getSafeString(_type) || apiutil.compareCaseString('text', apiutil.getSafeString(_type))){
					_is_gzip = false;
				}else if(apiutil.compareCaseString('gzip', apiutil.getSafeString(_type))){
					_is_gzip = true;
				}else{
					process.exit(0);
				}

				// run
				getV1ExtData(_uri, _path, _ua, _is_gzip);
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
