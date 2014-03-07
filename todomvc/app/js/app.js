/*global angular */
/*jshint unused:false */
'use strict';

/**
 * The main TodoMVC app module
 *
 * @type {angular.Module}
 */
var todomvc = angular.module('todomvc', [ 'ngRoute', 'ngResource' ]);

angular.element(document).ready(function () {
    var liveOak = LiveOak({
        auth: {
            clientId: 'test-app',
            realm: 'todomvc',
            onload: 'login-required'
        }
    });

    liveOak.auth.init(function () {
        liveOak.auth.loadUserProfile(function() {
            todomvc.factory('LiveOak', function () {
                return liveOak;
            });
            angular.bootstrap(document, ["todomvc"]);
        });
    }, function () {
        alert('authentication failed');
    });

    liveOak.connect(function () {
        liveOak.create('/todomvc/storage', { id: 'todos' }, {
            success: function (data) {
            },
            error: function (data) {
            }
        });
    });
});
