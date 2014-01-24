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
            clientSecret: 'password',
            onload: 'login-required',
            success: function () {
                todomvc.factory('LiveOak', function () {
                    return liveOak;
                });
                angular.bootstrap(document, ["todomvc"]);
            },
            error: function () {
                alert('authentication failed');
            }
        }
    });

    liveOak.auth.init();
});
