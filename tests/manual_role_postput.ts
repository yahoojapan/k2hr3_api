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
function postV1Role(method: string, token: string, name: string, policies: string[] | null, alias: string[] | null): void
{
	let strbody	= '';
	let	clength	= 0;
	let	cpath: string;

	if(apiutil.compareCaseString('post', method)){
		const body = {
			'role': {
				'name':		name,
				'policies':	policies,
				'alias':	alias
			}
		};
		strbody	= JSON.stringify(body);
		clength	= strbody.length;
		cpath	= '/v1/role';

	}else if(apiutil.compareCaseString('put', method)){
		// case for PUT
		let urlarg		= '';
		let already_set	= false;

		if(apiutil.isString(name)){
			urlarg		+= already_set ? '&name=' : '?name=';
			urlarg		+= name;
			already_set	= true;
		}
		if(apiutil.isSafeEntity(policies)){
			urlarg		+= already_set ? '&policies=' : '?policies=';
			urlarg		+= JSON.stringify(policies);		// policies is converted to JSON
			already_set	= true;
		}
		if(apiutil.isSafeEntity(alias)){
			urlarg		+= already_set ? '&alias=' : '?alias=';
			urlarg		+= JSON.stringify(alias);			// alias is converted to JSON
			already_set	= true;
		}
		clength	= 0;
		cpath	= '/v1/role' + encodeURI(urlarg);

		r3logger.dlog('set parameters : ' + JSON.stringify(already_set));
	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	clength,
		'X-Auth-Token':		token
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				cpath,
		'method':				method,
		'headers':				headers,
		'rejectUnauthorized':	(is_https ? false : undefined),			// always insecure for this manual test
		'ca':					(is_https && null !== ca) ? (ca() ?? undefined) : undefined
	};
	r3logger.dlog('request options   = ' + JSON.stringify({ ...options, ca: options.ca ? '[Buffer]' : undefined }));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));
	r3logger.dlog('request body      = ' + strbody);

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
	if('' !== strbody){
		req.write(strbody);
	}

	req.end();
}

function postV1RoleHost(method: string, is_user_token: boolean, token: string, name: string, target_host: string | null, port: number, cuk: string | null, extra: string | null, tag: string | null, inboundip: string | null, outboundip: string | null): void
{
	let		strbody	= '';
	let		clength	= 0;
	let		cpath: string;
	const	_token	= (is_user_token ? ('U=' + token) : ('R=' + token));

	if(apiutil.compareCaseString('post', method)){
		const	host_info = {
			host:		is_user_token ? target_host : undefined,
			ip:			is_user_token ? null : undefined,
			port:		port,
			cuk:		apiutil.isSafeString(cuk) ? apiutil.getSafeString(cuk) : null,
			extra:		apiutil.isSafeString(extra) ? apiutil.getSafeString(extra) : null,
			tag:		apiutil.isSafeString(tag) ? apiutil.getSafeString(tag) : null,
			inboundip:	apiutil.isSafeString(inboundip) ? apiutil.getSafeString(inboundip) : undefined,		// not need to check ip address
			outboundip:	apiutil.isSafeString(outboundip) ? apiutil.getSafeString(outboundip) : undefined	// not need to check ip address
		};
		const	body = { 'host': host_info };

		strbody	= JSON.stringify(body);
		clength	= strbody.length;
		cpath	= '/v1/role/' + name;

	}else if(apiutil.compareCaseString('put', method)){
		// case for PUT
		let	urlarg		= '';
		let	already_set	= false;

		if(is_user_token && apiutil.isSafeString(target_host)){
			urlarg		+= already_set ? '&host=' : '?host=';
			urlarg		+= target_host;
			already_set	= true;
		}
		if(0 <= port){
			urlarg		+= already_set ? '&port=' : '?port=';
			urlarg		+= port;
			already_set	= true;
		}
		if(apiutil.isSafeString(cuk)){
			urlarg		+= already_set ? '&cuk=' : '?cuk=';
			urlarg		+= cuk;
			already_set	= true;
		}
		if(apiutil.isSafeString(extra)){
			urlarg		+= already_set ? '&extra=' : '?extra=';
			urlarg		+= JSON.stringify(extra);			// if extra is existing, it includes control codes, so it is converted to JSON.
			already_set	= true;
		}
		if(apiutil.isSafeString(tag)){
			urlarg		+= already_set ? '&tag=' : '?tag=';
			urlarg		+= JSON.stringify(tag);				// if tag is existing, it includes control codes, so it is converted to JSON.
			already_set	= true;
		}
		if(apiutil.isSafeString(inboundip)){				// not need to check ip address
			urlarg		+= already_set ? '&inboundip=' : '?inboundip=';
			urlarg		+= inboundip;
			already_set	= true;
		}
		if(apiutil.isSafeString(outboundip)){				// not need to check ip address
			urlarg		+= already_set ? '&outboundip=' : '?outboundip=';
			urlarg		+= outboundip;
			already_set	= true;
		}
		clength	= 0;
		cpath	= '/v1/role/' + name + encodeURI(urlarg);

		r3logger.dlog('set parameters : ' + JSON.stringify(already_set));
	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	clength,
		'X-Auth-Token':		_token
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				cpath,
		'method':				method,
		'headers':				headers,
		'rejectUnauthorized':	(is_https ? false : undefined),			// always insecure for this manual test
		'ca':					(is_https && null !== ca) ? (ca() ?? undefined) : undefined
	};
	r3logger.dlog('request options   = ' + JSON.stringify({ ...options, ca: options.ca ? '[Buffer]' : undefined }));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));
	r3logger.dlog('request body      = ' + strbody);

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

	// write data to request body
	if('' !== strbody){
		req.write(strbody);
	}

	req.end();
}

