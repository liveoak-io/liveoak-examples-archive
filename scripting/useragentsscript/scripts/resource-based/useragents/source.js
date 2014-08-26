// Script which will take the useragent from the client's device and use it to update
// a collection keeping track of which client devices are accessing the application.
//
// This example shows how to:
// 1) Use the client to read data from other liveoak resources
// 2) Use the client to write data
// 3) Use the client to query data
// 4) Use the client to update data 
// 5) retrieve the headers from the client accessing the application


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
