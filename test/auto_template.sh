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
# CREATE:   Wed Jan 17 2018
# REVISION:
#

#
# Common
#
PROGRAM_NAME=`basename $0`
MYSCRIPTDIR=`dirname $0`
MYSCRIPTDIR=`cd ${MYSCRIPTDIR}; pwd`
SRCTOP=`cd ${MYSCRIPTDIR}/..; pwd`

#
# Parameters
#
TEST_PROGRAM=${SRCTOP}/test/k2hr3template_test.sh
VARS_FILE=${SRCTOP}/test/k2hr3template_test_vars.js
TEMPL_FILE=${SRCTOP}/test/k2hr3template_test_template.txt
SUCCESS_FILE=${SRCTOP}/test/k2hr3template_test_template.result
EXPANDED_FILE=/tmp/k2hr3template_test_template.result

#
# Usage
#
PrintUsage()
{
	echo "Usage: $1 [--debuglevel(-d) DBG/MSG/WARN/ERR/(custom debug level)] [--async(-a)]"
	echo ""
}

#
# Parse arguments
#
DEBUG_OPTION=""
DEBUG_ENV_DBG=0
ASYNC_OPTION=""

while [ $# -ne 0 ]; do
	if [ "X$1" = "X" ]; then
		break

	elif [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		PrintUsage ${PROGRAM_NAME}
		exit 0

	elif [ "X$1" = "X--debuglevel" -o "X$1" = "X--DEBUGLEVEL" -o "X$1" = "X-d" -o "X$1" = "X-D" ]; then
		#
		# DEBUG option
		#
		shift
		if [ $# -eq 0 ]; then
			echo "ERROR: --debuglevel(-d) option needs parameter(dbg/msg/warn/err)"
			exit 1
		fi
		if [ "X$DEBUG_OPTION" != "X" ]; then
			echo "ERROR: already specified  --debuglevel(-d) option"
			exit 1
		fi

		if [ "X$1" = "Xdbg" -o "X$1" = "XDBG" -o "X$1" = "Xdebug" -o "X$1" = "XDEBUG" ]; then
			DEBUG_ENV_DBG=1
		fi
		DEBUG_OPTION="-d $1"

	elif [ "X$1" = "X--async" -o "X$1" = "X--ASYNC" -o "X$1" = "X-a" -o "X$1" = "X-A" ]; then
		if [ "X$ASYNC_OPTION" != "X" ]; then
			echo "ERROR: already specified  --async(-a) option"
			exit 1
		fi
		ASYNC_OPTION="--async"

	else
		echo "ERROR: unknown option \"$1\""
		echo ""
		PrintUsage ${PROGRAM_NAME}
		exit 0
	fi

	shift
done

#
# Executing
#
if [ ${DEBUG_ENV_DBG} -eq 1 ]; then
	echo "***** Run(execute template engine) *****"
	echo "${TEST_PROGRAM} -v ${VARS_FILE} -t ${TEMPL_FILE} ${ASYNC_OPTION} > ${EXPANDED_FILE}"
	echo ""
fi
${TEST_PROGRAM} -v ${VARS_FILE} -t ${TEMPL_FILE} ${ASYNC_OPTION} > ${EXPANDED_FILE}
if [ $? -ne 0 ]; then
	exit $?
fi

if [ ${DEBUG_ENV_DBG} -eq 1 ]; then
	echo "***** Run(compare result) *****"
	echo "diff ${EXPANDED_FILE} ${SUCCESS_FILE}"
	echo ""
fi
diff ${EXPANDED_FILE} ${SUCCESS_FILE}
if [ $? -ne 0 ]; then
	exit $?
fi

exit 0

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
