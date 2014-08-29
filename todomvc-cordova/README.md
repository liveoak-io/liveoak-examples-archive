Basic Cordova Example
=====================

Version of Todomvc application running on Cordova. Before running this example you need to have Cordova installed with a phone or emulator available.

Installing the application
--------------------------

* Run Todomvc application on LiveOak and setup it as described in Todomvc Example README.md

* Edit 'www/index.html' and change the URL for 'liveoak.js' . You need to change host and replace it with real INET_ADDRESS of your host where LiveOak with TodoMVC deployed is running. Currently it is set to 192.168.2.7 which corresponds to a localhost running an Android emulator.

* Set up Cordova native Android project:

```shell
$ mkdir platforms plugins
$ cordova plugin add org.apache.cordova.inappbrowser
$ cordova platform add android
````

Setup the application
---------------------
* Add client for newly created application (Manual step currently required)

  * Go to [http://localhost:8080/admin#/applications/todomvc/application-clients](http://localhost:8080/admin#/applications/todomvc/application-clients)
  * Add Client
    * Name: "todomvc-cordova-client"
    * Platform: Android
    * Redirect URI: "http://localhost"
    * Web origin: "http://localhost"
    * Scope: select both "admin" and "user" scopes
    * Finally click "Save"

Running the application
-----------------------

* Build native application from web app, and run it:

```shell
$ cordova run android
````


Once the application is opened you can login with username: 'bob', and password: 'password' or use other account as specified in README of Todomvc example.
