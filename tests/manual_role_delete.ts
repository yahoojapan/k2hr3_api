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
function deleteV1Role(token: string | null, name: string, target_host?: string | null, port?: number | null, cuk?: string | null): void
{
	let urlarg		= '';
	let already_set	= false;
	if(apiutil.isSafeString(target_host)){
		urlarg		+= already_set ? '&host=' : '?host=';
		urlarg		+= target_host;
		already_set	= true;
	}
	if(apiutil.isSafeNumber(port)){
		urlarg		+= already_set ? '&port=' : '?port=';
		urlarg		+= String(port);
	}
	if(apiutil.isSafeString(cuk)){
		urlarg		+= already_set ? '&cuk=' : '?cuk=';
		urlarg		+= cuk;
		already_set	= true;
	}
	r3logger.dlog('set parameters : ' + JSON.stringify(already_set));

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		(apiutil.isSafeString(token) ? token : undefined)
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				'/v1/role/' + name + encodeURI(urlarg),
		'method':				'DELETE',
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
// Request API for test
//
function deleteV1_IPByCuk(addrs: string[] | string | null, port: number | null, cuk: string | null): void
{
	let urlarg		= '';
	let already_set	= false;
	if(apiutil.isSafeEntity(addrs)){
		urlarg		+= already_set ? '&host=' : '?host=';
		if(apiutil.isStringArray(addrs)){
			urlarg	+= JSON.stringify(addrs);
		}else{
			urlarg	+= addrs;
		}
		already_set	= true;
	}
	if(apiutil.isSafeString(cuk)){
		urlarg		+= already_set ? '&cuk=' : '?cuk=';
		urlarg		+= cuk;
		already_set	= true;
	}
	if(apiutil.isSafeNumber(port)){
		urlarg		+= already_set ? '&port=' : '?port=';
		urlarg		+= String(port);
		already_set	= true;
	}
	r3logger.dlog('set parameters : ' + JSON.stringify(already_set));

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				'/v1/role' + encodeURI(urlarg),
		'method':				'DELETE',
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
cliutil.getConsoleInput('Delete ROLE/TOKEN(role)/HOST(name or ip)/IP/CUK : ', true, false, function(isbreak: boolean, type?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}
	if(apiutil.isSafeString(type)){
		console.log('token type must be USER or ROLE or HOST or IP : ' + JSON.stringify(type));
		process.exit(0);
	}
	let _type: string;
	if(apiutil.compareCaseString('ROLE', type)){
		_type = 'role';
	}else if(apiutil.compareCaseString('TOKEN', type)){
		_type = 'token';
	}else if(apiutil.compareCaseString('HOST', type)){
		_type = 'host';
	}else if(apiutil.compareCaseString('IP', type)){
		_type = 'ip';
	}else if(apiutil.compareCaseString('CUK', type)){
		_type = 'cuk';
	}else{
		console.log('token type must be USER or ROLE or HOST or IP : ' + JSON.stringify(type));
		process.exit(0);
	}

	if('cuk' === _type){
		cliutil.getConsoleInput('IP addrs(null=all, one ip, multi ip with ",")   : ', true, false, function(isbreak: boolean, addrs?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			let _addrs: string | string[] | null = null;
			if(apiutil.isSafeString(addrs)){
				const tmpAddrs: string[]	= [];
				const tmpaddrarr			= addrs.split(',');
				for(let cnt = 0; cnt < tmpaddrarr.length; ++cnt){
					if(apiutil.isSafeString(tmpaddrarr[cnt].trim())){
						tmpAddrs.push(apiutil.getSafeString(tmpaddrarr[cnt].trim()));
					}
				}
				if(0 == tmpAddrs.length){
					_addrs = null;
				}else if(1 == tmpAddrs.length){
					_addrs = tmpAddrs[0];
				}else{
					_addrs = tmpAddrs;
				}
			}

			cliutil.getConsoleInput('Delete by CUK(allow empty)                      : ', true, false, function(isbreak: boolean, cuk?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				let _cuk: string | null = null;
				if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
					_cuk = cuk.trim();
				}

				cliutil.getConsoleInput('Delete by port(allow empty)                     : ', true, false, function(isbreak: boolean, port?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					let	_port: number | null = null;
					if(apiutil.isSafeNumber(port)){
						_port = port;
					}

					// run
					deleteV1_IPByCuk(_addrs, _port, _cuk);
				});
			});
		});

	}else{
		cliutil.getConsoleInput('Role name or path(full yrn for IP)              : ', true, false, function(isbreak: boolean, name?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			const	_name = apiutil.getSafeString(name);

			if('ip' === _type){
				cliutil.getConsoleInput('Delete host port(default 0)                     : ', true, false, function(isbreak: boolean, port?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					let	_port: number;
					if(!apiutil.isSafeEntity(port)){
						_port = 0;
					}else if(apiutil.isSafeNumeric(port)){
						const	tmpPort = apiutil.cvtToNumber(port);
						if(apiutil.isSafeNumber(tmpPort)){
							_port = tmpPort;
						}else{
							console.log('port number must be decimal number or empty(empty means 0=any port) : ' + JSON.stringify(port));
							process.exit(0);
						}
					}else{
						console.log('port number must be decimal number or empty(empty means 0=any port) : ' + JSON.stringify(port));
						process.exit(0);
					}

					cliutil.getConsoleInput('Delete host CUK(default empty)                  : ', true, false, function(isbreak: boolean, cuk?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						let _cuk: string | null = null;
						if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
							_cuk = cuk.trim();
						}

						// run
						deleteV1Role(null, _name, null, _port, _cuk);
					});
				});

			}else if('host' === _type){
				cliutil.getConsoleInput('Scoped user token                               : ', true, false, function(isbreak: boolean, token?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					const _token = 'U=' + apiutil.getSafeString(token);

					cliutil.getConsoleInput('Delete hostname or ip address                   : ', true, false, function(isbreak: boolean, hostname?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						if(!apiutil.isSafeString(hostname)){
							process.exit(0);
						}
						const _hostname = apiutil.getSafeString(hostname);

						cliutil.getConsoleInput('Delete host port(default 0)                     : ', true, false, function(isbreak: boolean, port?: string | null): void
						{
							if(isbreak){
								process.exit(0);
							}
							let	_port: number;
							if(!apiutil.isSafeEntity(port)){
								_port = 0;
							}else if(apiutil.isSafeNumeric(port)){
								const	tmpPort = apiutil.cvtToNumber(port);
								if(apiutil.isSafeNumber(tmpPort)){
									_port = tmpPort;
								}else{
									console.log('port number must be decimal number or empty(empty means 0=any port) : ' + JSON.stringify(port));
									process.exit(0);
								}
							}else{
								console.log('port number must be decimal number or empty(empty means 0=any port) : ' + JSON.stringify(port));
								process.exit(0);
							}

							cliutil.getConsoleInput('Delete host CUK(default empty)                  : ', true, false, function(isbreak: boolean, cuk?: string | null): void
							{
								if(isbreak){
									process.exit(0);
								}
								let _cuk: string | null = null;
								if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
									_cuk = cuk.trim();
								}

								// run
								deleteV1Role(_token, _name, _hostname, _port, _cuk);
							});
						});
					});
				});

			}else if('token' === _type){
				cliutil.getConsoleInput('Scoped role token                               : ', true, false, function(isbreak: boolean, token?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					const _token = 'R=' + apiutil.getSafeString(token);

					// run
					deleteV1Role(_token, _name);
				});

			}else{	// role
				cliutil.getConsoleInput('Scoped user token                               : ', true, false, function(isbreak: boolean, token?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					const _token = 'U=' + apiutil.getSafeString(token);

					// run
					deleteV1Role(_token, _name);
				});
			}
		});
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
