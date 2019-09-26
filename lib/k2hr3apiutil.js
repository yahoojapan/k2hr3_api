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
 * CREATE:   Wed Jun 8 2017
 * REVISION:
 *
 */

'use strict';

var dns		= require('dns');
var url		= require('url');
var	fs		= require('fs');
var crypto	= require('crypto');

//---------------------------------------------------------
// Utilities for variables
//---------------------------------------------------------
function rawIsSafeString(str)
{
	if(undefined === str || null === str || 'string' !== typeof str || '' === str){
		return false;
	}
	return true;
}

function rawIsSafeEntity(data)
{
	return (undefined !== data && null !== data);
}

function rawCompareCaseString(str1, str2)
{
	if(rawIsSafeString(str1) && rawIsSafeString(str2) && str1.toLowerCase() === str2.toLowerCase()){
		return true;
	}
	return false;
}

function rawHasPartString(strbase, sep, values, iscase)
{
	if(!rawIsSafeString(strbase) || !rawIsSafeString(sep)){
		return false;
	}

	var	valarray = values;
	if(!rawIsArray(values)){
		if(!rawIsSafeString(values)){
			return false;
		}
		valarray = new Array();
		valarray.push(values);
	}

	var	basearray = strbase.split(sep);
	for(var cnt1 = 0; cnt1 < basearray.length; ++cnt1){
		var	strtmp1 = basearray[cnt1].trim();
		if(!rawIsSafeString(strtmp1)){
			continue;
		}
		for(var cnt2 = 0; cnt2 < valarray.length; ++cnt2){
			var	strtmp2 = valarray[cnt2].trim();
			if(!rawIsSafeString(strtmp2)){
				continue;
			}
			if(iscase){
				if(rawCompareCaseString(strtmp1, strtmp2)){
					return true;
				}
			}else{
				if(strtmp1 === strtmp2){
					return true;
				}
			}
		}
	}
	return false;
}

function rawGetSafeString(str)
{
	if(rawIsSafeString(str)){
		return str;
	}
	return '';
}

function rawCheckSimpleJSON(str)
{
	if(undefined === str || null === str || !isNaN(str) || 'string' !== typeof str){
		return false;
	}
	try{
		var tmp = JSON.parse(str);						// eslint-disable-line no-unused-vars
	}catch(exception){
		return false;
	}
	return true;
}

function rawParseJSON(str)
{
	if(undefined === str || null === str || !isNaN(str) || 'string' !== typeof str){
		return null;
	}
	try{
		return JSON.parse(str);
	}catch(exception){
		return null;
	}
}

function rawIsArray(arr)
{
	if(arr instanceof Array){
		return true;
	}
	return false;
}

function rawIsEmptyArray(arr)
{
	if(!(arr instanceof Array) || 0 === arr.length){
		return true;
	}
	return false;
}

function rawGetSafeArray(arr)
{
	var	result_array;
	if(!(arr instanceof Array)){
		result_array = new Array(0);
	}else{
		result_array = arr;
	}
	return result_array;
}

function rawFindStringInArray(arr, str)
{
	if(arr instanceof Array && undefined !== str && null !== str){
		for(var cnt = 0; cnt < arr.length; ++cnt){
			if(str == arr[cnt]){
				return true;
			}
		}
	}
	return false;
}

function rawAddStringToArray(arr, str)
{
	var	result_array;
	if(!(arr instanceof Array)){
		result_array = new Array(0);
	}else{
		result_array = arr;
	}
	result_array.push(str);
	return result_array;
}

function rawTryAddStringToArray(arr, str)
{
	if(!(arr instanceof Array)){
		return false;
	}
	if(rawFindStringInArray(arr, str)){
		return false;
	}
	// arr is array and it does not have str.
	// so add str to arr.
	arr.push(str);
	return true;
}

function rawRemoveStringFromArray(arr, str)
{
	if(!(arr instanceof Array) || undefined === str || null === str){
		return false;
	}
	for(var cnt = 0; cnt < arr.length; ++cnt){
		if(str == arr[cnt]){
			arr.splice(cnt, 1);
			return true;
		}
	}
	return false;
}

function rawCompareArray(arr1, arr2, strict)
{
	if(!(arr1 instanceof Array) || !(arr2 instanceof Array) || arr1.length !== arr2.length){
		return false;
	}
	if(!rawIsSafeEntity(strict) || 'boolean' !== typeof strict || false === strict){
		var	is_found;
		for(var cnt1 = 0; cnt1 < arr1.length; ++cnt1){
			is_found = false;
			for(var cnt2 = 0; cnt2 < arr2.length; ++cnt2){
				if(arr1[cnt1] === arr2[cnt2]){
					is_found = true;
					break;
				}
			}
			if(!is_found){
				return false;
			}
		}
	}else{
		if(JSON.stringify(arr1) !== JSON.stringify(arr2)){
			return false;
		}
	}
	return true;
}

