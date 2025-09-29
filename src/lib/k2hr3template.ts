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
 * CREATE:   Wed Jul 11 2017
 * REVISION:
 *
 */

import	apiutil		from './k2hr3apiutil';
import	r3logger	from './dbglogging';

import type	{ resTypeBaseResult, valTypeAll, valTypeAllArray, valTypeAllObject }	from './types';

//---------------------------------------------------------
// Keywords for K2HR3 Template Engine
//---------------------------------------------------------
// Engine type Keywords
const TEMPL_ENGINE_TYPE_PTN			= '^{{#!(.*?)[ \t]*}}[\r\n]*';	// Regex = /^\{\{#\!(.*)[ \t]+\}\}[\r\n]*/
const TEMPL_K2HR3_TEMPLENGINE_KW	= 'k2hr3template';				// This k2hr3template.js keywords

// Template area Keywords
const TEMPL_START_KW				= '{{';
const TEMPL_END_KW					= '}}';
const TEMPL_ESCAPE_START_KW			= '{{{';
const TEMPL_ESCAPE_END_KW			= '}}}';

// Special Keywords
const TEMPL_SEMICOLON_KW			= ';';				// ";" for sentence or "for"
const TEMPL_COMMENT_KW				= '#';				// Comment
const TEMPL_PRINT_KW				= '=';				// Print command, this keyword after '{{'

// Control syntax
const TEMPL_IF_KW					= 'if';				// if
const TEMPL_ELIF_KW					= 'elif';			// elif
const TEMPL_ELSE_KW					= 'else';			// else
const TEMPL_ENDIF_KW				= 'endif';			// endif
const TEMPL_WHILE_KW				= 'while';			// while
const TEMPL_DO_KW					= 'do';				// do(while)
const TEMPL_DONE_KW					= 'done';			// done
const TEMPL_FOR_KW					= 'for';			// for
const TEMPL_FOREACH_KW				= 'foreach';		// foreach
const TEMPL_IN_KW					= 'in';				// "in" for "foreach"
const TEMPL_BREAK_KW				= 'break';			// break
const TEMPL_CONTINUE_KW				= 'continue';		// continue

// Conditions
const TEMPL_AND_KW					= '&&';				// Condition: AND
const TEMPL_OR_KW					= '||';				// Condition: OR
const TEMPL_LESS_KW					= '<';				// Condition: LESS THAN
const TEMPL_GREAT_KW				= '>';				// Condition: GREATER THAN
const TEMPL_LESSEQ_KW				= '<=';				// Condition: LESS EQUAL THAN
const TEMPL_GREATEQ_KW				= '>=';				// Condition: GREATER EQUAL THAN
const TEMPL_EQUAL_KW				= '==';				// Condition: EQUAL
const TEMPL_NOTEQ_KW				= '!=';				// Condition: NOT EQUAL

// One term operator
const TEMPL_NOT_KW					= '!';				// One term operator
const TEMPL_INC_KW					= '++';				// One term operator
const TEMPL_DEC_KW					= '--';				// One term operator

// Binary operator
const TEMPL_SET_KW					= '=';				// Binary operator
const TEMPL_ADD_KW					= '+';				// Binary operator
const TEMPL_SUB_KW					= '-';				// Binary operator
const TEMPL_DIV_KW					= '/';				// Binary operator
const TEMPL_MUL_KW					= '*';				// Binary operator
const TEMPL_REM_KW					= '%';				// Binary operator
const TEMPL_AMP_KW					= '&';				// Binary operator
const TEMPL_VARTBAR_KW				= '|';				// Binary operator
const TEMPL_LSHIFT_KW				= '<<';				// Binary operator
const TEMPL_RSHIFT_KW				= '>>';				// Binary operator

// Array operator
const TEMPL_SQUARE_START_KW			= '[';				// keywords for accessing to array member
const TEMPL_SQUARE_END_KW			= ']';				//
const TEMPL_CURLY_START_KW			= '{';				// keywords for accessing to object member
const TEMPL_CURLY_END_KW			= '}';				//

// String area and escape for it
const TEMPL_SINGLE_QUOTE_KW			= '\'';				// Separator for string value
const TEMPL_DOUBLE_QUOTE_KW			= '"';				// Separator for string value
const TEMPL_ESCAPE_KW				= '\\';				// escape

// Variable area for K2hr3 template
const TEMPL_VALUESEP_KW				= '%';				// Separator for Variable

// Length(size) property
const TEMPL_LENGTH_KW				= '.length';		// length property for array or object variable
const TEMPL_SIZE_KW					= '.size';			// 
const TEMPL_COUNT_KW				= '.count';			// 

// Static values
const TEMPL_NULL_KW					= 'null';			// constant null
const TEMPL_TRUE_KW					= 'true';			// constant true
const TEMPL_FALSE_KW				= 'false';			// constant false

// Radix for static number values 
const TEMPL_HEX_PREFIX_KW			= '0x';				// hex(16) radix
const TEMPL_HEX2_PREFIX_KW			= 'x';				// hex(16) radix
const TEMPL_OCT_PREFIX_KW			= '0o';				// octal(8) radix
const TEMPL_BIN_PREFIX_KW			= '0b';				// binary(2) radix

//
// Calculation type using in Calculate Formula Class
//
const FORMULA_CALC_TYPE_UNKNOWN		= -1;
const FORMULA_CALC_TYPE_NOT			= 0;
const FORMULA_CALC_TYPE_INC			= 1;
const FORMULA_CALC_TYPE_DEC			= 2;
const FORMULA_CALC_TYPE_SET			= 3;
const FORMULA_CALC_TYPE_ADD			= 4;
const FORMULA_CALC_TYPE_SUB			= 5;
const FORMULA_CALC_TYPE_DIV			= 6;
const FORMULA_CALC_TYPE_MUL			= 7;
const FORMULA_CALC_TYPE_REM			= 8;
const FORMULA_CALC_TYPE_AMP			= 9;
const FORMULA_CALC_TYPE_VARTBAR		= 10;
const FORMULA_CALC_TYPE_LSHIFT		= 11;
const FORMULA_CALC_TYPE_RSHIFT		= 12;

//
// Condition type using in Condition Formula Class
//
const FORMULA_COND_TYPE_UNKNOWN		= -1;
const FORMULA_COND_TYPE_AND			= 100;
const FORMULA_COND_TYPE_OR			= 101;
const FORMULA_COND_TYPE_LESS		= 102;
const FORMULA_COND_TYPE_GREAT		= 103;
const FORMULA_COND_TYPE_LESSEQ		= 104;
const FORMULA_COND_TYPE_GREATEQ		= 105;
const FORMULA_COND_TYPE_EQUAL		= 106;
const FORMULA_COND_TYPE_NOTEQ		= 107;

//
// Utility for map
//
const TEMPL_BIN_OP_MAP: Record<string, number> = {
	[TEMPL_SUB_KW]:		FORMULA_CALC_TYPE_SUB,
	[TEMPL_DIV_KW]:		FORMULA_CALC_TYPE_DIV,
	[TEMPL_MUL_KW]:		FORMULA_CALC_TYPE_MUL,
	[TEMPL_REM_KW]:		FORMULA_CALC_TYPE_REM,
	[TEMPL_LSHIFT_KW]:	FORMULA_CALC_TYPE_LSHIFT,
	[TEMPL_RSHIFT_KW]:	FORMULA_CALC_TYPE_RSHIFT
};

const FORMULA_CALAC_TYPE_STR_MAP: Record<number, string> = {
	[FORMULA_CALC_TYPE_SUB]:	'SUB(-)',
	[FORMULA_CALC_TYPE_DIV]:	'DIV(/)',
	[FORMULA_CALC_TYPE_MUL]:	'MUL(*)',
	[FORMULA_CALC_TYPE_REM]:	'REM(%)',
	[FORMULA_CALC_TYPE_LSHIFT]:	'LSHIFT(<<)',
	[FORMULA_CALC_TYPE_RSHIFT]:	'RSHIFT(>>)'
};

const TEMPL_COND_TYPE_MAP: Record<string, number> = {
	[TEMPL_AND_KW]:		FORMULA_COND_TYPE_AND,
	[TEMPL_OR_KW]:		FORMULA_COND_TYPE_OR,
	[TEMPL_LESS_KW]:	FORMULA_COND_TYPE_LESS,
	[TEMPL_GREAT_KW]:	FORMULA_COND_TYPE_GREAT,
	[TEMPL_LESSEQ_KW]:	FORMULA_COND_TYPE_LESSEQ,
	[TEMPL_GREATEQ_KW]:	FORMULA_COND_TYPE_GREATEQ,
	[TEMPL_EQUAL_KW]:	FORMULA_COND_TYPE_EQUAL,
	[TEMPL_NOTEQ_KW]:	FORMULA_COND_TYPE_NOTEQ
};

const FORMULA_COND_TYPE_STR_MAP: Record<number, string> = {
	[FORMULA_COND_TYPE_AND]:		'AND(&&)',
	[FORMULA_COND_TYPE_OR]:			'OR(||)',
	[FORMULA_COND_TYPE_LESS]:		'LESS(<)',
	[FORMULA_COND_TYPE_GREAT]:		'GREAT(>)',
	[FORMULA_COND_TYPE_LESSEQ]:		'LESSEQ(<=)',
	[FORMULA_COND_TYPE_GREATEQ]:	'GREATEQ(<=)',
	[FORMULA_COND_TYPE_EQUAL]:		'EQUAL(==)',
	[FORMULA_COND_TYPE_NOTEQ]:		'NOTEQ(!=)'
};

//---------------------------------------------------------
// Template Statement Objects for K2HR3 Template Engine
//---------------------------------------------------------
// Statement object Array is an array that decomposes the k2hr3 template and holds its contents.
// It is indicated as follows:
//	[
//		{												: Each template area(statement area / not statement area)
//			"isStatement":		true/false				: This is true when the template area is statement({{...}}).
//			"origString":		<string>				: original string
//			"cvtString":		<string>				: converted string(escaped keyword and trimmed when statement area includes formula)
//			"isReplication":	true/false				: true means the statement object is replicated
//			"formUnits":		[						: formula units array for each statement area, if the statement does not have any template object, this is [[cvtString]].
//									[					: One formula(separate ';')
//										"unit string",	: One unit in formula(separate keywords...)
//										"unit string",
//										...
//									],
//									...
//								]
//		},
//		...
//	]
//
// [NOTE]
// If the statement is comment, it's statement area(object) is following as example:
//		{	"isStatement":	true,
//			"origString":	"{{#.....}}",
//			"cvtString":	"#....",
//			"formUnits":	[	[
//									"#",
//									"....."
//							]	]
//		}
//
// If the statement is print, it's statement area(object) is following as example:
//		{	"isStatement":	true,
//			"origString":	"{{=AAAA; BBBB}}",
//			"cvtString":	"=AAAA; BBBB",
//			"formUnits":	[	[
//									"=",
//									"AAAA"
//								],
//								[
//									"BBBB"
//								]
//							]
//		}
//

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Variables
//
type valTypeStatementObject = {
	isStatement:		boolean;
	origString:			string;
	cvtString:			string;
	isReplication:		boolean;
	formUnits:			string[][];
};

type valTypeStatementsArray = valTypeStatementObject[];

type resTypeCreateTemplateObject = resTypeBaseResult & {
	templObj?:			BaseTemplateObject | null;
};

type valTypeTemplateVariablesMap = {
	[key: string]:		valTypeAll;
};

//
// Basic Constructor types
//
type StatementTemplateConstructor = new (...args: unknown[]) => BaseFormulaObject | BaseStatementTemplateObject;

//
// Callbacks
//
type cbTypeLoadTemplte = (errstr: string | null, result: boolean) => void;
type cbTypeTemplateVariableNames = (errstr: string | null, arr: string[]) => void;
type cbTypeExecuteTemplateResult = (result: K2hr3TemplateResult) => void;

//---------------------------------------------------------
// K2HR3 Template Engine Utility : Type chekcer
//---------------------------------------------------------
const isSafeStatementObject = (
	val:				unknown,
	is_check_units?:	boolean
): val is valTypeStatementObject => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	if(	!apiutil.isBoolean(val.isStatement)		||
		!apiutil.isString(val.origString)		||
		!apiutil.isString(val.cvtString)		||
		!apiutil.isBoolean(val.isReplication))
	{
		return false;
	}

	if(!apiutil.isBoolean(is_check_units)){
		is_check_units = true;
	}
	if(is_check_units && !apiutil.isString2DArray(val.formUnits)){
		return false;
	}
	return true;
};

const isSafeStatementsArray = (
	arr:	unknown,
	is_check_units?:	boolean
): arr is valTypeStatementsArray => {

	if(!apiutil.isBoolean(is_check_units)){
		is_check_units = true;
	}
	return apiutil.isArray(arr) && arr.every((element) => isSafeStatementObject(element, is_check_units));
};

const isNotEmptyStatementsArray = (arr: unknown): arr is valTypeStatementsArray => {

	return (isSafeStatementsArray(arr) && 0 !== (arr as valTypeStatementsArray).length);
};

const isReplicationStatementObject = (statementObj: valTypeStatementObject): boolean => {

	if(	!isSafeStatementObject(statementObj, false)	||
		!statementObj.isReplication					)
	{
		return false;
	}
	return true;
};

const isValTypeTemplateVariablesMap = (val: unknown): val is valTypeTemplateVariablesMap => {

	if(!apiutil.isPlainObject(val)){
		return false;
	}
	for(const [, value] of Object.entries(val)){
		if(undefined === value){
			return false;
		}
	}
	return true;
};

const isK2hr3TemplateResult = (val: unknown): val is K2hr3TemplateResult => {

	return (apiutil.isPlainObject(val) && val instanceof K2hr3TemplateResult);
};

const isBaseTemplateObject = (val: unknown): val is BaseTemplateObject => {

	return (apiutil.isPlainObject(val) && val instanceof BaseTemplateObject);
};

const getSafeBaseTemplateObject = (val: unknown): BaseTemplateObject | null => {

	return (isBaseTemplateObject(val) ? val : null);
};

const isBaseFormulaObject = (val: unknown): val is BaseFormulaObject => {

	return (apiutil.isPlainObject(val) && val instanceof BaseFormulaObject);
};

const isSyntaxFormulaObject = (val: unknown): val is SyntaxFormulaObject => {

	return (apiutil.isPlainObject(val) && val instanceof SyntaxFormulaObject);
};

const isCalculateFormulaObject = (val: unknown): val is CalculateFormulaObject => {

	return (apiutil.isPlainObject(val) && val instanceof CalculateFormulaObject);
};

