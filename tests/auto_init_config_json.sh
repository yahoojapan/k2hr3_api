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
# This script is checking/creating/Restoring config/local.json5
# (and local-development.json5) for test environment
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
LOCAL_JSON5="${CONFIGDIR}/local.json5"
LOCAL_JSON5_BUP="${LOCAL_JSON5}_AUTOTEST_BUP"
LOCALDEVELOP_JSON5="${CONFIGDIR}/local-development.json5"
LOCALDEVELOP_JSON5_BUP="${LOCALDEVELOP_JSON5}_AUTOTEST_BUP"
DUMMY_JSON5="${CONFIGDIR}/dummyuser.json5"

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
	# Check local.json5
	#
	if [ -f "${LOCAL_JSON5}" ]; then
		if [ ! -L "${LOCAL_JSON5}" ]; then
			echo "[ERROR] ${LOCAL_JSON5} is existed as real file."
			exit 1
		fi

		if ! SLINK_FILE=$(readlink "${LOCAL_JSON5}"); then
			echo "[ERROR] Could not read link as ${LOCAL_JSON5}"
			exit 1
		fi

		if [ "${SLINK_FILE}" = "${DUMMY_JSON5}" ]; then
			#
			# local.json5 is already linked to dummyuser.json5
			#
			echo "[INFO] Already ${LOCAL_JSON5} file is linked ${DUMMY_JSON5}"

		else
			#
			# Make backup and create new symbolic link file
			#
			if [ -f "${LOCAL_JSON5_BUP}" ]; then
				echo "[ERROR] Could not rename file ${LOCAL_JSON5} to ${LOCAL_JSON5_BUP}, because ${LOCAL_JSON5_BUP} already exists."
				exit 1
			fi

			#
			# Rename
			#
			if ! mv "${LOCAL_JSON5}" "${LOCAL_JSON5_BUP}" >/dev/null 2>&1; then
				echo "[ERROR] Could not rename file ${LOCAL_JSON5} to ${LOCAL_JSON5_BUP}"
				exit 1
			fi

			#
			# Make symbolic link local.json5
			#
			if ! ln -s "${DUMMY_JSON5}" "${LOCAL_JSON5}" >/dev/null 2>&1; then
				echo "[ERROR] Could not create symbolic file ${DUMMY_JSON5} to ${LOCAL_JSON5}"
				exit 1
			fi
		fi
	else
		#
		# There is no local.json5, thus only make symbolic link local.json5
		#
		if ! ln -s "${DUMMY_JSON5}" "${LOCAL_JSON5}" >/dev/null 2>&1; then
			echo "[ERROR] Could not create symbolic file ${DUMMY_JSON5} to ${LOCAL_JSON5}"
			exit 1
		fi
	fi

	#
	# Check local-development.json5
	#
	if [ -f "${LOCALDEVELOP_JSON5}" ]; then
		if [ -f "${LOCALDEVELOP_JSON5_BUP}" ]; then
			echo "[ERROR] Could not rename file ${LOCALDEVELOP_JSON5} to ${LOCALDEVELOP_JSON5_BUP}, because ${LOCALDEVELOP_JSON5_BUP} already exists."
			exit 1
		fi

		#
		# Rename
		#
		if ! mv "${LOCALDEVELOP_JSON5}" "${LOCALDEVELOP_JSON5_BUP}" >/dev/null 2>&1; then
			echo "[ERROR] Could not rename file ${LOCALDEVELOP_JSON5} to ${LOCALDEVELOP_JSON5_BUP}"
			exit 1
		fi
	fi
else
	#
	# Restore Mode
	#

	#
	# Restore local.json5
	#
	if [ ! -f "${LOCAL_JSON5_BUP}" ]; then
		if [ -f "${LOCAL_JSON5}" ]; then
			if [ ! -L "${LOCAL_JSON5}" ]; then
				echo "[WARNING] Not found ${LOCAL_JSON5_BUP} and exists ${LOCAL_JSON5} as real file, so nothing to do"
			else
				#
				# local.json5 is symbolic link
				#
				if ! SLINK_FILE=$(readlink "${LOCAL_JSON5}"); then
					echo "[ERROR] Could not read link as ${LOCAL_JSON5}"
					exit 1
				fi

				if [ "${SLINK_FILE}" = "${DUMMY_JSON5}" ]; then
					#
					# local.json5 is linked to dummyuser.json5
					#
					if ! rm -f "${LOCAL_JSON5}"; then
						echo "[ERROR] Could not remove file ${LOCAL_JSON5}"
						exit 1
					fi
				else
					#
					# local.json5 is not linked to dummyuser.json5
					#
					echo "[WARNING] Not found ${LOCAL_JSON5_BUP} and exists ${LOCAL_JSON5} as symbolic link, but it is not linking to dummyuser.json5"
				fi
			fi
		else
			echo "[WARNING] Not found ${LOCAL_JSON5_BUP} and ${LOCAL_JSON5}."
		fi
	else
		if [ -f "${LOCAL_JSON5}" ]; then
			if [ ! -L "${LOCAL_JSON5}" ]; then
				echo "[WARNING] ${LOCAL_JSON5} is not created by ${PRGNAME} program, because it is not symbolic link."
			else
				if ! SLINK_FILE=$(readlink "${LOCAL_JSON5}"); then
					echo "[ERROR] Could not read link as ${LOCAL_JSON5}"
					exit 1
				fi

				if [ "${SLINK_FILE}" != "${DUMMY_JSON5}" ]; then
					echo "[WARNING] ${LOCAL_JSON5} is not created by ${PRGNAME} program, because it is not symbolic link to ${DUMMY_JSON5}."
				else
					# remove
					if ! rm -f "${LOCAL_JSON5}"; then
						echo "[ERROR] Could not remove file ${LOCAL_JSON5}"
						exit 1
					fi
				fi
			fi
		fi

		#
		# Rename
		#
		if ! mv "${LOCAL_JSON5_BUP}" "${LOCAL_JSON5}" >/dev/null 2>&1; then
			echo "[ERROR] Could not rename file ${LOCAL_JSON5_BUP} to ${LOCAL_JSON5}"
			exit 1
		fi
	fi

	#
	# Restore local-development.json5
	#
	if [ ! -f "${LOCALDEVELOP_JSON5_BUP}" ]; then
		echo "[INFO] Not found ${LOCALDEVELOP_JSON5_BUP}, skip restoring ${LOCALDEVELOP_JSON5}."
	else
		if [ -f "${LOCALDEVELOP_JSON5}" ]; then
			echo "[WARNING] ${LOCALDEVELOP_JSON5} already exists, could not restoring from ${LOCALDEVELOP_JSON5_BUP}."
		else
			#
			# Rename
			#
			if ! mv "${LOCALDEVELOP_JSON5_BUP}" "${LOCALDEVELOP_JSON5}" >/dev/null 2>&1; then
				echo "[ERROR] Could not rename file ${LOCALDEVELOP_JSON5_BUP} to ${LOCALDEVELOP_JSON5}"
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
