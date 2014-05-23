Basic Cordova Example
=====================

Before running this example you need to have Cordova installed with a phone or emulator available.

Start LiveOak
----------------------------

Start LiveOak bound to an IP address available to the phone or emulator. For example:

    liveoak -b 10.0.0.140 <LIVEOAK EXAMPLES>/todomvc-cordova

Edit 'www/index.html' and change the URL for 'liveoak.js'.


Install to Android phone or emulator
------------------------------------

    mkdir platforms plugins
    cordova plugin add org.apache.cordova.inappbrowser
    cordova platform add android
    cordova run android


Once the application is opened you can login with username: 'bob', and password: 'password'.
