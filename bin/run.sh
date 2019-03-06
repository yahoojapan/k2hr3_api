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
CMDLINE_PROCESS_NAME=$0
CMDLINE_ALL_PARAM=$@
PROGRAM_NAME=`basename ${CMDLINE_PROCESS_NAME}`
MYSCRIPTDIR=`dirname ${CMDLINE_PROCESS_NAME}`
MYSCRIPTDIR=`cd ${MYSCRIPTDIR}; pwd`
SRCTOP=`cd ${MYSCRIPTDIR}/..; pwd`
HOST=`hostname`

MYPROCIDFILE=""
MYMAINPROCIDFILE="/tmp/${PROGRAM_NAME}.pid"
MYWATCHPROCIDFILE="/tmp/${PROGRAM_NAME}-watch.pid"
TARGETPROG=""
WWWPROG="bin/www"
WATCHPROG="bin/watcher"

#
# Usage
#
PrintUsage()
{
	echo "Usage:   $1 [--production(default) | --development]"
	echo "            [--stop]"
	echo "            [--background(-bg) | --foreground(-fg)]"
	echo "            [--debug(-d) | --debug-nobrk(-dnobrk)]"
	echo "            [--debuglevel DBG/MSG/WARN/ERR/(custom debug level)]"
	echo "            [--watcher [--oneshot]]"
	echo ""
	echo "Option:  --production           : Set 'production' to NODE_ENV environment"
	echo "                                  (This option is default and exclusive with"
	echo "                                  the '--development' option)"
	echo "         --development          : Set 'development' to NODE_ENV environment"
	echo "                                  (exclusive with the '--production' option)"
	echo "         --stop                 : Stop www or watcher nodejs process"
	echo "         --debug(-d)            : Run with nodejs inspector option"
	echo "         --debug-nobrk(-dnobrk) : Run with nodejs inspector option"
	echo "                                  (no break at start)"
	echo "         --debuglevel           : Specify the level of debug output."
	echo "                                  (DBG/MSG/WARN/ERR/custom debug level)"
	echo "         --watcher              : Run IP watcher process as daemon"
	echo "         --oneshot              : Run watcher process only once"
	echo ""
}

#
# utility
#
stop_old_process()
{
	if [ -f ${MYPROCIDFILE} ]; then
		ps p `cat ${MYPROCIDFILE}` > /dev/null 2>&1
		if [ $? -eq 0 ]; then
			OLDPROCID=`cat ${MYPROCIDFILE}`
			kill -HUP ${OLDPROCID} `pgrep -d' ' -P ${OLDPROCID}` > /dev/null 2>&1
			if [ $? -ne 0 ]; then
				echo "[ERROR] could not stop old process."
				return 1
			fi
			echo "[INFO] old process pid file exists, then try to stop it."
		fi
	fi
	return 0
}

#
# Parse arguments
#
DEBUG_ENV_CUSTOM=""
DEBUG_ENV_LEVEL=0
INSPECTOR_OPT=""
NODE_ENV_VALUE=""
FOREGROUND=0
BACKGROUND=0
STOP_OLD_PROCESS=0
WATCHER_PROC=0
WATCH_ONESHOT=0

