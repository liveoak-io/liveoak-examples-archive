# AngularJS TodoMVC Example

> HTML is great for declaring static documents, but it falters when we try to use it for declaring dynamic views in web-applications. AngularJS lets you extend HTML vocabulary for your application. The resulting environment is extraordinarily expressive, readable, and quick to develop.

> _[AngularJS - angularjs.org](http://angularjs.org)_


## Learning AngularJS
The [AngularJS website](http://angularjs.org) is a great resource for getting started.

Here are some links you may find helpful:

* [Tutorial](http://docs.angularjs.org/tutorial)
* [API Reference](http://docs.angularjs.org/api)
* [Developer Guide](http://docs.angularjs.org/guide)
* [Applications built with AngularJS](http://builtwith.angularjs.org)
* [Blog](http://blog.angularjs.org)
* [FAQ](http://docs.angularjs.org/misc/faq)
* [AngularJS Recipes](https://leanpub.com/recipes-with-angular-js/read)
* [Practical AngularJS](https://leanpub.com/Practical_AngularJS/read)
* [Hands-on AngularJs Video Tutorial](https://tutsplus.com/course/hands-on-angular/)

Articles and guides from the community:

* [Code School AngularJS course](http://www.codeschool.com/code_tv/angularjs-part-1)
* [5 Awesome AngularJS Features](http://net.tutsplus.com/tutorials/javascript-ajax/5-awesome-angularjs-features)
* [Using Yeoman with AngularJS](http://briantford.com/blog/angular-yeoman.html)
* [me&ngular - an introduction to MVW](http://stephenplusplus.github.io/meangular)

Get help from other AngularJS users:

* [Walkthroughs and Tutorials on YouTube](http://www.youtube.com/playlist?list=PL1w1q3fL4pmgqpzb-XhG7Clgi67d_OHXz)
* [Google Groups mailing list](https://groups.google.com/forum/?fromgroups#!forum/angular)
* [angularjs on Stack Overflow](http://stackoverflow.com/questions/tagged/angularjs)
* [AngularJS on Twitter](https://twitter.com/angularjs)
* [AngularjS on Google +](https://plus.google.com/+AngularJS/posts)
* [Yearofmoo AngularJS articles](http://www.yearofmoo.com/search/?q=Angularjs)

_If you have other helpful links to share, or find any of the links above no longer work, please [let us know](https://github.com/tastejs/todomvc/issues)._

Liveoak integration
===================
Current version of this todoMVC example demonstrates authorization possibilities of LiveOak project.

Steps to run the application
----------------------------
1. Clone LiveOak project ( https://github.com/liveoak-io/liveoak ) to some directory on your laptop and build it with "mvn clean install".
You will need JDK8 to successfully build it.

Next steps assume that you have LiveOak in directory: /tmp/liveoak

2. Clone directory with liveoak-examples from github. Next steps assume that you have them in /tmp/liveoak-examples

3. Install and run MongoDB database on your host on port 27017. Then create database "liveoak" and collection "todos" in this database.

4. Run 'todomvc' example via CMD:
$cd /tmp/liveoak
$./launcher/bin/liveoak /tmp/liveoak-examples/todomvc

5. After successful boot, let's open your browser and go to http://localhost:8080/todomvc/app/index.html . You will be redirected to Keycloak login console.
Now you can either register new account or try one of predefined ones. Predefined accounts are defined in keycloak-config.json file (See keycloak documentation for more details). So right now there is:
- User "bob" with password "password"
- User "john" with password "password"
- User "mary" with password "password"

6. Authorization rules of todoMVC application:
- User "john" has role "user". He is able to see list of his own todos and he is able to create new todos for himself and also update or delete his own todos.
He is not able to see todos of different users and/or create,update or delete todos of different user. He is also not able to change ownership of his todos to different user.

- User "bob" has roles "admin" and "user". He is able to do everything (create/update/remove todos for him or for any other user. He can see todos of all users)

- User "mary" hasn't any role and so she is not able to do anything (read or create any todo including her own todos)

Self-registered users will automatically have role "user" as this is auto-registration role. Hence they have same privileges as "john" user

7. "Attack" part of the page allows to play a bit with authorization. In "attack" mode, you can request to see all todos (only admin has permission for it),
you can skip sending Authorization header in ajax HTTP requests to storage resource (All requests will result in 401 error)
 or you can select different user, so that you can try to See todos of different user and create/update todos for this user (Only admin has permission for it)

8. You can visit: http://localhost:8383/auth/admin to see Keycloak admin console. You can login as admin/admin and then you can edit "default" realm and do something with it (create new roles, users etc.)

9. Keycloak is using embedded H2 DB by default. To enforce deleting it and start from scratch, you can run:
$rm /tmp/keycloak.db*
