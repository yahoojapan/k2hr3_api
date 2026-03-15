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
DISTDIR=$(cd "${SRCTOP}/dist" || exit 1; pwd)

#
# Variables
#
TEST_PROGRAM="${SRCTOP}/tests/k2hr3template_test.sh"
VARS_FILE="${DISTDIR}/tests/k2hr3template_test_vars.js"
TEMPL_FILE="${SRCTOP}/tests/k2hr3template_test_template.txt"
SUCCESS_FILE="${SRCTOP}/tests/k2hr3template_test_template.result"
EXPANDED_FILE="/tmp/k2hr3template_test_template.result"

#==========================================================
# Utility functions for print
#==========================================================
#
# Escape sequence
#
SetColor()
{
	CBLD=$(printf '\033[1m')
	CREV=$(printf '\033[7m')
	CRED=$(printf '\033[31m')
#	CYEL=$(printf '\033[33m')
	CGRN=$(printf '\033[32m')
	CDEF=$(printf '\033[0m')
}

UnSetColor()
{
	CBLD=""
	CREV=""
	CRED=""
#	CYEL=""
	CGRN=""
	CDEF=""
}

if [ -t 1 ]; then
	SetColor
else
	UnSetColor
fi

#--------------------------------------------------------------
# Message functions
#--------------------------------------------------------------
PRNTITLE()
{
	echo "${CGRN}---------------------------------------------------------------------${CDEF}"
	echo "${CGRN}${CREV}[TITLE]${CDEF} ${CGRN}$*${CDEF}"
	echo "${CGRN}---------------------------------------------------------------------${CDEF}"
}

#PRNMSG()
#{
#	echo "${CYEL}${CREV}[MSG]${CDEF} ${CYEL}$*${CDEF}"
#}

PRNERR()
{
	echo "${CBLD}${CRED}[ERROR]${CDEF} ${CRED}$*${CDEF}"
}

#PRNWARN()
#{
#	echo "${CBLD}${CYEL}[WARNING]${CDEF} ${CYEL}$*${CDEF}"
#}

PRNINFO()
{
	echo "${CREV}[INFO]${CDEF} $*"
}

PRNSUCCESS()
{
	echo ""
	echo "${CBLD}${CGRN}${CREV}[SUCCEED]${CDEF} ${CGRN}$*${CDEF}"
	echo ""
}

PRNFAILURE()
{
	echo ""
	echo "${CBLD}${CRED}${CREV}[FAILURE]${CDEF} ${CRED}$*${CDEF}"
	echo ""
}

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
			PRNERR "already specified --debuglevel(-d) option"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--debuglevel(-d) option needs parameter(dbg/msg/warn/err)"
			exit 1
		fi

		if echo "$1" | grep -q -i -e "^dbg$" -e "^debug$"; then
			DEBUG_ENV_DBG=1
		fi
		DEBUG_OPTION="-d $1"

	elif echo "$1" | grep -q -i -e "^-a$" -e "^--async$"; then
		if [ -n "${ASYNC_OPTION}" ]; then
			PRNERR "already specified --async(-a) option"
			exit 1
		fi
		ASYNC_OPTION="--async"

	else
		PRNERR "Unknown option $1"
		exit 1
	fi
	shift
done

#==========================================================
# Do work
#==========================================================
PRNTITLE "Run ${PRGNAME}"

cd "${DISTDIR}" || exit 1

if [ "${DEBUG_ENV_DBG}" -eq 1 ]; then
	PRNINFO "[DEBUG] Run(execute template engine)"
	PRNINFO "        ${TEST_PROGRAM} -v ${VARS_FILE} -t ${TEMPL_FILE} ${ASYNC_OPTION} > ${EXPANDED_FILE}"
	printf "\n"
fi
if ! /bin/sh -c "${TEST_PROGRAM} -v ${VARS_FILE} -t ${TEMPL_FILE} ${DEBUG_OPTION} ${ASYNC_OPTION} > ${EXPANDED_FILE}"; then
	PRNFAILURE "Failed to run ${PRGNAME}"
	exit 1
fi

if [ "${DEBUG_ENV_DBG}" -eq 1 ]; then
	PRNINFO "[DEBUG] Run(compare result)"
	PRNINFO "        diff ${EXPANDED_FILE} ${SUCCESS_FILE}"
	printf "\n"
fi
if ! diff "${EXPANDED_FILE}" "${SUCCESS_FILE}"; then
	PRNFAILURE "Not same result : ${EXPANDED_FILE} vs ${SUCCESS_FILE}"
	exit 1
fi

PRNSUCCESS "Run ${PRGNAME}"
exit 0

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
