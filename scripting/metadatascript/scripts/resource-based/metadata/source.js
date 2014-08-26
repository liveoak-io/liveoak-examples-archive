// A simple script which automatically adds in a last-modified-by and last-modified-at
// metadata to storage resources when they are created. These values are set by the system and 
// are not user modifiable.
//
// When the resource is read by a normal user, they will not be presented with this metadata.
// If the resource is read by a user with the 'admin' role, they will be presented with the metadata.
//
//
// This example shows how to:
// 1) Determine the role of the user accessing the resource using the SecurityContext
// 2) Modify the incoming request
// 3) Modify the outgoing response


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
