/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
 */
todomvc.factory('todoStorage', function ($cacheFactory, $http) {
    var baseUrl = 'http://localhost:8080';

    var resource = {
        query: function (success) {
            $http.get(baseUrl + '/storage/todos').success(function (data) {
                    var members = data._members;
                    var tasks = [];
                    if (members) {
                        for (var i = 0; i < members.length; i++) {
                            $http.get(baseUrl + members[i].href).success(function (task) {
                                tasks.push(task);
                                if (tasks.length == members.length) {
                                    console.debug('query');
                                    success && success(tasks);
                                }
                            });
                        }
                    } else {
                        success && success([]);
                    }
                }
            );
        },

        save: function (todo, success) {
            console.debug('save ' + todo.title);
            $http.post(baseUrl + '/storage/todos', todo).success(function () {
                console.debug('saved ' + todo.title);
                success && success();
            });
        },

        update: function (todo, success) {
            console.debug('update ' + todo.title);
            $http.put(baseUrl + '/storage/todos/' + todo.id, todo).success(function () {
                console.debug('updated ' + todo.title);
                success && success(todo);
            });
        },

        remove: function (todo, success) {
            console.debug('delete ' + todo.title);
            $http.delete(baseUrl + '/storage/todos/' + todo.id).success(function () {
                console.debug('deleted ' + todo.title);
                success && success(todo);
            });
        }
    }

    return {
        query: function (success) {
            return resource.query(success);
        },

        remove: function (todo, success) {
            return resource.remove(todo, success);
        },

        save: function (todo, success) {
            return resource.save(todo, success);
        },

        update: function (todo, success) {
            return resource.update(todo, success);
        }
    };
});
