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

import	* as util	from 'util';
import	apiutil		from './k2hr3apiutil';

//---------------------------------------------------------
// NODE_DEBUG Environment Values
//---------------------------------------------------------
export enum LogLevel {
	Silent	= 0,
	Error	= 1,
	Warn	= 2,
	Info	= 3,
	Debug	= 4
}

export const dbgLevelMap: Readonly<Record<string, LogLevel>> = {
	'LOGLEVEL_DEBUG':	LogLevel.Debug,
	'LOGLEVEL_DBG':		LogLevel.Debug,
	'LOGLEVEL_INFO':	LogLevel.Info,
	'LOGLEVEL_MESSAGE':	LogLevel.Info,
	'LOGLEVEL_MSG':		LogLevel.Info,
	'LOGLEVEL_WARNING':	LogLevel.Warn,
	'LOGLEVEL_WARN':	LogLevel.Warn,
	'LOGLEVEL_WAN':		LogLevel.Warn,
	'LOGLEVEL_ERROR':	LogLevel.Error,
	'LOGLEVEL_ERR':		LogLevel.Error,
	'LOGLEVEL_SILENT':	LogLevel.Silent,
	'LOGLEVEL_SLT':		LogLevel.Silent
};

export const levelDbg: LogLevel		= 4;
export const levelInfo: LogLevel	= 3;
export const levelWarn: LogLevel	= 2;
export const levelErr: LogLevel		= 1;
export const levelSilent: LogLevel	= 0;

//---------------------------------------------------------
// Logging Level
//---------------------------------------------------------
let		currentLevel: LogLevel	= LogLevel.Error;
const	customLevels: string []	= [];

(() => {
	const dbgEnvs: string[] = apiutil.getSafeString(process.env.NODE_DEBUG).split(',');

	dbgEnvs.forEach((key: string) => {
		const upperKey = key.toUpperCase();
		if(upperKey in dbgLevelMap){
			if(levelSilent === dbgLevelMap[upperKey]){
				// default level is error. if specify silent, we must set silent.
				currentLevel = LogLevel.Silent;
			}else if(currentLevel < dbgLevelMap[upperKey]) {
				currentLevel = dbgLevelMap[upperKey];
			}
		}else if(!apiutil.findStringInArray(customLevels, upperKey)){
			customLevels.push(upperKey);
		}
	});
})();

const getCurrentInfo = (): string => {
	try{
		throw new Error('INTERNAL_EXCEPTION_FOR_DEBUG');
	}catch(exception: unknown){
		if(exception instanceof Error && apiutil.isString(exception.stack)){
			const basedir		= __dirname.replace(/lib$/g, '');
			const stackLines	= exception.stack.split(/[\r\n]+/).filter((val1) => /^ *at .*:[0-9]+:[0-9]+/.test(val1));
			if(2 < stackLines.length){
				const curstr = stackLines[2];
				return curstr.replace(/^ *at /g, '').replace(new RegExp(basedir, 'g'), '').replace(/.*\(/g, '').replace(/\)$/g, '').replace(/:[0-9]+$/g, '').replace(/:/g, '(') + ')';
			}
		}
		return '';
	}
};

const dlog = (...args: unknown[]): void => {
	if(levelDbg <= currentLevel){
		// [NOTE]
		// We want to use stack trace, thus using console.warn instead of console.debug method.
		//
		console.warn('[DEBUG] ' + getCurrentInfo(), util.format(...args));
	}
};

const mlog = (...args: unknown[]): void => {
	if(levelInfo <= currentLevel){
		// [NOTE]
		// We want to use stack trace, thus using console.warn instead of console.info method.
		//
		console.warn('[INFO] ' + getCurrentInfo(), util.format(...args));
	}
};

const wlog = (...args: unknown[]): void => {
	if(levelWarn <= currentLevel){
		console.warn('[WARN] ' + getCurrentInfo(), util.format(...args));
	}
};

const elog = (...args: unknown[]): void => {
	if(levelErr <= currentLevel){
		console.error('[ERROR] ' + getCurrentInfo(), util.format(...args));
	}
};

const clog = (section: string | null, ...args: unknown[]): void => {
	if(apiutil.isSafeString(section)){
		if(apiutil.findStringInArray(customLevels, section.toUpperCase())){
			// [NOTE]
			// We want to use stack trace, thus using console.warn instead of console.info method.
			//
			console.warn('[' + section.toUpperCase() + '] ' + getCurrentInfo(), util.format(...args));
		}
	}
};

const dump = (obj: unknown): unknown => {
	if(levelDbg <= currentLevel){
		if(apiutil.isPlainObject(obj)){
			return util.inspect(obj, {showHidden: true, depth: null, maxArrayLength: 1000});
		}
	}
	return obj;
};

//---------------------------------------------------------
// Exports
//---------------------------------------------------------
export type DBGLogging = {
	dlog:	(...args: unknown[]) => void;
	mlog:	(...args: unknown[]) => void;
	wlog:	(...args: unknown[]) => void;
	elog:	(...args: unknown[]) => void;
	clog:	(section: string | null, ...args: unknown[]) => void;
	dump:	(obj: unknown) => unknown;
};

export const dbglogging: DBGLogging = {
	dlog,
	mlog,
	wlog,
	elog,
	clog,
	dump,
};

export default dbglogging;

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 * vim600: noexpandtab sw=4 ts=4 fdm=marker
 * vim<600: noexpandtab sw=4 ts=4
 */
