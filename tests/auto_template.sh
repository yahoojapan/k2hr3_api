#!/bin/sh
#
# K2HR3 REST API
#
# Copyright 2017 Yahoo Japan Corporation.
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

#==========================================================
# Common Variables
#==========================================================
PRGNAME=$(basename "$0")
SCRIPTDIR=$(dirname "$0")
SCRIPTDIR=$(cd "${SCRIPTDIR}" || exit 1; pwd)
SRCTOP=$(cd "${SCRIPTDIR}/.." || exit 1; pwd)

#
# Variables
#
TEST_PROGRAM="${SRCTOP}/tests/k2hr3template_test.sh"
VARS_FILE="${SRCTOP}/tests/k2hr3template_test_vars.js"
TEMPL_FILE="${SRCTOP}/tests/k2hr3template_test_template.txt"
SUCCESS_FILE="${SRCTOP}/tests/k2hr3template_test_template.result"
EXPANDED_FILE="/tmp/k2hr3template_test_template.result"

#==============================================================
# Utility functions
#==============================================================
#
# Usage
#
PrintUsage()
{
	echo ""
	echo "Usage: $1 [--debuglevel(-d) DBG/MSG/WARN/ERR/(custom debug level)] [--async(-a)]"
	echo ""
}

#==========================================================
# Parse options
#==========================================================
DEBUG_OPTION=""
DEBUG_ENV_DBG=0
ASYNC_OPTION=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif echo "$1" | grep -q -i -e "^-h$" -e "^--help$"; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif echo "$1" | grep -q -i -e "^-d$" -e "^--debuglevel$"; then
		if [ -n "${DEBUG_OPTION}" ]; then
			echo "[ERROR] already specified --debuglevel(-d) option"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --debuglevel(-d) option needs parameter(dbg/msg/warn/err)"
			exit 1
		fi

		if echo "$1" | grep -q -i -e "^dbg$" -e "^debug$"; then
			DEBUG_ENV_DBG=1
		fi
		DEBUG_OPTION="-d $1"

	elif echo "$1" | grep -q -i -e "^-a$" -e "^--async$"; then
		if [ -n "${ASYNC_OPTION}" ]; then
			echo "[ERROR] already specified --async(-a) option"
			exit 1
		fi
		ASYNC_OPTION="--async"

	else
		echo "[ERROR] Unknown option $1"
		exit 1
	fi
	shift
done

#==========================================================
# Do work
#==========================================================
if [ "${DEBUG_ENV_DBG}" -eq 1 ]; then
	echo "[DEBUG] Run(execute template engine)"
	echo "        ${TEST_PROGRAM} -v ${VARS_FILE} -t ${TEMPL_FILE} ${ASYNC_OPTION} > ${EXPANDED_FILE}"
	echo ""
fi
if ! /bin/sh -c "${TEST_PROGRAM} -v ${VARS_FILE} -t ${TEMPL_FILE} ${DEBUG_OPTION} ${ASYNC_OPTION} > ${EXPANDED_FILE}"; then
	exit 1
fi

if [ "${DEBUG_ENV_DBG}" -eq 1 ]; then
	echo "[DEBUG] Run(compare result)"
	echo "        diff ${EXPANDED_FILE} ${SUCCESS_FILE}"
	echo ""
fi
if ! diff "${EXPANDED_FILE}" "${SUCCESS_FILE}"; then
	exit 1
fi

exit 0

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
