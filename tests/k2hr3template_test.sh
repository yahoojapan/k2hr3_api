#!/bin/sh
#
# K2HR3 REST API
#
# Copyright 2017 Yahoo! Japan Corporation.
#
# K2HR3 is K2hdkc based Resource and Roles and policy Rules, gathers 
# common management information for the cloud.
# K2HR3 can dynamically manage information as "who", "what", "operate".
# These are stored as roles, resources, policies in K2hdkc, and the
# client system can dynamically read and modify these information.
#
# For the full copyright and license information, please view
# the license file that was distributed with this source code.
#
# AUTHOR:   Takeshi Nakatani
# CREATE:   Wed Jul 12 2017
# REVISION:
#

#
# Common
#
PROGRAM_NAME=`basename $0`
MYSCRIPTDIR=`dirname $0`
MYSCRIPTDIR=`cd ${MYSCRIPTDIR}; pwd`
SRCTOP=`cd ${MYSCRIPTDIR}/..; pwd`
HOST=`hostname`

#
# Usage
#
PrintUsage()
{
	echo "Usage: $1 [--inspect(-i)]"
	echo "                             [--debuglevel(-d) DBG/MSG/WARN/ERR/(custom debug level)]"
	echo "                             [--varlist(-v) \"variables JSON file path\"]"
	echo "                             {--templ(-t) \"template file path\" | --string(-s) \"template string\"}"
	echo "                             {--async(-a)}"
	echo ""
	echo "       If you do not specify input file path or template string,"
	echo "       $1 prompts you to enter a template string from stdin."
	echo ""
}

#
# Parse arguments
#
INPUT_TEMPLFILE=""
INPUT_TEMPLSTR=""
INPUT_VARFILE=""
INPUT_ASYNCMODE=0
DEBUG_OPTION=""
DEBUG_PIPE_LINE=""
DEBUG_ENV_CUSTOM=""
DEBUG_ENV_LEVEL=0

