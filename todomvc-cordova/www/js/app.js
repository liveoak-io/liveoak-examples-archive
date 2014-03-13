/*global angular */
/*jshint unused:false */
'use strict';

/**
 * The main TodoMVC app module
 *
 * @type {angular.Module}
 */
var todomvc = angular.module('todomvc', [ 'ngRoute', 'ngResource' ]);

var init = function () {
    var liveOak = LiveOak({
        auth: {
            clientId: 'todomvc',
            realm: 'todomvc-cordova',
            redirectUri: 'http://localhost'
        }
    });

    window.plugins.ChildBrowser.onLocationChange = function (url) {
        if (window.oauth.callback) {
            return;
        }

        var code = /code=([^&]+)/.exec(url);
        var error = /error=([^&]+)/.exec(url);
        var state = /state=([^&]+)/.exec(url);

        if (code || error) {
            if (code && state) {
                window.oauth.code = code[1];
                window.oauth.state = state[1];
                window.oauth.callback = true;
            } else if (error && state) {
                window.oauth.error = error[1];
                window.oauth.state = state[1];
                window.oauth.callback = true;
            }

            window.plugins.ChildBrowser.close();

            liveOak.auth.init(function() {
                todomvc.factory('LiveOak', function () {
                    return liveOak;
                });
                angular.bootstrap(document, ["todomvc"]);
            }, function(e) {
                alert('auth failed: ' + e);
            });
        }
    }

    var loginUrl = liveOak.auth.createLoginUrl();
    window.plugins.ChildBrowser.showWebPage(loginUrl, { showLocationBar: false });
}

document.addEventListener('deviceready', init, false);