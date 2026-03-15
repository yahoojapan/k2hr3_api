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
function postputV1Tenant(method: string, token: string, is_create: boolean, name: string, desc: string, display: string, users: string[] | null, id: string | null): void
{
	let strbody = '';
	let	clength	= 0;
	let path: string;

	if(apiutil.compareCaseString('post', method)){
		if(is_create){
			const	body = {
				'tenant': {
					'name':			name,
					'desc':			desc,
					'display':		display,
					'users':		users
				}
			};
			strbody	= JSON.stringify(body);
			path	= '/v1/tenant';
		}else{
			const	body = {
				'tenant': {
					'id':			id,
					'desc':			desc,
					'display':		display,
					'users':		users,
				}
			};
			strbody	= JSON.stringify(body);
			path	= '/v1/tenant/' + name;
		}
		clength	= strbody.length;

	}else if(apiutil.compareCaseString('put', method)){
		let urlarg: string;
		let	_path: string;
		let already_set	= false;

		if(is_create){
			_path		= '/v1/tenant';
			urlarg		= '?name=' + name;
			already_set	= true;
		}else{
			_path		= '/v1/tenant/' + name;
			urlarg		= '?id=' + id;
		}
		if('' === desc || apiutil.isSafeString(desc)){
			urlarg		+= already_set ? '&desc=' : '?desc=';
			urlarg		+= desc;
			already_set	= true;
		}
		if('' === display || apiutil.isSafeString(display)){
			urlarg		+= already_set ? '&display=' : '?display=';
			urlarg		+= display;
			already_set	= true;
		}
		if(apiutil.isNotEmptyArray(users)){
			urlarg		+= already_set ? '&users=' : '?users=';
			urlarg		+= JSON.stringify(users);
			already_set	= true;
		}
		clength = 0;
		path	= _path + encodeURI(urlarg);

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
		'path': 				path,
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

	cliutil.getConsoleInput('Unscoped(or Scoped) user token                           : ', true, false, function(isbreak: boolean, token?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		const _token = apiutil.getSafeString(token);

		cliutil.getConsoleInput('Create or Update tenant(create(default)/update)          : ', true, false, function(isbreak: boolean, mode?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}

			let _is_create: boolean;
			if(!apiutil.isSafeString(mode) || apiutil.compareCaseString('null', apiutil.getSafeString(mode))){
				_is_create = true;
			}else if(apiutil.compareCaseString('create', apiutil.getSafeString(mode))){
				_is_create = true;
			}else if(apiutil.compareCaseString('update', apiutil.getSafeString(mode))){
				_is_create = false;
			}else{
				console.log('function mode must be empty or create or update : ' + mode);
				process.exit(0);
			}

			cliutil.getConsoleInput('tenant name(if not specify, add prefix local@)           : ', true, false, function(isbreak: boolean, name?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _name = apiutil.getSafeString(name);

				cliutil.getConsoleInput('tenant description(allow null)                           : ', true, false, function(isbreak: boolean, desc?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					const _desc = apiutil.getSafeString(desc);

					cliutil.getConsoleInput('tenant display name(allow null)                          : ', true, false, function(isbreak: boolean, display?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						const _display = apiutil.getSafeString(display);

						cliutil.getConsoleInput('tenant users(input user name separate with ,)            : ', true, false, function(isbreak: boolean, users?: string | null): void
						{
							if(isbreak){
								process.exit(0);
							}

							const _users: string[]	= [];
							const tmparr			= apiutil.getSafeString(users).split(',');
							for(let cnt = 0; cnt < tmparr.length; ++cnt){
								const tmpstr = apiutil.getSafeString(tmparr[cnt].trim());
								if('' !== tmpstr){
									_users.push(tmpstr);
								}
							}
							const finalUsers = apiutil.isNotEmptyArray(_users) ? _users : null;

							if(_is_create){
								//
								// Create mode
								//
								postputV1Tenant(_method, _token, _is_create, _name, _desc, _display, finalUsers, null);

							}else{
								//								// Update mode
								//
								cliutil.getConsoleInput('tenant id                                                : ', true, false, function(isbreak: boolean, id?: string | null): void
								{
									if(isbreak){
										process.exit(0);
									}
									const _id = apiutil.getSafeString(id);

									// run
									postputV1Tenant(_method, _token, _is_create, _name, _desc, _display, finalUsers, _id);
								});
							}
						});
					});
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
