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
DISTDIR=$(cd "${SRCTOP}/dist" || exit 1; pwd)

#
# Variables
#
LOCAL_HOSTNAME="$(hostname -f | tr -d '\n')"
DEFAULT_TEST_PROG="tests/k2hr3template_test.js"
ASYNC_TEST_PROG="tests/k2hr3template_test_async.js"

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
#	CGRN=$(printf '\033[32m')
	CDEF=$(printf '\033[0m')
}

UnSetColor()
{
	CBLD=""
	CREV=""
	CRED=""
	CYEL=""
#	CGRN=""
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
#PRNTITLE()
#{
#	echo "${CGRN}${CREV}[TITLE]${CDEF} ${CGRN}$*${CDEF}"
#}

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

#PRNSUCCESS()
#{
#	echo ""
#	echo "${CBLD}${CGRN}${CREV}[SUCCEED]${CDEF} ${CGRN}$*${CDEF}"
#	echo ""
#}

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

	elif echo "$1" | grep -q -i -e "^-h$" -e "^--help$"; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif echo "$1" | grep -q -i -e "^-i$" -e "^--inspect$"; then
		if [ "${DEBUG_USE_INSPECT}" -ne 0 ]; then
			PRNERR "Already specified --inspect(-i) option"
			exit 1
		fi
		DEBUG_USE_INSPECT=1

	elif echo "$1" | grep -q -i -e "^-d$" -e "^--debuglevel$"; then
		#
		# DEBUG option
		#
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--debuglevel(-dl) option needs parameter(dbg/msg/warn/err/custom debug level)"
			exit 1
		fi
		if echo "$1" | grep -q -i -e "^dbg$" -e "^debug$"; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				PRNERR "--debuglevel(-dl) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=4
		elif echo "$1" | grep -q -i -e "^msg$" -e "^message$" -e "^info$"; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				PRNERR "--debuglevel(-dl) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=3
		elif echo "$1" | grep -q -i -e "^wan$" -e "^warn$" -e "^warning$"; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				PRNERR "--debuglevel(-dl) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=2
		elif echo "$1" | grep -q -i -e "^err$" -e "^error$"; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				PRNERR "--debuglevel(-dl) option already is set"
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

	elif echo "$1" | grep -q -i -e "^-v$" -e "^--varlist$"; then
		#
		# input variable list file path
		#
		if [ -n "${INPUT_VARFILE}" ]; then
			PRNERR "Already specified variable list file ${INPUT_VARFILE}"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--varlist(-v) option needs parameter( input variable JSON file path )"
			exit 1
		fi
		if [ ! -f "$1" ]; then
			PRNERR "could not find variable list file $1"
			exit 1
		fi
		INPUT_VARFILE="$1"

	elif echo "$1" | grep -q -i -e "^-t$" -e "^--templ$" -e "^--template$"; then
		#
		# input template file path
		#
		if [ -n "${INPUT_TEMPLFILE}" ]; then
			PRNERR "Already specified template file ${INPUT_TEMPLFILE}"
			exit 1
		fi
		if [ -n "${INPUT_TEMPLSTR}" ]; then
			PRNERR "Already specified template string \"${INPUT_TEMPLSTR}\""
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--templ(-t) option needs parameter( input template file path )"
			exit 1
		fi
		if [ ! -f "$1" ]; then
			PRNERR "could not find template file $1"
			exit 1
		fi
		INPUT_TEMPLFILE="$1"

	elif echo "$1" | grep -q -i -e "^-s$" -e "^--str$" -e "^--string$"; then
		#
		# input template string
		#
		if [ -n "${INPUT_TEMPLSTR}" ]; then
			PRNERR "Already specified template string ${INPUT_TEMPLSTR}"
			exit 1
		fi
		if [ -n "${INPUT_TEMPLFILE}" ]; then
			PRNERR "Already specified template file ${INPUT_TEMPLFILE}"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--string(-s) option needs parameter( input template string )"
			exit 1
		fi
		INPUT_TEMPLSTR="$1"

	elif echo "$1" | grep -q -i -e "^-a$" -e "^--async$"; then
		#
		# async mode
		#
		if [ "${INPUT_ASYNCMODE}" -ne 0 ]; then
			PRNERR "--async(-a) option is already specified"
			exit 1
		fi
		INPUT_ASYNCMODE=1

	else
		PRNERR "unknown option $1"
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
			PRNERR "Could not create ${INPUT_TEMPLFILE} file"
			exit 1
		fi
	else
		#
		# Get template string from stdin
		#
		if ! touch "${INPUT_TEMPLFILE}"; then
			PRNERR "Could not create ${INPUT_TEMPLFILE} file"
			exit 1
		fi

		PRNINFO "Please input template string."
		printf  "      You can end template string input by entering \"EOF\".\n"

		IS_EOF=0
		while [ "${IS_EOF}" -eq 0 ]; do
			printf '> '
			read -r TEMPLLINE

			if echo "${TEMPLLINE}" | grep -q -i "^eof$"; then
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
	PRNMSG "Template string"
	sed -e 's/^/  /g' "${INPUT_TEMPLFILE}"
	printf "\n"
fi

#==========================================================
# Do work
#==========================================================
#PRNTITLE "Test template engine"

cd "${DISTDIR}" || exit 1

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
	PRNINFO "Run : NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} R3TEMPLFILE=${INPUT_TEMPLFILE} R3VARFILE=${INPUT_VARFILE} node ${DEBUG_PRINT_OPTIONS}${TEST_PROG}${DEBUG_PRINT_PIPELINE}"
fi

if [ "${DEBUG_USE_INSPECT}" -eq 1 ]; then
	if ! NODE_PATH="${NODE_PATH}" NODE_DEBUG="${DEBUG_ENV_PARAM}" R3TEMPLFILE="${INPUT_TEMPLFILE}" R3VARFILE="${INPUT_VARFILE}" node "${DEBUG_INSPECT_OPTION}" "${DEBUG_BREAK_OPTION}" "${TEST_PROG}" 2>&1 | sed -e "s/127.0.0.1/${LOCAL_HOSTNAME}/"; then
		EXIT_CODE="$?"
		PRNERR "Failed to run test with error code : ${EXIT_CODE}"
		exit 1
	fi
else
	if ! NODE_PATH="${NODE_PATH}" NODE_DEBUG="${DEBUG_ENV_PARAM}" R3TEMPLFILE="${INPUT_TEMPLFILE}" R3VARFILE="${INPUT_VARFILE}" node "${TEST_PROG}"; then
		EXIT_CODE="$?"
		PRNERR "Failed to run test with error code : ${EXIT_CODE}"
		exit 1
	fi
fi

#PRNSUCCESS "Test template engine"

exit 0

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
