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
# CREATE:   Thu Nov 9 2017
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
ANTPICKAX_ETC_DIR="/etc/antpickax"
ANTPICKAX_ETC_CONF_PATH="${ANTPICKAX_ETC_DIR}"

TEST_DATA_FILENAME="k2hdkc_test.data"
TEST_DATA_TEMPLATE_FILE="${SCRIPTDIR}/${TEST_DATA_FILENAME}"
TEST_DATA_CUSTOMIZED_FILE="/tmp/${TEST_DATA_FILENAME}"

AUTO_K2HDKC_CONF_PATH="${SRCTOP}/tests/auto_k2hdkc_slave.ini"
AUTO_K2HDKC_CTRL_PORT=18031

DEFAULT_REMOTE_K2HDKC_CONF_PATH="${ANTPICKAX_ETC_CONF_PATH}/slave.ini"
DEFAULT_REMOTE_K2HDKC_CTRL_PORT=8031
DEFAULT_TENANT_MAIN="tenant0"
DEFAULT_TENANT_SUB="tenant1"

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
	printf "%s" "${CGRN}${CREV}[TITLE]${CDEF} ${CGRN}$*${CDEF}"
}

#PRNMSG()
#{
#	printf "%s\n" "${CYEL}${CREV}[MSG]${CDEF} ${CYEL}$*${CDEF}"
#}

PRNERR()
{
	printf "%s\n" "${CBLD}${CRED}[ERROR]${CDEF} ${CRED}$*${CDEF}"
}

#PRNWARN()
#{
#	printf "%s\n" "${CBLD}${CYEL}[WARNING]${CDEF} ${CYEL}$*${CDEF}"
#}

#PRNINFO()
#{
#	printf "%s\n" "${CREV}[INFO]${CDEF} $*"
#}

PRNSUCCESS()
{
	printf "%s\n" "${CBLD}${CGRN}${CREV}[SUCCEED]${CDEF} ${CGRN}$*${CDEF}"
}

PRNFAILURE()
{
	printf "%s\n" "${CBLD}${CRED}${CREV}[FAILURE]${CDEF} ${CRED}$*${CDEF}"
}

#==============================================================
# Utility functions
#==============================================================
#
# Usage
#
PrintUsage()
{
	echo "Usage: $1 --for_auto_test(-f)"
	echo "       $1 --main(-m) <main tenant name> --sub(-s) <sub tenant name> [--conf(-c) <conf file>] [--port(-p) <port>]"
	echo ""
	echo "Option:"
	echo "       --for_auto_test(-f)  for local k2hdkc as auto testing(dummyuser)"
	echo "       --main(-m)           specify main tenant name for remote k2hr3 cluster"
	echo "       --sub(-s)            specify sub tenant name for remote k2hr3 cluster"
	echo "       --conf(-c)           specify slave chmpx conf file for remote k2hr3 cluster(default is ../k2hr3_dkc/conf)"
	echo "       --port(-p)           specify slave chmpx port for remote k2hr3 cluster(default is ../k2hr3_dkc/conf)"
	echo ""
}

#==========================================================
# Parse options
#==========================================================
EXEC_MODE=""
TENANT_MAIN=""
TENANT_SUB=""
REMOTE_K2HDKC_CONF_PATH=""
REMOTE_K2HDKC_CTRL_PORT=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif echo "$1" | grep -q -i -e "^-h$" -e "^--help$"; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif echo "$1" | grep -q -i -e "^-f$" -e "^--for_auto_test$"; then
		if [ -n "${EXEC_MODE}" ]; then
			PRNERR "Already specified --for_auto_test(-f) or --main(-m) or --sub(-s) option."
			exit 1
		fi
		EXEC_MODE="auto"

	elif echo "$1" | grep -q -i -e "^-m$" -e "^--main$"; then
		#
		# input main tenant name
		#
		if [ -n "${EXEC_MODE}" ] && [ "${EXEC_MODE}" = "auto" ]; then
			PRNERR "Already specified --for_auto_test(-f) or --main(-m) or --sub(-s) option."
			exit 1
		fi
		if [ -n "${TENANT_MAIN}" ]; then
			PRNERR "Already specified --main(-m) option."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--main(-m) option needs parameter"
			exit 1
		fi
		TENANT_MAIN="$1"
		EXEC_MODE="notauto"

	elif echo "$1" | grep -q -i -e "^-s$" -e "^--sub$"; then
		#
		# input sub tenant name
		#
		if [ -n "${EXEC_MODE}" ] && [ "${EXEC_MODE}" = "auto" ]; then
			PRNERR "Already specified --for_auto_test(-f) or --main(-m) or --sub(-s) option."
			exit 1
		fi
		if [ -n "${TENANT_SUB}" ]; then
			PRNERR "Already specified --sub(-s) option."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--sub(-s) option needs parameter"
			exit 1
		fi
		TENANT_SUB="$1"
		EXEC_MODE="notauto"

	elif echo "$1" | grep -q -i -e "^-c$" -e "^--conf$"; then
		if [ -n "${EXEC_MODE}" ] && [ "${EXEC_MODE}" = "auto" ]; then
			PRNERR "--conf(-c) option is specified, but already set --for_auto_test(-f) option."
			exit 1
		fi
		if [ -n "${REMOTE_K2HDKC_CONF_PATH}" ]; then
			PRNERR "Already specified --conf(-c) option."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--conf(-c) option needs parameter"
			exit 1
		fi
		if [ ! -f "$1" ]; then
			PRNERR "$1 file is not existed"
			exit 1
		fi
		REMOTE_K2HDKC_CONF_PATH="$1"
		EXEC_MODE="notauto"

	elif echo "$1" | grep -q -i -e "^-p$" -e "^--port$"; then
		if [ -n "${EXEC_MODE}" ] && [ "${EXEC_MODE}" = "auto" ]; then
			PRNERR "--port(-p) option is specified, but already set --for_auto_test(-f) option."
			exit 1
		fi
		if [ "${REMOTE_K2HDKC_CTRL_PORT}" -ne 0 ]; then
			PRNERR "Already specified --port(-p) option."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--port(-p) option needs parameter"
			exit 1
		fi
		if echo "$1" | grep -q '[^0-9]'; then
			PRNERR "--port(-p) option parameter must be number"
			exit 1
		elif [ "$1" -eq 0 ]; then
			PRNERR "--port(-p) option parameter must be positive number"
			exit 1
		fi
		REMOTE_K2HDKC_CTRL_PORT="$1"
		EXEC_MODE="notauto"

	else
		PRNERR "Unknown option $1"
		exit 1
	fi
	shift