const isConditionFormulaObject = (val: unknown): val is ConditionFormulaObject => {

	return (apiutil.isPlainObject(val) && val instanceof ConditionFormulaObject);
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility : Create K2HR3 Template Objects
//---------------------------------------------------------
// Create one statement object tree and return top of tree object.
//
// return	:	following object
//				{
//					result:		true/false
//					message:	null or <error message string>
//					templObj:	null or BaseTemplateObject object
//				}
//
// [NOTE]
// If object tree is rechained(the parent was included into new object),
// this returns result=true and templObj=null.
//
const createK2hr3TemplateObject = (
	statementsArray:	valTypeStatementsArray,
	parentObject:		BaseTemplateObject | null
): resTypeCreateTemplateObject => {

	const	resobj: resTypeCreateTemplateObject = {result: false, message: null, templObj: null};

	if(!isSafeStatementsArray(statementsArray) || !isNotEmptyStatementsArray(statementsArray)){
		resobj.result	= true;
		resobj.templObj	= null;
		r3logger.elog('templateArray is empty or wrong : ' + JSON.stringify(statementsArray));
		return resobj;
	}
	if(null !== parentObject && !isBaseTemplateObject(parentObject)){
		resobj.result	= false;
		resobj.message	= 'parentObject is not BaseTemplateObject class or subclass : ' + JSON.stringify(parentObject);
		r3logger.elog(resobj.message);
		return resobj;
	}

	let	lastErrorString	= '';
	for(let cnt = 0; cnt < k2hr3StatementObjectList.length; ++cnt){
		// create object
		const	assembleObject = new k2hr3StatementObjectList[cnt]();

		// test assembling
		if(assembleObject.testAssemble(statementsArray)){
			// try assemble
			if(null !== assembleObject.assemble(statementsArray, parentObject)){
				let foundObject: BaseTemplateObject | null;
				for(foundObject = assembleObject; foundObject; foundObject = foundObject.getParentTemplObject()){
					if(parentObject === foundObject.getParentTemplObject()){		// [NOTE] allow parentObject is null
						break;
					}
				}
				if(foundObject){
					// found parent object in assembleObject's parent inheritance tree.
					//
					resobj.result	= true;
					resobj.templObj	= foundObject;
					return resobj;
				}else{
					// not found parent object in assembleObject's parent inheritance tree.
					//
					// This means that the parent of assembleObject points to parent object
					// rather than parentObject as analysis result, and assembleObject does
					// not exist in descendant tree of parentObject.
					// On this case, this function returns resobj.templObj = null, then
					// stop analyzing the statementArray for parentObject's child.
					//
					resobj.result	= true;
					resobj.templObj	= null;
					return resobj;
				}
			}else{
				// could not assemble or something error occurred.
				// then any error message is stocked.
				//
				if(apiutil.isSafeString(lastErrorString.length)){
					lastErrorString += ', ';
				}
				lastErrorString += '(';
				lastErrorString += assembleObject.getError() + ')';
			}
		}else{
			// statement object is not a target
		}
	}

	// not matched
	resobj.result	= false;
	resobj.message	= 'any template class is not matched for templateArray : ' + lastErrorString;

	r3logger.elog(resobj.message);
	return resobj;
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility : Check K2HR3 Template left
//---------------------------------------------------------
// Check the first template statement's unit requires left
// statements.
//
const REQUIRED_LEFT_NO			= 0;
const REQUIRED_LEFT_VARIABLE	= 1;
const REQUIRED_LEFT_CALCULATE	= 2;
const REQUIRED_LEFT_CONDITION	= 4;
const REQUIRED_LEFT_ALL			= (REQUIRED_LEFT_VARIABLE | REQUIRED_LEFT_CALCULATE | REQUIRED_LEFT_CONDITION);

const isRequireLeftTemplate = (
	statementsArray:	valTypeStatementsArray,
	arg_type?:			number | null
): boolean => {

	if(!apiutil.isSafeNumber(arg_type)){
		r3logger.elog('arg_type parameter is wrong : ' + JSON.stringify(arg_type));
		return false;
	}
	if(!isNotEmptyStatementsArray(statementsArray)){
		// empty
		return false;
	}

	// first unit(string)
	const	unit		= statementsArray[0].formUnits[0][0];
	let		unit_type	= REQUIRED_LEFT_NO;
	switch(unit){
		case TEMPL_INC_KW:
		case TEMPL_DEC_KW:
			unit_type = REQUIRED_LEFT_VARIABLE;
			break;
		case TEMPL_AND_KW:
		case TEMPL_OR_KW:
		case TEMPL_LESS_KW:
		case TEMPL_GREAT_KW:
		case TEMPL_LESSEQ_KW:
		case TEMPL_GREATEQ_KW:
		case TEMPL_EQUAL_KW:
		case TEMPL_NOTEQ_KW:
			unit_type = REQUIRED_LEFT_ALL;
			break;
		case TEMPL_SET_KW:
			unit_type = REQUIRED_LEFT_VARIABLE;
			break;
		case TEMPL_ADD_KW:
		case TEMPL_SUB_KW:
		case TEMPL_DIV_KW:
		case TEMPL_MUL_KW:
		case TEMPL_REM_KW:
			unit_type = REQUIRED_LEFT_VARIABLE | REQUIRED_LEFT_CALCULATE;
			break;
		case TEMPL_AMP_KW:
		case TEMPL_VARTBAR_KW:
			unit_type = REQUIRED_LEFT_ALL;
			break;
		case TEMPL_LSHIFT_KW:
		case TEMPL_RSHIFT_KW:
			unit_type = REQUIRED_LEFT_VARIABLE;
			break;
		default:
			break;
	}
	return (0 !== (arg_type & unit_type));
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility
// : Create/Modify Template Statement Objects
//---------------------------------------------------------
const createEmptyK2hr3TemplateStatement = (
	isStatement?:	boolean,
	isReplication?:	boolean
): valTypeStatementObject => {

	const	areaobj: valTypeStatementObject = {
		isStatement:	(apiutil.isBoolean(isStatement) ? isStatement : true),			// default true
		origString:		'',
		cvtString:		'',
		isReplication:	(apiutil.isBoolean(isReplication) ? isReplication : true),		// default true
		formUnits:		[]																// empty array[]
	};
	return areaobj;
};

const replicateK2hr3TemplateStatement = (statementObj: valTypeStatementObject | null): valTypeStatementObject => {

	if(!isSafeStatementObject(statementObj, false)){									// not check units
		return createEmptyK2hr3TemplateStatement();
	}
	const	areaobj = createEmptyK2hr3TemplateStatement(statementObj.isStatement, true);
	if(apiutil.isString2DArray(statementObj.formUnits)){
		areaobj.formUnits = statementObj.formUnits;			// reference
	}
	return areaobj;
};

const createReplicatedK2hr3TemplateStatement = (
	isStatement:	boolean,
	formUnits:		string[][]
): valTypeStatementObject => {

	const	areaobj = createEmptyK2hr3TemplateStatement(isStatement, true);
	if(apiutil.isNotEmptyArray(formUnits)){
		areaobj.formUnits = formUnits;
	}
	return areaobj;
};

const replaceK2hr3TemplateStatementFormUnits = (
	statementObj:	valTypeStatementObject | null,
	formUnits:		string[][]
): boolean => {

	// Allowed empty formUnits and not check strict statementObj
	if(!isSafeStatementObject(statementObj) || !apiutil.isString2DArray(formUnits)){	// check units
		return false;
	}
	statementObj.formUnits = formUnits;
	return true;
};

const compressStatementsArray = (statementsArray: valTypeStatementsArray): void => {

	if(!apiutil.isArray(statementsArray)){
		return;
	}
	for(let cnt1 = 0; cnt1 < statementsArray.length; ){
		if(!isSafeStatementObject(statementsArray[cnt1], false)){
			// something is wrong, then remove this statement object
			statementsArray.splice(cnt1, 1);
		}else{
			for(let cnt2 = 0; cnt2 < statementsArray[cnt1].formUnits.length; ){
				if(!apiutil.isNotEmptyArray(statementsArray[cnt1].formUnits[cnt2])){
					// units is empty, then remove this units
					statementsArray[cnt1].formUnits.splice(cnt2, 1);
				}else{
					for(let cnt3 = 0; cnt3 < statementsArray[cnt1].formUnits[cnt2].length; ){
						if(!apiutil.isSafeString(statementsArray[cnt1].formUnits[cnt2][cnt3]) && '' !== statementsArray[cnt1].formUnits[cnt2][cnt3]){
							// one unit is wrong, then remove this unit
							statementsArray[cnt1].formUnits[cnt2].splice(cnt3, 1);
						}else{
							++cnt3;
						}
					}
					if(!apiutil.isNotEmptyArray(statementsArray[cnt1].formUnits[cnt2])){
						// finally units is empty, then remove this units
						statementsArray[cnt1].formUnits.splice(cnt2, 1);
					}else{
						++cnt2;
					}
				}
			}
			if(!apiutil.isNotEmptyArray(statementsArray[cnt1].formUnits)){
				// finally units is empty, then remove this units
				statementsArray.splice(cnt1, 1);
			}else{
				++cnt1;
			}
		}
	}
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility
// : Rollback Template Statement Objects
//---------------------------------------------------------
//
// rollback(insert) statement object to statements array
//
// is_add_first_pos		:	if true, insert statement object at first position in statementsArray.
// 							if false, push bach units array data to statementsArray.
//
// return				:	returns statementsArray object
//							if input statementsArray is wrong, returned statementsArray is created in this function.
//							please take care for wrong input.
//
// [NOTE]
// If statementObj is replication object, this rollbacks only formUnits in statementObj.
//
const rollbackStatementObjectToArray = (
	statementsArray:	valTypeStatementsArray,
	statementObj:		valTypeStatementObject,
	is_add_first_pos?:	boolean | null
): valTypeStatementsArray => {

	if(!apiutil.isBoolean(is_add_first_pos)){
		is_add_first_pos = true;
	}
	if(!isSafeStatementObject(statementObj, false)){						// not check units
		// statement object is something wrong
		// ---> nothing to do
		return statementsArray;
	}
	if(!isSafeStatementsArray(statementsArray, false)){						// not check units
		// statementsArray is something wrong
		// ---> overwrite it by statement object.
		statementsArray = [statementObj];

	}else if(0 === statementsArray.length){
		// statementsArray is empty
		// ---> push statement object.
		statementsArray.push(statementObj);

	}else{
		const	pos = (is_add_first_pos ? 0 : (statementsArray.length - 1));
		if(!isReplicationStatementObject(statementObj)){
			// statement object is not replication
			if(isReplicationStatementObject(statementsArray[pos])){
				// statementsArray[pos] is not replication
				if(is_add_first_pos){
					// ---> insert statement object to top of statement array
					statementsArray.unshift(statementObj);
				}else{
					// ---> push back statement object to last of statement array
					statementsArray.push(statementObj);
				}
			}else{
				// statementsArray[pos] is replication,
				if(is_add_first_pos){
					// ---> insert the statement object' formUnits to top of statementsArray[pos]'s one.
					//		and replace statementsArray[pos] other member with statement object's one.
					for(let cnt = 0; cnt < statementsArray[pos].formUnits.length; ++cnt){
						statementObj.formUnits.push(statementsArray[pos].formUnits[cnt]);
					}
					statementsArray.shift();
					statementsArray.unshift(statementObj);
				}else{
					// ---> push back the statement object' formUnits to last of statementsArray[pos]'s one.
					//		and replace statementsArray[pos] other member with statement object's one.
					for(let cnt = 0; cnt < statementsArray[pos].formUnits.length; ++cnt){
						statementObj.formUnits.unshift(statementsArray[pos].formUnits[statementsArray[pos].formUnits.length - cnt - 1]);
					}
					statementsArray.splice(statementsArray.length - 1, 1);
					statementsArray.push(statementObj);
				}
			}
		}else{
			// statement object is replication
			if(isReplicationStatementObject(statementsArray[pos])){
				// statementsArray[pos] is not replication
				if(is_add_first_pos){
					// ---> insert statement object to top of statement array
					statementsArray.unshift(statementObj);
				}else{
					// ---> push back statement object to last of statement array
					statementsArray.push(statementObj);
				}
			}else{
				// statementsArray[pos] is replication
				if(is_add_first_pos){
					// ---> insert the statement object' formUnits to top of statementsArray[pos]'s one.
					for(let cnt = 0; cnt < statementObj.formUnits.length; ++cnt){
						statementsArray[pos].formUnits.unshift(statementObj.formUnits[statementObj.formUnits.length - cnt - 1]);
					}
				}else{
					// ---> push back the statement object' formUnits to last of statementsArray[pos]'s one.
					for(let cnt = 0; cnt < statementObj.formUnits.length; ++cnt){
						statementsArray[pos].formUnits.push(statementObj.formUnits[cnt]);
					}
				}
			}
		}
	}
	return statementsArray;
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility
// : Parse Template Statement Objects
//---------------------------------------------------------
//
// Parse k2hr3 template to statement areas and minimum formula units.
//
// templString	: The string is all of template string
// result		: Statement object Array
//
const parseK2hr3Template = (templString: string | null): valTypeStatementsArray | null => {

	// parse template to statement areas
	const	resobj = parseK2hr3TemplateToStatements(templString);
	if(!isSafeStatementsArray(resobj)){
		r3logger.dlog('parsed template string result is null.');
		return null;
	}
	const	objarr = resobj;

	// parse each statement area to formula units
	for(let cnt = 0; apiutil.isNotEmptyArray(objarr) && cnt < objarr.length; ++cnt){
		if(!apiutil.isSafeEntity(objarr[cnt])){
			// why?
			objarr.splice(cnt, 1);
			if(0 === cnt){
				cnt = -1;
			}else{
				--cnt;
			}
			continue;
		}

		let	formUnits: string[][] | null;
		if(objarr[cnt].isStatement){
			// in statement area
			formUnits = parseK2hr3TemplateForStatements(objarr[cnt].cvtString);
			if(null === formUnits || !apiutil.isString2DArray(formUnits)){
				// empty sentence, so remove this element.
				objarr.splice(cnt, 1);
				if(0 === cnt){
					cnt = -1;
				}else{
					--cnt;
				}
				continue;
			}
		}else{
			// not statement area
			formUnits = [[objarr[cnt].cvtString]];
		}
		objarr[cnt].formUnits = formUnits;
	}
	if(!apiutil.isNotEmptyArray(objarr)){
		r3logger.dlog('parsed template string result is null.');
		return null;
	}
	//r3logger.dlog('parsed template string result is : ' + r3logger.dump(objarr));

	return objarr;
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility
// : Parse Template String to Template Statement Objects
//---------------------------------------------------------
//
// Parse input string which is k2hr3 template to statement areas array.
// Each area is statement or not statement area.
//
// templString	: The string is all of template string
// result		: Following object array, return empty array when error.
//					[
//						{									: Each template area(statement area / not statement area)
//							"isStatement":	true/false		: This is true when the template area is statement({{...}}).
//							"origString":	<string>		: original string
//							"cvtString":	<string>		: converted string(escaped keyword and trimmed when statement area includes formula)
//						},
//						...
//					]
//
const parseK2hr3TemplateToStatements = (templString: string | null): valTypeStatementsArray | null => {

	if(!apiutil.isSafeString(templString)){
		return null;
	}
	let	inputString = templString;

	// parse
	const	resobj: valTypeStatementsArray	= [];

	let		tmpl_cvtstr	= '';
	let		tmpl_origin	= '';
	let		keyword		= TEMPL_START_KW;
	let		escword		= TEMPL_ESCAPE_START_KW;
	let		oescword	= TEMPL_ESCAPE_END_KW;							// not keyword's escape
	let		templ_area	= false;
	while(apiutil.isSafeString(inputString) && 0 < inputString.length){
		// each
		const	key_pos		= inputString.indexOf(keyword);				// '{{'  or '}}'
		const	esc_pos		= inputString.indexOf(escword);				// '{{{' or '}}}'
		const	oesc_pos	= inputString.indexOf(oescword);			// '}}}' or '{{{'

		if(-1 !== oesc_pos && (-1 === key_pos || oesc_pos < key_pos)){
			// found not keyword's escaped words before keyword
			tmpl_origin += inputString.substr(0, oesc_pos + 3);
			tmpl_cvtstr	+= inputString.substr(0, oesc_pos + 2);			// converts '{{{'('}}}') to '{{'('}}') and appends it to end of tmpl_cvtstr.
			inputString	 = inputString.substr(oesc_pos + 3);			// after key words('{{{' or '}}}')
		}else{
			if(-1 != esc_pos && esc_pos === key_pos){
				// found escaped key words
				tmpl_origin += inputString.substr(0, esc_pos + 3);
				tmpl_cvtstr	+= inputString.substr(0, esc_pos + 2);		// converts '{{{'('}}}') to '{{'('}}') and appends it to end of tmpl_cvtstr.
				inputString	 = inputString.substr(esc_pos + 3);			// after key words('{{{' or '}}}')

			}else if(-1 != key_pos){
				// found key words
				if(templ_area){
					tmpl_origin += inputString.substr(0, key_pos + 2);	// original string with '}}'
					tmpl_cvtstr	+= inputString.substr(0, key_pos);		// converted string without '}}'

					// make object
					const oneobj: valTypeStatementObject = {
						isStatement:	true,
						origString:		tmpl_origin,
						cvtString:		tmpl_cvtstr.trim(),				// trimmed string
						isReplication:	false,
						formUnits:		[]
					};

					// add
					if(apiutil.isSafeString(oneobj.origString)){
						resobj.push(oneobj);
					}

					// set next
					templ_area	= false;
					keyword		= TEMPL_START_KW;
					escword		= TEMPL_ESCAPE_START_KW;
					oescword	= TEMPL_ESCAPE_END_KW;
					tmpl_origin	= '';
					tmpl_cvtstr	= '';
					inputString	= inputString.substr(key_pos + 2);		// after key words('{{')

				}else{
					tmpl_origin += inputString.substr(0, key_pos);		// original string without '{{'
					tmpl_cvtstr	+= inputString.substr(0, key_pos);		// converted string without '{{'

					// make object
					const oneobj: valTypeStatementObject = {
						isStatement:	false,
						origString:		tmpl_origin,
						cvtString:		tmpl_cvtstr,					// not trimmed string
						isReplication:	false,
						formUnits:		[]
					};

					// add
					if(apiutil.isSafeString(oneobj.origString)){
						resobj.push(oneobj);
					}

					// set next
					templ_area	= true;
					keyword		= TEMPL_END_KW;
					escword		= TEMPL_ESCAPE_END_KW;
					oescword	= TEMPL_ESCAPE_START_KW;
					tmpl_origin	= TEMPL_START_KW;						// start original string with '{{'
					tmpl_cvtstr	= '';
					inputString	= inputString.substr(key_pos + 2);		// after key words('}}')
				}
			}else{
				// not found keywords
				tmpl_origin += inputString;								// add rest string to original string
				tmpl_cvtstr	+= inputString;								// add rest string to converted string

				const oneobj: valTypeStatementObject = {
					isStatement:	(templ_area ? true : false),
					origString:		tmpl_origin,
					cvtString:		(templ_area ? tmpl_cvtstr.trim() : tmpl_cvtstr),
					isReplication:	false,
					formUnits:		[]
				};

				// add
				if(apiutil.isSafeString(oneobj.origString)){
					resobj.push(oneobj);
				}
				break;
			}
		}
	}
	return resobj;
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility
// : Parse Template String to Minimum Template Statement Objects
//---------------------------------------------------------
//
// Parse input string which is rough cutting statement area to minimum statement array.
// Each minimum statement has formula units array which elements are minimum formula string.
// Formula unit string is separated by keywords.
//
// target		: the string in template area which is from '{{' to '}}'.
// result		: The array has formula units array which is separated by ':'.
//				  The one sentence array member is array which member is
//				  minimum opcode/operand unit.
//					[
//						[							: One sentence(separated by ';')
//							"unit string",			: One unit(separated by keywords...)
//							"unit string",
//							...
//						],
//						...
//					]
//
// [NOTE]
// About comment and print statement which are special.
// If target starts comment keyword('{{#'), this returns [ ["#", "...."] ] array.
// If target starts print keyword('{{='), this returns [ ["=", "...."], ... ] array.
//
const parseK2hr3TemplateForStatements = (
	target?:					string | null,
	is_print_statement?:	boolean | null
): string[][] | null => {

	if(!apiutil.isSafeString(target)){
		return null;
	}
	const	inputTarget	= target;
	const	is_print	= (!apiutil.isBoolean(is_print_statement) ? false : is_print_statement);

	let		mainres: string[][] = [];
	let		subres: string[] 	= [];
	let		one_part			= '';

	// check comment/print line at first
	if(0 === inputTarget.indexOf(TEMPL_COMMENT_KW)){
		// found comment keyword at first character position
		one_part	= inputTarget.substr(1).trim();
		subres.push(TEMPL_COMMENT_KW);
		if(apiutil.isSafeString(one_part)){
			subres.push(one_part);
		}
		mainres.push(subres);
		return mainres;

	}else if(!is_print && 0 === inputTarget.indexOf(TEMPL_PRINT_KW)){
		// found print keyword at first character position
		one_part		= inputTarget.substr(1).trim();
		// reentrant for analyzing after statement string
		const	tmpres	= parseK2hr3TemplateForStatements(one_part, true);

		if(null === tmpres || !apiutil.isNotEmptyArray(tmpres)){
			// mainres array is empty, then make static for print(maybe this is error at assembling or executing)
			subres.push(TEMPL_PRINT_KW);
			mainres = [];
			mainres.push(subres);
		}else if(!apiutil.isNotEmptyArray(tmpres[0])){
			// first array in mainres is empty, then make static for print(maybe this is error at assembling or executing)
			subres.push(TEMPL_PRINT_KW);
			mainres[0] = subres;
		}else{
			// insert print keyword into first of array
			mainres = tmpres;
			mainres[0].unshift(TEMPL_PRINT_KW);
		}
		return mainres;
	}

	// parse to statement string
	let	is_squate	= false;
	let	is_dquate	= false;
	let	is_escape	= false;
	for(let cnt = 0; cnt < inputTarget.length; ++cnt){
		// check ';', '\'', '\"', '\\', '\s'
		if(TEMPL_SEMICOLON_KW === inputTarget[cnt]){					// ';'
			if(is_escape){
				one_part	+= TEMPL_ESCAPE_KW;
			}
			is_squate	= false;
			is_dquate	= false;
			is_escape	= false;

			if(0 < one_part.length){
				subres.push(one_part);							// finish one word
				one_part = '';
			}
			if(0 < subres.length){
				mainres.push(subres);							// finish statement
				subres = [];
			}

		}else if(TEMPL_SINGLE_QUOTE_KW === inputTarget[cnt]){		// '\''
			if(is_escape){
				is_escape	= false;
				one_part	+= TEMPL_ESCAPE_KW;
				one_part	+= inputTarget[cnt];
			}else if(is_squate){
				is_squate	= false;
				one_part	+= inputTarget[cnt];
				subres.push(one_part);							// finish one word
				one_part	= '';
			}else if(is_dquate){
				// nothing to do...
				one_part	+= inputTarget[cnt];
			}else{
				is_squate	= true;
				if(0 < one_part.length){
					subres.push(one_part);						// finish one word
				}
				one_part	= inputTarget[cnt];
			}

		}else if(TEMPL_DOUBLE_QUOTE_KW === inputTarget[cnt]){		// '\"'
			if(is_escape){
				is_escape	= false;
				one_part	+= TEMPL_ESCAPE_KW;
				one_part	+= inputTarget[cnt];
			}else if(is_dquate){
				is_dquate	= false;
				one_part	+= inputTarget[cnt];
				subres.push(one_part);							// finish one word
				one_part	= '';
			}else if(is_squate){
				// nothing to do...
				one_part	+= inputTarget[cnt];
			}else{
				is_dquate	= true;
				if(0 < one_part.length){
					subres.push(one_part);						// finish one word
				}
				one_part	= inputTarget[cnt];
			}

		}else if(TEMPL_ESCAPE_KW === inputTarget[cnt]){				// '\\'
			if(is_escape){
				is_escape	= false;
				one_part	+= TEMPL_ESCAPE_KW;
				one_part	+= inputTarget[cnt];
			}else{
				is_escape	= true;
			}

		}else if(' ' === inputTarget[cnt] || '\t' === inputTarget[cnt] || '\r' === inputTarget[cnt] || '\n' === inputTarget[cnt]){	// === \s
			if(is_escape){
				is_escape	= false;
				one_part	+= TEMPL_ESCAPE_KW;
				subres.push(one_part);							// finish one word
				one_part = '';
			}else if(is_dquate || is_squate){
				one_part += inputTarget[cnt];
			}else if(0 === one_part.length){
				// nothing to do
			}else{
				subres.push(one_part);							// finish one word
				one_part = '';
			}
	
		}else{													// another char
			if(is_escape){
				is_escape	= false;
				one_part	+= TEMPL_ESCAPE_KW;
			}
			one_part += inputTarget[cnt];
		}
	}

	// rest
	if(is_escape){
		one_part += TEMPL_ESCAPE_KW;
	}
	if(0 < one_part.length){
		subres.push(one_part);									// finish one word
	}
	if(0 < subres.length){
		mainres.push(subres);									// finish statement
	}

	// next parse units(minimum formula units)
	const	tmpres = parseK2hr3TemplateStatementToFomulaUnits(mainres);

	return tmpres;
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility
// : Parsing Template Formula String to Minimum Template Statement Units
//---------------------------------------------------------
//
// This parses double array which is parsed by parseK2hr3TemplateForStatements
// to minimum formula units.
// After this parsing, the result double array is separated minimum formula units
// array divided into instruction units.
//
// mainres	:	input array which elements are each statement area.
//				[
//					[							: array for statement separated by ';'
//						"unit string",			: unit statement string separated by ';' or "string"(which is statement area by '\'' or '\"')
//						...
//					]
//				]
//
// result	:	parse input unit array by keywords
//				[
//					[							: array for statement separated by ';'
//						"unit string",			: One unit formula string separated by ';' or "string" or any keywords
//						...
//					]
//				]
//
const parseK2hr3TemplateStatementToFomulaUnits = (mainres: string[][] | null): string[][] | null => {

	if(!apiutil.isString2DArray(mainres) || !apiutil.isNotEmptyArray(mainres)){
		return mainres;
	}
	const	tmpres = mainres;

	for(let cnt = 0; cnt < tmpres.length; ++cnt){
		if(!apiutil.isNotEmptyArray(tmpres[cnt])){
			// why?
			tmpres.splice(cnt, 1);
			if(0 === cnt){
				cnt = -1;
			}else{
				--cnt;
			}
			continue;
		}

		// parse subres to some units
		const	subres = tmpres[cnt];
		for(let cnt2 = 0; cnt2 < subres.length; ++cnt2){
			// parse string to minimum unit array
			const	subres_array = parseK2hr3TemplateStatementToMinimumUnits(subres[cnt2]);
			if(!apiutil.isNotEmptyArray(subres_array)){
				// why?
				subres.splice(cnt2, 1);
				if(0 === cnt2){
					cnt2 = -1;
				}else{
					--cnt2;
				}
			}else if(1 < subres_array.length){
				// replace pos to array
				subres.splice(cnt2, 1);
				for(let cnt3 = 0; cnt3 < subres_array.length; ++cnt3){
					subres.splice(cnt2, 0, subres_array[subres_array.length - cnt3 - 1]);
				}
				cnt2 += subres_array.length - 1;
			}else{
				// nothing to do
			}
		}
		// check empty subres
		if(!apiutil.isStringArray(subres) || !apiutil.isNotEmptyArray(subres)){
			// tmpres[cnt] has empty subres array, then remove cnt position array.
			tmpres.splice(cnt, 1);
			if(0 === cnt){
				cnt = -1;
			}else{
				--cnt;
			}
		}
	}
	// [NOTE]
	// if units array(subres) is empty, it is removed from tmpres.
	// if there is no units in tmpres, tmpres is empty array.
	//
	return tmpres;
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility
// : Parsing Template String Including Some Formula to Minimum Template Statement Units
//---------------------------------------------------------
//
// If it starts '\'' or '\"', it means "string" area which maybe include ';' and '\s'.
// Then this method does not check when the target is "string" and '\' character,
// because it effects only "string".
// The input string must not include basically ';' and '\s'.
//
// result	:	null or following array
//				[
//					"unit string",			: One unit in formula(separate keywords...)
//					...
//				]
//
const parseK2hr3TemplateStatementToMinimumUnits = (target?: string | null): string[] => {

	if(!apiutil.isSafeString(target)){
		return [] as string[];
	}
	const	inputTarget = target;

	const	resarr: string[] = [];
	if(TEMPL_SINGLE_QUOTE_KW === inputTarget[0] || TEMPL_DOUBLE_QUOTE_KW === inputTarget[0]){
		// inputTarget is '...' or "..." string, then this can not parse.
		resarr.push(inputTarget);
		return resarr;
	}

	let	one_part	= '';
	for(let cnt = 0; cnt < inputTarget.length; ++cnt){
		if(TEMPL_VALUESEP_KW === inputTarget[cnt]){				// '%' (== TEMPL_REM_KW)
			// [NOTE]
			// Space characters are already parsed before calling this function.
			//
			if(inputTarget.length <= (cnt + 1)){
				// inputTarget[cnt + 1] === \s or null, then inputTarget[cnt] is TEMPL_REM_KW
				if(0 !== one_part.length){
					resarr.push(one_part);						// set stocked string before percent
				}
				one_part	= TEMPL_REM_KW;
				resarr.push(one_part);							// set percent
				one_part	= '';

			}else{
				const	end_percent_pos = inputTarget.substr(cnt + 1).indexOf(TEMPL_VALUESEP_KW);
				if(-1 === end_percent_pos){
					// not found end(2'nd) percent/or \r(\n) found before percent, then inputTarget[cnt] is TEMPL_REM_KW
					if(0 !== one_part.length){
						resarr.push(one_part);					// set stocked string before percent
					}
					one_part	= TEMPL_REM_KW;
					resarr.push(one_part);						// set percent
					one_part	= '';

				}else{
					// found end(2'nd) percent, then these are TEMPL_VALUESEP_KW
					if(0 !== one_part.length){
						resarr.push(one_part);					// set stocked string before percent
					}
					one_part	= TEMPL_REM_KW;
					one_part	+= inputTarget.substr(cnt + 1).substr(0, end_percent_pos);
					one_part	+= TEMPL_REM_KW;
					resarr.push(one_part);						// set %...%(TEMPL_VALUESEP_KW area)
					one_part	= '';
					cnt			+= end_percent_pos + 1;			// cnt is set end of TEMPL_VALUESEP_KW
				}
			}

		}else if(TEMPL_SQUARE_START_KW === inputTarget[cnt]){	// '['
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			resarr.push(TEMPL_SQUARE_START_KW);

		}else if(TEMPL_SQUARE_END_KW === inputTarget[cnt]){		// ']'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			resarr.push(TEMPL_SQUARE_END_KW);

		}else if(TEMPL_CURLY_START_KW === inputTarget[cnt]){	// '{'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			resarr.push(TEMPL_CURLY_START_KW);

		}else if(TEMPL_CURLY_END_KW === inputTarget[cnt]){		// '}'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			resarr.push(TEMPL_CURLY_END_KW);

		}else if(TEMPL_MUL_KW === inputTarget[cnt]){			// '*'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			resarr.push(TEMPL_MUL_KW);

		}else if(TEMPL_DIV_KW === inputTarget[cnt]){			// '/'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			resarr.push(TEMPL_DIV_KW);

		}else if(TEMPL_NOT_KW === inputTarget[cnt]){			// '!'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			if((cnt + 1) < inputTarget.length && TEMPL_SET_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_NOTEQ_KW);					// '!='
			}else{
				resarr.push(TEMPL_NOT_KW);						// '!'
			}

		}else if(TEMPL_SET_KW === inputTarget[cnt]){			// '='
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			if((cnt + 1) < inputTarget.length && TEMPL_SET_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_EQUAL_KW);					// '=='
			}else{
				resarr.push(TEMPL_SET_KW);						// '='
			}

		}else if(TEMPL_ADD_KW === inputTarget[cnt]){			// '+'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			if((cnt + 1) < inputTarget.length && TEMPL_ADD_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_INC_KW);						// '++'
			}else{
				resarr.push(TEMPL_ADD_KW);						// '+'
			}

		}else if(TEMPL_SUB_KW === inputTarget[cnt]){			// '-'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			if((cnt + 1) < inputTarget.length && TEMPL_SUB_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_DEC_KW);						// '--'
			}else{
				resarr.push(TEMPL_SUB_KW);						// '-'
			}

		}else if(TEMPL_AMP_KW === inputTarget[cnt]){			// '&'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			if((cnt + 1) < inputTarget.length && TEMPL_AMP_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_AND_KW);						// '&&'
			}else{
				resarr.push(TEMPL_AMP_KW);						// '&'
			}

		}else if(TEMPL_VARTBAR_KW === inputTarget[cnt]){		// '|'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			if((cnt + 1) < inputTarget.length && TEMPL_VARTBAR_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_OR_KW);						// '||'
			}else{
				resarr.push(TEMPL_VARTBAR_KW);					// '|'
			}

		}else if(TEMPL_LESS_KW === inputTarget[cnt]){			// '<'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			if((cnt + 1) < inputTarget.length && TEMPL_SET_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_LESSEQ_KW);					// '<='
			}else if((cnt + 1) < inputTarget.length && TEMPL_LESS_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_LSHIFT_KW);					// '<<'
			}else{
				resarr.push(TEMPL_LESS_KW);						// '<'
			}

		}else if(TEMPL_GREAT_KW === inputTarget[cnt]){			// '>'
			if(0 !== one_part.length){
				resarr.push(one_part);
				one_part= '';
			}
			if((cnt + 1) < inputTarget.length && TEMPL_SET_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_GREATEQ_KW);					// '>='
			}else if((cnt + 1) < inputTarget.length && TEMPL_GREAT_KW === inputTarget[cnt + 1]){
				++cnt;
				resarr.push(TEMPL_RSHIFT_KW);					// '>>'
			}else{
				resarr.push(TEMPL_GREAT_KW);					// '>'
			}

		}else{
			one_part += inputTarget[cnt];
		}
	}
	// rest
	if(0 !== one_part.length){
		resarr.push(one_part);
	}

	return resarr;
};

//---------------------------------------------------------
// Execute Result Class for K2HR3 Template Class
//---------------------------------------------------------
class K2hr3TemplateResult {

	// private variables
	protected _result:			boolean;
	protected _templString:		string;
	protected _cond:			boolean;
	protected _lastvalue:		valTypeAll;
	protected _isbreak:			boolean;
	protected _iscontinue:		boolean;
	protected _varNameArray:	string[] | null;

	constructor(result?: boolean)
	{
		// private variables(do not use directly)
		this._result		= apiutil.isBoolean(result) ? result : false;	// result of all
		this._templString	= '';											// result string value
		this._cond			= false;										// result boolean value
		this._lastvalue		= null;											// last value object which is any type value
		this._isbreak		= false;										// if break is called, true
		this._iscontinue	= false;										// if continue is called, true
		this._varNameArray	= null;											// variable name array
	};

	// access/getter
	public result = (): boolean => {
		return this._result;
	};

	public isSuccess = (): boolean => {
		return this._result;
	};

	public isFailure = (): boolean => {
		return !this._result;
	};

	public getString = (): string => {
		return this._templString;
	};

	public getCondition = (): boolean => {
		return this._cond;
	};

	public getLastValue = (): valTypeAll => {
		return this._lastvalue;
	};

	public getVariableNames(): string[] | null {
		return this._varNameArray;
	};

	public isLoopControlFlags = (): boolean => {
		return (this._isbreak || this._iscontinue);
	};

	public isBreak = (): boolean => {
		return this._isbreak;
	};

	public isContinue = (): boolean => {
		return this._iscontinue;
	};

	// set
	public init = (result?: boolean): void => {
		this._result		= apiutil.isBoolean(result) ? result : false;	// result of all
		this._templString	= '';											// result string value
		this._cond			= false;										// result boolean value
		this._lastvalue		= null;											// result value object which is any type value
		this._isbreak		= false;										// if break is called, true
		this._iscontinue	= false;										// if continue is called, true
		this._varNameArray	= null;											// variable name array
	};

	public setError = (errstr: string | null): void => {
		this._result		= false;										// result is false
		this._templString	+= ' --> ' + apiutil.getSafeString(errstr);
		this._cond			= false;
		this._lastvalue		= apiutil.getSafeString(errstr);
	};

	public addTemplString = (str: string | null): void => {
		this._templString	+= apiutil.getSafeString(str);
		this.setLastString(str);
	};

	public mergeTemplString = (other: K2hr3TemplateResult): void => {
		if(!isK2hr3TemplateResult(other)){
			return;
		}
		this.addTemplString(other._templString);
		this.setLastString(other._templString);
	};

	public setLastString = (str: string | null): void => {
		this._cond		= apiutil.isSafeString(str);
		this._lastvalue	= apiutil.getSafeString(str);
	};

	public setLastValue = (value: valTypeAll): void => {
		// check value type
		if(!apiutil.isSafeEntity(value)){										// null/undefined	---> condition = false
			this._cond		= false;
			this._lastvalue	= null;
		}else if(apiutil.isBoolean(value)){										// boolean			---> condition = true/false
			this._cond		= value;
			this._lastvalue	= value;
		}else if(apiutil.isSafeNumeric(value)){									// number			---> condition = true/false
			const tmpnumber	= apiutil.cvtToNumber(value);
			this._cond		= apiutil.isSafeNumber(tmpnumber) ? (0 !== tmpnumber) : false;
			this._lastvalue	= value;
		}else if(apiutil.isString(value)){										// string			---> condition = true/false
			this._cond		= apiutil.isSafeString(value);
			this.setLastString(value);
		}else{																	// unknown			---> condition = false
			if(value){
				this._cond	= true;
			}else{
				this._cond	= false;
			}
			this._lastvalue	= value;											// unknown value
		}
	};

	public setVariableNames = (...args: unknown[]): void => {
		const	arr: string[] = Array.prototype.slice.call(args, 0);
		if(!apiutil.isNotEmptyArray(arr)){
			this._varNameArray = null;
			return;
		}
		for(let cnt = 0; cnt < arr.length; ){
			if(null === arr[cnt] || apiutil.isBoolean(arr[cnt]) || (!apiutil.isSafeNumber(arr[cnt]) && !apiutil.isSafeString(arr[cnt]))){
				// cut not string member
				arr.splice(cnt, 1);
			}else{
				++cnt;
			}
		}
		if(!apiutil.isNotEmptyArray(arr)){
			this._varNameArray = null;
		}else{
			this._varNameArray = arr;
		}
	};

	public setBreak = (): void => {
		this._isbreak = true;
	};

	public clearBreak = (): void => {
		this._isbreak = false;
	};

	public setContinue = (): void => {
		this._iscontinue = true;
	};

	public clearContinue = (): void => {
		this._iscontinue = false;
	};

	public clearLoopControlFlags = (): void => {
		this.clearBreak();
		this.clearContinue();
	};

	public merge = (other: K2hr3TemplateResult): void => {
		if(!isK2hr3TemplateResult(other)){
			return;
		}
		this._result		= (this._result && other.result());					// and
		this._templString	+= other.getString();								// adding other
		this._cond			= other.getCondition();								// other
		this._lastvalue		= other.getLastValue();								// other
		this._isbreak		= (this._isbreak || other.isBreak());				// or
		this._iscontinue	= (this._iscontinue || other.isContinue());			// or
		this._varNameArray	= other._varNameArray;								// other
	};

	public mergeStop = (other: K2hr3TemplateResult): void => {
		if(!isK2hr3TemplateResult(other)){
			return;
		}
		this._result		= (this._result && other.result());					// and
		this._isbreak		= (this._isbreak || other.isBreak());				// or
		this._iscontinue	= (this._iscontinue || other.isContinue());			// or
	};

	public insert = (other: K2hr3TemplateResult): void => {
		if(!isK2hr3TemplateResult(other)){
			return;
		}
		this._result		= (this._result && other.result());					// and
		this._templString	= other.getString() + this._templString;			// inserting other
		this._cond			= other.getCondition();								// other
		this._lastvalue		= other.getLastValue();								// other
		this._isbreak		= (this._isbreak || other.isBreak());				// or
		this._iscontinue	= (this._iscontinue || other.isContinue());			// or
		this._varNameArray	= other._varNameArray;								// other
	};

