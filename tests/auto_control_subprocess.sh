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
# CREATE:   Tue Dec 19 2017
# REVISION:
#

#----------------------------------------------------------
# This script starts/stops k2hdkc cluster/chmpx server/
# chmpx slave processes, and initializes data on k2hdkc for
# testing.
#----------------------------------------------------------

#==========================================================
# Common Variables
#==========================================================
PRGNAME=$(basename "$0")
SCRIPTDIR=$(dirname "$0")
SCRIPTDIR=$(cd "${SCRIPTDIR}" || exit 1; pwd)
#SRCTOP=$(cd "${SCRIPTDIR}/.." || exit 1; pwd)

#==============================================================
# Utility functions
#==============================================================
#
# Usage
#
PrintUsage()
{
	echo ""
	echo "Usage: $1 [ --help(-h) ] [ --start(-str) | --stop(-stp) ] [--key(-k) <key>] [--interval(-i) <sec>] -- <process> <arg>..."
	echo ""
	echo "Option:"
	echo "  --start(-str)         : start process"
	echo "  --stop(-stp)          : stop process"
	echo "  --key(-k) <key>       : key name for controling process(a part of pid file name)"
	echo "  --interval(-i) <sec>  : interval second time"
	echo ""
}

#==========================================================
# Parse options
#==========================================================
EXEC_MODE=""
RUN_INTERVAL=0
PID_FILENAME_EXT_PART=""
CHILD_PROCESS_NAME=""
CHILD_PROCESS_CMD=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif echo "$1" | grep -q -i -e "^-h$" -e "^--help$"; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif echo "$1" | grep -q -i -e "^-str$" -e "^--start$"; then
		if [ -n "${EXEC_MODE}" ]; then
			echo "[ERROR] Already run mode(--start(-str) or --stop(-stp) option) is specified."
			exit 1
		fi
		EXEC_MODE="start"

	elif echo "$1" | grep -q -i -e "^-stp$" -e "^--stop$"; then
		if [ -n "${EXEC_MODE}" ]; then
			echo "[ERROR] Already run mode(--start(-str) or --stop(-stp) option) is specified."
			exit 1
		fi
		EXEC_MODE="stop"

	elif echo "$1" | grep -q -i -e "^-k$" -e "^--key$"; then
		if [ -n "${PID_FILENAME_EXT_PART}" ]; then
			echo "[ERROR] Already --key(-k) option is specified."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --key(-k) option needs parameter"
			exit 1
		fi
		PID_FILENAME_EXT_PART="_$1"

	elif echo "$1" | grep -q -i -e "^-i$" -e "^-int$" -e "^--interval$"; then
		if [ "${RUN_INTERVAL}" -ne 0 ]; then
			echo "[ERROR] Already --interval(-i) option is specified."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --interval(-i) option needs parameter"
			exit 1
		fi
		if echo "$1" | grep -q '[^0-9]'; then
			echo "[ERROR] --interval(-i) option parameter must be number(second)"
			exit 1
		elif [ "$1" -eq 0 ]; then
			echo "[ERROR] --interval(-i) option parameter must be positive number(second)"
			exit 1
		fi
		RUN_INTERVAL="$1"

	elif [ "$1" = "--" ]; then
		#
		# Finish to parse option, rest arguments are command and it's args
		#
		if [ -n "${CHILD_PROCESS_NAME}" ]; then
			echo "[ERROR] Already \"-- <process> <arg>...\" option is specified(${CHILD_PROCESS_CMD})"
			exit 1
		fi
		shift
		if [ -z "$1" ]; then
			echo "[ERROR] \"-- <process> <arg>...\" option need parameter"
			exit 1
		fi
		CHILD_PROCESS_NAME="$1"
		CHILD_PROCESS_CMD="$*"
		break

	else
		echo "[ERROR] Unknown option $1."
		exit 1
	fi
	shift
done

#
# Check execute mode
#
if [ -z "${EXEC_MODE}" ]; then
	echo "[ERROR] You must specify --start(-str) or --stop(-stp) option."
	exit 1
fi

