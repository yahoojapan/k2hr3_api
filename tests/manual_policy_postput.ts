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
function postV1Policy(method: string, token: string, name: string, effect: string | null, action: string[] | null, resource: string[] | null, alias: string[] | null): void
{
	let	reqpath: string	= '';
	let	strbody: string	= '';
	let	clength: number	= 0;

	if(apiutil.compareCaseString('post', method)){
		const	body = {
			'policy': {
				'name':			name,
				'effect':		effect,
				'action':		action,
				'resource':		resource,
				'condition':	null,
				'alias':		alias
			}
		};
		reqpath	= '/v1/policy';
		strbody	= JSON.stringify(body);
		clength = strbody.length;

	}else if(apiutil.compareCaseString('put', method)){
		let	urlarg: string	= '';
		let	already_set		= false;
		if(apiutil.isString(name)){
			urlarg		+= already_set ? '&name=' : '?name=';
			urlarg		+= name;
			already_set	= true;
		}
		if(apiutil.isString(effect)){
			urlarg		+= already_set ? '&effect=' : '?effect=';
			urlarg		+= effect;
			already_set	= true;
		}
		if(apiutil.isString(action)){
			urlarg		+= already_set ? '&action=' : '?action=';
			urlarg		+= action;
			already_set	= true;
		}
		if(apiutil.isString(resource)){
			urlarg		+= already_set ? '&resource=' : '?resource=';
			urlarg		+= resource;
			already_set	= true;
		}
		//if(apiutil.isString(condition)){
		//	urlarg		+= already_set ? '&condition=' : '?condition=';
		//	urlarg		+= condition;
		//	already_set	= true;
		//}
		if(apiutil.isString(alias)){
			urlarg		+= already_set ? '&alias=' : '?alias=';
			urlarg		+= alias;
			already_set	= true;
		}
		reqpath = '/v1/policy' + encodeURI(urlarg);
		strbody	= '';
		clength = 0;

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
		'path': 				reqpath,
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

	cliutil.getConsoleInput('Scoped user token for tenant                             : ', true, false, function(isbreak: boolean, token?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		const _token = apiutil.getSafeString(token);

		cliutil.getConsoleInput('Policy name                                              : ', true, false, function(isbreak: boolean, name?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			const _name = apiutil.getSafeString(name);

			cliutil.getConsoleInput('       effect(null/allow/deny)                           : ', true, false, function(isbreak: boolean, effect?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				let _effect: string | null;
				if(!apiutil.isSafeString(effect) || apiutil.compareCaseString('null', apiutil.getSafeString(effect))){
					_effect = null;
				}else if(apiutil.compareCaseString('allow', apiutil.getSafeString(effect))){
					_effect = 'allow';
				}else if(apiutil.compareCaseString('deny', apiutil.getSafeString(effect))){
					_effect = 'deny';
				}else{
					console.log('effect must be empty or null or allow or deny : ' + effect);
					process.exit(0);
				}

				cliutil.getConsoleInput('       action(specify null/read/write multiple with \',\') : ', true, false, function(isbreak: boolean, action?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					let _action: string[] | null;
					if(!apiutil.isSafeString(action) || apiutil.compareCaseString('null', apiutil.getSafeString(action))){
						_action = null;
					}else{
						// parse ','
						const	keys	= r3keys();							// do not need user/tenant
						_action			= [];
						const strarray	= action.split(',');
						for(let cnt = 0; cnt < strarray.length; ++cnt){
							const strtmp = strarray[cnt].trim();
							if(apiutil.compareCaseString(keys.VALUE_READ, apiutil.getSafeString(strtmp))){
								_action.push(keys.ACTION_READ_KEY);
							}else if(apiutil.compareCaseString(keys.VALUE_WRITE, apiutil.getSafeString(strtmp))){
								_action.push(keys.ACTION_WRITE_KEY);
							}else{
								console.log('action must be empty or null or array(read / write) : ' + action);
								process.exit(0);
							}
						}
					}

					cliutil.getConsoleInput('       resource(specify null/yrn multiple with \',\')      : ', true, false, function(isbreak: boolean, resource?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						let _resource: string[] | null;
						if(!apiutil.isSafeString(resource) || apiutil.compareCaseString('null', apiutil.getSafeString(resource))){
							_resource = null;
						}else{
							// parse ','
							_resource = [];
							const strarray = resource.split(',');
							for(let cnt = 0; cnt < strarray.length; ++cnt){
								const strtmp = strarray[cnt].trim();
								_resource.push(strtmp);
							}
						}

						cliutil.getConsoleInput('       alias(specify null/yrn multiple with \',\')         : ', true, false, function(isbreak: boolean, alias?: string | null): void
						{
							if(isbreak){
								process.exit(0);
							}
							let _alias: string[] | null;
							if(!apiutil.isSafeString(alias) || apiutil.compareCaseString('null', apiutil.getSafeString(alias))){
								_alias = null;
							}else{
								// parse ','
								_alias = [];
								const strarray = alias.split(',');
								for(let cnt = 0; cnt < strarray.length; ++cnt){
									const strtmp = strarray[cnt].trim();
									_alias.push(strtmp);
								}
							}
							// run
							postV1Policy(_method, _token, _name, _effect, _action, _resource, _alias);
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
