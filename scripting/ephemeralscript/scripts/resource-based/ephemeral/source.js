// A simple script which will automatically remove any entry in the 'epheremal' storage collection
// after it has been read by one person. Entries in this collection will also not be editable.
//
// Note: for this example, since we are using the admin console to create the entries, we will not
// remove the entry if the user has an 'admin' role. Otherwise the entry would be deleted once its
// created and viewed in the console itself.
//
// This example shows how to:
// 1) Determine the role of the user accessing the resource using the SecurityContext
// 2) Delete an entry using the client
// 3) Make an data entry non-editable


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
    client.delete(response.resource.uri); 
}

function preCreate(request, libraries) {
    var properties = request.resource.properties;
    properties["created-at"] = Date.now();
}


// Disable update support on this type of resource.
function preUpdate(request, libraries) {
    return new liveoak.UpdateNotSupportedError("The ephemeral collection does not support updating");
}
