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

import	apiutil		from '../src/lib/k2hr3apiutil';
import	cliutil		from '../src/lib/k2hr3cliutil';
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
function rawPutPostV1Acr(method: string, tenant: string | null, token: string, service: string): void
{
	let	strbody		= '';
	let	urlarg		= '';
	if(apiutil.isSafeString(tenant)){
		if(apiutil.compareCaseString('POST', method)){
			const bodyObj = {
				tenant: tenant
			};
			strbody	= JSON.stringify(bodyObj);
		}else{
			urlarg	= encodeURI('?tenant=' + tenant);
		}
	}

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	strbody.length,
		'X-Auth-Token':		'U=' + token
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				'/v1/acr/' + service + urlarg,
		'method':				method,
		'headers':				headers,
		'rejectUnauthorized':	(is_https ? false : undefined),			// always insecure for this manual test
		'ca':					(is_https && null !== ca) ? (ca() ?? undefined) : undefined
	};
	r3logger.dlog('request options   = ' + JSON.stringify({ ...options, ca: options.ca ? '[Buffer]' : undefined }));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));
	r3logger.dlog('request body      = ' + apiutil.getSafeString(strbody));

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

	// write data to request body
	if(apiutil.compareCaseString('POST', method)){
		req.write(strbody);
	}

	req.end();
}

//
// Utility for inputting token for two pattern
//
// callback(error, tenant name(allow null), token string)
//
function rawInputToken(callback: (error: string | null, tenant?: string | null, token?: string) => void): void
{
	const _callback = callback;

	cliutil.getConsoleInput('Tenant name(allow empty)                          : ', true, false, function(isbreak: boolean, tenant?: string | null): void
	{
		if(isbreak){
			_callback('break for inputting tenant name');
			return;
		}
		const	_tenant = apiutil.isSafeString(tenant) ? tenant.toLowerCase() : null;
		let		_message: string;
		if(null === _tenant){
			_message = 'SCOPED user token                                 : ';
		}else{
			_message = 'UNSCOPED user token                               : ';
		}

		cliutil.getConsoleInput(_message, true, false, function(isbreak: boolean, token?: string | null): void
		{
			if(isbreak){
				_callback('break for inputting token');
				return;
			}
			if(!apiutil.isSafeString(token)){
				_callback('token must be string');
				return;
			}
			const _token = token;
			_callback(null, _tenant, _token);
		});
	});
}

//
// run
//
cliutil.getConsoleInput('Method(POST/PUT)                                  : ', true, false, function(isbreak: boolean, method?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}

	let _method: string;
	if(apiutil.compareCaseString('post', method)){
		_method	= 'POST';
	}else if(apiutil.compareCaseString('put', method)){
		_method	= 'PUT';
	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	cliutil.getConsoleInput('Create base service name                          : ', true, false, function(isbreak: boolean, service?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		if(!apiutil.isSafeString(service)){
			console.log('service must be service name.');
			process.exit(0);
		}
		const _service = service;

		rawInputToken(function(error: string | null, tenant?: string | null, token?: string): void
		{
			if(null !== error){
				console.log(error);
				process.exit(0);
			}
			const _tenant	= apiutil.isSafeString(tenant) ? tenant : null;
			const _token	= apiutil.getSafeString(token);

			//
			// run
			//
			rawPutPostV1Acr(_method, _tenant, _token, _service);
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
