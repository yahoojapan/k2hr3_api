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
K2HR3_DKC_DIR=$(cd "${SRCTOP}/../k2hr3_dkc" || exit 1; pwd)
K2HR3_DKC_CONF_PATH="${K2HR3_DKC_DIR}/conf"

TEST_DATA_FILENAME="k2hdkc_test.data"
TEST_DATA_TEMPLATE_FILE="${SCRIPTDIR}/${TEST_DATA_FILENAME}"
TEST_DATA_CUSTOMIZED_FILE="/tmp/${TEST_DATA_FILENAME}"

AUTO_K2HDKC_CONF_PATH="${SRCTOP}/tests/auto_k2hdkc_slave.ini"
AUTO_K2HDKC_CTRL_PORT=18031

DEFAULT_REMOTE_K2HDKC_CONF_PATH="${K2HR3_DKC_CONF_PATH}/slave.ini"
DEFAULT_REMOTE_K2HDKC_CTRL_PORT=8031
DEFAULT_TENANT_MAIN="tenant0"
DEFAULT_TENANT_SUB="tenant1"

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

	elif [ "$1" = "-h" ] || [ "$1" = "-H" ] || [ "$1" = "--help" ] || [ "$1" = "--HELP" ]; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif [ "$1" = "-f" ] || [ "$1" = "-F" ] || [ "$1" = "--for_auto_test" ] || [ "$1" = "--FOR_AUTO_TEST" ]; then
		if [ -n "${EXEC_MODE}" ]; then
			echo "[ERROR] Already specified --for_auto_test(-f) or --main(-m) or --sub(-s) option."
			exit 1
		fi
		EXEC_MODE="auto"

	elif [ "$1" = "--main" ] || [ "$1" = "--MAIN" ] || [ "$1" = "-m" ] || [ "$1" = "-M" ]; then
		#
		# input main tenant name
		#
		if [ -n "${EXEC_MODE}" ] && [ "${EXEC_MODE}" = "auto" ]; then
			echo "[ERROR] Already specified --for_auto_test(-f) or --main(-m) or --sub(-s) option."
			exit 1
		fi
		if [ -n "${TENANT_MAIN}" ]; then
			echo "[ERROR] Already specified --main(-m) option."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --main(-m) option needs parameter"
			exit 1
		fi
		TENANT_MAIN="$1"
		EXEC_MODE="notauto"

	elif [ "$1" = "--sub" ] || [ "$1" = "--SUB" ] || [ "$1" = "-s" ] || [ "$1" = "-S" ]; then
		#
		# input sub tenant name
		#
		if [ -n "${EXEC_MODE}" ] && [ "${EXEC_MODE}" = "auto" ]; then
			echo "[ERROR] Already specified --for_auto_test(-f) or --main(-m) or --sub(-s) option."
			exit 1
		fi
		if [ -n "${TENANT_SUB}" ]; then
			echo "[ERROR] Already specified --sub(-s) option."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --sub(-s) option needs parameter"
			exit 1
		fi
		TENANT_SUB="$1"
		EXEC_MODE="notauto"

	elif [ "$1" = "--conf" ] || [ "$1" = "--CONF" ] || [ "$1" = "-c" ] || [ "$1" = "-C" ]; then
		if [ -n "${EXEC_MODE}" ] && [ "${EXEC_MODE}" = "auto" ]; then
			echo "[ERROR] --conf(-c) option is specified, but already set --for_auto_test(-f) option."
			exit 1
		fi
		if [ -n "${REMOTE_K2HDKC_CONF_PATH}" ]; then
			echo "[ERROR] Already specified --conf(-c) option."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
		    echo "[ERROR] --conf(-c) option needs parameter"
		    exit 1
		fi
		if [ ! -f "$1" ]; then
		    echo "[ERROR] $1 file is not existed"
		    exit 1
		fi
		REMOTE_K2HDKC_CONF_PATH="$1"
		EXEC_MODE="notauto"

	elif [ "$1" = "--port" ] || [ "$1" = "--PORT" ] || [ "$1" = "-p" ] || [ "$1" = "-P" ]; then
		if [ -n "${EXEC_MODE}" ] && [ "${EXEC_MODE}" = "auto" ]; then
			echo "[ERROR] --port(-p) option is specified, but already set --for_auto_test(-f) option."
			exit 1
		fi
		if [ "${REMOTE_K2HDKC_CTRL_PORT}" -ne 0 ]; then
			echo "[ERROR] Already specified --port(-p) option."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
		    echo "[ERROR] --port(-p) option needs parameter"
		    exit 1
		fi
		if echo "$1" | grep -q '[^0-9]'; then
			echo "[ERROR] --port(-p) option parameter must be number"
			exit 1
		elif [ "$1" -eq 0 ]; then
			echo "[ERROR] --port(-p) option parameter must be positive number"
			exit 1
		fi
		REMOTE_K2HDKC_CTRL_PORT="$1"
		EXEC_MODE="notauto"

	else
		echo "[ERROR] Unknown option $1"
		exit 1
	fi
	shift
done

#
# Check options
#
if [ -z "${EXEC_MODE}" ]; then
	echo "[ERROR] no option is specified."
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
	LOCAL_HOSTNAME="$(hostname | tr -d '\n')"
	IPADDR="127.10.10.10"
else
	K2HDKC_CONF_PATH="${REMOTE_K2HDKC_CONF_PATH}"
	K2HDKC_CTRL_PORT="${REMOTE_K2HDKC_CTRL_PORT}"
	LOCAL_HOSTNAME="$(hostname | tr -d '\n')"
	IPADDR="$(nslookup "${LOCAL_HOSTNAME}" | grep 'Address' | grep -v '#' | awk '{print $2}' | head -1 | tr -d '\n')"
fi

if [ ! -f "${K2HDKC_CONF_PATH}" ]; then
    echo "[ERROR] slave chmpx configuration file(${K2HDKC_CONF_PATH}) does not exist."
    exit 1
fi

#==========================================================
# Do work
#==========================================================
#
# Copy file with convert
#
if ! sed -e "s#__LOCAL_HOST_NAME__#${LOCAL_HOSTNAME}#g"  -e "s#__LOCAL_HOST_IP__#${IPADDR}#g"  -e "s#__TENANT_NAME_MAIN__#${TENANT_MAIN}#g"  -e "s#__TENANT_NAME_SUB__#${TENANT_SUB}#g" "${TEST_DATA_TEMPLATE_FILE}" >"${TEST_DATA_CUSTOMIZED_FILE}" 2>/dev/null; then
    echo "[ERROR] Failed to convert and copy file(${SCRIPTDIR}/k2hdkc_test.data) to /tmp."
    exit 1
fi

#
# Run process
#
if ! k2hdkclinetool -conf "${K2HDKC_CONF_PATH}" -ctlport "${K2HDKC_CTRL_PORT}" -run "${TEST_DATA_CUSTOMIZED_FILE}" >/dev/null 2>&1; then
	echo "[ERROR] Failed to load test data."
	rm -f "${TEST_DATA_CUSTOMIZED_FILE}"
	exit 1
fi
rm -f "${TEST_DATA_CUSTOMIZED_FILE}"
echo "[SUCCEED] Loaded test data."

exit 0

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
