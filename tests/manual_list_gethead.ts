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
function getV1ChildrenList(method: string, token: string, type: string, service?: string | null, path?: string | null, is_expand?: boolean): void
{
	let entrypath	= '/v1/list/';
	if(apiutil.isSafeString(service)){
		entrypath	+= service + '/';
	}
	entrypath		+= type;
	if(apiutil.isSafeString(path)){
		entrypath	+= '/' + path;
	}
	if(apiutil.isBoolean(is_expand)){
		const	keys	= r3keys();
		if(is_expand){
			entrypath	+= '?expand=' + keys.VALUE_TRUE;
		}else{
			entrypath	+= '?expand=' + keys.VALUE_FALSE;
		}
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
		'path': 				entrypath,
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
cliutil.getConsoleInput('Method(GET/HEAD)                   : ', true, false, function(isbreak: boolean, method?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}

	const _method = apiutil.getSafeString(method).toUpperCase();
	if(!apiutil.compareCaseString('get', _method) && !apiutil.compareCaseString('head', _method)){
		console.log('method must be GET or HEAD : ' + _method);
		process.exit(0);
	}

	cliutil.getConsoleInput('type(service/role/resource/policy) : ', true, false, function(isbreak: boolean, type?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		let _type: string;
		if(apiutil.compareCaseString('service', apiutil.getSafeString(type))){
			_type = 'service';
		}else if(apiutil.compareCaseString('role', apiutil.getSafeString(type))){
			_type = 'role';
		}else if(apiutil.compareCaseString('resource', apiutil.getSafeString(type))){
			_type = 'resource';
		}else if(apiutil.compareCaseString('policy', apiutil.getSafeString(type))){
			_type = 'policy';
		}else{
			console.log('type must be service / role / resource / policy : ' + type);
			process.exit(0);
		}

		cliutil.getConsoleInput('Scoped user token for tenant       : ', true, false, function(isbreak: boolean, token?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			if(!apiutil.isSafeString(token)){
				console.log('method must be specified token.');
				process.exit(0);
			}
			const _token = token;

			if(apiutil.compareCaseString('service', apiutil.getSafeString(_type))){
				//
				// service type, this is only listing service name.
				//
				getV1ChildrenList(_method, _token, _type, null);
				return;
			}

			cliutil.getConsoleInput('Service name(allow empty)          : ', true, false, function(isbreak: boolean, service?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _service = service;

				cliutil.getConsoleInput('path(allow empty)                  : ', true, false, function(isbreak: boolean, path?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					let _path: string | null;
					if(!apiutil.isString(path) || '' === apiutil.getSafeString(path) || apiutil.compareCaseString('null', apiutil.getSafeString(path))){
						_path = null;
					}else{
						_path = path;
					}

					if('policy' !== _type){
						// role/resource can expand.
						cliutil.getConsoleInput('expand(true/false(default))        : ', true, false, function(isbreak: boolean, is_expand?: string | null): void
						{
							if(isbreak){
								process.exit(0);
							}
							const	keys = r3keys();
							let		_is_expand: boolean;
							if(apiutil.isString(is_expand)){
								if('' === is_expand || apiutil.compareCaseString('null', apiutil.getSafeString(is_expand)) || apiutil.compareCaseString(keys.VALUE_FALSE, apiutil.getSafeString(is_expand))){
									_is_expand = false;
								}else if(apiutil.compareCaseString(keys.VALUE_TRUE, apiutil.getSafeString(is_expand))){
									_is_expand = true;
								}else{
									console.log('expand must be true or false or null(empty) : ' + is_expand);
									process.exit(0);
								}
							}else{
								console.log('expand must be true or false or null(empty) : ' + JSON.stringify(is_expand));
								process.exit(0);
							}

							// run
							getV1ChildrenList(_method, _token, _type, _service, _path, _is_expand);
						});
					}else{
						// run
						getV1ChildrenList(_method, _token, _type, _service, _path);
					}
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
