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

import	* as http	from 'http';
import	* as https	from 'https';

import	apiutil				from '../src/lib/k2hr3apiutil';
import	cliutil				from '../src/lib/k2hr3cliutil';
import	r3logger			from '../src/lib/dbglogging';
import	{ ca }				from '../src/lib/cacerts';
import	{ getK2hr3Keys }	from '../src/lib/k2hr3keys';
import type	{ ClientRequest, IncomingMessage }	from 'http';

const	r3keys	= getK2hr3Keys;

//
// Hostname and port from env
//
const hostname	= apiutil.getSafeString(process.env.APIHOST);
const hostport	= apiutil.getSafeString(process.env.APIPORT);
const is_https	= apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function getV1Policy(token: string, name: string, service: string | null): void
{
	let urlarg = '';
	if(apiutil.isSafeString(service)){
		urlarg = encodeURI('?service=' + service);
	}

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		token
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				'/v1/policy/' + name + urlarg,
		'method':				'GET',
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

function headV1Policy(tenant: string | null, name: string, action: string, resource: string | null): void
{
	let	urlarg = '?resource=' + resource + '&action=' + action;
	if(apiutil.isSafeString(tenant)){
		urlarg += '&tenant=' + tenant;
	}

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				'/v1/policy/' + name + encodeURI(urlarg),
		'method':				'HEAD',
		'headers':				headers,
		'rejectUnauthorized':	(is_https ? false : undefined),			// always insecure for this manual test
		'ca':					(is_https && null !== ca) ? (ca() ?? undefined) : undefined
	};
	r3logger.dlog('request options   = ' + JSON.stringify({ ...options, ca: options.ca ? '[Buffer]' : undefined }));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));

	const	req: ClientRequest	= agent.request(options, (res: IncomingMessage): void =>
	{
		let response = '';
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
cliutil.getConsoleInput('Method(GET/HEAD)             : ', true, false, function(isbreak: boolean, method?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}

	const _method = apiutil.getSafeString(method);
	if(apiutil.compareCaseString('get', _method)){

		cliutil.getConsoleInput('Service name(allow empty)    : ', true, false, function(isbreak: boolean, service?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			const _service = apiutil.isSafeString(service) ? apiutil.getSafeString(service) : null;

			cliutil.getConsoleInput('Scoped user token for tenant : ', true, false, function(isbreak: boolean, token?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _token = apiutil.getSafeString(token);

				cliutil.getConsoleInput('Policy name                  : ', true, false, function(isbreak: boolean, name?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					const _name = apiutil.getSafeString(name);

					// run
					getV1Policy(_token, _name, _service);
				});
			});
		});

	}else if(apiutil.compareCaseString('head', _method)){
		cliutil.getConsoleInput('Tenant name(allow null)      : ', true, false, function(isbreak: boolean, tenant?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			let _tenant: string | null = null;
			if(!apiutil.isSafeString(tenant) || apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
				_tenant = null;
			}else{
				_tenant = tenant;
			}

			cliutil.getConsoleInput('Policy name                  : ', true, false, function(isbreak: boolean, name?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _name = apiutil.getSafeString(name);

				cliutil.getConsoleInput('Action(read/write)           : ', true, false, function(isbreak: boolean, action?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					const	keys	= r3keys();
					const	_action = apiutil.getSafeString(action);
					if(keys.VALUE_READ !== _action && keys.VALUE_WRITE !== _action){
						process.exit(0);
					}

					cliutil.getConsoleInput('Resource                     : ', true, false, function(isbreak: boolean, resource?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						let _resource: string | null;
						if(!apiutil.isSafeString(resource) || apiutil.compareCaseString('null', apiutil.getSafeString(resource))){
							_resource = null;
						}else{
							_resource = resource;
						}

						// run
						headV1Policy(_tenant, _name, _action, _resource);
					});
				});
			});
		});
	}else{
		console.log('method must be GET or HEAD : ' + _method);
		process.exit(0);
	}
});

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
