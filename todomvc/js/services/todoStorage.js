/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
 */
todomvc.factory('todoStorage', function ($cacheFactory, $http) {
    var baseUrl = 'http://localhost:8080';

    var resource = {
        query: function (query, success) {
            var url = baseUrl + '/storage/todos?expand=*';
            console.debug('query = ' + query);
            if (query) {
                url += '&q=' + query;
            }
            $http.get(url).success(function (data) {
                if (!data._members) {
                    data._members = [];
                }
                success && success(data._members);
            });
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
            console.debug(todo);
            var t = angular.copy(todo);
            delete t.self;
            $http.put(baseUrl + '/storage/todos/' + todo.id, t).success(function () {
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
        query: function (query, success) {
            return resource.query(query, success);
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
