LiveOak FormatScript Example
===========================

The FormatScript example is an example which shows how to enforce a specific format when storing data into LiveOak Storage. This allows you to make sure that a specific collection always contains properly formatted data.

Features
--------
* How to check the properties of an incoming create or update operation

* How to throw an error to deny updating the storage with invalid data


Target
------

The target specified in the metadata.json file is set for every access under the /formatscript/storage/products which corresponds to all entries in the product collection stored in the LiveOak Storage.

```
"target-path" : "/formatscript/storage/products/*"
```

Running the Example
-------------------

The target for this example is setup to be applied to a storage collection named 'products'. This collection will only accept entries where the has the id, name, description and price specified. A custom ID has to be specified on create, the script has been configured to not allow the id to be created by the system. The price must be a valid positive number in a dollar amount (eg 10.90  is valid, but -10.90 or "10.90" or 10.9 is not).

For this example you will need to create the collection and add an entry which conforms to the proper format the script expects.

* Goto http://localhost:8080/admin#/applications/formatscript/storage/storage/browse and click on 'New Collection'. Name your new collection 'products'

* Once your collection is created. Click on 'Add column' and add 3 columns named: 'name, 'description', 'price'

* Click on 'Add Row' to create a new entry. Note that for your entry to be valid you must specify the 'id', 'name', 'description' and 'price' (where price is a valid positive dollar amount). An example valid product would be something like as follows:

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
```
