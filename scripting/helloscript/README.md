LiveOak HelloScript Example
===========================

The HelloScript example is a simple example which will print a message to the log whenever any resource is read in this application.

Features
--------
* How to setup the preRead and postRead javascript functions

* How to retrieve the path from the request and response objects


Target
------

The target specified in the metadata.json file is set for every access under the /helloscript url.

```
"target-path" : "/helloscript/**"
```

Running the Example
-------------------

Since the example's target path is for everything under the /helloscript url, you can run the example by accessing anything under this context and watching the logs for the message output.

Possible urls include:

* http://localhost:8080/helloscript/storage 

* http://localhost:8080/helloscript/client

* http://localhost:8080/helloscript/client/client.js


Script
------

```
function preRead(request, libraries) {
        print("Hello incoming request for " + request.path);
}

function postRead(response, libraries) {
        print("Goodbye outgoing response for " + response.request.path);
}
```