//
// Run for role
//
function inputRoleType(method: string): void
{
	const _method = method;

	cliutil.getConsoleInput('Scoped user token for tenant                          : ', true, false, function(isbreak: boolean, token?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		const _token = apiutil.getSafeString(token);

		cliutil.getConsoleInput('Role name(path)                                       : ', true, false, function(isbreak: boolean, name?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			const _name = apiutil.getSafeString(name);

			cliutil.getConsoleInput('     policies(specify null/yrn with \',\' for multiple) : ', true, false, function(isbreak: boolean, policies?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				let _policies: string[] | null;

				if(!apiutil.isSafeString(policies) || apiutil.compareCaseString('null', apiutil.getSafeString(policies))){
					_policies = null;
				}else{
					// parse ','
					_policies		= [];
					const strarray	= policies.split(',');
					for(let cnt = 0; cnt < strarray.length; ++cnt){
						const strtmp = strarray[cnt].trim();
						_policies.push(strtmp);
					}
				}

				cliutil.getConsoleInput('     alias(specify null/yrn with \',\' for multiple)    : ', true, false, function(isbreak: boolean, alias?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					let _alias: string[] | null;

					if(!apiutil.isSafeString(alias) || apiutil.compareCaseString('null', apiutil.getSafeString(alias))){
						_alias = null;
					}else{
						// parse ','
						_alias			= [];
						const strarray	= alias.split(',');
						for(let cnt = 0; cnt < strarray.length; ++cnt){
							const strtmp = strarray[cnt].trim();
							_alias.push(strtmp);
						}
					}

					// run
					postV1Role(_method, _token, _name, _policies, _alias);
				});
			});
		});
	});
}