#
# Check sub process options
#
if [ -z "${CHILD_PROCESS_NAME}" ] || [ -z "${CHILD_PROCESS_CMD}" ]; then
	echo "[ERROR] No sub process and arguments are specified."
	exit 1
fi

#
# Process pid/log
#
CHILD_PROCESS_PIDFILE="/tmp/${PRGNAME}_${CHILD_PROCESS_NAME}${PID_FILENAME_EXT_PART}.pid"
CHILD_PROCESS_LOGFILE="/tmp/${PRGNAME}_${CHILD_PROCESS_NAME}${PID_FILENAME_EXT_PART}.log"

#==========================================================
# Execute
#==========================================================
if [ "${EXEC_MODE}" = "start" ]; then
	#
	# Start Process
	#
	${CHILD_PROCESS_CMD} >"${CHILD_PROCESS_LOGFILE}" 2>&1 &
	CHILD_PROCESS_PID=$!

	if [ "${RUN_INTERVAL}" -gt 0 ]; then
		sleep "${RUN_INTERVAL}"
	fi

	# shellcheck disable=SC2009
	if ! ( ps -o pid,stat ax 2>/dev/null | grep -v 'PID' | awk '$2~/^[^Z]/ { print $1 }' | grep -q "^${CHILD_PROCESS_PID}$" || exit 1 && exit 0 ); then
		echo "[ERROR] Could not start child process : ${CHILD_PROCESS_CMD}"
		exit 1
	fi
	echo "${CHILD_PROCESS_PID}" >"${CHILD_PROCESS_PIDFILE}"

	echo "[SUCCEED] Start process(${CHILD_PROCESS_PID}) : ${CHILD_PROCESS_CMD}"

else
	#
	# Stop Process
	#
	if [ -n "${CHILD_PROCESS_PIDFILE}" ] && [ -f "${CHILD_PROCESS_PIDFILE}" ]; then

		CHILD_PROCESS_PID="$(tr -d '\n' < "${CHILD_PROCESS_PIDFILE}")"

		# shellcheck disable=SC2009
		if ( ps -o pid,stat ax 2>/dev/null | grep -v 'PID' | awk '$2~/^[^Z]/ { print $1 }' | grep -q "^${CHILD_PROCESS_PID}$" || exit 1 && exit 0 ); then
			#
			# Try stop
			#
			if ! kill -HUP "${CHILD_PROCESS_PID}"; then
				echo "[WARNING] Failed to stop(HUP) process : ${CHILD_PROCESS_NAME}"
			fi
			if [ "${RUN_INTERVAL}" -gt 0 ]; then
				sleep "${RUN_INTERVAL}"
			fi

			# shellcheck disable=SC2009
			if ( ps -o pid,stat ax 2>/dev/null | grep -v 'PID' | awk '$2~/^[^Z]/ { print $1 }' | grep -q "^${CHILD_PROCESS_PID}$" || exit 1 && exit 0 ); then
				#
				# Retry stop
				#
				if ! kill -KILL "${CHILD_PROCESS_PID}"; then
					echo "[WARNING] Failed to stop(KILL) process : ${CHILD_PROCESS_NAME}"
				fi
				if [ "${RUN_INTERVAL}" -gt 0 ]; then
					sleep "${RUN_INTERVAL}"
				fi

				# shellcheck disable=SC2009
				if ( ps -o pid,stat ax 2>/dev/null | grep -v 'PID' | awk '$2~/^[^Z]/ { print $1 }' | grep -q "^${CHILD_PROCESS_PID}$" || exit 1 && exit 0 ); then
					echo "[ERROR] Could not stop process : ${CHILD_PROCESS_NAME}"
					exit 1
				fi
			fi

			echo "[SUCCEED] Stop process : ${CHILD_PROCESS_NAME}(${CHILD_PROCESS_PID})"
		else
			echo "[SUCCEED] Already stop process : ${CHILD_PROCESS_NAME}(${CHILD_PROCESS_PID})"
		fi
		rm -f "${CHILD_PROCESS_PIDFILE}"
	else
		echo "[SUCCEED] Already stop process, because not found child process pid file : ${CHILD_PROCESS_PIDFILE}"
	fi
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
