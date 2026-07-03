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

import	* as dns		from 'dns';
import	* as fs			from 'fs';
import	* as crypto		from 'crypto';
import type	{ Request }	from 'express';
import type { valTypeTokenSeed, valTypeAllObject, valTypeAll, valTypeRoleInfo }	from './types';

//---------------------------------------------------------
// Types
//---------------------------------------------------------
//
// Callbacks
//
type cbTypeGetHostnameFromIpAddress = (err: string | null, hosts: string[] | null) => void;
type cbTypeGetIpAddressFromHostname = (err: string | null, ips: string[] | null) => void;
type cbTypeComplementHostnameIpAddress = (err: string | null, ips: string[] | null, hosts: string[] | null) => void;

//
// Variables
//
type resTypeGetNormalizeParameter = {
	result:		boolean;
	parameter?:	string[] | null | '';
};

type resTypeMakeToken256 = {
	hi_id:		Buffer;
	low_id:		Buffer;
	base:		Buffer;
	str_token:	string;
	token:		Buffer;
};

type resTypeMakeStringToken256 = {
	str_hi_id:	string;
	hi_id:		Buffer;
	str_low_id:	string;
	low_id:		Buffer;
	str_base:	string;
	base:		Buffer;
	str_token:	string;
	token:		Buffer;
};

type resTypeParseUrl = {
	https:	boolean;
	host:	string;
	path:	string;
	port:	number;
};

//---------------------------------------------------------
// Utilities for variables
//---------------------------------------------------------
const rawIsSafeEntity = <T,>(data?: T | null): data is T => {
	return (undefined !== data && null !== data);
};

const rawIsString = (str: unknown): str is string => {
	return (undefined !== str && null !== str && 'string' === typeof str);
};

const rawIsSafeString = (str: unknown): str is string => {
	return (undefined !== str && null !== str && 'string' === typeof str && 0 < str.length);
};

const rawIsPlainObject = (data: unknown): data is Record<string, unknown> => {
	return (undefined !== data && null !== data && 'object' === typeof data && !Array.isArray(data));
};

const rawIsValTypeAllObject = (val: unknown): val is valTypeAllObject => {
	if(!rawIsPlainObject(val)){
		return false;
	}
	for(const [, value] of Object.entries(val)){
		if(!rawIsValTypeAll(value)){
			return false;
		}
	}
	return true;
};

const rawIsValTypeAll = (val: unknown): val is valTypeAll => {
	if(null === val){
		return true;
	}else if(rawIsBoolean(val) || rawIsSafeNumber(val) || rawIsString(val)){
		return true;
	}else if(rawIsArray(val)){
		return val.every((element) => rawIsValTypeAll(element));
	}else if('object' === typeof val){
		return rawIsValTypeAllObject(val);
	}else{
		return false;
	}
};

const rawIsFunction = (val: unknown): val is (...args: unknown[]) => unknown => {
	return (undefined !== val && null !== val && 'function' === typeof val);
};

const rawIsBoolean = (val: unknown): val is boolean => {
	return (undefined !== val && null !== val && 'boolean' === typeof val);
};

const rawIsSafeNumber = (num: unknown): num is number => {
	return (undefined !== num && null !== num && 'number' === typeof num && Number.isFinite(num));	// except NaN and Infinity
};

const numericStringRegex = /^[+-]?(?:\d+|\d*\.\d+)(?:[eE][+-]?\d+)?$/;

const rawIsSafeNumeric = (strnum: unknown): strnum is string | number => {
	if(rawIsSafeNumber(strnum)){
		return true;
	}else if(rawIsSafeString(strnum)){
		const tmp = strnum.trim();
		if(0 === tmp.length || !numericStringRegex.test(tmp)){
			return false;
		}
		return Number.isFinite(Number(tmp));
	}
	return false;
};

const rawCvtToNumber = (num: unknown): number | null => {
	if(rawIsSafeNumber(num)){
		return num;
	}else if(rawIsSafeString(num) && rawIsSafeNumeric(num)){
		return Number(num.trim());
	}
	return null;
};

const rawCompareCaseString = (
	str1?:	string | null,
	str2?:	string | null
): boolean => {
	if(rawIsSafeString(str1) && rawIsSafeString(str2) && str1.toLowerCase() === str2.toLowerCase()){
		return true;
	}
	return false;
};

const rawIsArray = <T = unknown>(arr: unknown): arr is T[] => {
	return Array.isArray(arr);
};

const rawIsReadonlyArray = <T = unknown>(arr: unknown): arr is readonly T[] => {
	return Array.isArray(arr);
};

const rawIsStringArray = (arr: unknown): arr is string[] => {
	return (Array.isArray(arr) && arr.every((element) => rawIsString(element)));
};

const rawIsString2DArray = (arr: unknown): arr is string[][] => {
	return rawIsArray(arr) && arr.every((row) => rawIsArray(row) && row.every((it) => rawIsString(it)));
};

