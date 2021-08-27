#
# Utility tools for building configure/packages by AntPickax
#
# Copyright 2018 Yahoo Japan Corporation.
#
# AntPickax provides utility tools for supporting autotools
# builds.
#
# These tools retrieve the necessary information from the
# repository and appropriately set the setting values of
# configure, Makefile, spec,etc file and so on.
# These tools were recreated to reduce the number of fixes and
# reduce the workload of developers when there is a change in
# the project configuration.
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
# Set following variables according to the DOCKER_IMAGE_OSTYPE variable.
# The value of the DOCKER_IMAGE_OSTYPE variable matches the name of the
# base docker image.(ex, alpine/ubuntu/...)
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
if [ "X${DOCKER_IMAGE_OSTYPE}" = "Xalpine" ]; then
	PKGMGR_NAME="apk"
	PKGMGR_UPDATE_OPT="update -q --no-progress"
	PKGMGR_INSTALL_OPT="add -q --no-progress --no-cache"
	PKG_INSTALL_LIST_BUILDER="git build-base python3 yaml"
	PKG_INSTALL_LIST_BIN="npm libstdc++ yaml"
	PKG_INSTALL_LIST_NODEJS="nodejs npm"

elif [ "X${DOCKER_IMAGE_OSTYPE}" = "Xubuntu" ]; then
	PKGMGR_NAME="apt-get"
	PKGMGR_UPDATE_OPT="update -qq -y"
	PKGMGR_INSTALL_OPT="install -qq -y"
	PKG_INSTALL_LIST_BUILDER="git gcc g++ make curl"
	PKG_INSTALL_LIST_BIN="libyaml-0-2 curl"
	PKG_REPO_SETUP_NODEJS="curl -sL https://deb.nodesource.com/setup_14.x | bash"
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