function rawMergeArray(arr1, arr2)
{
	if(!(arr1 instanceof Array) && !(arr2 instanceof Array)){
		return [];
	}
	if(!(arr2 instanceof Array)){
		return arr1;
	}
	if(!(arr1 instanceof Array)){
		return arr2;
	}
	for(var cnt2 = 0; cnt2 < arr2.length; ++cnt2){
		var is_found = false;
		for(var cnt1 = 0; cnt1 < arr1.length; ++cnt1){
			if(arr1[cnt1] === arr2[cnt2]){
				is_found = true;
				break;
			}
		}
		if(!is_found){
			arr1.push(arr2[cnt2]);
		}
	}
	return arr1;
}

//
// Get difference from base to new array elements.
// If is_deleted_element is true, returns result difference elements for deleting from base.
// If is_deleted_element is false, returns result difference elements for adding from base.
//
function rawGetDiffArray(basearr, newarr, is_deleted_element)
{
	if(!(basearr instanceof Array) && !(newarr instanceof Array)){
		return [];
	}else if(!(basearr instanceof Array) && (newarr instanceof Array)){
		if(is_deleted_element){
			return [];
		}else{
			return newarr;
		}
	}else if((basearr instanceof Array) && !(newarr instanceof Array)){
		if(is_deleted_element){
			return basearr;
		}else{
			return [];
		}
	}

	var	cnt;
	var	result = new Array(0);
	if(is_deleted_element){
		for(cnt = 0; cnt < basearr.length; ++cnt){
			if(!rawFindStringInArray(newarr, basearr[cnt])){
				result.push(basearr[cnt]);
			}
		}
	}else{
		for(cnt = 0; cnt < newarr.length; ++cnt){
			if(!rawFindStringInArray(basearr, newarr[cnt])){
				result.push(newarr[cnt]);
			}
		}
	}
	return result;
}

function rawMergeObjects(obj1, obj2)
{
	if(!rawIsSafeEntity(obj1)){
		obj1 = {};
	}
	if(!rawIsSafeEntity(obj2)){
		obj2 = {};
	}
	var	resobj = {};
	for(var key1 in obj1){
		resobj[key1] = obj1[key1];
	}
	for(var key2 in obj2){
		resobj[key2] = obj2[key2];
	}
	return resobj;
}

//---------------------------------------------------------
// Utilities for time
//---------------------------------------------------------
//
// base is UTC
//
function convertUnixtime(base)
{
	var	unixtime_ms;
	if(undefined === base || null === base || '' === base){
		var	now		= new Date();
		unixtime_ms	= now.getTime();
	}else{
		unixtime_ms	= Date.parse(base);
	}
	return Math.floor(unixtime_ms / 1000);
}

function rawConvertISOStringToUnixtime(iso)
{
	if(!rawIsSafeString(iso)){
		return 0;
	}
	var	isoTime	= new Date(iso);
	var	utime	= isoTime.getTime() / 1000;
	return utime;
}

function rawGetExpireUnixtime(starttime, expiretime)
{
	return (expiretime - starttime);
}

function rawGetExpireUnixtimeFromISOStrings(startiso, expireiso)
{
	var	starttime	= rawConvertISOStringToUnixtime(startiso);
	var	expiretime	= rawConvertISOStringToUnixtime(expireiso);
	return rawGetExpireUnixtime(starttime, expiretime);
}

//---------------------------------------------------------
// Utilities for Key and Hierarchy
//---------------------------------------------------------
//
// Convert string to Hierarchy Array by separator
// ex)	"parent-", "a/b/c"	=> ["parent-", "parent-a", "parent-a/b", "parent-a/b/c"]
//		null, "a/b/c"		=> ["a", "a/b", "a/b/c"]
//
function rawExpandHierarchyArray(parent, str, separator, allow_empty)
{
	if(!rawIsSafeString(str)){
		return null;
	}
	var	sep = '/';
	if(rawIsSafeString(separator)){
		sep = separator;
	}
	if(!rawIsSafeEntity(allow_empty)){
		allow_empty = false;
	}else if('boolean' !== typeof allow_empty){
		return null;
	}
	var	result	= new Array(0);
	if(rawIsSafeString(parent)){
		result.push(parent);
	}else{
		parent = '';
	}
	var	parts 	= str.split(sep);
	var	tmp		= parent;
	for(var cnt = 0; cnt < parts.length; ++cnt){
		if(0 !== cnt){
			tmp += sep;
		}
		var	tmpstr	= rawGetSafeString(parts[cnt]);
		tmp			+= tmpstr;
		if(allow_empty || '' !== str){
			result.push(tmp);
		}
	}
	return result;
}

