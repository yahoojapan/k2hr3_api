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
LOCAL_HOSTNAME="$(hostname | tr -d '\n')"
DEFAULT_TEST_PROG="tests/k2hr3template_test.js"
ASYNC_TEST_PROG="tests/k2hr3template_test_async.js"

#==============================================================
# Utility functions
#==============================================================
#
# Usage
#
PrintUsage()
{
	echo "Usage: $1 [--inspect(-i)]"
	echo "          [--debuglevel(-d) DBG/MSG/WARN/ERR/(custom debug level)]"
	echo "          [--varlist(-v) \"variables JSON file path\"]"
	echo "          {--templ(-t) \"template file path\" | --string(-s) \"template string\"}"
	echo "          {--async(-a)}"
	echo ""
	echo "       If you do not specify input file path or template string,"
	echo "       $1 prompts you to enter a template string from stdin."
	echo ""
}

#==========================================================
# Parse options
#==========================================================
INPUT_TEMPLFILE=""
INPUT_TEMPLSTR=""
INPUT_VARFILE=""
INPUT_ASYNCMODE=0
DEBUG_USE_INSPECT=0
DEBUG_ENV_LEVEL=0
DEBUG_ENV_CUSTOM=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif [ "$1" = "-h" ] || [ "$1" = "-H" ] || [ "$1" = "--help" ] || [ "$1" = "--HELP" ]; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif [ "$1" = "-i" ] || [ "$1" = "-I" ] || [ "$1" = "--inspect" ] || [ "$1" = "--INSPECT" ]; then
		if [ "${DEBUG_USE_INSPECT}" -ne 0 ]; then
			echo "[ERROR] Already specified --inspect(-i) option"
			exit 1
		fi
		DEBUG_USE_INSPECT=1

	elif [ "$1" = "-d" ] || [ "$1" = "-D" ] || [ "$1" = "--debuglevel" ] || [ "$1" = "--DEBUGLEVEL" ]; then
		#
		# DEBUG option
		#
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --debuglevel(-dl) option needs parameter(dbg/msg/warn/err/custom debug level)"
			exit 1
		fi
		if [ "$1" = "dbg" ] || [ "$1" = "DBG" ] || [ "$1" = "debug" ] || [ "$1" = "DEBUG" ]; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				echo "[ERROR] --debuglevel(-dl) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=4
		elif [ "$1" = "msg" ] || [ "$1" = "MSG" ] || [ "$1" = "message" ] || [ "$1" = "MESSAGE" ] || [ "$1" = "info" ] || [ "$1" = "INFO" ]; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				echo "[ERROR] --debuglevel(-dl) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=3
		elif [ "$1" = "warn" ] || [ "$1" = "WARN" ] || [ "$1" = "warning" ] || [ "$1" = "WARNING" ]; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				echo "[ERROR] --debuglevel(-dl) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=2
		elif [ "$1" = "err" ] || [ "$1" = "ERR" ] || [ "$1" = "error" ] || [ "$1" = "ERROR" ]; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				echo "[ERROR] --debuglevel(-dl) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=1
		else
			#
			# Custom debug level value
			#
			if [ -n "${DEBUG_ENV_CUSTOM}" ]; then
				DEBUG_ENV_CUSTOM="${DEBUG_ENV_CUSTOM},"
			fi
			DEBUG_ENV_CUSTOM="${DEBUG_ENV_CUSTOM}$1"
		fi

	elif [ "$1" = "-v" ] || [ "$1" = "-V" ] || [ "$1" = "--varlist" ] || [ "$1" = "--VARLIST" ]; then
		#
		# input variable list file path
		#
		if [ -n "${INPUT_VARFILE}" ]; then
			echo "[ERROR] Already specified variable list file ${INPUT_VARFILE}"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --varlist(-v) option needs parameter( input variable JSON file path )"
			exit 1
		fi
		if [ ! -f "$1" ]; then
			echo "[ERROR] could not find variable list file $1"
			exit 1
		fi
		INPUT_VARFILE="$1"

	elif [ "$1" = "-t" ] || [ "$1" = "-T" ] || [ "$1" = "--templ" ] || [ "$1" = "--TEMPL" ] || [ "$1" = "--template" ] || [ "$1" = "--TEMPLATE" ]; then
		#
		# input template file path
		#
		if [ -n "${INPUT_TEMPLFILE}" ]; then
			echo "[ERROR] Already specified template file ${INPUT_TEMPLFILE}"
			exit 1
		fi
		if [ -n "${INPUT_TEMPLSTR}" ]; then
			echo "[ERROR] Already specified template string \"${INPUT_TEMPLSTR}\""
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --templ(-t) option needs parameter( input template file path )"
			exit 1
		fi
		if [ ! -f "$1" ]; then
			echo "[ERROR] could not find template file $1"
			exit 1
		fi
		INPUT_TEMPLFILE="$1"

	elif [ "$1" = "-s" ] || [ "$1" = "-S" ] || [ "$1" = "--str" ] || [ "$1" = "--STR" ] || [ "$1" = "--string" ] || [ "$1" = "--STRING" ]; then
		#
		# input template string
		#
		if [ -n "${INPUT_TEMPLSTR}" ]; then
			echo "[ERROR] Already specified template string ${INPUT_TEMPLSTR}"
			exit 1
		fi
		if [ -n "${INPUT_TEMPLFILE}" ]; then
			echo "[ERROR] Already specified template file ${INPUT_TEMPLFILE}"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --string(-s) option needs parameter( input template string )"
			exit 1
		fi
		INPUT_TEMPLSTR="$1"

	elif [ "$1" = "-a" ] || [ "$1" = "-A" ] || [ "$1" = "--async" ] || [ "$1" = "--ASYNC" ]; then
		#
		# async mode
		#
		if [ "${INPUT_ASYNCMODE}" -ne 0 ]; then
			echo "[ERROR] --async(-a) option is already specified"
			exit 1
		fi
		INPUT_ASYNCMODE=1

	else
		echo "[ERROR] unknown option $1"
		exit 1
	fi
	shift
