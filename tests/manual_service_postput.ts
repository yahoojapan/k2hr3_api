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
import type	{ valTypeAll }	from '../src/lib/types';
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
function rawPutPostV1Service(method: string, token: string, service: string, is_create: boolean, verify: valTypeAll, is_verify_url: boolean, tenant: string | null): void
{
	let strbody		= '';
	let	clength		= 0;
	let basepath	= '/v1/service';						// Create service	= '/v1/service'
	if(!is_create){
		basepath	+= '/' + service;						// Update			= '/v1/service/<service name>'
	}

	if(apiutil.compareCaseString('POST', method)){
		// post
		if(is_create){
			// create service
			let	tmpVerify: string = '';
			if(is_verify_url){
				if(apiutil.isSafeString(verify)){
					tmpVerify = verify;
				}
			}else{
				if(!apiutil.isSafeString(verify)){
					verify = null;
				}
				tmpVerify = JSON.stringify(verify);
			}
			const	body = {
				name:	service,
				verify:	tmpVerify
			};
			strbody = JSON.stringify(body);

		}else{
			// add tenant or update verify url
			let	tmpVerify: string = '';
			if(!apiutil.isSafeString(tenant)){
				if(is_verify_url){
					if(apiutil.isSafeString(verify)){
						tmpVerify = verify;
					}
				}else{
					if(!apiutil.isSafeString(verify)){
						verify = null;
					}
					tmpVerify = JSON.stringify(verify);
				}
			}
			const	body = {
				tenant:	apiutil.isSafeString(tenant) ? tenant : undefined,
				verify:	tmpVerify
			};
			strbody = JSON.stringify(body);
		}
		clength = strbody.length;

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

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	clength,
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
	if(null !== strbody){
		req.write(strbody);
	}

	req.end();
}

//
// run
//
cliutil.getConsoleInput('Method(POST/PUT)                                         : ', true, false, function(isbreak: boolean, method?: string | null): void
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

	cliutil.getConsoleInput('Scoped user token for service owner tenant               : ', true, false, function(isbreak: boolean, token?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		const _token = apiutil.getSafeString(token);

		cliutil.getConsoleInput('Create service( yes(y)-default / no(n) )                 : ', true, false, function(isbreak: boolean, is_create_yes?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			let _is_create = true;
			if(apiutil.compareCaseString('no', is_create_yes) || apiutil.compareCaseString('n', is_create_yes)){
				_is_create = false;
			}

			if(_is_create){
				// type: create service
				cliutil.getConsoleInput('Create service name                                      : ', true, false, function(isbreak: boolean, service?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					if(!apiutil.isSafeString(service)){
						console.log('service must be service name.');
						process.exit(0);
					}
					const _service = apiutil.getSafeString(service);

					cliutil.getConsoleInput('Verify URL(allow empty)                                  : ', true, false, function(isbreak: boolean, verify?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						let _verify: valTypeAll;
						let _is_verify_url: boolean;
						if(!apiutil.isSafeString(verify)){
							_verify			= null;
							_is_verify_url	= false;
						}else if(apiutil.isSafeUrl(verify)){
							_verify			= verify;
							_is_verify_url	= true;
						}else if(apiutil.checkSimpleJSON(verify)){
							_verify			= apiutil.parseJSON(verify);
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
				cliutil.getConsoleInput('Update service name                                      : ', true, false, function(isbreak: boolean, service?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					if(!apiutil.isSafeString(service)){
						console.log('service must be service name.');
						process.exit(0);
					}
					const _service = apiutil.getSafeString(service);

					cliutil.getConsoleInput('Add tenant(TENANT) or Update verify URL(VERIFY)          : ', true, false, function(isbreak: boolean, update_type?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						if(apiutil.compareCaseString('tenant', update_type)){
							// add tenant
							cliutil.getConsoleInput('Add tenant name                                          : ', true, false, function(isbreak: boolean, tenant?: string | null): void
							{
								if(isbreak){
									process.exit(0);
								}
								if(!apiutil.isSafeString(tenant)){
									console.log('method must be tenant name.');
									process.exit(0);
								}
								const _tenant = apiutil.getSafeString(tenant);

								//
								// run (add tenant)
								//
								rawPutPostV1Service(_method, _token, _service, _is_create, null, false, _tenant);
							});

						}else if(apiutil.compareCaseString('verify', update_type)){
							// update verify
							cliutil.getConsoleInput('Update verify url(allow null, object, url)               : ', true, false, function(isbreak: boolean, verify?: string | null): void
							{
								if(isbreak){
									process.exit(0);
								}
								let _verify: valTypeAll;
								let _is_verify_url: boolean;
								if(!apiutil.isSafeString(verify)){
									_verify			= null;
									_is_verify_url	= false;
								}else if(apiutil.isSafeUrl(verify)){
									_verify			= verify;
									_is_verify_url	= true;
								}else if(apiutil.checkSimpleJSON(verify)){
									_verify			= apiutil.parseJSON(verify);
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