// 
// Convert parent and terminal children(string or array) to Hierarchy object
// The result is the object which is configured "key=parent", "value=parent's children".
//
// ex)	parent		= "parent-"		===>	result	=	{	"parent":		["parent-a"],
//		children	= "a/b/c"								"parent-a":		["parent-a/b"],
//															"parent-a/b":	["parent-a/b/c"],
//															"parent-a/b/c":	[]
//														};
//
// ex)	parent		= "parent-"		===>	result	=	{	"parent":		["parent-a", "parent-1"],
//		children	= [	"a/b/c",							"parent-a":		["parent-a/b"],
//						"1/2/3"]							"parent-a/b":	["parent-a/b/c"],
//															"parent-a/b/c":	[],
//															"parent-1":		["parent-1/2"],
//															"parent-1/2":	["parent-1/2/3"],
//															"parent-1/2/3":	[]
//														};
//
// ex)	parent		= ""			===>	result	=	{	"a":		["a/b"],
//		children	= ["a/b/c"]								"a/b":		["a/b/c"],
//															"a/b/c":	[]
//														};
//
// ex)	parent		= ""			===>	result	=	null(because this case does not have hierarchy)
//		children	= "a"
//
function rawExpandHierarchy(parent, children, separator, allow_empty)
{
	if(!rawIsSafeString(parent)){
		parent = '';
	}
	if(!(children instanceof Array)){
		if(!rawIsSafeString(children)){
			return null;
		}
		var	tmp	= children;
		children= [tmp];
	}
	var	is_set	= false;
	var	result	= {};
	var	parent_in_array;
	for(var cnt = 0; cnt < children.length; ++cnt){
		// parent + children[x] ---> ["parent", "parent child1", "parent child1 sep child2", ...]
		var	child_hierarchy_arr = rawExpandHierarchyArray(parent, children[cnt], separator, allow_empty);
		if(null === child_hierarchy_arr || !(child_hierarchy_arr instanceof Array) || 0 === child_hierarchy_arr.length){
			continue;
		}
		parent_in_array = '';
		for(var cnt2 = 0; cnt2 < child_hierarchy_arr.length; ++cnt2){
			if('' !== parent_in_array){
				// parent ---> [child, child, ...]
				if(!rawFindStringInArray(result[parent_in_array], child_hierarchy_arr[cnt2])){
					result[parent_in_array].push(child_hierarchy_arr[cnt2]);
					is_set = true;
				}
			}
			parent_in_array = child_hierarchy_arr[cnt2];
			if(!rawIsSafeEntity(result[parent_in_array]) || !(result[parent_in_array] instanceof Array)){
				result[parent_in_array] = new Array(0);
			}
		}
	}
	if(!is_set){
		return null;
	}
	return result;
}
//
// Get direct parent path for key
// ex)	parent: "parent",	childkey: ":a/b/c"	=> parent:a/b
//		parent: null,		childkey: ":a/b/c"	=> :a/b
//		parent: "parent",	childkey: ":a"		=> parent
//		parent: "parent",	childkey: ""		=> null
//
function rawGetParentKey(parent, childkey, separator, allow_empty)
{
	if(!rawIsSafeString(childkey)){
		return null;
	}
	var	child_hierarchy_arr = rawExpandHierarchyArray(parent, childkey, separator, allow_empty);
	if(null === child_hierarchy_arr || !(child_hierarchy_arr instanceof Array) || 0 === child_hierarchy_arr.length){
		return null;
	}
	if(1 === child_hierarchy_arr.length){
		// there is no parent, the array is only childkey(or parent)
		return null;
	}
	return child_hierarchy_arr[child_hierarchy_arr.length - 2];
}

//
// Get parent path from string
//
// ex)	"a/b/c"		=> "a/b"
//		"a"			=> null
//		"a/b/c/"	=> "a/b"		: if allow_empty is false
//		"a/b/c/"	=> "a/b/c"		: if allow_empty is true
//		"a//b/c"	=> "a//b"
//		"a/b/c//"	=> "a/b"		: if allow_empty is false
//		"a/b/c//"	=> "a/b/c/"		: if allow_empty is true
//		"a/"		=> null			: if allow_empty is false
//		"a/"		=> "a"			: if allow_empty is true
//		"/a/b"		=> "/a"
//		"/a"		=> null
//		"a//b"		=> "a"			: if allow_empty is false
//		"a//b"		=> "a/"			: if allow_empty is true
//		"a/b///"	=> "a"			: if allow_empty is false
//		"a/b///"	=> "a/b//"		: if allow_empty is true
//
function rawGetParentPath(str, separator, allow_empty)
{
	if(!rawIsSafeString(str)){
		return '';
	}
	if(!rawIsSafeEntity(allow_empty)){
		allow_empty = false;
	}else if('boolean' !== typeof allow_empty){
		return '';
	}
	if(!rawIsSafeString(separator)){
		separator = '/';
	}
	var	tmp;
	var	cnt;

	// escape if allow empty
	if(allow_empty){
		// escape '\' --> '\\'
		str = str.replace(/\\/g, '\\\\');
		// last word is '/' --> add '\'
		if('/' === str[str.length - 1]){
			str += '\\';
		}
		// if '//' --> '/\/'
		tmp = '';
		for(cnt = 0; cnt < str.length; ++cnt){
			tmp += str[cnt];
			if('/' === str[cnt] && (cnt + 1) < str.length && '/' === str[cnt + 1]){
				tmp += '\\';
			}
		}
		str = tmp;
	}

	// parse by separator
	var	parts = str.split(separator);

	// remove last elements until it is not empty
	while(0 < parts.length && !rawIsSafeString(parts[parts.length - 1])){
		parts.pop();
	}

	// remove last element
	if(0 < parts.length){
		parts.pop();
	}

	// remove last elements until it is not empty
	while(0 < parts.length && !rawIsSafeString(parts[parts.length - 1])){
		parts.pop();
	}

	// join with separator
	var	parent = parts.join(separator);

	// unescape if allow empty
	if(allow_empty && rawIsSafeString(parent)){
		// '\' --> '' or '\\' --> '\'
		tmp = '';
		for(cnt = 0; cnt < parent.length; ++cnt){
			if('\\' === parent[cnt]){
				++cnt;
				if(cnt < parent.length && '\\' === parent[cnt]){
					tmp += parent[cnt];	// = '\'
				}
			}else{
				tmp += parent[cnt];
			}
		}
		parent = tmp;
	}
	return parent;
}

