Gallery Example
===============

This demo application runs in desktop, and mobile browser, and also provides REST endpoints for gallery-cordova application.


Running
-------

The directory containing this README file is this application's root directory. To start this application from its root directory use:

    $LIVEOAK_HOME/launcher/liveoak -b 0.0.0.0 .

Where the last parameter specifies path to application that we want to be deployed (in our case current directory).

MongoDB will automatically be started on port 27017.

* Point your desktop browser to http://localhost:8080/gallery/app/index.html

* Point your mobile device browser to http://INET_ADDRESS:8080/gallery/app/index.html
(where INET_ADDRESS is your local network address that can be determined by using 'ifconfig' from shell)


