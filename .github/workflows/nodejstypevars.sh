#
# K2HR3 REST API
#
# Copyright 2020 Yahoo Japan Corporation.
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
# CREATE:   Wed, Nov 18 2020
# REVISION: 1.0
#

#===============================================================
# Configuration for nodejs_helper.sh
#===============================================================
# This file is loaded into the nodejs_helper.sh script.
# The nodejs_helper.sh script is a Github Actions helper script that
# builds and packages the target repository.
# This file is mainly created to define variables that differ depending
# on the Node.js Major Version.
# It also contains different information(such as packages to install)
# for each repository.
#
# In the initial state, you need to set the following variables:
#   INSTALLER_BIN     : Package management command
#   UPDATE_CMD        : Update sub command for package management command
#   UPDATE_CMD_ARG    : Update sub command arguments for package management
#                       command
#   INSTALL_CMD       : Install sub command for package management command
#   INSTALL_CMD_ARG   : Install sub command arguments for package management
#                       command
#   INSTALL_AUTO_ARG  : No interaption arguments for package management
#                       command
#   INSTALL_QUIET_ARG : Output suppression parameters during installation
#   INSTALL_PKG_LIST  : A list of packages to be installed for build and
#                       packaging
#   IS_NPM_PUBLISHER  : Set to 1 when publishing a NPM package.
#                       Set this value to only one of the target nodejs
#                       major versions and OS types.
#   PUBLISH_DOMAIN    : Publish to NPM domain(default: registry.npmjs.org)
#
# Set these variables according to the CI_NODEJS_MAJOR_VERSION variable.
# The value of the CI_NODEJS_MAJOR_VERSION variable matches the name of
# the Container used in Github Actions.
# Check the ".github/workflow/***.yml" file for the value.
#

#---------------------------------------------------------------
# Default values
#---------------------------------------------------------------
INSTALLER_BIN=""
UPDATE_CMD=""
UPDATE_CMD_ARG=""
INSTALL_CMD=""
INSTALL_CMD_ARG=""
INSTALL_AUTO_ARG=""
INSTALL_QUIET_ARG=""
INSTALL_PKG_LIST=""

IS_NPM_PUBLISHER=0
PUBLISH_DOMAIN="registry.npmjs.org"

#---------------------------------------------------------------
# Variables for each Node.js Major Version
#---------------------------------------------------------------
# [NOTE]
# Running on GHA is only possible on Ubuntu OS
#
if [ -z "${CI_NODEJS_MAJOR_VERSION}" ]; then
	#
	# Unknown NodeJS Major version : Nothing to do
	#
	:

elif [ "${CI_NODEJS_MAJOR_VERSION}" = "22" ]; then
	INSTALLER_BIN="apt-get"
	UPDATE_CMD="update"
	UPDATE_CMD_ARG=""
	INSTALL_CMD="install"
	INSTALL_CMD_ARG=""
	INSTALL_AUTO_ARG="-y"
	INSTALL_QUIET_ARG="-qq"
	INSTALL_PKG_LIST="git gcc g++ make k2hdkc-dev"

	IS_NPM_PUBLISHER=0

elif [ "${CI_NODEJS_MAJOR_VERSION}" = "24" ]; then
	INSTALLER_BIN="apt-get"
	UPDATE_CMD="update"
	UPDATE_CMD_ARG=""
	INSTALL_CMD="install"
	INSTALL_CMD_ARG=""
	INSTALL_AUTO_ARG="-y"
	INSTALL_QUIET_ARG="-qq"
	INSTALL_PKG_LIST="git gcc g++ make k2hdkc-dev"

	IS_NPM_PUBLISHER=1
fi

#---------------------------------------------------------------
# Enable/Disable processing
#---------------------------------------------------------------
# [NOTE]
# Specify the phase of processing to use.
# The phases that can be specified are the following values, and
# the default is set for NodeJS processing.
# Setting this value to 1 enables the corresponding processing,
# setting it to 0 disables it.
#
#	<variable name>		<default value>
#	RUN_PRE_INSTALL			0
#	RUN_INSTALL				1
#	RUN_POST_INSTALL		0
#	RUN_PRE_AUDIT			0
#	RUN_AUDIT				1
#	RUN_POST_AUDIT			0
#	RUN_CPPCHECK			1
#	RUN_SHELLCHECK			1
#	RUN_CHECK_OTHER			0
#	RUN_PRE_BUILD			0
#	RUN_BUILD				1
#	RUN_POST_BUILD			0
#	RUN_PRE_TEST			0
#	RUN_TEST				1
#	RUN_POST_TEST			0
#	RUN_PRE_PUBLISH			1
#	RUN_PUBLISH				1
#	RUN_POST_PUBLISH		0
#
RUN_PRE_INSTALL=1
RUN_CPPCHECK=0

