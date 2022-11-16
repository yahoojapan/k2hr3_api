/*
 * K2HR3 REST API
 *
 * Copyright 2017 Yahoo! Japan Corporation.
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
 * CREATE:   Tue Dec 19 2017
 * REVISION:
 *
 */

'use strict';

//
// Common Start/Stop sub-processes for before/after in mocha
//
var	execSync	= require('child_process').execSync;			// For before section to launching sub processes

//
// Before : Start all sub processes
//
exports.start = function(parentobj)
{
	console.log('  START TEST K2HDKC:');

	//
	// Change timeout for running sub-processes
	//
	var	orgTimeout = parentobj.timeout(10000);

	//
	// Run chmpx for server node
	//
	var	result = execSync('tests/auto_control_subprocess.sh --start --key server --interval 3 -- chmpx -conf tests/auto_k2hdkc_server.ini -ctlport 18021 -d msg');
	console.log('    - run chmpx for server node: ' + String(result).replace(/\r?\n$/g, ''));

	//
	// Run k2hdkc
	//
	result = execSync('tests/auto_control_subprocess.sh --start --key server --interval 3 -- k2hdkc -conf tests/auto_k2hdkc_server.ini -ctlport 18021 -d msg');
	console.log('    - run k2hdkc: ' + String(result).replace(/\r?\n$/g, ''));

	//
	// Run chmpx for slave node
	//
	result = execSync('tests/auto_control_subprocess.sh --start --key slave --interval 3 -- chmpx -conf tests/auto_k2hdkc_slave.ini -ctlport 18031 -d msg');
	console.log('    - run chmpx for slave node: ' + String(result).replace(/\r?\n$/g, ''));

	//
	// Load default test data to k2hdkc
	//
	result = execSync('tests/k2hdkc_test_load.sh --for_auto_test');
	console.log('    - loaded test data : ' + String(result));
	console.log('');

	//
	// Reset timeout
	//
	parentobj.timeout(orgTimeout);
};

//
// After : Stop all sub processes
//
exports.stop = function(parentobj)
{
	console.log('  STOP TEST K2HDKC:');

	//
	// Change timeout for running sub-processes
	//
	var	orgTimeout = parentobj.timeout(10000);

	//
	// Stop chmpx for slave node
	//
	var	result = execSync('tests/auto_control_subprocess.sh --stop --key slave --interval 3 -- chmpx');
	console.log('    - stop chmpx for slave node: ' + String(result).replace(/\r?\n$/g, ''));

	//
	// Stop k2hdkc
	//
	result = execSync('tests/auto_control_subprocess.sh --stop --key server --interval 3 -- k2hdkc');
	console.log('    - stop k2hdkc: ' + String(result).replace(/\r?\n$/g, ''));

	//
	// Stop chmpx for slave node
	//
	result = execSync('tests/auto_control_subprocess.sh --stop --key server --interval 3 -- chmpx');
	console.log('    - stop chmpx for server node: ' + String(result).replace(/\r?\n$/g, ''));

	//
	// Reset timeout
	//
	parentobj.timeout(orgTimeout);
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
