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

import	* as http	from 'http';
import	* as https	from 'https';

import	apiutil		from '../src/lib/k2hr3apiutil';
import	cliutil		from '../src/lib/k2hr3cliutil';
import	cryptutil	from '../src/lib/k2hr3cryptutil';
import	r3logger	from '../src/lib/dbglogging';
import	{ ca }		from '../src/lib/cacerts';
import type	{ ClientRequest, IncomingMessage }	from 'http';

//
// Hostname and port from env
//
const hostname	= apiutil.getSafeString(process.env.APIHOST);
const hostport	= apiutil.getSafeString(process.env.APIPORT);
const is_https	= apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function getV1ExtData(uri: string, path: string, ua: string, is_gzip: boolean): void
{
	const	_is_gzip= is_gzip;
	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':			'application/octet-stream',
		'User-Agent':			(apiutil.isSafeString(ua) ? ua : undefined),
		'Accept-Encoding':		(is_gzip ? 'gzip' : undefined)
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				'/v1/extdata/' + uri + '/' + path,
		'method':				'GET',
		'headers':				headers,
		'rejectUnauthorized':	(is_https ? false : undefined),			// always insecure for this manual test
		'ca':					(is_https && null !== ca) ? (ca() ?? undefined) : undefined
	};
	r3logger.dlog('request options   = ' + JSON.stringify({ ...options, ca: options.ca ? '[Buffer]' : undefined }));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));

	const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void =>
	{
		let		resString: string	= '';
		const	resArray: Buffer[]	= [];

		console.log('RESPONSE CODE = ' + res.statusCode);
		r3logger.dlog('response status   = ' + res.statusCode);
		r3logger.dlog('response header   = ' + JSON.stringify(res.headers));

		if(!_is_gzip){
			res.setEncoding('utf8');
		}

		res.on('data', function(chunk: Buffer | string): void
		{
			if(_is_gzip){
				resArray.push(chunk as Buffer);
			}else if(apiutil.isSafeString(chunk)){
				r3logger.dlog('response chunk    = ' + chunk);
				resString += chunk;
			}
		});

		res.on('end', function(): void
		{
			if(_is_gzip){
				// Buffer
				const	buffer = Buffer.concat(resArray);
				r3logger.mlog(r3logger.dump(buffer));		// response is object(or not)

				const	gunzipString = cryptutil.r3Gunzip(buffer);
				console.log('RESPONSE BODY(GUNZIP) = <<<\n' + gunzipString + '\n<<<');
			}else{
				// Text
				r3logger.mlog(r3logger.dump(resString));	// response is object(or not)
				console.log('RESPONSE BODY = ' + resString);
			}
			process.exit(0);
		});
	});

	req.on('error', function(err: Error): void {
		r3logger.elog('problem with request: ' + err.message);
	});

	req.end();
}

cliutil.getConsoleInput('extdata uri (/v1/extdata/<uri>/<path>)  : ', true, false, function(isbreak: boolean, uri?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}
	const _uri = uri;

	if(!apiutil.isSafeString(_uri)){
		process.exit(0);
	}

	cliutil.getConsoleInput('extdata path (/v1/extdata/<uri>/<path>) : ', true, false, function(isbreak: boolean, path?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		const _path = path;

		if(!apiutil.isSafeString(_path)){
			process.exit(0);
		}

		cliutil.getConsoleInput('User-Agent (allowed empty)              : ', true, false, function(isbreak: boolean, ua?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			const _ua = apiutil.getSafeString(ua);

			cliutil.getConsoleInput('Response Type (gzip or text(default))   : ', true, false, function(isbreak: boolean, type?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const	_type		= type;
				let		_is_gzip	= false;

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
