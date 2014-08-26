// A script which is used to determine if the values being submitted
// to the database are of a valid format.
//
// This example shows how to:
// 1) Retrieve the properties from a request
// 2) Throw a customized NotAcceptableError

function preCreate(request, libraries) {
    // get the resource object
    var resource = request.resource;

    // get its properties
    var properties = resource.properties;

    // check that we have the right amount of properties
    // Here we are enforcing that IDs have to be specified and not created by the system.
    if (properties.id == null || properties.size() != 4) {
        return new liveoak.NotAcceptableError("A product must have and only have an ID, name, description and price when creating");
    } else {
        // check if the properties are valid 
        return checkProduct(properties);
    }
}

function preUpdate(request, libraries) {
    // get the resoure's properties
    var properties = request.resource.properties;
   
    // some clients may send the id as a property on an update. If that is the case, remove it.
    if (properties.id != null) {
      properties.remove("id");
    }
 
    // check if we have the right amount of properties.
    // Note that on an update, the ID is no longer a property but a parameter of the resource object
    if (properties.size() != 3) {
        return new liveoak.NotAcceptableError("A product must have and only have a name, description and price when creating");
    } else {
        //check if the properties are valid
        return checkProduct(properties);
    }
}

function checkProduct(properties) {
    // check that all required properties exists
    if (properties.name == null || properties.description == null || properties.price == null) {
        return new liveoak.NotAcceptableError("A product must have a non-null name, description and price.");
    }

    // check that price is a proper monentary amount
    var price = properties.price;
    var dollarRegExp = /^[0-9]\d*\.\d{2}?/
    if (!(typeof price == "number") || !(dollarRegExp.test(price))) {
        return new liveoak.NotAcceptableError("A product's price must be a positive dollar amount (x.xx)");
    }
}
