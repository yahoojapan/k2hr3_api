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
 * CREATE:   Wed Jul 14 2017
 * REVISION:
 *
 */

'use strict';

//
// This file is test variable map object.
//
// This file is used by k2hr3template_test_template.txt test template
// for testing. You can specify these files for k2hr3template_test.sh
//

module.exports = {
	'statement_print_test_00':		'value_00',
	'formula_variable_00':			'value_name_00',
	'formula_variable_01': [
		'value_01[0]'
	],
	'formula_variable_02': {
		'value_name_00':			'value_02{value_name_00}'
	},
	'formula_variable_array_01': [
		'array_value_00',
		'array_value_01'
	],
	'formula_variable_object_01': {
		'object_key_00':			'object_value_00',
		'object_key_01':			'object_value_01',
		'object_key_02': [
			'object_value_02_01',
			'object_value_02_02'
		],
		'object_key_03': {
			'object_valkey_03_00':	true,
			'object_valkey_03_01':	'object_valval_03_01'
		}
	},
	'formula_calculate_not_00':		true,
	'formula_calculate_not_01':		false,
	'formula_calculate_inc_00':		0,
	'formula_calculate_dec_00':		2,
	'formula_calculate_set_00': 	0,
	'formula_calculate_set_01': 	100,
	'formula_calculate_plus_00':	10,
	'formula_calculate_plus_01':	20,
	'formula_calculate_plus_02':	'test',
	'formula_calculate_plus_03':	'string',
	'formula_calculate_sub_00':		100,
	'formula_calculate_sub_01':		10,
	'formula_calculate_div_00':		100,
	'formula_calculate_div_01':		10,
	'formula_calculate_mul_00':		5,
	'formula_calculate_mul_01':		20,
	'formula_calculate_rem_00':		35,
	'formula_calculate_rem_01':		6,
	'formula_calculate_lshift_00':	10,
	'formula_calculate_lshift_01':	4,
	'formula_calculate_rshift_00':	43690,
	'formula_calculate_rshift_01':	4,
	'formula_calculate_amp_00':		65535,
	'formula_calculate_amp_01':		43690,
	'formula_calculate_amp_02':		true,
	'formula_calculate_amp_03':		false,
	'formula_calculate_vartbar_00':	21845,
	'formula_calculate_vartbar_01':	43690,
	'formula_calculate_vartbar_02':	true,
	'formula_calculate_vartbar_03':	false,
	'formula_cond_and_00':			null,
	'formula_cond_and_01':			true,
	'formula_cond_and_02':			false,
	'formula_cond_and_03':			0,
	'formula_cond_and_04':			1,
	'formula_cond_and_05':			'string',
	'formula_cond_or_00':			null,
	'formula_cond_or_01':			true,
	'formula_cond_or_02':			false,
	'formula_cond_or_03':			0,
	'formula_cond_or_04':			1,
	'formula_cond_or_05':			'string',
	'formula_cond_less_00':			0,
	'formula_cond_less_01':			1,
	'formula_cond_less_02':			2,
	'formula_cond_great_00':		0,
	'formula_cond_great_01':		1,
	'formula_cond_great_02':		2,
	'formula_cond_lesseq_00':		0,
	'formula_cond_lesseq_01':		1,
	'formula_cond_lesseq_02':		2,
	'formula_cond_greateq_00':		0,
	'formula_cond_greateq_01':		1,
	'formula_cond_greateq_02':		2,
	'formula_cond_eq_00':			null,
	'formula_cond_eq_01':			true,
	'formula_cond_eq_02':			false,
	'formula_cond_eq_03':			0,
	'formula_cond_eq_04':			1,
	'formula_cond_eq_05':			'string',
	'formula_cond_noteq_00':		null,
	'formula_cond_noteq_01':		true,
	'formula_cond_noteq_02':		false,
	'formula_cond_noteq_03':		0,
	'formula_cond_noteq_04':		1,
	'formula_cond_noteq_05':		'string',
	'formula_syntax_if_00':			null,
	'formula_syntax_if_01':			true,
	'formula_syntax_if_02':			false,
	'formula_syntax_if_03':			0,
	'formula_syntax_if_04':			1,
	'formula_syntax_if_05':			'string',
	'formula_syntax_while_00':		null,
	'formula_syntax_while_01':		true,
	'formula_syntax_while_02':		false,
	'formula_syntax_while_03':		0,
	'formula_syntax_while_04':		1,
	'formula_syntax_while_05':		'string',
	'formula_syntax_do_00':			null,
	'formula_syntax_do_01':			true,
	'formula_syntax_do_02':			false,
	'formula_syntax_do_03':			0,
	'formula_syntax_do_04':			1,
	'formula_syntax_do_05':			'string',
	'formula_syntax_for_00':		null,
	'formula_syntax_for_01':		true,
	'formula_syntax_for_02':		false,
	'formula_syntax_for_03':		0,
	'formula_syntax_for_04':		1,
	'formula_syntax_for_05':		'string',
	'formula_syntax_for_06': [
		'string00',
		'string01'
	],
	'formula_syntax_for_07': {
		'key_1':					true,
		'key_2':					false
	},
	'formula_syntax_foreach_00':	[],
	'formula_syntax_foreach_01': [
		null
	],
	'formula_syntax_foreach_02': [
		true,
		false
	],
	'formula_syntax_foreach_03': [
		0,
		1
	],
	'formula_syntax_foreach_04': [
		'string00',
		'string01'
	],
	'formula_syntax_foreach_10':	{},
	'formula_syntax_foreach_11': {
		'key':						null
	},
	'formula_syntax_foreach_12': {
		'key_1':					true,
		'key_2':					false
	},
	'formula_syntax_foreach_13': {
		'key_1':					0,
		'key_2':					1
	},
	'formula_syntax_foreach_14': {
		'key_1':					'string00',
		'key_2':					'string01'
	}
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
