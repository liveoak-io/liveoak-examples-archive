/*global angular */
/*jshint unused:false */
'use strict';

/**
 * The main TodoMVC app module
 *
 * @type {angular.Module}
 */
var todomvc = angular.module('todomvc', [ 'ngRoute', 'ngResource' ]);

todomvc.config(function ($provide, $httpProvider) {
    $provide.factory('authInterceptor', function ($rootScope) {
        return {
            response: function (response) {
                $rootScope.lastStatus = response.status;
                return response;
            },
            responseError: function (response) {
                console.debug(response.status);
                $rootScope.lastStatus = response.status;
                return response;
            }
        }
    });
    $httpProvider.interceptors.push('authInterceptor');
})

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