#---------------------------------------------------------------
# Variables for each process
#---------------------------------------------------------------
# [NOTE]
# Specify the following variables that can be specified in some
# processes.
# Each value has a default value for NodeJS processing.
#
#	CPPCHECK_EXCLUDE_OPTS			"-i node_modules"
#	CPPCHECK_TARGET					"${CPPCHECK_EXCLUDE_OPTS} ."
#	CPPCHECK_BASE_OPT				"--quiet --error-exitcode=1 --inline-suppr -j 8 --std=c++17 --xml"
#	CPPCHECK_ENABLE_VALUES			"warning style information missingInclude"
#	CPPCHECK_IGNORE_VALUES			"unmatchedSuppression missingIncludeSystem normalCheckLevelMaxBranches"
#	CPPCHECK_BUILD_DIR				"/tmp/cppcheck"
#
#	SHELLCHECK_TARGET_DIRS			"."
#	SHELLCHECK_BASE_OPT				"--shell=sh"
#	SHELLCHECK_EXCEPT_PATHS			"/node_modules/ /build/ /src/build/"
#	SHELLCHECK_IGN					"SC1117 SC1090 SC1091"
#	SHELLCHECK_INCLUDE_IGN			"SC2034 SC2148"
#
SHELLCHECK_EXCEPT_PATHS="/node_modules/"

#---------------------------------------------------------------
# Override function for processing
#---------------------------------------------------------------
#
# [NOTE]
# It is allowed to override the contents of each processing.
# Each processing is implemented by a function that can be
# overridden. Those default functions are implemented for NodeJS
# processing.
# If you want to change the processing, you can implement and
# override the following functions in this file. Those function
# should return 0 or 1 as a return value.
# For messages such as errors, you can use PRNERR, PRNWARN, PRNMSG,
# and PRNINFO defined in nodejs_helper.sh.
#
#	<function name>		<which processing>			<implemented or not>
#	run_pre_install		: before installing npm packages	yes
#	run_install			: installing npm packages			yes
#	run_post_install	: after installing npm packages		no
#	run_pre_audit		: before audit checking				no
#	run_audit			: audit checking					yes
#	run_post_audit		: after audit checking				no
#	run_cppcheck		: run cppcheck						yes
#	run_shellcheck		: run shellcheck					yes
#	run_othercheck		: run other checking				no
#	run_pre_build		: before building					no
#	run_build			: building							yes
#	run_post_build		: after building					no
#	run_pre_test		: before testing					no
#	run_test			: testing							yes
#	run_post_test		: after testing						no
#	run_pre_publish		: before publishing package			yes
#	run_publish			: publishing package				yes
#	run_post_publish	: after publishing package			yes
#

#
# Override pre-install
#
# Set min-release-age(=3) to prevent risks immediately after release.
# To achieve this, set RUN_PRE_INSTALL=1 as described above, and then
# override the run_pre_install function here.
#
run_pre_install()
{
	#
	# Check npm version
	#
	# Use the npm `min-release-age` option to protect against supply chain attacks.
	# To use this option, npm version 11.10.0 or later is required.
	# Notably, the default npm version included with Node.js v22 is older than this,
	# so an upgrade is necessary.
	#
	_NPMVER_MAJOR=$(npm -v 2>&1 | awk -F'.' '{print $1}' 2>&1)
	_NPMVER_MINOR=$(npm -v 2>&1 | awk -F'.' '{print $2}' 2>&1)
	_NPMVER_PATCH=$(npm -v 2>&1 | awk -F'.' '{print $3}' 2>&1)
	_NEED_NPM_UPGRADE=0

	if [ -z "${_NPMVER_MAJOR}" ]; then
		_NEED_NPM_UPGRADE=1
	elif [ "${_NPMVER_MAJOR}" -eq 11 ]; then
		if [ -z "${_NPMVER_MINOR}" ]; then
			_NEED_NPM_UPGRADE=1
		elif [ "${_NPMVER_MINOR}" -lt 10 ]; then
			_NEED_NPM_UPGRADE=1
		fi
	elif [ "${_NPMVER_MAJOR}" -lt 11 ]; then
		_NEED_NPM_UPGRADE=1
	fi

	if [ "${_NEED_NPM_UPGRADE}" -eq 1 ]; then
		PRNINFO "The npm is v${_NPMVER_MAJOR}.${_NPMVER_MINOR}.${_NPMVER_PATCH}, so it will be upgraded."

		if ! /bin/sh -c "npm install -g npm@latest"; then
			PRNERR "Failed to upgrade npm."
			return 1
		fi
		PRNINFO "Succeed to upgrade npm."
	fi

	# [NOTE]
	# If CI_FORCE_MIN_RELEASE_AGE is set, min-release-age is executed using that value.
	# If it is not set, the default is 3 days.
	#
	MIN_RELEASE_AGE_VALUE=3
	if [ -n "${CI_FORCE_MIN_RELEASE_AGE}" ]; then
		MIN_RELEASE_AGE_VALUE="${CI_FORCE_MIN_RELEASE_AGE}"
	fi
	if [ "${MIN_RELEASE_AGE_VALUE}" -ne 0 ]; then
		if ! /bin/sh -c "npm config set min-release-age ${MIN_RELEASE_AGE_VALUE}"; then
			PRNERR "Failed to run \"npm config set min-release-age ${MIN_RELEASE_AGE_VALUE}\"."
			return 1
		fi
		PRNINFO "Finished to run \"npm config set min-release-age ${MIN_RELEASE_AGE_VALUE}\"."
	else
		PRNINFO "The min-release-age value is specified 0, so skip to check minimun release age."
	fi

	return 0
}

#
# Override Audit
#
run_audit()
{
	if ! /bin/sh -c "npm audit"; then
		echo ""
		PRNWARN "Failed to run \"npm audit\", but will not stop due to this error."
		echo "          You should investigate this error."
		echo "          It may be an error in a package you use."
		echo "          We won't stop here in case npm audit fix can't fix it."
		return 0
	fi
	PRNINFO "Finished to run \"npm audit\"."

	return 0
}

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
