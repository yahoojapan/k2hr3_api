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
# CREATE:   Wed Dec 27 2017
# REVISION:
#

#==========================================================
# Common Variables
#==========================================================
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

	elif [ "$1" = "-h" ] || [ "$1" = "-H" ] || [ "$1" = "--help" ] || [ "$1" = "--HELP" ]; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif [ "$1" = "-k" ] || [ "$1" = "-K" ] || [ "$1" = "--key" ] || [ "$1" = "--KEY" ]; then
		if [ -n "${KEY_SUFFIX}" ]; then
			echo "[ERROR] already set --key(-k) option"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --key(-k) option needs parameter"
			exit 1
		fi
		KEY_SUFFIX="_$1"

	elif [ "$1" = "start" ] || [ "$1" = "START" ]; then
		if [ -n "${SCRIPT_MODE}" ]; then
			echo "[ERROR] already specified start or stop"
			exit 1
		fi
		SCRIPT_MODE="start"

	elif [ "$1" = "stop" ] || [ "$1" = "STOP" ]; then
		if [ -n "${SCRIPT_MODE}" ]; then
			echo "[ERROR] already specified start or stop"
			exit 1
		fi
		SCRIPT_MODE="stop"

	else
		echo "[ERROR] Unknown option $1"
		exit 1
	fi
	shift
done

#
# Check option
#
if [ -z "${SCRIPT_MODE}" ]; then
	echo "[ERROR] You must specify start or stop"
	exit 1
fi

#==========================================================
# Do work
#==========================================================
if [ "${SCRIPT_MODE}" = "start" ]; then
	#
	# Start
	#
	echo "*** Start : chmpx server node for k2hdkc"
    printf "           "
	if ! "${AUTO_CTRL_SH}" --start --key "server${KEY_SUFFIX}" --interval 3 -- chmpx -conf "${TESTDIR}"/auto_k2hdkc_server.ini -ctlport 18021 -d msg; then
		echo "[ERROR] could not run chmpx server node for k2hdkc"
		exit 1
	fi

	echo "*** Start : one k2hdkc process"
    printf "           "
	if ! "${AUTO_CTRL_SH}" --start --key "server${KEY_SUFFIX}" --interval 3 -- k2hdkc -conf "${TESTDIR}"/auto_k2hdkc_server.ini -ctlport 18021 -d msg; then
		echo "[ERROR] one k2hdkc process"
		exit 1
	fi

	echo "*** Start : chmpx slave node for k2hdkc"
    printf "           "
	if ! "${AUTO_CTRL_SH}" --start --key "slave${KEY_SUFFIX}" --interval 3 -- chmpx -conf "${TESTDIR}"/auto_k2hdkc_slave.ini -ctlport 18031 -d msg; then
		echo "[ERROR] chmpx slave node for k2hdkc"
		exit 1
	fi

	echo "*** Start : load default test data to k2hdkc"
    printf "           "
	if ! "${TEST_LOAD_SH}" --for_auto_test; then
		echo "[ERROR] load default test data to k2hdkc"
		exit 1
	fi
else
	#
	# Stop
	#
	echo "*** Stop : chmpx slave node for k2hdkc"
    printf "           "
	if ! "${AUTO_CTRL_SH}" --stop --key "slave${KEY_SUFFIX}" --interval 3 -- chmpx; then
		echo "[ERROR] chmpx slave node for k2hdkc"
		exit 1
	fi

	echo "*** Stop : one k2hdkc process"
    printf "           "
	if ! "${AUTO_CTRL_SH}" --stop --key "server${KEY_SUFFIX}" --interval 3 -- k2hdkc; then
		echo "[ERROR] one k2hdkc process"
		exit 1
	fi

	echo "*** Stop : chmpx server node for k2hdkc"
    printf "           "
	if ! "${AUTO_CTRL_SH}" --stop --key "server${KEY_SUFFIX}" --interval 3 -- chmpx; then
		echo "[ERROR] could not run chmpx server node for k2hdkc"
		exit 1
	fi
fi
echo "[SUCCEED] Finished"

exit 0

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
