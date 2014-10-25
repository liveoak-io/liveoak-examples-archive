LiveOak Native iOS Chat Application
=======================================

A video demonstrating the application in action can be found [here](https://vimeo.com/91153337)

Features
--------
* Native iOS integration with resources stored in a liveoak instance

* Native notifications of resource subscription from APNS via integration with the Aerogear Unified Push Server (UPS)

* System notifications when the application is in the background (using "content-available" flag for immediate fetch of new chat messages)


Steps to Run the Application
----------------------------

There are three main parts to configuring and setting up the application:

1) Configure and setup an Aerogear UPS instance. This will also require setting up and configuring APNS.

2) Setting up and configuring an LiveOak instance.

3) Building the Native iOS Application


Aerogear UPS Configuration
-------------------------------------

For the example to work you will need a running and configured AeroGear UPS server. 

Please see the [Aerogear iOS Push Documentation](http://aerogear.org/docs/guides/aerogear-push-ios/) for more detailed information. 

###A high level breakdown of what you will to accomplish:

1) Install [Wild Fly](http://wildfly.org/downloads/) and deploy the [UPS war](http://dl.bintray.com/aerogear/AeroGear-UnifiedPush/org/jboss/aerogear/unifiedpush/unifiedpush-server/0.10.1/unifiedpush-server-0.10.1.war) and the [hs data source file](https://raw.github.com/aerogear/aerogear-unifiedpush-server/0.10.x/databases/unifiedpush-h2-ds.xml).

If installed correctly you should be able to access the UPS Admin console at http://myhost:myport/unifiedpush-server-0.10.1 [Default admin password is '123'].

Note: since you will be running the application on an external device you will want to bind the UPS server to location that the external device can access. If you are running both the liveoak example and the UPS server on the same machine, you will want to have them running on separate ports. The easiest way to do this is to specify -Djboss.socket.binding.port-offset=1 when starting the UPS server. This will start the wild fly instance on port 8081 instead of 8080.

2) Configure this instance for APNS Messaging support
  
  - Configure [Apple App ID and SSL Certificate for APNs](http://aerogear.org/docs/guides/aerogear-push-ios/app-id-ssl-certificate-apns)
  - Configure [Apple Provisioning Profile](http://aerogear.org/docs/guides/aerogear-push-ios/provisioning-profiles)

3) [Configure the UPS instance to register an iOS variant](http://aerogear.org/docs/guides/aerogear-push-ios/unified-push-server). Note: using the UPS console may be easier here than using the curl commands.

  - Once logged into the UPS console, click on 'Create...' to create a new UPS application
  - Give your application a name (ie LiveOak-Chat). Click on 'Create'
  - Your application should now be displayed in list of applications. Click on it.
  - Under Variants, click 'Add'
  - Give your variant an name (ie 'LiveOak-Chat iOS')
  - Under the 'Apple Push Network' section enter the certificate passphrase and upload the apropriate (development or production) certificates created earlier.
  - Click create.
  - **Make note of the Application ID and Master Secret displayed here** You will need this when configuring the example.
  - Click on your newly created variant
  - **Make note of the Variant ID, Secret** You will need this when configuring the iOS Chat Example.

LiveOak Configuration
------------------------------

For LiveOak you will need to deploy the chat-html hosted application and configure a storage collection to store the chats: 

1) Have a MongoDB instance up and running and available at the host and ports specified in the chat-html's application.json file

2) Make sure you have a collection called 'chat' within the database specified in the application.json file. If you do not have a collection called 'chat' you can create it through the liveoak system using the following curl command:

```
curl -X POST --header "Content-Type:application/json" http://10.42.0.1:8080/chat/storage/ --data "{ id: 'chat', capped: true, size: 102400, max:100}"
```

This will create a capped collection of size 100 kilobytes which will stores 100 entries (eg chats). Since its a capped collection, it will only store 100 chats, or 100 kilobytes of data, before new chats will overwrite the old ones. Capped collections will also always preserve the insertion order.

3) Configure the chat's application.json file to include Application ID and Master secret obtained from the UPS Console. You will need to uncomment the 'push' configuration settings here and fill in the correct data.

That's it for the LiveOak configuration.


Building the Example
--------------------

### Configuring the Example

The project requires [CocoaPods](http://cocoapods.org/) for dependency management;

Simply run the following inside the project folder to install the required dependencies

    pod install

Once done, double-click 'LiveOak-Chat.xcworkspace' to open the project in Xcode.

Now, you will need to modify the code to include the configurations for LiveOak and UPS. This will require modifying the Service/LOAPIClient.m file.

UPS Configuration: add the UPS URL location and the variant ID and variant secret

```c
static NSString *const kUPSHost = @"<INSERT UPS URL HERE>"; //e.g. "http://myhost:myport/unifiedpush-server-0.10.1";
static NSString *const kVariantId = @"<INSERT VARIANT ID HERE>";
static NSString *const kSVariantSecret = @"<INSERT VARIANT SECRET HERE>";
```

LiveOak Configuration: add the URL of your application hosted in LiveOak 

```c
static NSString *const kLiveOakChatAPIBaseURLString = @"INSERT LIVEOAK APPLICATION URL" // e.g. "http://myhost:myport/chat-html";
```

Running the Application
-------------------------------
From your iOS device, run the 'LiveOak Chat' application. Chats from the application will appear in the hosted html chat application and vise versa. If the application is not in focus you will even receive system notifications about them.

To logout of the chat application and to stop receiving notifications of new chats, just use the 'logout' button from the action bar.