//
// Run for host
//
function inputHostType(method: string): void
{
	const _method = method;

	cliutil.getConsoleInput('Token type( USER(default) / ROLE )                    : ', true, false, function(isbreak: boolean, type?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		let _is_user_token: boolean;
		let _keyward: string;
		if(!apiutil.isSafeString(type) || apiutil.compareCaseString('null', apiutil.getSafeString(type)) || apiutil.compareCaseString('user', apiutil.getSafeString(type))){
			_is_user_token	= true;
			_keyward		= 'USER';
		}else if(apiutil.compareCaseString('role', apiutil.getSafeString(type))){
			_is_user_token	= false;
			_keyward		= 'ROLE';
		}else{
			process.exit(0);
		}

		cliutil.getConsoleInput('Scoped ' + _keyward + ' token for tenant                          : ', true, false, function(isbreak: boolean, token?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			const _token = apiutil.getSafeString(token);

			cliutil.getConsoleInput('Role name(path)                                       : ', true, false, function(isbreak: boolean, name?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _name = apiutil.getSafeString(name);

				cliutil.getConsoleInput('     Port number(specify 0...(0 means any port))      : ', true, false, function(isbreak: boolean, port?: string | null): void
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
							console.log('port number must be decimal number: ' + JSON.stringify(port));
							process.exit(0);
						}
					}else{
						console.log('port number must be decimal number: ' + JSON.stringify(port));
						process.exit(0);
					}

					cliutil.getConsoleInput('     CUK string(allow null)                           : ', true, false, function(isbreak: boolean, cuk?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						let _cuk: string | null = null;
						if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
							_cuk = cuk.trim();
						}

						cliutil.getConsoleInput('     Extra data - null/openstack(os)/kubernetes(k8s)  : ', true, false, function(isbreak: boolean, extra?: string | null): void
						{
							if(isbreak){
								process.exit(0);
							}
							let _extra: string | null;

							if(!apiutil.isSafeString(extra) || apiutil.compareCaseString('null', apiutil.getSafeString(extra))){
								_extra = null;
							}else if(apiutil.compareCaseString('os', apiutil.getSafeString(extra)) || apiutil.compareCaseString('openstack', apiutil.getSafeString(extra))){
								_extra = 'openstack-auto-v1';
							}else if(apiutil.compareCaseString('k8s', apiutil.getSafeString(extra)) || apiutil.compareCaseString('kubernetes', apiutil.getSafeString(extra))){
								_extra = 'k8s-auto-v1';
							}else{
								_extra = extra;
							}

							cliutil.getConsoleInput('     Tag string - null or string                      : ', true, false, function(isbreak: boolean, tag?: string | null): void
							{
								if(isbreak){
									process.exit(0);
								}
								let _tag: string | null;
								if(!apiutil.isSafeString(tag) || apiutil.compareCaseString('null', apiutil.getSafeString(tag))){
									_tag = null;
								}else{
									_tag = tag;
								}

								cliutil.getConsoleInput('     Inbound IP address - null or string              : ', true, false, function(isbreak: boolean, inbound?: string | null): void
								{
									if(isbreak){
										process.exit(0);
									}
									let	_inbound: string | null;
									if(!apiutil.isSafeString(inbound) || apiutil.compareCaseString('null', apiutil.getSafeString(inbound))){
										_inbound = null;
									}else{
										_inbound = inbound;
									}

									cliutil.getConsoleInput('     Outbound IP address - null or string             : ', true, false, function(isbreak: boolean, outbound?: string | null): void
									{
										if(isbreak){
											process.exit(0);
										}
										let _outbound: string | null;
										if(!apiutil.isSafeString(outbound) || apiutil.compareCaseString('null', apiutil.getSafeString(outbound))){
											_outbound = null;
										}else{
											_outbound = outbound;
										}

										if(!_is_user_token){
											// run
											postV1RoleHost(_method, _is_user_token, _token, _name, null, _port, _cuk, _extra, _tag, _inbound, _outbound);
										}else{

											cliutil.getConsoleInput('     Host(specify hostname or ip address)             : ', true, false, function(isbreak: boolean, target_host?: string | null): void
											{
												if(isbreak){
													process.exit(0);
												}
												if(!apiutil.isSafeString(target_host)){
													process.exit(0);
												}
												const _target_host = apiutil.getSafeString(target_host);

												// run
												postV1RoleHost(_method, _is_user_token, _token, _name, _target_host, _port, _cuk, _extra, _tag, _inbound, _outbound);
											});
										}
									});
								});
							});
						});
					});
				});
			});
		});
	});
}

//
// Run
//
cliutil.getConsoleInput('Method(POST/PUT)                                      : ', true, false, function(isbreak: boolean, method?: string | null): void
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

	cliutil.getConsoleInput('Use API for Role or Host in Role(ROLE/HOST)           : ', true, false, function(isbreak: boolean, apitype?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}

		if(apiutil.compareCaseString('role', apitype)){
			inputRoleType(_method);

		}else if(apiutil.compareCaseString('host', apitype)){
			inputHostType(_method);

		}else{
			console.log('API type must be ROLE or HOST : ' + apitype);
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
