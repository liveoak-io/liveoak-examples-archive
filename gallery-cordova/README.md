Gallery Cordova Android Example
===============================

This demo application runs as a native application on a mobile device or emulator. It connects remotely to LiveOak endpoints provided by 'gallery' example application.


Running
-------

* Run Gallery application on LiveOak as described in Gallery Example README.md

* Open www/js/app.js, and set the value of HOST variable (line 2) to INET_ADDRESS where Gallery is running. Currently it is set to 10.0.2.2 which corresponds to a localhost running an Android emulator.

* Set up Cordova native Android project:

    mkdir platforms plugins
    cordova plugin add org.apache.cordova.inappbrowser
    cordova platform add android

* Build native application from web app, and run it
    cordova run android

Whenever you change web application in www/ simply rerun the last command, to rebuild it as native Android app.