//
// Compare string by regex or string patterns(array)
//
function rawCompareStringByFormats(str, regex_ptn, pattern_array)
{
	if(!rawIsSafeString(str)){
		return null;
	}
	var	tmpstr	= str.toLowerCase();

	if(rawIsSafeEntity(regex_ptn)){
		var	matches	= tmpstr.match(regex_ptn);
		if(!rawIsEmptyArray(matches) && 2 <= matches.length){
			return tmpstr;
		}
	}

	if(!rawIsArray(pattern_array) && rawIsSafeString(pattern_array)){
		var	tmpptn		= pattern_array;
		pattern_array	= [tmpptn];
	}
	if(rawIsArray(pattern_array)){
		for(var cnt = 0; cnt < pattern_array.length; ++cnt){
			if(rawCompareCaseString(tmpstr, pattern_array[cnt])){
				return tmpstr;
			}
		}
	}
	return null;
}

//---------------------------------------------------------
// Utilities for regex
//---------------------------------------------------------
//
// return object = {
//						result:		true/false
//						parameter:	object(array) or null or '' or undefined
//					}
//
function rawGetNormalizeParameter(parameter, regex_ptn, pattern)
{
	var	resobj = { result: false };
	var	resstr;
	var	cnt;

	if(rawIsSafeEntity(parameter) && rawCheckSimpleJSON(parameter)){
		parameter = JSON.parse(parameter);
	}

	if(!rawIsSafeEntity(parameter)){
		resobj.result 	= true;
		resobj.parameter= null;								// = not update type

	}else if(rawIsArray(parameter)){
		if(rawIsEmptyArray(parameter)){
			resobj.result 	= true;
			resobj.parameter= '';							// = clean up type
		}else{
			resobj.result 	= true;
			resobj.parameter= new Array(0);
			for(cnt = 0; cnt < parameter.length; ++cnt){
				resstr = rawCompareStringByFormats(parameter[cnt], regex_ptn, pattern);
				if(null === resstr){
					resobj.result 	= false;
					resobj.parameter= null;
					break;
				}
				resobj.parameter.push(resstr);
			}
		}

	}else if('' === parameter){
		resobj.result 	= true;
		resobj.parameter= '';								// = clean up type

	}else if(rawIsSafeString(parameter)){
		var	tmparr = parameter.split(',');
		if(rawIsArray(tmparr) && !rawIsEmptyArray(tmparr)){
			resobj.result 	= true;
			resobj.parameter= new Array(0);
			for(cnt = 0; cnt < tmparr.length; ++cnt){
				resstr = rawCompareStringByFormats(tmparr[cnt], regex_ptn, pattern);
				if(null === resstr){
					resobj.result 	= false;
					resobj.parameter= null;
					break;
				}
				resobj.parameter.push(resstr);
			}
		}else{
			resobj.result 	= true;
			resobj.parameter= '';							// = clean up type
		}

	}else{
		resobj.result 	= false;
	}
	return resobj;
}

//---------------------------------------------------------
// Utilities for UUID4
//---------------------------------------------------------
// RFC4122
// https://www.ietf.org/rfc/rfc4122.txt
//
// UUID4 = xxxxxxxx-xxxx-Nxxx-Mxxx-xxxxxxxxxxxx
//			N: 0x4X
//			M: 0x{8,9,A,B}X
//
function rawGetBinUuid4()
{
	var binUuid4= crypto.randomBytes(16);
	binUuid4[6]	= (binUuid4[6] & 0x0f) | 0x40;	// UUID4 must be 0x4X for pos 6 in buffer
	binUuid4[8]	= (binUuid4[8] & 0x3f) | 0x80;	// UUID4 must be 0x{8,9,A,B}X for pos 8 in buffer

	return binUuid4;
}

// [NOTE]
// If binary data is given, this is only a conversion to UUID format,
// not a method that enforces UUID4 format.
//
function rawGetStrUuid4(binUuid4)
{
	if(!rawIsSafeEntity(binUuid4) || !(binUuid4 instanceof Buffer)){
		binUuid4 = rawGetBinUuid4();
	}
	var	parsed	= binUuid4.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
	parsed.shift();								// first element is all, then skip it.
	var	strUuid	= parsed.join('-');
	return strUuid;
}

function rawIsSafeStrUuid4(strUuid4)
{
	if(!rawIsSafeString(strUuid4)){
		return false;
	}
	// split '-' separator
	var	strArray = strUuid4.split('-');
	if(5 != strArray.length){
		return false;
	}
	// check length
	if(	0 == strArray[0].length || 8 < strArray[0].length	||
		0 == strArray[1].length || 4 < strArray[1].length	||
		0 == strArray[2].length || 4 < strArray[2].length	||
		0 == strArray[3].length || 4 < strArray[3].length	||
		0 == strArray[4].length || 12 < strArray[4].length	)
	{
		return false;
	}
	return true;
}

