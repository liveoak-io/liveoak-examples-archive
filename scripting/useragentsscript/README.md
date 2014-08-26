LiveOak UserAgent Example
===========================

The UserAgent example retrieves the useragent of the device accessing the site and stores how many times that particular useragent has accessed the site.


Features
--------
* How to use the client to read, query, write and update other LiveOak resources.

* How to retrieve the headers of the client accessing the site.


Target
------

The target specified in the metadata.json file is set for every access under the /useragentscript/app path which currently only contains the /useragentscript/app/index.html file.

```
"target-path" : "/useragentsscript/app/**",
```

Running the Example
-------------------

The target for this example is setup to be applied to anything under the /useragentsscript/app/ path. There is only the index.html resource available here.

To try out this example:

* Open a browser and go to http://localhost:8080/useragentsscript/app/index.html

* Now go to the console's storage page at http://localhost:8080/admin#/applications/useragentsscript/storage/storage/browse/useragents

* You should see an entry with your browsers user agent in there and a counter for the number of times that page has been accessed by that particular browser.

* Refresh the page a few more times using your original browser and notice the counter increasing.

* Try accessing the index.html page in other browsers (or even things like wget or curl will work). And notice the new entries added to the useragents collection.

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
// The name of this application
var APPLICATION_NAME = "useragentsscript";
// The resource path to the storage resource
var STORAGE_RESOURCE = "/" + APPLICATION_NAME + "/storage";
// The resource path to the storage collection
var USERAGENT_COLLECTION = STORAGE_RESOURCE + "/useragents";

function postRead(response, libraries) {
    // get the client from the library object. The client allows for accessing other resources in LiveOak
    var client = libraries.client;

    //if the useragents collection does not exist, then create it
    var useragentsCollection = client.read(USERAGENT_COLLECTION);
    if (useragentsCollection == null) {
       var useragentsCollection = new liveoak.Resource('useragents');
       client.create(STORAGE_RESOURCE, useragentsCollection);
    }

    // The attributes from the request. This contains the http headers which contain the useragent string
    var attributes = response.request.context.attributes;

    var useragent;
    // check if we have any http headers, if not, then leave the useragent as undefined
    if (attributes != null && attributes.HTTP_REQUEST != null) {
       // get the useragent from the http headers.
       useragent = attributes.HTTP_REQUEST.headers["User-Agent"];
    }

    // if the useragent collection doesn't exist, then create one
    var useragentCollection = client.read(USERAGENT_COLLECTION);
    if (useragentCollection == null) {
      var useragentResource = new liveOak.Resource("useragents");
      client.create(STORAGE_RESOURCE, useragentResource);
    }

    // check if we already have this useragent in the colletion.
    var resources = client.read(USERAGENT_COLLECTION, { "q": "{'useragent': '"+ useragent + "'}", "fields": "*(*)"});
    // if we do already have this useragent, then update its count number
    if (resources.members != null && resources.members.size() > 0) {
      var resource = resources.members.get(0);
      resource.properties.count = resource.properties.count + 1;
      client.update(USERAGENT_COLLECTION + "/" + resource.id, resource);
    } else {
      var resource = new liveoak.Resource();
      resource.properties = { "useragent" : useragent, "count": 1};
      client.create(USERAGENT_COLLECTION, resource);
    }
}
```
