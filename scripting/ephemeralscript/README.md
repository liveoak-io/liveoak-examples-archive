LiveOak Ephemeral Example
==============================

The EphemeralScript example will make it so that resources in the 'emphermal' collection are only available to be read once. After that they are removed from the system. These entries will also have their editing capabilities disabled via the script.

NOTE: in this example, the admin will be able to read the entries in this collection without causing the resource to be removed.

Features
--------
* Determine the role of the user accessing the resource using the SecurityContext 

* How to delete a resource using the client

* How to make a resource non-modifiable


Target
------

The target specified in the metadata.json file is set for every access under the /emphemeralscript/storage/emphemeral path, which means only entries in the emphemeral collection will have the script applied.

```
"target-path" : "/ephemeralscript/storage/ephemeral/*"
```

Running the Example
-------------------

The target for this example is setup to be applied to storage collection named 'emphemeral'

To see how this example works, you will need to create a storage collection called 'emphemeral'.

* Goto http://localhost:8080/admin#/applications/ephemeralscript/storage/storage/browse and click on 'New Collection'. Name your new collection 'emphemeral'

* Once your collection is created. Click on 'Add column' and add a column. For example, create a column named 'name' and a column named 'message'

* Click on 'Add Row' to create a new entry. Add in values for the 'name' and 'message' row.

* Try and edit the entry. Notice that an error occurs if you try and edit anything.

* Open the storage collection directly in the browser (http://localhost:8080/ephemeralscript/storage/ephemeral). If you click on your entry here, you will be able to read it but you will be the only one. Refresh your browser or check the console to see that it is now gone.


Script
------

```
// The name of this application
var APPLICATION_NAME = "ephemeralscript";
// The resource path to the storage resource
var STORAGE_RESOURCE = "/" + APPLICATION_NAME + "/storage";
// The resource path to the storage collection
var EPHEMERAL_COLLECTION = STORAGE_RESOURCE + "/ephemeral";

function postRead(response, libraries) {
    // if the user has the 'admin' role, then return without removing the object.
    // For this example we want the user to be able to create the object in the console, since
    // the object is read when its created, this would otherewise remove the example entry immediately
    var securityContext = response.request.context.securityContext;
    if (securityContext.authenticated && securityContext.hasRole('admin')) {
        return;
    }

    var client = libraries.client;
    client.remove(response.resource.uri);
}

function preCreate(request, libraries) {
    var properties = request.resource.properties;
    properties["created-at"] = Date.now();
}


// Disable update support on this type of resource.
function preUpdate(request, libraries) {
    return new UpdateNotSupportedError("The ephemeral collection does not support updating");
}
```
