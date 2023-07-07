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

'use strict';

var	http		= require('http');
var	https		= require('https');

var	cacerts		= require('../lib/cacerts');
var	apiutil		= require('../lib/k2hr3apiutil');
var cliutil		= require('../lib/k2hr3cliutil');
var	r3keys		= require('../lib/k2hr3keys').getK2hr3Keys;

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Hostname and port from env
//
var hostname 	= apiutil.getSafeString(process.env.APIHOST);
var	hostport 	= apiutil.getSafeString(process.env.APIPORT);
var	is_https	= apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function deleteV1Resource(token_type, token, name, data_type, keynames, aliases, port, cuk, roleyrn)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json',
						'Content-Length':	0,
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token'] = token;
	}

	// data type & key name & aliases
	var urlarg		= '';
	var	already_set	= false;
	var	keys		= r3keys();

	// data type
	if(null === data_type){
		// remove all resource data, so no parameter

	}else if(apiutil.compareCaseString(keys.VALUE_ANYDATA_TYPE, data_type) || apiutil.compareCaseString(keys.VALUE_STRING_TYPE, data_type) || apiutil.compareCaseString(keys.VALUE_OBJECT_TYPE, data_type) || apiutil.compareCaseString(keys.VALUE_EXPIRE_TYPE, data_type)){
		urlarg		+= already_set ? '&type=' : '?type=';
		urlarg		+= data_type;
		already_set	= true;

	}else if(apiutil.compareCaseString(keys.VALUE_KEYS_TYPE, data_type)){
		urlarg		+= already_set ? '&type=' : '?type=';
		urlarg		+= data_type;

		if(null !== keynames){
			if(apiutil.isEmptyArray(keynames)){
				console.log('Internal error in test script : Something wrong');
				process.exit(0);
			}
			urlarg		+= '&keynames=';
			urlarg		+= JSON.stringify(keynames);
		}
		already_set	= true;

	}else if(apiutil.compareCaseString(keys.VALUE_ALIAS_TYPE, data_type)){
		urlarg		+= already_set ? '&type=' : '?type=';
		urlarg		+= data_type;

		if(null !== aliases){
			if(apiutil.isEmptyArray(aliases)){
				console.log('Internal error in test script : Something wrong');
				process.exit(0);
			}
			urlarg		+= '&aliases=';
			urlarg		+= JSON.stringify(aliases);
		}
		already_set	= true;

	}else{
		console.log('Internal error in test script : Something wrong');
		process.exit(0);
	}

	// no token
	if(null === token_type){
		// no token
		if(apiutil.isSafeEntity(port) && !isNaN(port)){
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

	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	options		= {
						'host':				hostname,
						'port':				hostport,
						'path': 			'/v1/resource/' + name + encodeURI(urlarg),
						'method':			'DELETE',
						'headers':			headers
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	r3logger.dlog('request options   = ' + JSON.stringify(options));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));

	var	httpobj;
	if(is_https){
		if(null !== cacerts.ca){
			options.ca = cacerts.ca;
		}
		options.rejectUnauthorized	= false;			// always insecure for this manual test
		options.agent	= new https.Agent(options);
		httpobj			= https;
	}else{
		options.agent	= new http.Agent(options);
		httpobj			= http;
	}

	var	req	= httpobj.request(options, function(res)
	{
		var	response = '';
		console.log('RESPONSE CODE = ' + res.statusCode);
		r3logger.dlog('response status   = ' + res.statusCode);
		r3logger.dlog('response header   = ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');

		res.on('data', function (chunk)
		{
			r3logger.dlog('response chunk    = ' + chunk);
			response += chunk;
		});

		res.on('end', function(result)					// eslint-disable-line no-unused-vars
		{
			r3logger.mlog(r3logger.dump(response));		// response is object(or not)
			console.log('RESPONSE BODY = ' + JSON.stringify(response));
			process.exit(0);
		});
	});

	req.on('error', function(e)
	{
		r3logger.elog('problem with request: ' + e.message);
	});
	req.end();
}

//
// Utility for inputting token for three pattern
//
// callback(error, token type, token string)
//
function rawInputToken(callback)
{
	var	_callback = callback;

	cliutil.getConsoleInput('Token type(USER/ROLE/NULL(empty))                               : ', true, false, function(isbreak, token_type)
	{
		if(isbreak){
			_callback('break for inputting token type');
			return;
		}
		var	_token_type	= null;
		var	_prefix		= '';
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

		cliutil.getConsoleInput(_token_type + ' Token string                                               : ', true, false, function(isbreak, token)
		{
			if(isbreak){
				_callback('break for inputting token');
				return;
			}
			if(!apiutil.isSafeString(_token_type) || apiutil.compareCaseString('NULL', _token_type)){
				_callback('token must be string');
				return;
			}
			var	_token = _prefix + token;
			_callback(null, _token_type, _token);
		});
	});
}