done

#----------------------------------------------------------
# Set varibales and files
#----------------------------------------------------------
#
# Checking async mode
#
if [ "${INPUT_ASYNCMODE}" -eq 0 ]; then
	TEST_PROG="${DEFAULT_TEST_PROG}"
else
	TEST_PROG="${ASYNC_TEST_PROG}"
fi

#
# Make NODE_DEBUG environment
#
DEBUG_ENV_PARAM=""
if [ "${DEBUG_ENV_LEVEL}" -ge 4 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_DBG"
elif [ "${DEBUG_ENV_LEVEL}" -ge 3 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_MSG"
elif [ "${DEBUG_ENV_LEVEL}" -ge 2 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_WAN"
elif [ "${DEBUG_ENV_LEVEL}" -ge 1 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_ERR"
else
	DEBUG_ENV_PARAM="LOGLEVEL_SILENT"
fi
if [ -n "${DEBUG_ENV_CUSTOM}" ]; then
	if [ -n "${DEBUG_ENV_PARAM}" ]; then
		DEBUG_ENV_PARAM="${DEBUG_ENV_PARAM},"
	fi
	DEBUG_ENV_PARAM="${DEBUG_ENV_PARAM}${DEBUG_ENV_CUSTOM}"
fi

#
# Create Template file
#
rm -f /tmp/"${PRGNAME}".templ.*

if [ -z "${INPUT_TEMPLFILE}" ]; then
	#
	# Temporary template file
	#
	INPUT_TEMPLFILE="/tmp/${PRGNAME}.templ.$$"

	if [ "${INPUT_TEMPLSTR}" != "" ]; then
		#
		# Put input template string to temporary file
		#
		if ! echo "${INPUT_TEMPLSTR}" >"${INPUT_TEMPLFILE}"; then
			echo "[ERROR] Could not create ${INPUT_TEMPLFILE} file"
			exit 1
		fi
	else
		#
		# Get template string from stdin
		#
		if ! touch "${INPUT_TEMPLFILE}"; then
			echo "[ERROR] Could not create ${INPUT_TEMPLFILE} file"
			exit 1
		fi

		echo "---------------------------------------------------------------"
		echo " Please input template string."
		echo " You can end template string input by entering \"EOF\"."
		echo "---------------------------------------------------------------"

		IS_EOF=0
		while [ "${IS_EOF}" -eq 0 ]; do
			printf '> '
			read -r TEMPLLINE

			if [ "${TEMPLLINE}" = "EOF" ] || [ "${TEMPLLINE}" = "eof" ]; then
				IS_EOF=1
			else
				echo "${TEMPLLINE}" >> "${INPUT_TEMPLFILE}"
			fi
		done
		echo ""
	fi
fi

#
# Input template string
#
if [ "${DEBUG_ENV_LEVEL}" -ge 4 ]; then
	echo "---------------------------------------------------------------"
	echo " Template string"
	echo "---------------------------------------------------------------"
	sed -e 's/^/  /g' "${INPUT_TEMPLFILE}"
	echo "---------------------------------------------------------------"
fi

#==========================================================
# Do work
#==========================================================
cd "${SRCTOP}" || exit 1

if [ "${DEBUG_USE_INSPECT}" -eq 1 ]; then
	DEBUG_INSPECT_OPTION="--inspect"
	DEBUG_BREAK_OPTION="--debug-brk"
	DEBUG_PRINT_OPTIONS="${DEBUG_INSPECT_OPTION} ${DEBUG_BREAK_OPTION} "
	DEBUG_PRINT_PIPELINE=" | sed -e 's/127.0.0.1/${LOCAL_HOSTNAME}/'"
else
	DEBUG_PRINT_OPTIONS=""
	DEBUG_PRINT_PIPELINE=""
fi

if [ "${DEBUG_ENV_LEVEL}" -ge 4 ]; then
	echo "***** Run *****"
	echo "NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} R3TEMPLFILE=${INPUT_TEMPLFILE} R3VARFILE=${INPUT_VARFILE} node ${DEBUG_PRINT_OPTIONS}${TEST_PROG}${DEBUG_PRINT_PIPELINE}"
	echo ""
fi

if [ "${DEBUG_USE_INSPECT}" -eq 1 ]; then
	if ! NODE_PATH="${NODE_PATH}" NODE_DEBUG="${DEBUG_ENV_PARAM}" R3TEMPLFILE="${INPUT_TEMPLFILE}" R3VARFILE="${INPUT_VARFILE}" node "${DEBUG_INSPECT_OPTION}" "${DEBUG_BREAK_OPTION}" "${TEST_PROG}" 2>&1 | sed -e "s/127.0.0.1/${LOCAL_HOSTNAME}/"; then
		EXIT_CODE="$?"
		echo "[ERROR] Failed to run test with error code : ${EXIT_CODE}"
		exit 1
	fi
else
	if ! NODE_PATH="${NODE_PATH}" NODE_DEBUG="${DEBUG_ENV_PARAM}" R3TEMPLFILE="${INPUT_TEMPLFILE}" R3VARFILE="${INPUT_VARFILE}" node "${TEST_PROG}"; then
		EXIT_CODE="$?"
		echo "[ERROR] Failed to run test with error code : ${EXIT_CODE}"
		exit 1
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
