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
function deleteV1Tenant(token: string, name: string, id: string, remove_all: boolean): void
{
	let	cpath: string;
	if(remove_all){
		cpath = '/v1/tenant' + encodeURI('?tenant=' + name) + '&' + encodeURI('id=' + id);
	}else{
		cpath = '/v1/tenant/' + name + encodeURI('?id=' + id);
	}

	const	agent	= is_https ? https : http;
	const	headers = {
		'Content-Type':		'application/json',
		'Content-Length':	0,
		'X-Auth-Token':		token
	};
	const	options = {
		'host':					hostname,
		'port':					hostport,
		'path': 				cpath,
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
// run
//
cliutil.getConsoleInput('Unscoped(or Scoped) user token       : ', true, false, function(isbreak: boolean, token?: string | null): void
{
	if(isbreak){
		process.exit(0);
	}
	const _token = apiutil.getSafeString(token);

	cliutil.getConsoleInput('Tenant name                          : ', true, false, function(isbreak: boolean, tenant?: string | null): void
	{
		if(isbreak){
			process.exit(0);
		}

		if(!apiutil.isSafeString(tenant)){
			console.log('method DELETE must specify tenant name');
			process.exit(0);
		}
		const _tenant = apiutil.getSafeString(tenant);

		cliutil.getConsoleInput('Tenant id                            : ', true, false, function(isbreak: boolean, id?: string | null): void
		{
			if(isbreak){
				process.exit(0);
			}

			if(!apiutil.isSafeString(id)){
				console.log('method DELETE must specify tenant id');
				process.exit(0);
			}
			const _id = apiutil.getSafeString(id);

			cliutil.getConsoleInput('Remove tenant(yes/no(default))       : ', true, false, function(isbreak: boolean, remove_all?: string | null): void
			{
				if(isbreak){
					process.exit(0);
				}

				let _remove_all: boolean;
				if(!apiutil.isSafeString(remove_all) || 'no' == remove_all || 'n' == remove_all){
					_remove_all = false;
				}else if('yes' == remove_all || 'y' == remove_all){
					_remove_all = true;

					if(0 !== _tenant.indexOf('local@')){
						console.log('Need tenant name started with local@ for remove it.');
						process.exit(0);
					}
				}else{
					console.log('input must be yes or no(null)');
					process.exit(0);
				}

				//
				// Run
				//
				deleteV1Tenant(_token, _tenant, _id, _remove_all);
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
