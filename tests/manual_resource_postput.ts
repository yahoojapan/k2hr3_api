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
import type	{ valTypeAll, valTypeAllObject }	from '../src/lib/types';
import type	{ ClientRequest, IncomingMessage }	from 'http';

//
// Hostname and port from env
//
const hostname	= apiutil.getSafeString(process.env.APIHOST);
const hostport	= apiutil.getSafeString(process.env.APIPORT);
const is_https	= apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Types
//
interface ResourceBody {
	type:	string;
	data:	valTypeAll;
	keys:	valTypeAllObject | string;
	name?:	string | null;
	alias?:	string[] | string | null;
	port?:	string;
	cuk?:	string;
	role?:	string;
}

//
// Request API for test
//
function postV1Resource(method: string, token: string | null, querypath: string | null, name: string | null, datatype: string, data: string | null, reskeys: valTypeAllObject | string, alias?: string[] | string | null, port?: number, cuk?: string, roleyrn?: string): void
{
	let strbody	= '';
	let	clength	= 0;
	let	cpath	= '/v1/resource' + apiutil.getSafeString(querypath);

	if(!apiutil.isSafeString(datatype) || (!apiutil.compareCaseString('string', datatype) && !apiutil.compareCaseString('object', datatype))){
		datatype = 'string';							// default data type is string
	}

	if(apiutil.compareCaseString('post', method)){
		// case for POST
		let	tmpData: valTypeAll;
		if(apiutil.compareCaseString('object', apiutil.getSafeString(datatype)) && apiutil.checkSimpleJSON(data)){
			// If datatype is object, data is needed to decode JSON to object here.
			tmpData = apiutil.parseJSON(data);
		}else{
			tmpData = data;
		}

		const	tmpResource: ResourceBody = {
			'type':	datatype,
			'data':	tmpData,							// if datatype is string, this includes control codes
			'keys':	reskeys
		};

		if(apiutil.isSafeString(name)){
			tmpResource.name	= name;
		}
		if(apiutil.isSafeEntity(alias)){
			tmpResource.alias	= alias;
		}
		if(apiutil.isSafeNumber(port)){
			tmpResource.port	= String(port);
		}
		if(apiutil.isSafeEntity(cuk)){
			tmpResource.cuk	= cuk;
		}
		if(apiutil.isSafeString(roleyrn)){
			tmpResource.role	= roleyrn;
		}

		const	body = {
			'resource': tmpResource
		};

		strbody	= JSON.stringify(body);
		clength	= strbody.length;

	}else if(apiutil.compareCaseString('put', method)){
		// case for PUT
		let urlarg		= '';
		let already_set	= false;

		if(apiutil.isString(name)){
			urlarg		+= already_set ? '&name=' : '?name=';
			urlarg		+= name;
			already_set	= true;
		}
		if(apiutil.isString(datatype)){
			urlarg		+= already_set ? '&type=' : '?type=';
			urlarg		+= datatype;
			already_set	= true;
		}
		if(apiutil.isString(data)){
			urlarg		+= already_set ? '&data=' : '?data=';
			if(apiutil.compareCaseString('string', datatype)){
				urlarg		+= JSON.stringify(data);		// if data is string, data includes control codes, so it is converted to JSON.
			}else{
				urlarg		+= data;						// if data is json, data is already json formatted.
			}
			already_set	= true;
		}
		if(apiutil.isSafeEntity(reskeys)){
			urlarg		+= already_set ? '&keys=' : '?keys=';
			urlarg		+= JSON.stringify(reskeys);			// keys is converted to JSON
			already_set	= true;
		}
		if(apiutil.isSafeEntity(alias)){
			urlarg		+= already_set ? '&alias=' : '?alias=';
			urlarg		+= JSON.stringify(alias);			// alias is converted to JSON
			already_set	= true;
		}
		if(apiutil.isSafeNumber(port)){
			urlarg		+= already_set ? '&port=' : '?port=';
			urlarg		+= String(port);					// port is converted to String
			already_set	= true;
		}
		if(apiutil.isSafeEntity(cuk)){
			urlarg		+= already_set ? '&cuk=' : '?cuk=';
			urlarg		+= JSON.stringify(cuk);				// cuk is converted to JSON
			already_set	= true;
		}
		if(apiutil.isSafeString(roleyrn)){
			urlarg		+= already_set ? '&role=' : '?role=';
			urlarg		+= roleyrn;
			already_set	= true;
		}
		clength	= 0;
		cpath	+= encodeURI(urlarg);

		r3logger.dlog('set parameters : ' + JSON.stringify(already_set));
	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	clength,
		'X-Auth-Token':		(apiutil.isSafeString(token) ? token : undefined)
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

//
// Utility for inputting token for three pattern
//
// callback(error, token type, token string)
//
function rawInputToken(callback: (error: string | null, token_type?: string | null, token?: string | null) => void): void
{
	const _callback = callback;

	cliutil.getConsoleInput('Token type(USER/ROLE/NULL(empty))                         : ', true, false, function(isbreak: boolean, token_type?: string | null): void
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

		cliutil.getConsoleInput(_token_type + ' Token string                                         : ', true, false, function(isbreak: boolean, token?: string | null): void
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
// Utility for input keys
//
function rawGetInputKeys(str: string): valTypeAllObject | string | null
{
	if(!apiutil.isSafeString(str)){
		// empty value
		return '';
	}else if(apiutil.compareCaseString('null', apiutil.getSafeString(str))){
		// null value
		return null;
	}else if(apiutil.checkSimpleJSON(str)){
		// json
		const	tmp_keys = apiutil.parseJSON(str);
		if(apiutil.isSafeString(tmp_keys)){
			// string
			return tmp_keys;
		}else if(apiutil.isPlainObject(tmp_keys)){
			// object
			return tmp_keys;
		}else{
			// input error
			console.log('input resource key(' + str + ') is somthing wrong.');
			return null;
		}
	}else{
		// key=val,key=val...
		const	result: valTypeAllObject = {};

		// parse ','
		const rkeyarr = str.split(',');
		for(let cnt = 0; cnt < rkeyarr.length; ++cnt){
			const	rkeyval				= rkeyarr[cnt].trim();
			const	rkeyvalarr			= rkeyval.split('=');
			let		rkey: string | null = null;
			let		rval: string | null = null;
			for(let cnt2 = 0; cnt2 < rkeyvalarr.length; ++cnt2){
				if(null === rkey){
					rkey	= rkeyvalarr[cnt2].trim();
				}else if(null === rval){
					rval	= rkeyvalarr[cnt2].trim();
				}else{
					// many separator(=) in value
					console.log('input resource sub key(' + rkey + ') has many separator(=) in value(' + rkeyarr[cnt] + '), but continue...');
					rval	+= '=' + rkeyvalarr[cnt2];	// not trim
				}
			}
			if(apiutil.isSafeString(rkey)){
				result[rkey] = rval;
			}else{
				// input error
				console.log('input key value something wrong : ' + str);
				return null;
			}
		}
		return result;
	}
}

//
// Run
//
cliutil.getConsoleInput('Method(POST/PUT)                                          : ', true, false, function(isbreak: boolean, method?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}

	let _method: string;
	if(apiutil.compareCaseString('post', apiutil.getSafeString(method))){
		_method	= 'POST';
	}else if(apiutil.compareCaseString('put', apiutil.getSafeString(method))){
		_method	= 'PUT';
	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	rawInputToken(function(error: string | null, token_type?: string | null, token?: string | null): void
	{
		if(null !== error){
			console.log(error);
			process.exit(0);
		}
		const _token_type	= apiutil.isSafeString(token_type) ? token_type : null;
		const _token		= apiutil.isSafeString(token) ? token : null;

		cliutil.getConsoleInput('Resource name(path)                                       : ', true, false, function(isbreak: boolean, name?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}
			const _name = apiutil.getSafeString(name);

			cliutil.getConsoleInput('         data type(string(str) or object(obj))            : ', true, false, function(isbreak: boolean, datatype?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}

				let _datatype	= apiutil.getSafeString(datatype);
				let is_string	= false;
				if(apiutil.compareCaseString('string', _datatype) || apiutil.compareCaseString('str', _datatype)){
					_datatype	= 'string';
					is_string	= true;
				}else if(apiutil.compareCaseString('object', _datatype) || apiutil.compareCaseString('obj', _datatype) || apiutil.compareCaseString('json', _datatype)){
					_datatype	= 'object';
					is_string	= false;
				}else{
					console.log('data type must be STRING or OBJECT : ' + datatype);
					process.exit(0);
				}

				cliutil.inputObjectData(is_string, function(isbreak: boolean, data?: string | null): void
				{
					if(isbreak){
						process.exit(0);
					}
					// [NOTE]
					// if data type is string, data has CR code = '\n'
					//
					const _data = apiutil.isSafeString(data) ? data : null;

					process.stdout.write('         key-value(following for example)                   \n');
					process.stdout.write('             ex.1) empty   -> (empty)                       \n');
					process.stdout.write('             ex.2) null    -> null                          \n');
					process.stdout.write('             ex.3) key=val -> key01=val01,key02=val02,..    \n');
					process.stdout.write('             ex.4) JSON    -> <JSON string for object>      \n');
					cliutil.getConsoleInput('         input key value (one of example format)          : ', true, false, function(isbreak: boolean, reskeys?: string | null): void
					{
						if(isbreak){
							process.exit(0);
						}
						let _reskeys: valTypeAllObject | string | null;
						let _querypath: string | null;

						if(null === (_reskeys = rawGetInputKeys(apiutil.getSafeString(reskeys)))){
							process.exit(0);
						}

						if(!apiutil.isSafeString(_token_type)){
							// no token
							_querypath = '/' + _name;

							cliutil.getConsoleInput('         port number(0=any(empty default))                : ', true, false, function(isbreak: boolean, port?: string | null): void
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

								cliutil.getConsoleInput('         cuk(allow empty)                                 : ', true, false, function(isbreak: boolean, cuk?: string | null): void
								{
									if(isbreak){
										process.exit(0);
									}
									let _cuk: string | undefined;
									if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
										_cuk = cuk.trim();
									}

									cliutil.getConsoleInput('         Role full yrn path for resource                  : ', true, false, function(isbreak: boolean, roleyrn?: string | null): void
									{
										if(isbreak){
											process.exit(0);
										}
										if(!apiutil.isSafeString(roleyrn)){
											process.exit(0);
										}
										const _roleyrn = roleyrn;

										// run
										postV1Resource(_method, _token, _querypath, null, _datatype, _data, _reskeys, null, _port, _cuk, _roleyrn);
									});
								});
							});

						}else if('USER' === _token_type){
							// user token
							_querypath = null;

							cliutil.getConsoleInput('         alias(specify null/(empty)/yrn multiple with \',\'): ', true, false, function(isbreak: boolean, alias?: string | null): void
							{
								if(isbreak){
									process.exit(0);
								}
								let _alias: string | string[] | null;

								if(!apiutil.isSafeString(alias)){
									_alias = '';
								}else if(apiutil.compareCaseString('null', apiutil.getSafeString(alias))){
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
								postV1Resource(_method, _token, _querypath, _name, _datatype, _data, _reskeys, _alias);
							});

						}else if('ROLE' === _token_type){
							// role token
							_querypath = '/' + _name;

							// run
							postV1Resource(_method, _token, _querypath, null, _datatype, _data, _reskeys, null);
						}else{
							// why?
							process.exit(0);
						}
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
