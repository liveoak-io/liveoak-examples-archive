Gallery Example
===============

This demo application runs in desktop, and mobile browser, and also provides REST endpoints for gallery-cordova application.


Installing the application
--------------------------

There are two ways that this example may be installed.

### Admin Console:

1. Click "Install Example Application" button, or "Try example applications" link from "Applications" page if you already have applications installed.
2. Click the "Gallery" example and then click "Install".

### Manually:

Assumption is that:
* $LIVEOAK points to the directory with your LiveOak server
* $LIVEOAK_EXAMPLES points to the directory with LiveOak examples

So then copy the example into the _apps_ directory of your LiveOak server and start the server
```shell
$ cp -r $LIVEOAK_EXAMPLES/gallery $LIVEOAK/apps
$ sh $LIVEOAK/bin/standalone.sh -b 0.0.0.0
````
MongoDB will automatically be started on port 27017.

Running the application
-----------------------

* Point your desktop browser to [http://localhost:8080/gallery/app/index.html](http://localhost:8080/gallery/app/index.html)

* Point your mobile device browser to http://INET_ADDRESS:8080/gallery/app/index.html
(where INET_ADDRESS is your local network address that can be determined by using 'ifconfig' from shell)

See detailed documentation [here](http://liveoak.io/docs/guides/tutorial_gallery/#gallery-web-application) .
