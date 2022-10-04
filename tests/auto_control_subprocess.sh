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
# CREATE:   Tue Dec 19 2017
# REVISION:
#

#
# This script starts/stops k2hdkc cluster/chmpx server/chmpx slave processes,
# and initializes data on k2hdkc for testing.
#
#
# Common
#
CMDLINE_PROCESS_NAME=$0
CMDLINE_ALL_PARAM=$@
PROGRAM_NAME=`basename ${CMDLINE_PROCESS_NAME}`
MYSCRIPTDIR=`dirname ${CMDLINE_PROCESS_NAME}`

#
# Parse arguments
#
IS_RUN_MODE=-1
RUN_INTERVAL=-1
CHILD_PROCESS_MANAGE_KEY=""

while [ $# -ne 0 ]; do
	if [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		echo "${PROGRAM_NAME} [ -help | -start | -stop ] {-key key} {-interval <number>} <process> <arg>..."
		exit 1

	elif [ "X$1" = "X-start" -o "X$1" = "X-START" ]; then
		if [ ${IS_RUN_MODE} -ne -1 ]; then
			echo "Already run mode(option) is specified."
			exit 1
		fi
		IS_RUN_MODE=1

	elif [ "X$1" = "X-stop" -o "X$1" = "X-STOP" ]; then
		if [ ${IS_RUN_MODE} -ne -1 ]; then
			echo "Already run mode(option) is specified."
			exit 1
		fi
		IS_RUN_MODE=0

	elif [ "X$1" = "X-key" -o "X$1" = "X-KEY" ]; then
		if [ "X${CHILD_PROCESS_MANAGE_KEY}" != "X" ]; then
			echo "Already -key option is specified."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "-key option needs parameter"
			exit 1
		fi
		CHILD_PROCESS_MANAGE_KEY="_$1"

	elif [ "X$1" = "X-interval" -o "X$1" = "X-INTERVAL" -o "X$1" = "X-int" -o "X$1" = "X-INT" ]; then
		if [ ${RUN_INTERVAL} -ne -1 ]; then
			echo "Already -interval option is specified."
			exit 1
		fi
		shift
		if [ $# -eq 0 ]; then
			echo "-interval option needs parameter"
			exit 1
		fi
		RUN_INTERVAL=$1

	else
		#
		# Finish to parse option, rest arguments are command and it's args
		#
		break
	fi
	shift
done

if [ $# -eq 0 ]; then
	echo "There is no process name and arguments"
	exit 1
fi
CHILD_PROCESS_NAME=$1
CHILD_PROCESS_CMD=$@

#
# Process pid/log
#
CHILD_PROCESS_PIDFILE="/tmp/${PROGRAM_NAME}_${CHILD_PROCESS_NAME}${CHILD_PROCESS_MANAGE_KEY}.pid"
CHILD_PROCESS_LOGFILE="/tmp/${PROGRAM_NAME}_${CHILD_PROCESS_NAME}${CHILD_PROCESS_MANAGE_KEY}.log"

#
# Execute
#
if [ ${IS_RUN_MODE} -eq 1 ]; then
	#
	# Start Process
	#
	${CHILD_PROCESS_CMD} >${CHILD_PROCESS_LOGFILE} 2>&1 &
	CHILD_PROCESS_PID=$!

	if [ ${RUN_INTERVAL} -ne -1 -a ${RUN_INTERVAL} -ne 0 ]; then
		sleep ${RUN_INTERVAL}
	fi

	ps -p ${CHILD_PROCESS_PID} >/dev/null 2>&1
	if [ $? -ne 0 ]; then
		echo "Could not start child process : ${CHILD_PROCESS_CMD}"
		exit 1
	fi
	echo ${CHILD_PROCESS_PID} > ${CHILD_PROCESS_PIDFILE}
	echo "Succeed to start process(${CHILD_PROCESS_PID}) : ${CHILD_PROCESS_CMD}"

else
	#
	# Stop Process
	#
	if [ -f ${CHILD_PROCESS_PIDFILE} ]; then
		CHILD_PROCESS_PID=`cat ${CHILD_PROCESS_PIDFILE}`

		ps -p ${CHILD_PROCESS_PID} >/dev/null 2>&1
		if [ $? -eq 0 ]; then
			kill -HUP ${CHILD_PROCESS_PID}

			if [ ${RUN_INTERVAL} -ne -1 -a ${RUN_INTERVAL} -ne 0 ]; then
				sleep ${RUN_INTERVAL}
			fi

			ps -p ${CHILD_PROCESS_PID} >/dev/null 2>&1
			if [ $? -eq 0 ]; then
				kill -9 ${CHILD_PROCESS_PID}

				if [ ${RUN_INTERVAL} -ne -1 -a ${RUN_INTERVAL} -ne 0 ]; then
					sleep ${RUN_INTERVAL}
				fi

				ps -p ${CHILD_PROCESS_PID} >/dev/null 2>&1
				if [ $? -eq 0 ]; then
					echo "Could not stop child process : ${CHILD_PROCESS_CMD}"
					exit 1
				fi
			fi
		fi
		echo "Succeed to stop process : ${CHILD_PROCESS_CMD}(${CHILD_PROCESS_PID})"
		rm -f ${CHILD_PROCESS_PIDFILE}
	else
		echo "Not found child process pid file : ${CHILD_PROCESS_PIDFILE}"
	fi
fi

exit 0

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
