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
# CREATE:   Wed Jun 8 2017
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
CMD_PREFIX="manual_"
CMD_SUFFIX=".js"

#
# Commands
#
COMMANDS="
	version_get
	usertoken_gethead
	usertoken_postput
	policy_delete
	policy_gethead
	policy_postput
	resource_delete
	resource_gethead
	resource_postput
	role_delete
	role_gethead
	role_postput
	tenant_delete
	tenant_gethead
	tenant_postput
	service_postput
	service_gethead
	service_delete
	acr_postput
	acr_get
	acr_delete
	list_gethead
	userdata_get
	extdata_get
	allusertenant_get
	k2hr3keys_get
"

#==============================================================
# Utility functions
#==============================================================
#
# Usage
#
PrintUsage()
{
	echo "Usage:   $1 [--apihost(-a) hostname]"
	echo "            [--apiport(-p) port]"
	echo "            [--https | --http]"
	echo "            [--debuglevel(-d) DBG/MSG/WARN/ERR/(custom debug level)]"
	echo "            <Command>"
	echo ""
	echo "Option:"
	echo "         --apihost(-a)          : Specify k2hr3 API hostname used by this test"
	echo "         --apiport(-p)          : Specify k2hr3 API port used by this test"
	echo "         --sec(-s)              : Use HTTPS to access k2hr3 API server"
	echo "         --https                : Same as '--sec' option"
	echo "         --debuglevel(-d)       : Specify the level of debug output."
	echo "                                  (DBG/MSG/WARN/ERR/custom debug level)"
	echo ""
	echo "Command:"
	echo "         version_get            : Get version information"
	echo ""
	echo "         usertoken_postput      : Get User Token(v1)"
	echo "         usertoken_gethead      : Get User Token Information(v1)"
	echo ""
	echo "         resource_postput       : Post(Put) resource(v1)"
	echo "         resource_gethead       : Get(Head) resource(v1)"
	echo "         resource_delete        : Delete resource(v1)"
	echo ""
	echo "         policy_postput         : Post(Put) policy(v1)"
	echo "         policy_gethead         : Get(Head) policy(v1)"
	echo "         policy_delete          : Delete policy(v1)"
	echo ""
	echo "         role_postput           : Post(Put) role(v1)"
	echo "         role_gethead           : Get(Head) role(v1)"
	echo "         role_delete            : Delete role(v1)"
	echo ""
	echo "         tenant_postput         : Post(Put) tenant(v1)"
	echo "         tenant_gethead         : Get(Head) tenant(v1)"
	echo "         tenant_delete          : Delete tenant(v1)"
	echo ""
	echo "         service_postput        : Post(Put) service(v1)"
	echo "         service_gethead        : Get(head) service(v1)"
	echo "         service_delete         : Delete service(v1)"
	echo ""
	echo "         acr_postput            : Post(Put) ACR(v1)"
	echo "         acr_get                : Get ACR(v1)"
	echo "         acr_delete             : Delete ACR(v1)"
	echo ""
	echo "         list_gethead           : Get(Head) children list for path(v1)"
	echo ""
	echo "         userdata_get           : Get userdata for openstack instance(v1)"
	echo ""
	echo "         extdata_get            : Get extdata for user defined data(v1)"
	echo ""
	echo "         allusertenant_get      : Get all user and tenant list in k2hr3"
	echo "         k2hr3keys_get          : Get common key name object for debug"
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
APIPORT=0
APIHOST=""
HTTPS_ENV=""
DEBUG_ENV_LEVEL=0
DEBUG_ENV_CUSTOM=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif [ "$1" = "-h" ] || [ "$1" = "-H" ] || [ "$1" = "--help" ] || [ "$1" = "--HELP" ]; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif [ "$1" = "-a" ] || [ "$1" = "-A" ] || [ "$1" = "--apihost" ] || [ "$1" = "--APIHOST" ]; then
		#
		# API HOST
		#
		if [ -n "${APIHOST}" ]; then
			echo "[ERROR] already specified --apihost option"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --apihost(-h) option needs parameter(hostname)"
			exit 1
		fi
		APIHOST="$1"

	elif [ "$1" = "-p" ] || [ "$1" = "-P" ] || [ "$1" = "--apiport" ] || [ "$1" = "--APIPORT" ]; then
		#
		# API PORT
		#
		if [ "${APIPORT}" -ne 0 ]; then
			echo "[ERROR] already specified --apiport option"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
				echo "[ERROR] --apiport(-p) option needs parameter(port number)"
			exit 1
		fi
		if echo "$1" | grep -q '[^0-9]'; then
			echo "[ERROR] --apiport(-p) option parameter must be number"
			exit 1
		elif [ "$1" -eq 0 ]; then
			echo "[ERROR] --apiport(-p) option parameter must be positive number"
			exit 1
		fi
		APIPORT="$1"

	elif [ "$1" = "--https" ] || [ "$1" = "--HTTPS" ]; then
		if [ -n "${HTTPS_ENV}" ]; then
			echo "[ERROR] already specified --https or --http option"
			exit 1
		fi
		HTTPS_ENV="yes"

	elif [ "$1" = "--http" ] || [ "$1" = "--HTTP" ]; then
		if [ -n "${HTTPS_ENV}" ]; then
			echo "[ERROR] already specified --https or --http option"
			exit 1
		fi
		HTTPS_ENV="no"

	elif [ "$1" = "-d" ] || [ "$1" = "-D" ] || [ "$1" = "--debuglevel" ] || [ "$1" = "--DEBUGLEVEL" ]; then
		#
		# DEBUG option
		#
		shift
		if [ $# -eq 0 ]; then
			echo "[ERROR] --debuglevel(-d) option needs parameter(dbg/msg/warn/err)"
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
# Check HTTPS
#
if [ -z "${HTTPS_ENV}" ]; then
	HTTPS_ENV="yes"
fi

#
# Check K2HR3 API HOST/PORT
#
if [ -z "${APIHOST}" ]; then
	APIHOST="$(hostname | tr -d '\n')"
fi
if [ "${APIPORT}" -eq 0 ]; then
	if [ "${HTTPS_ENV}" = "yes" ]; then
		APIPORT=443
	else
		APIPORT=3000
	fi
fi

#==========================================================
# Do work
#==========================================================
cd "${SRCTOP}" || exit 1

if [ "${DEBUG_ENV_LEVEL}" -ge 4 ]; then
	echo "***** RUN *****"
	echo "NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} APIHOST=${APIHOST} APIPORT=${APIPORT} HTTPS_ENV=${HTTPS_ENV} node ${DEBUG_OPTION} tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"
	echo "***************"
fi

if ! /bin/sh -c "NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} APIHOST=${APIHOST} APIPORT=${APIPORT} HTTPS_ENV=${HTTPS_ENV} node ${DEBUG_OPTION} tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"; then
	EXIT_CODE="$?"
	echo "[ERROR] Failed to run command with exit code : ${EXIT_CODE}"
	exit "${EXIT_CODE}"
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