//
// Utility for inputting token for three pattern
//
// callback(error, token type, token string)
//
function rawInputDataType(token_type, callback)
{
	var	_callback = callback;

	if('USER' === token_type){
		// user token
		cliutil.getConsoleInput('         Remove data type(ANY/STR/OBJ/KEYS/ALIAS/NULL(all))     : ', true, false, function(isbreak, data_type)
		{
			if(isbreak){
				_callback('break for inputting data type');
				return;
			}
			var	keys = r3keys();

			if(null === data_type || apiutil.compareCaseString('NULL', data_type)){
				_callback(null, null, null, null);

			}else if(apiutil.compareCaseString('ANY', data_type)){
				_callback(null, keys.VALUE_ANYDATA_TYPE, null, null);

			}else if(apiutil.compareCaseString('STR', data_type)){
				_callback(null, keys.VALUE_STRING_TYPE, null, null);

			}else if(apiutil.compareCaseString('OBJ', data_type)){
				_callback(null, keys.VALUE_OBJECT_TYPE, null, null);

			}else if(apiutil.compareCaseString('KEYS', data_type)){
				cliutil.getConsoleInput('         Key Name(in keys)                                      : ', true, false, function(isbreak, keyname)
				{
					if(isbreak){
						_callback('break for inputting key name');
						return;
					}
					var	_keyname;
					if(null === keyname || '' === apiutil.getSafeString(keyname) || apiutil.compareCaseString('NULL', keyname)){
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
				cliutil.getConsoleInput('         Alias Names(null(all), one yrn, or multi yrn with \',\') : ', true, false, function(isbreak, aliases)
				{
					if(isbreak){
						_callback('break for inputting aliases');
						return;
					}
					var	_aliases;
					if(null === aliases || '' === apiutil.getSafeString(aliases) || apiutil.compareCaseString('NULL', aliases)){
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
		cliutil.getConsoleInput('         Remove data type(ANY/STR/OBJ/KEYS)                     : ', true, false, function(isbreak, data_type)
		{
			if(isbreak){
				_callback('break for inputting data type');
				return;
			}
			var	keys = r3keys();

			if(apiutil.compareCaseString('ANY', data_type)){
				_callback(null, keys.VALUE_ANYDATA_TYPE, null, null);

			}else if(apiutil.compareCaseString('STR', data_type)){
				_callback(null, keys.VALUE_STRING_TYPE, null, null);

			}else if(apiutil.compareCaseString('OBJ', data_type)){
				_callback(null, keys.VALUE_OBJECT_TYPE, null, null);

			}else if(apiutil.compareCaseString('KEYS', data_type)){
				cliutil.getConsoleInput('         Key Name(in keys)                                      : ', true, false, function(isbreak, keyname)
				{
					if(isbreak){
						_callback('break for inputting key name');
						return;
					}
					var	_keyname;
					if(null === keyname || '' === apiutil.getSafeString(keyname) || apiutil.compareCaseString('NULL', keyname)){
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
rawInputToken(function(error, token_type, token)
{
	if(null !== error){
		console.log(error);
		process.exit(0);
	}
	var	_token_type	= token_type;
	var	_token		= token;

	cliutil.getConsoleInput('Resource name(path)                                             : ', true, false, function(isbreak, name)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_name = name;

		rawInputDataType(_token_type, function(error, data_type, keynames, aliases)
		{
			if(null !== error){
				console.log(error);
				process.exit(0);
			}
			var	_data_type	= data_type;
			var	_keynames	= keynames;
			var	_aliases	= aliases;

			if('USER' === _token_type || 'ROLE' === _token_type){
				// user token / role token
				// run
				deleteV1Resource(_token_type, _token, _name, _data_type, _keynames, _aliases);

			}else{
				// no token
				cliutil.getConsoleInput('         Port number(0=any(empty))                              : ', true, false, function(isbreak, port)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_port;
					if(null === port || !apiutil.isSafeString(port)){
						_port = 0;
					}else if(!isNaN(port)){
						_port = parseInt(port);
					}else{
						process.exit(0);
					}

					cliutil.getConsoleInput('         CUK(allow empty)                                       : ', true, false, function(isbreak, cuk)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_cuk;
						if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
							_cuk = cuk.trim();
						}

						cliutil.getConsoleInput('         Role full yrn path                                     : ', true, false, function(isbreak, roleyrn)
						{
							if(isbreak){
								process.exit(0);
							}
							if(!apiutil.isSafeString(roleyrn)){
								process.exit(0);
							}
							var	_roleyrn = roleyrn;

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