function rawCvtStrToBinUuid4(strUuid4)
{
	if(!rawIsSafeString(strUuid4)){
		return null;
	}
	// split '-' separator
	var	strArray = strUuid4.split('-');
	if(5 != strArray.length){
		return null;
	}
	// check length and fill '0' for short part
	strArray[0] = rawFillZeroString(strArray[0], 8);
	strArray[1] = rawFillZeroString(strArray[1], 4);
	strArray[2] = rawFillZeroString(strArray[2], 4);
	strArray[3] = rawFillZeroString(strArray[3], 4);
	strArray[4] = rawFillZeroString(strArray[4], 12);
	if(null == strArray[0] || null == strArray[1] || null == strArray[2] || null == strArray[3] || null == strArray[4]){
		return null;
	}
	// uuid full hex string
	var	fullString = strArray.join('');

	// convert to binary array
	var	binUuid4 = new Uint8Array(fullString.match(/.{1,2}/g).map(function(val){ return parseInt(val, 16); }));
	return Buffer(binUuid4);
}

function rawFillZeroString(str, size)
{
	if(!rawIsSafeString(str)){
		return null;
	}
	if(size < str.length){
		return null;
	}else if(str.length < size){
		var	fillstr = '';
		for(var	fillcnt = size - str.length; 0 < fillcnt; --fillcnt){
			fillstr += '0';
		}
		str = fillstr + str;
	}
	return str;
}

//
// Return result
// {
//		hi_id:		Buffer[16] for hi uuid
//		low_id:		Buffer[16] for low uuid
//		base:		Buffer[32] for base
//		str_token:	hex[32] string for token
//		token:		Buffer[32] for token
// }
//
function rawMakeToken256(hiUuid4, lowUuid4, base)
{
	// hiUuid4[128] / lowUuid4[128]
	if(	!rawIsSafeEntity(hiUuid4)  || !(hiUuid4 instanceof Buffer)  || 16 != hiUuid4.length  ||
		!rawIsSafeEntity(lowUuid4) || !(lowUuid4 instanceof Buffer) || 16 != lowUuid4.length ||
		!rawIsSafeEntity(base)     || !(base instanceof Buffer)     || 32 != base.length     )
	{
		return null;
	}
	var	result		= {};
	result.hi_id	= hiUuid4;
	result.low_id	= lowUuid4;
	result.base		= base;

	// raw not crypted token[256]
	var	token = new Buffer(32);
	for(var cnt = 0; cnt < 32; ++cnt){
		if(cnt < 16){
			token[cnt] = result.base[cnt] ^ hiUuid4[cnt];
		}else{
			token[cnt] = result.base[cnt] ^ lowUuid4[cnt - 16];
		}
	}

	// sha256 token[256]
	var cryptSha256		= crypto.createHash('sha256');
	cryptSha256.update(token);
	result.str_token	= cryptSha256.digest('hex');

	// sha256 binary token[256]
	result.token		= rawCvtNumberStringToBinBuffer(result.str_token, 16, 32);

	return result;
}

//
// Return result
// {
//		str_hi_id:	hi uuid string
//		hi_id:		Buffer[16] for hi uuid
//		str_low_id:	low uuid string
//		low_id:		Buffer[16] for low uuid
//		str_base:	base string
//		base:		Buffer[32] for base
//		str_token:	hex[32] string for token
//		token:		Buffer[32] for token
// }
//
function rawMakeStringToken256(strHiUuid4, strLowUuid4, strBase)
{
	var	hiUuid4		= rawCvtStrToBinUuid4(strHiUuid4);
	var	lowUuid4	= rawCvtStrToBinUuid4(strLowUuid4);

	var	base;
	if(rawIsSafeString(strBase)){
		// string base is specified, then convert to buffer[32]
		base = rawCvtNumberStringToBinBuffer(strBase, 16, 32);
	}else{
		// base is not specified, then it is made at here.
		base = crypto.randomBytes(32);						// base data is random value in buffer[32]
	}

	var	result		= rawMakeToken256(hiUuid4, lowUuid4, base);
	if(null == result){
		return null;
	}
	result.str_hi_id	= strHiUuid4;
	result.str_low_id	= strLowUuid4;
	result.str_base		= base.toString('hex');

	return result;
}

//
// Converts a decimal or hexadecimal character string into a Buffer array(hexadecimal)
// with a specified number of bytes.
//
//	strNumber:	string for decimal or hexadecimal number
//	base:		radix(10 or 16)
//	size:		output Buffer array size
//
//	result:		Buffer array
//
function rawCvtNumberStringToBinBuffer(strNumber, base, size)
{
	if(!rawIsSafeString(strNumber)){
		return null;
	}
	if(16 != base && 10 != base){
		return null;
	}
	if(10 == base){
		// convert dec string to hex string
		var	tmpNumber	= parseInt(strNumber, 10);
		strNumber		= tmpNumber.toString(16);
	}

	var	uintarr	= new Uint8Array(strNumber.match(/.{1,2}/g).map(function(val){ return parseInt(val, 16); }));
	var	binbuff	= new Buffer(size);
	binbuff.fill(0);

	var diff_length;
	var	cnt;
	if(size < uintarr.length){
		// If input number array length is larger than required length, fill bottom.
		diff_length	= uintarr.length - size;
		for(cnt = uintarr.length; diff_length < cnt; --cnt){
			binbuff[cnt - 1 - diff_length] = uintarr[cnt - 1];
		}
	}else{
		// If required length is larger than input length, fill zero to top.
		diff_length	= size - uintarr.length;
		for(cnt = size; 0 < cnt; --cnt){
			if((cnt -1) < diff_length){
				break;
			}
			binbuff[cnt - 1] = uintarr[cnt - 1 - diff_length];
		}
	}
	return binbuff;
}

