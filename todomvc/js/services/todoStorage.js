/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
 */
todomvc.factory('todoStorage', function (LiveOak, $rootScope) {

    var wrapSuccess = function (f, statusCode) {
        return function (data) {
            $rootScope.lastStatus = statusCode;
            if (f) {
                f(data);
            }

            // Refresh angular
            $rootScope.$digest();
        }
    };

    var wrapError = function (f) {
        return function(response) {
            // Change status code and display alert
            $rootScope.lastStatus = response.status;
            var errorMessage = "Error occured! Status: " + response.status + ", Status text: '" + response.statusText + "'";
            if (response.data) {
                errorMessage += ", Error details: " + JSON.stringify(data.data);
            }
            alert(errorMessage);

            // Apply wrapped function if available
            if (f) {
                f(response);
            }

            // Refresh angular
            $rootScope.$digest();
        }
    };

    return {
        query: function (query, success, error) {
            LiveOak.readMembers('/storage/todos', { query: query, sort: 'user,title', success: wrapSuccess(success, 200), error: wrapError(error) });
        },

        remove: function (todo, success, error) {
            LiveOak.remove('/storage/todos', todo, { success: wrapSuccess(success, 200), error: wrapError(error) });
        },

        save: function (todo, success, error) {
            LiveOak.save('/storage/todos', todo, { success: wrapSuccess(success, 201), error: wrapError(error) });
        },

        update: function (todo, success, error) {
            LiveOak.update('/storage/todos', todo, { success: wrapSuccess(success, 200), error: wrapError(error) });
        }
    };
});