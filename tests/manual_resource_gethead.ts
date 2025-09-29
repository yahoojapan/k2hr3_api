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
function getV1Resource(is_get_req: boolean, token_type: string | null, token: string | null, name: string, service: string | null, is_expand?: boolean | null, data_type?: string | null, keyname?: string | null, port?: number, cuk?: string, roleyrn?: string): void
{
	const	keys		= r3keys();
	let 	urlarg		= '';
	let		already_set	= false;

	// expand
	if(apiutil.isBoolean(is_expand) && 'USER' === apiutil.getSafeString(token_type)){	// GET request & user token
		if(!is_expand){
			urlarg		+= already_set ? '&expand=false' : '?expand=false';
			already_set	= true;
		}
		// default expand(= not need parameter)
	}

	// service
	if(apiutil.isSafeString(service) && 'USER' === apiutil.getSafeString(token_type)){		// when user token
		urlarg		+= already_set ? '&service=' : '?service=';
		urlarg		+= service;
		already_set	= true;
	}

	// data type & key name
	if(apiutil.isSafeString(data_type) && (apiutil.compareCaseString(keys.VALUE_STRING_TYPE, data_type) || apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, data_type))){
		urlarg		+= already_set ? '&type=' : '?type=';
		urlarg		+= data_type;
		already_set	= true;

	}else if(apiutil.isSafeString(data_type) && apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, data_type)){
		if(!apiutil.isSafeString(keyname)){
			console.log('Internal error in test script : Something wrong');
			process.exit(0);
		}
		urlarg		+= already_set ? '&type=' : '?type=';
		urlarg		+= data_type;
		urlarg		+= '&keyname=';
		urlarg		+= keyname;
		already_set	= true;
	}

	// no token
	if(!apiutil.isSafeString(token_type)){
		// no token
		if(apiutil.isSafeNumber(port)){
			urlarg		+= already_set ? '&port=' : '?port=';
			urlarg		+= String(port);					// port is converted to String
			already_set	= true;
		}
		if(apiutil.isSafeString(cuk)){
			urlarg		+= already_set ? '&cuk=' : '?cuk=';
			urlarg		+= cuk;
			already_set	= true;
		}
		if(apiutil.isSafeString(roleyrn)){
			urlarg		+= already_set ? '&role=' : '?role=';
			urlarg		+= roleyrn;
			already_set	= true;
		}
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
		'path': 				'/v1/resource/' + name + encodeURI(urlarg),
		'method':				(is_get_req ? 'GET' : 'HEAD'),
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
// Utility for inputting token for three pattern
//
// callback(error, token type, token string)
//
function rawInputToken(callback: (error: string | null, token_type?: string | null, token?: string | null) => void): void
{
	const _callback = callback;

	cliutil.getConsoleInput('Token type(USER/ROLE/NULL(empty)) : ', true, false, function(isbreak: boolean, token_type?: string | null): void
	{
		if(isbreak){
			_callback('break for inputting token type');
			return;
		}
		let _token_type: string | null	= null;
		let _prefix						= '';
		if(!apiutil.isSafeString(token_type) || apiutil.compareCaseString('NULL', token_type)){
			// no token
			_callback(null, null, null);
			return;
		}else if(apiutil.compareCaseString('USER', token_type)){
			// user token
			_token_type	= 'USER';
			_prefix		= 'U=';
		}else if(apiutil.compareCaseString('ROLE', token_type)){
			// role token
			_token_type	= 'ROLE';
			_prefix		= 'R=';
		}else{
			_callback('token type must be USER or ROLE or NULL(empty)');
			return;
		}

		cliutil.getConsoleInput(_token_type + ' Token string                 : ', true, false, function(isbreak: boolean, token?: string | null): void
		{
			if(isbreak){
				_callback('break for inputting token');
				return;
			}
			if(!apiutil.isSafeString(_token_type) || apiutil.compareCaseString('NULL', _token_type)){
				_callback('token must be string');
				return;
			}
			const _token = _prefix + apiutil.getSafeString(token);
			_callback(null, _token_type, _token);
		});
	});
}

//
// Utility for inputting data type
//
// callback(error, data type, key name)
//
function rawInputDataType(callback: (error: string | null, data_type?: string | null, keyname?: string | null) => void): void
{
	const _callback = callback;

	cliutil.getConsoleInput('         Data type(STR/OBJ/KEYS)  : ', true, false, function(isbreak: boolean, data_type?: string | null): void
	{
		if(isbreak){
			_callback('break for inputting data type');
			return;
		}
		if(!apiutil.isSafeString(data_type)){
			_callback('resource type must be STR(empty) or OBJ or KEYS : ' + data_type);
			return;
		}
		const	keys = r3keys();

		if(apiutil.compareCaseString('STR', data_type)){
			_callback(null, keys.VALUE_STRING_TYPE, null);

		}else if(apiutil.compareCaseString('OBJ', data_type)){
			_callback(null, keys.VALUE_OBJECT_TYPE, null);

		}else if(apiutil.compareCaseString('KEYS', data_type)){
			cliutil.getConsoleInput('         Key Name(in keys)        : ', true, false, function(isbreak: boolean, keyname?: string | null): void
			{
				if(isbreak){
					_callback('break for inputting key name');
					return;
				}
				if(!apiutil.isSafeString(keyname)){
					_callback('resource key name must be specified');
					return;
				}
				const _keyname = apiutil.getSafeString(keyname);
				_callback(null, keys.VALUE_KEYS_TYPE, _keyname);
			});

		}else{
			_callback('resource type must be STR(empty) or OBJ or KEYS : ' + data_type);
		}
	});
}

//
// Utility for inputting data type
//
// callback(error, data type, key name)
//
function rawInputServiceName(token_type: string | null, callback: (error: string | null, service?: string | null) => void): void
{
	const _callback = callback;

	if(!apiutil.compareCaseString(token_type, 'USER')){
		_callback(null, null);
		return;
	}

	cliutil.getConsoleInput('Service name(allow empty)         : ', true, false, function(isbreak: boolean, service?: string | null): void
	{
		if(isbreak){
			_callback('break for inputting data type');
			return;
		}
		if(!apiutil.isSafeString(service)){
			_callback(null, null);
			return;
		}
		_callback(null, apiutil.getSafeString(service));
	});
}

//
// run
//
cliutil.getConsoleInput('Method(GET/HEAD)                  : ', true, false, function(isbreak: boolean, method?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}

	let _is_get_req = false;
	if(apiutil.compareCaseString('get', method)){
		_is_get_req = true;
	}

	rawInputToken(function(error: string | null, token_type?: string | null, token?: string | null): void
	{
		if(null !== error){
			console.log(error);
			process.exit(0);
		}
		const _token_type	= apiutil.isSafeString(token_type) ? token_type : null;
		const _token		= apiutil.isSafeString(token) ? token : null;

		rawInputServiceName(_token_type, function(error: string | null, service?: string | null): void
		{
			if(null !== error){
				console.log(error);
				process.exit(0);
			}
			const _service = apiutil.isSafeString(service) ? service : null;

			cliutil.getConsoleInput('Resource name                     : ', true, false, function(isbreak: boolean, name?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}
				const _name = apiutil.getSafeString(name);

				if(!_is_get_req || null === _token_type || 'ROLE' === _token_type){		// case: HEAD req / GET req(ROLE/no TOKEN)
					// HEAD request or role token or no token
					rawInputDataType(function(error: string | null, data_type?: string | null, keyname?: string | null): void
					{
						if(null !== error){
							console.log(error);
							process.exit(0);
						}
						const _data_type	= apiutil.isSafeString(data_type) ? data_type : null;
						const _keyname		= apiutil.isSafeString(keyname) ? keyname : null;

						if(apiutil.isSafeString(_token_type) && ('USER' === _token_type || 'ROLE' === _token_type)){
							// role token
							getV1Resource(_is_get_req, _token_type, _token, _name, _service, null, _data_type, _keyname);

						}else{
							// no token
							cliutil.getConsoleInput('         Port number(0=any(empty)): ', true, false, function(isbreak: boolean, port?: string | null): void
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
										process.exit(0);
									}
								}else{
									process.exit(0);
								}

								cliutil.getConsoleInput('         CUK(allow empty)         : ', true, false, function(isbreak: boolean, cuk?: string | null): void
								{
									if(isbreak){
										process.exit(0);
									}
									let _cuk: string | undefined;
									if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
										_cuk = cuk.trim();
									}

									cliutil.getConsoleInput('         Role full yrn path       : ', true, false, function(isbreak: boolean, roleyrn?: string | null): void
									{
										if(isbreak){
											process.exit(0);
										}
										if(!apiutil.isSafeString(roleyrn)){
											process.exit(0);
										}
										const _roleyrn = roleyrn;

										// run
										getV1Resource(_is_get_req, _token_type, _token, _name, _service, null, _data_type, _keyname, _port, _cuk, _roleyrn);
									});
								});
							});
						}
					});

				}else if('USER' === _token_type){										// case: GET req(USER TOKEN)
					// user token
					cliutil.getConsoleInput('         Expand(true/false)       : ', true, false, function(isbreak: boolean, expand?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}

						let _is_expand = false;
						if(apiutil.compareCaseString('true', expand)){
							_is_expand = true;
						}else if(apiutil.compareCaseString('false', expand)){
							_is_expand = false;
						}else{
							console.log('resource expand must be TRUE or FALSE : ' + expand);
							process.exit(0);
						}

						// run
						getV1Resource(_is_get_req, _token_type, _token, _name, _service, _is_expand);
					});

				}else{
					// why?
					process.exit(0);
				}
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
