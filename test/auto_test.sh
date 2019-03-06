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

#
# Common
#
PROGRAM_NAME=`basename $0`
MYSCRIPTDIR=`dirname $0`
MYSCRIPTDIR=`cd ${MYSCRIPTDIR}; pwd`
SRCTOP=`cd ${MYSCRIPTDIR}/..; pwd`
COMMAND=""
CMD_PREFIX="auto_"
CMD_SUFFIX="_spec.js"

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
	watcher
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

PrintUsage()
{
	echo "Usage:   $1 [--production | --development(default)]"
	echo "            [--logger(-l)]"
	echo "            [--debuglevel(-d) DBG/MSG/WARN/ERR/(custom debug level)]"
	echo "            Command"
	echo ""
	echo "Option:  --production     : Set 'production' to NODE_ENV environment"
	echo "                            (exclusive with the '--development' option)"
	echo "         --development    : Set 'development' to NODE_ENV environment"
	echo "                            (This option is default and exclusive with"
	echo "                            the '--production' option)"
	echo "         --logger(-l)     : Specify when logging by morgan"
	echo "                            (This can be substituted by setting the"
	echo "                            'NODE_LOGGER' environment variable to 'yes'"
	echo "                            or 'no')"
	echo "         --debuglevel(-d) : Specify the level of debug output."
	echo "                            (DBG/MSG/WARN/ERR/custom debug level)"
	echo ""
	echo "Command: all              : All API test"
	echo "         version          : Version API test"
	echo "         list             : List API test"
	echo "         usertokens       : User Token API test"
	echo "         resource         : Resource API test"
	echo "         policy           : Policy API test"
	echo "         role             : Role API test"
	echo "         service          : Service API test"
	echo "         acr              : Accessing Cross Role(ACR) API test"
	echo "         userdata         : Get userdata for openstack API test"
	echo "         watcher          : Watcher sub process test"
	echo ""
}

#
# Parse arguments
#
NODE_ENV_VALUE=""
DEBUG_ENV_CUSTOM=""
DEBUG_ENV_LEVEL=0
IS_LOGGING=""

while [ $# -ne 0 ]; do
	if [ "X$1" = "X" ]; then
		break

	elif [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		PrintUsage ${PROGRAM_NAME}
		exit 0

	elif [ "X$1" = "X--production" -o "X$1" = "X--PRODUCTION" ]; then
		if [ "X${NODE_ENV_VALUE}" != "X" ]; then
			echo "ERROR: already specified --production or --development option"
			exit 1
		fi
		NODE_ENV_VALUE="production"

	elif [ "X$1" = "X--development" -o "X$1" = "X--DEVELOPMENT" ]; then
		if [ "X${NODE_ENV_VALUE}" != "X" ]; then
			echo "ERROR: already specified --production or --development option"
			exit 1
		fi
		NODE_ENV_VALUE="development"

	elif [ "X$1" = "X--logger" -o "X$1" = "X--LOGGER" -o "X$1" = "X-l" -o "X$1" = "X-L" ]; then
		if [ "X${IS_LOGGING}" != "X" ]; then
			echo "ERROR: --logger(-l) option already is set"
			exit 1
		fi
		IS_LOGGING="yes"

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
# NODE_ENV_VALUE
#
if [ "X${NODE_ENV_VALUE}" = "X" ]; then
	NODE_ENV_VALUE="development"
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
# Logging for NODE_LOGGER
#
if [ "X${IS_LOGGING}" = "Xyes" ]; then
	NODE_LOGGER=""
else
	if [ "X${NODE_LOGGER}" = "Xyes" ]; then
		NODE_LOGGER=""
	elif [ "X${NODE_LOGGER}" = "Xno" ]; then
		NODE_LOGGER="no"
	elif [ "X${NODE_LOGGER}" != "X" ]; then
		echo "WARNING: NODE_LOGGER environment has wrong value(${NODE_LOGGER}), then do logging(default)"
		NODE_LOGGER=""
	fi
fi

#
# Executing(current at SRCTOP)
#
cd ${SRCTOP}
if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
	echo "***** RUN *****"
	echo "test/auto_init_config_json.sh"
	echo "NODE_PATH=${NODE_PATH} NODE_ENV=${NODE_ENV_VALUE} NODE_DEBUG=${DEBUG_ENV_PARAM} NODE_LOGGER=${NODE_LOGGER} NODE_CONFIG_DIR= node_modules/.bin/mocha test/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}"
	echo "***************"
fi

test/auto_init_config_json.sh
if [ $? -ne 0 ]; then
	echo "ERROR: Could not initialize local.json(symbolic link to dummy)"
	exit 1
fi

NODE_PATH=${NODE_PATH} NODE_ENV=${NODE_ENV_VALUE} NODE_DEBUG=${DEBUG_ENV_PARAM} NODE_LOGGER=${NODE_LOGGER} NODE_CONFIG_DIR= node_modules/.bin/mocha test/${CMD_PREFIX}${COMMAND}${CMD_SUFFIX}
if [ $? -ne 0 ]; then
	echo "ERROR: The test failed."
	test/auto_init_config_json.sh -restore
	exit 1
fi

test/auto_init_config_json.sh -restore
if [ $? -ne 0 ]; then
	echo "ERROR: Could not restore local.json"
	exit 1
fi

exit 0

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
