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
            request: function (config) {
                if (window._oauth.token) {
                    console.debug('authenticated request: ' + config.method + ' ' + config.url);
                    config.headers['Authorization'] = 'bearer ' + window._oauth.token;
                } else {
                    console.debug('unauthenticated request: ' + config.method + ' ' + config.url);
                }
                return config;
            },
            response: function (response) {
                 console.debug(response.status);
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
    var liveoak = new LiveOak({
        host: "localhost",
        port: 8080,
        secure: false
    });

    liveoak.auth.init({
        clientId: 'test-app',
        clientSecret: 'password',
        onload: 'login-required',
        callback: function (event) {
            if (event == 'authenticated') {
                todomvc.factory('Auth', function() {
                    return liveoak.auth;
                });
                angular.bootstrap(document, ["todomvc"]);
            }
        }
    });
});