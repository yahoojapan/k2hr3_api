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

import	* as http	from 'http';
import	* as https	from 'https';

import	apiutil				from '../src/lib/k2hr3apiutil';
import	cliutil				from '../src/lib/k2hr3cliutil';
import	r3logger			from '../src/lib/dbglogging';
import	{ ca }				from '../src/lib/cacerts';
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
function rawGetHeadV1Service(method: string, token: string, service: string, tenant: string | null): void
{
	let basepath = '/v1/service/' + service;
	if(apiutil.compareCaseString('HEAD', method) && apiutil.isSafeString(tenant)){
		basepath += '?tenant=' + encodeURI(tenant);
	}

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		'U=' + token
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				basepath,
		'method':				method,
		'headers':				headers,
		'rejectUnauthorized':	(is_https ? false : undefined),			// always insecure for this manual test
		'ca':					(is_https && null !== ca) ? (ca() ?? undefined) : undefined
	};
	r3logger.dlog('request options   = ' + JSON.stringify({ ...options, ca: options.ca ? '[Buffer]' : undefined }));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));

	const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void =>
	{
		let	response = '';
		console.log('RESPONSE CODE = ' + res.statusCode);
		r3logger.dlog('response status   = ' + res.statusCode);
		r3logger.dlog('response header   = ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');

		res.on('data', function(chunk: string): void
		{
			r3logger.dlog('response chunk    = ' + chunk);
			response += chunk;
		});

		res.on('end', function(): void
		{
			r3logger.mlog(r3logger.dump(response));		// response is object(or not)
			console.log('RESPONSE BODY = ' + JSON.stringify(response));
			process.exit(0);
		});
	});

	req.on('error', function(err: Error): void
	{
		r3logger.elog('problem with request: ' + err.message);
	});

	req.end();
}

//
// run
//
cliutil.getConsoleInput('Method(GET/HEAD)                                         : ', true, false, function(isbreak: boolean, method?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}

	let _method: string;
	if(apiutil.compareCaseString('get', method)){
		_method	= 'GET';
	}else if(apiutil.compareCaseString('head', method)){
		_method	= 'HEAD';
	}else{
		console.log('method must be GET or HEAD : ' + method);
		process.exit(0);
	}

	cliutil.getConsoleInput('Scoped user token for service owner tenant               : ', true, false, function(isbreak: boolean, token?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		const _token = apiutil.getSafeString(token);

		cliutil.getConsoleInput('Service name                                             : ', true, false, function(isbreak: boolean, service?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			if(!apiutil.isSafeString(service)){
				console.log('must be service name.');
				process.exit(0);
			}
			const _service = apiutil.getSafeString(service);

			if(apiutil.compareCaseString('GET', _method)){
				//
				// run GET
				//
				rawGetHeadV1Service(_method, _token, _service, null);

			}else{
				cliutil.getConsoleInput('Check tenant name(empty(null)->check service exist)      : ', true, false, function(isbreak: boolean, tenant?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					let _tenant: string | null = null;
					if(apiutil.isSafeString(tenant)){
						_tenant = apiutil.getSafeString(tenant);
					}
					//
					// run HEAD
					//
					rawGetHeadV1Service(_method, _token, _service, _tenant);
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