	public insertPrint = (other: K2hr3TemplateResult): void => {
		if(!isK2hr3TemplateResult(other)){
			return;
		}
		const tmpLastValue	= other.getLastValue();

		this._result		= (this._result && other.result());					// and
		this._templString	= (apiutil.isSafeEntity(tmpLastValue) ? tmpLastValue.toString() : '') + this._templString;		// inserting other last value
		this._cond			= other.getCondition();								// other
		this._lastvalue		= other.getLastValue();								// other
		this._isbreak		= (this._isbreak || other.isBreak());				// or
		this._iscontinue	= (this._iscontinue || other.isContinue());			// or
		this._varNameArray	= other._varNameArray;								// other
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Common Variables
//---------------------------------------------------------
//
// Static Variables
//
const K2HR3TEMPL_ERROR_MSG_MAXLENGTH		= (128 - 3);						// 3 is margin "..."

//
// Class type string
//
const TEMPLATECLASS_TYPE_BASE				= 'template:base';

const STATEMENTCLASS_TYPE_BASE				= 'statement:base';
const STATEMENTCLASS_TYPE_STATIC			= 'statement:static';
const STATEMENTCLASS_TYPE_COMMENT			= 'statement:comment';
const STATEMENTCLASS_TYPE_PRINT				= 'statement:print';

const FORMULACLASS_TYPE_BASE				= 'formula:base';
const FORMULACLASS_TYPE_VARIABLE			= 'formula:variable';
const FORMULACLASS_TYPE_CALCULATE			= 'formula:calculate';
const FORMULACLASS_TYPE_CONDITION			= 'formula:condition';
const FORMULACLASS_TYPE_SYNTAX				= 'formula:syntax';

//
// These type is used by isPossibleResultType method parameter.
//
// [NOTE]
// If you get true from isPossibleResultType method with one of following
// symbol, but it is only possibility and you get another type result from
// execute method at runtime.
//
const TEMPLATE_RESULT_TYPE_NULL				= 0;
const TEMPLATE_RESULT_TYPE_BOOLEAN			= 1;
const TEMPLATE_RESULT_TYPE_NUMBER			= 2;
const TEMPLATE_RESULT_TYPE_VARIABLE			= 3;
const TEMPLATE_RESULT_TYPE_STRING			= 4;
const TEMPLATE_RESULT_TYPE_STRICT_STRING	= 5;
const TEMPLATE_RESULT_TYPE_NOSTATIC			= 6;
const TEMPLATE_RESULT_TYPE_ANYVALUE			= 7;

//---------------------------------------------------------
// K2HR3 Template Class : Base Class
//---------------------------------------------------------
class BaseTemplateObject {
	protected _type:		string;
	protected _error:		string | null;
	protected _parentTempl:	BaseTemplateObject | null;
	protected _nextTempl:	BaseTemplateObject | null;
	protected _resobj:		K2hr3TemplateResult;

	//
	// Constructor
	//
	constructor(type?: string | null)
	{
		this._type			= apiutil.isSafeString(type) ? type! : TEMPLATECLASS_TYPE_BASE;	// type of class
		this._error			= null;															// last error string when initializing/assembling
		this._parentTempl	= null;															// if not null, this object is included from another object
		this._nextTempl		= null;															// if not null, next object after this object is existed, it means the input statement has many statement.
		this._resobj		= new K2hr3TemplateResult(true);								// result object for executing
	};

	//
	// Methods
	//
	public clear(): void {
		this._error			= null;
		this.clearParentTemplObject();
		this.clearNextTemplObject();
		this.initExecuteResult();
	};

	public isEmpty = (): boolean => {
		return !this.isAssemble();
	};

	public isAssemble = (): boolean => {
		return false;
	};

	public getType = (): string => {
		return this._type;
	};

	public hasParentTemplObject = (): boolean => {
		return (null !== this._parentTempl);
	};

	public setParentTemplObject = (templObject: BaseTemplateObject | null): boolean => {
		// [NOTE]
		// parent object should not clear here.
		//
		if(null !== templObject && !isBaseTemplateObject(templObject)){
			r3logger.dlog('template object for parent is not based BaseTemplateObject, could not set from templObject');
			this._parentTempl = null;
		}else{
			this._parentTempl = templObject;
		}
		return true;
	};

	public getParentTemplObject = (): BaseTemplateObject | null => {
		return this._parentTempl;
	};

	public clearParentTemplObject = (): boolean => {
		this.setParentTemplObject(null);
		return true;
	};

	public hasNextTemplObject = (): boolean => {
		return (null !== this._nextTempl);
	};

	public setNextTemplObject = (
		templObject:	BaseTemplateObject | null,
		is_clear:		boolean = false
	): boolean => {
		if(is_clear && this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			this._nextTempl.clear();
		}
		if(null !== templObject && !isBaseTemplateObject(templObject)){
			r3logger.dlog('template object for next is not based BaseTemplateObject, could not set from templObject');
			this._nextTempl = null;
		}else{
			this._nextTempl = templObject;
		}
		return true;
	};

	public getNextTemplObject = (): BaseTemplateObject | null => {
		return this._nextTempl;
	};

	public clearNextTemplObject = (): boolean => {
		this.setNextTemplObject(null, true);
		return true;
	};

	public isError = (): boolean => {
		return apiutil.isSafeString(this._error);
	};

	public getError = (): string | null => {
		return (this.isError() ? this._error : null);
	};

	//
	// Set error string
	//
	// [NOTE]
	// If calling with one parameter(only typestr), the typestr is set message.
	// Thus you can call setError("error message") or setError("syntax error", "error message").
	//
	public setError = (
		typestr:	string | null,
		message?:	string
	): void => {

		let	errmsg: string = '';
		if(!apiutil.isSafeString(message)){
			if(!apiutil.isSafeString(typestr)){
				// wrong call
				typestr	= 'Internal Error';
				errmsg	= 'wrong setError method call.';
			}else{
				errmsg	= typestr;
				typestr	= 'Error';
			}
		}
		if((K2HR3TEMPL_ERROR_MSG_MAXLENGTH + 3) < errmsg.length){
			errmsg = errmsg.substr(0, K2HR3TEMPL_ERROR_MSG_MAXLENGTH) + '...';
		}
		this._error = '[' + this.getType() + '] ' + apiutil.getSafeString(typestr) + ' : ' + apiutil.getSafeString(errmsg);
		// set resobj
		this._resobj.setError(this.getError());
	};

	public initExecuteResult = (): void => {
		this._resobj.init(true);
		if(this.isError()){
			this._resobj.setError(this.getError());
		}
	};

	public setExecuteError = (message: string | null): void => {
		const	tmpStrMsg = apiutil.getSafeString(message);
		if((K2HR3TEMPL_ERROR_MSG_MAXLENGTH + 3) < tmpStrMsg.length){
			message = tmpStrMsg.substr(0, K2HR3TEMPL_ERROR_MSG_MAXLENGTH) + '...';
		}
		const	errstr = '[' + this.getType() + '] Error : ' + apiutil.getSafeString(message);

		// set resobj
		this._resobj.setError(errstr);
	};

	public mergeExecuteResult = (other: K2hr3TemplateResult): void => {
		this._resobj.merge(other);
	};

	public insertExecuteResult = (other: K2hr3TemplateResult): void => {
		this._resobj.insert(other);
	};

	public getExecuteResult = (): K2hr3TemplateResult => {
		return this._resobj;
	};

	public isExecuteFailure = (): boolean => {
		return this._resobj.isFailure();
	};

	public isExecuteSuccess = (): boolean => {
		return this._resobj.isSuccess();
	};

	public getOriginal = (): string | null => {
		if(!this.isAssemble()){
			return null;
		}
		if(!this.hasNextTemplObject() || !isBaseTemplateObject(this._nextTempl)){
			return null;
		}
		return this._nextTempl.getOriginal();
	};

	public getVariableNames(): string[] | null {
		if(!this.isAssemble()){
			return null;
		}
		if(!this.hasNextTemplObject() || !isBaseTemplateObject(this._nextTempl)){
			return null;
		}
		return this._nextTempl.getVariableNames();
	};

	//
	// This method is intended for use during parsing input units array.
	//
	// This method tests for possible types that execute method may return.
	// The test result and the type actually returned by execute method may be different.
	// The return value determined by runtime can not be checked with this method.
	//
	public isPossibleResultType = (type: number): boolean => {

		if(!this.isAssemble()){
			return false;
		}
		if(!this.hasNextTemplObject() || !isBaseTemplateObject(this._nextTempl)){
			return false;
		}
		return this._nextTempl.isPossibleResultType(type);
	};

	//
	// rollback Method
	//
	// If assembling is failed, you should be better to rollback template object units array in
	// statement or statement object.
	// Then you can call this method, and you can customize this method for subclass.
	//
	public rollbackAssemble = (statementsArray: valTypeStatementsArray): valTypeStatementsArray => {

		r3logger.dlog('this ' + this.getType() + ' class object does not any implement for rollback.');

		if(!this.isAssemble()){
			return statementsArray;
		}
		if(!this.hasNextTemplObject() || !isBaseTemplateObject(this._nextTempl)){
			return statementsArray;
		}
		return this._nextTempl.rollbackAssemble(statementsArray);
	};

	//
	// test assemble Method
	//
	// Test for statementsArray which has statement for the class
	//
	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(!apiutil.isNotEmptyArray(statementsArray)){
			// nothing to do(for eslint error)
		}
		return false;
	};

	//
	// assemble Method
	//
	// This method analyzes input statement object array, and build objects.
	// The input parameter parentObject is class object derived from BaseTemplateObject class,
	// and it is decided according to the purpose of the derived class how to use it.
	// This method returns class object derived from BaseTemplateObject class.
	//
	// If the build succeeds, the statement object array or the array of formUnits contained
	// in it is consumed(deleted).
	//
	public assemble = (
		statementsArray:	valTypeStatementsArray,
		parentObject:		BaseTemplateObject | null
	): BaseTemplateObject | null => {

		if(this.isAssemble()){
			this.setError('this ' + this.getType() + ' class object is already assembled.');
			return null;
		}
		// clear
		this.clear();

		if(null !== parentObject && !isBaseTemplateObject(parentObject)){
			this.setError('input template object is something wrong : ' + JSON.stringify(parentObject));
			return null;
		}

		if(!isNotEmptyStatementsArray(statementsArray)){
			this.setError('input statement object array is something wrong or empty : ' + JSON.stringify(statementsArray));
			return null;
		}
		this.setError('this ' + this.getType() + ' class object can not be assembled.');
		return null;
	};

	//
	// execute Method
	//
	// This method expands own templates and inner object.
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {};
		}

		if(!this.isAssemble()){
			// [NOTE]
			// This base class always comes here.(because could not assemble this class)
			//
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}

		// call next template object execute
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Base Statement Class
//---------------------------------------------------------
class BaseStatementTemplateObject extends BaseTemplateObject {

	protected _selfStatement: valTypeStatementObject | null	= null;
	protected _childTempl: BaseTemplateObject | null		= null;

	//
	// Constructor
	//
	constructor(type?: string | null)
	{
		const newtype = apiutil.isSafeString(type) ? type! : STATEMENTCLASS_TYPE_BASE;
		super(newtype);
		this._selfStatement	= null;						// self statement object(without formula units) after assembling
		this._childTempl	= null;						// child template object in this statement.
	};

	//
	// Methods
	//
	public clear(): void {
		super.clear();
		this._selfStatement	= null;
		this.clearChildTemplObject();
	};

	public hasChildTemplObject = (): boolean => {
		return (null !== this._childTempl);
	};

	public setChildTemplObject = (templObject: BaseTemplateObject | null, is_clear: boolean = false): boolean => {
		if(is_clear && this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			this._childTempl.clear();
		}
		if(null !== templObject && !isBaseTemplateObject(templObject)){
			r3logger.dlog('template object for child is not based BaseTemplateObject, could not set : ' + JSON.stringify(templObject));
			this._childTempl = null;
		}else{
			this._childTempl = templObject;
		}
		return true;
	};

	public getChildTemplObject = (): BaseTemplateObject | null => {
		return this._childTempl;
	};

	public clearChildTemplObject = (): boolean => {
		this.setChildTemplObject(null, true);
		return true;
	};

	public isAssemble = (): boolean => {
		return isSafeStatementObject(this._selfStatement, true);
	};

	public getOriginal = (): string => {
		let	original = '';
		if(!this.isAssemble()){
			return original;
		}

		// self
		if(!isSafeStatementObject(this._selfStatement) || !apiutil.isSafeString(this._selfStatement.origString)){
			r3logger.dlog('this._selfStatement.origString is something wrong : ' + JSON.stringify(this._selfStatement));
		}else{
			// [NOTE]
			// this._selfStatement.origString has all child template object original string,
			// (and child._selfStatement.isReplication is true, it means replication)
			// then we do not need to read original string from child.
			//
			original = this._selfStatement.origString;
		}

		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			original += apiutil.getSafeString(this._nextTempl.getOriginal());
		}
		return original;
	};

	public getVariableNames(): string[] | null {
		if(!this.isAssemble()){
			return null;
		}

		let	vararr: string[] = [];
		let	resarr: string[] | null;

		// child
		if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			resarr = this._childTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}

		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			resarr = this._nextTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}
		return vararr;
	};

	public isPossibleResultType = (type: number): boolean => {
		let	result = false;
		if(!this.isError() && this.isAssemble()){
			switch(type){
				case	TEMPLATE_RESULT_TYPE_STRING:
				case	TEMPLATE_RESULT_TYPE_STRICT_STRING:
					result = true;
					break;
				default:
					// Not string type always returns false, because this class ans subclass always returns string.
					break;
			}
		}
		if(result && this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			result = this._nextTempl.isPossibleResultType(type);
		}
		return result;
	};

	public rollbackAssemble = (statementsArray: valTypeStatementsArray): valTypeStatementsArray => {
		if(!isSafeStatementObject(this._selfStatement, true)){
			// nothing to do
			return statementsArray;
		}

		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			statementsArray = this._nextTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearNextTemplObject();

		// child
		if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			statementsArray = this._childTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearChildTemplObject();

		// _selfStatement into statementsArray
		statementsArray		= rollbackStatementObjectToArray(statementsArray, this._selfStatement);	// if wrong statementsArray, we need to reset statementsArray
		this._selfStatement	= null;
		this.clearParentTemplObject();

		return statementsArray;
	};

	//
	// execute Method
	//
	// This method expands own templates and inner object.
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {};
		}

		if(!this.isAssemble()){
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}

		// execute child template object
		if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			const	childres = this._childTempl.execute(varmap);
			this.insertExecuteResult(childres);
			if(this.isExecuteFailure()){
				return this.getExecuteResult();
			}
		}

		// call next template object execute
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Static Statement Class
//---------------------------------------------------------
class StaticStatementTemplateObject extends BaseStatementTemplateObject {

	protected _selfStatement: valTypeStatementObject | null = null;

	//
	// Constructor
	//
	constructor()
	{
		super(STATEMENTCLASS_TYPE_STATIC);
	};

	//
	// Methods
	//
	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(!isNotEmptyStatementsArray(statementsArray) || statementsArray[0].isStatement || isReplicationStatementObject(statementsArray[0])){
			// target must not be replication object.
			return false;
		}
		return true;
	};

	//
	// assemble Method
	//
	// This method analyzes input statement object array, and build objects.
	// The input parameter parentObject is class object derived from BaseTemplateObject class,
	// and it is decided according to the purpose of the derived class how to use it.
	// This method returns class object derived from BaseTemplateObject class.
	//
	// If the build succeeds, the statement object array or the array of formUnits contained
	// in it is consumed(deleted).
	//
	public assemble = (
		statementsArray:	valTypeStatementsArray,
		parentObject:		BaseTemplateObject | null
	): BaseTemplateObject | null => {

		if(this.isAssemble()){
			this.setError('this ' + this.getType() + ' class object is already assembled.');
			return null;
		}
		// clear
		this.clear();

		if(null !== parentObject && !isBaseTemplateObject(parentObject)){
			this.setError('input template object is something wrong : ' + JSON.stringify(parentObject));
			return null;
		}
		if(!isNotEmptyStatementsArray(statementsArray)){
			this.setError('input statement array is something wrong or empty : ' + JSON.stringify(statementsArray));
			return null;
		}
		if(statementsArray[0].isStatement){
			this.setError('input statement array[0] has statement flag : ' + JSON.stringify(statementsArray[0]));
			return null;
		}
		this.setParentTemplObject(parentObject);
		this._selfStatement = statementsArray[0];
		statementsArray.shift();

		return this;
	};

	//
	// execute Method
	//
	// This method expands own templates and inner object.
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {};
		}

		if(!this.isAssemble()){
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}

		// This class returns original string(not cvtString)
		if(!isSafeStatementObject(this._selfStatement) || (null !== this._selfStatement.cvtString && !apiutil.isString(this._selfStatement.cvtString))){
			this.setExecuteError('this statement object is wrong or its cvtstring value is wrong.');
		}else{
			this._resobj.addTemplString(this._selfStatement.cvtString);
		}

		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Comment Statement Class
//---------------------------------------------------------
class CommentStatementTemplateObject extends BaseStatementTemplateObject {

	protected _selfStatement: valTypeStatementObject | null = null;

	//
	// Constructor
	//
	constructor()
	{
		super(STATEMENTCLASS_TYPE_COMMENT);
	};

	//
	// Methods
	//
	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(	!isNotEmptyStatementsArray(statementsArray)					||
			!statementsArray[0].isStatement								||
			isReplicationStatementObject(statementsArray[0])			||		// target must not be replication object.
			!apiutil.isNotEmptyArray(statementsArray[0].formUnits)		||
			1 < statementsArray[0].formUnits.length						||
			!apiutil.isNotEmptyArray(statementsArray[0].formUnits[0])	||
			TEMPL_COMMENT_KW !== statementsArray[0].formUnits[0][0]		)
		{
			return false;
		}
		return true;
	};

	//
	// assemble Method
	//
	// This method analyzes input statement object array, and build objects.
	// The input parameter parentObject is class object derived from BaseTemplateObject class,
	// and it is decided according to the purpose of the derived class how to use it.
	// This method returns class object derived from BaseTemplateObject class.
	//
	// If the build succeeds, the statement object array or the array of formUnits contained
	// in it is consumed(deleted).
	//
	public assemble = (
		statementsArray:	valTypeStatementsArray,
		parentObject:		BaseTemplateObject | null
	): BaseTemplateObject | null => {

		if(this.isAssemble()){
			this.setError('this ' + this.getType() + ' class object is already assembled.');
			return null;
		}
		// clear
		this.clear();

		if(null !== parentObject && !isBaseTemplateObject(parentObject)){
			this.setError('input template object is something wrong : ' + JSON.stringify(parentObject));
			return null;
		}
		if(!isNotEmptyStatementsArray(statementsArray)){
			this.setError('input statement array is something wrong or empty : ' + JSON.stringify(statementsArray));
			return null;
		}
		if(!statementsArray[0].isStatement){
			this.setError('input statement array[0] does not have statement flag : ' + JSON.stringify(statementsArray[0]));
			return null;
		}
		if(!apiutil.isNotEmptyArray(statementsArray[0].formUnits) || 1 < statementsArray[0].formUnits.length || !apiutil.isNotEmptyArray(statementsArray[0].formUnits[0]) || TEMPL_COMMENT_KW !== statementsArray[0].formUnits[0][0]){
			// statement is not comment statement
			this.setError('input statement array[0] is not comment statement or too many units : ' + JSON.stringify(statementsArray[0]));
			return null;
		}

		this.setParentTemplObject(parentObject);
		this._selfStatement = statementsArray[0];
		statementsArray.shift();

		return this;
	};

	//
	// execute Method
	//
	// This method expands own templates and inner object.
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {};
		}

		if(!this.isAssemble()){
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}
		this._resobj.addTemplString('');					// comment string is empty string

		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Print Statement Class
//---------------------------------------------------------
class PrintStatementTemplateObject extends BaseStatementTemplateObject {

	protected _selfStatement: valTypeStatementObject | null = null;

	//
	// Constructor
	//
	constructor()
	{
		super(STATEMENTCLASS_TYPE_PRINT);
	};

