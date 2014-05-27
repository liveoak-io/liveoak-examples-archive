Liveoak auth example
====================
This example demonstrates some basic functionality related to authentication to Liveoak. Authentication is provided by [Keycloak](http://www.keycloak.org) project.
This example is simple Javascript application, which you can use to login into Keycloak and obtain OAuth access token in JWT format from Keycloak. You can also try to send ajax request to 'storage' resource with access token attached in Authorization header.
Storage request will be successful just in case that you are authenticated.

Installing the application
--------------------------

Assumption is that:
* $LIVEOAK points to directory with your Liveoak server
* $LIVEOAK_EXAMPLES points to directory with Liveoak examples

So then copy the example in the _apps_ directory of your Liveoak server and start the server
```shell
$ cp -r $LIVEOAK_EXAMPLES/auth/auth-html $LIVEOAK/apps
$ sh $LIVEOAK/bin/standalone.sh
````

Setup the application
---------------------

* Create roles for your application (Manual step required)
  * Go to [http://localhost:8080/admin](http://localhost:8080/admin) and login as user "admin" with password "admin"
  * Go to [http://localhost:8080/admin#/applications/auth-html/application-settings](http://localhost:8080/admin#/applications/auth-html/application-settings) and add new role "user". Then you can also select "user" to be default role > Click "Save"

* Add HTML client for newly created application (Manual step currently required)

  * Go to [http://localhost:8080/admin#/applications/auth-html/application-clients](http://localhost:8080/admin#/applications/auth-html/application-clients)
  * Add Client
    * Name: "auth-html-client"
    * Platform: HTML-5
    * Redirect URI: "http://localhost:8080/auth-html/*" (click button "Add")
    * Web Origins: "http://localhost:8080" (click button "Add")
    * Scope: select "user" scope (if you can't add scopes for the first time, let's create client without scopes and then edit it later and add scopes)
   * Finally click "Save"

Running the application
-----------------------
* Open your browser and go to http://localhost:8080/auth-html . Now you should see the application with anonymous page

* After click to "login", you will be redirected to Keycloak login screen. Now you can register as some user or login if you already register user before.

* After successful login/registration you will be redirected back to application. You will see details about your access token, details about your profile and your roles.
You can click to "Invoke Storage", which will send ajax request to http://localhost:8080/auth-html/storage with usage of liveoak javascript SDK.
If you are not authenticated, you will see 401 error. In other case, you will see content of storage resource.
