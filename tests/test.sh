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
# CREATE:   Tue Dec 26 2017
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
DISTTESTSDIR=$(cd "${DISTDIR}/tests" || exit 1; pwd)

#
# Variables
#
COMMAND=""
CMD_PREFIX="auto_"
CMD_SUFFIX="_spec.js"
AUTO_INIT_SH="tests/auto_init_config_json.sh"
DEBUG_ENV_LEVEL=0

#
# Commands
#
COMMANDS="
	all
	version
	list
	usertokens
	resource
	policy
	role
	tenant
	service
	acr
	userdata
	extdata
	watcher
"

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

PRNWARN()
{
	echo "${CBLD}${CYEL}[WARNING]${CDEF} ${CYEL}$*${CDEF}"
}

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
	echo "Usage:   $1 [--production(-prod) | --development(-dev)]"
	echo "            [--logger(-l)]"
	echo "            [--timeout <ms>]"
	echo "            [--debuglevel(-d) DBG/MSG/WARN/ERR/(custom debug level)]"
	echo "            Command"
	echo ""
	echo "Option:"
	echo "  --production(-prod) : Set 'production' to NODE_ENV environment (exclusive with the '--development' option)"
	echo "  --development(-dev) : Set 'development' to NODE_ENV environment (this is default and exclusive with the '--production' option)"
	echo "  --logger(-l)        : Specify when logging by morgan (this can be substituted by setting the 'NODE_LOGGER' environment variable to 'yes' or 'no')"
	echo "  --timeout(-t)       : Specify the mocha timeout in milliseconds mocha sets a timeout of 20000ms by default,"
	echo "                        but this test script currently sets it to 20000ms. This option can be used to change the timeout value."
	echo "  --debuglevel(-d)    : Specify the level of debug output (DBG/MSG/WARN/ERR/custom debug level)"
	echo ""
	echo "Command:"
	echo "  all                 : All API test"
	echo "  version             : Version API test"
	echo "  list                : List API test"
	echo "  usertokens          : User Token API test"
	echo "  resource            : Resource API test"
	echo "  policy              : Policy API test"
	echo "  role                : Role API test"
	echo "  tenant              : Tenant API test"
	echo "  service             : Service API test"
	echo "  acr                 : Accessing Cross Role(ACR) API test"
	echo "  userdata            : Get userdata for openstack API test"
	echo "  extdata             : Get extdata for user defined data"
	echo "  watcher             : Watcher sub process test"
	echo ""
}

#
# Check Commands
#
CheckCommands()
{
	if [ -n "$1" ]; then
		for command in ${COMMANDS}; do
			if [ "$1" = "${command}" ]; then
				echo "${command}"
				return 0
			fi
		done
	fi
	echo ""
	return 1
}

#==========================================================
# Parse options
#==========================================================
NODE_ENV_VALUE=""
IS_LOGGING=0
TIMEOUT=""
DEBUG_ENV_CUSTOM=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif echo "$1" | grep -q -i -e "^-h$" -e "^--help$"; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif echo "$1" | grep -q -i -e "^-prod$" -e "^--production$"; then
		if [ -n "${NODE_ENV_VALUE}" ]; then
			PRNERR "already specified --production(-prod) or --development(-dev) option"
			exit 1
		fi
		NODE_ENV_VALUE="production"

	elif echo "$1" | grep -q -i -e "^-dev$" -e "^--development$"; then
		if [ "${NODE_ENV_VALUE}" != "" ]; then
			PRNERR "already specified --production(-prod) or --development(-dev) option"
			exit 1
		fi
		NODE_ENV_VALUE="development"

	elif echo "$1" | grep -q -i -e "^-l$" -e "^--logger$"; then
		if [ "${IS_LOGGING}" -eq 1 ]; then
			PRNERR "Already --logger(-l) option is set"
			exit 1
		fi
		IS_LOGGING=1

	elif echo "$1" | grep -q -i -e "^-d$" -e "^--debuglevel$"; then
		#
		# DEBUG option
		#
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--debuglevel(-d) option needs parameter(dbg/msg/warn/err/custom debug level)"
			exit 1
		fi
		if echo "$1" | grep -q -i -e "^dbg$" -e "^debug$"; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				PRNERR "--debuglevel(-d) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=4
		elif echo "$1" | grep -q -i -e "^msg$" -e "^message$" -e "^info$"; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				PRNERR "--debuglevel(-d) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=3
		elif echo "$1" | grep -q -i -e "^wan$" -e "^warn$" -e "^warning$"; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				PRNERR "--debuglevel(-d) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=2
		elif echo "$1" | grep -q -i -e "^err$" -e "^error$"; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				PRNERR "--debuglevel(-d) option already is set"
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

	elif echo "$1" | grep -q -i -e "^-t$" -e "^--timeout$"; then
		#
		# timeout option
		#
		if [ -n "${TIMEOUT}" ]; then
			PRNERR "Already --timeout(-t) option is set"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			PRNERR "--timeout(-t) option needs parameter(millisecond)"
			exit 1
		fi
		# check number value
		if echo "$1" | grep -q '[^0-9]'; then
			PRNERR "--timeout(-t) option parameter must be number(millisecond)"
			exit 1
		fi
		TIMEOUT="$1"

	else
		#
		# Run test command
		#
		if [ -n "${COMMAND}" ]; then
			PRNERR "Already specified command name(${COMMAND}), could not specify multi command $1"
			exit 1
		fi
		if ! COMMAND=$(CheckCommands "$1"); then
			PRNERR "$1 is not command name"
			exit 1
		fi
	fi
	shift