done

#
# Check options
#
if [ -z "${EXEC_MODE}" ]; then
	PRNERR "no option is specified."
	exit 1
fi

#
# Check and set values
#
if [ -z "${TENANT_MAIN}" ]; then
	TENANT_MAIN="${DEFAULT_TENANT_MAIN}"
fi
if [ -z "${TENANT_SUB}" ]; then
	TENANT_SUB="${DEFAULT_TENANT_SUB}"
fi
if [ -z "${REMOTE_K2HDKC_CONF_PATH}" ]; then
	REMOTE_K2HDKC_CONF_PATH="${DEFAULT_REMOTE_K2HDKC_CONF_PATH}"
fi
if [ -z "${REMOTE_K2HDKC_CTRL_PORT}" ]; then
	REMOTE_K2HDKC_CTRL_PORT="${DEFAULT_REMOTE_K2HDKC_CTRL_PORT}"
fi

if [ "${EXEC_MODE}" = "auto" ]; then
	K2HDKC_CONF_PATH="${AUTO_K2HDKC_CONF_PATH}"
	K2HDKC_CTRL_PORT="${AUTO_K2HDKC_CTRL_PORT}"
	LOCAL_HOSTNAME="$(hostname -f | tr -d '\n')"
	IPADDR="127.10.10.10"
else
	K2HDKC_CONF_PATH="${REMOTE_K2HDKC_CONF_PATH}"
	K2HDKC_CTRL_PORT="${REMOTE_K2HDKC_CTRL_PORT}"
	LOCAL_HOSTNAME="$(hostname -f | tr -d '\n')"
	IPADDR="$(nslookup "${LOCAL_HOSTNAME}" | grep 'Address' | grep -v '#' | awk '{print $2}' | head -1 | tr -d '\n')"
fi

if [ ! -f "${K2HDKC_CONF_PATH}" ]; then
	PRNERR "slave chmpx configuration file(${K2HDKC_CONF_PATH}) does not exist."
	exit 1
fi

#==========================================================
# Do work
#==========================================================
PRNTITLE "Loaded test data"

#
# Copy file with convert
#
if ! sed -e "s#__LOCAL_HOST_NAME__#${LOCAL_HOSTNAME}#g"  -e "s#__LOCAL_HOST_IP__#${IPADDR}#g"  -e "s#__TENANT_NAME_MAIN__#${TENANT_MAIN}#g"  -e "s#__TENANT_NAME_SUB__#${TENANT_SUB}#g" "${TEST_DATA_TEMPLATE_FILE}" >"${TEST_DATA_CUSTOMIZED_FILE}" 2>/dev/null; then
	PRNFAILURE "Failed to convert and copy file(${SCRIPTDIR}/k2hdkc_test.data) to /tmp."
	exit 1
fi

#
# Run process
#
if ! k2hdkclinetool -conf "${K2HDKC_CONF_PATH}" -ctlport "${K2HDKC_CTRL_PORT}" -run "${TEST_DATA_CUSTOMIZED_FILE}" >/dev/null 2>&1; then
	PRNFAILURE "Failed to load test data."
	rm -f "${TEST_DATA_CUSTOMIZED_FILE}"
	exit 1
fi
rm -f "${TEST_DATA_CUSTOMIZED_FILE}"

PRNSUCCESS "Loaded test data"

exit 0

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
