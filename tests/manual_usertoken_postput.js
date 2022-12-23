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
var	is_https = apiutil.compareCaseString('yes', process.env.HTTPS_ENV);

//
// Request API for test
//
function postV1UserTokens(method, token, othertoken, user, passwd, tenant)
{
	/* eslint-disable indent, no-mixed-spaces-and-tabs */
	var	headers		= {
						'Content-Type':		'application/json'
					   };
	var	options		= {	'host':				hostname,
						'port':				hostport,
						'method':			method
					  };
	var	strbody		= '';
	/* eslint-enable indent, no-mixed-spaces-and-tabs */

	// set token if exists
	var	is_user_cred_type = true;
	if(apiutil.isSafeString(token)){
		headers['x-auth-token']	= 'U=' + token;
		is_user_cred_type		= false;
	}else if(apiutil.isSafeString(othertoken)){
		headers['x-auth-token']	= 'U=' + othertoken;
		is_user_cred_type		= false;
	}

	if(apiutil.compareCaseString('post', method)){
		// case for POST

		/* eslint-disable indent, no-mixed-spaces-and-tabs */
		var	body;
		if(is_user_cred_type){
			body	= {
						'auth': {
							'tenantName':	apiutil.isSafeString(tenant) ? tenant : '',
							'passwordCredentials':	{
								'username':	user,
								'password':	passwd
							}
						}
					  };
		}else{
			body	= {
						'auth': {
							'tenantName':	apiutil.isSafeString(tenant) ? tenant : ''
						}
					  };
		}
		/* eslint-enable indent, no-mixed-spaces-and-tabs */

		strbody						= JSON.stringify(body);
		headers['Content-Length']	= strbody.length;
		options.headers				= headers;
		options.path				= '/v1/user/tokens';

	}else if(apiutil.compareCaseString('put', method)){
		// case for PUT
		var urlarg		= '';
		var	already_set	= false;
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
		headers['Content-Length']	= 0;
		options.headers				= headers;
		options.path				= '/v1/user/tokens' + encodeURI(urlarg);

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

		res.on('data', function (chunk) {
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
	req.on('error', function(e) {
		r3logger.elog('problem with request: ' + e.message);
	});

	// write data to request body
	if('' !== strbody){
		req.write(strbody);
	}
	req.end();
}

cliutil.getConsoleInput('Method(POST/PUT)               : ', true, false, function(isbreak, method)
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

	cliutil.getConsoleInput('Type(CRED/TOKEN/OTHER)         : ', true, false, function(isbreak, type)
	{
		if(isbreak){
			process.exit(0);
		}
		var	_type = type;

		if('' === apiutil.getSafeString(_type) || apiutil.compareCaseString('cred', apiutil.getSafeString(_type))){
			//
			// User credentials
			//
			cliutil.getConsoleInput('Username                       : ', true, false, function(isbreak, username)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_username = username;

				// if not jpopsdb api for keystone, we must set passwd.
				//
				cliutil.getConsoleInput('Password(null for not using pw): ', false, false, function(isbreak, passwd)
				{
					if(isbreak){
						process.exit(0);
					}

					var	_passwd = passwd;
					if('' === apiutil.getSafeString(_passwd)){
						// [NOTE]
						// If passwd is empty, we set null for passwd.
						// You can specify your keystone which does not need to set passwd for getting credential.
						//
						_passwd = null;
					}

					cliutil.getConsoleInput('Tenant                         : ', true, false, function(isbreak, tenant)
					{
						if(isbreak){
							process.exit(0);
						}
						var	_tenant = null;

						if('' === apiutil.getSafeString(tenant) || apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
							_tenant = null;
						}else{
							_tenant = tenant;
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
			cliutil.getConsoleInput('Unscoped user token            : ', true, false, function(isbreak, token)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_token = token;

				cliutil.getConsoleInput('Tenant                         : ', true, false, function(isbreak, tenant)
				{
					if(isbreak){
						process.exit(0);
					}
					if('' === apiutil.getSafeString(tenant) || apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
						console.log('using unscoped token, need tenant name.');
						process.exit(0);
					}
					var	_tenant = tenant;

					// run
					postV1UserTokens(_method, _token, null, null, null, _tenant);
				});

			});

		}else if('' === apiutil.getSafeString(_type) || apiutil.compareCaseString('other', apiutil.getSafeString(_type))){
			//
			// other token from other(openstack) authorization system
			//
			cliutil.getConsoleInput('Other system token             : ', true, false, function(isbreak, token)
			{
				if(isbreak){
					process.exit(0);
				}
				var	_token = token;

				cliutil.getConsoleInput('Tenant(allow null/skip)        : ', true, false, function(isbreak, tenant)
				{
					if(isbreak){
						process.exit(0);
					}
					var	_tenant = tenant;
					if('' === apiutil.getSafeString(tenant) || apiutil.compareCaseString('null', apiutil.getSafeString(tenant))){
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
