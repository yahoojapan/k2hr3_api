#
# K2HR3 REST API
#
# Copyright 2021 Yahoo Japan Corporation.
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
# CREATE:   Tue, Aug 10 2021
# REVISION:
#

#---------------------------------------------------------------------
# About this file
#---------------------------------------------------------------------
# This file is loaded into the docker_helper.sh script.
# The docker_helper.sh script is a Github Actions helper script that
# builds docker images and pushes it to Docker Hub.
# This file is mainly created to define variables that differ depending
# on the base docker image.
# It also contains different information(such as packages to install)
# for each repository.
#
# Set following variables according to the CI_DOCKER_IMAGE_OSTYPE
# variable. The value of the CI_DOCKER_IMAGE_OSTYPE variable matches
# the name of the base docker image.(ex, alpine/ubuntu/...)
#

#---------------------------------------------------------------------
# Default values
#---------------------------------------------------------------------
# [NOTE]
# If IMAGE_CMD_BASE(DEV) is set to empty, "['/bin/sh', '-c', 'tail -f /dev/null']"
# will be set as the default value.
#
PKGMGR_NAME=
PKGMGR_UPDATE_OPT=
PKGMGR_INSTALL_OPT=
PKGMGR_UNINSTALL_OPT=
PRE_PROCESS=
POST_PROCESS=
IMAGE_CMD_BASE=
IMAGE_CMD_DEV=
PKG_INSTALL_CURL=
PKG_INSTALL_BASE=
PKG_INSTALL_DEV=
PKG_UNINSTALL_BASE=
PKG_UNINSTALL_DEV=
BUILDER_CONFIGURE_FLAG=
SETUP_ENVIRONMENT=
UPDATE_LIBPATH=

#
# List the package names that contain pacakgecloud.io to install on Github Actions Runner.
#
RUNNER_INSTALL_PACKAGES=""

#
# Directory name to Dockerfile.templ file
#
DOCKERFILE_TEMPL_SUBDIR="templ"

#---------------------------------------------------------------------
# Variables for each Docker image Type
#---------------------------------------------------------------------
if [ -z "${CI_DOCKER_IMAGE_OSTYPE}" ]; then
	#
	# Unknown image OS type : Nothing to do
	#
	:
elif [ "${CI_DOCKER_IMAGE_OSTYPE}" = "alpine" ]; then
	PKGMGR_NAME="apk"
	PKGMGR_UPDATE_OPT="update -q --no-progress"
	PKGMGR_INSTALL_OPT="add -q --no-progress --no-cache"
	PKGMGR_UNINSTALL_OPT="del -q --purge --no-progress --no-cache"
	PKG_INSTALL_CURL="curl"
	PKG_INSTALL_BASE="g++ make nodejs npm python3 k2hdkc-dev bind-tools procps"
	PKG_REPO_SETUP_NODEJS=""
	NPM_INSTALL_BASE=""

elif [ "${CI_DOCKER_IMAGE_OSTYPE}" = "ubuntu" ]; then
	PKGMGR_NAME="apt-get"
	PKGMGR_UPDATE_OPT="update -qq -y"
	PKGMGR_INSTALL_OPT="install -qq -y"
	PKGMGR_UNINSTALL_OPT="purge --auto-remove -q -y"
	PKG_INSTALL_CURL="curl"
	PKG_INSTALL_BASE="g++ make nodejs k2hdkc-dev dnsutils procps"

	NODE_MAJOR=18
	PKG_REPO_SETUP_NODEJS="
		${PKGMGR_NAME} install -y ca-certificates gnupg
		mkdir -p /etc/apt/keyrings
		curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
		echo 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main' > /etc/apt/sources.list.d/nodesource.list
		${PKGMGR_NAME} update -qq -y
	"

	NPM_INSTALL_BASE=""

	#
	# For installing tzdata with another package(ex. git)
	#
	BUILDER_ENVIRONMENT="ENV DEBIAN_FRONTEND=noninteractive"
fi

#---------------------------------------------------------------
# Override function for processing
#---------------------------------------------------------------
# [NOTE]
# The following functions allow customization of processing.
# You can write your own processing by overriding each function.
#
# set_custom_variables()
#	This function sets common variables used in the following
#	customizable functions.
#
# get_repository_package_version()
#	Definition of a function that sets a variable to give the
#	version number of the Docker image when no tag or version
#	number is explicitly given.
#
# print_custom_variabels()
#	Definition of a function to display(for github actions logs)
#	if variables other than those required by default are defined
#	in this file(imagetypevar.sh) or if variables are created,
#
# run_preprocess()
#	Define this function when preprocessing for Docker Image
#	creation is required.
#
# custom_dockerfile_conversion()
#	Define this function when you need to modify your Dockerfile.
#

