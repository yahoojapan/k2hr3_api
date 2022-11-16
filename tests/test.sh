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

#
# Variables
#
COMMAND=""
CMD_PREFIX="auto_"
CMD_SUFFIX="_spec.js"
AUTO_INIT_SH="tests/auto_init_config_json.sh"

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
	service
	acr
	userdata
	extdata
	watcher
"

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
	echo "  --timeout(-t)       : Specify the mocha timeout in milliseconds mocha sets a timeout of 2000ms by default,"
	echo "                        but this test script currently sets it to 2000ms. This option can be used to change the timeout value."
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
DEBUG_ENV_LEVEL=0
DEBUG_ENV_CUSTOM=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif [ "$1" = "-h" ] || [ "$1" = "-H" ] || [ "$1" = "--help" ] || [ "$1" = "--HELP" ]; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif [ "$1" = "-prod" ] || [ "$1" = "-PROD" ] || [ "$1" = "--production" ] || [ "$1" = "--PRODUCTION" ]; then
		if [ -n "${NODE_ENV_VALUE}" ]; then
			echo "[ERROR] already specified --production(-prod) or --development(-dev) option"
			exit 1
		fi
		NODE_ENV_VALUE="production"

	elif [ "$1" = "-dev" ] || [ "$1" = "-DEV" ] || [ "$1" = "--development" ] || [ "$1" = "--DEVELOPMENT" ]; then
		if [ "${NODE_ENV_VALUE}" != "" ]; then
			echo "[ERROR] already specified --production(-prod) or --development(-dev) option"
			exit 1
		fi
		NODE_ENV_VALUE="development"

	elif [ "$1" = "-l" ] || [ "$1" = "-L" ] || [ "$1" = "--logger" ] || [ "$1" = "--LOGGER" ]; then
		if [ "${IS_LOGGING}" -eq 1 ]; then
			echo "[ERROR] Already --logger(-l) option is set"
			exit 1
		fi
		IS_LOGGING=1

	elif [ "$1" = "-d" ] || [ "$1" = "-D" ] || [ "$1" = "--debuglevel" ] || [ "$1" = "--DEBUGLEVEL" ]; then
		#
		# DEBUG option
		#
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --debuglevel(-d) option needs parameter(dbg/msg/warn/err/custom debug level)"
			exit 1
		fi
		if [ "$1" = "dbg" ] || [ "$1" = "DBG" ] || [ "$1" = "debug" ] || [ "$1" = "DEBUG" ]; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				echo "[ERROR] --debuglevel(-d) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=4
		elif [ "$1" = "msg" ] || [ "$1" = "MSG" ] || [ "$1" = "message" ] || [ "$1" = "MESSAGE" ] || [ "$1" = "info" ] || [ "$1" = "INFO" ]; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				echo "[ERROR] --debuglevel(-d) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=3
		elif [ "$1" = "warn" ] || [ "$1" = "WARN" ] || [ "$1" = "warning" ] || [ "$1" = "WARNING" ]; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				echo "[ERROR] --debuglevel(-d) option already is set"
				exit 1
			fi
			DEBUG_ENV_LEVEL=2
		elif [ "$1" = "err" ] || [ "$1" = "ERR" ] || [ "$1" = "error" ] || [ "$1" = "ERROR" ]; then
			if [ "${DEBUG_ENV_LEVEL}" -ne 0 ]; then
				echo "[ERROR] --debuglevel(-d) option already is set"
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

	elif [ "$1" = "-t" ] || [ "$1" = "-T" ] || [ "$1" = "--timeout" ] || [ "$1" = "--TIMEOUT" ]; then
		#
		# timeout option
		#
		if [ -n "${TIMEOUT}" ]; then
			echo "[ERROR] Already --timeout(-t) option is set"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --timeout(-t) option needs parameter(millisecond)"
			exit 1
		fi
		# check number value
		if echo "$1" | grep -q '[^0-9]'; then
			echo "[ERROR] --timeout(-t) option parameter must be number(millisecond)"
			exit 1
		fi
		TIMEOUT="$1"

	else
		#
		# Run test command
		#
		if [ -n "${COMMAND}" ]; then
			echo "[ERROR] Already specified command name(${COMMAND}), could not specify multi command $1"
			exit 1
		fi
		if ! COMMAND=$(CheckCommands "$1"); then
			echo "[ERROR] $1 is not command name"
			exit 1
		fi
	fi
	shift
done

#
# Check Command
#
if [ -z "${COMMAND}" ]; then
	echo "[ERROR] Command name is not specified"
	exit 1
fi

#
# Check timeout
#
if [ -z "${TIMEOUT}" ]; then
	TIMEOUT="3000"
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
	elif [ "${NODE_LOGGER}" = "yes" ] || [ "${NODE_LOGGER}" = "YES" ]; then
		NODE_LOGGER=""
	elif [ "${NODE_LOGGER}" = "no" ] || [ "${NODE_LOGGER}" = "NO" ]; then
		NODE_LOGGER="no"
	else
		echo "[WARNING] NODE_LOGGER environment has wrong value(${NODE_LOGGER}), then do logging(default)"
		NODE_LOGGER=""
	fi
fi

#==========================================================
# Do work
#==========================================================
cd "${SRCTOP}" || exit 1

if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
	echo "***** RUN *****"
	echo "${AUTO_INIT_SH} --set"
	echo "NODE_PATH=${NODE_PATH} NODE_ENV=${NODE_ENV_VALUE} NODE_DEBUG=${DEBUG_ENV_PARAM} NODE_LOGGER=${NODE_LOGGER} NODE_CONFIG_DIR= node_modules/.bin/mocha tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"
	echo "***************"
fi

if ! "${AUTO_INIT_SH}" --set; then
	echo "[ERROR] Could not initialize local.json(symbolic link to dummy)"
	exit 1
fi

if ! NODE_PATH="${NODE_PATH}" NODE_ENV="${NODE_ENV_VALUE}" NODE_DEBUG="${DEBUG_ENV_PARAM}" NODE_LOGGER="${NODE_LOGGER}" NODE_CONFIG_DIR='' node_modules/.bin/mocha --timeout "${TIMEOUT}" "tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"; then
	echo "[ERROR] Failed test."
	if ! "${AUTO_INIT_SH}" --restore; then
		echo "[ERROR] Could not restore local.json"
	fi
	exit 1
fi

if ! "${AUTO_INIT_SH}" --restore; then
	echo "[ERROR] Could not restore local.json"
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
