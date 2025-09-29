#!/usr/bin/env node
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

//
// Module dependencies.
//
import	app				from '../app';
import	debug			from 'debug';
import	fs				from 'fs';
import	os				from 'os';
import	cluster			from 'cluster';
import	* as https		from 'https';
import	* as http		from 'http';
import	apiutil			from '../lib/k2hr3apiutil';
import	{ r3ApiConfig }	from '../lib/k2hr3config';

const	dbg		= debug('k2hr3-api:server');
const	numCPUs	= os.cpus().length;
const	apiConf	= new r3ApiConfig();

const	key		= apiConf.getPrivateKey();			// allow empty
const	cert	= apiConf.getCert();				// allow empty
const	ca		= apiConf.getCA();					// allow empty
const	user	= apiConf.getRunUser();				// allow empty
const	port	= apiConf.getPort();

let server: http.Server | https.Server;

//
// Event listener for HTTP server "error" event.
//
const onError = (error: NodeJS.ErrnoException): void => {

	if('listen' !== error.syscall){
		throw error;
	}
	const bind = apiutil.isString(port) ? ('Pipe ' + port) : ('Port ' + String(port));

	// handle specific listen errors with friendly messages
	switch(error.code){
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;

		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;

		default:
			throw error;
	}
};

//
// Event listener for HTTP server "listening" event.
//
const onListening = () : void => {

	const addr = server.address();

	if(!apiutil.isSafeEntity(addr)){
		dbg('Server address is null');
	}else{
		if(apiutil.isString(addr)){
			const	bind = 'pipe ' + addr;
			dbg('Listening on ' + bind);
		}else if(apiutil.isSafeNumeric(addr.port)){
			const	bind = 'port ' + String(addr.port);
			dbg('Listening on ' + bind);
		}else{
			dbg('Server address is unknown');
		}
	}
};

//
// Setup console logging
//
apiConf.setConsoleLogging(__dirname + '/..', false);								// replace output from stdout/stderr to file if set in config

if(cluster.isPrimary && (!apiutil.isSafeEntity(apiConf.isMultiProc()) || false !== apiConf.isMultiProc())){
	console.log(`Master ${process.pid} is running`);

	// Fork workers.
	for(let cnt = 0; cnt < numCPUs; ++cnt){
		cluster.fork();
	}
	cluster.on('exit', (worker: cluster.Worker, code: number, signal: string | null): void => {
		if(apiutil.isString(signal)){
			console.log(`worker was killed by signal: ${signal}`);
		}else if(0 !== code){
			console.log(`worker exited with error code: ${code}`);
		}else{
			console.log(`worker ${worker.process.pid} died`);
		}
	});

}else{
	//
	// Get port from environment and store in Express.
	//
	let	options = {};
	let	secure	= false;

	//
	// scheme
	//
	if('https' == apiConf.getScheme() || 'HTTPS' == apiConf.getScheme()){
		secure	= true;
		options = {
			key:	fs.readFileSync(key),
			cert:	fs.readFileSync(cert),
			ca:		fs.readFileSync(ca)
		};
	}else if('http' == apiConf.getScheme() || 'HTTP' == apiConf.getScheme()){
		secure	= false;
	}else{
		console.log('scheme value(' + apiConf.getScheme() + ') in config is wrong');
		process.exit(1);
	}

	//
	// Others
	//
	const	hostname = os.hostname() || '127.0.0.1';

	//
	// Store in Express.
	//
	app.set('port', port);

	//
	// Create HTTP server.
	//
	if(secure){
		server = https.createServer(options, app);
	}else{
		server = http.createServer(app);
	}

	//
	// Listen on provided port, on all network interfaces.
	//
	server.listen(port, (): void => {
		if(apiutil.isSafeString(user)){
			console.log('Attempting setuid to user "' + user + '"...');
			if(apiutil.isFunction(process.setuid)){
				try{
					process.setuid(user);
					console.log('Succeeded to setuid');
				}catch(err){
					console.log('Failed to setuid', JSON.stringify(err));
					process.exit(1);
				}
			}
		}
	});

	server.on('error', onError);
	server.on('listening', onListening);

	console.log('Server running at ' + apiConf.getScheme() + '://' + hostname + ':' + port + '/');
	console.log(`Worker ${process.pid} started`);
}

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