function rawCvtNumberStringToUuid4(strNumber, base)
{
	var	bin_uuid4 = rawCvtNumberStringToBinBuffer(strNumber, base, 16);		// UUID4 is 16bytes
	if(null == bin_uuid4){
		return null;
	}
	return rawGetStrUuid4(bin_uuid4);
}

//---------------------------------------------------------
// Utilities for Host/IP address
//---------------------------------------------------------
//
// Get client ip address
//
// [NOTE]
// If the server is behind of proxy, you have to set "trust proxy" to express app.
// Then we get client ip address in X-Forwarded-for header from req.ip.
//
// If you do not use "trust proxy", you can get client ip by following:
//
//	ip =	(rawIsSafeEntity(req.headers) && rawIsSafeEntity(req.headers['x-forwarded-for']))													? req.headers['x-forwarded-for'].split(',')[0] :
//			(rawIsSafeEntity(req.connection) && rawIsSafeString(req.connection.remoteAddress))													? req.connection.remoteAddress :
//			(rawIsSafeEntity(req.connection) && rawIsSafeEntity(req.connection.socket) && rawIsSafeString(req.connection.socket.remoteAddress))	? req.connection.socket.remoteAddress :
//			(rawIsSafeEntity(req.socket) && rawIsSafeString(req.socket.remoteAddress))															? req.socket.remoteAddress :
//			'0.0.0.0';
//	ip		= ip.split(':').slice(-1);			//in case the ip returned in a format: "::ffff:xxx.xxx.xxx.xxx"
//
function rawGetClientIpAddress(req)
{
	// If "trust proxy" is set, set client ip address to req.ip.
	var	ip = (rawIsSafeEntity(req) && rawIsSafeString(req.ip)) ? req.ip : null;

	if(!rawIsSafeString(ip)){
		ip = null;
	}else{
		// check format "::ffff:" for ipv4 on ipv6
		if('::ffff:' === ip.substr(0,7)) {
			ip = ip.substr(7);
		}
	}
	return ip;
}

function rawCompareRequestIpAddress(req, ip)
{
	var	req_ip = rawGetClientIpAddress(req);
	return (req_ip === ip);
}

//
// Get hostname from ip address
//
// ip		:	ip address
// callback	:	function(err message, result<string[]>)
//
function rawGetHostnameFromIpAddress(ip, callback)
{
	if(!rawIsSafeString(ip)){
		callback('ip address parameter is wrong', null);
		return;
	}
	var	_ip = ip;
	dns.reverse(_ip, function(err, hosts)
	{
		if(rawIsSafeEntity(err)){
			callback('ip address(' + _ip + ') is not convert hostname: ' + err.message, null);
			return;
		}
		if(rawIsEmptyArray(hosts)){
			callback('ip address(' + _ip + ') is not convert hostname', null);
			return;
		}
		callback(null, hosts);
	});
}

//
// Get ip address from hostname
//
// hostname	:	host name
// callback	:	function(err message, result<string[]>)
//
function rawGetIpAddressFromHostname(hostname, callback)
{
	if(!rawIsSafeString(hostname)){
		callback('hostname parameter is wrong', null);
		return;
	}
	// try ipv4
	var	_hostname4 = hostname;
	dns.resolve4(_hostname4, function(err, ip4)
	{
		if(rawIsSafeEntity(err) || rawIsEmptyArray(ip4)){
			// try ipv6
			var	_hostname6 = _hostname4;
			dns.resolve6(_hostname6, function(err, ip6)
			{
				if(rawIsSafeEntity(err) || rawIsEmptyArray(ip6)){
					callback('hostname(' + _hostname4 + ') is not convert ipv6 address' + ((rawIsSafeEntity(err) && rawIsSafeString(err.message)) ? err.message : ''), null);
					return;
				}
				callback(null, ip6);
			});
		}
		callback(null, ip4);
	});
}

//
// Complement ip address and hostname
//
// hostname	:	host name
// ip		:	ip address
// callback	:	function(err message, ip array[ip,...], hostname array[name,...])
//
function rawComplementHostnameIpAddress(hostname, ip, callback)
{
	if(!rawIsSafeString(hostname) && !rawIsSafeString(ip)){
		callback('hostname and ip parameter is wrong', null, null);
		return;
	}
	if(rawIsSafeString(hostname) && rawIsSafeString(ip)){
		var	ips		= [ip];
		var	hosts	= [hostname];
		callback('hostname and ip parameter is wrong', ips, hosts);
		return;
	}
	if(rawIsSafeString(hostname)){
		var	_hostname = [hostname];
		rawGetIpAddressFromHostname(ip, function(err, result)
		{
			if(rawIsSafeEntity(err)){
				callback(err, null, null);
				return;
			}
			callback(null, result, _hostname);
		});
	}else{	// rawIsSafeString(ip)
		var	_ips = [ip];
		rawGetHostnameFromIpAddress(ip, function(err, result)
		{
			if(rawIsSafeEntity(err)){
				callback(err, null, null);
				return;
			}
			callback(null, _ips, result);
		});
	}
}

