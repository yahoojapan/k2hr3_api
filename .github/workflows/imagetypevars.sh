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

#
# Local variables:
# tab-width: 4
# c-basic-offset: 4
# End:
# vim600: noexpandtab sw=4 ts=4 fdm=marker
# vim<600: noexpandtab sw=4 ts=4
#
