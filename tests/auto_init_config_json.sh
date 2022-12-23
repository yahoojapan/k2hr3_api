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
# CREATE:   Mon Dec 25 2017
# REVISION:
#

#----------------------------------------------------------
# This script is checking/creating/Restoring config/local.json
# (and local-development.json) for test environment
#----------------------------------------------------------

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
CONFIGDIR="${SRCTOP}/config"
LOCAL_JSON="${CONFIGDIR}/local.json"
LOCAL_JSON_BUP="${LOCAL_JSON}_AUTOTEST_BUP"
LOCALDEVELOP_JSON="${CONFIGDIR}/local-development.json"
LOCALDEVELOP_JSON_BUP="${LOCALDEVELOP_JSON}_AUTOTEST_BUP"
DUMMY_JSON="${CONFIGDIR}/dummyuser.json"

#==============================================================
# Utility functions
#==============================================================
#
# Usage
#
PrintUsage()
{
	echo ""
	echo "Usage: $1 [--help(-h)] [--set(-s) | --restore(-r)]"
	echo ""
}

#==========================================================
# Parse options
#==========================================================
PROC_MODE=""

while [ $# -ne 0 ]; do
	if [ -z "$1" ]; then
		break

	elif [ "$1" = "-h" ] || [ "$1" = "-H" ] || [ "$1" = "--help" ] || [ "$1" = "--HELP" ]; then
		PrintUsage "${PRGNAME}"
		exit 0

	elif [ "$1" = "-s" ] || [ "$1" = "-S" ] || [ "$1" = "--set" ] || [ "$1" = "--SET" ]; then
		if [ -n "${PROC_MODE}" ]; then
			echo "[ERROR] already specified --set(-s) or --restore(-r) option"
			exit 1
		fi
		PROC_MODE="set"

	elif [ "$1" = "-r" ] || [ "$1" = "-R" ] || [ "$1" = "--restore" ] || [ "$1" = "--RESTORE" ]; then
		if [ -n "${PROC_MODE}" ]; then
			echo "[ERROR] already specified --set(-s) or --restore(-r) option"
			exit 1
		fi
		PROC_MODE="restore"

	else
		echo "[ERROR] Unknown option $1"
		exit 1
	fi
	shift
done

if [ -z "${PROC_MODE}" ]; then
	echo "[ERROR] You must specify --set(-s) or --restore(-r) option."
	exit 1
fi

#==========================================================
# Do work
#==========================================================
if [ "${PROC_MODE}" = "set" ]; then
	#
	# Set Mode
	#

	#
	# Check local.json
	#
	if [ -f "${LOCAL_JSON}" ]; then
		if [ ! -L "${LOCAL_JSON}" ]; then
			echo "[ERROR] ${LOCAL_JSON} is existed as real file."
			exit 1
		fi

		if ! SLINK_FILE=$(readlink "${LOCAL_JSON}"); then
			echo "[ERROR] Could not read link as ${LOCAL_JSON}"
			exit 1
		fi

		if [ "${SLINK_FILE}" = "${DUMMY_JSON}" ]; then
			#
			# local.json is already linked to dummyuser.json
			#
			echo "[INFO] Already ${LOCAL_JSON} file is linked ${DUMMY_JSON}"

		else
			#
			# Make backup and create new symbolic link file
			#
			if [ -f "${LOCAL_JSON_BUP}" ]; then
				echo "[ERROR] Could not rename file ${LOCAL_JSON} to ${LOCAL_JSON_BUP}, because ${LOCAL_JSON_BUP} already exists."
				exit 1
			fi

			#
			# Rename
			#
			if ! mv "${LOCAL_JSON}" "${LOCAL_JSON_BUP}" >/dev/null 2>&1; then
				echo "[ERROR] Could not rename file ${LOCAL_JSON} to ${LOCAL_JSON_BUP}"
				exit 1
			fi

			#
			# Make symbolic link local.json
			#
			if ! ln -s "${DUMMY_JSON}" "${LOCAL_JSON}" >/dev/null 2>&1; then
				echo "[ERROR] Could not create symbolic file ${DUMMY_JSON} to ${LOCAL_JSON}"
				exit 1
			fi
		fi
	else
		#
		# There is no local.json, thus only make symbolic link local.json
		#
		if ! ln -s "${DUMMY_JSON}" "${LOCAL_JSON}" >/dev/null 2>&1; then
			echo "[ERROR] Could not create symbolic file ${DUMMY_JSON} to ${LOCAL_JSON}"
			exit 1
		fi
	fi

	#
	# Check local-development.json
	#
	if [ -f "${LOCALDEVELOP_JSON}" ]; then
		if [ -f "${LOCALDEVELOP_JSON_BUP}" ]; then
			echo "[ERROR] Could not rename file ${LOCALDEVELOP_JSON} to ${LOCALDEVELOP_JSON_BUP}, because ${LOCALDEVELOP_JSON_BUP} already exists."
			exit 1
		fi

		#
		# Rename
		#
		if ! mv "${LOCALDEVELOP_JSON}" "${LOCALDEVELOP_JSON_BUP}" >/dev/null 2>&1; then
			echo "[ERROR] Could not rename file ${LOCALDEVELOP_JSON} to ${LOCALDEVELOP_JSON_BUP}"
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
	if [ ! -f "${LOCAL_JSON_BUP}" ]; then
		if [ -f "${LOCAL_JSON}" ]; then
			if [ ! -L "${LOCAL_JSON}" ]; then
				echo "[WARNING] Not found ${LOCAL_JSON_BUP} and exists ${LOCAL_JSON} as real file, so nothing to do"
			else
				#
				# local.json is symbolic link
				#
				if ! SLINK_FILE=$(readlink "${LOCAL_JSON}"); then
					echo "[ERROR] Could not read link as ${LOCAL_JSON}"
					exit 1
				fi

				if [ "${SLINK_FILE}" = "${DUMMY_JSON}" ]; then
					#
					# local.json is linked to dummyuser.json
					#
					if ! rm -f "${LOCAL_JSON}"; then
						echo "[ERROR] Could not remove file ${LOCAL_JSON}"
						exit 1
					fi
				else
					#
					# local.json is not linked to dummyuser.json
					#
					echo "[WARNING] Not found ${LOCAL_JSON_BUP} and exists ${LOCAL_JSON} as symbolic link, but it is not linking to dummyuser.json"
				fi
			fi
		else
			echo "[WARNING] Not found ${LOCAL_JSON_BUP} and ${LOCAL_JSON}."
		fi
	else
		if [ -f "${LOCAL_JSON}" ]; then
			if [ ! -L "${LOCAL_JSON}" ]; then
				echo "[WARNING] ${LOCAL_JSON} is not created by ${PRGNAME} program, because it is not symbolic link."
			else
				if ! SLINK_FILE=$(readlink "${LOCAL_JSON}"); then
					echo "[ERROR] Could not read link as ${LOCAL_JSON}"
					exit 1
				fi

				if [ "${SLINK_FILE}" != "${DUMMY_JSON}" ]; then
					echo "[WARNING] ${LOCAL_JSON} is not created by ${PRGNAME} program, because it is not symbolic link to ${DUMMY_JSON}."
				else
					# remove
					if ! rm -f "${LOCAL_JSON}"; then
						echo "[ERROR] Could not remove file ${LOCAL_JSON}"
						exit 1
					fi
				fi
			fi
		fi

		#
		# Rename
		#
		if ! mv "${LOCAL_JSON_BUP}" "${LOCAL_JSON}" >/dev/null 2>&1; then
			echo "[ERROR] Could not rename file ${LOCAL_JSON_BUP} to ${LOCAL_JSON}"
			exit 1
		fi
	fi

	#
	# Restore local-development.json
	#
	if [ ! -f "${LOCALDEVELOP_JSON_BUP}" ]; then
		echo "[INFO] Not found ${LOCALDEVELOP_JSON_BUP}, skip restoring ${LOCALDEVELOP_JSON}."
	else
		if [ -f "${LOCALDEVELOP_JSON}" ]; then
			echo "[WARNING] ${LOCALDEVELOP_JSON} already exists, could not restoring from ${LOCALDEVELOP_JSON_BUP}."
		else
			#
			# Rename
			#
			if ! mv "${LOCALDEVELOP_JSON_BUP}" "${LOCALDEVELOP_JSON}" >/dev/null 2>&1; then
				echo "[ERROR] Could not rename file ${LOCALDEVELOP_JSON_BUP} to ${LOCALDEVELOP_JSON}"
				exit 1
			fi
		fi
	fi
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
