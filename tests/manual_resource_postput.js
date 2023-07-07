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

// Debug logging objects
var r3logger	= require('../lib/dbglogging');

//
// Hostname and port from env
//
var hostname = apiutil.getSafeString(process.env.APIHOST);
var	hostport = apiutil.getSafeString(process.env.APIPORT);
var	is_https	= apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function postV1Resource(method, token, querypath, name, datatype, data, reskeys, alias, port, cuk, roleyrn)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	strbody		= '';
	var	headers		= {
						'Content-Type':		'application/json',
					  };
	if(apiutil.isSafeString(token)){
		headers['X-Auth-Token']	= token;
	}
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'path': 			'/v1/resource' + apiutil.getSafeString(querypath),
						'method':			method
					  };
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	if(!apiutil.compareCaseString('string', datatype) && !apiutil.compareCaseString('object', datatype)){
		datatype = 'string';								// default data type is string
	}

	if(apiutil.compareCaseString('post', method)){
		// case for POST
		if(apiutil.compareCaseString('object', datatype)){
			// If datatype is object, data is needed to decode JSON to object here.
			data = apiutil.parseJSON(data);
		}

		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	body	= {	'resource':
						{
							'type':			datatype,
							'data':			data,			// if datatype is string, this includes control codes
							'keys':			reskeys
						}
					  };
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		if(apiutil.isSafeString(name)){
			body.resource.name	= name;
		}
		if(apiutil.isSafeEntity(alias)){
			body.resource.alias	= alias;
		}
		if(apiutil.isSafeEntity(port) && !isNaN(port)){
			body.resource.port	= String(port);
		}
		if(apiutil.isSafeEntity(cuk)){
			body.resource.cuk	= cuk;
		}
		if(apiutil.isSafeString(roleyrn)){
			body.resource.role	= roleyrn;
		}

		strbody						= JSON.stringify(body);
		headers['Content-Length']	= strbody.length;
		options.headers				= headers;

	}else if(apiutil.compareCaseString('put', method)){
		// case for PUT
		var urlarg		= '';
		var	already_set	= false;
		if(apiutil.isSafeString(name)){
			urlarg		+= already_set ? '&name=' : '?name=';
			urlarg		+= name;
			already_set	= true;
		}
		if('' === datatype || apiutil.isSafeString(datatype)){
			urlarg		+= already_set ? '&type=' : '?type=';
			urlarg		+= datatype;
			already_set	= true;
		}
		if('' === data || apiutil.isSafeString(data)){
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
		if(apiutil.isSafeEntity(port) && !isNaN(port)){
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

		headers['Content-Length']	= 0;
		options.headers				= headers;
		options.path				+= encodeURI(urlarg);

	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	r3logger.dlog('request options   = ' + JSON.stringify(options));
	r3logger.dlog('request headers   = ' + JSON.stringify(headers));
	r3logger.dlog('request body      = ' + strbody);

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
function rawInputToken(callback)
{
	var	_callback = callback;

	cliutil.getConsoleInput('Token type(USER/ROLE/NULL(empty))                         : ', true, false, function(isbreak, token_type)
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

		cliutil.getConsoleInput(_token_type + ' Token string                                         : ', true, false, function(isbreak, token)
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
// Utility for input keys
//
function rawGetInputKeys(str)
{
	var	result;
	if('' === apiutil.getSafeString(str)){
		// empty value
		result = '';
	}else if(apiutil.compareCaseString('null', apiutil.getSafeString(str))){
		// null value
		result = null;
	}else{
		// try parse str as JSON string
		try{
			// parse JSON
			result = JSON.parse(str);
		}catch(err){
			// key=val,key=val...
			result = {};
			// parse ','
			var	rkeyarr	= str.split(',');
			for(var cnt = 0; cnt < rkeyarr.length; ++cnt){
				var	rkeyval		= rkeyarr[cnt].trim();
				var	rkeyvalarr	= rkeyval.split('=');
				var	rkey		= null;
				var	rval		= null;
				for(var cnt2 = 0; cnt2 < rkeyvalarr.length; ++cnt2){
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
					return undefined;
				}
			}
		}
	}
	return result;
}

//
// Run
//
cliutil.getConsoleInput('Method(POST/PUT)                                          : ', true, false, function(isbreak, method)
{
	if(isbreak){
		process.exit(0);
	}

	var	_method;
	if(apiutil.compareCaseString('post', method)){
		_method	= 'POST';
	}else if(apiutil.compareCaseString('put', method)){
		_method	= 'PUT';
	}else{
		console.log('method must be POST or PUT : ' + method);
		process.exit(0);
	}

	rawInputToken(function(error, token_type, token)
	{
		if(null !== error){
			console.log(error);
			process.exit(0);
		}
		var	_token_type	= token_type;
		var	_token		= token;

		cliutil.getConsoleInput('Resource name(path)                                       : ', true, false, function(isbreak, name)
		{
			if(isbreak){
				process.exit(0);
			}
			var	_name = name;

			cliutil.getConsoleInput('         data type(string(str) or object(obj))            : ', true, false, function(isbreak, datatype)
			{
				if(isbreak){
					process.exit(0);
				}

				var	_datatype	= null;
				var	is_string	= false;
				if(apiutil.compareCaseString('string', datatype) || apiutil.compareCaseString('str', datatype)){
					_datatype	= 'string';
					is_string	= true;
				}else if(apiutil.compareCaseString('object', datatype) || apiutil.compareCaseString('obj', datatype) || apiutil.compareCaseString('json', datatype)){
					_datatype	= 'object';
					is_string	= false;
				}else{
					console.log('data type must be STRING or OBJECT : ' + datatype);
					process.exit(0);
				}

				cliutil.inputObjectData(is_string, function(isbreak, data)
				{
					if(isbreak){
						process.exit(0);
					}
					// [NOTE]
					// if data type is string, data has CR code = '\n'
					//
					var	_data = data;

					process.stdout.write('         key-value(following for example)                   \n');
					process.stdout.write('             ex.1) empty   -> (empty)                       \n');
					process.stdout.write('             ex.2) null    -> null                          \n');
					process.stdout.write('             ex.3) key=val -> key01=val01,key02=val02,..    \n');
					process.stdout.write('             ex.4) JSON    -> <JSON string for object>      \n');
					cliutil.getConsoleInput('         input key value (one of example format)          : ', true, false, function(isbreak, reskeys)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_reskeys;
						var	_querypath;

						if(undefined === (_reskeys = rawGetInputKeys(reskeys))){
							process.exit(0);
						}

						if(null === _token_type){
							// no token
							_querypath = '/' + _name;

							cliutil.getConsoleInput('         port number(0=any(empty default))                : ', true, false, function(isbreak, port)
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


								cliutil.getConsoleInput('         cuk(allow empty)                                 : ', true, false, function(isbreak, cuk)
								{
									if(isbreak){
										process.exit(0);
									}
									var	_cuk;
									if(apiutil.isSafeString(cuk) && apiutil.isSafeString(cuk.trim())){
										_cuk = cuk.trim();
									}

									cliutil.getConsoleInput('         Role full yrn path for resource                  : ', true, false, function(isbreak, roleyrn)
									{
										if(isbreak){
											process.exit(0);
										}
										if(!apiutil.isSafeString(roleyrn)){
											process.exit(0);
										}
										var	_roleyrn = roleyrn;

										// run
										postV1Resource(_method, _token, _querypath, null, _datatype, _data, _reskeys, null, _port, _cuk, _roleyrn);
									});
								});
							});

						}else if('USER' === _token_type){
							// user token
							_querypath = null;

							cliutil.getConsoleInput('         alias(specify null/(empty)/yrn multiple with \',\'): ', true, false, function(isbreak, alias)
							{
								if(isbreak){
									process.exit(0);
								}
								var	_alias;

								if('' === apiutil.getSafeString(alias)){
									_alias = '';
								}else if(apiutil.compareCaseString('null', apiutil.getSafeString(alias))){
									_alias = null;
								}else{
									// parse ','
									_alias		= new Array(0);
									var	strarray= alias.split(',');
									for(var cnt = 0; cnt < strarray.length; ++cnt){
										var	strtmp = strarray[cnt].trim();
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