	//
	// Methods
	//
	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(	!isNotEmptyStatementsArray(statementsArray)					||
			!statementsArray[0].isStatement								||
			isReplicationStatementObject(statementsArray[0])			||		// target must not be replication object.
			!apiutil.isNotEmptyArray(statementsArray[0].formUnits)		||
			!apiutil.isNotEmptyArray(statementsArray[0].formUnits[0])	||
			TEMPL_PRINT_KW !== statementsArray[0].formUnits[0][0]		)
		{
			return false;
		}
		return true;
	};

	//
	// assemble Method
	//
	// This method analyzes input statement object array, and build objects.
	// The input parameter parentObject is class object derived from BaseTemplateObject class,
	// and it is decided according to the purpose of the derived class how to use it.
	// This method returns class object derived from BaseTemplateObject class.
	//
	// If the build succeeds, the statement object array or the array of formUnits contained
	// in it is consumed(deleted).
	//
	public assemble = (
		statementsArray:	valTypeStatementsArray,
		parentObject:		BaseTemplateObject | null
	): BaseTemplateObject | null => {

		if(this.isAssemble()){
			this.setError('this ' + this.getType() + ' class object is already assembled.');
			return null;
		}
		// clear
		this.clear();

		if(null !== parentObject && !isBaseTemplateObject(parentObject)){
			this.setError('input template object is something wrong : ' + JSON.stringify(parentObject));
			return null;
		}
		if(!isNotEmptyStatementsArray(statementsArray)){
			this.setError('input statement array is something wrong or empty : ' + JSON.stringify(statementsArray));
			return null;
		}
		if(!statementsArray[0].isStatement){
			this.setError('input statement array[0] does not have statement flag : ' + JSON.stringify(statementsArray[0]));
			return null;
		}
		if(!apiutil.isNotEmptyArray(statementsArray[0].formUnits) || 1 < statementsArray[0].formUnits.length || !apiutil.isNotEmptyArray(statementsArray[0].formUnits[0]) || TEMPL_PRINT_KW !== statementsArray[0].formUnits[0][0]){
			// statement is not print statement
			this.setError('input statement array[0] is not print statement or too many units : ' + JSON.stringify(statementsArray[0]));
			return null;
		}

		// set self statement & replicate statement
		this.setParentTemplObject(parentObject);												// set parent
		const	replicatedStatementObj	= replicateK2hr3TemplateStatement(statementsArray[0]);	// replicate statementsArray[0] for analyzing child template
		replicatedStatementObj.formUnits[0].shift();											// cut first print statement keyword('=') from units array( do not compress statement array because we need error if it is empty )
		this._selfStatement				= statementsArray[0];									// reference to top of statement array
		replaceK2hr3TemplateStatementFormUnits(this._selfStatement, [[TEMPL_PRINT_KW]]);		// replace formUnits array to print statement keyword('=') in self statement object.
		statementsArray.shift();																// cut top of statement array
		statementsArray.unshift(replicatedStatementObj);										// insert replicated statement object at top of statement array
		const	backupStatementCount	= statementsArray.length;								// backup the current length of statement array because of checking next template after.

		// create child template object
		let		buildResult = createK2hr3TemplateObject(statementsArray, this);					// child's parent is this.
		if(!buildResult.result){
			// do rollback
			//
			// [NOTE]
			// rollback method implemented by BaseTemplateObject will operate assuming that the
			// first element of statement array is took out and set self statement object.
			// And it also check child template objects for rollback.
			//
			// eslint-disable-next-line no-useless-assignment
			statementsArray = this.rollbackAssemble(statementsArray);
			this.setError('failed to make child template object for print statement : ' + buildResult.message);
			return null;
		}
		this.setChildTemplObject((buildResult.templObj ?? null), true);

		// if the statement array is not decreasing, it probably the formUnits is left yet.
		// then these remaining formUnits is analyzed here.
		//
		if(backupStatementCount <= (statementsArray.length)){
			buildResult = createK2hr3TemplateObject(statementsArray, this);					// next template(parent is this object).
			// re-check
			if(!buildResult.result){
				// do rollback
				// eslint-disable-next-line no-useless-assignment
				statementsArray = this.rollbackAssemble(statementsArray);
				this.setError('failed to make next template object for print statement : ' + buildResult.message);
				return null;
			}
			this.setNextTemplObject((buildResult.templObj ?? null), true);
		}
		return this;
	};

	//
	// execute Method
	//
	// This method expands own templates and inner object.
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {};
		}

		if(!this.isAssemble()){
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}else if(!this.hasChildTemplObject()){
			this.setExecuteError('there is no child template object for print statement.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}

		// execute child template object and make printable last value
		if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			const	childres = this._childTempl.execute(varmap);
			this._resobj.insertPrint(childres);
			if(this.isExecuteFailure()){
				return this.getExecuteResult();
			}
		}

		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Base Formula Class
//---------------------------------------------------------
class BaseFormulaObject extends BaseTemplateObject {

	protected _leftTempl: BaseTemplateObject | null			= null;		// left terms variable or condition, this is template class obejct.
	protected _rightTempl: BaseTemplateObject | null		= null;		// right terms variable or condition, this is template class obejct.
	protected _selfStatement: valTypeStatementObject | null	= null;

	//
	// Constructor
	//
	constructor(type?: string)
	{
		super(apiutil.isSafeString(type) ? type : FORMULACLASS_TYPE_BASE);
	};

	//
	// Methods
	//
	public clear(): void {
		super.clear();
		this.clearLeftTemplObject();
		this.clearRightTemplObject();
	};

	public isAssemble = (): boolean => {
		return isSafeStatementObject(this._selfStatement, true);
	};

	public setTemplObject = (
		otherTempl?:	BaseTemplateObject | null,
		is_leftTempl?:	boolean,
		is_overwrite?:	boolean,
		is_clear?:		boolean
	): boolean => {

		if(apiutil.isSafeEntity(otherTempl)){
			if(!isBaseTemplateObject(otherTempl)){
				r3logger.dlog('input other template object is something wrong.');
				return false;
			}
		}else{
			// null or undefined is specified, it means clear left/right template object.
		}
		if(!apiutil.isBoolean(is_leftTempl)){
			is_leftTempl = true;									// default left template object
		}
		if(!apiutil.isBoolean(is_clear)){
			is_clear = false;
		}

		// check left/right template object conflict
		if(apiutil.isBoolean(is_overwrite) && !is_overwrite){		// default is_overwrite = true
			if(	(is_leftTempl  && isBaseTemplateObject(this._leftTempl))	||
				(!is_leftTempl && isBaseTemplateObject(this._rightTempl)))
			{
				r3logger.dlog('already has left/right formula object, then could not over write it.');
				return false;
			}
		}

		// clear old
		if(is_clear && is_leftTempl && apiutil.isSafeEntity(this._leftTempl)){
			if(isBaseTemplateObject(this._leftTempl)){
				this._leftTempl.clear();
			}else{
				this._leftTempl = null;
			}
		}else if(is_clear && !is_leftTempl && apiutil.isSafeEntity(this._rightTempl)){
			if(isBaseTemplateObject(this._rightTempl)){
				this._rightTempl.clear();
			}else{
				this._rightTempl = null;
			}
		}

		if(is_leftTempl){
			this._leftTempl	= otherTempl ?? null;
		}else{
			this._rightTempl= otherTempl ?? null;
		}
		return true;
	};

	public hasLeftTemplObject = (): boolean => {
		return (null !== this._leftTempl);
	};

	public setLeftTemplObject = (
		otherTempl:		BaseTemplateObject | null,
		is_overwrite?:	boolean,
		is_clear?:		boolean
	): boolean => {

		return this.setTemplObject(otherTempl, true, is_overwrite, is_clear);
	};

	public getLeftTemplObject = (): BaseTemplateObject | null => {
		return this._leftTempl;
	};

	public clearLeftTemplObject = (): boolean => {
		return this.setTemplObject(null, true, true, true);
	};

	public hasRightTemplObject = (): boolean => {
		return (null !== this._rightTempl);
	};

	public setRightTemplObject = (
		otherTempl:		BaseTemplateObject | null,
		is_overwrite?:	boolean,
		is_clear?:		boolean
	): boolean => {

		return this.setTemplObject(otherTempl, false, is_overwrite, is_clear);
	};

	public getRightTemplObject = (): BaseTemplateObject | null => {
		return this._rightTempl;
	};

	public clearRightTemplObject = (): boolean => {
		return this.setTemplObject(null, false, true, true);
	};

	// 
	// Special method for some subclasses
	// 
	// This method is a special method for CalculateFormulaObject and ConditionFormulaObject subclasses.
	// If this method is called from other subclasses, that is equivalent to setRightTemplObject method.
	// The purpose of this method is to recombine parent-child tree of BaseFormulaObject with taking
	// operator precedence into account.
	// 
	public recombineRightTemplObject = (otherTempl: BaseTemplateObject): boolean => {

		if(!isBaseTemplateObject(otherTempl)){
			r3logger.dlog('input other template object is not based BaseFormulaObject : ' + JSON.stringify(otherTempl));
			return false;
		}

		// check is lower priority
		const	compress = compareOperatorPriority(this, otherTempl, false);
		if(compress && isBaseFormulaObject(otherTempl)){
			// Priority is otherTempl < this, then need to recombine
			const	this_old_parent	= this.getParentTemplObject();
			const	other_old_left	= otherTempl.getLeftTemplObject();

			// other->parent = this->parent
			if(!otherTempl.setParentTemplObject(this_old_parent)){
				r3logger.dlog('could not set other template object\'s parent.');
				return false;
			}
			// other->left = this
			if(!otherTempl.setLeftTemplObject(this, true, false)){				// not clear
				r3logger.dlog('could not set other template object\'s left.');
				return false;
			}
			// this->parent = other
			if(!this.setParentTemplObject(otherTempl)){
				r3logger.dlog('could not set parent template object.');
				return false;
			}
			// this->right = other->left
			if(!this.setRightTemplObject(other_old_left, true, true)){
				r3logger.dlog('could not set right template object.');
				return false;
			}
			// other->left(new this->right)->parent = this
			if(isBaseTemplateObject(other_old_left)){
				if(!other_old_left.setParentTemplObject(this)){
					r3logger.dlog('could not set parent for other template object\'s left.');
					return false;
				}
			}
		}else{
			// Priority is this < otherTempl, then otherTempl is set right.
			if(!this.setRightTemplObject(otherTempl, true, true)){
				r3logger.dlog('could not set right template object.');
				return false;
			}
		}
		return true;
	};

	public getOriginal = (): string => {
		let	original = '';
		if(!this.isAssemble()){
			return original;
		}

		// left
		if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
			original += apiutil.getSafeString(this._leftTempl.getOriginal());
		}

		// self
		if(isSafeStatementObject(this._selfStatement) && !this._selfStatement.isReplication && apiutil.isSafeString(this._selfStatement.origString)){
			// [NOTE]
			// this._selfStatement.isReplication is false, put original string.
			//
			original = this._selfStatement.origString;
		}

		// right
		if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
			original += apiutil.getSafeString(this._rightTempl.getOriginal());
		}

		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			original += apiutil.getSafeString(this._nextTempl.getOriginal());
		}
		return original;
	};

	public getVariableNames(): string[] | null {
		if(!this.isAssemble()){
			return null;
		}

		let vararr: string[] = [];
		let resarr: string[] | null;

		// left
		if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
			resarr = this._leftTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}

		// [NOTE]
		// you should overwrite this in subclass when the subclass has variable and its name.
		// we do not add this._selfStatement.formUnits.
		//

		// right
		if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
			resarr = this._rightTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}

		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			resarr = this._nextTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}
		return vararr;
	};

	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(	!isNotEmptyStatementsArray(statementsArray)					||
			!statementsArray[0].isStatement								||
			!apiutil.isNotEmptyArray(statementsArray[0].formUnits)		||
			!apiutil.isNotEmptyArray(statementsArray[0].formUnits[0])	||
			(!isReplicationStatementObject(statementsArray[0]) && TEMPL_COMMENT_KW	=== statementsArray[0].formUnits[0][0])	||
			(!isReplicationStatementObject(statementsArray[0]) && TEMPL_PRINT_KW	=== statementsArray[0].formUnits[0][0])	)
		{
			return false;
		}
		return true;
	};

	// 
	// Basically rollback method sets self units data to statementsArray[].formUnits[].
	// For example, if the subclass for syntax, it puts self units array into some array
	// in statementsArray[].formUnits[].
	// 
	public rollbackAssemble = (statementsArray: valTypeStatementsArray): valTypeStatementsArray => {
		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			statementsArray = this._nextTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearNextTemplObject();

		// right
		if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
			statementsArray = this._rightTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearRightTemplObject();

		// self
		//
		// [NOTE]
		// do not clear this object, because we need error message.
		//
		if(isSafeStatementObject(this._selfStatement)){
			statementsArray	= rollbackStatementObjectToArray(statementsArray, this._selfStatement);	// if wrong statementsArray, this result is set new statementsArray
		}
		this._selfStatement	= null;
		this.clearParentTemplObject();

		// left
		if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
			statementsArray = this._leftTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearLeftTemplObject();

		return statementsArray;
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Variable Formula Class
//---------------------------------------------------------
//
// This class realizes static string, static value(null/true/false), static number
// and variables. The input patterns are following:
//	static string:		'val' or "val"
//	static value:		null, true, false
//	static number:		123, 0x123, x123, b1010
//	variables:			%val%, %yrn:yahoo:::....%, %val%[1], %val%{%pos%}, etc
//
class VariableFormulaObject extends BaseFormulaObject {

	protected _name: string | null	= null;		// variable name when %...% template
	protected _value: valTypeAll	= null;		// static variable value when null/true/false/number/string
	protected _length: boolean		= false;	// array or object length property, example '.length'

	//
	// Constructor
	//
	constructor()
	{
		super(FORMULACLASS_TYPE_VARIABLE);
	}

	//
	// Methods
	//
	public clear(): void {
		super.clear();
		this._name	= null;
		this._value	= null;
		this._length= false;
	};

	public getVariableNames(): string[] | null {
		if(!this.isAssemble()){
			return null;
		}
		let vararr: string[] = [];
		let resarr: string[] | null;

		// self
		if(apiutil.isSafeString(this._name)){
			vararr.push(this._name);							// variable name( %...name...% )
		}

		// right
		if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
			resarr = this._rightTempl.getVariableNames();							// right template object has variable index( %...%{%...index...%} )
			vararr = apiutil.mergeArray(vararr, resarr);
		}

		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			resarr = this._nextTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}
		return vararr;
	};

	public rollbackAssemble = (statementsArray: valTypeStatementsArray): valTypeStatementsArray => {
		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			statementsArray = this._nextTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearNextTemplObject();

		// [NOTE] DO NOT ROLLBACK RIGHT TEMPLATE STATEMENTS
		// this object has right template object(not have left one), but _selfStatement array
		// includes right template object units array.
		// then we rollbacks only _selfStatement to statement array.
		//

		// clear right template object
		this.clearRightTemplObject();

		if(isSafeStatementObject(this._selfStatement)){
			statementsArray	= rollbackStatementObjectToArray(statementsArray, this._selfStatement);	// if wrong statementsArray, this result is set new statementsArray
		}
		this._selfStatement	= null;
		this.clearParentTemplObject();

		return statementsArray;
	};

	public isPossibleResultType = (type: number): boolean => {
		let	result = false;

		if(!this.isError() && this.isAssemble()){
			switch(type){
				case	TEMPLATE_RESULT_TYPE_NULL:
					// "null" type is generated by static null, variable
					result = (apiutil.isSafeString(this._name) || null === this._value);
					break;

				case	TEMPLATE_RESULT_TYPE_BOOLEAN:
					// "boolean" type is generated by static true/false, variable
					result = (apiutil.isSafeString(this._name) || apiutil.isBoolean(this._value));
					break;

				case	TEMPLATE_RESULT_TYPE_NUMBER:
					// "number" type is generated by static number, variable
					result = (apiutil.isSafeString(this._name) || this._length || (!apiutil.isBoolean(this._value) && null !== this._value && apiutil.isSafeNumeric(this._value)));
					break;

				case	TEMPLATE_RESULT_TYPE_VARIABLE:
					// "variable" type is generated by only variable
					result = apiutil.isSafeString(this._name);
					break;

				case	TEMPLATE_RESULT_TYPE_STRING:
					// "string" type is generated by static string, variable, number
					result = (apiutil.isSafeString(this._name) || apiutil.isSafeString(this._value) || (!apiutil.isBoolean(this._value) && null !== this._value && apiutil.isSafeNumeric(this._value)));
					break;

				case	TEMPLATE_RESULT_TYPE_STRICT_STRING:
					// strict "string" type is generated by static string, variable
					result = (apiutil.isSafeString(this._name) || apiutil.isSafeString(this._value));
					break;

				case	TEMPLATE_RESULT_TYPE_NOSTATIC:
					// not static variable type is variable which can be used as buffer
					result = apiutil.isSafeString(this._name);
					break;

				case	TEMPLATE_RESULT_TYPE_ANYVALUE:
					// any variable type is all
					result = true;
					break;

				default:
					break;
			}
			if(result && this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
				result = this._nextTempl.isPossibleResultType(type);
			}
		}
		return result;
	};

	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(!BaseFormulaObject.prototype.testAssemble.call(this, statementsArray)){
			return false;
		}
		const	unitsArray	= statementsArray[0].formUnits[0];

		if(	0 !== unitsArray[0].indexOf(TEMPL_VALUESEP_KW)				&&
			0 !== unitsArray[0].indexOf(TEMPL_HEX_PREFIX_KW)			&&
			0 !== unitsArray[0].indexOf(TEMPL_HEX2_PREFIX_KW)			&&
			0 !== unitsArray[0].indexOf(TEMPL_OCT_PREFIX_KW)			&&
			0 !== unitsArray[0].indexOf(TEMPL_BIN_PREFIX_KW)			&&
			null !== unitsArray[0].match(/[^0-9]+/)						&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_NULL_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_TRUE_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_FALSE_KW)	&&
			!(2 < unitsArray[0].length && (
				(0 === unitsArray[0].indexOf(TEMPL_SINGLE_QUOTE_KW)	&& TEMPL_SINGLE_QUOTE_KW === unitsArray[0].slice(-1)) ||
				(0 === unitsArray[0].indexOf(TEMPL_DOUBLE_QUOTE_KW)	&& TEMPL_DOUBLE_QUOTE_KW === unitsArray[0].slice(-1))
			))
		){
			return false;
		}
		return true;
	};

	//
	// assemble Method
	//
	// This method(of this class) is using only formUnits array in statementsArray[0].
	//
	// If the build succeeds, the array of formUnits contained in statementsArray[0] is
	// consumed(deleted).
	//
	public assemble = (
		statementsArray:	valTypeStatementsArray,
		parentObject:		BaseTemplateObject | null
	): BaseTemplateObject | null => {

		if(this.isAssemble()){
			this.setError('this ' + this.getType() + ' class object is already assembled.');
			return null;
		}
		// clear
		this.clear();

		if(null !== parentObject && !isBaseTemplateObject(parentObject)){
			this.setError('input template object is something wrong : ' + JSON.stringify(parentObject));
			return null;
		}
		if(!isNotEmptyStatementsArray(statementsArray)){
			this.setError('input statement array is something wrong or empty : ' + JSON.stringify(statementsArray));
			return null;
		}
		if(!statementsArray[0].isStatement){
			this.setError('input statement array[0] does not have statement flag : ' + JSON.stringify(statementsArray[0]));
			return null;
		}
		if(!apiutil.isNotEmptyArray(statementsArray[0].formUnits) || !apiutil.isNotEmptyArray(statementsArray[0].formUnits[0]) || TEMPL_COMMENT_KW === statementsArray[0].formUnits[0][0]){
			this.setError('input statement array[0] does not have statement units : ' + JSON.stringify(statementsArray[0]));
			return null;
		}

		// set self statement & replicate statement
		this.setParentTemplObject(parentObject);													// set parent
		const	replicatedStatementObj		= replicateK2hr3TemplateStatement(statementsArray[0]);	// replicate statementsArray[0] for analyzing child template
		this._selfStatement					= statementsArray[0];									// reference to top of statement array
		const	selfFormUnits: string[][]	= [];													// self form units as empty
		replaceK2hr3TemplateStatementFormUnits(this._selfStatement, selfFormUnits);					// replace formUnits array to empty in self statement object.
		statementsArray.shift();																	// cut top of statement array
		statementsArray.unshift(replicatedStatementObj);											// insert replicated statement object at top of statement array

		const	unitsArray	= statementsArray[0].formUnits[0];
		let		tmpstr: string;
		if(0 === unitsArray[0].indexOf(TEMPL_VALUESEP_KW)){
			//------------------
			// %...%
			//------------------
			// separate name
			this._name = unitsArray[0].substr(1);
			if(this._name.length < 2 || (this._name.length - 1) !== this._name.indexOf(TEMPL_VALUESEP_KW)){
				this.setError('parameter unitsArray is variable type, but it does not have end keyword or variable name is empty : ' + JSON.stringify(selfFormUnits));
				this._name = null;
				this.rollbackAssemble(statementsArray);
				return null;
			}
			this._name = this._name.substr(0, this._name.length - 1);

			// set self units
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// additional check object{...} and array[...]
			//
			// [NOTE]
			// Even an object can be accessed with [...].
			// Also, even if it is an array, {...} can be used by interpreting
			// the subscript number as a character string.
			//
			let	buildResult: resTypeCreateTemplateObject;
			let	right_units: string[];
			let	kw_count: number;

			if(0 < unitsArray.length && TEMPL_SQUARE_START_KW === unitsArray[0]){
				// [...]
				selfFormUnits[selfFormUnits.length - 1].push(unitsArray[0]);				// '[' keyword is this units member
				unitsArray.shift();

				// search end(])
				right_units		= [];														// this value is temporary, all of this is set in selfFormUnits
				kw_count		= 1;
				while(0 < kw_count && 0 < unitsArray.length){
					if(TEMPL_SQUARE_START_KW === unitsArray[0]){							// '[' is nested
						++kw_count;
					}else if(TEMPL_SQUARE_END_KW === unitsArray[0]){
						--kw_count;
					}
					if(0 < kw_count){
						right_units.push(unitsArray[0]);									// "..." in [...] is right units member
					}
					selfFormUnits[selfFormUnits.length - 1].push(unitsArray[0]);			// '[...]' unites is this member
					unitsArray.shift();
				}
				if(0 < kw_count || 0 === right_units.length){
					this.setError('parameter unitsArray is variable array type, but it does not have index : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// make right template object for array index(do not set _rightTempl here, because rollback)
				// (parent is set after checking, because must not rechain parent.)
				buildResult = createK2hr3TemplateObject([createReplicatedK2hr3TemplateStatement(true, [right_units])], null);

				// check
				if(!buildResult.result){
					this.setError('failed to make right template object for variable : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				// if buildResult.templObj is null, it is something wrong.
				if(!isBaseTemplateObject(buildResult.templObj)){
					this.setError('could not create right template object for variable array type : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(apiutil.isNotEmptyArray(right_units)){
					this.setError('variable array type, but index variable is something wrong(rest units) : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER) && !buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_STRING)){
					this.setError('variable array type, but index variable is not number : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// set
				buildResult.templObj.setParentTemplObject(this);								// set parent
				if(!this.setRightTemplObject(buildResult.templObj, true, true)){
					this.setError('failed to set right template object.');
					this.rollbackAssemble(statementsArray);
					return null;
				}

			}else if(0 < unitsArray.length && TEMPL_CURLY_START_KW === unitsArray[0]){
				// {...}
				selfFormUnits[selfFormUnits.length - 1].push(unitsArray[0]);				// '{' keyword is this units member
				unitsArray.shift();

				// search end(])
				right_units		= [];														// this value is temporary, all of this is set in selfFormUnits
				kw_count		= 1;
				while(0 < kw_count && 0 < unitsArray.length){
					if(TEMPL_CURLY_START_KW === unitsArray[0]){								// '{' is nested
						++kw_count;
					}else if(TEMPL_CURLY_END_KW === unitsArray[0]){
						--kw_count;
					}
					if(0 < kw_count){
						right_units.push(unitsArray[0]);									// "..." in {...} is right units member
					}
					selfFormUnits[selfFormUnits.length - 1].push(unitsArray[0]);			// '{...}' unites is this member
					unitsArray.shift();
				}
				if(0 < kw_count || 0 === right_units.length){
					this.setError('parameter unitsArray is variable object type, but it does not have index : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
				}

				// make right template object for array index(do not set _rightTempl here, because rollback)
				// (parent is set after checking, because must not rechain parent.)
				buildResult = createK2hr3TemplateObject([createReplicatedK2hr3TemplateStatement(true, [right_units])], null);

				// check
				if(!buildResult.result){
					this.setError('failed to make right template object for variable : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				// if buildResult.templObj is null, it is something wrong.
				if(!isBaseTemplateObject(buildResult.templObj)){
					this.setError('could not create right template object for variable object type : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(apiutil.isNotEmptyArray(right_units)){
					this.setError('variable object type, but index variable is something wrong(rest units) : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_STRING)){
					this.setError('variable array type, but index variable is not string : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// set
				buildResult.templObj.setParentTemplObject(this);								// set parent
				if(!this.setRightTemplObject(buildResult.templObj, true, true)){
					this.setError('failed to set right template object.');
					this.rollbackAssemble(statementsArray);
					return null;
				}

			}else if(1 === unitsArray.length && (TEMPL_LENGTH_KW === unitsArray[0] || TEMPL_SIZE_KW === unitsArray[0] || TEMPL_COUNT_KW === unitsArray[0])){
				// '.length' or '.size' or '.count'
				selfFormUnits[selfFormUnits.length - 1].push(unitsArray[0]);				// those keywords is this units member
				unitsArray.shift();
				this._length	= true;														// set length property
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_NULL_KW)){
			//------------------
			// null
			//------------------
			this._value		= null;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_TRUE_KW)){
			//------------------
			// true
			//------------------
			this._value		= true;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_FALSE_KW)){
			//------------------
			// false
			//------------------
			this._value		= false;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

		}else if(2 < unitsArray[0].length &&  (
			(0 === unitsArray[0].indexOf(TEMPL_SINGLE_QUOTE_KW) && TEMPL_SINGLE_QUOTE_KW === unitsArray[0].slice(-1)) ||
			(0 === unitsArray[0].indexOf(TEMPL_DOUBLE_QUOTE_KW) && TEMPL_DOUBLE_QUOTE_KW === unitsArray[0].slice(-1))
		)){
			//------------------
			// static string('...' or "...")
			//------------------
			this._value		= unitsArray[0].slice(1, -1);
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

		}else if(0 === unitsArray[0].indexOf(TEMPL_HEX_PREFIX_KW) || 0 === unitsArray[0].indexOf(TEMPL_HEX2_PREFIX_KW)){
			//------------------
			// Hex(16)
			//------------------
			if(0 === unitsArray[0].indexOf(TEMPL_HEX_PREFIX_KW)){
				tmpstr = unitsArray[0].substr(2);
			}else{
				tmpstr = unitsArray[0].substr(1);
			}
			if(null !== tmpstr.match(/[^0-9a-fA-F]+/)){										// allow only 0-9, a-f, A-F
				this.setError('unitsArray[0] is hex(0x...) type, but it has not hex character : ' + JSON.stringify(unitsArray[0]));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			this._value		= parseInt(tmpstr, 16);
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

		}else if(0 === unitsArray[0].indexOf(TEMPL_OCT_PREFIX_KW)){
			//------------------
			// Oct(8)
			//------------------
			tmpstr = unitsArray[0].substr(2);
			if(null !== tmpstr.match(/[^0-7]+/)){											// allow only 0-7
				this.setError('unitsArray[0] is octal(0o...) type, but it has not octal character : ' + JSON.stringify(unitsArray[0]));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			this._value		= parseInt(tmpstr, 8);
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

		}else if(0 === unitsArray[0].indexOf(TEMPL_BIN_PREFIX_KW)){
			//------------------
			// Bin(2)
			//------------------
			tmpstr = unitsArray[0].substr(2);
			if(null !== tmpstr.match(/[^0-1]+/)){											// allow only 0-1
				this.setError('unitsArray[0] is bin(0b...) type, but it has not bin character : ' + JSON.stringify(unitsArray[0]));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			this._value		= parseInt(tmpstr, 2);
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

		}else if(null === unitsArray[0].match(/[^0-9]+/)){
			//------------------
			// Dec(10)
			//------------------
			this._value		= parseInt(unitsArray[0], 10);
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

		}else{
			this.setError('unitsArray[0] is not for this class part : ' + JSON.stringify(unitsArray[0]));
			this.rollbackAssemble(statementsArray);
			return null;
		}

		// check rest statement
		if(isRequireLeftTemplate(statementsArray, REQUIRED_LEFT_VARIABLE)){
			// build rest object with specifying this object as parent.
			const	restResult = createK2hr3TemplateObject(statementsArray, this);
			if(!restResult.result){
				// do rollback
				// eslint-disable-next-line no-useless-assignment
				statementsArray = this.rollbackAssemble(statementsArray);
				this.setError('failed to make rechaining template object for variable : ' + restResult.message);
				return null;
			}
		}
		// compress statement array
		//
		compressStatementsArray(statementsArray);

		return this;
	};

	//
	// execute Method
	//
	// This method expands own templates and inner object.
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {} as valTypeTemplateVariablesMap;
		}

		if(!this.isAssemble()){
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}

		if(apiutil.isSafeString(this._name)){
			// variable(%...%)
			let	right_resobj = null;
			if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
				// get index(number or string) if exists
				right_resobj = this._rightTempl.execute(varmap);
			}
			const tmpTargetInVarMap = varmap[this._name];
			if(undefined === tmpTargetInVarMap){
				// undefined variable, then create it as new.
				r3logger.dlog(this.getType() + ' class object could not found varmap[' + this._name + '], then it create and set new value.');

				varmap[this._name] = null;
				this._resobj.setLastValue(varmap[this._name]);
				this._resobj.setVariableNames(this._name);

			}else if(null !== right_resobj){
				// variable is object or array({...} or [...])
				if(right_resobj.isFailure() || !apiutil.isSafeEntity(right_resobj.getLastValue()) || (!apiutil.isSafeString(right_resobj.getLastValue()) && !apiutil.isSafeNumeric(right_resobj.getLastValue()))){
					// result of right template object is something wrong
					this.setExecuteError('assembled ' + this.getType() + ' class object failed because the index for variable is something wrong.');

				}else{
					const	index = right_resobj.getLastValue();
					if(!apiutil.isString(index) && !apiutil.isSafeNumeric(index)){
						// index is wrong value
						this.setExecuteError('assembled ' + this.getType() + ' class object failed, because right object result value is null or undefined.');
					}else{
						if(apiutil.isArray(tmpTargetInVarMap)){
							if(apiutil.isSafeNumber(index) && apiutil.isSafeEntity(tmpTargetInVarMap[index])){
								this._resobj.setLastValue(tmpTargetInVarMap[index]);
								this._resobj.setVariableNames(this._name, index);
							}else if(apiutil.isSafeNumeric(index)){
								const	tmpIndex = apiutil.cvtToNumber(index);
								if(apiutil.isSafeNumber(tmpIndex) && apiutil.isSafeEntity(tmpTargetInVarMap[tmpIndex])){
									this._resobj.setLastValue(tmpTargetInVarMap[tmpIndex]);
									this._resobj.setVariableNames(this._name, index);	// set original
								}else{
									r3logger.dlog(this.getType() + ' class object could not found varmap[' + this._name + '][' + apiutil.getSafeString(index) + '], then it create and set new value.');
								}
							}else{
								r3logger.dlog(this.getType() + ' class object could not found varmap[' + this._name + '][' + apiutil.getSafeString(index) + '], then it create and set new value.');
							}
						}else if(apiutil.isPlainObject(tmpTargetInVarMap)){
							if(apiutil.isString(index) && apiutil.isSafeEntity(tmpTargetInVarMap[index])){
								this._resobj.setLastValue(tmpTargetInVarMap[index]);
								this._resobj.setVariableNames(this._name, index);
							}else if(apiutil.isSafeNumber(index) && apiutil.isSafeEntity(tmpTargetInVarMap[String(index)])){
								this._resobj.setLastValue(tmpTargetInVarMap[String(index)]);
								this._resobj.setVariableNames(this._name, index);		// set original
							}else{
								r3logger.dlog(this.getType() + ' class object could not found varmap[' + this._name + '][' + apiutil.getSafeString(index) + '], then it create and set new value.');
							}
						}else{
							r3logger.dlog(this.getType() + ' class object could not found varmap[' + this._name + '][' + apiutil.getSafeString(index) + '], then it create and set new value.');
						}
					}
				}

			}else if(this._length){
				// variable is length('.length' or '.size' or '.count')
				let	length = 0;
				if(apiutil.isArray(tmpTargetInVarMap)){
					length = tmpTargetInVarMap.length;
				}else if(apiutil.isPlainObject(tmpTargetInVarMap)){
					length = Object.keys(tmpTargetInVarMap).length;
				}else{
					r3logger.dlog(this.getType() + ' class object could not make length for varmap[' + this._name + '] which is not array nor object, then it set 0.');
				}
				this._resobj.setLastValue(length);
				this._resobj.setVariableNames(this._name);			// the name does not include keyword(ex. '.length')

			}else{
				// variable is simple
				this._resobj.setLastValue(tmpTargetInVarMap);
				this._resobj.setVariableNames(this._name);
			}
		}else{
			this._resobj.setLastValue(this._value);
			this._resobj.setVariableNames();
		}

		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Calculate Formula Class
//---------------------------------------------------------
class CalculateFormulaObject extends BaseFormulaObject {

	protected _calctype: number = FORMULA_CALC_TYPE_UNKNOWN;

	//
	// Constructor
	//
	constructor()
	{
		super(FORMULACLASS_TYPE_CALCULATE);
	};

	//
	// Methods
	//
	public clear(): void {
		super.clear();
		this._calctype = FORMULA_CALC_TYPE_UNKNOWN;
	};

	public getCalculateType = (): number => {
		return this._calctype;
	};

	public isPossibleResultType = (type: number): boolean => {
		let	result = false;
		if(!this.isError() && this.isAssemble()){
			switch(type){
				case	TEMPLATE_RESULT_TYPE_NULL:
					// "null" type is generated by ADD(+ string) calculation
					result = (FORMULA_CALC_TYPE_ADD === this.getCalculateType());
					break;

				case	TEMPLATE_RESULT_TYPE_BOOLEAN:
					// "boolean" type is generated by NOT(!), AMP(&) and VARTBAR(|) calculation
					result = (FORMULA_CALC_TYPE_NOT === this.getCalculateType() || FORMULA_CALC_TYPE_AMP === this.getCalculateType() || FORMULA_CALC_TYPE_VARTBAR === this.getCalculateType());
					break;

				case	TEMPLATE_RESULT_TYPE_NUMBER:
					// "number" type is generated by all calculation except NOT(!), SET(=) and UNKNOWN type
					result = (FORMULA_CALC_TYPE_UNKNOWN !== this.getCalculateType() && FORMULA_CALC_TYPE_SET !== this.getCalculateType() && FORMULA_CALC_TYPE_NOT !== this.getCalculateType());
					break;

				case	TEMPLATE_RESULT_TYPE_VARIABLE:
					// "variable" type is not generated
					result = false;
					break;

				case	TEMPLATE_RESULT_TYPE_STRING:
					// "string" type is generated by all calculation except NOT(!), SET(=) and UNKNOWN type
					// (this means that not null/not boolean)
					result = (FORMULA_CALC_TYPE_UNKNOWN !== this.getCalculateType() && FORMULA_CALC_TYPE_SET !== this.getCalculateType() && FORMULA_CALC_TYPE_NOT !== this.getCalculateType());
					break;

				case	TEMPLATE_RESULT_TYPE_STRICT_STRING:
					// strict "string" type is generated by ADD(+ string) calculation
					result = (FORMULA_CALC_TYPE_ADD === this.getCalculateType());
					break;

				case	TEMPLATE_RESULT_TYPE_NOSTATIC:
					// not static variable type is not generated
					result = false;
					break;

				case	TEMPLATE_RESULT_TYPE_ANYVALUE:
					// any variable type is generated by all except SET(=) calculation
					result = (FORMULA_CALC_TYPE_SET !== this.getCalculateType());
					break;

				default:
					break;
			}
			if(result && this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
				result = this._nextTempl.isPossibleResultType(type);
			}
		}
		return result;
	};

	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(!BaseFormulaObject.prototype.testAssemble.call(this, statementsArray)){
			return false;
		}
		const	unitsArray	= statementsArray[0].formUnits[0];

		if(	TEMPL_NOT_KW		!== unitsArray[0] &&
			TEMPL_INC_KW		!== unitsArray[0] &&
			TEMPL_DEC_KW		!== unitsArray[0] &&
			TEMPL_SET_KW		!== unitsArray[0] &&
			TEMPL_ADD_KW		!== unitsArray[0] &&
			TEMPL_SUB_KW		!== unitsArray[0] &&
			TEMPL_DIV_KW		!== unitsArray[0] &&
			TEMPL_MUL_KW		!== unitsArray[0] &&
			TEMPL_REM_KW		!== unitsArray[0] &&
			TEMPL_LSHIFT_KW		!== unitsArray[0] &&
			TEMPL_RSHIFT_KW		!== unitsArray[0] &&
			TEMPL_AMP_KW		!== unitsArray[0] &&
			TEMPL_VARTBAR_KW	!== unitsArray[0] )
		{
			return false;
		}
		return true;
	};

	//
	// assemble Method
	//
	// This method(of this class) is using only formUnits array in statementsArray[0].
	//
	// If the build succeeds, the array of formUnits contained in statementsArray[0] is
	// consumed(deleted).
	//
	public assemble = (
		statementsArray:	valTypeStatementsArray,
		parentObject:		BaseTemplateObject | null
	): CalculateFormulaObject | null => {

		if(this.isAssemble()){
			this.setError('this ' + this.getType() + ' class object is already assembled.');
			return null;
		}
		// clear
		this.clear();

		if(null !== parentObject && !isBaseTemplateObject(parentObject)){
			this.setError('input template object is something wrong : ' + JSON.stringify(parentObject));
			return null;
		}
		if(!isNotEmptyStatementsArray(statementsArray)){
			this.setError('input statement array is something wrong or empty : ' + JSON.stringify(statementsArray));
			return null;
		}
		if(!statementsArray[0].isStatement){
			this.setError('input statement array[0] does not have statement flag : ' + JSON.stringify(statementsArray[0]));
			return null;
		}
		if(!apiutil.isNotEmptyArray(statementsArray[0].formUnits) || !apiutil.isNotEmptyArray(statementsArray[0].formUnits[0]) || TEMPL_COMMENT_KW === statementsArray[0].formUnits[0][0]){
			this.setError('input statement array[0] does not have statement units : ' + JSON.stringify(statementsArray[0]));
			return null;
		}

		// set self statement & replicate statement
		this.setParentTemplObject(parentObject);													// set parent
		const	replicatedStatementObj		= replicateK2hr3TemplateStatement(statementsArray[0]);	// replicate statementsArray[0] for analyzing child template
		this._selfStatement					= statementsArray[0];									// reference to top of statement array
		const	selfFormUnits: string[][]	= [];
		replaceK2hr3TemplateStatementFormUnits(this._selfStatement, selfFormUnits);					// replace formUnits array to empty in self statement object.
		statementsArray.shift();																	// cut top of statement array
		statementsArray.unshift(replicatedStatementObj);											// insert replicated statement object at top of statement array

		let		buildResult: resTypeCreateTemplateObject;
		const	unitsArray: string[]		= statementsArray[0].formUnits[0];
		let		parent_templ: BaseTemplateObject | null;
		let		errstrkw: string;
		let		isBeforeNull: boolean;
		let		isBeforeNumber: boolean;
		let		isBeforeString: boolean;
		let		isBeforeBoolean: boolean;

		if(TEMPL_NOT_KW === unitsArray[0]){
			//--------------------------
			// '!' calculation
			//--------------------------
			this._calctype	= FORMULA_CALC_TYPE_NOT;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// need right template object
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cut NOT(!) calculation is empty.');
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make right template object
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check
			if(!buildResult.result){
				this.setError('failed to make right template object for calculate : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create right template object for calculate object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_BOOLEAN)){
				this.setError('this is NOT(!) calculation, but right template object is not boolean : ' + JSON.stringify(selfFormUnits));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// set right template object with priority
			if(!this.recombineRightTemplObject(buildResult.templObj)){
				this.setError('failed to set right template object with priority.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

		}else if(TEMPL_INC_KW === unitsArray[0] || TEMPL_DEC_KW === unitsArray[0]){
			//--------------------------
			// '++' or '--' calculation
			//--------------------------
			this._calctype	= (TEMPL_INC_KW === unitsArray[0] ? FORMULA_CALC_TYPE_INC : FORMULA_CALC_TYPE_DEC);
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// check 'value++' or '++value' calculation
			if(apiutil.isSafeEntity(parentObject) && parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER)){
				// switch parent object
				// (get parentObject's parent, it is this object parent.)
				parent_templ = parentObject.getParentTemplObject();

				// left variable is parent object, and switch parent and etc.
				this.setLeftTemplObject(parentObject, true, true);
				parentObject.setParentTemplObject(this);

				// reset parentObject(set this value to this._parentTempl at end of this method)
				// parentObject's next object is set at caller of this method.
				this.setParentTemplObject(parent_templ);

			}else{
				// right variable calculation
				if(!apiutil.isNotEmptyArray(unitsArray)){
					this.setError('rest unitsArray after cutting this INC/DEC(++/--) calculation is empty.');
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// make right template object
				buildResult = createK2hr3TemplateObject(statementsArray, this);

				// check
				if(!buildResult.result){
					this.setError('failed to make right template object for calculate : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				// if buildResult.templObj is null, it is something wrong.
				if(!isBaseTemplateObject(buildResult.templObj)){
					this.setError('could not create right template object for calculate object type : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER)){
					this.setError('this is INC/DEC(++/--) calculation, but right template object is not number or static variable : ' + JSON.stringify(selfFormUnits));
					buildResult.templObj.rollbackAssemble(statementsArray);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				// set right template object with priority
				if(!this.recombineRightTemplObject(buildResult.templObj)){
					this.setError('failed to set right template object with priority.');
					buildResult.templObj.rollbackAssemble(statementsArray);
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}

		}else if(TEMPL_SET_KW === unitsArray[0]){
			//--------------------------
			// '=' calculation
			//--------------------------
			this._calctype	= FORMULA_CALC_TYPE_SET;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// check parent template object type(must be buffer=not static variable)
			if(!apiutil.isSafeEntity(parentObject) || !parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NOSTATIC)){
				this.setError('this is SET(=) calculation, but before(left) template object is not not static variable(buffer) : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// need right template object
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting this SET(=) calculation is empty.');
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make right template object
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check
			if(!buildResult.result){
				this.setError('failed to make right template object for calculate : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create right template object for calculate object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_ANYVALUE)){
				this.setError('this is SET(=) calculation, but right template object is not any value type : ' + JSON.stringify(selfFormUnits));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// set right template object
			if(!this.setRightTemplObject(buildResult.templObj, true, true)){
				this.setError('failed to set right template object.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// switch parent object
			// (get parentObject's parent, it is this object parent.)
			parent_templ = parentObject.getParentTemplObject();

			// left variable is parent object, and switch parent and etc.
			this.setLeftTemplObject(parentObject, true, true);
			parentObject.setParentTemplObject(this);

			// reset parentObject(set this value to this._parentTempl at end of this method)
			// parentObject's next object is set at caller of this method.
			this.setParentTemplObject(parent_templ);

		}else if(TEMPL_ADD_KW === unitsArray[0]){
			//--------------------------
			// '+' calculation
			//--------------------------
			this._calctype	= FORMULA_CALC_TYPE_ADD;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// check parent template object type(this calculation allows number and string type)
			if(!apiutil.isSafeEntity(parentObject) || (!parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER) && !parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_STRING) && !parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NULL))){
				this.setError('this is ADD(+) calculation, but before(left) template object is not number nor string : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			isBeforeNumber	= parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER);	// for using after
			isBeforeString	= parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_STRING);	// for using after
			isBeforeNull	= parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NULL);		// for using after

			// need right template object
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting this ADD(+) calculation is empty.');
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make right template object
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check
			if(!buildResult.result){
				this.setError('failed to make right template object for calculate : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create right template object for calculate object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(	(isBeforeNumber	&& !buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER)) &&
				(isBeforeString	&& (!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_STRING) && !buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NULL))) &&
				(isBeforeNull	&& (!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_STRING) && !buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NULL))) )
			{
				this.setError('this is ADD(+) calculation, but right template object is not number nor string : ' + JSON.stringify(selfFormUnits));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// switch parent object before calling recombineRightTemplObject()
			// (get parentObject's parent, it is this object parent.)
			parent_templ = parentObject.getParentTemplObject();

			// left variable is parent object, and switch parent and etc.
			this.setLeftTemplObject(parentObject, true, true);
			parentObject.setParentTemplObject(this);

			// reset parentObject(set this value to this._parentTempl at end of this method)
			// parentObject's next object is set at caller of this method.
			this.setParentTemplObject(parent_templ);

			// set right template object with priority
			if(!this.recombineRightTemplObject(buildResult.templObj)){
				this.setError('failed to set right template object with priority.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

		}else if(	TEMPL_SUB_KW	=== unitsArray[0] ||
					TEMPL_DIV_KW	=== unitsArray[0] ||
					TEMPL_MUL_KW	=== unitsArray[0] ||
					TEMPL_REM_KW	=== unitsArray[0] ||
					TEMPL_LSHIFT_KW	=== unitsArray[0] ||
					TEMPL_RSHIFT_KW	=== unitsArray[0] )
		{
			//--------------------------
			// '-', '/', '*', '%', '<<', '>>' calculation
			//--------------------------
			this._calctype	= TEMPL_BIN_OP_MAP[unitsArray[0]] ?? FORMULA_CALC_TYPE_RSHIFT;
			errstrkw		= FORMULA_CALAC_TYPE_STR_MAP[this._calctype] ?? 'RSHIFT(>>)';
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// check parent template object result type
			if(!apiutil.isSafeEntity(parentObject) || !parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER)){
				this.setError('this is ' + errstrkw + ' calculation, but right template object is not number : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// need right template object
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting this ' + errstrkw + ' calculation is empty.');
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make right template object
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check
			if(!buildResult.result){
				this.setError('failed to make right template object for calculate : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create right template object for calculate object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER)){
				this.setError('this is ' + errstrkw + ' calculation, but right template object is not number : ' + JSON.stringify(selfFormUnits));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// switch parent object before calling recombineRightTemplObject()
			// (get parentObject's parent, it is this object parent.)
			parent_templ = parentObject.getParentTemplObject();

			// left variable is parent object, and switch parent and etc.
			this.setLeftTemplObject(parentObject, true, true);
			parentObject.setParentTemplObject(this);

			// reset parentObject(set this value to this._parentTempl at end of this method)
			// parentObject's next object is set at caller of this method.
			this.setParentTemplObject(parent_templ);

			// set right template object with priority
			if(!this.recombineRightTemplObject(buildResult.templObj)){
				this.setError('failed to set right template object with priority.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

		}else if(TEMPL_AMP_KW === unitsArray[0] || TEMPL_VARTBAR_KW === unitsArray[0]){
			//--------------------------
			// '&', '|' calculation
			//--------------------------
			this._calctype	= (TEMPL_AMP_KW === unitsArray[0] ? FORMULA_CALC_TYPE_AMP : FORMULA_CALC_TYPE_VARTBAR);
			errstrkw		= (FORMULA_CALC_TYPE_AMP === this.getCalculateType() ? 'AMP(&)' : 'VARTBAR(|)');
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// check parent template object result type
			if(!apiutil.isSafeEntity(parentObject) || (!parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER) && !parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_BOOLEAN))){
				this.setError('this is ' + errstrkw + ' calculation, but right template object is not number nor boolean : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			isBeforeNumber = parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER);	// for using after
			isBeforeBoolean= parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_BOOLEAN);	// for using after

			// need right template object
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting this ' + errstrkw + ' calculation is empty.');
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make right template object
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check
			if(!buildResult.result){
				this.setError('failed to make right template object for calculate : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create right template object for calculate object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(	(isBeforeNumber  && !buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER))	&&
				(isBeforeBoolean && !buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_BOOLEAN)))
			{
				this.setError('this is ' + errstrkw + ' calculation, but right template object is not number nor boolean : ' + JSON.stringify(selfFormUnits));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// switch parent object before calling recombineRightTemplObject()
			// (get parentObject's parent, it is this object parent.)
			parent_templ = parentObject.getParentTemplObject();

			// left variable is parent object, and switch parent and etc.
			this.setLeftTemplObject(parentObject, true, true);
			parentObject.setParentTemplObject(this);

			// reset parentObject(set this value to this._parentTempl at end of this method)
			// parentObject's next object is set at caller of this method.
			this.setParentTemplObject(parent_templ);

			// set right template object with priority
			if(!this.recombineRightTemplObject(buildResult.templObj)){
				this.setError('failed to set right template object with priority.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

		}else{
			this.setError('unknown input first unit(' + unitsArray[0] + ') is specified : ' + JSON.stringify(unitsArray[0]));
			this.rollbackAssemble(statementsArray);
			return null;
		}

		// check rest statement
		if(isRequireLeftTemplate(statementsArray, REQUIRED_LEFT_CALCULATE)){
			// build rest object with specifying this object as parent.
			const	restResult = createK2hr3TemplateObject(statementsArray, this);
			if(!restResult.result){
				// do rollback
				// eslint-disable-next-line no-useless-assignment
				statementsArray = this.rollbackAssemble(statementsArray);
				this.setError('failed to make rechaining template object for variable : ' + restResult.message);
				return null;
			}
		}
		// compress statement array
		//
		compressStatementsArray(statementsArray);

		return this;
	};

	//
	// execute Method
	//
	// This method expands own templates and inner object.
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {};
		}

		if(!this.isAssemble()){
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}

		let	left_resobj: K2hr3TemplateResult | null		= null;
		let	right_resobj: K2hr3TemplateResult | null	= null;
		let	left_value: valTypeAll						= null;
		let	right_value: valTypeAll						= null;
		let	valnamearr: string[] | null					= null;
		let	errstrkw: string;

		if(FORMULA_CALC_TYPE_NOT === this.getCalculateType()){
			//--------------------------
			// '!' calculation
			//--------------------------
			// execute right template object
			if(!this.hasRightTemplObject() || !isBaseTemplateObject(this._rightTempl)){
				this.setExecuteError('could not execute right template object for NOT(!) calculation.');
			}else{
				// execute
				right_resobj = this._rightTempl.execute(varmap);
				if(right_resobj.isFailure()){
					this.setExecuteError('failed executing right template object for NOT(!) calculation : ' + apiutil.getSafeString(right_resobj.getLastValue()));
				}else if(!apiutil.isSafeEntity(right_resobj.getLastValue()) || !apiutil.isBoolean(right_resobj.getLastValue())){
					this.setExecuteError('right template object returns not boolean for NOT(!) calculation : ' + JSON.stringify(right_resobj.getLastValue()));
				}else{
					// calculate NOT(!)
					this._resobj.setLastValue(!right_resobj.getLastValue());
				}
			}
		}else if(FORMULA_CALC_TYPE_INC === this.getCalculateType() || FORMULA_CALC_TYPE_DEC === this.getCalculateType()){
			//--------------------------
			// '++', '--' calculation
			//--------------------------
			if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
				// execute
				left_resobj = this._leftTempl.execute(varmap);
				if(left_resobj.isFailure()){
					this.setExecuteError('failed executing left template object for INC/DEC(++/--) calculation : ' + apiutil.getSafeString(left_resobj.getLastValue()));
				}else if(!apiutil.isSafeEntity(left_resobj.getLastValue()) || !apiutil.isSafeNumeric(left_resobj.getLastValue())){
					this.setExecuteError('left template object returns not number for INC/DEC(++/--) calculation : ' + JSON.stringify(left_resobj.getLastValue()));
				}
				valnamearr = left_resobj.getVariableNames();		// backup variable name array which is used after.

			}else if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
				// execute
				right_resobj = this._rightTempl.execute(varmap);
				if(right_resobj.isFailure()){
					this.setExecuteError('failed executing right template object for INC/DEC(++/--) calculation : ' + apiutil.getSafeString(right_resobj.getLastValue()));
				}else if(!apiutil.isSafeEntity(right_resobj.getLastValue()) || !apiutil.isSafeNumeric(right_resobj.getLastValue())){
					this.setExecuteError('right template object returns not number for INC/DEC(++/--) calculation : ' + JSON.stringify(right_resobj.getLastValue()));
				}
				valnamearr = right_resobj.getVariableNames();		// backup variable name array which is used after.

			}else{
				this.setExecuteError('could not execute left/right template object for INC/DEC(++/--) calculation.');
			}

			// calculate INC/DEC(++/--)
			if(this.isExecuteSuccess()){
				if(null !== left_resobj){
					// first set result, and calculate after that(value++, value--)
					const tmpval = left_resobj.getLastValue();

					if(!apiutil.isSafeNumeric(tmpval)){
						// Not numeric
						this.setExecuteError('last value object returns not number for INC/DEC(++/--) calculation : ' + JSON.stringify(tmpval));
					}else{
						let	tmpNum = apiutil.cvtToNumber(tmpval);
						if(apiutil.isSafeNumber(tmpNum)){
							// set and calculate
							this._resobj.setLastValue(tmpNum);
							if(FORMULA_CALC_TYPE_INC === this.getCalculateType()){
								tmpNum++;
							}else{
								tmpNum--;
							}

							// write back to varmap value if variable name is specified.
							if(apiutil.isStringArray(valnamearr) && apiutil.isNotEmptyArray(valnamearr)){
								if(1 === valnamearr.length && apiutil.isSafeString(valnamearr[0])){
									varmap[valnamearr[0]] = tmpNum;
								}else if(1 < valnamearr.length && apiutil.isSafeString(valnamearr[0]) && apiutil.isSafeString(valnamearr[1])){
									// variable array is maximum 2 layer.
									const tmpVarMap: valTypeTemplateVariablesMap	= {};
									const tmpName									= valnamearr[1];
									tmpVarMap[tmpName]								= tmpNum;

									if(!apiutil.isPlainObject(varmap[valnamearr[0]])){
										varmap[valnamearr[0]] = {};
									}
									varmap[valnamearr[0]] = tmpVarMap;
								}
							}
						}else{
							// Not number
							this.setExecuteError('last value object returns not number for INC/DEC(++/--) calculation : ' + JSON.stringify(tmpval));
						}
					}

				}else{
					// first calculate result, and set after that(++value, --value)
					let tmpval: valTypeAll = null;
					if(isK2hr3TemplateResult(right_resobj)){
						tmpval = right_resobj.getLastValue();
					}

					if(!apiutil.isSafeNumeric(tmpval)){
						// Not numeric
						this.setExecuteError('right template object returns not number for INC/DEC(++/--) calculation : ' + JSON.stringify(tmpval));
					}else{
						let	tmpNum = apiutil.cvtToNumber(tmpval);
						if(apiutil.isSafeNumber(tmpNum)){
							// calculate and set
							if(FORMULA_CALC_TYPE_INC === this.getCalculateType()){
								tmpNum++;
							}else{
								tmpNum--;
							}
							this._resobj.setLastValue(tmpNum);

							// write back to varmap value if variable name is specified.
							if(apiutil.isStringArray(valnamearr) && apiutil.isNotEmptyArray(valnamearr)){
								if(1 === valnamearr.length && apiutil.isSafeString(valnamearr[0])){
									varmap[valnamearr[0]] = tmpNum;
								}else if(1 < valnamearr.length && apiutil.isSafeString(valnamearr[0]) && apiutil.isSafeString(valnamearr[1])){
									// variable array is maximum 2 layer.
									const tmpVarMap: valTypeTemplateVariablesMap	= {};
									const tmpName									= valnamearr[1];
									tmpVarMap[tmpName]								= tmpNum;

									if(!apiutil.isPlainObject(varmap[valnamearr[0]])){
										varmap[valnamearr[0]] = {};
									}
									varmap[valnamearr[0]] = tmpVarMap;
								}
							}
						}else{
							// Not number
							this.setExecuteError('Last value object returns not number for INC/DEC(++/--) calculation : ' + JSON.stringify(tmpval));
						}
					}
				}
			}

		}else if(FORMULA_CALC_TYPE_SET === this.getCalculateType()){
			//--------------------------
			// '=' calculation
			//--------------------------
			if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
				// execute(value allowed any type)
				right_resobj = this._rightTempl.execute(varmap);
				if(right_resobj.isFailure()){
					this.setExecuteError('failed executing right template object for SET(=) calculation : ' + apiutil.getSafeString(right_resobj.getLastValue()));
				}
			}else{
				this.setExecuteError('could not execute left template object for SET(=) calculation.');
			}

			if(this.isExecuteSuccess()){
				// check left value type
				if(!isBaseTemplateObject(this._leftTempl) || !this._leftTempl.isPossibleResultType(TEMPLATE_RESULT_TYPE_NOSTATIC)){
					this.setExecuteError('left template object type is not no-static value for SET(=) calculation.');

				}else{
					// make variable name(array) from left template object
					//
					// [NOTE][FIXME]
					// For example: if "%val%++" is variable name, the result set to double incremented variable name position in varmap.
					//
					// execute for variable name
					left_resobj = this._leftTempl.execute(varmap);
					if(left_resobj.isFailure()){
						this.setExecuteError('failed executing left template object for SET(=) calculation : ' + apiutil.getSafeString(left_resobj.getLastValue()));
					}else{
						// get left value name
						valnamearr = left_resobj.getVariableNames();
						if(!isK2hr3TemplateResult(right_resobj)){
							this.setExecuteError('right object is not safe template result object : ' + JSON.stringify(right_resobj));
						}else if(!apiutil.isStringArray(valnamearr) || !apiutil.isNotEmptyArray(valnamearr)){
							this.setExecuteError('left template object returns empty value name for SET(=) calculation : ' + JSON.stringify(left_resobj.getLastValue()));
						}else{
							// set value
							if(1 === valnamearr.length && apiutil.isSafeString(valnamearr[0])){
								varmap[valnamearr[0]] = right_resobj.getLastValue();
							}else if(1 < valnamearr.length && apiutil.isSafeString(valnamearr[0]) && apiutil.isSafeString(valnamearr[1])){
								// variable array is maximum 2 layer.
								const tmpVarMap: valTypeTemplateVariablesMap	= {};
								const tmpName									= valnamearr[1];
								tmpVarMap[tmpName]								= right_resobj.getLastValue();

								if(!apiutil.isPlainObject(varmap[valnamearr[0]])){
									varmap[valnamearr[0]] = {};
								}
								varmap[valnamearr[0]] = tmpVarMap;
							}
							// set result value.
							this._resobj.setLastValue(right_resobj.getLastValue());
						}
					}
				}
			}

		}else if(FORMULA_CALC_TYPE_ADD === this.getCalculateType()){
			//--------------------------
			// '+' calculation
			//--------------------------
			// left template object
			if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
				// execute
				left_resobj = this._leftTempl.execute(varmap);
				if(left_resobj.isFailure()){
					this.setExecuteError('failed executing left template object for ADD(+) calculation : ' + apiutil.getSafeString(left_resobj.getLastValue()));
				}else if(null !== left_resobj.getLastValue() && !apiutil.isString(left_resobj.getLastValue()) && !apiutil.isSafeNumber(left_resobj.getLastValue())){
					this.setExecuteError('left template object returns not string nor number for ADD(+) calculation : ' + JSON.stringify(left_resobj.getLastValue()));
				}else{
					left_value	= left_resobj.getLastValue();
				}
			}else{
				this.setExecuteError('could not execute left template object for ADD(+) calculation.');
			}

			// right template object
			if(this.isExecuteSuccess()){
				if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
					// execute
					right_resobj = this._rightTempl.execute(varmap);
					if(right_resobj.isFailure()){
						this.setExecuteError('failed executing right template object for ADD(+) calculation : ' + apiutil.getSafeString(right_resobj.getLastValue()));
					}else if(null !== right_resobj.getLastValue() && !apiutil.isString(right_resobj.getLastValue()) && !apiutil.isSafeNumber(right_resobj.getLastValue())){
						this.setExecuteError('right template object returns not string nor number for ADD(+) calculation : ' + JSON.stringify(right_resobj.getLastValue()));
					}else{
						right_value	= right_resobj.getLastValue();
					}
				}else{
					this.setExecuteError('could not execute right template object for ADD(+) calculation.');
				}
			}

			// calculate ADD(+)
			if(this.isExecuteSuccess()){
				let	tmpval: valTypeAll = null;

				if(null === left_value || apiutil.isString(left_value)){
					// left template object result is string
					if(null === right_value || apiutil.isString(right_value)){
						// right template object result is string
						if(null === left_value && null === right_value){
							// both left and right are null
							tmpval = null;
						}else{
							tmpval = apiutil.getSafeString(left_value) + apiutil.getSafeString(right_value);
						}
					}else{
						// right template object result is number
						tmpval = String(null === left_value ? 0 : left_value) + String(right_value);
					}
				}else if(apiutil.isSafeNumber(left_value)){
					// left template object result is number
					if(null === right_value){
						// right template object result is null
						tmpval = left_value;
					}else if(apiutil.isSafeNumeric(right_value)){
						// right template object result is number
						const	tmpnumber = apiutil.cvtToNumber(right_value);
						if(apiutil.isSafeNumber(tmpnumber)){
							tmpval = left_value + tmpnumber;
						}else{
							// right template object result is string, could not add calculation
							this.setExecuteError('could not calculate ADD(+) calculation because left formula is number but right is string : ' + JSON.stringify(left_value) + ' + ' + JSON.stringify(right_value));
						}
					}else if(apiutil.isString(right_value)){
						// right template object result is string, could not add calculation
						this.setExecuteError('could not calculate ADD(+) calculation because left formula is number but right is string : ' + JSON.stringify(left_value) + ' + ' + JSON.stringify(right_value));
					}
				}
				if(this.isExecuteSuccess()){
					this._resobj.setLastValue(tmpval);
				}
			}

		}else if(	FORMULA_CALC_TYPE_SUB	=== this.getCalculateType() ||
					FORMULA_CALC_TYPE_DIV	=== this.getCalculateType() ||
					FORMULA_CALC_TYPE_MUL	=== this.getCalculateType() ||
					FORMULA_CALC_TYPE_REM	=== this.getCalculateType() ||
					FORMULA_CALC_TYPE_LSHIFT=== this.getCalculateType() ||
					FORMULA_CALC_TYPE_RSHIFT=== this.getCalculateType() )
		{
			//--------------------------
			// '-', '/', '*', '%', '<<', '>>' calculation
			//--------------------------
			errstrkw = FORMULA_CALAC_TYPE_STR_MAP[this.getCalculateType()] ?? 'RSHIFT(>>)';

			// left template object
			if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
				// execute
				left_resobj = this._leftTempl.execute(varmap);
				if(left_resobj.isFailure()){
					this.setExecuteError('failed executing left template object for ' + errstrkw + ' calculation : ' + apiutil.getSafeString(left_resobj.getLastValue()));
				}else if(!apiutil.isSafeEntity(left_resobj.getLastValue()) || !apiutil.isSafeNumeric(left_resobj.getLastValue())){
					this.setExecuteError('left template object returns not number for ' + errstrkw + ' calculation : ' + JSON.stringify(left_resobj.getLastValue()));
				}else{
					left_value	= left_resobj.getLastValue();
				}
			}else{
				this.setExecuteError('could not execute left template object for ' + errstrkw + ' calculation.');
			}

			// right template object
			if(this.isExecuteSuccess()){
				if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
					// execute
					right_resobj = this._rightTempl.execute(varmap);
					if(right_resobj.isFailure()){
						this.setExecuteError('failed executing right template object for ' + errstrkw + ' calculation : ' + apiutil.getSafeString(right_resobj.getLastValue()));
					}else if(!apiutil.isSafeEntity(right_resobj.getLastValue()) || !apiutil.isSafeNumeric(right_resobj.getLastValue())){
						this.setExecuteError('right template object returns not number for ' + errstrkw + ' calculation : ' + JSON.stringify(right_resobj.getLastValue()));
					}else{
						right_value	= right_resobj.getLastValue();
					}
				}else{
					this.setExecuteError('could not execute right template object for ' + errstrkw + ' calculation.');
				}
			}

			// calculate
			if(this.isExecuteSuccess()){
				// convert to number
				//
				// [NOTE]
				// Before this process, it has been confirmed that both left and right are
				// numbers or numeric strings.
				//
				let	tmpval: valTypeAll	= null;
				let	tmpleftval: number	= 0;
				let	tmprightval: number	= 0;
				if(apiutil.isSafeNumber(left_value)){
					tmpleftval = left_value;
				}else if(apiutil.isSafeNumeric(left_value)){
					const	tmpnumber = apiutil.cvtToNumber(left_value);
					if(apiutil.isSafeNumber(tmpnumber)){
						tmpleftval = tmpnumber;
					}
				}
				if(apiutil.isSafeNumber(right_value)){
					tmprightval = right_value;
				}else if(apiutil.isSafeNumeric(right_value)){
					const	tmpnumber = apiutil.cvtToNumber(right_value);
					if(apiutil.isSafeNumber(tmpnumber)){
						tmprightval = tmpnumber;
					}
				}

				if(FORMULA_CALC_TYPE_SUB === this.getCalculateType()){
					tmpval = tmpleftval - tmprightval;
				}else if(FORMULA_CALC_TYPE_DIV === this.getCalculateType()){
					if(0 === tmprightval){
						this.setExecuteError('right template object result is 0, so could not division(/) by 0.');
					}else{
						tmpval = tmpleftval / tmprightval;
					}
				}else if(FORMULA_CALC_TYPE_MUL === this.getCalculateType()){
					tmpval = tmpleftval * tmprightval;
				}else if(FORMULA_CALC_TYPE_REM === this.getCalculateType()){
					if(0 === tmprightval){
						this.setExecuteError('right template object result is 0, so could not division(%) by 0.');
					}else{
						tmpval = tmpleftval % tmprightval;
					}
				}else if(FORMULA_CALC_TYPE_LSHIFT === this.getCalculateType()){
					tmpval = tmpleftval << tmprightval;
				}else{	// FORMULA_CALC_TYPE_RSHIFT === this.getCalculateType()
					tmpval = tmpleftval >> tmprightval;
				}
				if(this.isExecuteSuccess()){
					this._resobj.setLastValue(tmpval);
				}
			}

		}else if(FORMULA_CALC_TYPE_AMP === this.getCalculateType() || FORMULA_CALC_TYPE_VARTBAR === this.getCalculateType()){
			//--------------------------
			// '&', '|' calculation
			//--------------------------
			errstrkw = (FORMULA_CALC_TYPE_AMP === this.getCalculateType() ? 'AMP(&)' : 'VARTBAR(|)');

			// left template object
			if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
				// execute
				left_resobj = this._leftTempl.execute(varmap);
				if(left_resobj.isFailure()){
					this.setExecuteError('failed executing left template object for ' + errstrkw + ' calculation : ' + apiutil.getSafeString(left_resobj.getLastValue()));
				}else if(apiutil.isBoolean(left_resobj.getLastValue())){
					// convert boolean to number(1/0)
					left_value = left_resobj.getLastValue() ? 1 : 0;
				}else if(apiutil.isSafeNumeric(left_resobj.getLastValue())){
					left_value = left_resobj.getLastValue();
				}else{
					this.setExecuteError('left template object returns not number nor boolean for ' + errstrkw + ' calculation : ' + JSON.stringify(left_resobj.getLastValue()));
				}
			}else{
				this.setExecuteError('could not execute left template object for ' + errstrkw + ' calculation.');
			}

			// right template object
			if(this.isExecuteSuccess()){
				if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
					// execute
					right_resobj = this._rightTempl.execute(varmap);
					if(right_resobj.isFailure()){
						this.setExecuteError('failed executing right template object for ' + errstrkw + ' calculation : ' + apiutil.getSafeString(right_resobj.getLastValue()));
					}else if(apiutil.isBoolean(right_resobj.getLastValue())){
						// convert boolean to number(1/0)
						right_value = right_resobj.getLastValue() ? 1 :0;
					}else if(apiutil.isSafeNumeric(right_resobj.getLastValue())){
						right_value = right_resobj.getLastValue();
					}else{
						this.setExecuteError('right template object returns not number nor boolean for ' + errstrkw + ' calculation : ' + JSON.stringify(right_resobj.getLastValue()));
					}
				}else{
					this.setExecuteError('could not execute right template object for ' + errstrkw + ' calculation.');
				}
			}

			// calculate
			if(this.isExecuteSuccess()){
				let	tmpval: valTypeAll = null;
				if(apiutil.isSafeNumeric(left_value) && apiutil.isSafeNumeric(right_value)){
					// number
					let	tmpleftval	= apiutil.cvtToNumber(left_value);
					let	tmprightval	= apiutil.cvtToNumber(right_value);
					if(!apiutil.isSafeNumber(tmpleftval)){
						tmpleftval	= 0;
					}
					if(!apiutil.isSafeNumber(tmprightval)){
						tmprightval	= 0;
					}
					if(FORMULA_CALC_TYPE_AMP === this.getCalculateType()){
						tmpval = tmpleftval & tmprightval;
					}else{	// FORMULA_CALC_TYPE_VARTBAR === this.getCalculateType()
						tmpval = tmpleftval | tmprightval;
					}
				}else{
					// left and right template object result is not same type
					this.setExecuteError('could not calculate ' + errstrkw + ' calculation because left and right formula result is not same type : ' + JSON.stringify(left_value) + ' and ' + JSON.stringify(right_value));
				}
				if(this.isExecuteSuccess()){
					this._resobj.setLastValue(tmpval);
				}
			}

		}else{
			// why?
			this.setExecuteError('calculation type is unknown : ' + JSON.stringify(this.getCalculateType()));
		}

		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Condition Formula Class
//---------------------------------------------------------
class ConditionFormulaObject extends BaseFormulaObject {

	protected _condtype: number = FORMULA_COND_TYPE_UNKNOWN;

	//
	// Constructor
	//
	constructor()
	{
		super(FORMULACLASS_TYPE_CONDITION);
	};

	//
	// Methods
	//
	public clear(): void {
		super.clear();
		this._condtype = FORMULA_COND_TYPE_UNKNOWN;
	};

	public getConditionType = (): number => {
		return this._condtype;
	};

	public isPossibleResultType = (type: number): boolean => {
		let	result = false;
		if(!this.isError() && this.isAssemble() && (TEMPLATE_RESULT_TYPE_BOOLEAN === type || TEMPLATE_RESULT_TYPE_ANYVALUE === type)){
			// This class always returns only boolean.
			//
			result = true;
		}
		if(result && this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			result = this._nextTempl.isPossibleResultType(type);
		}
		return result;
	};

	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(!BaseFormulaObject.prototype.testAssemble.call(this, statementsArray)){
			return false;
		}
		const	unitsArray	= statementsArray[0].formUnits[0];

		if(	TEMPL_AND_KW		!== unitsArray[0] &&
			TEMPL_OR_KW			!== unitsArray[0] &&
			TEMPL_LESS_KW		!== unitsArray[0] &&
			TEMPL_GREAT_KW		!== unitsArray[0] &&
			TEMPL_LESSEQ_KW		!== unitsArray[0] &&
			TEMPL_GREATEQ_KW	!== unitsArray[0] &&
			TEMPL_EQUAL_KW		!== unitsArray[0] &&
			TEMPL_NOTEQ_KW		!== unitsArray[0] )
		{
			return false;
		}
		return true;
	};

	//
	// assemble Method
	//
	// This method(of this class) is using only formUnits array in statementsArray[0].
	//
	// If the build succeeds, the array of formUnits contained in statementsArray[0] is
	// consumed(deleted).
	//
	public assemble = (
		statementsArray:	valTypeStatementsArray,
		parentObject:		BaseTemplateObject | null
	): ConditionFormulaObject | null => {

		if(this.isAssemble()){
			this.setError('this ' + this.getType() + ' class object is already assembled.');
			return null;
		}
		// clear
		this.clear();

		if(null !== parentObject && !isBaseTemplateObject(parentObject)){
			this.setError('input template object is something wrong : ' + JSON.stringify(parentObject));
			return null;
		}
		if(!isNotEmptyStatementsArray(statementsArray)){
			this.setError('input statement array is something wrong or empty : ' + JSON.stringify(statementsArray));
			return null;
		}
		if(!statementsArray[0].isStatement){
			this.setError('input statement array[0] does not have statement flag : ' + JSON.stringify(statementsArray[0]));
			return null;
		}
		if(!apiutil.isNotEmptyArray(statementsArray[0].formUnits) || !apiutil.isNotEmptyArray(statementsArray[0].formUnits[0]) || TEMPL_COMMENT_KW === statementsArray[0].formUnits[0][0]){
			this.setError('input statement array[0] does not have statement units : ' + JSON.stringify(statementsArray[0]));
			return null;
		}

		// set self statement & replicate statement
		this.setParentTemplObject(parentObject);													// set parent
		const	replicatedStatementObj		= replicateK2hr3TemplateStatement(statementsArray[0]);	// replicate statementsArray[0] for analyzing child template
		this._selfStatement					= statementsArray[0];									// reference to top of statement array
		const	selfFormUnits: string[][]	= [];													// self form units as empty
		replaceK2hr3TemplateStatementFormUnits(this._selfStatement, selfFormUnits);					// replace formUnits array to empty in self statement object.
		statementsArray.shift();																	// cut top of statement array
		statementsArray.unshift(replicatedStatementObj);											// insert replicated statement object at top of statement array

		let		buildResult: resTypeCreateTemplateObject;
		const	unitsArray					= statementsArray[0].formUnits[0];
		let		parent_templ: BaseTemplateObject | null;
		let		errstrkw: string;

		if(TEMPL_AND_KW === unitsArray[0] || TEMPL_OR_KW === unitsArray[0]){
			//--------------------------
			// '&&', '||' condition
			//--------------------------
			this._condtype	= (TEMPL_AND_KW === unitsArray[0] ? FORMULA_COND_TYPE_AND : FORMULA_COND_TYPE_OR);
			errstrkw		= (FORMULA_COND_TYPE_AND === this.getConditionType() ? 'AND(&&)' : 'OR(||)');
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// check before template object(all template object has condition result after executing)
			if(!apiutil.isSafeEntity(parentObject)){
				this.setError('this is ' + errstrkw + ' condition, but right template object is something wrong : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// need right template object
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting this ' + errstrkw + ' condition is empty.');
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make right template object
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check
			if(!buildResult.result){
				this.setError('failed to make right template object for condition : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create right template object for ' + errstrkw + ' condition object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// switch parent object before calling recombineRightTemplObject()
			// (get parentObject's parent, it is this object parent.)
			parent_templ = parentObject.getParentTemplObject();

			// left variable is parent object, and switch parent and etc.
			this.setLeftTemplObject(parentObject, true, true);
			parentObject.setParentTemplObject(this);

			// reset parentObject(set this value to this._parentTempl at end of this method)
			// parentObject's next object is set at caller of this method.
			this.setParentTemplObject(parent_templ);

			// set right template object with priority
			if(!this.recombineRightTemplObject(buildResult.templObj)){
				this.setError('failed to set right template object with priority.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

		}else if(	TEMPL_LESS_KW		=== unitsArray[0] ||
					TEMPL_GREAT_KW		=== unitsArray[0] ||
					TEMPL_LESSEQ_KW		=== unitsArray[0] ||
					TEMPL_GREATEQ_KW	=== unitsArray[0] )
		{
			//--------------------------
			// '<', '>', '<=', '>=' condition
			//--------------------------
			this._condtype	= TEMPL_COND_TYPE_MAP[unitsArray[0]] ?? FORMULA_COND_TYPE_GREATEQ;
			errstrkw		= FORMULA_COND_TYPE_STR_MAP[this._condtype] ?? 'UNKNOWN';
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// check before template object type
			if(!apiutil.isSafeEntity(parentObject) || !parentObject.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER)){
				this.setError('this is ' + errstrkw + ' condition, but before(left) template object is not number : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// need right template object
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting this ' + errstrkw + ' condition is empty.');
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make right template object
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check
			if(!buildResult.result){
				this.setError('failed to make right template object for condition : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create right template object for ' + errstrkw + ' condition object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NUMBER)){
				this.setError('this is ' + errstrkw + ' condition, but right template object is not number : ' + JSON.stringify(selfFormUnits));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// switch parent object before calling recombineRightTemplObject()
			// (get parentObject's parent, it is this object parent.)
			parent_templ = parentObject.getParentTemplObject();

			// left variable is parent object, and switch parent and etc.
			this.setLeftTemplObject(parentObject, true, true);
			parentObject.setParentTemplObject(this);

			// reset parentObject(set this value to this._parentTempl at end of this method)
			// parentObject's next object is set at caller of this method.
			this.setParentTemplObject(parent_templ);

			// set right template object with priority
			if(!this.recombineRightTemplObject(buildResult.templObj)){
				this.setError('failed to set right template object with priority.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

		}else if(TEMPL_EQUAL_KW === unitsArray[0] || TEMPL_NOTEQ_KW === unitsArray[0]){
			//--------------------------
			// '==', '!=' condition
			//--------------------------
			this._condtype	= (TEMPL_EQUAL_KW === unitsArray[0] ? FORMULA_COND_TYPE_EQUAL : FORMULA_COND_TYPE_NOTEQ);
			errstrkw		= (FORMULA_COND_TYPE_EQUAL === this.getConditionType() ? 'EQUAL(==)' : 'NOTEQ(!=)');
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// check before template object(all type is allowed)
			if(!apiutil.isSafeEntity(parentObject)){
				this.setError('this is ' + errstrkw + ' condition, but before(left) template object is something wrong : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// need right template object
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting this ' + errstrkw + ' condition is empty.');
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make right template object
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check
			if(!buildResult.result){
				this.setError('failed to make right template object for condition : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create right template object for ' + errstrkw + ' condition object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// switch parent object before calling recombineRightTemplObject()
			// (get parentObject's parent, it is this object parent.)
			parent_templ = parentObject.getParentTemplObject();

			// left variable is parent object, and switch parent and etc.
			this.setLeftTemplObject(parentObject, true, true);
			parentObject.setParentTemplObject(this);

			// reset parentObject(set this value to this._parentTempl at end of this method)
			// parentObject's next object is set at caller of this method.
			this.setParentTemplObject(parent_templ);

			// set right template object with priority
			if(!this.recombineRightTemplObject(buildResult.templObj)){
				this.setError('failed to set right template object with priority.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

		}else{
			this.setError('unknown input first unit(' + unitsArray[0] + ') is specified : ' + JSON.stringify(unitsArray[0]));
			this.rollbackAssemble(statementsArray);
			return null;
		}

		// check rest statement
		if(isRequireLeftTemplate(statementsArray, REQUIRED_LEFT_CONDITION)){
			// build rest object with specifying this object as parent.
			const	restResult = createK2hr3TemplateObject(statementsArray, this);
			if(!restResult.result){
				// do rollback
				// eslint-disable-next-line no-useless-assignment
				statementsArray = this.rollbackAssemble(statementsArray);
				this.setError('failed to make rechaining template object for variable : ' + restResult.message);
				return null;
			}
		}
		// compress statement array
		//
		compressStatementsArray(statementsArray);

		return this;
	};

	//
	// execute Method
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {};
		}

		if(!this.isAssemble()){
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}

		let		left_resobj: K2hr3TemplateResult | null	= null;
		let		right_resobj: K2hr3TemplateResult | null= null;
		let		tmpval: valTypeAll;
		const	errstrkw								= FORMULA_COND_TYPE_STR_MAP[this.getConditionType()] ?? 'UNKNOWN';

		// left template object
		if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
			// execute
			left_resobj = this._leftTempl.execute(varmap);
			if(left_resobj.isFailure()){
				this.setExecuteError('failed executing left template object for ' + errstrkw + ' condition : ' + apiutil.getSafeString(left_resobj.getLastValue()));
			}
		}else{
			this.setExecuteError('could not execute left template object for ' + errstrkw + ' condition.');
		}

		// right template object
		if(this.isExecuteSuccess()){
			if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
				// execute
				right_resobj = this._rightTempl.execute(varmap);
				if(right_resobj.isFailure()){
					this.setExecuteError('failed executing right template object for ' + errstrkw + ' condition : ' + apiutil.getSafeString(right_resobj.getLastValue()));
				}
			}else{
				this.setExecuteError('could not execute right template object for ' + errstrkw + ' condition.');
			}
		}

		// condition
		if(this.isExecuteSuccess()){
			if(!isK2hr3TemplateResult(left_resobj) || !isK2hr3TemplateResult(right_resobj)){
				this.setExecuteError('left and right respbject are wrong : left=' + JSON.stringify(left_resobj) + ', right=' + JSON.stringify(right_resobj));

			}else if(FORMULA_COND_TYPE_AND === this.getConditionType()){
				//--------------------------
				// '&&' condition
				//--------------------------
				this._resobj.setLastValue(left_resobj.getCondition() && right_resobj.getCondition());

			}else if(FORMULA_COND_TYPE_OR === this.getConditionType()){
				//--------------------------
				// '||' condition
				//--------------------------
				this._resobj.setLastValue(left_resobj.getCondition() || right_resobj.getCondition());

			}else if(	FORMULA_COND_TYPE_LESS		=== this.getConditionType() ||
						FORMULA_COND_TYPE_GREAT		=== this.getConditionType() ||
						FORMULA_COND_TYPE_LESSEQ	=== this.getConditionType() ||
						FORMULA_COND_TYPE_GREATEQ	=== this.getConditionType() )
			{
				//--------------------------
				// '<', '>', '<=', '>=' condition
				//--------------------------
				// check left/right template object result is number
				const tmpLeftVal	= apiutil.cvtToNumber(left_resobj.getLastValue());
				const tmpRightVal	= apiutil.cvtToNumber(right_resobj.getLastValue());

				if(apiutil.isSafeNumber(tmpLeftVal) && apiutil.isSafeNumber(tmpRightVal)){
					if(FORMULA_COND_TYPE_LESS === this.getConditionType()){
						tmpval = (tmpLeftVal < tmpRightVal);
					}else if(FORMULA_COND_TYPE_GREAT === this.getConditionType()){
						tmpval = (tmpLeftVal > tmpRightVal);
					}else if(FORMULA_COND_TYPE_LESSEQ === this.getConditionType()){
						tmpval = (tmpLeftVal <= tmpRightVal);
					}else{	// FORMULA_COND_TYPE_GREATEQ === this.getConditionType()
						tmpval = (tmpLeftVal >= tmpRightVal);
					}
					this._resobj.setLastValue(tmpval);
				}else{
					this.setExecuteError('could not get ' + errstrkw + ' condition because left or right template object result is not number : ' + JSON.stringify(left_resobj.getLastValue()) + ', ' + JSON.stringify(right_resobj.getLastValue()));
				}

			}else if(FORMULA_COND_TYPE_EQUAL === this.getConditionType() || FORMULA_COND_TYPE_NOTEQ === this.getConditionType()){
				//--------------------------
				// '==', '!=' condition
				//--------------------------
				// check left object type at first
				const	tmpLeftVal	= left_resobj.getLastValue();
				const	tmpRightVal	= right_resobj.getLastValue();
				let		is_same: boolean;

				if(!apiutil.isSafeEntity(tmpLeftVal)){
					// left is null
					if(!apiutil.isSafeEntity(tmpRightVal)){
						is_same	= true;
					}else{
						is_same = (false === right_resobj.getCondition());
					}
				}else if(apiutil.isBoolean(tmpLeftVal)){
					// left is boolean
					is_same = (tmpLeftVal === right_resobj.getCondition());

				}else if(apiutil.isSafeNumeric(tmpLeftVal)){
					// left is number
					let	tmpLeftNum = apiutil.cvtToNumber(tmpLeftVal);
					if(!apiutil.isSafeNumber(tmpLeftNum)){
						tmpLeftNum = 0;						// safty for type
					}
					if(!apiutil.isSafeEntity(tmpRightVal)){
						is_same = (left_resobj.getCondition() === false);
					}else if(apiutil.isBoolean(tmpRightVal)){
						is_same = (left_resobj.getCondition() === tmpRightVal);
					}else if(apiutil.isSafeNumeric(tmpRightVal)){
						let tmpRightNum = apiutil.cvtToNumber(tmpRightVal);
						if(!apiutil.isSafeNumber(tmpRightNum)){
							tmpRightNum   = 0;				// safty for type
						}
						is_same = (tmpLeftNum === tmpRightNum);
					}else if(apiutil.isString(tmpRightVal)){
						is_same	= false;
					}else{
						is_same	= false;
					}
				}else if(apiutil.isString(tmpLeftVal)){
					// left is string
					if(apiutil.isBoolean(tmpRightVal)){
						is_same = (left_resobj.getCondition() === tmpRightVal);
					}else if(apiutil.isString(tmpRightVal)){
						is_same	= (tmpLeftVal === tmpRightVal);
					}else{
						is_same	= false;
					}
				}else{
					// unknown
					is_same = (tmpLeftVal === tmpRightVal);
				}
				if(FORMULA_COND_TYPE_EQUAL === this.getConditionType()){
					this._resobj.setLastValue(is_same);
				}else{
					this._resobj.setLastValue(!is_same);
				}

			}else{
				// why?
				this.setExecuteError('condition type is unknown : ' + JSON.stringify(this.getConditionType()));
			}
		}

		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// K2HR3 Template Class : Syntax Formula Class
//---------------------------------------------------------
//
// Syntax type using only in this class
//
const FORMULA_SYNTAX_TYPE_UNKNOWN		= -1;
const FORMULA_SYNTAX_TYPE_IF			= 200;
const FORMULA_SYNTAX_TYPE_ELIF			= 201;
const FORMULA_SYNTAX_TYPE_ELSE			= 202;
const FORMULA_SYNTAX_TYPE_ENDIF			= 203;
const FORMULA_SYNTAX_TYPE_WHILE			= 204;
const FORMULA_SYNTAX_TYPE_DO			= 205;
const FORMULA_SYNTAX_TYPE_DONE			= 206;
const FORMULA_SYNTAX_TYPE_FOR			= 207;
const FORMULA_SYNTAX_TYPE_FOREACH		= 208;
const FORMULA_SYNTAX_TYPE_IN			= 209;
const FORMULA_SYNTAX_TYPE_BREAK			= 210;
const FORMULA_SYNTAX_TYPE_CONTINUE		= 211;

class SyntaxFormulaObject extends BaseFormulaObject {

	protected _syntaxtype: number						= FORMULA_SYNTAX_TYPE_UNKNOWN;
	protected _childTempl: BaseTemplateObject | null	= null;			// child template object.
	protected _initTempl: BaseTemplateObject | null		= null;			// initialization object for "for"
	protected _auxTempl: BaseTemplateObject | null		= null;			// auxiliary object for "for" and "foreach"

	//
	// Constructor
	//
	constructor()
	{
		super(FORMULACLASS_TYPE_SYNTAX);
	};

	//
	// Methods
	//
	public clear(): void {
		super.clear();
		this._syntaxtype	= FORMULA_SYNTAX_TYPE_UNKNOWN;
		this.clearChildTemplObject();
		this.clearInitTemplObject();
		this.clearAuxTemplObject();
	};

	public getSyntaxType = (): number => {
		return this._syntaxtype;
	};

	public hasChildTemplObject = (): boolean => {
		return (null !== this._childTempl);
	};

	public setChildTemplObject = (
		templObject:	BaseTemplateObject | null,
		is_clear?:		boolean
	): boolean => {

		if(!apiutil.isBoolean(is_clear)){
			is_clear = false;
		}
		if(is_clear && this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			this._childTempl.clear();
		}
		if(null !== templObject && !isBaseTemplateObject(templObject)){
			r3logger.dlog('template object for child is not based BaseTemplateObject, could not set : ' + JSON.stringify(templObject));
			this._childTempl = null;
		}else{
			this._childTempl = templObject;
		}
		return true;
	};

	public getChildTemplObject = (): BaseTemplateObject | null => {
		return this._childTempl;
	};

	public clearChildTemplObject = (): boolean => {
		this.setChildTemplObject(null, true);
		return true;
	};

	public hasInitTemplObject = (): boolean => {
		return (null !== this._initTempl);
	};

	public setInitTemplObject = (
		otherTempl:		BaseTemplateObject | null,
		is_overwrite?:	boolean,
		is_clear?:		boolean
	): boolean => {

		if(apiutil.isSafeEntity(otherTempl)){
			if(!isBaseTemplateObject(otherTempl)){
				r3logger.dlog('input other template object is something wrong.');
				return false;
			}
		}else{
			// null or undefined is specified, it means clear initialization template object.
		}
		if(!apiutil.isBoolean(is_overwrite)){
			is_overwrite = true;									// default true
		}
		if(!apiutil.isBoolean(is_clear)){
			is_clear = false;
		}

		// check initialization template object conflict
		if(!is_overwrite && isBaseTemplateObject(this._initTempl)){
			r3logger.dlog('already has initialization template object, then could not over write it.');
			return false;
		}
		// clear old
		if(is_clear && apiutil.isSafeEntity(this._initTempl)){
			if(isBaseTemplateObject(this._initTempl)){
				this._initTempl.clear();
			}else{
				this._initTempl = null;
			}
		}
		this._initTempl = otherTempl;

		return true;
	};

	public getInitTemplObject = (): BaseTemplateObject | null => {
		return this._initTempl;
	};

	public clearInitTemplObject = (): boolean => {
		return this.setInitTemplObject(null, true, true);
	};

	public hasAuxTemplObject = (): boolean => {
		return (null !== this._auxTempl);
	};

	public setAuxTemplObject = (
		otherTempl:		BaseTemplateObject | null,
		is_overwrite?:	boolean,
		is_clear?:		boolean
	): boolean => {

		if(apiutil.isSafeEntity(otherTempl)){
			if(!isBaseTemplateObject(otherTempl)){
				r3logger.dlog('input other template object is something wrong.');
				return false;
			}
		}else{
			// null or undefined is specified, it means clear aux template object.
		}
		if(!apiutil.isBoolean(is_overwrite)){
			is_overwrite = true;									// default true
		}
		if(!apiutil.isBoolean(is_clear)){
			is_clear = false;
		}

		// check aux template object conflict
		if(!is_overwrite && isBaseTemplateObject(this._auxTempl)){
			r3logger.dlog('already has aux template object, then could not over write it.');
			return false;
		}
		// clear old
		if(is_clear && apiutil.isSafeEntity(this._auxTempl)){
			if(isBaseTemplateObject(this._auxTempl)){
				this._auxTempl.clear();
			}else{
				this._auxTempl = null;
			}
		}
		this._auxTempl = otherTempl;

		return true;
	};

	public getAuxTemplObject = (): BaseTemplateObject | null => {
		return this._auxTempl;
	};

	public clearAuxTemplObject = (): boolean => {
		return this.setAuxTemplObject(null, true, true);
	};

	public getVariableNames(): string[] | null {

		if(!this.isAssemble()){
			return null;
		}
		let vararr: string[] = [];
		let resarr: string[] | null;

		// call base
		resarr = BaseFormulaObject.prototype.getVariableNames.call(this);
		if(apiutil.isNotEmptyArray(resarr)){
			vararr = apiutil.mergeArray(vararr, resarr);
		}

		// child
		if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			resarr = this._childTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}

		// init
		if(this.hasInitTemplObject() && isBaseTemplateObject(this._initTempl)){
			resarr = this._initTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}

		// aux
		if(this.hasAuxTemplObject() && isBaseTemplateObject(this._auxTempl)){
			resarr = this._auxTempl.getVariableNames();
			vararr = apiutil.mergeArray(vararr, resarr);
		}
		return vararr;
	};

	public getOriginal = (): string => {
		let	original = '';
		if(!this.isAssemble()){
			return original;
		}

		// self
		if(isSafeStatementObject(this._selfStatement) && !this._selfStatement.isReplication && apiutil.isSafeString(this._selfStatement.origString)){
			// [NOTE]
			// this._selfStatement.isReplication is false, put original string.
			//
			original = this._selfStatement.origString;
		}

		// initialization
		if(this.hasInitTemplObject() && isBaseTemplateObject(this._initTempl)){
			original += apiutil.getSafeString(this._initTempl.getOriginal());
		}

		// left
		if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
			original += apiutil.getSafeString(this._leftTempl.getOriginal());
		}

		// Auxiliary
		if(this.hasAuxTemplObject() && isBaseTemplateObject(this._auxTempl)){
			original += apiutil.getSafeString(this._auxTempl.getOriginal());
		}

		// child
		if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			original += apiutil.getSafeString(this._childTempl.getOriginal());
		}

		// right
		if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
			original += apiutil.getSafeString(this._rightTempl.getOriginal());
		}

		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			original += apiutil.getSafeString(this._nextTempl.getOriginal());
		}
		return original;
	};

	public rollbackAssemble = (statementsArray: valTypeStatementsArray): valTypeStatementsArray => {
		// next
		if(this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			statementsArray = this._nextTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearNextTemplObject();

		// right
		if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
			statementsArray = this._rightTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearRightTemplObject();

		// child
		if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
			statementsArray = this._childTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearChildTemplObject();

		// auxiliary
		if(this.hasAuxTemplObject() && isBaseTemplateObject(this._auxTempl)){
			statementsArray = this._auxTempl.rollbackAssemble(statementsArray);		// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearAuxTemplObject();

		// left
		if(this.hasLeftTemplObject() && isBaseTemplateObject(this._leftTempl)){
			statementsArray = this._leftTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearLeftTemplObject();

		// init
		if(this.hasInitTemplObject() && isBaseTemplateObject(this._initTempl)){
			statementsArray = this._initTempl.rollbackAssemble(statementsArray);	// if wrong statementsArray, we need to reset statementsArray
		}
		this.clearInitTemplObject();

		// self
		if(isSafeStatementObject(this._selfStatement)){
			statementsArray	= rollbackStatementObjectToArray(statementsArray, this._selfStatement);	// if wrong statementsArray, this result is set new statementsArray
		}
		this._selfStatement	= null;
		this.clearParentTemplObject();

		return statementsArray;
	};

	public testAssemble(statementsArray: valTypeStatementsArray): boolean {

		if(!BaseFormulaObject.prototype.testAssemble.call(this, statementsArray)){
			return false;
		}
		const	unitsArray	= statementsArray[0].formUnits[0];

		if(	!apiutil.compareCaseString(unitsArray[0], TEMPL_IF_KW)		&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_ELIF_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_ELSE_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_ENDIF_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_WHILE_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_DO_KW)		&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_DONE_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_FOR_KW)		&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_FOREACH_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_IN_KW)		&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_BREAK_KW)	&&
			!apiutil.compareCaseString(unitsArray[0], TEMPL_CONTINUE_KW))
		{
			return false;
		}
		return true;
	};

	//
	// assemble Method
	//
	// This method(of this class) is using only formUnits array in statementsArray[0] and next
	// statementsArray member when it is needed.
	//
	// If the build succeeds, the array of formUnits contained in statementsArray[0] and next
	// statementsArray are consumed(deleted).
	//
	public assemble = (
		statementsArray:	valTypeStatementsArray,
		parentObject:		BaseTemplateObject | null
	): SyntaxFormulaObject | null => {

		if(this.isAssemble()){
			this.setError('this ' + this.getType() + ' class object is already assembled.');
			return null;
		}
		// clear
		this.clear();

		if(null !== parentObject && !isBaseTemplateObject(parentObject)){
			this.setError('input template object is something wrong : ' + JSON.stringify(parentObject));
			return null;
		}
		if(!isNotEmptyStatementsArray(statementsArray)){
			this.setError('input statement array is something wrong or empty : ' + JSON.stringify(statementsArray));
			return null;
		}
		if(!statementsArray[0].isStatement){
			this.setError('input statement array[0] does not have statement flag : ' + JSON.stringify(statementsArray[0]));
			return null;
		}
		if(!apiutil.isNotEmptyArray(statementsArray[0].formUnits) || !apiutil.isNotEmptyArray(statementsArray[0].formUnits[0]) || TEMPL_COMMENT_KW === statementsArray[0].formUnits[0][0]){
			this.setError('input statement array[0] does not have statement units : ' + JSON.stringify(statementsArray[0]));
			return null;
		}

		// set self statement & replicate statement
		this.setParentTemplObject(parentObject);													// set parent
		const	replicatedStatementObj		= replicateK2hr3TemplateStatement(statementsArray[0]);	// replicate statementsArray[0] for analyzing child template
		this._selfStatement					= statementsArray[0];									// reference to top of statement array
		const	selfFormUnits: string[][]	= [];													// self form units as empty
		replaceK2hr3TemplateStatementFormUnits(this._selfStatement, selfFormUnits);					// replace formUnits array to empty in self statement object.
		statementsArray.shift();																	// cut top of statement array
		statementsArray.unshift(replicatedStatementObj);											// insert replicated statement object at top of statement array

		let	unitsArray = statementsArray[0].formUnits[0];
		let	buildResult: resTypeCreateTemplateObject;

		if(apiutil.compareCaseString(unitsArray[0], TEMPL_IF_KW)){
			//--------------------------
			// 'if' syntax
			//--------------------------
			this._syntaxtype= FORMULA_SYNTAX_TYPE_IF;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// make left template object(= condition for "if")
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check(any template object type returns boolean)
			if(!buildResult.result){
				this.setError('failed to make left template object for syntax(IF) : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create left template object for syntax(IF) object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// rest units must be empty(one statement is "if <condition>")
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(IF) condition is not empty : ' + JSON.stringify(unitsArray));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// set left template object
			if(!this.setLeftTemplObject(buildResult.templObj, true, true)){
				this.setError('failed to set left template object.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make child templates
			//
			// Loop until set this objects's right template object.
			//
			// [NOTE]
			// if found else/elif/endif, these syntax object sets itself to this object's right template object.
			// then this right template object must be existed after creating child.
			//
			for(let childParentObject = getSafeBaseTemplateObject(this); isBaseTemplateObject(childParentObject) && !this.hasRightTemplObject(); ){
				// build child(or child's next) object
				buildResult = createK2hr3TemplateObject(statementsArray, childParentObject);

				// check(child is allowed empty)
				if(!buildResult.result){
					this.setError('failed to make child template object for syntax(IF) : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(apiutil.isSafeEntity(buildResult.templObj) && !isBaseTemplateObject(buildResult.templObj)){
					this.setError('created child template object for syntax(IF) is something wrong : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// set child or child's next
				if(apiutil.isSafeEntity(buildResult.templObj)){
					if(this === childParentObject){
						this.setChildTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
					}else{
						// reach to end of next object chain
						let	childNextObject: BaseTemplateObject | null;
						for(childNextObject = childParentObject; null !== childNextObject && childNextObject.hasNextTemplObject(); childNextObject = childNextObject.getNextTemplObject());

						// set end of next object to child's end of next object
						if(isBaseTemplateObject(childNextObject)){
							childNextObject.setNextTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
						}
						// set end of object's parent
						if(isBaseTemplateObject(buildResult.templObj)){
							buildResult.templObj.setParentTemplObject(childNextObject);
						}
					}
					childParentObject = getSafeBaseTemplateObject(buildResult.templObj);
				}

				// check right template object(this object must be set by syntax(ELSE, ELIF, ENDIF)in analyzing child)
				if(this.hasRightTemplObject()){
					// set right template object.
					break;
				}else if(!apiutil.isSafeEntity(buildResult.templObj)){
					// child is allowed null, but right template must not be null at then.
					this.setError('not found the terminate template syntax(ELIF/ELSE/ENDIF) for syntax(IF) : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_ELIF_KW)){
			//--------------------------
			// 'elif' syntax
			//--------------------------
			// at first, search "if" or "elif" in parent chain
			let newParentObject: BaseTemplateObject | null;
			for(newParentObject = parentObject; apiutil.isSafeEntity(newParentObject); newParentObject = newParentObject.getParentTemplObject()){
				if(isSyntaxFormulaObject(newParentObject) && (FORMULA_SYNTAX_TYPE_IF === newParentObject.getSyntaxType() || FORMULA_SYNTAX_TYPE_ELIF === newParentObject.getSyntaxType())){
					break;
				}
			}
			if(!apiutil.isSafeEntity(newParentObject)){
				this.setError('could not find syntax(IF or ELIF) in parent chain for syntax(ELIF) : ' + JSON.stringify(parentObject));
				return null;
			}

			// set for self
			this._syntaxtype= FORMULA_SYNTAX_TYPE_ELIF;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// make left template object(= condition for "elif")
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check(any template object type returns boolean)
			if(!buildResult.result){
				this.setError('failed to make left template object for syntax(ELIF) : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create left template object for syntax(ELIF) object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// rest units must be empty(one statement is "elif <condition>")
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(ELIF) condition is not empty : ' + JSON.stringify(unitsArray));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// set left template object
			if(!this.setLeftTemplObject(buildResult.templObj, true, true)){
				this.setError('failed to set left template object.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make child templates
			//
			// Loop until set this objects's right template object.
			//
			// [NOTE]
			// if found else/elif/endif, these syntax object sets itself to this object's right template object.
			// then this right template object must be existed after creating child.
			//
			for(let childParentObject = getSafeBaseTemplateObject(this); isBaseTemplateObject(childParentObject) && !this.hasRightTemplObject(); ){
				// build child(or child's next) object
				buildResult = createK2hr3TemplateObject(statementsArray, childParentObject);

				// check(child is allowed empty)
				if(!buildResult.result){
					this.setError('failed to make child template object for syntax(ELIF) : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(apiutil.isSafeEntity(buildResult.templObj) && !isBaseTemplateObject(buildResult.templObj)){
					this.setError('created child template object for syntax(ELIF) is something wrong : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// set child or child's next
				if(apiutil.isSafeEntity(buildResult.templObj)){
					if(this === childParentObject){
						this.setChildTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
					}else{
						// reach to end of next object chain
						let	childNextObject: BaseTemplateObject | null;
						for(childNextObject = childParentObject; null !== childNextObject && childNextObject.hasNextTemplObject(); childNextObject = childNextObject.getNextTemplObject());

						// set end of next object to child's end of next object
						if(isBaseTemplateObject(childNextObject)){
							childNextObject.setNextTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
						}
						// set end of object's parent
						if(isBaseTemplateObject(buildResult.templObj)){
							buildResult.templObj.setParentTemplObject(childNextObject);
						}
					}
					childParentObject = getSafeBaseTemplateObject(buildResult.templObj);
				}

				// check right template object(this object must be set by syntax(ELSE, ELIF, ENDIF)in analyzing child)
				if(this.hasRightTemplObject()){
					// set right template object.
					break;
				}else if(!apiutil.isSafeEntity(buildResult.templObj)){
					// child is allowed null, but right template must not be null at then.
					this.setError('not found the terminate template syntax(ELIF/ELSE/ENDIF) for syntax(ELIF) : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}

			if(isBaseFormulaObject(newParentObject)){
				// set this to parent right template object
				this.setParentTemplObject(newParentObject);
				newParentObject.setRightTemplObject(this, true);
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_ELSE_KW)){
			//--------------------------
			// 'else' syntax
			//--------------------------
			// at first, search "if" or "elif" in parent chain
			let newParentObject: BaseTemplateObject | null;
			for(newParentObject = parentObject; null !== newParentObject && apiutil.isSafeEntity(newParentObject); newParentObject = newParentObject.getParentTemplObject()){
				if(isSyntaxFormulaObject(newParentObject) && (FORMULA_SYNTAX_TYPE_IF === newParentObject.getSyntaxType() || FORMULA_SYNTAX_TYPE_ELIF === newParentObject.getSyntaxType())){
					break;
				}
			}
			if(!apiutil.isSafeEntity(newParentObject)){
				this.setError('could not find syntax(IF or ELIF) in parent chain for syntax(ELSE) : ' + JSON.stringify(parentObject));
				return null;
			}

			// set for self
			this._syntaxtype= FORMULA_SYNTAX_TYPE_ELSE;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// rest units must be empty(one statement is only "else")
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(ELSE) is not empty : ' + JSON.stringify(unitsArray));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// remove first statement
			statementsArray.shift();

			// make child templates
			//
			// Loop until set this objects's right template object.
			//
			// [NOTE]
			// if found else/elif/endif, these syntax object sets itself to this object's right template object.
			// then this right template object must be existed after creating child.
			//
			for(let childParentObject = getSafeBaseTemplateObject(this); isBaseTemplateObject(childParentObject) && !this.hasRightTemplObject(); ){
				// build child(or child's next) object
				buildResult = createK2hr3TemplateObject(statementsArray, childParentObject);

				// check(child is allowed empty)
				if(!buildResult.result){
					this.setError('failed to make child template object for syntax(ELSE) : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(apiutil.isSafeEntity(buildResult.templObj) && !isBaseTemplateObject(buildResult.templObj)){
					this.setError('created child template object for syntax(ELSE) is something wrong : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// set child or child's next
				if(apiutil.isSafeEntity(buildResult.templObj)){
					if(this === childParentObject){
						this.setChildTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
					}else{
						// reach to end of next object chain
						let	childNextObject: BaseTemplateObject | null;
						for(childNextObject = childParentObject; null !== childNextObject && childNextObject.hasNextTemplObject(); childNextObject = childNextObject.getNextTemplObject());

						// set end of next object to child's end of next object
						if(isBaseTemplateObject(childNextObject)){
							childNextObject.setNextTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
						}
						// set end of object's parent
						if(isBaseTemplateObject(buildResult.templObj)){
							buildResult.templObj.setParentTemplObject(childNextObject);
						}
					}
					childParentObject = getSafeBaseTemplateObject(buildResult.templObj);
				}

				// check right template object(this object must be set by syntax(ENDIF)in analyzing child)
				if(this.hasRightTemplObject()){
					// set right template object.
					break;
				}else if(!apiutil.isSafeEntity(buildResult.templObj)){
					// child is allowed null, but right template must not be null at then.
					this.setError('not found the terminate template syntax(ENDIF) for syntax(ELSE) : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}

			if(isBaseFormulaObject(newParentObject)){
				// set this to parent right template object
				this.setParentTemplObject(newParentObject);
				newParentObject.setRightTemplObject(this, true);
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_ENDIF_KW)){
			//--------------------------
			// 'endif' syntax
			//--------------------------
			// at first, search "if" or "elif" in parent chain
			let newParentObject: BaseTemplateObject | null;
			for(newParentObject = parentObject; null !== newParentObject && apiutil.isSafeEntity(newParentObject); newParentObject = newParentObject.getParentTemplObject()){
				if(isSyntaxFormulaObject(newParentObject) && (FORMULA_SYNTAX_TYPE_IF === newParentObject.getSyntaxType() || FORMULA_SYNTAX_TYPE_ELIF === newParentObject.getSyntaxType() || FORMULA_SYNTAX_TYPE_ELSE === newParentObject.getSyntaxType())){
					break;
				}
			}
			if(!apiutil.isSafeEntity(newParentObject)){
				this.setError('could not find syntax(IF or ELIF) in parent chain for syntax(ENDIF) : ' + JSON.stringify(parentObject));
				return null;
			}

			// set for self
			this._syntaxtype= FORMULA_SYNTAX_TYPE_ENDIF;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// rest units must be empty(one statement is only "endif")
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(ENDIF) is not empty : ' + JSON.stringify(unitsArray));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// remove first statement
			statementsArray.shift();

			if(isBaseFormulaObject(newParentObject)){
				// set this to parent right template object
				this.setParentTemplObject(newParentObject);
				newParentObject.setRightTemplObject(this, true);
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_WHILE_KW)){
			//--------------------------
			// 'while' syntax
			//--------------------------
			// [FIXME]
			// if it specifies following template which is nest while...done and do...while.
			// 	{{ do }}			(1)
			// 		{{ while }}		(2)
			// 		{{ done }}
			// 	{{ while }}
			// Analyzing this case could not success, because searching parent object for "do" type after found (2) is hit (1) sentence.
			// Then this case will return syntax error.
			// 

			// at first, search "do" in parent chain
			// (if find "do" in parent chain, this syntax is "do...while" type)
			//
			let newParentObject: BaseTemplateObject | null;
			for(newParentObject = parentObject; apiutil.isSafeEntity(newParentObject); newParentObject = newParentObject.getParentTemplObject()){
				if(isSyntaxFormulaObject(newParentObject) && FORMULA_SYNTAX_TYPE_DO === newParentObject.getSyntaxType()){
					break;
				}
			}

			//--------------------------
			// do...while/while...done common
			//--------------------------
			// set for self
			this._syntaxtype= FORMULA_SYNTAX_TYPE_WHILE;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// make left template object(= condition for "while")
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check(any template object type returns boolean)
			if(!buildResult.result){
				this.setError('failed to make left template object for syntax(do...WHILE/WHILE...done) : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// if buildResult.templObj is null, it is something wrong.
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create left template object for syntax(do...WHILE/WHILE...done) object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// rest units must be empty(one statement is "while <condition>")
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(do...WHILE/WHILE...done) condition is not empty : ' + JSON.stringify(unitsArray));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// set left template object
			if(!this.setLeftTemplObject(buildResult.templObj, true, true)){
				this.setError('failed to set left template object.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			if(apiutil.isSafeEntity(newParentObject)){
				//--------------------------
				// do...while type
				//--------------------------
				if(isBaseFormulaObject(newParentObject)){
					// set this to parent right template object
					this.setParentTemplObject(newParentObject);
					newParentObject.setRightTemplObject(this, true);
				}

			}else{
				//--------------------------
				// while...done type
				//--------------------------
				// make child templates
				//
				// Loop until set this objects's right template object.
				//
				// [NOTE]
				// if found else/elif/endif, these syntax object sets itself to this object's right template object.
				// then this right template object must be existed after creating child.
				//
				for(let childParentObject = getSafeBaseTemplateObject(this); isBaseTemplateObject(childParentObject) && !this.hasRightTemplObject(); ){
					// build child(or child's next) object
					buildResult = createK2hr3TemplateObject(statementsArray, childParentObject);

					// check(child is allowed empty)
					if(!buildResult.result){
						this.setError('failed to make child template object for syntax(WHILE...DONE) : ' + buildResult.message);
						this.rollbackAssemble(statementsArray);
						return null;
					}
					if(apiutil.isSafeEntity(buildResult.templObj) && !isBaseTemplateObject(buildResult.templObj)){
						this.setError('created child template object for syntax(WHILE...DONE) is something wrong : ' + JSON.stringify(buildResult.templObj));
						this.rollbackAssemble(statementsArray);
						return null;
					}

					// set child or child's next
					if(apiutil.isSafeEntity(buildResult.templObj)){
						if(this === childParentObject){
							this.setChildTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
						}else{
							// reach to end of next object chain
							let	childNextObject: BaseTemplateObject | null;
							for(childNextObject = childParentObject; null !== childNextObject && childNextObject.hasNextTemplObject(); childNextObject = childNextObject.getNextTemplObject());

							// set end of next object to child's end of next object
							if(isBaseTemplateObject(childNextObject)){
								childNextObject.setNextTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
							}
							// set end of object's parent
							if(isBaseTemplateObject(buildResult.templObj)){
								buildResult.templObj.setParentTemplObject(childNextObject);
							}
						}
						childParentObject = getSafeBaseTemplateObject(buildResult.templObj);
					}

					// check right template object(this object must be set by syntax(DONE)in analyzing child)
					if(this.hasRightTemplObject()){
						// set right template object.
						break;
					}else if(!apiutil.isSafeEntity(buildResult.templObj)){
						// child is allowed null, but right template must not be null at then.
						this.setError('not found the terminate template syntax(DONE) for syntax(WHILE) : ' + JSON.stringify(buildResult.templObj));
						this.rollbackAssemble(statementsArray);
						return null;
					}
				}
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_DO_KW)){
			//--------------------------
			// 'do' syntax
			//--------------------------
			this._syntaxtype= FORMULA_SYNTAX_TYPE_DO;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// rest units must be empty(one statement is only "do")
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(DO) is not empty : ' + JSON.stringify(unitsArray));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// remove first statement
			statementsArray.shift();

			// make child templates
			//
			// Loop until set this objects's right template object.
			//
			// [NOTE]
			// if found else/elif/endif, these syntax object sets itself to this object's right template object.
			// then this right template object must be existed after creating child.
			//
			for(let childParentObject = getSafeBaseTemplateObject(this); isBaseTemplateObject(childParentObject) && !this.hasRightTemplObject(); ){
				// build child(or child's next) object
				buildResult = createK2hr3TemplateObject(statementsArray, childParentObject);

				// check(child is allowed empty)
				if(!buildResult.result){
					this.setError('failed to make child template object for syntax(DO...WHILE) : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(apiutil.isSafeEntity(buildResult.templObj) && !isBaseTemplateObject(buildResult.templObj)){
					this.setError('created child template object for syntax(DO...WHILE) is something wrong : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// set child or child's next
				if(apiutil.isSafeEntity(buildResult.templObj)){
					if(this === childParentObject){
						this.setChildTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
					}else{
						// reach to end of next object chain
						let	childNextObject: BaseTemplateObject | null;
						for(childNextObject = childParentObject; null !== childNextObject && childNextObject.hasNextTemplObject(); childNextObject = childNextObject.getNextTemplObject());

						// set end of next object to child's end of next object
						if(isBaseTemplateObject(childNextObject)){
							childNextObject.setNextTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
						}
						// set end of object's parent
						if(isBaseTemplateObject(buildResult.templObj)){
							buildResult.templObj.setParentTemplObject(childNextObject);
						}
					}
					childParentObject = getSafeBaseTemplateObject(buildResult.templObj);
				}

				// check right template object(this object must be set by syntax(WHILE)in analyzing child)
				if(this.hasRightTemplObject()){
					// set right template object.
					break;
				}else if(!apiutil.isSafeEntity(buildResult.templObj)){
					// child is allowed null, but right template must not be null at then.
					this.setError('not found the terminate template syntax(WHILE) for syntax(DO) : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_DONE_KW)){
			//--------------------------
			// 'done' syntax
			//--------------------------
			// at first, search "while" or "for" or "foreach" in parent chain
			let newParentObject: BaseTemplateObject | null;
			for(newParentObject = parentObject; null !== newParentObject && apiutil.isSafeEntity(newParentObject); newParentObject = newParentObject.getParentTemplObject()){
				if(isSyntaxFormulaObject(newParentObject) && (FORMULA_SYNTAX_TYPE_WHILE === newParentObject.getSyntaxType() || FORMULA_SYNTAX_TYPE_FOR === newParentObject.getSyntaxType() || FORMULA_SYNTAX_TYPE_FOREACH === newParentObject.getSyntaxType())){
					break;
				}
			}
			if(!apiutil.isSafeEntity(newParentObject)){
				this.setError('could not find syntax(WHILE/FOR/FOREACH) in parent chain for syntax(DONE) : ' + JSON.stringify(parentObject));
				return null;
			}

			// set for self
			this._syntaxtype= FORMULA_SYNTAX_TYPE_DONE;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// rest units must be empty(one statement is only "done")
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(DONE) is not empty : ' + JSON.stringify(unitsArray));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// remove first statement
			statementsArray.shift();

			if(isBaseFormulaObject(newParentObject)){
				// set this to parent right template object
				this.setParentTemplObject(newParentObject);
				newParentObject.setRightTemplObject(this, true);
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_FOR_KW)){
			//--------------------------
			// 'for' syntax
			//--------------------------
			this._syntaxtype= FORMULA_SYNTAX_TYPE_FOR;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// allow empty for initialization template object
			if(apiutil.isNotEmptyArray(unitsArray)){
				// make initialization template object(= initialization for "for")
				buildResult = createK2hr3TemplateObject(statementsArray, this);

				// check(any template object type returns boolean)
				if(!buildResult.result){
					this.setError('failed to make initialization template object for syntax(FOR) : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(!isBaseTemplateObject(buildResult.templObj)){
					this.setError('could not create initialization template object for syntax(FOR) object type : ' + JSON.stringify(unitsArray));
					this.rollbackAssemble(statementsArray);
					return null;
				}
				// rest formUnits[0] must be empty("for" syntax need another units array which is separated by ';')
				if(apiutil.isNotEmptyArray(unitsArray)){
					this.setError('rest unitsArray after cutting syntax(FOR) initialization is not empty : ' + JSON.stringify(unitsArray));
					buildResult.templObj.rollbackAssemble(statementsArray);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				// set initialization template object
				if(!this.setInitTemplObject(buildResult.templObj, true, true)){
					this.setError('failed to set initialization template object for syntax(FOR).');
					buildResult.templObj.rollbackAssemble(statementsArray);
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}else{
				// shift formUnits[0]
				statementsArray[0].formUnits.shift();
			}

			// check rest formUnits
			if(!apiutil.isNotEmptyArray(statementsArray[0].formUnits)){
				this.setError('there is no rest units array for condition and auxiliary for syntax(FOR).');
				this.rollbackAssemble(statementsArray);
				return null;
			}
			const	backupStatementCount	= statementsArray.length;				// backup array count for check auxiliary exists
			unitsArray						= statementsArray[0].formUnits[0];		// reset

			// make left template object(= condition for "for")
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check(any template object type returns boolean)
			if(!buildResult.result){
				this.setError('failed to make left template object for syntax(FOR) : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!isBaseTemplateObject(buildResult.templObj)){
				this.setError('could not create left template object for syntax(FOR) object type : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// rest formUnits[0] must be empty("for" syntax need another units array which is separated by ';')
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(FOR) condition is not empty : ' + JSON.stringify(unitsArray));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// set left template object
			if(!this.setLeftTemplObject(buildResult.templObj, true, true)){
				this.setError('failed to set left template object.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// allow empty for auxiliary template object
			if(apiutil.isNotEmptyArray(statementsArray) && backupStatementCount === statementsArray.length && apiutil.isNotEmptyArray(statementsArray[0].formUnits)){
				unitsArray = statementsArray[0].formUnits[0];					// reset

				// make auxiliary template object(= for "for")
				buildResult = createK2hr3TemplateObject(statementsArray, this);

				// check 
				if(!buildResult.result){
					this.setError('failed to make aux template object for syntax(FOR) : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(!isBaseTemplateObject(buildResult.templObj)){
					this.setError('could not create aux template object for syntax(FOR) object type : ' + JSON.stringify(selfFormUnits));
					this.rollbackAssemble(statementsArray);
					return null;
				}
				// rest units must be empty
				if(apiutil.isNotEmptyArray(unitsArray)){
					this.setError('rest unitsArray after cutting syntax(FOR) auxiliary is not empty : ' + JSON.stringify(unitsArray));
					buildResult.templObj.rollbackAssemble(statementsArray);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				// set aux template object
				if(!this.setAuxTemplObject(buildResult.templObj, true, true)){
					this.setError('failed to set aux template object.');
					buildResult.templObj.rollbackAssemble(statementsArray);
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}
			// check rest statementsArray
			if(!apiutil.isNotEmptyArray(statementsArray) || !apiutil.isNotEmptyArray(statementsArray[0].formUnits)){
				this.setError('statementsArray after cutting syntax(FOR) initialization/condition/auxiliary is something wrong : ' + JSON.stringify(statementsArray));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// eslint-disable-next-line no-useless-assignment
			unitsArray = statementsArray[0].formUnits[0];					// reset

			// make child templates
			//
			// Loop until set this objects's right template object.
			//
			// [NOTE]
			// if found else/elif/endif, these syntax object sets itself to this object's right template object.
			// then this right template object must be existed after creating child.
			//
			for(let childParentObject = getSafeBaseTemplateObject(this); isBaseTemplateObject(childParentObject) && !this.hasRightTemplObject(); ){
				// build child(or child's next) object
				buildResult = createK2hr3TemplateObject(statementsArray, childParentObject);

				// check(child is allowed empty)
				if(!buildResult.result){
					this.setError('failed to make child template object for syntax(FOR) : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(apiutil.isSafeEntity(buildResult.templObj) && !isBaseTemplateObject(buildResult.templObj)){
					this.setError('created child template object for syntax(FOR) is something wrong : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// set child or child's next
				if(apiutil.isSafeEntity(buildResult.templObj)){
					if(this === childParentObject){
						this.setChildTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
					}else{
						// reach to end of next object chain
						let	childNextObject: BaseTemplateObject | null;
						for(childNextObject = childParentObject; null !== childNextObject && childNextObject.hasNextTemplObject(); childNextObject = childNextObject.getNextTemplObject());

						// set end of next object to child's end of next object
						if(isBaseTemplateObject(childNextObject)){
							childNextObject.setNextTemplObject(getSafeBaseTemplateObject(buildResult.templObj), true);
						}
						// set end of object's parent
						if(isBaseTemplateObject(buildResult.templObj)){
							buildResult.templObj.setParentTemplObject(childNextObject);
						}
					}
					childParentObject = getSafeBaseTemplateObject(buildResult.templObj);
				}

				// check right template object(this object must be set by syntax(WHILE)in analyzing child)
				if(this.hasRightTemplObject()){
					// set right template object.
					break;
				}else if(!apiutil.isSafeEntity(buildResult.templObj)){
					// child is allowed null, but right template must not be null at then.
					this.setError('not found the terminate template syntax(DONE) for syntax(FOR) : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_FOREACH_KW)){
			//--------------------------
			// 'foreach' syntax
			//--------------------------
			this._syntaxtype= FORMULA_SYNTAX_TYPE_FOREACH;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// make left template object(= variable for "foreach")
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check(left template object must be no-static variable type)
			if(!buildResult.result){
				this.setError('failed to make left template object for syntax(FOREACH) : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!isBaseTemplateObject(buildResult.templObj) || !buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_NOSTATIC)){
				this.setError('could not create left template object, or created object is not no-static variable type for syntax(FOREACH) : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// rest formUnits[0] must be empty("foreach" syntax need another units array which is separated by 'IN')
			if(!apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(FOREACH) variable is not empty : ' + JSON.stringify(unitsArray));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// set left template object
			if(!this.setLeftTemplObject(buildResult.templObj, true, true)){
				this.setError('failed to set left template object.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make auxiliary template object(= "IN" syntax for "foreach")
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check, auxiliary must be "IN" syntax
			if(!buildResult.result){
				this.setError('failed to make aux template object for syntax(FOREACH) : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!isBaseTemplateObject(buildResult.templObj) || FORMULACLASS_TYPE_SYNTAX !== buildResult.templObj.getType() || !isSyntaxFormulaObject(buildResult.templObj) || FORMULA_SYNTAX_TYPE_IN !== buildResult.templObj.getSyntaxType()){
				this.setError('could not create aux object, or aux object type is wrong for syntax(FOREACH) : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// rest units must be empty
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(FOREACH) auxiliary is not empty : ' + JSON.stringify(unitsArray));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// set aux template object
			if(!this.setAuxTemplObject(buildResult.templObj, true, true)){
				this.setError('failed to set aux template object.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// make child templates
			//
			// Loop until set this objects's right template object.
			//
			// [NOTE]
			// if found else/elif/endif, these syntax object sets itself to this object's right template object.
			// then this right template object must be existed after creating child.
			//
			for(let childParentObject = getSafeBaseTemplateObject(this); isBaseTemplateObject(childParentObject) && !this.hasRightTemplObject(); ){
				// build child(or child's next) object
				buildResult = createK2hr3TemplateObject(statementsArray, childParentObject);

				// check(child is allowed empty)
				if(!buildResult.result){
					this.setError('failed to make child template object for syntax(FOREACH) : ' + buildResult.message);
					this.rollbackAssemble(statementsArray);
					return null;
				}
				if(apiutil.isSafeEntity(buildResult.templObj) && !isBaseTemplateObject(buildResult.templObj)){
					this.setError('created child template object for syntax(FOREACH) is something wrong : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}

				// set child or child's next
				if(apiutil.isSafeEntity(buildResult.templObj)){
					if(this === childParentObject){
						this.setChildTemplObject(buildResult.templObj, true);
					}else{
						// reach to end of next object chain
						let	childNextObject: BaseTemplateObject | null;
						for(childNextObject = childParentObject; null !== childNextObject && childNextObject.hasNextTemplObject(); childNextObject = childNextObject.getNextTemplObject());

						// set end of next object to child's end of next object
						if(null !== childNextObject){
							childNextObject.setNextTemplObject(buildResult.templObj, true);
						}
						// set end of object's parent
						buildResult.templObj.setParentTemplObject(childNextObject);
					}
					childParentObject = buildResult.templObj;
				}

				// check right template object(this object must be set by syntax(WHILE)in analyzing child)
				if(this.hasRightTemplObject()){
					// set right template object.
					break;
				}else if(!apiutil.isSafeEntity(buildResult.templObj)){
					// child is allowed null, but right template must not be null at then.
					this.setError('not found the terminate template syntax(DONE) for syntax(FOREACH) : ' + JSON.stringify(buildResult.templObj));
					this.rollbackAssemble(statementsArray);
					return null;
				}
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_IN_KW)){
			//--------------------------
			// 'in' syntax
			//--------------------------
			this._syntaxtype= FORMULA_SYNTAX_TYPE_IN;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// make left template object(= variable for "in")
			buildResult = createK2hr3TemplateObject(statementsArray, this);

			// check(left template object must be variable type)
			if(!buildResult.result){
				this.setError('failed to make left template object for syntax(IN) : ' + buildResult.message);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			if(!isBaseTemplateObject(buildResult.templObj) || !buildResult.templObj.isPossibleResultType(TEMPLATE_RESULT_TYPE_VARIABLE)){
				this.setError('could not create left template object, or created object is not variable type for syntax(IN) : ' + JSON.stringify(selfFormUnits));
				this.rollbackAssemble(statementsArray);
				return null;
			}

			// rest units must be empty
			if(apiutil.isNotEmptyArray(unitsArray)){
				this.setError('rest unitsArray after cutting syntax(IN) variable is not empty : ' + JSON.stringify(unitsArray));
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}
			// set left template object
			if(!this.setLeftTemplObject(buildResult.templObj, true, true)){
				this.setError('failed to set left template object.');
				buildResult.templObj.rollbackAssemble(statementsArray);
				this.rollbackAssemble(statementsArray);
				return null;
			}

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_BREAK_KW)){
			//--------------------------
			// 'break' syntax
			//--------------------------
			this._syntaxtype= FORMULA_SYNTAX_TYPE_BREAK;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// nothing to modify data

		}else if(apiutil.compareCaseString(unitsArray[0], TEMPL_CONTINUE_KW)){
			//--------------------------
			// 'continue' syntax
			//--------------------------
			this._syntaxtype= FORMULA_SYNTAX_TYPE_CONTINUE;
			selfFormUnits.push([unitsArray[0]]);
			unitsArray.shift();

			// nothing to modify data

		}else{
			this.setError('unknown input first unit(' + unitsArray[0] + ') is specified : ' + JSON.stringify(unitsArray[0]));
			this.rollbackAssemble(statementsArray);
			return null;
		}
		// compress statement array
		//
		compressStatementsArray(statementsArray);

		return this;
	};

	//
	// execute Method
	//
	// varmap		:	key value mapping for static variables
	// return		:	K2hr3TemplateResult object
	//
	public execute = (varmap: valTypeTemplateVariablesMap): K2hr3TemplateResult => {

		this.initExecuteResult();

		if(!apiutil.isSafeEntity(varmap)){
			varmap = {};
		}

		if(!this.isAssemble()){
			this.setExecuteError('this ' + this.getType() + ' class object is not assembled yet.');
		}
		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}

		let	left_resobj: K2hr3TemplateResult | null;
		let	right_resobj: K2hr3TemplateResult | null;
		let	child_resobj: K2hr3TemplateResult | null;
		let	init_resobj: K2hr3TemplateResult | null;
		let	aux_resobj: K2hr3TemplateResult | null;
		let	errstrkw: string;

		if(FORMULA_SYNTAX_TYPE_IF === this.getSyntaxType() || FORMULA_SYNTAX_TYPE_ELIF === this.getSyntaxType()){
			//--------------------------
			// 'if', 'elif' syntax
			//--------------------------
			errstrkw	= (FORMULA_SYNTAX_TYPE_IF === this.getSyntaxType() ? 'syntax(IF)' : 'syntax(ELIF)');

			// execute left(condition) template object
			if(!this.hasLeftTemplObject() || !isBaseTemplateObject(this._leftTempl)){
				this.setExecuteError('there is no condition(left) for ' + errstrkw + '.');
			}else{
				// execute
				left_resobj = this._leftTempl.execute(varmap);
				if(left_resobj.isFailure()){
					this.setExecuteError('failed executing left condition for ' + errstrkw + ' : ' + apiutil.getSafeString(left_resobj.getLastValue()));
				}else if(!apiutil.isSafeEntity(left_resobj.getCondition()) || !apiutil.isBoolean(left_resobj.getCondition())){
					this.setExecuteError('got wrong condition result type for ' + errstrkw + ' : ' + apiutil.getSafeString(left_resobj.getCondition()));
				}else{
					// condition
					if(left_resobj.getCondition()){
						// condition = true, then execute child object
						if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
							// execute child
							child_resobj = this._childTempl.execute(varmap);
							if(child_resobj.isFailure()){
								this.setExecuteError('failed executing child(true condition) for ' + errstrkw + ' : ' + apiutil.getSafeString(child_resobj.getLastValue()));
							}else{
								// merge result
								this.mergeExecuteResult(child_resobj);					// merge condition result
							}
						}else{
							// no execute object
							this.mergeExecuteResult(left_resobj);						// merge condition result
						}
					}else{
						// condition = false, then execute right template object chain
						if(this.hasRightTemplObject() && isBaseTemplateObject(this._rightTempl)){
							// execute right
							right_resobj = this._rightTempl.execute(varmap);
							if(right_resobj.isFailure()){
								this.setExecuteError('failed executing right(false condition) for ' + errstrkw + ' : ' + apiutil.getSafeString(right_resobj.getLastValue()));
							}else{
								// merge result
								this.mergeExecuteResult(right_resobj);					// merge condition result
							}
						}else{
							// no execute object
							this.mergeExecuteResult(left_resobj);						// merge condition result
						}
					}
				}
			}

		}else if(FORMULA_SYNTAX_TYPE_ELSE === this.getSyntaxType()){
			//--------------------------
			// 'else' syntax
			//--------------------------
			// execute child object
			if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
				// execute child
				child_resobj = this._childTempl.execute(varmap);
				if(child_resobj.isFailure()){
					this.setExecuteError('failed executing child(true condition) for syntax(ELSE) : ' + apiutil.getSafeString(child_resobj.getLastValue()));
				}else{
					// merge result
					this.mergeExecuteResult(child_resobj);								// merge condition result
				}
			}else{
				// no execute object, nothing to do
			}

		}else if(FORMULA_SYNTAX_TYPE_ENDIF === this.getSyntaxType()){
			//--------------------------
			// 'endif' syntax
			//--------------------------
			// nothing to do

		}else if(FORMULA_SYNTAX_TYPE_WHILE === this.getSyntaxType()){
			//--------------------------
			// 'while' syntax
			//--------------------------
			// execute left(condition) template object
			if(!this.hasLeftTemplObject() || !isBaseTemplateObject(this._leftTempl)){
				this.setExecuteError('there is no condition(left) for syntax(WHILE).');
			}else{
				// execute condition(left)
				for(let is_loop = true; is_loop; ){
					left_resobj = this._leftTempl.execute(varmap);
					if(left_resobj.isFailure()){
						this.setExecuteError('failed executing left condition for syntax(WHILE) : ' + apiutil.getSafeString(left_resobj.getLastValue()));
						break;
					}else if(!apiutil.isSafeEntity(left_resobj.getCondition()) || !apiutil.isBoolean(left_resobj.getCondition())){
						this.setExecuteError('got wrong condition result type for syntax(WHILE) : ' + apiutil.getSafeString(left_resobj.getCondition()));
						break;
					}

					// check condition result
					if(left_resobj.getCondition()){
						// condition = true
						if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
							// this case is "while...done", then execute child
							child_resobj = this._childTempl.execute(varmap);
							if(child_resobj.isFailure()){
								this.setExecuteError('failed executing child(true condition) for syntax(WHILE) : ' + apiutil.getSafeString(child_resobj.getLastValue()));
								break;
							}
							// merge child result
							this.mergeExecuteResult(child_resobj);						// merge condition result

							// check child result
							if(child_resobj.isBreak()){
								// no more executing
								break;
							}else if(child_resobj.isContinue()){
								// continue, nothing to do
							}
						}else{
							// this case is "do...while"
							this.mergeExecuteResult(left_resobj);						// merge condition result
							break;
						}
					}else{
						// condition = false
						this.mergeExecuteResult(left_resobj);							// merge condition result
						break;
					}
				}
				this._resobj.clearLoopControlFlags();									// clear since these flags are not used out of this syntax
			}

		}else if(FORMULA_SYNTAX_TYPE_DO === this.getSyntaxType()){
			//--------------------------
			// 'do' syntax
			//--------------------------
			// check while syntax exists
			if(!this.hasRightTemplObject() || !isBaseTemplateObject(this._rightTempl)){
				// this syntax must have right object.
				this.setExecuteError('there is no right(WHILE) object for syntax(DO)');
			}else{
				for(let is_loop = true; is_loop; ){
					// execute child object
					if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
						// execute child
						child_resobj = this._childTempl.execute(varmap);
						if(child_resobj.isFailure()){
							this.setExecuteError('failed executing child(true condition) for syntax(DO) : ' + apiutil.getSafeString(child_resobj.getLastValue()));
							break;
						}
						// merge child result
						this.mergeExecuteResult(child_resobj);							// merge condition result

						// check child result
						if(child_resobj.isBreak()){
							// no more executing
							break;
						}else if(child_resobj.isContinue()){
							// continue(not set continue flag)
						}
					}else{
						// nothing to execute
					}

					// execute right(WHILE) object chain
					right_resobj = this._rightTempl.execute(varmap);
					if(right_resobj.isFailure()){
						this.setExecuteError('failed executing right(WHILE) syntax for syntax(DO) : ' + apiutil.getSafeString(right_resobj.getLastValue()));
						break;
					}else if(!apiutil.isSafeEntity(right_resobj.getCondition()) || !apiutil.isBoolean(right_resobj.getCondition())){
						this.setExecuteError('got wrong condition result type from right(WHILE) syntax for syntax(DO) : ' + apiutil.getSafeString(right_resobj.getCondition()));
						break;
					}

					// check right result
					if(!right_resobj.getCondition()){
						// condition is false
						this.mergeExecuteResult(right_resobj);							// merge condition result
						break;
					}else{
						// condition is true
					}
				}
				this._resobj.clearLoopControlFlags();									// clear since these flags are not used out of this syntax
			}

		}else if(FORMULA_SYNTAX_TYPE_FOR === this.getSyntaxType()){
			//--------------------------
			// 'for' syntax
			//--------------------------
			// execute left(condition) template object
			if(!this.hasLeftTemplObject()){
				this.setExecuteError('there is no condition(left) for syntax(FOR).');
			}else{
				// execute initialization
				if(this.hasInitTemplObject() && isBaseTemplateObject(this._initTempl)){
					// execute formula(initialization)
					init_resobj = this._initTempl.execute(varmap);
					if(init_resobj.isFailure()){
						this.setExecuteError('failed executing initialization for syntax(FOR) : ' + apiutil.getSafeString(init_resobj.getLastValue()));
					}
					// merge aux result
					this.mergeExecuteResult(init_resobj);								// merge initialization result
				}else{
					// nothing to execute initialization
				}

				if(!this.isExecuteFailure()){
					// execute condition(left)
					for(let is_loop = true; is_loop && isBaseTemplateObject(this._leftTempl); ){
						left_resobj = this._leftTempl.execute(varmap);
						if(left_resobj.isFailure()){
							this.setExecuteError('failed executing left condition for syntax(FOR) : ' + apiutil.getSafeString(left_resobj.getLastValue()));
							break;
						}else if(!apiutil.isSafeEntity(left_resobj.getCondition()) || !apiutil.isBoolean(left_resobj.getCondition())){
							this.setExecuteError('got wrong condition result type for syntax(FOR) : ' + apiutil.getSafeString(left_resobj.getCondition()));
							break;
						}

						// check condition result
						if(left_resobj.getCondition()){
							// condition = true
							if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
								// execute child
								child_resobj = this._childTempl.execute(varmap);
								if(child_resobj.isFailure()){
									this.setExecuteError('failed executing child(true condition) for syntax(FOR) : ' + apiutil.getSafeString(child_resobj.getLastValue()));
									break;
								}
								// merge child result
								this.mergeExecuteResult(child_resobj);						// merge condition result

								// check child result
								if(child_resobj.isBreak()){
									// no more executing
									break;
								}else if(child_resobj.isContinue()){
									// continue, nothing to do
								}
							}else{
								// nothing to execute
							}

							// execute formula(aux)
							if(this.hasAuxTemplObject() && isBaseTemplateObject(this._auxTempl)){
								// execute formula(aux)
								aux_resobj = this._auxTempl.execute(varmap);
								if(aux_resobj.isFailure()){
									this.setExecuteError('failed executing auxiliary for syntax(FOR) : ' + apiutil.getSafeString(aux_resobj.getLastValue()));
									break;
								}
								// merge aux result
								this.mergeExecuteResult(aux_resobj);					// merge condition result
							}else{
								// nothing to execute aux
							}
						}else{
							// condition = false
							this.mergeExecuteResult(left_resobj);						// merge condition result
							break;
						}
					}
				}
				this._resobj.clearLoopControlFlags();									// clear since these flags are not used out of this syntax
			}

		}else if(FORMULA_SYNTAX_TYPE_FOREACH === this.getSyntaxType()){
			//--------------------------
			// 'foreach' syntax
			//--------------------------
			if(!this.hasLeftTemplObject() || !isBaseTemplateObject(this._leftTempl) || !this.hasAuxTemplObject() || !isBaseTemplateObject(this._auxTempl)){
				this.setExecuteError('there is no temporary variable(left) or syntax(IN) for syntax(FOREACH).');
			}else{
				// get temporary variable(left) name
				let	templvarnames: string[] | null	= this._leftTempl.getVariableNames();		// for temporary
				let	loopvarname: string | null		= null;										// loop variable name in "foreach"
				if(!apiutil.isStringArray(templvarnames) || !apiutil.isNotEmptyArray(templvarnames) || 1 !== templvarnames.length || !apiutil.isSafeString(templvarnames[0])){
					this.setExecuteError('temporary variable(left) name for syntax(FOREACH) is something wrong.');
				}else{
					loopvarname	= templvarnames[0];
				}

				// get master variable(auxiliary) name
				templvarnames = this._auxTempl.getVariableNames();
				let	collectvar: valTypeAllArray | valTypeAllObject | null = null;				// collection variable in foreach
				if(!apiutil.isStringArray(templvarnames) || !apiutil.isNotEmptyArray(templvarnames)){
					this.setExecuteError('master variable(auxiliary) name for syntax(FOREACH) is something wrong.');
					collectvar = null;
				}else{
					if(!isValTypeTemplateVariablesMap(varmap)){
						this.setExecuteError('varmap variable for syntax(FOREACH) is something wrong.');
						collectvar = null;
					}else{
						let tmpVarMap: valTypeTemplateVariablesMap | null = varmap;				// variables map

						// search array variable in variables map
						for(let cnt = 0; cnt < templvarnames.length; ++cnt){
							if(null === tmpVarMap){
								collectvar = null;
								break;
							}
							const tmpVarname = templvarnames[cnt];
							if(!apiutil.isString(tmpVarname)){
								collectvar = null;
								break;
							}
							const tmpVariable: valTypeAll = tmpVarMap[tmpVarname];
							if((cnt + 1) < templvarnames.length){
								// there's more to come
								if(!isValTypeTemplateVariablesMap(tmpVariable)){
									collectvar = null;
									break;
								}
								tmpVarMap = tmpVariable;
							}else{
								// last variable name
								if(apiutil.isArray(tmpVariable) || apiutil.isPlainObject(tmpVariable)){
									collectvar = tmpVariable;
								}else{
									collectvar = null;
								}
							}
						}
					}
				}
				// make array/object key names(position)
				let	collectvarkeys: string[] = [];
				if(apiutil.isArray(collectvar) || apiutil.isPlainObject(collectvar)){
					collectvarkeys = Object.keys(collectvar);
				}

				// loop
				for(let cnt = 0; (apiutil.isArray(collectvar) || apiutil.isPlainObject(collectvar)) && apiutil.isString(loopvarname) && cnt < collectvarkeys.length; ++cnt){
					// set temporary variable name and value into varmap
					const	varkey = collectvarkeys[cnt];
					if(apiutil.isArray(collectvar)){
						const	tmpPos = apiutil.cvtToNumber(varkey);
						if(apiutil.isSafeNumber(tmpPos)){
							if(null !== collectvar[tmpPos] && !apiutil.isSafeEntity(collectvar[tmpPos])){	// undefined === collectvar[varkey]
								r3logger.wlog('master array variable at pos(' + String(tmpPos) + ') is not safe entity, then skip this.');
								continue;
							}
						}else{
							// not come here
							r3logger.wlog('varkey is not number, then skip this.');
							continue;
						}
					}else if(apiutil.isPlainObject(collectvar)){
						if(null !== collectvar[varkey] && !apiutil.isSafeEntity(collectvar[varkey])){		// undefined === collectvar[varkey]
							r3logger.wlog('master object variable at key/pos(' + varkey + ') is not safe entity, then skip this.');
							continue;
						}
					}else{
						// not come here
						continue;
					}
					varmap[loopvarname] = varkey;

					// execute child
					if(this.hasChildTemplObject() && isBaseTemplateObject(this._childTempl)){
						child_resobj = this._childTempl.execute(varmap);
						if(child_resobj.isFailure()){
							this.setExecuteError('failed executing child for syntax(FOREACH) : ' + apiutil.getSafeString(child_resobj.getLastValue()));
							break;
						}
						// merge child result
						this.mergeExecuteResult(child_resobj);							// merge condition result

						// check child result
						if(child_resobj.isBreak()){
							// no more executing
							break;
						}else if(child_resobj.isContinue()){
							// continue, nothing to do
						}
					}else{
						// nothing to execute
					}
				}
				this._resobj.clearLoopControlFlags();									// clear since these flags are not used out of this syntax
			}

		}else if(FORMULA_SYNTAX_TYPE_IN === this.getSyntaxType()){
			//--------------------------
			// 'in' syntax
			//--------------------------
			// nothing to do
			//
			// [NOTE]
			// This syntax object will never be executed.
			// This is only called from syntax(FOREACH) to get variable name array(getVariableNames).
			//

		}else if(FORMULA_SYNTAX_TYPE_DONE === this.getSyntaxType()){
			//--------------------------
			// 'done' syntax
			//--------------------------
			// nothing to do

		}else if(FORMULA_SYNTAX_TYPE_BREAK === this.getSyntaxType()){
			//--------------------------
			// 'break' syntax
			//--------------------------
			// set break flag in result object
			this._resobj.setBreak();

		}else if(FORMULA_SYNTAX_TYPE_CONTINUE === this.getSyntaxType()){
			//--------------------------
			// 'continue' syntax
			//--------------------------
			// set continue flag in result object
			//
			// [NOTE]
			// Take care for condition value in result object is false.
			//
			this._resobj.setContinue();

		}else{
			// why?
			this.setExecuteError('syntax type is unknown : ' + JSON.stringify(this.getSyntaxType()));
		}

		if(this.isExecuteFailure()){
			return this.getExecuteResult();
		}
		if(!this._resobj.isLoopControlFlags() && this.hasNextTemplObject() && isBaseTemplateObject(this._nextTempl)){
			// If the Loop control flag is set, this processing will not be executed.
			//
			const	nextres = this._nextTempl.execute(varmap);
			this.mergeExecuteResult(nextres);
		}
		return this.getExecuteResult();
	};
}

//---------------------------------------------------------
// Utilities for BaseFormulaObject classes
//---------------------------------------------------------
// 
// Utility function for isHighOperatorPriority
// 
const cvtOperatorPriorityValue = (type: number): number => {

	switch(type){
		case FORMULA_CALC_TYPE_INC:			// Priority 1(high)
		case FORMULA_CALC_TYPE_DEC:
			return 1;
		case FORMULA_CALC_TYPE_NOT:			// Priority 2
			return 2;
		case FORMULA_CALC_TYPE_DIV:			// Priority 3
		case FORMULA_CALC_TYPE_MUL:
		case FORMULA_CALC_TYPE_REM:
			return 3;
		case FORMULA_CALC_TYPE_ADD:			// Priority 4
		case FORMULA_CALC_TYPE_SUB:
			return 4;
		case FORMULA_CALC_TYPE_LSHIFT:		// Priority 5
		case FORMULA_CALC_TYPE_RSHIFT:
			return 5;
		case FORMULA_COND_TYPE_LESS:		// Priority 6
		case FORMULA_COND_TYPE_GREAT:
		case FORMULA_COND_TYPE_LESSEQ:
		case FORMULA_COND_TYPE_GREATEQ:
			return 6;
		case FORMULA_COND_TYPE_EQUAL:		// Priority 7
		case FORMULA_COND_TYPE_NOTEQ:
			return 7;
		case FORMULA_CALC_TYPE_AMP:			// Priority 8
			return 8;
		case FORMULA_CALC_TYPE_VARTBAR:		// Priority 9
			return 9;
		case FORMULA_COND_TYPE_AND:			// Priority 10
			return 10;
		case FORMULA_COND_TYPE_OR:			// Priority 11
			return 11;
		case FORMULA_CALC_TYPE_SET:			// Priority 13(low)
			return 12;
		case FORMULA_COND_TYPE_UNKNOWN:		// == FORMULA_CALC_TYPE_UNKNOWN
		default:
			break;
	}
	return 0;
};

// 
// Compare the priorities of the operators indicated by CalculateFormulaObject or ConditionFormulaObject.
// 
// This function always returns false if baseObject or compObject are not these classes.
// And this returns false even if object's operator types is unknown.
// This function returns true only if compObject has higher(lower) priority than baseObject.
// 
const compareOperatorPriority = (
	baseObject:	BaseTemplateObject,
	compObject:	BaseTemplateObject,
	is_higher?:	boolean
): boolean => {

	if(null === baseObject || 'object' !== typeof baseObject || (!isCalculateFormulaObject(baseObject) && !isConditionFormulaObject(baseObject))){
		return false;
	}
	if(null === baseObject || 'object' !== typeof compObject || (!isCalculateFormulaObject(baseObject) && !isConditionFormulaObject(baseObject))){
		return false;
	}
	if(!apiutil.isBoolean(is_higher)){
		is_higher = false;							// default lower check
	}

	const	baseType	= isCalculateFormulaObject(baseObject) ? baseObject.getCalculateType() : (isConditionFormulaObject(baseObject) ? baseObject.getConditionType() : FORMULA_CALC_TYPE_UNKNOWN);
	const	compType	= isCalculateFormulaObject(compObject) ? compObject.getCalculateType() : (isConditionFormulaObject(compObject) ? compObject.getConditionType() : FORMULA_CALC_TYPE_UNKNOWN);

	const	basePriority = cvtOperatorPriorityValue(baseType);
	const	compPriority = cvtOperatorPriorityValue(compType);
	if(basePriority <= 0 || compPriority <= 0){
		return false;
	}
	return (is_higher ? (compPriority < basePriority) : (basePriority < compPriority));
};

//---------------------------------------------------------
// K2HR3 Template Engine Utility : K2HR3 Template Classes List
//---------------------------------------------------------
//
// Template Object Constructor List which have testAssemble() method
//
const	k2hr3StatementObjectList: StatementTemplateConstructor[] = [
	StaticStatementTemplateObject,				// Statement / Static
	CommentStatementTemplateObject,				// Statement / Comment
	PrintStatementTemplateObject,				// Statement / Print
	SyntaxFormulaObject,						// Statement / Formula / Syntax
	ConditionFormulaObject,						// Statement / Formula / Condition
	CalculateFormulaObject,						// Statement / Formula / Calculate
	VariableFormulaObject						// Statement / Formula / Variable
];

//---------------------------------------------------------
// K2HR3 Template Engine Class
//---------------------------------------------------------
class K2hr3TemplateEngine {

	protected _templString: string | null					= null;
	protected _templObjArray: BaseTemplateObject[] | null	= null;
	protected _resultObject: K2hr3TemplateResult | null		= null;

	constructor(templString?: string)
	{
		if(apiutil.isSafeString(templString)){
			this.load(templString);
		}
	};

	public clear(): void {
		this._templString	= null;
		this._templObjArray	= null;
		this._resultObject	= null;
	};

	public parseEngineType = (templString: string): [string, string] => {

		if(!apiutil.isSafeString(templString)){
			//r3logger.dlog('template String is empty or wrong string, but it means not specified engine type.');
			return [TEMPL_K2HR3_TEMPLENGINE_KW, templString];
		}

		const	reg		= new RegExp(TEMPL_ENGINE_TYPE_PTN);
		const	matched	= templString.match(reg);
		if(!apiutil.isStringArray(matched) || !apiutil.isNotEmptyArray(matched) || matched.length < 2){
			//r3logger.dlog('Not found template engine type keywords, then using this class.');
			return [TEMPL_K2HR3_TEMPLENGINE_KW, templString];
		}

		if(apiutil.compareCaseString(matched[1], TEMPL_K2HR3_TEMPLENGINE_KW) || apiutil.compareCaseString(matched[1], TEMPL_K2HR3_TEMPLENGINE_KW + '.js')){
			//r3logger.dlog('found template engine type(' + matched[1] + ') keywords, it is using this class.');
			return [TEMPL_K2HR3_TEMPLENGINE_KW, templString.substr(matched[0].length)];
		}

		return [matched[1], templString.substr(matched[0].length)];
	};

	public getEngineType = (templString: string): string => {
		const	parsers = this.parseEngineType(templString);
		return parsers[0];
	};

	public checkEngineType = (templString: string): boolean => {
		const	parsers = this.parseEngineType(templString);
		return (TEMPL_K2HR3_TEMPLENGINE_KW === parsers[0]);
	};

	// [NOTE]
	// This method can receive a callback function.
	// When callback argument is specified, it operates asynchronously.
	// However, since k2hr3_api uses express, this method is called in
	// synchronous mode.
	//
	// Callback function format:
	//    callback(error_str, result)
	//
	public load = (
		templString:	string,
		callback?:		cbTypeLoadTemplte
	): boolean | void => {

		const	_callback: cbTypeLoadTemplte | null = !apiutil.isFunction(callback) ? null : callback;

		// clear
		let		temporaryString = this._templString;
		if(apiutil.isString(templString)){
			temporaryString = templString;
		}
		this.clear();

		// check & parse engine type
		if(!apiutil.isSafeString(temporaryString)){
			const	_errorstr = 'template String is empty or wrong string : ' + JSON.stringify(temporaryString);
			r3logger.elog(_errorstr);
			if(null === _callback){
				return false;
			}
			_callback(_errorstr, false);
			return;
		}

		const	parsers = this.parseEngineType(temporaryString);
		if(TEMPL_K2HR3_TEMPLENGINE_KW !== parsers[0]){
			const	_errorstr = 'template String is not k2hr3 template string : ' + JSON.stringify(temporaryString);
			r3logger.elog(_errorstr);
			if(null === _callback){
				return false;
			}
			_callback(_errorstr, false);
			return;
		}
		temporaryString = parsers[1];											// parsed after engine type

		// parse template string to statement array
		const	statementsArray = parseK2hr3Template(temporaryString);
		if(!isNotEmptyStatementsArray(statementsArray)){
			const	_errorstr = 'templateArray is empty or wrong : ' + JSON.stringify(statementsArray);
			r3logger.elog(_errorstr);
			if(null === _callback){
				return false;
			}
			_callback(_errorstr, false);
			return;
		}

		// create template objects chain
		const	templObjArray: BaseTemplateObject[]	= [];
		while(null !== statementsArray && 0 < statementsArray.length){
			const	resobj = createK2hr3TemplateObject(statementsArray, null);	// does not set parent
			if(!resobj.result){
				const	_errorstr = 'failed to build statement object array : ' + resobj.message;
				r3logger.elog(_errorstr);
				if(null === _callback){
					return false;
				}
				_callback(_errorstr, false);
				return;
			}
			if(!isBaseTemplateObject(resobj.templObj)){
				// finish
				break;
			}
			templObjArray.push(resobj.templObj);
		}
		if(!apiutil.isNotEmptyArray(templObjArray)){
			r3logger.dlog('the result of building statement object array is empty.');
		}
		this._templString	= temporaryString;
		this._templObjArray	= templObjArray;

		if(null === _callback){
			return true;
		}
		_callback(null, true);
	};

	public isLoaded = (): boolean => {
		return ((apiutil.isSafeString(this._templString) || '' === this._templString) && apiutil.isArray(this._templObjArray));
	};

	// [NOTE]
	// This method can receive a callback function.
	// When callback argument is specified, it operates asynchronously.
	// However, since k2hr3_api uses express, this method is called in
	// synchronous mode.
	//
	// Callback function format:
	//    callback(error_str, array)
	//
	public getVariableNames(callback?: cbTypeTemplateVariableNames): string[] | void {

		const	_callback: cbTypeTemplateVariableNames | null	= !apiutil.isFunction(callback) ? null : callback;
		let		_vararr: string[]								= [];

		if(!this.isLoaded()){
			const	_errorstr = 'this object does not load template string yet.';
			r3logger.wlog(_errorstr);
			if(null === _callback){
				return _vararr;
			}
			_callback(_errorstr, _vararr);
			return;
		}

		for(let cnt = 0; null !== this._templObjArray && cnt < this._templObjArray.length; ++cnt){
			const	resarr	= this._templObjArray[cnt].getVariableNames();
			_vararr			= apiutil.mergeArray(_vararr, resarr);
		}

		if(null === _callback){
			return _vararr;
		}
		_callback(null, _vararr);
	};

	// [NOTE]
	// This method can receive a callback function.
	// When callback argument is specified, it operates asynchronously.
	// However, since k2hr3_api uses express, this method is called in
	// synchronous mode.
	//
	// Callback function format:
	//    callback(result_object)
	//
	public execute = (
		varmap:		valTypeTemplateVariablesMap,
		callback?:	cbTypeExecuteTemplateResult
	): K2hr3TemplateResult | void => {

		this._resultObject										= new K2hr3TemplateResult(true);
		const	_callback: cbTypeExecuteTemplateResult | null	= !apiutil.isFunction(callback) ? null : callback;

		if(!this.isLoaded()){
			const	_errorstr = 'this object does not load template string yet.';
			r3logger.elog(_errorstr);
			this._resultObject.init(false);

			if(null === _callback){
				return this._resultObject;
			}
			_callback(this._resultObject);
			return;
		}

		for(let cnt = 0; null !== this._templObjArray && cnt < this._templObjArray.length; ++cnt){
			const	execres	= this._templObjArray[cnt].execute(varmap);
			this._resultObject.merge(execres);
		}

		if(null === _callback){
			return this._resultObject;
		}
		_callback(this._resultObject);
	};
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
//
// Class
//
const r3template = K2hr3TemplateEngine;

export default r3template;

export {
	K2hr3TemplateResult
};

//
// Variables
//
export {
	valTypeStatementObject,
	valTypeStatementsArray,
	valTypeTemplateVariablesMap,
	resTypeCreateTemplateObject
};

//
// Callbacks
//
export {
	cbTypeLoadTemplte,
	cbTypeTemplateVariableNames,
	cbTypeExecuteTemplateResult
};

//
// Functions
//
export {
	isSafeStatementObject,
	isSafeStatementsArray,
	isNotEmptyStatementsArray,
	isReplicationStatementObject,
	isValTypeTemplateVariablesMap,
	isK2hr3TemplateResult
};

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
