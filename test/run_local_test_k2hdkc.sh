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
# CREATE:   Wed Dec 27 2017
# REVISION:
#

#
# Common
#
PROGRAM_NAME=`basename $0`
MYSCRIPTDIR=`dirname $0`
MYSCRIPTDIR=`cd ${MYSCRIPTDIR}; pwd`
SRCTOP=`cd ${MYSCRIPTDIR}/..; pwd`

#
# Parse arguments
#
IS_SCRIPT_MODE=0
KEYWORD=""

while [ $# -ne 0 ]; do
	if [ "X$1" = "X" ]; then
		break

	elif [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		echo "Usage:   ${PROGRAM_NAME} [--key(-k) keyword(group name for control)] [start | stop]"
		exit 0

	elif [ "X$1" = "X--key" -o "X$1" = "X--KEY" -o "X$1" = "X-k" -o "X$1" = "X-K" ]; then
		shift
		if [ $# -eq 0 ]; then
			echo "ERROR: --key(-k) option needs parameter"
			exit 1
		fi
		if [ "X${KEYWORD}" != "X" ]; then
			echo "ERROR: already set --key(-k) option"
			exit 1
		fi
		KEYWORD=_$1

	elif [ "X$1" = "Xstart" -o "X$1" = "XSTART" ]; then
		if [ ${IS_SCRIPT_MODE} -ne 0 ]; then
			echo "ERROR: already specified start or stop"
			exit 1
		fi
		IS_SCRIPT_MODE=1

	elif [ "X$1" = "Xstop" -o "X$1" = "XSTOP" ]; then
		if [ ${IS_SCRIPT_MODE} -ne 0 ]; then
			echo "ERROR: already specified start or stop"
			exit 1
		fi
		IS_SCRIPT_MODE=2

	else
		echo "ERROR: unknown option $1"
		exit 1
	fi
	shift
done

if [ ${IS_SCRIPT_MODE} -eq 0 ]; then
	echo "ERROR: must specify start or stop"
	exit 1
fi

if [ ${IS_SCRIPT_MODE} -eq 1 ]; then
	#
	# Start
	#
	echo "*** Start : chmpx server node for k2hdkc"
	echo -n "            "
	${SRCTOP}/test/auto_control_subprocess.sh -start -key server${KEYWORD} -int 1 chmpx -conf ${SRCTOP}/test/auto_k2hdkc_server.ini -ctlport 18021 -d msg
	if [ $? -ne 0 ]; then
		echo "ERROR: could not run chmpx server node for k2hdkc"
		exit 1
	fi

	echo "*** Start : one k2hdkc process"
	echo -n "            "
	${SRCTOP}/test/auto_control_subprocess.sh -start -key server${KEYWORD} -int 1 k2hdkc -conf ${SRCTOP}/test/auto_k2hdkc_server.ini -ctlport 18021 -d msg
	if [ $? -ne 0 ]; then
		echo "ERROR: one k2hdkc process"
		exit 1
	fi

	echo "*** Start : chmpx slave node for k2hdkc"
	echo -n "            "
	${SRCTOP}/test/auto_control_subprocess.sh -start -key slave${KEYWORD} -int 1 chmpx -conf ${SRCTOP}/test/auto_k2hdkc_slave.ini -ctlport 18031 -d msg
	if [ $? -ne 0 ]; then
		echo "ERROR: chmpx slave node for k2hdkc"
		exit 1
	fi

	echo "*** Start : load default test data to k2hdkc"
	echo -n "            "
	${SRCTOP}/test/k2hdkc_test_load.sh --for_auto_test
	if [ $? -ne 0 ]; then
		echo "ERROR: load default test data to k2hdkc"
		exit 1
	fi

else
	#
	# Stop
	#
	echo "*** Stop : chmpx slave node for k2hdkc"
	echo -n "           "
	${SRCTOP}/test/auto_control_subprocess.sh -stop -key slave${KEYWORD} -int 1 chmpx
	if [ $? -ne 0 ]; then
		echo "ERROR: chmpx slave node for k2hdkc"
		exit 1
	fi

	echo "*** Stop : one k2hdkc process"
	echo -n "           "
	${SRCTOP}/test/auto_control_subprocess.sh -stop -key server${KEYWORD} -int 1 k2hdkc
	if [ $? -ne 0 ]; then
		echo "ERROR: one k2hdkc process"
		exit 1
	fi

	echo "*** Stop : chmpx server node for k2hdkc"
	echo -n "           "
	${SRCTOP}/test/auto_control_subprocess.sh -stop -key server${KEYWORD} -int 1 chmpx
	if [ $? -ne 0 ]; then
		echo "ERROR: could not run chmpx server node for k2hdkc"
		exit 1
	fi
fi

echo ""
echo "SUCCEED: finished"
exit 0

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
