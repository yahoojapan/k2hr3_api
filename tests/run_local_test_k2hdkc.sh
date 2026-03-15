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
# CREATE:   Wed Dec 27 2017
# REVISION:
#

#==========================================================
# Common Variables
#==========================================================
#
# Instead of pipefail(for shells not support "set -o pipefail")
#
PIPEFAILURE_FILE="/tmp/.pipefailure.$(od -An -tu4 -N4 /dev/random | tr -d ' \n')"

PRGNAME=$(basename "$0")
SCRIPTDIR=$(dirname "$0")
SCRIPTDIR=$(cd "${SCRIPTDIR}" || exit 1; pwd)
SRCTOP=$(cd "${SCRIPTDIR}/.." || exit 1; pwd)
TESTDIR=$(cd "${SRCTOP}/tests" || exit 1; pwd)

#
# Variables
#
AUTO_CTRL_SH="${TESTDIR}/auto_control_subprocess.sh"
TEST_LOAD_SH="${TESTDIR}/k2hdkc_test_load.sh"

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
	CYEL=$(printf '\033[33m')
	CGRN=$(printf '\033[32m')
	CDEF=$(printf '\033[0m')
}

UnSetColor()
{
	CBLD=""
	CREV=""
	CRED=""
	CYEL=""
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
	echo "${CGRN}${CREV}[TITLE]${CDEF} ${CGRN}$*${CDEF}"
}

PRNMSG()
{
	echo "${CYEL}${CREV}[MSG]${CDEF} ${CYEL}$*${CDEF}"
}

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

#PRNFAILURE()
#{
#	echo ""
#	echo "${CBLD}${CRED}${CREV}[FAILURE]${CDEF} ${CRED}$*${CDEF}"
#	echo ""
#}

#==============================================================
# Utility functions
#==============================================================
#
# Usage
#
PrintUsage()
{
	echo ""
	echo "Usage: $1 [--key(-k) keyword(group name for control)] [start | stop]"
	echo ""
}

#==========================================================
# Parse options
#==========================================================
SCRIPT_MODE=""
KEY_SUFFIX=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif echo "$1" | grep -q -i -e "^-h$" -e "^--help$"; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif echo "$1" | grep -q -i -e "^-k$" -e "^--key$"; then
		if [ -n "${KEY_SUFFIX}" ]; then
			PRNERR "already set --key(-k) option"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--key(-k) option needs parameter"
			exit 1
		fi
		KEY_SUFFIX="_$1"

	elif echo "$1" | grep -q -i "^start$"; then
		if [ -n "${SCRIPT_MODE}" ]; then
			PRNERR "already specified start or stop"
			exit 1
		fi
		SCRIPT_MODE="start"

	elif echo "$1" | grep -q -i "^stop$"; then
		if [ -n "${SCRIPT_MODE}" ]; then
			PRNERR "already specified start or stop"
			exit 1
		fi
		SCRIPT_MODE="stop"

	else
		PRNERR "Unknown option $1"
		exit 1
	fi
	shift
done

#
# Check option
#
if [ -z "${SCRIPT_MODE}" ]; then
	PRNERR "You must specify start or stop"
	exit 1
fi

#==========================================================
# Do work
#==========================================================
if [ "${SCRIPT_MODE}" = "start" ]; then
	#
	# Start
	#
	PRNTITLE "Start : all k2hdkc processes"

	PRNMSG "Start : chmpx server node for k2hdkc"
	if ({ "${AUTO_CTRL_SH}" --start --key "server${KEY_SUFFIX}" --interval 3 -- chmpx -conf "${TESTDIR}"/auto_k2hdkc_server.ini -ctlport 18021 -d msg || echo > "${PIPEFAILURE_FILE}"; } | sed -e 's/^/           /g') && rm "${PIPEFAILURE_FILE}" >/dev/null 2>&1; then
		PRNERR "could not run chmpx server node for k2hdkc"
		exit 1
	fi
	PRNINFO "Started : chmpx server node for k2hdkc"

	PRNMSG "Start : one k2hdkc process"
	if ({ "${AUTO_CTRL_SH}" --start --key "server${KEY_SUFFIX}" --interval 3 -- k2hdkc -conf "${TESTDIR}"/auto_k2hdkc_server.ini -ctlport 18021 -d msg || echo > "${PIPEFAILURE_FILE}"; } | sed -e 's/^/           /g') && rm "${PIPEFAILURE_FILE}" >/dev/null 2>&1; then
		PRNERR "one k2hdkc process"
		exit 1
	fi
	PRNINFO "Started : one k2hdkc process"

	PRNMSG "Start : chmpx slave node for k2hdkc"
	if ({ "${AUTO_CTRL_SH}" --start --key "slave${KEY_SUFFIX}" --interval 3 -- chmpx -conf "${TESTDIR}"/auto_k2hdkc_slave.ini -ctlport 18031 -d msg || echo > "${PIPEFAILURE_FILE}"; } | sed -e 's/^/           /g') && rm "${PIPEFAILURE_FILE}" >/dev/null 2>&1; then
		PRNERR "chmpx slave node for k2hdkc"
		exit 1
	fi
	PRNINFO "Started : chmpx slave node for k2hdkc"

	PRNMSG "Start : load default test data to k2hdkc"
	if ({ "${TEST_LOAD_SH}" --for_auto_test || echo > "${PIPEFAILURE_FILE}"; } | sed -e 's/^/           /g') && rm "${PIPEFAILURE_FILE}" >/dev/null 2>&1; then
		PRNERR "load default test data to k2hdkc"
		exit 1
	fi
	PRNINFO "Started : load default test data to k2hdkc"
else
	#
	# Stop
	#
	PRNTITLE "Stop : all k2hdkc processes"

	PRNMSG "Stop : chmpx slave node for k2hdkc"
	if ({ "${AUTO_CTRL_SH}" --stop --key "slave${KEY_SUFFIX}" --interval 3 -- chmpx || echo > "${PIPEFAILURE_FILE}"; } | sed -e 's/^/           /g') && rm "${PIPEFAILURE_FILE}" >/dev/null 2>&1; then
		PRNERR "chmpx slave node for k2hdkc"
		exit 1
	fi
	PRNINFO "Stopped : chmpx slave node for k2hdkc"

	PRNMSG "Stop : one k2hdkc process"
	if ({ "${AUTO_CTRL_SH}" --stop --key "server${KEY_SUFFIX}" --interval 3 -- k2hdkc || echo > "${PIPEFAILURE_FILE}"; } | sed -e 's/^/           /g') && rm "${PIPEFAILURE_FILE}" >/dev/null 2>&1; then
		PRNERR "one k2hdkc process"
		exit 1
	fi
	PRNINFO "Stopped : one k2hdkc process"

	PRNMSG "Stop : chmpx server node for k2hdkc"
	if ({ "${AUTO_CTRL_SH}" --stop --key "server${KEY_SUFFIX}" --interval 3 -- chmpx || echo > "${PIPEFAILURE_FILE}"; } | sed -e 's/^/           /g') && rm "${PIPEFAILURE_FILE}" >/dev/null 2>&1; then
		PRNERR "could not run chmpx server node for k2hdkc"
		exit 1
	fi
	PRNINFO "Stopped : chmpx server node for k2hdkc"
fi

PRNSUCCESS "All Finished"

exit 0

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
