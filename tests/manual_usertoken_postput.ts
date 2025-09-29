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
function postV1UserTokens(method: string, token: string | null, othertoken: string | null, user: string | null, passwd: string | null, tenant: string | null): void
{
	// set token if exists
	let is_user_cred_type	= true;
	let	_token: string		= '';
	if(apiutil.isSafeString(token)){
		_token				= 'U=' + token;
		is_user_cred_type	= false;
	}else if(apiutil.isSafeString(othertoken)){
		_token				= 'U=' + othertoken;
		is_user_cred_type	= false;
	}

	let strbody	= '';
	let	clength	= 0;
	let	cpath: string;
	if(apiutil.compareCaseString('post', method)){
		// case for POST
		if(is_user_cred_type){
			const	body = {
				'auth': {
					'tenantName':	apiutil.getSafeString(tenant),
					'passwordCredentials':	{
						'username':	user,
						'password':	passwd
					}
				}
			};
			strbody	= JSON.stringify(body);
		}else{
			const	body = {
				'auth': {
					'tenantName':	apiutil.getSafeString(tenant)
				}
			};
			strbody	= JSON.stringify(body);
		}
		clength	= strbody.length;
		cpath	= '/v1/user/tokens';

	}else if(apiutil.compareCaseString('put', method)){
		// case for PUT
		let urlarg		= '';
		let	already_set	= false;
		if('' === tenant || apiutil.isSafeString(tenant)){
			urlarg		+= already_set ? '&tenantname=' : '?tenantname=';
			urlarg		+= tenant;
			already_set	= true;
		}
		if(is_user_cred_type){
			if('' === user || apiutil.isSafeString(user)){
				urlarg		+= already_set ? '&username=' : '?username=';
				urlarg		+= user;
				already_set	= true;
			}
			if('' === passwd || apiutil.isSafeString(passwd)){
				urlarg		+= already_set ? '&password=' : '?password=';
				urlarg		+= encodeURIComponent(passwd);				// NOTICE: encoding passwd
				already_set	= true;
			}
		}
		clength	= 0;
		cpath	= '/v1/user/tokens' + encodeURI(urlarg);

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

cliutil.getConsoleInput('Method(POST/PUT)               : ', true, false, function(isbreak: boolean, method?: string | null): void
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

	cliutil.getConsoleInput('Type(CRED/TOKEN/OTHER)         : ', true, false, function(isbreak: boolean, type?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		const _type = apiutil.getSafeString(type);

		if(!apiutil.isSafeString(_type) || apiutil.compareCaseString('cred', apiutil.getSafeString(_type))){
			//
			// User credentials
			//
			cliutil.getConsoleInput('Username                       : ', true, false, function(isbreak: boolean, username?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _username = apiutil.getSafeString(username);

				// if not jpopsdb api for keystone, we must set passwd.
				//
				cliutil.getConsoleInput('Password(null for not using pw): ', false, false, function(isbreak: boolean, passwd?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}

					// [NOTE]
					// If passwd is empty, we set null for passwd.
					// You can specify your keystone which does not need to set passwd for getting credential.
					//
					let _passwd: string | null = null;
					if(apiutil.isSafeString(passwd)){
						_passwd = apiutil.getSafeString(passwd);
					}

					cliutil.getConsoleInput('Tenant                         : ', true, false, function(isbreak: boolean, tenant?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}

						let _tenant: string | null;
						if(!apiutil.isSafeString(tenant) || apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
							_tenant = null;
						}else{
							_tenant = apiutil.getSafeString(tenant);
						}

						// run
						postV1UserTokens(_method, null, null, _username, _passwd, _tenant);
					});
				});
			});

		}else if('' === apiutil.getSafeString(_type) || apiutil.compareCaseString('token', apiutil.getSafeString(_type))){
			//
			// Unscoped user token registered in k2hr3
			//
			cliutil.getConsoleInput('Unscoped user token            : ', true, false, function(isbreak: boolean, token?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _token = apiutil.getSafeString(token);

				cliutil.getConsoleInput('Tenant                         : ', true, false, function(isbreak: boolean, tenant?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					if('' === apiutil.getSafeString(tenant) || apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
						console.log('using unscoped token, need tenant name.');
						process.exit(0);
					}
					const _tenant = apiutil.getSafeString(tenant);

					// run
					postV1UserTokens(_method, _token, null, null, null, _tenant);
				});

			});

		}else if('' === apiutil.getSafeString(_type) || apiutil.compareCaseString('other', apiutil.getSafeString(_type))){
			//
			// other token from other(openstack) authorization system
			//
			cliutil.getConsoleInput('Other system token             : ', true, false, function(isbreak: boolean, token?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _token = apiutil.getSafeString(token);

				cliutil.getConsoleInput('Tenant(allow null/skip)        : ', true, false, function(isbreak: boolean, tenant?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					let _tenant: string | null;
					if(!apiutil.isSafeString(tenant) || apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
						_tenant = null;
					}else{
						_tenant = tenant;
					}

					// run
					postV1UserTokens(_method, null, _token, null, null, _tenant);
				});
			});

		}else{
			console.log('type must be CRED or TOKEN or OTHER(unregistered token by openstack) : ' + _type);
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