OPTCOUNT=$#
while [ ${OPTCOUNT} -ne 0 ]; do
	if [ "X$1" = "X" ]; then
		break

	elif [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		PrintUsage ${PROGRAM_NAME}
		exit 0

	elif [ "X$1" = "X--inspect" -o "X$1" = "X--INSPECT" -o "X$1" = "X-i" -o "X$1" = "X-I" ]; then
		DEBUG_OPTION="--inspect --debug-brk"
		DEBUG_PIPE_LINE="sed s/127.0.0.1/${HOST}/"

	elif [ "X$1" = "X--debuglevel" -o "X$1" = "X--DEBUGLEVEL" -o "X$1" = "X-d" -o "X$1" = "X-D" ]; then
		#
		# DEBUG option
		#
		OPTCOUNT=`expr ${OPTCOUNT} - 1`
		if [ ${OPTCOUNT} -eq 0 ]; then
			echo "ERROR: --debuglevel(-d) option needs parameter(dbg/msg/warn/err)"
			exit 1
		fi
		shift

		if [ "X$1" = "Xdbg" -o "X$1" = "XDBG" -o "X$1" = "Xdebug" -o "X$1" = "XDEBUG" ]; then
			if [ ${DEBUG_ENV_LEVEL} -lt 4 ]; then
				DEBUG_ENV_LEVEL=4
			fi

		elif [ "X$1" = "Xmsg" -o "X$1" = "XMSG" -o "X$1" = "Xmessage" -o "X$1" = "XMESSAGE" -o "X$1" = "Xinfo" -o "X$1" = "XINFO" ]; then
			if [ ${DEBUG_ENV_LEVEL} -lt 3 ]; then
				DEBUG_ENV_LEVEL=3
			fi

		elif [ "X$1" = "Xwarn" -o "X$1" = "XWARN" -o "X$1" = "Xwarning" -o "X$1" = "XWARNING" ]; then
			if [ ${DEBUG_ENV_LEVEL} -lt 2 ]; then
				DEBUG_ENV_LEVEL=2
			fi

		elif [ "X$1" = "Xerr" -o "X$1" = "XERR" -o "X$1" = "Xerror" -o "X$1" = "XERROR" ]; then
			if [ ${DEBUG_ENV_LEVEL} -lt 1 ]; then
				DEBUG_ENV_LEVEL=1
			fi

		else
			if [ "X${DEBUG_ENV_CUSTOM}" != "X" ]; then
				DEBUG_ENV_CUSTOM="${DEBUG_ENV_CUSTOM},"
			fi
			DEBUG_ENV_CUSTOM="${DEBUG_ENV_CUSTOM}$1"
		fi

	elif [ "X$1" = "X--varlist" -o "X$1" = "X--VARLIST" -o "X$1" = "X-v" -o "X$1" = "X-V" ]; then
		#
		# input variable list file path
		#
		OPTCOUNT=`expr ${OPTCOUNT} - 1`
		if [ ${OPTCOUNT} -eq 0 ]; then
			echo "ERROR: --varlist(-v) option needs parameter( input variable JSON file path )"
			exit 1
		fi
		shift

		if [ "X${INPUT_VARFILE}" != "X" ]; then
			echo "ERROR: specified variable list file \"$1\", but already specified variable list file \"${INPUT_VARFILE}\""
			exit 1
		fi
		if [ ! -f $1 ]; then
			echo "ERROR: could not find variable list file \"$1\""
			exit 1
		fi
		INPUT_VARFILE=$1

	elif [ "X$1" = "X--template" -o "X$1" = "X--TEMPLATE" -o "X$1" = "X--templ" -o "X$1" = "X--TEMPL" -o "X$1" = "X-t" -o "X$1" = "X-T" ]; then
		#
		# input template file path
		#
		OPTCOUNT=`expr ${OPTCOUNT} - 1`
		if [ ${OPTCOUNT} -eq 0 ]; then
			echo "ERROR: --templ(-t) option needs parameter( input template file path )"
			exit 1
		fi
		shift

		if [ "X${INPUT_TEMPLFILE}" != "X" ]; then
			echo "ERROR: specified template file \"$1\", but already specified template file \"${INPUT_TEMPLFILE}\""
			exit 1
		fi
		if [ "X${INPUT_TEMPLSTR}" != "X" ]; then
			echo "ERROR: specified template file \"$1\", but already specified template string \"${INPUT_TEMPLSTR}\""
			exit 1
		fi
		if [ ! -f $1 ]; then
			echo "ERROR: could not find template file \"$1\""
			exit 1
		fi
		INPUT_TEMPLFILE=$1

	elif [ "X$1" = "X--string" -o "X$1" = "X--STRING" -o "X$1" = "X--str" -o "X$1" = "X--STR" -o "X$1" = "X-s" -o "X$1" = "X-S" ]; then
		#
		# input template string
		#
		OPTCOUNT=`expr ${OPTCOUNT} - 1`
		if [ ${OPTCOUNT} -eq 0 ]; then
			echo "ERROR: --string(-s) option needs parameter( input template string )"
			exit 1
		fi
		shift

		if [ "X${INPUT_TEMPLFILE}" != "X" ]; then
			echo "ERROR: specified template string \"$1\", but already specified template file \"${INPUT_TEMPLFILE}\""
			exit 1
		fi
		if [ "X${INPUT_TEMPLSTR}" != "X" ]; then
			echo "ERROR: specified template string \"$1\", but already specified template string \"${INPUT_TEMPLSTR}\""
			exit 1
		fi
		INPUT_TEMPLSTR=$1

	elif [ "X$1" = "X--async" -o "X$1" = "X--ASYNC" -o "X$1" = "X-a" -o "X$1" = "X-A" ]; then
		#
		# async mode
		#
		if [ ${INPUT_ASYNCMODE} -ne 0 ]; then
			echo "ERROR: --async(-a) option is already specified"
			exit 1
		fi
		INPUT_ASYNCMODE=1

	else
		echo "ERROR: unknown option \"$1\""
		echo ""
		PrintUsage ${PROGRAM_NAME}
		exit 0
	fi

	OPTCOUNT=`expr ${OPTCOUNT} - 1`
	shift
done

#
# Make NODE_DEBUG environment
#
DEBUG_ENV_PARAM=""
if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_DBG"
elif [ ${DEBUG_ENV_LEVEL} -ge 3 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_MSG"
elif [ ${DEBUG_ENV_LEVEL} -ge 2 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_WAN"
elif [ ${DEBUG_ENV_LEVEL} -ge 1 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_ERR"
fi

#
# Template file
#
rm -f /tmp/${PROGRAM_NAME}.templ.*

if [ "X${INPUT_TEMPLFILE}" = "X" ]; then
	#
	# Temporary template file
	#
	INPUT_TEMPLFILE="/tmp/${PROGRAM_NAME}.templ.$$"
	echo -n "" > ${INPUT_TEMPLFILE}

	if [ "X${INPUT_TEMPLSTR}" != "X" ]; then
		#
		# Put input template string to temporary file
		#
		echo "${INPUT_TEMPLSTR}" >> ${INPUT_TEMPLFILE}

	else
		#
		# Get template string from stdin
		#
		echo "---------------------------------------------------------------"
		echo " Please input template string."
		echo " You can end template string input by entering \"EOF\"."
		echo "---------------------------------------------------------------"

		while true; do
			echo -n "> "
			read TEMPLLINE

			if [ "X${TEMPLLINE}" = "XEOF" -o "X${TEMPLLINE}" = "Xeof" ]; then
				break;
			fi
			echo "${TEMPLLINE}" >> ${INPUT_TEMPLFILE}
		done
		echo ""
	fi
fi

#
# Checking async mode
#
if [ ${INPUT_ASYNCMODE} -eq 0 ]; then
	TEST_PROG="tests/k2hr3template_test.js"
else
	TEST_PROG="tests/k2hr3template_test_async.js"
fi

#
# Input template string
#
if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
	echo "---------------------------------------------------------------"
	echo " Template string"
	echo "---------------------------------------------------------------"
	cat ${INPUT_TEMPLFILE}
	echo ""
	echo "---------------------------------------------------------------"
fi

#
# Executing
#
cd ${SRCTOP}
if [ "X${DEBUG_PIPE_LINE}" = "X" ]; then
	if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
		echo "***** Run *****"
		echo "NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} R3TEMPLFILE=${INPUT_TEMPLFILE} R3VARFILE=${INPUT_VARFILE} node ${DEBUG_OPTION} ${TEST_PROG}"
		echo ""
	fi
	NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} R3TEMPLFILE=${INPUT_TEMPLFILE} R3VARFILE=${INPUT_VARFILE} node ${DEBUG_OPTION} ${TEST_PROG}
else
	if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
		echo "***** Run *****"
		echo "NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} R3TEMPLFILE=${INPUT_TEMPLFILE} R3VARFILE=${INPUT_VARFILE} node ${DEBUG_OPTION} ${TEST_PROG} 2>&1 | ${DEBUG_PIPE_LINE}"
		echo ""
	fi
	NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} R3TEMPLFILE=${INPUT_TEMPLFILE} R3VARFILE=${INPUT_VARFILE} node ${DEBUG_OPTION} ${TEST_PROG} 2>&1 | ${DEBUG_PIPE_LINE}
fi

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
