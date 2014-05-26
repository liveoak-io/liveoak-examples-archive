Gallery Example
===============

This demo application runs in desktop, and mobile browser, and also provides REST endpoints for gallery-cordova application.


Running
-------

* Copy the example in the _apps_ directory and start Liveoak. This will "deploy" the gallery application to be available on Liveoak server.
```shell
    cp -r _liveoak-examples_/gallery _liveoak_/apps
    sh _liveoak_/bin/standalone.sh -b 0.0.0.0
````
MongoDB will automatically be started on port 27017.

* Point your desktop browser to [http://localhost:8080/gallery/app/index.html](http://localhost:8080/gallery/app/index.html)

* Point your mobile device browser to http://INET_ADDRESS:8080/gallery/app/index.html
(where INET_ADDRESS is your local network address that can be determined by using 'ifconfig' from shell)

See detailed documentation [here](http://liveoak.io/docs/guides/tutorial_gallery/#gallery-web-application) .