while [ $# -ne 0 ]; do
	if [ "X$1" = "X" ]; then
		break

	elif [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		PrintUsage ${PROGRAM_NAME}
		exit 0

	elif [ "X$1" = "X--background" -o "X$1" = "X--BACKGROUND" -o "X$1" = "X-bg" -o "X$1" = "X-BG" ]; then
		#
		# Not check multi same option...
		#
		BACKGROUND=1

	elif [ "X$1" = "X--foreground" -o "X$1" = "X--FOREGROUND" -o "X$1" = "X-fg" -o "X$1" = "X-FG" ]; then
		#
		# Not check multi same option...
		#
		FOREGROUND=1

	elif [ "X$1" = "X--stop" -o "X$1" = "X--STOP" -o "X$1" = "X-STOP" -o "X$1" = "X-stop" ]; then
		if [ ${STOP_OLD_PROCESS} -ne 0 ]; then
			echo "ERROR: already specified --stop option"
			exit 1
		fi
		STOP_OLD_PROCESS=1

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

	elif [ "X$1" = "X--debug" -o "X$1" = "X--DEBUG" -o "X$1" = "X-d" -o "X$1" = "X-D" ]; then
		if [ "X${INSPECTOR_OPT}" != "X" ]; then
			echo "ERROR: already specified --debug or --debug-nobrk option"
			exit 1
		fi
		INSPECTOR_OPT="--inspect-brk=${HOST}:9229"

	elif [ "X$1" = "X--debug-nobrk" -o "X$1" = "X--DEBUG-NOBRK" -o "X$1" = "X-dnobrk" -o "X$1" = "X-DNOBRK" ]; then
		if [ "X${INSPECTOR_OPT}" != "X" ]; then
			echo "ERROR: already specified --debug or --debug-nobrk option"
			exit 1
		fi
		INSPECTOR_OPT="--inspect=${HOST}:9229"

	elif [ "X$1" = "X--debuglevel" -o "X$1" = "X--DEBUGLEVEL" ]; then
		#
		# DEBUG option
		#
		shift
		if [ $# -eq 0 ]; then
			echo "ERROR: --debuglevel option needs parameter(dbg/msg/warn/err)"
			exit 1
		fi

		if [ "X$1" = "Xdbg" -o "X$1" = "XDBG" -o "X$1" = "Xdebug" -o "X$1" = "XDEBUG" ]; then
			if [ ${DEBUG_ENV_LEVEL} -ne 0 ]; then
				echo "ERROR: --debuglevel option already is set"
				exit 1
			fi
			if [ ${DEBUG_ENV_LEVEL} -lt 4 ]; then
				DEBUG_ENV_LEVEL=4
			fi

		elif [ "X$1" = "Xmsg" -o "X$1" = "XMSG" -o "X$1" = "Xmessage" -o "X$1" = "XMESSAGE" -o "X$1" = "Xinfo" -o "X$1" = "XINFO" ]; then
			if [ ${DEBUG_ENV_LEVEL} -ne 0 ]; then
				echo "ERROR: --debuglevel option already is set"
				exit 1
			fi
			if [ ${DEBUG_ENV_LEVEL} -lt 3 ]; then
				DEBUG_ENV_LEVEL=3
			fi

		elif [ "X$1" = "Xwarn" -o "X$1" = "XWARN" -o "X$1" = "Xwarning" -o "X$1" = "XWARNING" ]; then
			if [ ${DEBUG_ENV_LEVEL} -ne 0 ]; then
				echo "ERROR: --debuglevel option already is set"
				exit 1
			fi
			if [ ${DEBUG_ENV_LEVEL} -lt 2 ]; then
				DEBUG_ENV_LEVEL=2
			fi

		elif [ "X$1" = "Xerr" -o "X$1" = "XERR" -o "X$1" = "Xerror" -o "X$1" = "XERROR" ]; then
			if [ ${DEBUG_ENV_LEVEL} -ne 0 ]; then
				echo "ERROR: --debuglevel option already is set"
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

	elif [ "X$1" = "X--watcher" -o "X$1" = "X--WATCHER" -o "X$1" = "X--watch" -o "X$1" = "X--WATCH" -o "X$1" = "X-w" -o "X$1" = "X-W" ]; then
		if [ ${WATCHER_PROC} -ne 0 ]; then
			echo "ERROR: already specified --watcher option"
			exit 1
		fi
		WATCHER_PROC=1

	elif [ "X$1" = "X--oneshot" -o "X$1" = "X--ONESHOT" -o "X$1" = "X-os" -o "X$1" = "X-OS" ]; then
		if [ ${WATCH_ONESHOT} -ne 0 ]; then
			echo "ERROR: already specified --oneshot option"
			exit 1
		fi
		WATCH_ONESHOT=1

	else
		echo "WARNING: Unknown option $1 is specified, it is ignored."
	fi
	shift
done

#
# Check watcher option & set process variables
#
if [ ${WATCHER_PROC} -ne 1 -a ${WATCH_ONESHOT} -eq 1 ]; then
    echo "[ERROR] invalid option is specified, --oneshot(-os) must be specified with --watcher(-w)."
    exit 1
fi
if [ ${WATCHER_PROC} -ne 1 ]; then
	MYPROCIDFILE=${MYMAINPROCIDFILE}
	TARGETPROG=${WWWPROG}
else
	MYPROCIDFILE=${MYWATCHPROCIDFILE}
	TARGETPROG=${WATCHPROG}

	if [ ${WATCH_ONESHOT} -eq 1 ]; then
		PROG_EXTRA_OPTIONS="--oneshot"
	fi
fi

#
# NODE_ENV_VALUE
#
if [ "X${NODE_ENV_VALUE}" = "X" ]; then
	NODE_ENV_VALUE="production"
fi

#
# Check run background
#
if [ ${BACKGROUND} -eq 1 -a ${FOREGROUND} -eq 0 ]; then
	#
	# Run another process as child
	#
	${CMDLINE_PROCESS_NAME} ${CMDLINE_ALL_PARAM} -fg > /dev/null 2>&1 &
	exit 0
fi

#
# Stop old process if exists
#
stop_old_process
if [ $? -ne 0 ]; then
	exit $?
fi
if [ ${STOP_OLD_PROCESS} -eq 1 ]; then
	rm -f ${MYPROCIDFILE}
	exit 0
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
# Push my process id
#
echo $$ > ${MYPROCIDFILE}

#
# Executing
#
cd ${SRCTOP}
if [ ${DEBUG_ENV_LEVEL} -ge 4 ]; then
	echo "***** RUN *****"
	echo "NODE_PATH=${NODE_PATH} NODE_ENV=${NODE_ENV_VALUE} NODE_DEBUG=${DEBUG_ENV_PARAM} node ${INSPECTOR_OPT} ${TARGETPROG} ${PROG_EXTRA_OPTIONS}"
	echo ""
fi
NODE_PATH=${NODE_PATH} NODE_ENV=${NODE_ENV_VALUE} NODE_DEBUG=${DEBUG_ENV_PARAM} node ${INSPECTOR_OPT} ${TARGETPROG} ${PROG_EXTRA_OPTIONS}

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
