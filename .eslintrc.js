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
 * CREATE:   Wed Jul 11 2017
 * REVISION:
 *
 */

'use strict';

module.exports = {
	'env': {
		'node':		true,
		'browser':	true,
		'commonjs':	true,
		'es6':		true
	},
	'extends': 'eslint:recommended',
	'parserOptions': {
		'ecmaVersion':	2017
	},
	'rules': {
		'indent': [
			'error',
			'tab',
			{
				'SwitchCase': 1
			}
		],
		'no-console': 0,
		'linebreak-style': [
			'error',
			'unix'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		]
	}
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
