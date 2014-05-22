# LiveOak AngularJS TodoMVC Example
===================================
This example is based on the example http://todomvc.com/architecture-examples/angularjs/#/ . Our example is integrated with Keycloak and it's showing security possibilities of Liveoak (among other things).

Steps to run the application
----------------------------
* Copy the example in the _apps_ directory and start Liveoak

	$ cp -r _liveoak examples_/todomvc _liveoak_/apps

	$ sh _liveoak_/bin/standalone.sh

* Add the application in keycloak (Manual step currently required)

 * Go to http://localhost:8080/auth/admin/index.html#/realms/liveoak-apps/applications
 * Add Application (or edit application "todomvc" if it already exists)
   * Name: "todomvc"
   * client-type: "public"
   * Redirect URI: "http://localhost:8080/todomvc/*" (click button "Add")
   * Base URL: "http://localhost:8080/todomvc"
   * Admin URL: "http://localhost:8080/todomvc"
   * Web Origins: "http://localhost:8080" (click button "Add")
 * Finally click "Save"

* Create roles for newly created application (Manual step required)
  * Go to http://localhost:8080/auth/admin/liveoak-admin/console/index.html#/realms/liveoak-apps/applications/todomvc/roles
  * Add Role > Role name: "admin" > Click "Save"
  * Repeat the same and add also role "user"
  * When you open http://localhost:8080/auth/admin/liveoak-admin/console/index.html#/realms/liveoak-apps/applications/todomvc/roles you should see 2 roles: "admin" and "user"
  * Role names are important, because authorization is configured to deal with those 2 roles.

* Create some default users for testing purposes (their names and default passwords are not important, feel free to use different names):
  * Go to http://localhost:8080/auth/admin/liveoak-admin/console/index.html#/realms/liveoak-apps/users
  * Add User > username: "bob" > Save
  * Then open http://localhost:8080/auth/admin/liveoak-admin/console/index.html#/realms/liveoak-apps/users/bob/user-credentials and fill some initial password for user "bob". Note that bob will need to change this default password when he try to login for the first time.
  * Then open http://localhost:8080/auth/admin/liveoak-admin/console/index.html#/realms/liveoak-apps/users/bob/role-mappings and select application "todomvc" and move both available roles "admin" and "user" to the assigned roles. This means that bob will be both "admin" and "user" .
  * Repeat the steps and create another user "john", but assign him just to role "user"
  * Repeat the steps again and create last user "mary" and don't assign her to any role

* Open your browser at http://localhost:8080/todomvc

Users
-----
- User 'bob' with password 'password' is admin and can do anything. He can create new todos, but he also automatically see todos of all users and he can update or delete them

- User 'mary' with password 'password' doesn't have any roles and she can't do anything. She can't create new todos and also she can't see any todos. Basically mary can't do anything.
You will receive authorization error directly after login as mary.

- User 'john' with password 'password' is normal user. He can create new todos and he can view his own todos and update or delete them, but he can't read, update or delete todos that weren't created by himself.
