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
PKGMGR_NAME=
PKGMGR_UPDATE_OPT=
PKGMGR_INSTALL_OPT=
PKG_INSTALL_LIST_BUILDER=
PKG_INSTALL_LIST_BIN=
PKG_REPO_SETUP_NODEJS=
PKG_INSTALL_LIST_NODEJS=
BUILDER_ENVIRONMENT=
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
	PKG_INSTALL_LIST_BUILDER="git build-base python3 yaml"
	PKG_INSTALL_LIST_BIN="npm libstdc++ yaml"
	PKG_INSTALL_LIST_NODEJS="nodejs npm"

elif [ "${CI_DOCKER_IMAGE_OSTYPE}" = "ubuntu" ]; then
	PKGMGR_NAME="apt-get"
	PKGMGR_UPDATE_OPT="update -qq -y"
	PKGMGR_INSTALL_OPT="install -qq -y"
	PKG_INSTALL_LIST_BUILDER="git gcc g++ make curl"
	PKG_INSTALL_LIST_BIN="libyaml-0-2 curl"
	PKG_REPO_SETUP_NODEJS="curl -sL https://deb.nodesource.com/setup_16.x | bash"
	PKG_INSTALL_LIST_NODEJS="nodejs"

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
# Variables in using following function
#
PACKAGEJSON_FILEPATH="${SRCTOP}/package.json"

#
# Get version from repository package
#
# [NOTE]
# Set "REPOSITORY_PACKAGE_VERSION" environment
#
# The following variables will be used, so please set them in advance:
#	PACKAGEJSON_FILEPATH	: path to package.json
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
	echo "  PKG_INSTALL_LIST_NODEJS     = ${PKG_INSTALL_LIST_NODEJS}"
	echo "  PKG_REPO_SETUP_NODEJS       = ${PKG_REPO_SETUP_NODEJS}"
	return 0
}

#
# Custom dockerfile conversion
#
# $1	: Dockerfile path
#
# The following variables will be used, so please set them in advance:
#	PACKAGEJSON_FILEPATH		: path to package.json
#	PKG_REPO_SETUP_NODEJS		: setup NodeJS repository command string if need
#	PKG_INSTALL_LIST_NODEJS		: install package lis for nodejs
#	PKGMGR_NAME					: package manageer name
#	PKGMGR_INSTALL_OPT			: the option for installing by package manager
#
custom_dockerfile_conversion()
{
	if [ -z "$1" ] || [ ! -f "$1" ]; then
		PRNERR "Dockerfile path($1) is empty or not existed."
		return 1
	fi
	_TMP_DOCKERFILE_PATH="$1"

	#
	# Package name
	#
	if [ ! -f "${PACKAGEJSON_FILEPATH}" ]; then
		PRNERR "${PACKAGEJSON_FILEPATH} is not existed."
		return 1
	fi
	if ! PACKAGEJSON_PACKAGE_NAME="$(grep '"name":' "${PACKAGEJSON_FILEPATH}" | head -1 | sed -e 's/"//g' -e 's/,//g' -e 's/name://g' -e 's/ //g' | tr -d '\n')"; then
		PRNERR "Failed to get package name from ${PACKAGEJSON_FILEPATH} file"
		return 1
	fi

	#
	# Check varibales and set default values
	#
	if [ -n "${PKG_REPO_SETUP_NODEJS}" ]; then
		PKG_REPO_SETUP_NODEJS_COMMAND="${PKG_REPO_SETUP_NODEJS}"
	else
		#
		# Set no-operation command
		#
		PKG_REPO_SETUP_NODEJS_COMMAND=":"
	fi
	if [ -n "${PKG_INSTALL_LIST_NODEJS}" ]; then
		PKG_INSTALL_NODEJS_COMMAND="${PKGMGR_NAME} ${PKGMGR_INSTALL_OPT} ${PKG_INSTALL_LIST_NODEJS}"
	else
		#
		# Set no-operation command
		#
		PKG_INSTALL_NODEJS_COMMAND=":"
	fi

	if ! sed -e "s#%%DOCKER_IMAGE_NAME%%#${PACKAGEJSON_PACKAGE_NAME}#g"			\
			-e "s#%%PKG_REPO_SETUP_NODEJS%%#${PKG_REPO_SETUP_NODEJS_COMMAND}#g"	\
			-e "s#%%PKG_INSTALL_NODEJS%%#${PKG_INSTALL_NODEJS_COMMAND}#g"		\
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
