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
 * CREATE:   Tue Dec 19 2017
 * REVISION:
 *
 */

'use strict';

var	common		= require('./auto_common');				// Common objects for Chai
var	chai		= common.chai;							// eslint-disable-line no-unused-vars
var	chaiHttp	= common.chaiHttp;						// eslint-disable-line no-unused-vars
var	app			= common.app;							// eslint-disable-line no-unused-vars
var	assert		= common.assert;						// eslint-disable-line no-unused-vars
var	expect		= common.expect;						// eslint-disable-line no-unused-vars
var	subproc		= require('./auto_subprocesses');

//--------------------------------------------------------------
// Before in global section
//--------------------------------------------------------------
before(function(){										// eslint-disable-line no-undef
	//
	// Start all sub processes
	//
	subproc.start(this);
});

//--------------------------------------------------------------
// After in global section
//--------------------------------------------------------------
after(function(){										// eslint-disable-line no-undef
	//
	// Stop all sub processes
	//
	subproc.stop(this);
});

//--------------------------------------------------------------
// BeforeEach in global section
//--------------------------------------------------------------
beforeEach(function(){									// eslint-disable-line no-undef
	// Nothing to do
});

//--------------------------------------------------------------
// AfterEach in global section
//--------------------------------------------------------------
afterEach(function(){									// eslint-disable-line no-undef
	// Nothing to do
});

//--------------------------------------------------------------
// Main describe section
//--------------------------------------------------------------
describe('ALL K2HR3 API TEST', function(){				// eslint-disable-line no-undef
	//
	// Before in describe section
	//
	before(function(){									// eslint-disable-line no-undef
		// Nothing to do
	});

	//
	// After in describe section
	//
	after(function(){									// eslint-disable-line no-undef
		// Nothing to do
	});

	//
	// Sub testing scripts
	//
	describe('SUB API TEST: VERSION', function(){		// eslint-disable-line no-undef
		require('./auto_version');
	});

	describe('SUB API TEST: USER TOKEN', function(){	// eslint-disable-line no-undef
		require('./auto_usertokens');
	});

	describe('SUB API TEST: LIST', function(){			// eslint-disable-line no-undef
		require('./auto_list');
	});

	describe('SUB API TEST: RESOURCE', function(){		// eslint-disable-line no-undef
		require('./auto_resource');
	});

	describe('SUB API TEST: POLICY', function(){		// eslint-disable-line no-undef
		require('./auto_policy');
	});

	describe('SUB API TEST: ROLE', function(){			// eslint-disable-line no-undef
		require('./auto_role');
	});

	describe('SUB API TEST: TENANT', function(){		// eslint-disable-line no-undef
		require('./auto_tenant');
	});

	describe('SUB API TEST: ACR', function(){			// eslint-disable-line no-undef
		require('./auto_acr');
	});

	describe('SUB API TEST: SERVICE', function(){		// eslint-disable-line no-undef
		require('./auto_service');
	});

	describe('SUB API TEST: USERDATA', function(){		// eslint-disable-line no-undef
		require('./auto_userdata');
	});

	describe('SUB API TEST: EXTDATA', function(){		// eslint-disable-line no-undef
		require('./auto_extdata');
	});

	describe('SUB PROC TEST: WATCHER', function(){		// eslint-disable-line no-undef
		require('./auto_watcher');
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