done

#
# Check Command
#
if [ -z "${COMMAND}" ]; then
	PRNERR "Command name is not specified"
	exit 1
fi

#
# Check timeout
#
if [ -z "${TIMEOUT}" ]; then
	TIMEOUT="20000"
fi

#
# Check NODE_ENV_VALUE
#
if [ -z "${NODE_ENV_VALUE}" ]; then
	NODE_ENV_VALUE="development"
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
# Logging for NODE_LOGGER
#
if [ "${IS_LOGGING}" -eq 1 ]; then
	NODE_LOGGER=""
else
	if [ -z "${NODE_LOGGER}" ]; then
		#
		# Nothing to do for default
		#
		:
	elif echo "${NODE_LOGGER}" | grep -q -i -e "^y$" -e "^yes$"; then
		NODE_LOGGER=""
	elif echo "${NODE_LOGGER}" | grep -q -i -e "^n$" -e "^no$"; then
		NODE_LOGGER="no"
	else
		PRNWARN "NODE_LOGGER environment has wrong value(${NODE_LOGGER}), then do logging(default)"
		NODE_LOGGER=""
	fi
fi

#
# Check mocha path
#
if ! npm list mocha --depth=0 >/dev/null 2>&1; then
	PRNINFO "Not found mocha package, so try to install it."
	if ! npm install mocha >/dev/null 2>&1; then
		PRNERR "Could not install mocha."
		exit 1
	fi
fi
if [ ! -f "${SRCTOP}/node_modules/.bin/mocha" ]; then
	PRNERR "Not found mocha program"
	exit 1
fi
MOCHA_BIN="${SRCTOP}/node_modules/.bin/mocha"

#==========================================================
# Do work
#==========================================================
PRNTITLE "Test : ${COMMAND}"

cd "${SRCTOP}" || exit 1

if [ "${DEBUG_ENV_LEVEL}" -ge 4 ]; then
	PRNINFO "Run : ${AUTO_INIT_SH} --set"
	PRNINFO "      NODE_PATH=${NODE_PATH} NODE_ENV=${NODE_ENV_VALUE} NODE_DEBUG=${DEBUG_ENV_PARAM} NODE_LOGGER=${NODE_LOGGER} NODE_CONFIG_DIR='' ${MOCHA_BIN} --timeout ${TIMEOUT} ${DISTTESTSDIR}/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"
fi

if ! "${AUTO_INIT_SH}" --set; then
	PRNERR "Could not initialize local.json5(symbolic link to dummy)"
	exit 1
fi

if ! NODE_PATH="${NODE_PATH}" NODE_ENV="${NODE_ENV_VALUE}" NODE_DEBUG="${DEBUG_ENV_PARAM}" NODE_LOGGER="${NODE_LOGGER}" NODE_CONFIG_DIR='' "${MOCHA_BIN}" --timeout "${TIMEOUT}" "${DISTTESTSDIR}/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"; then
	PRNERR "Failed test."
	if ! "${AUTO_INIT_SH}" --restore; then
		PRNERR "Could not restore local.json5"
	fi
	PRNFAILURE "Failed to run tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"
	exit 1
fi

if ! "${AUTO_INIT_SH}" --restore; then
	PRNERR "Could not restore local.json5"
	PRNFAILURE "Failed to run tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"
	exit 1
fi

PRNSUCCESS "Run tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"

exit 0

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
