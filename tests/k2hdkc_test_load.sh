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
# CREATE:   Thu Nov 9 2017
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
# default conf/port for k2hdkc
#
K2HR3_K2HDKC_PATH="${SRCTOP}/../k2hr3_dkc/conf"
REMOTE_K2HDKC_CONF_PATH="${K2HR3_K2HDKC_PATH}/slave.ini"
REMOTE_K2HDKC_CTRL_PORT=8031
AUTO_K2HDKC_CONF_PATH="${SRCTOP}/tests/auto_k2hdkc_slave.ini"
AUTO_K2HDKC_CTRL_PORT=18031

#
# Option
#
OPTION_MODE=0
TENANT_MAIN="tenant0"
TENANT_SUB="tenant1"

while [ $# -ne 0 ]; do
	if [ "X$1" = "X" ]; then
		break

	elif [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		echo "Usage: $1 --for_auto_test(-f)"
		echo "       $1 --main(-m) <main tenant name> --sub(-s) <sub tenant name> [--conf(-c) <conf file>] [--port(-p) <port>]"
		echo "       --for_auto_test(-f)  for local k2hdkc as auto testing(dummyuser)"
		echo "       --main(-m)           specify main tenant name for remote k2hr3 cluster"
		echo "       --sub(-s)            specify sub tenant name for remote k2hr3 cluster"
		echo "       --conf(-c)           specify slave chmpx conf file for remote k2hr3 cluster(default is ../k2hr3_dkc/conf)"
		echo "       --port(-p)           specify slave chmpx port for remote k2hr3 cluster(default is ../k2hr3_dkc/conf)"
		echo ""
		exit 0

	elif [ "X$1" = "X--for_auto_test" -o "X$1" = "X--FOR_AUTO_TEST" -o "X$1" = "X-f" -o "X$1" = "X-F" ]; then
		if [ ${OPTION_MODE} -ne 0 ]; then
			echo "ERROR: --for_auto_test(-f) option is specified, but already set it or another options."
			exit 1
		fi
		OPTION_MODE=1

	elif [ "X$1" = "X--main" -o "X$1" = "X--MAIN" -o "X$1" = "X-m" -o "X$1" = "X-M" ]; then
		#
		# input main tenant name
		#
		shift
		if [ $# -eq 0 ]; then
			echo "ERROR: --main(-m) option needs parameter"
			exit 1
		fi
		TENANT_MAIN=$1

		if [ ${OPTION_MODE} -eq 1 ]; then
			echo "ERROR: --main(-m) option is specified, but already set --for_auto_test(-f) option."
			exit 1
		fi
		OPTION_MODE=2

	elif [ "X$1" = "X--sub" -o "X$1" = "X--SUB" -o "X$1" = "X-s" -o "X$1" = "X-S" ]; then
		#
		# input sub tenant name
		#
		shift
		if [ $# -eq 0 ]; then
			echo "ERROR: --sub(-s) option needs parameter"
			exit 1
		fi
		TENANT_SUB=$1

		if [ ${OPTION_MODE} -eq 1 ]; then
			echo "ERROR: --sub(-s) option is specified, but already set --for_auto_test(-f) option."
			exit 1
		fi
		OPTION_MODE=2

	elif [ "X$1" = "X--conf" -o "X$1" = "X--CONF" -o "X$1" = "X-c" -o "X$1" = "X-C" ]; then
		shift
		if [ "X$1" = "X" ]; then
		    echo "[ERROR] --conf(-c) option needs parameter"
		    exit 1
		fi
		REMOTE_K2HDKC_CONF_PATH=$1

		if [ ${OPTION_MODE} -eq 1 ]; then
			echo "ERROR: --conf(-c) option is specified, but already set --for_auto_test(-f) option."
			exit 1
		fi
		OPTION_MODE=2

	elif [ "X$1" = "X--port" -o "X$1" = "X--PORT" -o "X$1" = "X-p" -o "X$1" = "X-P" ]; then
		shift
		if [ "X$1" = "X" ]; then
		    echo "[ERROR] --port(-p) option needs parameter"
		    exit 1
		fi
		REMOTE_K2HDKC_CTRL_PORT=$1

		if [ ${OPTION_MODE} -eq 1 ]; then
			echo "ERROR: --port(-p) option is specified, but already set --for_auto_test(-f) option."
			exit 1
		fi
		OPTION_MODE=2

	else
		echo "ERROR: unknown option \"$1\""
		exit 1
	fi
	shift
done

#
# Check options
#
if [ ${OPTION_MODE} -eq 0 ]; then
	echo "ERROR: no option is specified."
	exit 1
elif [ ${OPTION_MODE} -eq 1 ]; then
	K2HDKC_CONF_PATH=${AUTO_K2HDKC_CONF_PATH}
	K2HDKC_CTRL_PORT=${AUTO_K2HDKC_CTRL_PORT}
elif [ ${OPTION_MODE} -eq 2 ]; then
	K2HDKC_CONF_PATH=${REMOTE_K2HDKC_CONF_PATH}
	K2HDKC_CTRL_PORT=${REMOTE_K2HDKC_CTRL_PORT}
else
	echo "ERROR: wrong option is specified."
	exit 1
fi

if [ ! -f ${K2HDKC_CONF_PATH} ]; then
    echo "[ERROR] slave chmpx configuration file(${K2HDKC_CONF_PATH}) does not exist."
    exit 1
fi

expr ${K2HDKC_CTRL_PORT} + 0 >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[ERROR] slave chmpx control port number(${K2HDKC_CTRL_PORT}) is not integer."
    exit 1
fi

#
# hostname/ip
#
if [ ${OPTION_MODE} -eq 1 ]; then
	HOSTNAME=`hostname`
	IPADDR=127.10.10.10
else
	HOSTNAME=`hostname`
	IPADDR=`nslookup $HOSTNAME | grep Address | grep -v '#' | awk '{print $2}'`
fi

#
# Copy file with convert
#
cat ${MYSCRIPTDIR}/k2hdkc_test.data | sed "s/__LOCAL_HOST_NAME__/${HOSTNAME}/g" | sed "s/__LOCAL_HOST_IP__/${IPADDR}/g" | sed "s/__TENANT_NAME_MAIN__/${TENANT_MAIN}/g" | sed "s/__TENANT_NAME_SUB__/${TENANT_SUB}/g" > /tmp/k2hdkc_test.data 2> /dev/null

#
# Run process
#
k2hdkclinetool -conf ${K2HDKC_CONF_PATH} -ctlport ${K2HDKC_CTRL_PORT} -run /tmp/k2hdkc_test.data > /dev/null
if [ $? -ne 0 ]; then
	echo "ERROR: Failed to load test data."
	rm -f /tmp/k2hdkc_test.data
	exit 1
fi

rm -f /tmp/k2hdkc_test.data
echo "SUCCESS: Loaded test data."
exit 0

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