const rawHasPartString = (
	strbase?:	string | null,
	sep?:		string | null,
	values?:	string | string[],
	iscase?:	boolean
): boolean => {

	if(!rawIsSafeString(strbase) || !rawIsSafeString(sep)){
		return false;
	}

	let	valarray: string[] = [];
	if(rawIsSafeString(values)){
		valarray.push(values);
	}else if(rawIsArray(values)){
		valarray = values;
	}else{
		return false;
	}
	if(!rawIsBoolean(iscase)){
		iscase = true;
	}
	const	basearray = strbase.split(sep);
	for(let cnt1 = 0; cnt1 < basearray.length; ++cnt1){
		const	strtmp1 = basearray[cnt1].trim();
		if(!rawIsSafeString(strtmp1)){
			continue;
		}
		for(let cnt2 = 0; cnt2 < valarray.length; ++cnt2){
			const	strtmp2 = valarray[cnt2].trim();
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
};

const rawGetSafeString = (str: unknown): string => {

	if(rawIsSafeString(str)){
		return str;
	}
	return '';
};

const rawCheckSimpleJSON = (str: unknown): boolean => {

	if(!rawIsString(str)){
		return false;
	}
	try{
		JSON.parse(str);
		return true;
	}catch{
		return false;
	}
};

const rawParseJSON = (str: unknown): valTypeAll | null => {

	if(!rawIsString(str)){
		return null;
	}
	try{
		return JSON.parse(str);
	}catch{
		return null;
	}
};

const rawIsNotEmptyArray = <T,>(arr: unknown): arr is T[] => {
	return (Array.isArray(arr) && 0 !== (arr as unknown[]).length);
};

const rawGetSafeArray = <T,>(arr?: T[] | null): T[] => {
	return Array.isArray(arr) ? arr.slice() : [];
};

const rawGetSafeStringArray = (arr: unknown): string[] => {
	if(rawIsSafeString(arr)){
		return [arr];
	}else if(rawIsStringArray(arr)){
		return arr.slice();
	}
	return [];
};

const rawFindStringInArray = (
	arr?:	readonly string[] | null,
	str?:	string | null
): boolean => {

	if(!rawIsReadonlyArray(arr)){
		return false;
	}
	if(!rawIsSafeString(str)){
		return false;
	}
	return arr.includes(str);
};

const rawAddStringToArray = (
	arr?:	string[] | null,
	str?:	string
): string[] => {

	if(!rawIsSafeString(str)){
		return [];
	}
	if(!rawIsArray(arr)){
		return [str];
	}
	return arr.concat(str);
};

const rawTryAddStringToArray = (
	arr?:	string[] | null,
	str?:	string
): boolean => {

	if(!rawIsSafeString(str)){
		return false;
	}
	if(!rawIsArray(arr)){
		return false;
	}
	if(rawFindStringInArray(arr, str)){
		return false;
	}
	try{
		arr.push(str);
		return true;
	}catch{
		return false;
	}
};

const rawRemoveStringFromArray = (
	arr?:	string[] | null,
	str?:	string | null
): boolean => {

	if(!rawIsArray(arr) || !rawIsSafeString(str)){
		return false;
	}

	const idx = arr.indexOf(str);
	if(-1 === idx){
		return false;
	}
	try{
		arr.splice(idx, 1);
		return true;
	}catch{
		return false;
	}
};

const rawCompareArray = <T,>(
	arr1?:		T[] | null,
	arr2?:		T[] | null,
	strict?:	boolean | null
): boolean => {

	if(!rawIsArray(arr1) || !rawIsArray(arr2)){
		return false;
	}
	if(arr1.length !== arr2.length){
		return false;
	}

	if(rawIsBoolean(strict) && true === strict){
		return (JSON.stringify(arr1) === JSON.stringify(arr2));
	}else{
		const	keyCountMap = new Map<string, number>();
		for(const value1 of arr1) {
			const key = JSON.stringify(value1);
			keyCountMap.set(key, (keyCountMap.get(key) ?? 0) + 1);
		}
		for(const value2 of arr2) {
			const key	= JSON.stringify(value2);
			const count	= keyCountMap.get(key);
			if(!count){
				return false;
			}
			if(1 === count){
				keyCountMap.delete(key);
			}else{
				keyCountMap.set(key, count - 1);
			}
		}
		return (0 === keyCountMap.size);
	}
};

const rawMergeArray = (
	arr1?:	string[] | null,
	arr2?:	string[] | null
): string[] => {

	if(!rawIsArray(arr1) || !rawIsArray(arr2)){
		return [];
	}
	if(!rawIsArray(arr1)){
		return arr2!.slice();
	}
	if(!rawIsArray(arr2)){
		return arr1.slice();
	}

	const	result	= arr1.slice();
	const	seen	= new Set(result);
	for(const value of arr2){
		if(!seen.has(value)){
			seen.add(value);
			result.push(value);
		}
	}
	return result;
};

//
// Get difference from base to new array elements.
// If is_deleted_element is true, returns result difference elements for deleting from base.
// If is_deleted_element is false, returns result difference elements for adding from base.
//
const rawGetDiffArray = (
	basearr:			string[] | null,
	newarr:				string[] | null,
	is_deleted_element:	boolean
): string[] => {

	const barr: string[] = rawIsArray(basearr) ? basearr : [];
	const narr: string[] = rawIsArray(newarr)  ? newarr  : [];

	if(!rawIsNotEmptyArray(barr) && !rawIsNotEmptyArray(narr)){
		return [];
	}else if(!rawIsNotEmptyArray(barr) && rawIsNotEmptyArray(narr)){
		return is_deleted_element ? [] : narr.slice();
	}else if(rawIsNotEmptyArray(barr) && !rawIsNotEmptyArray(narr)){
		return is_deleted_element ? barr.slice() : [];
	}

	if(is_deleted_element){
		const seenNew			= new Set(narr);
		const result: string[]	= [];
		for(const value of barr){
			if(!seenNew.has(value)){
				result.push(value);
			}
		}
		return result;
	}else{
		const seenBase			= new Set(barr);
		const result: string[]	= [];
		for(const value of narr){
			if(!seenBase.has(value)){
				result.push(value);
			}
		}
		return result;
	}
};

const rawMergeObjects = (
	obj1?: Record<string, unknown> | null,
	obj2?: Record<string, unknown> | null
): Record<string, unknown> => {

	const localSafeKey = (key: string) => {
		return ('__proto__' !== key && 'constructor' !== key && 'prototype' !== key);
	};

	const _obj1 = rawIsPlainObject(obj1) ? obj1 : {};
	const _obj2 = rawIsPlainObject(obj2) ? obj2 : {};

	const resobj: Record<string, unknown> = {};

	for(const key of Object.keys(_obj1)){
		if(localSafeKey(key)){
			resobj[key] = _obj1[key];
		}
	}
	for(const key of Object.keys(_obj2)){
		if(localSafeKey(key)){
			resobj[key] = _obj2[key];
		}
	}
	return resobj;
};

const rawMergeValTypeAllObject = (
	obj1: valTypeAllObject | null | undefined,
	obj2: valTypeAllObject | null | undefined
): valTypeAllObject => {

	const localSafeKey = (key: string) => {
		return ('__proto__' !== key && 'constructor' !== key && 'prototype' !== key);
	};

	const _obj1 = rawIsValTypeAllObject(obj1) ? obj1 : {};
	const _obj2 = rawIsValTypeAllObject(obj2) ? obj2 : {};

	const resobj: valTypeAllObject = {};

	// copy entries from obj1
	for(const key of Object.keys(_obj1)){
		if(localSafeKey(key)){
			const	val	= _obj1[key];
			resobj[key]	= rawIsValTypeAll(val) ? val : null;
		}
	}

	// copy/overwrite entries from obj2
	for (const key of Object.keys(_obj2)) {
		if(localSafeKey(key)){
			const	val	= _obj2[key];
			resobj[key]	= rawIsValTypeAll(val) ? val : null;
		}
	}
	return resobj;
};

//---------------------------------------------------------
// Utilities for time
//---------------------------------------------------------
//
// base is UTC
//
const rawConvertUnixtime = (base?: string | null): number => {

	let	unixtime_ms: number;
	if(!rawIsSafeString(base)){
		unixtime_ms = Date.now();
	}else{
		const trimBase	= base!.trim();
		const tmp_ms	= new Date(trimBase).getTime();
		unixtime_ms		= Number.isFinite(tmp_ms) ? tmp_ms : Date.now();
	}
	return Math.floor(unixtime_ms / 1000);
};

const rawCalcExpire = (expiredate: string | null | undefined): number => {

	let	expire = rawConvertUnixtime(expiredate) - rawConvertUnixtime();
	if(expire < 0){
		expire = 0;
	}
	return expire;
};

const rawIsExpired = (base?: string | null): boolean => {
	return (rawConvertUnixtime(base) < rawConvertUnixtime());			// base(UTC ISO 8601) < now
};

const rawConvertISOStringToUnixtime = (iso: string): number => {

	if(!rawIsSafeString(iso)){
		return 0;
	}
	const isoBase	= iso!.trim();
	const tmp_ms	= new Date(isoBase).getTime();
	const iso_ms	= Number.isFinite(tmp_ms) ? tmp_ms : Date.now();

	return Math.floor(iso_ms / 1000);
};

const rawGetExpireUnixtime = (starttime: number, expiretime: number): number => {
	return (expiretime - starttime);
};

const rawGetExpireUnixtimeFromISOStrings = (startiso: string, expireiso: string): number => {

	const	starttime	= rawConvertISOStringToUnixtime(startiso);
	const	expiretime	= rawConvertISOStringToUnixtime(expireiso);
	return rawGetExpireUnixtime(starttime, expiretime);
};

//---------------------------------------------------------
// Utilities for Key and Hierarchy
//---------------------------------------------------------
//
// Convert string to Hierarchy Array by separator
// ex)	"parent-", "a/b/c"	=> ["parent-", "parent-a", "parent-a/b", "parent-a/b/c"]
//		null, "a/b/c"		=> ["a", "a/b", "a/b/c"]
//
const rawExpandHierarchyArray = (
	parent:			string | null | undefined,
	str:			string | null | undefined,
	separator:		string | null | undefined,
	allow_empty:	boolean | null | undefined
): string[] | null => {

	if(!rawIsSafeString(str)){
		return null;
	}
	const	sep = rawIsSafeString(separator) ? separator : '/';

	if(!rawIsSafeEntity(allow_empty)){
		allow_empty = false;
	}else if(!rawIsBoolean(allow_empty)){
		return null;
	}

	const	result: string[]	= [];
	let		tmp: string			= '';
	if(rawIsSafeString(parent)){
		result.push(parent);
		tmp = parent;
	}

	const	parts = str.split(sep);
	for(let cnt = 0; cnt < parts.length; ++cnt){
		if(0 !== cnt){
			tmp += sep;
		}
		const tmpstr = rawGetSafeString(parts[cnt]);
		tmp			+= tmpstr;
		if(allow_empty || '' !== tmp){
			result.push(tmp);
		}
	}
	return result;
};

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
const rawExpandHierarchy = (
	parent:			string | null | undefined,
	children:		string | string[] | null | undefined,
	separator:		string | null | undefined,
	allow_empty:	boolean | null | undefined
): Record<string, string[]> | null => {

	if(!rawIsSafeString(parent)){
		parent = '';
	}

	let	tmpchildren: string[];
	if(Array.isArray(children)){
		tmpchildren = children.slice();
	}else if(rawIsSafeString(children)){
		tmpchildren = [children];
	}else{
		return null;
	}

	let	is_set									= false;
	const	result: Record<string, string[]>	= {};
	let	parent_in_array: string;
	for(let cnt = 0; cnt < tmpchildren.length; ++cnt){
		// parent + tmpchildren[x] ---> ["parent", "parent child1", "parent child1 sep child2", ...]
		const	child_hierarchy_arr = rawExpandHierarchyArray(parent, tmpchildren[cnt], separator, allow_empty);
		if(null === child_hierarchy_arr || !Array.isArray(child_hierarchy_arr) || 0 === child_hierarchy_arr.length){
			continue;
		}
		parent_in_array = '';
		for(let cnt2 = 0; cnt2 < child_hierarchy_arr.length; ++cnt2){
			if('' !== parent_in_array){
				// parent ---> [child, child, ...]
				if(!rawFindStringInArray(result[parent_in_array], child_hierarchy_arr[cnt2])){
					result[parent_in_array].push(child_hierarchy_arr[cnt2]);
					is_set = true;
				}
			}
			parent_in_array = child_hierarchy_arr[cnt2];
			if(!rawIsSafeEntity(result[parent_in_array]) || !Array.isArray(result[parent_in_array])){
				result[parent_in_array] = new Array(0);
			}
		}
	}
	return (is_set ? result : null);
};

//
// Get direct parent path for key
// ex)	parent: "parent",	childkey: ":a/b/c"	=> parent:a/b
//		parent: null,		childkey: ":a/b/c"	=> :a/b
//		parent: "parent",	childkey: ":a"		=> parent
//		parent: "parent",	childkey: ""		=> null
//
const rawGetParentKey = (
	parent:			string | null,
	childkey:		string | null | undefined,
	separator:		string | null | undefined,
	allow_empty:	boolean | null | undefined
): string | null => {

	if(!rawIsSafeString(childkey)){
		return null;
	}
	const	child_hierarchy_arr = rawExpandHierarchyArray(parent, childkey, separator, allow_empty);
	if(null === child_hierarchy_arr || !Array.isArray(child_hierarchy_arr) || 0 === child_hierarchy_arr.length){
		return null;
	}
	if(1 === child_hierarchy_arr.length){
		// there is no parent, the array is only childkey(or parent)
		return null;
	}
	return child_hierarchy_arr[child_hierarchy_arr.length - 2];
};

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
const rawGetParentPath = (
	str:			string | null | undefined,
	separator?:		string | null,
	allow_empty?:	boolean | null
): string => {

	if(!rawIsSafeString(str)){
		return '';
	}
	if(!rawIsSafeEntity(allow_empty)){
		allow_empty = false;
	}else if(!rawIsBoolean(allow_empty)){
		return '';
	}
	if(!rawIsSafeString(separator)){
		separator = '/';
	}

	// escape if allow empty
	if(allow_empty){
		// escape '\' --> '\\'
		str = str.replace(/\\/g, '\\\\');
		// last word is '/' --> add '\'
		if('/' === str[str.length - 1]){
			str += '\\';
		}
		// if '//' --> '/\/'
		let tmp = '';
		for(let cnt = 0; cnt < str.length; ++cnt){
			tmp += str[cnt];
			if('/' === str[cnt] && (cnt + 1) < str.length && '/' === str[cnt + 1]){
				tmp += '\\';
			}
		}
		str = tmp;
	}

	// parse by separator
	const parts = str.split(separator);

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
	let	parent = parts.join(separator);

	// unescape if allow empty
	if(allow_empty && rawIsSafeString(parent)){
		// '\' --> '' or '\\' --> '\'
		let tmp = '';
		for(let cnt = 0; cnt < parent.length; ++cnt){
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
};

//
// Compare string by regex or string patterns(array)
//
const rawCompareStringByFormats = (
	str:			string | null | undefined,
	regex_ptn:		RegExp | string | null,
	pattern_array:	string | string[] | null
): string | null => {

	if(!rawIsSafeString(str)){
		return null;
	}
	const tmpstr = str.toLowerCase();

	if(regex_ptn && rawIsSafeEntity(regex_ptn)){
		const matches = tmpstr.match(regex_ptn);
		if(null !== matches && rawIsNotEmptyArray(matches) && 2 <= matches.length){
			return tmpstr;
		}
	}

	let	local_ptnarr: string[] = [];
	if(rawIsSafeString(pattern_array)){
		local_ptnarr = [pattern_array];
	}else if(rawIsArray(pattern_array)){
		local_ptnarr = pattern_array;
	}

	for(let cnt = 0; cnt < local_ptnarr.length; ++cnt){
		if(rawCompareCaseString(tmpstr, local_ptnarr[cnt])){
			return tmpstr;
		}
	}
	return null;
};

//---------------------------------------------------------
// Utilities for regex
//---------------------------------------------------------
//
// return object = {
//						result:		true/false
//						parameter:	object(array) or null or '' or undefined
//					}
//
const rawGetNormalizeParameter = (
	parameter:	unknown,
	regex_ptn:	RegExp | string | null,
	pattern:	string | string[] | null
): resTypeGetNormalizeParameter => {

	const resobj: resTypeGetNormalizeParameter = { result: false, parameter: undefined };

	if(rawIsSafeString(parameter) && rawCheckSimpleJSON(parameter)){
		parameter = JSON.parse(parameter);
	}

	if(!rawIsSafeEntity(parameter)){
		resobj.result 	= true;
		resobj.parameter= null;								// = not update type

	}else if(rawIsArray<string>(parameter)){
		if(!rawIsNotEmptyArray(parameter)){
			resobj.result 	= true;
			resobj.parameter= '';							// = clean up type
		}else{
			resobj.result		= true;
			resobj.parameter	= [] as string[];
			for(let cnt = 0; cnt < parameter.length; ++cnt){
				const resstr = rawCompareStringByFormats(parameter[cnt], regex_ptn, pattern);
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
		const	tmparr = parameter.split(',');
		if(rawIsArray(tmparr) && rawIsNotEmptyArray(tmparr)){
			resobj.result 	= true;
			resobj.parameter= [] as string[];
			for(let cnt = 0; cnt < tmparr.length; ++cnt){
				const resstr = rawCompareStringByFormats(tmparr[cnt], regex_ptn, pattern);
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
		resobj.result = false;
	}
	return resobj;
};

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
const rawGetBinUuid4 = (): Buffer => {

	const binUuid4= crypto.randomBytes(16);
	binUuid4[6]	= (binUuid4[6] & 0x0f) | 0x40;	// UUID4 must be 0x4X for pos 6 in buffer
	binUuid4[8]	= (binUuid4[8] & 0x3f) | 0x80;	// UUID4 must be 0x{8,9,A,B}X for pos 8 in buffer

	return binUuid4;
};

// [NOTE]
// If binary data is given, this is only a conversion to UUID format,
// not a method that enforces UUID4 format.
//
const rawGetStrUuid4 = (binUuid4?: Buffer | null): string => {

	const buf = Buffer.isBuffer(binUuid4) ? binUuid4 : rawGetBinUuid4();
	if(!Buffer.isBuffer(buf) || buf.length < 16){
		return '';
	 }

	const hex = buf.toString('hex');	// 16 bytes to over 32 characters
	if(hex.length < 32){
		return '';
	}
	return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join('-');
};

const rawIsSafeStrUuid4 = (strUuid4: string | null | undefined): boolean => {

	if(!rawIsSafeString(strUuid4)){
		return false;
	}

	// split '-' separator and check each part
	const	strArray = strUuid4.split('-');
	if(	5 != strArray.length								||
		0 == strArray[0].length || 8 < strArray[0].length	||
		0 == strArray[1].length || 4 < strArray[1].length	||
		0 == strArray[2].length || 4 < strArray[2].length	||
		0 == strArray[3].length || 4 < strArray[3].length	||
		0 == strArray[4].length || 12 < strArray[4].length	)
	{
		return false;
	}
	return true;
};

const rawFillZeroString = (
	str:	string | null | undefined,
	size:	number
): string | null => {

	if(!rawIsSafeString(str)){
		return null;
	}
	if(!Number.isInteger(size) || size < str.length){
		return null;
	}
	return str.length < size ? str.padStart(size, '0') : str;
};

const rawCvtStrToBinUuid4 = (strUuid4: string | null | undefined): Buffer | null => {

	if(!rawIsSafeString(strUuid4)){
		return null;
	}

	// split '-' separator
	const	strArray = strUuid4.split('-');
	if(5 !== strArray.length){
		return null;
	}

	// check length and fill '0' for short part
	strArray[0] = rawFillZeroString(strArray[0], 8) ?? '';
	strArray[1] = rawFillZeroString(strArray[1], 4) ?? '';
	strArray[2] = rawFillZeroString(strArray[2], 4) ?? '';
	strArray[3] = rawFillZeroString(strArray[3], 4) ?? '';
	strArray[4] = rawFillZeroString(strArray[4], 12) ?? '';
	if('' === strArray[0] || '' === strArray[1] || '' === strArray[2] || '' === strArray[3] || '' === strArray[4]){
		return null;
	}

	// uuid full hex string
	const	fullString = strArray.join('');
	if(!/^[0-9a-fA-F]{32}$/.test(fullString)){
		return null;
	}

	// convert to binary array
	try{
		return Buffer.from(fullString, 'hex');
	}catch{
		return null;
	}
};

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
const rawCvtNumberStringToBinBuffer = (
	strNumber:	string | null | undefined,
	base:		number,
	size:		number
): Buffer | null => {

	if(!rawIsSafeString(strNumber)){
		return null;
	}
	if(16 != base && 10 != base){
		return null;
	}
	if(10 == base){
		// convert dec string to hex string
		const	tmpNumber	= parseInt(strNumber, 10);
		strNumber			= tmpNumber.toString(16);
	}

	const	matched = strNumber.match(/.{1,2}/g);
	const	uintarr	= new Uint8Array((matched ?? []).map((val: string) => parseInt(val, 16)));
	const	binbuff	= Buffer.alloc(size);
	binbuff.fill(0);

	if(size < uintarr.length){
		// If input number array length is larger than required length, fill bottom.
		const diff_length	= uintarr.length - size;
		for(let cnt = uintarr.length; diff_length < cnt; --cnt){
			binbuff[cnt - 1 - diff_length] = uintarr[cnt - 1];
		}
	}else{
		// If required length is larger than input length, fill zero to top.
		const diff_length	= size - uintarr.length;
		for(let cnt = size; 0 < cnt; --cnt){
			if((cnt -1) < diff_length){
				break;
			}
			binbuff[cnt - 1] = uintarr[cnt - 1 - diff_length];
		}
	}
	return binbuff;
};

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
const rawMakeToken256 = (
	hiUuid4:	Buffer | null | undefined,
	lowUuid4:	Buffer | null | undefined,
	base:		Buffer | null | undefined
): resTypeMakeToken256 | null => {

	// hiUuid4[128] / lowUuid4[128]
	if(	!rawIsSafeEntity(hiUuid4)  || !(Buffer.isBuffer(hiUuid4))  || 16 != hiUuid4.length  ||
		!rawIsSafeEntity(lowUuid4) || !(Buffer.isBuffer(lowUuid4)) || 16 != lowUuid4.length ||
		!rawIsSafeEntity(base)     || !(Buffer.isBuffer(base))     || 32 != base.length     )
	{
		return null;
	}
	const	result: resTypeMakeToken256 = {
		hi_id:		hiUuid4,
		low_id:		lowUuid4,
		base:		base,
		str_token:	'',
		token:		Buffer.alloc(0)
	};

	// raw not crypted token[256]
	const	token = Buffer.alloc(32);
	for(let cnt = 0; cnt < 32; ++cnt){
		if(cnt < 16){
			token[cnt] = result.base[cnt] ^ hiUuid4[cnt];
		}else{
			token[cnt] = result.base[cnt] ^ lowUuid4[cnt - 16];
		}
	}

	// sha256 token[256]
	const cryptSha256	= crypto.createHash('sha256');
	cryptSha256.update(token);
	result.str_token	= cryptSha256.digest('hex');

	// sha256 binary token[256]
	result.token		= rawCvtNumberStringToBinBuffer(result.str_token, 16, 32) ?? Buffer.alloc(0);

	return result;
};

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
const rawMakeStringToken256 = (
	strHiUuid4:		unknown,
	strLowUuid4:	unknown,
	strBase?:		string | number | null
): resTypeMakeStringToken256 | null => {

	if(!rawIsSafeString(strHiUuid4) || !rawIsSafeString(strLowUuid4)){
		return null;
	}

	const	hiUuid4		= rawCvtStrToBinUuid4(strHiUuid4);
	const	lowUuid4	= rawCvtStrToBinUuid4(strLowUuid4);
	if(null === hiUuid4 || null === lowUuid4){
		return null;
	}

	let		base: Buffer | null;
	if(rawIsString(strBase)){
		// string base is specified as string, then convert to buffer[32]
		base = rawCvtNumberStringToBinBuffer(strBase, 16, 32);
	}else if(rawIsSafeNumber(strBase)){
		// string base is specified as number, then convert to buffer[32]
		base = rawCvtNumberStringToBinBuffer(String(strBase), 16, 32);
	}else{													// null === strBase
		// base is not specified, then it is made at here.
		base = crypto.randomBytes(32);						// base data is random value in buffer[32]
	}
	if(null === base){
		return null;
	}

	const	binResult: resTypeMakeToken256 | null = rawMakeToken256(hiUuid4, lowUuid4, base);
	if(null === binResult){
		return null;
	}
	const	result: resTypeMakeStringToken256 = {
		str_hi_id:	strHiUuid4,
		hi_id:		binResult.hi_id,
		str_low_id:	strLowUuid4,
		low_id:		binResult.low_id,
		str_base:	base.toString('hex'),
		base:		binResult.base,
		str_token:	binResult.str_token,
		token:		binResult.token,
	};
	return result;
};

const rawCvtNumberStringToUuid4 = (
	strNumber:	string | null | undefined,
	base:		number
): string | null => {

	const	bin_uuid4 = rawCvtNumberStringToBinBuffer(strNumber, base, 16);		// UUID4 is 16bytes
	if(null == bin_uuid4){
		return null;
	}
	return rawGetStrUuid4(bin_uuid4);
};

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
const rawGetClientIpAddress = (req: Request): string | null => {

	// If "trust proxy" is set, set client ip address to req.ip.
	let	ip: string | null = (rawIsSafeEntity(req) && rawIsSafeString(req.ip)) ? (req.ip ?? null) : null;

	if(!rawIsSafeString(ip)){
		ip = null;
	}else{
		// check format "::ffff:" for ipv4 on ipv6
		if('::ffff:' === ip.substr(0,7)) {
			ip = ip.substr(7);
		}
	}
	return ip;
};

const rawCompareRequestIpAddress = (
	req:	Request,
	ip:		string
): boolean => {

	const	req_ip = rawGetClientIpAddress(req);
	if(null === req_ip){
		return false;
	}
	return (req_ip === ip);
};

//
// Get hostname from ip address
//
// ip		:	ip address
// callback	:	function(err message, result<string[]>)
//
const rawGetHostnameFromIpAddress = (
	ip:			string | null | undefined,
	callback:	cbTypeGetHostnameFromIpAddress
): void => {

	if(!rawIsSafeString(ip)){
		callback('ip address parameter is wrong', null);
		return;
	}
	dns.reverse(ip, (err: NodeJS.ErrnoException | null, hosts: string[]): void => {
		if(rawIsSafeEntity(err)){
			callback('ip address(' + ip + ') is not convert hostname: ' + (err as NodeJS.ErrnoException).message, null);
			return;
		}
		if(!rawIsNotEmptyArray(hosts)){
			callback('ip address(' + ip + ') is not convert hostname', null);
			return;
		}
		callback(null, hosts);
	});
};

//
// Get ip address from hostname
//
// hostname	:	host name
// callback	:	function(err message, result<string[]>)
//
const rawGetIpAddressFromHostname = (
	hostname:	string | null | undefined,
	callback:	cbTypeGetIpAddressFromHostname
): void => {

	if(!rawIsSafeString(hostname)){
		callback('hostname parameter is wrong', null);
		return;
	}
	// try ipv4
	const	_hostname4 = hostname;
	dns.resolve4(_hostname4, (err: NodeJS.ErrnoException | null, ip4: string[]): void => {
		if(rawIsSafeEntity(err) || !rawIsNotEmptyArray(ip4)){
			// try ipv6
			const	_hostname6 = _hostname4;
			dns.resolve6(_hostname6, (err: NodeJS.ErrnoException | null, ip6: string[]): void => {
				if(rawIsSafeEntity(err) || !rawIsNotEmptyArray(ip6)){
					let strErrMsg = 'hostname(' + _hostname6 + ') is not convert ipv6 address : ';
					if(rawIsSafeEntity(err) && rawIsSafeString((err as NodeJS.ErrnoException).message)){
						strErrMsg += err.message;
					}
					callback(strErrMsg, null);
					return;
				}
				callback(null, ip6);
			});
		}
		callback(null, ip4);
	});
};

//
// Complement ip address and hostname
//
// hostname	:	host name
// ip		:	ip address
// callback	:	function(err message, ip array[ip,...], hostname array[name,...])
//
const rawComplementHostnameIpAddress = (
	hostname:	string | null | undefined,
	ip:			string | null | undefined,
	callback:	cbTypeComplementHostnameIpAddress
): void => {

	if(!rawIsSafeString(hostname) && !rawIsSafeString(ip)){
		callback('hostname and ip parameter is wrong', null, null);
		return;
	}
	if(rawIsSafeString(hostname) && rawIsSafeString(ip)){
		const	ips		= [ip];
		const	hosts	= [hostname];
		callback('hostname and ip parameter is wrong', ips, hosts);
		return;
	}

	if(rawIsSafeString(hostname)){
		const	_hostname = [hostname];
		rawGetIpAddressFromHostname(ip, (err: string | null, result: string[] | null): void => {
			if(rawIsSafeEntity(err)){
				callback(err, null, null);
				return;
			}
			callback(null, result, _hostname);
		});
	}else if(rawIsSafeString(ip)){
		const	_ips = [ip];
		rawGetHostnameFromIpAddress(ip, (err: string | null, result: string[] | null): void => {
			if(rawIsSafeEntity(err)){
				callback(err, null, null);
				return;
			}
			callback(null, _ips, result);
		});
	}
};

//
// url parser with default port
//
const rawUrlParse = (strurl: string): URL =>
{
	const	ep = new URL(strurl, 'http://localhost');
	if(rawIsSafeEntity(ep) && (null === ep.port || '' === ep.port || !rawIsSafeEntity(ep.port) || isNaN(Number(ep.port)))) {
		// set default port
		if(rawIsSafeString(ep.protocol) && 'https:' === ep.protocol){
			ep.port	= String(443);
		}else{
			ep.port	= String(80);
		}
	}
	return ep;
};

//
// Check hostname/ip address
//
// host		:	hostname or ip address string
//
const simple_reg_ipv4 = /^(([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([1-9]?[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
const simple_reg_ipv6 = /^(([0-9]|[a-f]|[A-F])*:)*([0-9]|[a-f]|[A-F])$/;

const rawIsIpAddressString = (host: unknown): boolean => {

	if(!rawIsSafeString(host)){
		return false;
	}
	if(host.match(simple_reg_ipv4) || host.match(simple_reg_ipv6)){
		return true;
	}
	return false;
};

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

const rawIsSafeUrl = (strurl: string | null | undefined): boolean => {

	if(!rawIsSafeString(strurl)){
		return false;
	}
	if(null === strurl.match(reg_url)){
		return false;
	}
	return true;
};

const rawParseUrl = (strurl: string | null | undefined): resTypeParseUrl | null => {

	if(!rawIsSafeString(strurl)){
		return null;
	}
	const	matches = strurl.match(reg_url);
	if(null === matches || !rawIsNotEmptyArray(matches) || matches.length < 7){
		return null;
	}

	const	resobj: resTypeParseUrl = { https: false, host: '', path: '', port: 0 };
	resobj.https	= rawCompareCaseString(matches[1], 'https');
	resobj.host		= matches[2];
	resobj.path		= matches[5];

	if(rawIsSafeString(matches[3]) && !isNaN(Number(matches[3].substr(1)))){
		resobj.port	= parseInt(matches[3].substr(1));
	}else{
		resobj.port	= resobj.https ? 443 : 80;
	}
	return resobj;
};

const rawCheckFileExist = (file: string | null | undefined): boolean => {

	if(!rawIsSafeString(file)){
		return false;
	}
	try{
		fs.statSync(file);
	}catch{
		return false;
	}
	return true;
};

const rawReadFileContents = (file: string | null | undefined): string | null => {

	if(!rawIsSafeString(file)){
		return null;
	}
	if(!rawCheckFileExist(file)){
		return null;
	}
	try{
		return fs.readFileSync(file).toString();
	}catch{
		return null;
	}
};

const rawCheckDir = (path: string | null | undefined): boolean => {

	if(!rawIsSafeString(path)){
		return false;
	}
	return fs.existsSync(path);
};

const rawCheckMakeDir = (path: string | null | undefined): boolean => {

	if(!rawIsSafeString(path)){
		return false;
	}
	if(rawCheckDir(path)){
		return true;
	}
	try{
		fs.mkdirSync(path);
	}catch{
		return false;
	}
	return true;
};

//---------------------------------------------------------
// Utilities for dnamic import
//---------------------------------------------------------
const rawTryLoadModule = async <T = unknown>(filepath: string): Promise<T | null> => {

	const candidates		= filepath.endsWith('.js') ? [filepath] : [filepath, (filepath + '.js')];
	const errors: string[]	= [];
	for(const cand of candidates){
		try{
			const modRaw = (await import(cand)) as unknown;
			if(rawIsPlainObject(modRaw)){
				const defaultExport	= modRaw.default || modRaw;
				if(rawIsPlainObject(defaultExport)){
					const keys			= Object.keys(defaultExport);
				    if(0 < keys.length){
						const firstKey = keys[0];
						return defaultExport[firstKey] as T;
					}else{
						return defaultExport as T;
					}
				}else{
					return defaultExport as T;
				}
			}else{
				return modRaw as T;
			}
		}catch(error: unknown){
			errors.push(cand + ' -> ' + JSON.stringify(error));
		}
	}
	console.debug('import failed : ', JSON.stringify(errors));
	return null;
};

//---------------------------------------------------------
// Utilities for variables defined in type.ts
//---------------------------------------------------------
const rawIsValTypeTokenSeed = (val: unknown): val is valTypeTokenSeed => {

	if(!rawIsPlainObject(val)){
		return false;
	}
	const _obj				= val as Record<string, unknown>;
	const _isString			= (key: string) => rawIsString(_obj[key]);
	const _isStringOrNull	= (key: string) => null === _obj[key] || rawIsString(_obj[key]);
	const _isFiniteNumber	= (key: string) => rawIsSafeNumber(_obj[key]);

	return (
		_isString('publisher')		&&
		_isString('userexid')		&&
		_isString('date')			&&
		_isString('expire')			&&
		_isString('creator')		&&
		_isString('base')			&&
		_isStringOrNull('user')		&&
		_isStringOrNull('ip')		&&
		_isStringOrNull('hostname')	&&
		_isFiniteNumber('port')		&&
		_isStringOrNull('cuk')		&&
		_isStringOrNull('extra')	&&
		_isStringOrNull('tenant')
	);
};

const rawIsValTypeRoleInfo = (val: unknown): val is valTypeRoleInfo => {

	if(!rawIsPlainObject(val)){
		return false;
	}
	if(	(undefined !== val.role && !rawIsString(val.role))	||
		(undefined !== val.token && !rawIsString(val.token)))
	{
		return false;
	}
	for(const [, value] of Object.entries(val)){
		if(!rawIsValTypeAll(value)){
			return false;
		}
	}
	return true;
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export const k2hr3ppiutil = {
	isSafeEntity:						rawIsSafeEntity,
	isString:							rawIsString,
	isSafeString:						rawIsSafeString,
	isPlainObject:						rawIsPlainObject,
	isValTypeAllObject:					rawIsValTypeAllObject,
	isValTypeAll:						rawIsValTypeAll,
	isFunction:							rawIsFunction,
	isBoolean:							rawIsBoolean,
	isSafeNumber:						rawIsSafeNumber,
	isSafeNumeric:						rawIsSafeNumeric,
	cvtToNumber:						rawCvtToNumber,
	compareCaseString:					rawCompareCaseString,
	isArray:							rawIsArray,
	isStringArray:						rawIsStringArray,
	isString2DArray:					rawIsString2DArray,
	hasPartString:						rawHasPartString,
	getSafeString:						rawGetSafeString,
	checkSimpleJSON:					rawCheckSimpleJSON,
	parseJSON:							rawParseJSON,
	isNotEmptyArray:					rawIsNotEmptyArray,
	getSafeArray:						rawGetSafeArray,
	getSafeStringArray:					rawGetSafeStringArray,
	findStringInArray:					rawFindStringInArray,
	addStringToArray:					rawAddStringToArray,
	tryAddStringToArray:				rawTryAddStringToArray,
	removeStringFromArray:				rawRemoveStringFromArray,
	compareArray:						rawCompareArray,
	mergeArray:							rawMergeArray,
	getDeletingDifferenceArray:			(basearr: string[] | null, newarr: string[] | null): string[] => rawGetDiffArray(basearr, newarr, true),
	getAddingDifferenceArray:			(basearr: string[] | null, newarr: string[] | null): string[] =>  rawGetDiffArray(basearr, newarr, false),
	mergeObjects:						rawMergeObjects,
	mergeValTypeAllObject:				rawMergeValTypeAllObject,
	getUnixtime:						rawConvertUnixtime,
	calcExpire:							rawCalcExpire,
	isExpired:							rawIsExpired,
	convertISOStringToUnixtime:			rawConvertISOStringToUnixtime,
	getExpireUnixtime:					rawGetExpireUnixtime,
	getExpireUnixtimeFromISOStrings:	rawGetExpireUnixtimeFromISOStrings,
	expandHierarchy:					rawExpandHierarchy,
	getParentKey:						rawGetParentKey,
	getParentPath:						rawGetParentPath,
	getNormalizeParameter:				rawGetNormalizeParameter,
	getBinUuid4:						rawGetBinUuid4,
	getStrUuid4:						rawGetStrUuid4,
	isSafeStrUuid4:						rawIsSafeStrUuid4,
	cvtStrToBinUuid4:					rawCvtStrToBinUuid4,
	cvtNumberStringToBinBuffer:			rawCvtNumberStringToBinBuffer,
	makeToken256:						rawMakeToken256,
	makeStringToken256:					rawMakeStringToken256,
	cvtNumberStringToUuid4:				rawCvtNumberStringToUuid4,
	getClientIpAddress:					rawGetClientIpAddress,
	compareRequestIpAddress:			rawCompareRequestIpAddress,
	complementHostnameIpAddress:		rawComplementHostnameIpAddress,
	urlParse:							rawUrlParse,
	isIpAddressString:					rawIsIpAddressString,
	isSafeUrl:							rawIsSafeUrl,
	parseUrl:							rawParseUrl,
	checkFileExist:						rawCheckFileExist,
	readFileContents:					rawReadFileContents,
	checkDir:							rawCheckDir,
	checkMakeDir:						rawCheckMakeDir,
	tryLoadModule:						rawTryLoadModule,
	isValTypeTokenSeed:					rawIsValTypeTokenSeed,
	isValTypeRoleInfo:					rawIsValTypeRoleInfo
};

export default k2hr3ppiutil;

//---------------------------------------------------------
// Export types
//---------------------------------------------------------
//
// Callbacks
//
export { cbTypeComplementHostnameIpAddress };

//
// Variables
//
export { resTypeGetNormalizeParameter, resTypeMakeToken256, resTypeMakeStringToken256, resTypeParseUrl };

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
