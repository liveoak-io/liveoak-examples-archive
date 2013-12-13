/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
 */
todomvc.factory('todoStorage', function (LiveOak, $rootScope) {

    var wrap = function (f) {
        return function (data) {
            if (f) {
                $rootScope.$apply(f(data));
            }
        }
    }

    return {
        query: function (query, success, error) {
            LiveOak.readMembers('/storage/todos', { query: query, success: wrap(success), error: wrap(error)});
        },

        remove: function (todo, success, error) {
            LiveOak.remove('/storage/todos', todo, { success: wrap(success), error: wrap(error)});
        },

        save: function (todo, success, error) {
            LiveOak.save('/storage/todos', todo, { success: wrap(success), error: wrap(error) });
        },

        update: function (todo, success, error) {
            LiveOak.update('/storage/todos', todo, { success: wrap(success), error: wrap(error) });
        }
    };
});