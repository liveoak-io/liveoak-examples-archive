/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
 */
todomvc.factory('todoStorage', function ($cacheFactory, $http) {
    var baseUrl = 'http://localhost:8080';
    var resource = {
        query: function (query, success, error) {
            var url = baseUrl + '/storage/todos?expand=*';
            if (query) {
                url += '&q=' + JSON.stringify(query);
            }
            $http.get(url).success(function (data) {
                console.debug('retrieved tasks list');
                if (!data._members) {
                    data._members = [];
                }
                success && success(data._members);
            }).error(error);
        },

        save: function (todo, success, error) {
            $http.post(baseUrl + '/storage/todos', todo).success(function () {
                console.debug('saved ' + todo.title);
                success && success();
            }).error(error);
        },

        update: function (todo, success, error) {
            console.debug(todo);
            var t = angular.copy(todo);
            delete t.self;
            $http.put(baseUrl + '/storage/todos/' + todo.id, t).success(function () {
                console.debug('updated ' + todo.title);
                success && success(todo);
            }).error(error);
        },

        remove: function (todo, success, error) {
            $http.delete(baseUrl + '/storage/todos/' + todo.id).success(function () {
                console.debug('deleted ' + todo.title);
                success && success(todo);
            }).error(error);
        }
    }

    return {
        query: function (query, success, error) {
            return resource.query(query, success, error);
        },

        remove: function (todo, success, error) {
            return resource.remove(todo, success, error);
        },

        save: function (todo, success, error) {
            return resource.save(todo, success, error);
        },

        update: function (todo, success, error) {
            return resource.update(todo, success, error);
        }
    };
});