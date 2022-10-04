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
# CREATE:   Wed Jun 8 2017
# REVISION:
#

#
# Common
#
PROGRAM_NAME=`basename $0`
MYSCRIPTDIR=`dirname $0`
MYSCRIPTDIR=`cd ${MYSCRIPTDIR}; pwd`
SRCTOP=`cd ${MYSCRIPTDIR}/..; pwd`
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

CheckCommands()
{
	for command in ${COMMANDS}; do
		if [ "X$1" = "X${command}" ]; then
			echo ${command}
			return
		fi
	done
	echo ""
}

#
# Usage
#
PrintUsage()
{
	echo "Usage:   $1 [--apihost(-a) hostname]"
	echo "            [--apiport(-p) port]"
	echo "            [--sec(-s) | --https]"
	echo "            [--debuglevel(-d) DBG/MSG/WARN/ERR/(custom debug level)]"
	echo "            Command-Name"
	echo ""
	echo "Option:  --apihost(-a)          : Specify k2hr3 API hostname used by this test"
	echo "         --apiport(-p)          : Specify k2hr3 API port used by this test"
	echo "         --sec(-s)              : Use HTTPS to access k2hr3 API server"
	echo "         --https                : Same as '--sec' option"
	echo "         --debuglevel(-d)       : Specify the level of debug output."
	echo "                                  (DBG/MSG/WARN/ERR/custom debug level)"
	echo ""
	echo "Command: version_get            : Get version information"
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
# Parse arguments
#
DEBUG_ENV_CUSTOM=""
DEBUG_ENV_LEVEL=0
APIPORT=
APIHOST=
HTTPS_ENV=

while [ $# -ne 0 ]; do
	if [ "X$1" = "X" ]; then
		break

	elif [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		PrintUsage ${PROGRAM_NAME}
		exit 0

	elif [ "X$1" = "X--apihost" -o "X$1" = "X--APIHOST" -o "X$1" = "X-a" -o "X$1" = "X-A" ]; then
		#
		# API HOST
		#
		if [ "X${APIHOST}" != "X" ]; then
			echo "ERROR: already specified --apihost option"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "ERROR: --apihost(-h) option needs parameter(hostname)"
			exit 1
		fi
		APIHOST=$1

	elif [ "X$1" = "X--apiport" -o "X$1" = "X--APIPORT" -o "X$1" = "X-p" -o "X$1" = "X-P" ]; then
		#
		# API PORT
		#
		if [ "X${APIPORT}" != "X" ]; then
			echo "ERROR: already specified --apiport option"
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
				echo "ERROR: --apiport(-p) option needs parameter(port number)"
			exit 1
		fi
		APIPORT=$1

	elif [ "X$1" = "X--sec" -o "X$1" = "X--SEC" -o "X$1" = "X--https" -o "X$1" = "X--HTTPS" -o "X$1" = "X-s" -o "X$1" = "X-S" ]; then
		if [ "X${HTTPS_ENV}" != "X" ]; then
			echo "ERROR: already specified --sec or --https option"
			exit 1
		fi
		HTTPS_ENV="yes"

	elif [ "X$1" = "X--debuglevel" -o "X$1" = "X--DEBUGLEVEL" -o "X$1" = "X-d" -o "X$1" = "X-D" ]; then
		#
		# DEBUG option
		#
		shift
		if [ $# -eq 0 ]; then
			echo "ERROR: --debuglevel(-d) option needs parameter(dbg/msg/warn/err)"
			exit 1
		fi

		if [ "X$1" = "Xdbg" -o "X$1" = "XDBG" -o "X$1" = "Xdebug" -o "X$1" = "XDEBUG" ]; then
			if [ ${DEBUG_ENV_LEVEL} -ne 0 ]; then
				echo "ERROR: --debuglevel(-d) option already is set"
				exit 1
			fi
			if [ ${DEBUG_ENV_LEVEL} -lt 4 ]; then
				DEBUG_ENV_LEVEL=4
			fi

		elif [ "X$1" = "Xmsg" -o "X$1" = "XMSG" -o "X$1" = "Xmessage" -o "X$1" = "XMESSAGE" -o "X$1" = "Xinfo" -o "X$1" = "XINFO" ]; then
			if [ ${DEBUG_ENV_LEVEL} -ne 0 ]; then
				echo "ERROR: --debuglevel(-d) option already is set"
				exit 1
			fi
			if [ ${DEBUG_ENV_LEVEL} -lt 3 ]; then
				DEBUG_ENV_LEVEL=3
			fi

		elif [ "X$1" = "Xwarn" -o "X$1" = "XWARN" -o "X$1" = "Xwarning" -o "X$1" = "XWARNING" ]; then
			if [ ${DEBUG_ENV_LEVEL} -ne 0 ]; then
				echo "ERROR: --debuglevel(-d) option already is set"
				exit 1
			fi
			if [ ${DEBUG_ENV_LEVEL} -lt 2 ]; then
				DEBUG_ENV_LEVEL=2
			fi

		elif [ "X$1" = "Xerr" -o "X$1" = "XERR" -o "X$1" = "Xerror" -o "X$1" = "XERROR" ]; then
			if [ ${DEBUG_ENV_LEVEL} -ne 0 ]; then
				echo "ERROR: --debuglevel(-d) option already is set"
				exit 1
			fi
			if [ ${DEBUG_ENV_LEVEL} -lt 1 ]; then
				DEBUG_ENV_LEVEL=1
			fi

		else
			if [ "X${DEBUG_ENV_CUSTOM}" != "X" ]; then
				DEBUG_ENV_CUSTOM="${DEBUG_ENV_CUSTOM},"
			fi
			DEBUG_ENV_CUSTOM="${DEBUG_ENV_CUSTOM}$1"
		fi

	else
		#
		# Run test command
		#
		if [ "X${COMMAND}" != "X" ]; then
			echo "ERROR: Already specified command name(${COMMAND}), could not specify multi command $1"
			exit 1
		fi

		COMMAND=`CheckCommands $1`
		if [ "X${COMMAND}" = "X" ]; then
			echo "ERROR: $1 is not command name"
			exit 1
		fi
	fi
	shift
done

#
# Command
#
if [ "X${COMMAND}" = "X" ]; then
	echo "ERROR: command name is not specified"
	echo ""
	PrintUsage ${PROGRAM_NAME}
	exit 1
fi

#
# Make NODE_DEBUG environment
#
DEBUG_ENV_PARAM=""
if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_DBG"
elif [ ${DEBUG_ENV_LEVEL} -ge 3 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_MSG"
elif [ ${DEBUG_ENV_LEVEL} -ge 2 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_WAN"
elif [ ${DEBUG_ENV_LEVEL} -ge 1 ]; then
	DEBUG_ENV_PARAM="LOGLEVEL_ERR"
else
	DEBUG_ENV_PARAM="LOGLEVEL_SILENT"
fi

if [ "X${DEBUG_ENV_CUSTOM}" != "X" ]; then
	if [ "X${DEBUG_ENV_PARAM}" != "X" ]; then
		DEBUG_ENV_PARAM="${DEBUG_ENV_PARAM},"
	fi
	DEBUG_ENV_PARAM="${DEBUG_ENV_PARAM}${DEBUG_ENV_CUSTOM}"
fi

#
# HTTPS
#
if [ "X${HTTPS_ENV}" != "X" ]; then
	HTTPS_ENV="yes"
fi

#
# K2HR3 API HOST/PORT
#
if [ "X${APIHOST}" = "X" ]; then
	APIHOST=`hostname`
fi
if [ "X${APIPORT}" = "X" ]; then
	if [ "X${HTTPS_ENV}" != "X" ]; then
		APIPORT=443
	else
		APIPORT=3000
	fi
fi


#
# Executing
#
cd ${SRCTOP}
if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
	echo "***** RUN *****"
	echo "NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} APIHOST=${APIHOST} APIPORT=${APIPORT} HTTPS_ENV=${HTTPS_ENV} node ${DEBUG_OPTION} tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"
	echo "***************"
fi
NODE_PATH=${NODE_PATH} NODE_DEBUG=${DEBUG_ENV_PARAM} APIHOST=${APIHOST} APIPORT=${APIPORT} HTTPS_ENV=${HTTPS_ENV} node ${DEBUG_OPTION} tests/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
