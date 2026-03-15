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
function deleteV1Resource(token_type: string | null, token: string | null, name: string, data_type: string | null, keynames: string[] | null, aliases?: string[] | null, port?: number, cuk?: string, roleyrn?: string): void
{
	// data type & key name & aliases
	const	keys		= r3keys();
	let		urlarg		= '';
	let		already_set	= false;

	if(!apiutil.isSafeString(data_type)){
		// remove all resource data, so no parameter

	}else if(apiutil.compareCaseString(keys.VALUE_ANYDATA_TYPE, data_type) || apiutil.compareCaseString(keys.VALUE_STRING_TYPE, data_type) || apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, data_type) || apiutil.compareCaseString(keys.VALUE_EXPIRE_TYPE, data_type)){
		urlarg		+= already_set ? '&type=' : '?type=';
		urlarg		+= data_type;
		already_set	= true;

	}else if(apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, data_type)){
		urlarg		+= already_set ? '&type=' : '?type=';
		urlarg		+= data_type;

		if(apiutil.isStringArray(keynames)){
			if(!apiutil.isNotEmptyArray(keynames)){
				console.log('Internal error in test script : Something wrong');
				process.exit(0);
			}
			urlarg	+= '&keynames=';
			urlarg	+= JSON.stringify(keynames);
		}
		already_set	= true;

	}else if(apiutil.compareCaseString(keys.VALUE_ALIAS_TYPE, data_type)){
		urlarg		+= already_set ? '&type=' : '?type=';
		urlarg		+= data_type;

		if(apiutil.isStringArray(aliases)){
			if(!apiutil.isNotEmptyArray(aliases)){
				console.log('Internal error in test script : Something wrong');
				process.exit(0);
			}
			urlarg	+= '&aliases=';
			urlarg	+= JSON.stringify(aliases);
		}
		already_set	= true;
	}else{
		console.log('Internal error in test script : Something wrong');
		process.exit(0);
	}

	// no token
	if(!apiutil.isSafeString(token_type)){
		if(apiutil.isSafeNumber(port)){
			urlarg		+= already_set ? '&port=' : '?port=';
			urlarg		+= String(port);					// port is converted to String
			already_set	= true;
		}
		if(apiutil.isSafeEntity(cuk)){
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
// Utility for inputting token for three pattern
//
// callback(error, token type, token string)
//
function rawInputToken(callback: (error: string | null, token_type?: string | null, token?: string | null) => void): void
{
	const _callback = callback;

	cliutil.getConsoleInput('Token type(USER/ROLE/NULL(empty))                               : ', true, false, function(isbreak: boolean, token_type?: string | null): void
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

		cliutil.getConsoleInput(_token_type + ' Token string                                               : ', true, false, function(isbreak: boolean, token?: string | null): void
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
// Utility for inputting token for three pattern
//
// callback(error, token type, token string)
//
function rawInputDataType(token_type: string | null, callback: (error: string | null, data_type?: string | null, keynames?: string[] | null, aliases?: string[] | null) => void): void
{
	const _callback = callback;

	if('USER' === token_type){
		// user token
		cliutil.getConsoleInput('         Remove data type(ANY/STR/OBJ/KEYS/ALIAS/NULL(all))     : ', true, false, function(isbreak: boolean, data_type?: string | null): void
		{
			if(isbreak){
				_callback('break for inputting data type');
				return;
			}
			const	keys = r3keys();

			if(null === data_type || apiutil.compareCaseString('NULL', data_type)){
				_callback(null, null, null, null);

			}else if(apiutil.compareCaseString('ANY', data_type)){
				_callback(null, keys.VALUE_ANYDATA_TYPE, null, null);

			}else if(apiutil.compareCaseString('STR', data_type)){
				_callback(null, keys.VALUE_STRING_TYPE, null, null);

			}else if(apiutil.compareCaseString('OBJ', data_type)){
				_callback(null, keys.VALUE_OBJECT_TYPE, null, null);

			}else if(apiutil.compareCaseString('KEYS', data_type)){
				cliutil.getConsoleInput('         Key Name(in keys)                                      : ', true, false, function(isbreak: boolean, keyname?: string | null): void
				{
					if(isbreak){
						_callback('break for inputting key name');
						return;
					}
					let _keyname: string[] | null;
					if(!apiutil.isSafeString(keyname) || apiutil.compareCaseString('NULL', keyname)){
						_keyname = null;
					}else if(apiutil.isSafeString(keyname)){
						_keyname = keyname.split(',');
					}else{
						_callback('something wrong value for keyname');
						return;
					}
					_callback(null, keys.VALUE_KEYS_TYPE, _keyname, null);
				});

			}else if(apiutil.compareCaseString('ALIAS', data_type)){
				cliutil.getConsoleInput('         Alias Names(null(all), one yrn, or multi yrn with \',\') : ', true, false, function(isbreak: boolean, aliases?: string | null): void
				{
					if(isbreak){
						_callback('break for inputting aliases');
						return;
					}
					let _aliases: string[] | null;
					if(!apiutil.isSafeString(aliases) || apiutil.compareCaseString('NULL', aliases)){
						_aliases = null;
					}else if(apiutil.isSafeString(aliases)){
						_aliases = aliases.split(',');
					}else{
						_callback('something wrong value for aliases');
						return;
					}
					_callback(null, keys.VALUE_ALIAS_TYPE, null, _aliases);
				});

			}else{
				_callback('inputting wrong data type: ' + data_type);
				return;
			}
		});

	}else{
		// role token/no token
		cliutil.getConsoleInput('         Remove data type(ANY/STR/OBJ/KEYS)                     : ', true, false, function(isbreak: boolean, data_type?: string | null): void
		{
			if(isbreak){
				_callback('break for inputting data type');
				return;
			}
			if(!apiutil.isSafeString(data_type)){
				_callback('inputting wrong data type: ' + data_type);
				return;
			}
			const	keys = r3keys();

			if(apiutil.compareCaseString('ANY', data_type)){
				_callback(null, keys.VALUE_ANYDATA_TYPE, null, null);

			}else if(apiutil.compareCaseString('STR', data_type)){
				_callback(null, keys.VALUE_STRING_TYPE, null, null);

			}else if(apiutil.compareCaseString('OBJ', data_type)){
				_callback(null, keys.VALUE_OBJECT_TYPE, null, null);

			}else if(apiutil.compareCaseString('KEYS', data_type)){
				cliutil.getConsoleInput('         Key Name(in keys)                                      : ', true, false, function(isbreak: boolean, keyname?: string | null): void
				{
					if(isbreak){
						_callback('break for inputting key name');
						return;
					}
					let _keyname: string[] | null;
					if(!apiutil.isSafeString(keyname) || apiutil.compareCaseString('NULL', keyname)){
						_keyname = null;
					}else if(apiutil.isSafeString(keyname)){
						_keyname = keyname.split(',');
					}else{
						_callback('something wrong value for keyname');
						return;
					}
					_callback(null, keys.VALUE_KEYS_TYPE, _keyname, null);
				});

			}else{
				_callback('inputting wrong data type: ' + data_type);
				return;
			}
		});
	}
}

//
// run
//
rawInputToken(function(error: string | null, token_type?: string | null, token?: string | null): void
{
	if(null !== error){
		console.log(error);
		process.exit(0);
	}
	const _token_type	= apiutil.isSafeString(token_type) ? token_type : null;
	const _token		= apiutil.isSafeString(token) ? token : null;

	cliutil.getConsoleInput('Resource name(path)                                             : ', true, false, function(isbreak: boolean, name?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}
		const _name = apiutil.getSafeString(name);

		rawInputDataType(_token_type, function(error: string | null, data_type?: string | null, keynames?: string[] | null, aliases?: string[] | null): void
		{
			if(null !== error){
				console.log(error);
				process.exit(0);
			}
			const	_data_type	= apiutil.isSafeString(data_type) ? data_type : null;
			const	_keynames	= apiutil.isStringArray(keynames) ? keynames : null;
			const	_aliases	= apiutil.isStringArray(aliases) ? aliases : null;

			if(apiutil.isSafeString(token_type) && ('USER' === _token_type || 'ROLE' === _token_type)){
				// user token / role token
				// run
				deleteV1Resource(_token_type, _token, _name, _data_type, _keynames, _aliases);

			}else{
				// no token
				cliutil.getConsoleInput('         Port number(0=any(empty))                              : ', true, false, function(isbreak: boolean, port?: string | null): void
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

					cliutil.getConsoleInput('         CUK(allow empty)                                       : ', true, false, function(isbreak: boolean, cuk?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						let _cuk: string | undefined;
						if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
							_cuk = cuk.trim();
						}

						cliutil.getConsoleInput('         Role full yrn path                                     : ', true, false, function(isbreak: boolean, roleyrn?: string | null): void
						{
							if(isbreak){
								process.exit(0);
							}
							if(!apiutil.isSafeString(roleyrn)){
								process.exit(0);
							}
							const _roleyrn = roleyrn;

							// run
							deleteV1Resource(_token_type, _token, _name, _data_type, _keynames, _aliases, _port, _cuk, _roleyrn);
						});
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
