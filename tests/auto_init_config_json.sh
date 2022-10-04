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
# CREATE:   Mon Dec 25 2017
# REVISION:
#

#
# This script is checking/creating/Restoring config/local.json(and local-development.json) for test environment
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

CONFIGDIR=${SRCTOP}/config
LOCALJSON=${CONFIGDIR}/local.json
LOCALJSON_BUP=${CONFIGDIR}/local.json_AUTOTEST_BUP
LOCALDEVELOPJSON=${CONFIGDIR}/local-development.json
LOCALDEVELOPJSON_BUP=${CONFIGDIR}/local-development.json_AUTOTEST_BUP
DUMMYJSON=${CONFIGDIR}/dummyuser.json

#
# Check options
#
PROC_MODE_RESTORE=0

while [ $# -ne 0 ]; do
	if [ "X$1" = "X" ]; then
		break

	elif [ "X$1" = "X--help" -o "X$1" = "X--HELP" -o "X$1" = "X-h" -o "X$1" = "X-H" ]; then
		echo "Usage: ${PROGRAM_NAME} [-set(default) | -restore] [--help(-h)]"
		exit 0

	elif [ "X$1" = "X-set" -o "X$1" = "X-SET" ]; then
		PROC_MODE_RESTORE=0

	elif [ "X$1" = "X-restore" -o "X$1" = "X-RESTORE" ]; then
		PROC_MODE_RESTORE=1

	else
		echo "[ERROR] Unknown option $1"
		exit 1
	fi

	shift
done

#
# Run
#
if [ ${PROC_MODE_RESTORE} -ne 1 ]; then
	#
	# Set/Create Mode
	#

	#
	# Check local.json
	#
	if [ -f ${LOCALJSON} ]; then
		if [ ! -L ${LOCALJSON} ]; then
			echo "[ERROR] ${LOCALJSON} is existed as real file."
			exit 1
		fi
		SLINK_FILE=`readlink ${LOCALJSON}`
		if [ $? -ne 0 ]; then
			echo "[ERROR] Could not read link as ${LOCALJSON}"
			exit 1
		fi
		if [ "X${SLINK_FILE}" = "X${DUMMYJSON}" ]; then
			#
			# local.json is already linked to dummyuser.json
			#
			echo "[INFO] Already ${LOCALJSON} file is linked ${DUMMYJSON}"

		else
			#
			# Make backup and create new symbolic link file
			#
			if [ -f ${LOCALJSON_BUP} ]; then
				echo "[ERROR] Could not rename file ${LOCALJSON} to ${LOCALJSON_BUP}, because ${LOCALJSON_BUP} already exists."
				exit 1
			fi

			# rename
			mv ${LOCALJSON} ${LOCALJSON_BUP} >/dev/null 2>&1
			if [ $? -ne 0 ]; then
				echo "[ERROR] Could not rename file ${LOCALJSON} to ${LOCALJSON_BUP}"
				exit 1
			fi

			#
			# Make symbolic link local.json
			#
			ln -s ${DUMMYJSON} ${LOCALJSON} >/dev/null 2>&1
			if [ $? -ne 0 ]; then
				echo "[ERROR] Could not create symbolic file ${DUMMYJSON} to ${LOCALJSON}"
				exit 1
			fi
		fi
	else
		#
		# There is no local.json, thus only make symbolic link local.json
		#
		ln -s ${DUMMYJSON} ${LOCALJSON} >/dev/null 2>&1
		if [ $? -ne 0 ]; then
			echo "[ERROR] Could not create symbolic file ${DUMMYJSON} to ${LOCALJSON}"
			exit 1
		fi
	fi

	#
	# Check local-development.json
	#
	if [ -f ${LOCALDEVELOPJSON} ]; then
		if [ -f ${LOCALDEVELOPJSON_BUP} ]; then
			echo "[ERROR] Could not rename file ${LOCALDEVELOPJSON} to ${LOCALDEVELOPJSON_BUP}, because ${LOCALDEVELOPJSON_BUP} already exists."
			exit 1
		fi

		# rename
		mv ${LOCALDEVELOPJSON} ${LOCALDEVELOPJSON_BUP} >/dev/null 2>&1
		if [ $? -ne 0 ]; then
			echo "[ERROR] Could not rename file ${LOCALDEVELOPJSON} to ${LOCALDEVELOPJSON_BUP}"
			exit 1
		fi
	fi

else
	#
	# Restore Mode
	#

	#
	# Restore local.json
	#
	if [ ! -f ${LOCALJSON_BUP} ]; then
		if [ -f ${LOCALJSON} ]; then
			if [ ! -L ${LOCALJSON} ]; then
				echo "[WARNING] Not found ${LOCALJSON_BUP} and exists ${LOCALJSON} as real file, so nothing to do"
			else
				#
				# local.json is symbolic link
				#
				SLINK_FILE=`readlink ${LOCALJSON}`
				if [ $? -ne 0 ]; then
					echo "[ERROR] Could not read link as ${LOCALJSON}"
					exit 1
				fi

				if [ "X${SLINK_FILE}" = "X${DUMMYJSON}" ]; then
					#
					# local.json is linked to dummyuser.json
					#
					rm -f ${LOCALJSON} >/dev/null 2>&1
					if [ $? -ne 0 ]; then
						echo "[ERROR] Could not remove file ${LOCALJSON}"
						exit 1
					fi
				else
					#
					# local.json is not linked to dummyuser.json
					#
					echo "[WARNING] Not found ${LOCALJSON_BUP} and exists ${LOCALJSON} as symbolic link, but it is not linking to dummyuser.json"
				fi
			fi
		else
			echo "[WARNING] Not found ${LOCALJSON_BUP} and ${LOCALJSON}."
		fi
	else
		if [ -f ${LOCALJSON} ]; then
			if [ ! -L ${LOCALJSON} ]; then
				echo "[WARNING] ${LOCALJSON} is not created by ${PROGRAM_NAME} program, because it is not symbolic link."
			else
				SLINK_FILE=`readlink ${LOCALJSON}`
				if [ $? -ne 0 ]; then
					echo "[ERROR] Could not read link as ${LOCALJSON}"
					exit 1
				fi
				if [ "X${SLINK_FILE}" != "X${DUMMYJSON}" ]; then
					echo "[WARNING] ${LOCALJSON} is not created by ${PROGRAM_NAME} program, because it is not symbolic link to ${DUMMYJSON}."
				else
					# remove
					rm -f ${LOCALJSON} >/dev/null 2>&1
					if [ $? -ne 0 ]; then
						echo "[ERROR] Could not remove file ${LOCALJSON}"
						exit 1
					fi
				fi
			fi
		fi

		# rename
		mv ${LOCALJSON_BUP} ${LOCALJSON} >/dev/null 2>&1
		if [ $? -ne 0 ]; then
			echo "[ERROR] Could not rename file ${LOCALJSON_BUP} to ${LOCALJSON}"
			exit 1
		fi
	fi

	#
	# Restore local-development.json
	#
	if [ ! -f ${LOCALDEVELOPJSON_BUP} ]; then
		echo "[INFO] Not found ${LOCALDEVELOPJSON_BUP}, skip restoring ${LOCALDEVELOPJSON}."
	else
		if [ -f ${LOCALDEVELOPJSON} ]; then
			echo "[WARNING] ${LOCALDEVELOPJSON} already exists, could not restoring from ${LOCALDEVELOPJSON_BUP}."
		else
			# rename
			mv ${LOCALDEVELOPJSON_BUP} ${LOCALDEVELOPJSON} >/dev/null 2>&1
			if [ $? -ne 0 ]; then
				echo "[ERROR] Could not rename file ${LOCALDEVELOPJSON_BUP} to ${LOCALDEVELOPJSON}"
				exit 1
			fi
		fi
	fi
fi

exit 0

#
# VIM modelines
#
# vim:set ts=4 fenc=utf-8:
#
