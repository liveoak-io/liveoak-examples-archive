LiveOak MetaDataScript Example
==============================

The HelloScript example will add _'last-modified'_ metadata to any resource being created or modified into the LiveOak Storage. The script will also remove the metadata when returning a result to a user not having the _'admin'_ role.

Features
--------
* How to modify the incoming request

* How to modify the outgoing response

* How to access the security context data and retrieve the user's role.



Target
------

The target specified in the metadata.json file is set for every access under the /metadascript/storage path, which means every entry in every collection added to this LiveOak Storage will have metadata added.

```
"target-path" : "/metadatascript/storage/**"
```

Running the Example
-------------------

The target for this example is setup to be applied to any storage collection added. This means any storage collection created will have the 'last-modified-by' (user's id)  and 'last-modified-at' (timestamp) fields added. These metadata fields will only be returned to users which have the 'admin' role.

To see how this example works, you will need to create a storage collection or two and add in some initial data.

* Goto http://localhost:8080/admin#/applications/metadatascript/storage/storage/browse and click on 'New Collection'. Name your new collection 'test'

* Once your collection is created. Click on 'Add column' and add a column. For example, call your column 'name'

* Click on 'Add Row' to create a new entry. Set the name value to "foo".

* Notice in the console that there are now two extra fields added: 'last-modified-by' which contians the ID of the user which created the entry (Note: the user's 'id' is not the same as their username) and a 'last-modified-at' which is the timestamp.

* If you access the storage directly without being logged in as an admin (For instance by viewing one of the resources under http://localhost:8080/metadatascript/storage/test/) then the 'last-modified' fields should not be visible.

```
id: "product123"
name: "Large Mug"
description: "A large mug, perfect for coffee"
price: 8.95
```

* Try and create a new entry, but this time by leaving out a one of the fields or using an invalid price value (eg -0.99, 0.9, "8.95", "$8.95", "5 dollars", ...). You should receive an error and your new entry will not be added to the storage.

* Or try and update an already existing entry but removing one of the required fields. The updated value should not be saved to storage.


Script
------

```
function preCreate(request, libraries) {
    addMetaData(request);
}

function preUpdate(request, libraries) {
    addMetaData(request);
}

function postRead(response, libraries) {
    // if the user has an 'admin' role then return the object unmodified.
    var securityContext = response.request.context.securityContext;
    if (securityContext.authenticated && securityContext.hasRole('admin')) {
        return;
    }

    // otherwise we will remove the last-modified-by and last-modified-at properties
    if (response != null && response.resource != null) {
      var properties = response.resource.properties;
      properties.remove("last-modified-by");
      properties.remove("last-modified-at");
    }
}

function addMetaData(request) {
    var properties = request.resource.properties;
    var requestContext = request.context;

    // set the default value if case the use is not currently authenticated
    var subject = "UNAUTHENTICATED USER";
    // if the user is already authenticated, then use their actual subject value
    if (requestContext != null && requestContext.securityContext != null && requestContext.securityContext.authenticated) {
        subject = requestContext.securityContext.subject;
    }

    // add the subject to the object being created
    properties["last-modified-by"] =  subject;
    // add the timestamp to the current time of the system.
    properties["last-modified-at"] = Date.now();

}

```
