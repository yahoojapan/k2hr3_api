K2HR3 REST API(k2hr3-api)
-------------------------
[![Node.js AntPickax CI](https://github.com/yahoojapan/k2hr3_api/workflows/Node.js%20AntPickax%20CI/badge.svg)](https://github.com/yahoojapan/k2hr3_api/actions)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/yahoojapan/k2hr3_api/master/LICENSE)
[![GitHub forks](https://img.shields.io/github/forks/yahoojapan/k2hr3_api.svg)](https://github.com/yahoojapan/k2hr3_api/network)
[![GitHub stars](https://img.shields.io/github/stars/yahoojapan/k2hr3_api.svg)](https://github.com/yahoojapan/k2hr3_api/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/yahoojapan/k2hr3_api.svg)](https://github.com/yahoojapan/k2hr3_api/issues)
[![NPM packages](https://badge.fury.io/js/k2hr3-api.svg)](https://badge.fury.io/js/k2hr3-api)
[![Docker image](https://img.shields.io/docker/pulls/antpickax/k2hr3-api.svg)](https://hub.docker.com/r/antpickax/k2hr3-api)

## **K2HR3** - **K2H**dkc based **R**esource and **R**oles and policy **R**ules

![K2HR3 system](https://k2hr3.antpick.ax/images/top_k2hr3.png)

### K2HR3 system overview
**K2HR3** (**K2H**dkc based **R**esource and **R**oles and policy **R**ules) is one of extended **RBAC** (**R**ole **B**ased **A**ccess **C**ontrol) system.  
K2HR3 works as RBAC in cooperation with **OpenStack** which is one of **IaaS**(Infrastructure as a Service), and also provides useful functions for using RBAC.  

K2HR3 is a system that defines and controls **HOW**(policy Rule), **WHO**(Role), **WHAT**(Resource), as RBAC.  
Users of K2HR3 can define **Role**(WHO) groups to access freely defined **Resource**(WHAT) and control access by **policy Rule**(HOW).  
By defining the information and assets required for any system as a **Resource**(WHAT), K2HR3 system can give the opportunity to provide access control in every situation.  

K2HR3 provides **+SERVICE** feature, it **strongly supports** user system, function and information linkage.

![K2HR3 system overview](https://k2hr3.antpick.ax/images/overview_abstract.png)

K2HR3 is built [k2hdkc](https://github.com/yahoojapan/k2hdkc), [k2hash](https://github.com/yahoojapan/k2hash), [chmpx](https://github.com/yahoojapan/chmpx) and [k2hash transaction plugin](https://github.com/yahoojapan/k2htp_dtor) components by [AntPickax](https://antpick.ax/).

### K2HR3 REST API
**K2HR3 REST API** provides for manipulating data such as **ROLE**, **POLICY RULE**, **RESOURCE** and **SERVICE** stored in the K2HR3 Data Server([k2hdkc](https://github.com/yahoojapan/k2hdkc)).  

Using the K2HR3 REST API provided by this K2HR3 API server, the [K2HR3 Web Application](https://k2hr3.antpick.ax/usage_app.html) and its Web Server communicates with the K2HR3 Data Server([k2hdkc](https://github.com/yahoojapan/k2hdkc)).  
And users and hosts of the ROLE member directly call this K2HR3 REST API on this K2HR3 API Server, and get/put RESOURCE data.  

K2HR3 REST API and K2HR3 API Server is the server side JavaScript program running on [Node.js](https://nodejs.org/).  

![K2HR3 system overview](https://k2hr3.antpick.ax/images/detail_system_overview.png)

### Documents
[K2HR3 Document](https://k2hr3.antpick.ax/index.html)  
[K2HR3 Web Application Usage](https://k2hr3.antpick.ax/usage_app.html)  
[K2HR3 Command Line Interface Usage](https://k2hr3.antpick.ax/cli.html)  
[K2HR3 REST API Usage](https://k2hr3.antpick.ax/api.html)  
[K2HR3 OpenStack Notification Listener Usage](https://k2hr3.antpick.ax/detail_osnl.html)  
[K2HR3 Watcher Usage](https://k2hr3.antpick.ax/tools.html)  
[K2HR3 Get Resource Usage](https://k2hr3.antpick.ax/tools.html)  
[K2HR3 Utilities for Setup](https://k2hr3.antpick.ax/setup.html)  
[K2HR3 Demonstration](https://demo.k2hr3.antpick.ax/)

[About k2hdkc](https://k2hdkc.antpick.ax/)  
[About k2hash](https://k2hash.antpick.ax/)  
[About chmpx](https://chmpx.antpick.ax/)  
[About k2hash transaction plugin](https://k2htpdtor.antpick.ax/)  

[About AntPickax](https://antpick.ax/)  

### Repositories
[K2HR3 main repository](https://github.com/yahoojapan/k2hr3)  
[K2HR3 Web Application repository](https://github.com/yahoojapan/k2hr3_app)  
[K2HR3 Command Line Interface repository](https://github.com/yahoojapan/k2hr3_cli)  
[K2HR3 REST API repository](https://github.com/yahoojapan/k2hr3_api)  
[K2HR3 OpenStack Notification Listener](https://github.com/yahoojapan/k2hr3_osnl)  
[K2HR3 Utilities](https://github.com/yahoojapan/k2hr3_utils)  
[K2HR3 Container Registration Sidecar](https://github.com/yahoojapan/k2hr3_sidecar)  
[K2HR3 Get Resource](https://github.com/yahoojapan/k2hr3_get_resource)  

[k2hdkc](https://github.com/yahoojapan/k2hdkc)  
[k2hash](https://github.com/yahoojapan/k2hash)  
[chmpx](https://github.com/yahoojapan/chmpx)  
[k2hash transaction plugin](https://github.com/yahoojapan/k2htp_dtor)  

### Packages
[k2hr3-api(npm packages)](https://www.npmjs.com/package/k2hr3-api)  

### Docker images
[k2hr3-api(Docker Hub)](https://hub.docker.com/r/antpickax/k2hr3-api)

### License
This software is released under the MIT License, see the license file.

### AntPickax
K2HR3 is one of [AntPickax](https://antpick.ax/) products.

Copyright(C) 2017 Yahoo Japan Corporation.