#
# Set Variables used in custom function
#
set_custom_variables()
{
	#
	# Variables for NodeJS products
	#
	PACKAGEJSON_FILEPATH="${SRCTOP}/package.json"

	#
	# Get package name
	#
	if ! PACKAGE_NAME="$(grep '"name":' "${PACKAGEJSON_FILEPATH}" | head -1 | sed -e 's/"//g' -e 's/,//g' -e 's/name://g' -e 's/ //g' | tr -d '\n')"; then
		PRNERR "Failed to get package name from ${PACKAGEJSON_FILEPATH} file"
		return 1
	fi

	#
	# Check package version
	#
	if [ -n "${GITHUB_REF_TYPE}" ] && [ "${GITHUB_REF_TYPE}" = "tag" ]; then
		if ! PACKAGEJSON_VERSION="$(grep '"version":' "${PACKAGEJSON_FILEPATH}" | head -1 | sed -e 's/"//g' -e 's/,//g' -e 's/version://g' -e 's/ //g' | tr -d '\n')"; then
			PRNERR "Failed to get version number from ${PACKAGEJSON_FILEPATH} file"
			return 1
		fi
		PACKAGE_VERSION_SUFFIX="@${PACKAGEJSON_VERSION}"
	else
		PACKAGE_VERSION_SUFFIX=""
	fi

	#
	# NodeJS repository setup
	#
	if [ -n "${PKG_REPO_SETUP_NODEJS}" ]; then
		PKG_REPO_SETUP_NODEJS_COMMAND=$(echo "${PKG_REPO_SETUP_NODEJS}" | sed -e '/^$/d' -e 's/^[[:space:]]*//g' -e 's/[[:space:]]*$//g' -e 's/$/ \\\&\\\& /g' | tr -d '\n' | sed -e 's/ \\\&\\\& $//g' -e 's/ \\\&\\\& $//g' -e 's/ \\\&\\\& $//g')
	else
		#
		# Set no-operation command
		#
		PKG_REPO_SETUP_NODEJS_COMMAND=":"
	fi

	#
	# Npm install packages
	#
	if [ -n "${NPM_INSTALL_BASE}" ]; then
		NPM_INSTALL_BASE_COMMAND="${NPM_INSTALL_BASE}"
	else
		#
		# Set default package
		#
		NPM_INSTALL_BASE_COMMAND="npm install -g ${PACKAGE_NAME}${PACKAGE_VERSION_SUFFIX}"
	fi
	return 0
}

#
# Get version from repository package
#
# [NOTE]
# Set "REPOSITORY_PACKAGE_VERSION" environment
#
get_repository_package_version()
{
	if [ ! -f "${PACKAGEJSON_FILEPATH}" ]; then
		PRNERR "${PACKAGEJSON_FILEPATH} is not existed."
		return 1
	fi
	if ! REPOSITORY_PACKAGE_VERSION="$(grep '"version":' "${PACKAGEJSON_FILEPATH}" | head -1 | sed -e 's/"//g' -e 's/,//g' -e 's/version://g' -e 's/ //g' | tr -d '\n')"; then
		PRNERR "Failed to get version number from ${PACKAGEJSON_FILEPATH} file"
		return 1
	fi
	return 0
}

#
# Print custom variables
#
print_custom_variabels()
{
	echo "  PACKAGEJSON_FILEPATH          = ${PACKAGEJSON_FILEPATH}"
	echo "  PACKAGE_NAME                  = ${PACKAGE_NAME}"
	echo "  PKG_REPO_SETUP_NODEJS_COMMAND = ${PKG_REPO_SETUP_NODEJS_COMMAND}"
	echo "  NPM_INSTALL_BASE_COMMAND      = ${NPM_INSTALL_BASE_COMMAND}"

	return 0
}

#
# Preprocessing
#
run_preprocess()
{
	return 0
}

#
# Custom dockerfile conversion
#
# $1	: Dockerfile path
#
# The following variables will be used, so please set them in advance:
#	PACKAGE_NAME					: package name
#	PKG_REPO_SETUP_NODEJS_COMMAND	: Setup repository for NodeJS
#
custom_dockerfile_conversion()
{
	if [ -z "$1" ] || [ ! -f "$1" ]; then
		PRNERR "Dockerfile path($1) is empty or not existed."
		return 1
	fi
	_TMP_DOCKERFILE_PATH="$1"

	if ! sed -e "s#%%PACKAGE_NAME%%#${PACKAGE_NAME}#g"							\
			-e "s#%%PKG_REPO_SETUP_NODEJS%%#${PKG_REPO_SETUP_NODEJS_COMMAND}#g"	\
			-e "s#%%NPM_INSTALL_BASE%%#${NPM_INSTALL_BASE_COMMAND}#g"			\
			-i "${_TMP_DOCKERFILE_PATH}"; then

		PRNERR "Failed to converting ${_TMP_DOCKERFILE_PATH}"
		return 1
	fi
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
