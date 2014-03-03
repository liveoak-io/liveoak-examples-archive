Liveoak auth example
====================
This example demonstrates some basic functionality related to authentication to Keycloak/Liveoak. It's simple Javascript application, which you can use to login
into Keycloak and obtain OAuth access token in JWT format from Keycloak. You can also try to send ajax request to 'storage' resource with access token attached in Authorization header.
Storage request will be successful just in case that you are authenticated.

Steps to run the application
----------------------------
1. Clone LiveOak project ( https://github.com/liveoak-io/liveoak ) to some directory on your laptop and build it with "mvn clean install".
You will need JDK8 to successfully build it.

Next steps assume that you have LiveOak in directory: /tmp/liveoak

2. Clone directory with liveoak-examples from github. Next steps assume that you have them in /tmp/liveoak-examples

3. Run LiveOak 'auth' application via CMD command:
$cd /tmp/liveoak
$./launcher/bin/liveoak /tmp/liveoak-examples/auth

4. After successful boot, let's open your browser and go to http://localhost:8080/auth/app/index.html . Now you should see the application with anonymous page

5. After click to "login", you will be redirected to Keycloak. Now you can either register new account or try one of predefined ones.
Predefined accounts are defined in keycloak-config.json file (See keycloak documentation for more details). So right now there is:
- User "bob" with password "password"
- User "john" with password "password"
- User "mary" with password "password"

After successful login you will be redirected back to application. You will see details about your access token, details about your profile and your roles.
You can click to "Invoke Storage", which will send ajax request to http://localhost:8080/storage with usage of liveoak javascript SDK.
If you are not authenticated, you will see 401 error. In other case, you will see content of storage resource.

- NOTE: For invoking storage resource, there is assumption that you have MongoDB up and running on localhost, port 27017 and you have database "mboss" available. Otherwise you will likely see error 500 after click to "storage" resource
- NOTE: User "mary" doesn't have any role available. Hence she is not able to invoke storage resource and she is also not able to see her user profile

6. You can visit: http://localhost:8383/auth/admin to see Keycloak admin console. You can login as admin/admin and then you can edit "default" realm and do something with it (create new roles, users etc.)