//
// url parser with default port
//
function rawUrlParse(strurl)
{
	var	ep = url.parse(strurl);
	if(rawIsSafeEntity(ep) && (null === ep.port || !rawIsSafeEntity(ep.port) || isNaN(ep.port))){
		// set default port
		if(rawIsSafeString(ep.protocol) && 'https:' === ep.protocol){
			ep.port	= 443;
		}else{
			ep.port	= 80;
		}
	}
	return ep;
}

//
// Check hostname/ip address
//
// host		:	hostname or ip address string
//
const simple_reg_ipv4 = /^(([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
const simple_reg_ipv6 = /^(([0-9]|[a-f]|[A-F])*:)*([0-9]|[a-f]|[A-F])$/;

function rawIsIpAddressString(host)
{
	if(!rawIsSafeString(host)){
		return false;
	}
	if(host.match(simple_reg_ipv4) || host.match(simple_reg_ipv6)){
		return true;
	}
	return false;
}

//
// Check URL
//
// Allow formatted as "http(s)://<host{:port}>{/{<path>}...}"
//
// Result matches by regex
//	matches.length		7
//	matches[0]			input string(url)
//	matches[1]			method string(http or https)
//	matches[2]			FQDN string(domain name)
//	matches[3]			port number starting with ':'(':xxxx'). if url does not have port, this value is ''(empty string)
//	matches[4]			port number starting with ':'(':xxxx'). if url does not have port, this value is undefined
//	matches[5]			url path and arguments string(string after port number). if url end of character is port number, this value is ''(empty string)
//	matches[6]			url path and arguments string(string after port number). if url end of character is port number, this value is undefined
//
// Ex.)
//	Input url	:	'https://abc.co.jp:8080/path?arg=value'
//	matches		:	[	'https://abc.co.jp:8080/path?arg=value',
//						'https',
//						'abc.co.jp',
//						':8080',
//						':8080',
//						'/path?arg=value',
//						'/path?arg=value',
//						index: 0,
//						input: 'https://abc.co.jp:8080/path?arg=value'
//					]
//
//	Input url	:	'https://abc.co.jp/'
//	matches		:	[	'https://abc.co.jp/',
//						'https',
//						'abc.co.jp',
//						'',
//						undefined,
//						'',
//						undefined,
//						index: 0,
//						input: 'https://abc.co.jp/'
//					]
//
const reg_url = /^(https?):\/\/([a-z|A-Z|0-9|$|%|&|(|)|-|=|~|^|||@|+|.|_]+)((:[1-9]\d*)?)((\/.*)*)$/;

function rawIsSafeUrl(strurl)
{
	if(!rawIsSafeString(strurl)){
		return false;
	}
	if(null === strurl.match(reg_url)){
		return false;
	}
	return true;
}

function rawParseUrl(strurl)
{
	if(!rawIsSafeString(strurl)){
		return null;
	}
	var	matches = strurl.match(reg_url);
	if(null === matches || rawIsEmptyArray(matches) || matches < 7){
		return null;
	}

	var	resobj		= {};
	resobj.https	= rawCompareCaseString(matches[1], 'https');
	resobj.host		= matches[2];
	resobj.path		= matches[5];
	if(rawIsSafeString(matches[3]) && !isNaN(matches[3].substr(1))){
		resobj.port	= parseInt(matches[3].substr(1));
	}else{
		resobj.port	= resobj.https ? 443 : 80;
	}
	return resobj;
}

function rawCheckFileExist(file)
{
	if(!rawIsSafeString(file)){
		return false;
	}
	try{
		fs.statSync(file);
	}catch(err){
		return false;
	}
	return true;
}

function rawReadFileContents(file)
{
	var	contents = null;
	if(!rawCheckFileExist(file)){
		return contents;
	}
	try{
		contents = fs.readFileSync(file).toString();
	}catch(err){
		return contents;
	}
	return contents;
}

function rawCheckDir(path)
{
	if(!rawIsSafeString(path)){
		return false;
	}
	return fs.existsSync(path);
}

function rawCheckMakeDir(path)
{
	if(rawCheckDir(path)){
		return true;
	}
	if(!rawIsSafeString(path)){
		return false;
	}
	try{
		fs.mkdirSync(path);
	}catch(err){
		return false;
	}
	return true;
}

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
exports.isSafeEntity = function(data)
{
	return rawIsSafeEntity(data);
};

exports.isSafeString = function(str)
{
	return rawIsSafeString(str);
};

exports.isSafeStrings = function()
{
	for(var cnt = 0; cnt < arguments.length; ++cnt){
		if(!rawIsSafeString(arguments[cnt])){
			return false;
		}
	}
	return true;
};

exports.compareCaseString = function(str1, str2)
{
	return rawCompareCaseString(str1, str2);
};

exports.hasPartString = function(strbase, sep, values, iscase)
{
	return rawHasPartString(strbase, sep, values, iscase);
};

exports.getSafeString = function(str)
{
	return rawGetSafeString(str);
};

exports.checkSimpleJSON = function(str)
{
	return rawCheckSimpleJSON(str);
};

exports.parseJSON = function(str)
{
	return rawParseJSON(str);
};

exports.isArray = function(arr)
{
	return rawIsArray(arr);
};

exports.isEmptyArray = function(arr)
{
	return rawIsEmptyArray(arr);
};

exports.getSafeArray = function(arr)
{
	return rawGetSafeArray(arr);
};

exports.findStringInArray = function(arr, str)
{
	return rawFindStringInArray(arr, str);
};

exports.addStringToArray = function(arr, str)
{
	return rawAddStringToArray(arr, str);
};

exports.tryAddStringToArray = function(arr, str)
{
	return rawTryAddStringToArray(arr, str);
};

exports.removeStringFromArray = function(arr, str)
{
	return rawRemoveStringFromArray(arr, str);
};

exports.compareArray = function(arr1, arr2, strict)
{
	return rawCompareArray(arr1, arr2, strict);
};

exports.mergeArray = function(arr1, arr2)
{
	return rawMergeArray(arr1, arr2);
};

exports.getDeletingDifferenceArray = function(basearr, newarr)
{
	return rawGetDiffArray(basearr, newarr, true);
};

exports.getAddingDifferenceArray = function(basearr, newarr)
{
	return rawGetDiffArray(basearr, newarr, false);
};

exports.mergeObjects = function(obj1, obj2)
{
	return rawMergeObjects(obj1, obj2);
};

exports.getUnixtime = function(base)
{
	return convertUnixtime(base);
};

exports.calcExpire = function(expiredate)
{
	var	expire = convertUnixtime(expiredate) - convertUnixtime();
	if(expire < 0){
		expire = 0;
	}
	return expire;
};

exports.isExpired = function(base)
{
	return (convertUnixtime(base) < convertUnixtime());			// base(UTC ISO 8601) < now
};

exports.convertISOStringToUnixtime = function(iso)
{
	return rawConvertISOStringToUnixtime(iso);
};

exports.getExpireUnixtime = function(starttime, expiretime)
{
	return rawGetExpireUnixtime(starttime, expiretime);
};

exports.getExpireUnixtimeFromISOStrings = function(startiso, expireiso)
{
	return rawGetExpireUnixtimeFromISOStrings(startiso, expireiso);
};

exports.expandHierarchy = function(parent, children, separator)
{
	return rawExpandHierarchy(parent, children, separator);
};

exports.getParentKey = function(parent, childkey, separator, allow_empty)
{
	return rawGetParentKey(parent, childkey, separator, allow_empty);
};

exports.getParentPath = function(str, separator, allow_empty)
{
	return rawGetParentPath(str, separator, allow_empty);
};

exports.getNormalizeParameter = function(parameter, regex_ptn, pattern)
{
	return rawGetNormalizeParameter(parameter, regex_ptn, pattern);
};

exports.getBinUuid4 = function()
{
	return rawGetBinUuid4();
};

exports.getStrUuid4 = function(binUuid4)
{
	return rawGetStrUuid4(binUuid4);
};

exports.isSafeStrUuid4 = function(strUuid4)
{
	return rawIsSafeStrUuid4(strUuid4);
};

exports.cvtStrToBinUuid4 = function(strUuid4)
{
	return rawCvtStrToBinUuid4(strUuid4);
};

exports.makeToken256 = function(hiUuid4, lowUuid4, base)
{
	return rawMakeToken256(hiUuid4, lowUuid4, base);
};

exports.makeStringToken256 = function(strHiUuid4, strLowUuid4, strBase)
{
	return rawMakeStringToken256(strHiUuid4, strLowUuid4, strBase);
};

exports.cvtNumberStringToBinBuffer = function(strNumber, base, size)
{
	return rawCvtNumberStringToBinBuffer(strNumber, base, size);
};

exports.cvtNumberStringToUuid4 = function(strNumber, base)
{
	return rawCvtNumberStringToUuid4(strNumber, base);
};

exports.getClientIpAddress = function(req)
{
	return rawGetClientIpAddress(req);
};

exports.compareRequestIpAddress = function(req, ip)
{
	return rawCompareRequestIpAddress(req, ip);
};

exports.complementHostnameIpAddress = function(hostname, ip, callback)
{
	return rawComplementHostnameIpAddress(hostname, ip, callback);
};

exports.isIpAddressString = function(host)
{
	return rawIsIpAddressString(host);
};

exports.urlParse = function(strurl)
{
	return rawUrlParse(strurl);
};

exports.isSafeUrl = function(strurl)
{
	return rawIsSafeUrl(strurl);
};

exports.parseUrl = function(strurl)
{
	return rawParseUrl(strurl);
};

exports.checkFileExist = function(file)
{
	return rawCheckFileExist(file);
};

exports.readFileContents = function(file)
{
	return rawReadFileContents(file);
};

exports.checkDir = function(path)
{
	return rawCheckDir(path);
};

exports.checkMakeDir = function(path)
{
	return rawCheckMakeDir(path);
};

/*
 * VIM modelines
 *
 * vim:set ts=4 fenc=utf-8:
 */
