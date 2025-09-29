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
 * CREATE:   Wed Oct 24 2018
 * REVISION:
 *
 */

//
// Module dependencies.
//
import apiutil			from '../lib/k2hr3apiutil';
import watchobj			from '../lib/ipwatch';
import r3logger			from '../lib/dbglogging';

import { r3ApiConfig }	from '../lib/k2hr3config';
const apiConf	= new r3ApiConfig();

//
// Setup console logging
//
apiConf.setConsoleLogging(__dirname + '/..', true);								// replace output from stdout/stderr to file if set in config

// Globals
let	intervalobj: NodeJS.Timeout | null = null;

//
// Process/Signal handlering
//
const procSignal = (reason: string, code?: number): void => {

	if(apiutil.compareCaseString(reason, 'exit')){
		r3logger.elog('K2HR3 watcher exit with status code : ' + (apiutil.isSafeNumber(code) ? code.toString() : 'unknown'));
	}else{
		r3logger.elog('K2HR3 watcher caught signal : ' + apiutil.getSafeString(reason));
	}
	if(intervalobj){
		clearInterval(intervalobj);
		intervalobj = null;
	}
};

process.on('exit',		(code: number) => {	procSignal('exit', code);	});
process.on('SIGHUP',	() => {	procSignal('SIGHUP');	});
process.on('SIGINT',	() => {	procSignal('SIGINT');	});
process.on('SIGBREAK',	() => {	procSignal('SIGBREAK');	});
process.on('SIGTERM',	() => {	procSignal('SIGTERM');	});

//
// OneShot callback
//
const oneshotCallback = (result: unknown): void => {

	if(apiutil.isBoolean(result) && result){
		r3logger.dlog('K2HR3 watcher oneshot result : Succeed');
		process.exit(0);
	}else{
		r3logger.elog('K2HR3 watcher oneshot result : Failed');
		process.exit(1);
	}
};

//
// Process parameter
//
let	oneshotCB = null;
if(apiutil.isNotEmptyArray(process.argv)){
	for(let cnt = 2; cnt < process.argv.length; ++cnt){						// argv[0] = 'node', argv[1] = 'this program'
		if(	apiutil.isSafeString(process.argv[cnt])						||
			apiutil.compareCaseString(process.argv[cnt], '--oneshot')	||
			apiutil.compareCaseString(process.argv[cnt], '-os')			)
		{
			oneshotCB = oneshotCallback;
		}
	}
}

//
// Check wathcer type
//
if(watchobj.isNocheckType() || watchobj.isListenerType()){
	r3logger.elog('K2HR3 watcher type defined ' + watchobj.getType() + ' in configuration, thus could not run watcher.');
	process.exit(1);
}

//
// Run watcher interval loop
//
intervalobj = watchobj.watchAddressesAlive(oneshotCB);
if(!intervalobj){
	if(null != oneshotCB){
		// nothig to do here
	}else{
		r3logger.elog('K2HR3 watcher could not run.');
		process.exit(1);
	}
}

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
