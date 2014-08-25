var Keycloak = function (options) {
    options = options || {};

    if (!(this instanceof Keycloak)) {
        return new Keycloak(options);
    }

    var kc = this;

    if (!options.url) {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].src.match(/.*keycloak\.js/)) {
                options.url = scripts[i].src.substr(0, scripts[i].src.indexOf('/auth/js/keycloak.js'));
                break;
            }
        }
    }

    if (!options.url) {
        throw 'url missing';
    }

    if (!options.realm) {
        throw 'realm missing';
    }

    if (!options.clientId) {
        throw 'clientId missing';
    }

    kc.init = function (successCallback, errorCallback) {
        if (window.oauth.callback) {
            processCallback(successCallback, errorCallback);
        } else if (options.token) {
            kc.setToken(options.token, successCallback);
        } else if (options.onload) {
            switch (options.onload) {
                case 'login-required' :
                    window.location = kc.createLoginUrl(true);
                    break;
                case 'check-sso' :
                    window.location = kc.createLoginUrl(false);
                    break;
            }
        }
    }

    kc.login = function () {
        window.location.href = kc.createLoginUrl(true);
    }

    kc.logout = function () {
        kc.setToken(undefined);
        window.location.href = kc.createLogoutUrl();
    }

    kc.hasRealmRole = function (role) {
        var access = kc.realmAccess;
        return access && access.roles.indexOf(role) >= 0 || false;
    }

    kc.hasResourceRole = function (role, resource) {
        if (!kc.resourceAccess) {
            return false;
        }

        var access = kc.resourceAccess[resource || options.clientId];
        return access && access.roles.indexOf(role) >= 0 || false;
    }

    kc.loadUserProfile = function (success, error) {
        var url = kc.getRealmUrl() + '/account';
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.setRequestHeader('Accept', 'application/json');
        req.setRequestHeader('Authorization', 'bearer ' + kc.token);

        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    kc.profile = JSON.parse(req.responseText);
                    success && success(kc.profile)
                } else {
                    var response = { status: req.status, statusText: req.status };
                    if (req.responseText) {
                        response.data = JSON.parse(req.responseText);
                    }
                    error && error(response);
                }
            }
        }

        req.send();
    }

    /**
     * checks to make sure token is valid.  If it is, it calls successCallback with no parameters.
     * If it isn't valid, it tries to refresh the access token.  On successful refresh, it calls successCallback.
     *
     * @param successCallback
     * @param errorCallback
     */
    kc.onValidAccessToken = function(successCallback, errorCallback) {
        if (!kc.tokenParsed) {
            console.log('no token');
            errorCallback();
            return;
        }
        var currTime = new Date().getTime() / 1000;
        if (currTime > kc.tokenParsed['exp']) {
            if (!kc.refreshToken) {
                console.log('no refresh token');
                errorCallback();
                return;
            }
            console.log('calling refresh');
            var params = 'grant_type=refresh_token&' + 'refresh_token=' + kc.refreshToken;
            var url = kc.getRealmUrl() + '/tokens/refresh';

            var req = new XMLHttpRequest();
            req.open('POST', url, true, options.clientId, options.clientSecret);
            req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        console.log('Refresh Success');
                        var tokenResponse = JSON.parse(req.responseText);
                        kc.refreshToken = tokenResponse['refresh_token'];
                        kc.setToken(tokenResponse['access_token'], successCallback);
                    } else {
                        console.log('error on refresh HTTP invoke: ' + req.status);
                        errorCallback && errorCallback({ authenticated: false, status: req.status, statusText: req.statusText });
                    }
                }
            };
            req.send(params);
        } else {
            console.log('Token is still valid');
            successCallback();
        }

    }

    kc.getRealmUrl = function() {
        return options.url + '/auth/rest/realms/' + encodeURIComponent(options.realm);
    }

    function processCallback(successCallback, errorCallback) {
        var code = window.oauth.code;
        var error = window.oauth.error;
        var prompt = window.oauth.prompt;

        if (code) {
            var params = 'code=' + code;
            var url = kc.getRealmUrl() + '/tokens/access/codes';

            var req = new XMLHttpRequest();
            req.open('POST', url, true);
            req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

            if (options.clientId && options.clientSecret) {
                req.setRequestHeader('Authorization', 'Basic ' + btoa(options.clientId + ':' + options.clientSecret));
            } else {
                params += '&client_id=' + encodeURIComponent(options.clientId);
            }

            req.withCredentials = true;

            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        var tokenResponse = JSON.parse(req.responseText);
                        kc.refreshToken = tokenResponse['refresh_token'];
                        kc.setToken(tokenResponse['access_token'], successCallback);
                    } else {
                        errorCallback && errorCallback({ authenticated: false, status: req.status, statusText: req.statusText });
                    }
                }
            };

            req.send(params);
        } else if (error) {
            if (prompt != 'none') {
                setTimeout(function() {
                    errorCallback && errorCallback({  authenticated: false, error: error })
                }, 0);
            }
        }
    }

    kc.setToken = function(token, successCallback) {
        if (token) {
            window.oauth.token = token;
            kc.token = token;
            kc.tokenParsed = JSON.parse(atob(token.split('.')[1]));
            kc.authenticated = true;
            kc.subject = kc.tokenParsed.sub;
            kc.realmAccess = kc.tokenParsed.realm_access;
            kc.resourceAccess = kc.tokenParsed.resource_access;

            for (var i = 0; i < idTokenProperties.length; i++) {
                var n = idTokenProperties[i];
                if (kc.tokenParsed[n]) {
                    if (!kc.idToken) {
                        kc.idToken = {};
                    }
                    kc.idToken[n] = kc.tokenParsed[n];
                }
            }

            setTimeout(function() {
                successCallback && successCallback({ authenticated: kc.authenticated, subject: kc.subject });
            }, 0);
        } else {
            delete window.oauth.token;
            delete kc.token;
        }
    }

    kc.createLoginUrl = function(prompt) {
        var state = createUUID();

        sessionStorage.oauthState = state;
        var url = kc.getRealmUrl()
            + '/tokens/login'
            + '?client_id=' + encodeURIComponent(options.clientId)
            + '&redirect_uri=' + getEncodedRedirectUri()
            + '&state=' + encodeURIComponent(state)
            + '&response_type=code';

        if (prompt == false) {
            url += '&prompt=none';
        }

        return url;
    }

    kc.createLogoutUrl = function() {
        var url = kc.getRealmUrl()
            + '/tokens/logout'
            + '?redirect_uri=' + getEncodedRedirectUri();
        return url;
    }

    function getEncodedRedirectUri() {
        var url;
        if (options.redirectUri) {
            url = options.redirectUri;
        } else {
            url = (location.protocol + '//' + location.hostname + (location.port && (':' + location.port)) + location.pathname);
            if (location.hash) {
                url += '?redirect_fragment=' + encodeURIComponent(location.hash.substring(1));
            }
        }
        return encodeURI(url);
    }

    function createUUID() {
        var s = [];
        var hexDigits = '0123456789abcdef';
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = '4';
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = '-';
        var uuid = s.join('');
        return uuid;
    }
    
    var idTokenProperties = [
        "name", 
        "given_name", 
        "family_name", 
        "middle_name", 
        "nickname", 
        "preferred_username", 
        "profile", 
        "picture", 
        "website", 
        "email", 
        "email_verified", 
        "gender", 
        "birthdate", 
        "zoneinfo", 
        "locale", 
        "phone_number", 
        "phone_number_verified", 
        "address", 
        "updated_at", 
        "formatted", 
        "street_address", 
        "locality", 
        "region", 
        "postal_code", 
        "country", 
        "claims_locales"
    ]
}

window.oauth = (function () {
    var oauth = {};

    var params = window.location.search.substring(1).split('&');
    for (var i = 0; i < params.length; i++) {
        var p = params[i].split('=');
        switch (decodeURIComponent(p[0])) {
            case 'code':
                oauth.code = p[1];
                break;
            case 'error':
                oauth.error = p[1];
                break;
            case 'state':
                oauth.state = decodeURIComponent(p[1]);
                break;
            case 'redirect_fragment':
                oauth.fragment = decodeURIComponent(p[1]);
                break;
            case 'prompt':
                oauth.prompt = p[1];
                break;
        }
    }

    if (oauth.state && oauth.state == sessionStorage.oauthState) {
        oauth.callback = true;
        delete sessionStorage.oauthState;
    } else {
        oauth.callback = false;
    }

    if (oauth.callback) {
        window.history.replaceState({}, null, location.protocol + '//' + location.host + location.pathname + (oauth.fragment ? '#' + oauth.fragment : ''));
    } else if (oauth.fragment) {
        window.history.replaceState({}, null, location.protocol + '//' + location.host + location.pathname + (oauth.fragment ? '#' + oauth.fragment : ''));
    }

    return oauth;
}());var Http = function (options) {
    options = options || {};

    var baseUrl = (options.secure ? 'https://' : 'http://') + options.host;
    if (options.port) {
        baseUrl += ':' + options.port;
    }

    this.create = function (path, data, options) {
        var url;
        var method;

        if ( typeof( data.id ) === 'undefined' ) {
          url = createUrl( path, {} );
          method = 'POST';
        } else {
          url = createUrl( path + '/' + data.id, {} );
          method = 'PUT';
        }
        request(method, url, data, function (data) {
            options.success(data);
        }, options.error);
    }

    this.read = function (path, options) {
        var url = createUrl(path, { query: options.query });
        request('GET', url, null, function (data) {
            options.success(data);
        }, options.error);
    }

    this.readMembers = function (path, options) {
        var url = createUrl(path, { fields: '*(*)',  query: options.query, sort: options.sort });
        request('GET', url, null, function (data) {
            var members = data.members || [];
            options.success(members);
        }, options.error);
    }

    this.save = function (path, data, options) {
        var url = createUrl(path, {});
        request('POST', url, data, function (data) {
            options.success(data);
        }, options.error);
    }

    this.update = function (path, data, options) {
        var url = createUrl(path + '/' + data.id, {});
        request('PUT', url, data, function (data) {
            options.success(data);
        }, options.error);
    }

    this.remove = function (path, data, options) {
        var url = createUrl(path + '/' + data.id, {});
        request('DELETE', url, null, function (data) {
            options.success(data);
        }, options.error);
    }

    var request = function (method, url, data, success, error) {
        var req = new XMLHttpRequest();
        req.open(method, url, true);

        req.setRequestHeader('Content-type', 'application/json');
        req.setRequestHeader('Accept', 'application/json');

        if (window.oauth.token) {
            req.setRequestHeader('Authorization', 'bearer ' + window.oauth.token);
        }

        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                if (req.status == 200 || req.status == 201) {
                    if (success) {
                        var response;
                        if (req.responseText) {
                            response = JSON.parse(req.responseText);
                        } else {
                            response = {};
                        }
                        success(response);
                    }
                } else {
                    if (error) {
                        var response = { status: req.status, statusText: req.statusText };
                        if (req.responseText) {
                            response.data = JSON.parse(req.responseText);
                        }
                        error(response);
                    }
                }
            }
        }

        if (data) {
            req.send(JSON.stringify(data, jsonReplacer));
        } else {
            req.send();
        }
    }

    var createUrl = function (path, params) {
        var url = baseUrl;
        url += path;

        var query = '';

        if (params.expand) {
            if (query) {
                query += '&';
            }
            query += 'expand=' + params.expand;
        }
        if (params.fields) {
            if (query) {
                query += '&';
            }
            query += 'fields=' + params.fields;
        }
        if (params.query) {
            if (query) {
                query += '&';
            }
            query += 'q=' + encodeURIComponent(JSON.stringify(params.query));
        }
        if (params.sort) {
            if (query) {
                query += '&';
            }
            query += 'sort=' + params.sort;
        }

        if (query != '') {
            url += '?' + query;
        }

        return url;
    }

    var jsonReplacer = function (key, value) {
        switch (key) {
            case 'members': return undefined;
            case 'self': return undefined;
            default: return value;
        }
    }

}
/*
 * Copyright 2013 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Eclipse Public License version 1.0, available at http://www.eclipse.org/legal/epl-v10.html
 */

// Stilts stomp-client.js ${project.version}
// Some parts (c) 2010 Jeff Mesnil -- http://jmesnil.net/
// ${project.version}

var Stomp = {

    Headers: {
        HOST: 'host',
        CONTENT_LENGTH: 'content-length',
        CONTENT_TYPE: 'content-type',
        ACCEPT_VERSION: 'accept-version',
        VERSION: 'version'
    },

    Transport: {

    },

    Transports: [],

    unmarshal: function (data) {
        var divider = data.search(/\n\n/);
        var headerLines = data.substring(0, divider).split('\n');
        var command = headerLines.shift(), headers = {}, body = '';

        // Parse headers
        var line = idx = null;
        for (var i = 0; i < headerLines.length; i++) {
            line = '' + headerLines[i];
            idx = line.indexOf(':');
            headers[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
        }
        try {
            if (headers[Stomp.Headers.CONTENT_LENGTH]) {
                var len = parseInt(headers[Stomp.Headers.CONTENT_LENGTH]);
                var start = divider + 2;
                // content-length is bytes, substring operates on characters
                body = Stomp.bytes_to_chars(Stomp.chars_to_bytes('' + data).substring(start, start + len))
            } else {
                // Parse body, stopping at the first \0 found.
                var chr = null;
                for (var i = divider + 2; i < data.length; i++) {
                    chr = data.charAt(i);
                    if (chr === '\0') {
                        break;
                    }
                    body += chr;
                }
            }
            return Stomp.frame(command, headers, body);
        } catch (err) {
            return Stomp.frame('ERROR', headers, "Error parsing frame: " + err.description);
        }
    },

    marshal: function (command, headers, body) {
        var frame = Stomp.frame(command, headers, body);
        return frame.toString() + '\0';
    },

    frame: function (command, headers, body) {
        return {
            command: command,
            headers: headers,
            body: body,
            toString: function () {
                var out = command + '\n';
                if (headers) {
                    for (header in headers) {
                        if (header != 'content-length' && headers.hasOwnProperty(header)) {
                            out = out + header + ':' + headers[header] + '\n';
                        }
                    }
                }
                if (body) {
                    out = out + 'content-length:' + Stomp.chars_to_bytes(body).length + '\n';
                }
                out = out + '\n';
                if (body) {
                    out = out + body;
                }
                return out;
            }
        }
    },

    chars_to_bytes: function (chars) {
        return unescape(encodeURIComponent(chars));
    },

    bytes_to_chars: function (bytes) {
        return decodeURIComponent(escape(bytes));
    },

    logger: (function () {
        if (typeof(console) == 'undefined') {
            return { log: function () {
            }, debug: function () {
            } };
        } else {
            return console;
        }
    })()

};

Stomp


Stomp.Client = function (host, port, secure) {
    this._host = host || Stomp.DEFAULT_HOST;
    this._port = port || Stomp.DEFAULT_PORT || 8080;
    this._secure = secure || Stomp.DEFAULT_SECURE_FLAG || false;
}

Stomp.Client.prototype = {

    Versions: {
        VERSION_1_0: "1.0",
        VERSION_1_1: "1.1",

    },

    supportedVersions: function () {
        return "1.0,1.1";
    },

    connect: function () {
        if (arguments.length == 1) {
            this._connectCallback = arguments[0];
        }
        if (arguments.length == 2) {
            this._connectCallback = arguments[0];
            this._errorCallback = arguments[1];
        }
        if (arguments.length == 3) {
            this._login = arguments[0];
            this._passcode = arguments[1];
            this._connectCallback = arguments[2];
        }
        if (arguments.length == 4) {
            this._login = arguments[0];
            this._passcode = arguments[1];
            this._connectCallback = arguments[2];
            this._errorCallback = arguments[3];
        }

        this._connectTransport(this._connectCallback);

    },

    _connectTransport: function (callback) {
        var transports = [];
        for (i = 0; i < Stomp.Transports.length; ++i) {
            var t = new Stomp.Transports[i](this._host, this._port, this._secure);
            t.client = this;
            if (this._login && this._passcode) {
              t.setAuth(this._login, this._passcode);
            }
            transports.push(t);
        }

        this._buildConnector(transports, 0, callback)();
    },


    _buildConnector: function (transports, i, callback) {
        var client = this;
        if (i + 1 < transports.length) {
            return function () {
                var fallback = client._buildConnector(transports, i + 1, callback);
                try {
                    transports[i].connect(function () {
                        client._transport = transports[i];
                        callback();
                    }, fallback);
                } catch (err) {
                    fallback();
                }
            };
        } else if (i < transports.length) {
            return function () {
                var fallback = client.connectionFailed.bind(this);
                try {
                    transports[i].connect(function () {
                        client._transport = transports[i];
                        callback();
                    }, client.connectionFailed.bind(this));
                } catch (err) {
                    fallback();
                }
            };
        } else {
            return function () {
                client.connectionFailed(this);
            };
        }
    },

    connectionFailed: function () {
        Stomp.logger.log("error: unable to connect");
    },

    disconnect: function (disconnectCallback) {
        this._transmit("DISCONNECT");
        this._transport.close();
        if (disconnectCallback) {
            disconnectCallback();
        }
    },

    send: function (destination, headers, body) {
        var headers = headers || {};
        headers.destination = destination;
        this._transmit("SEND", headers, body);
    },

    subscribe: function (destination, callback, headers) {
        var headers = headers || {};
        var subscription_id = "sub-" + this._counter++;
        headers.destination = destination;
        headers.id = subscription_id;
        this._subscriptions['' + subscription_id] = callback;
        this._transmit("SUBSCRIBE", headers);
        return subscription_id;
    },

    unsubscribe: function (id, headers) {
        var headers = headers || {};
        headers.id = id;
        delete this._subscriptions[id];
        this._transmit("UNSUBSCRIBE", headers);
    },

    begin: function (transaction, headers) {
        var headers = headers || {};
        headers.transaction = transaction;
        this._transmit("BEGIN", headers);
    },

    commit: function (transaction, headers) {
        var headers = headers || {};
        headers.transaction = transaction;
        this._transmit("COMMIT", headers);
    },

    abort: function (transaction, headers) {
        var headers = headers || {};
        headers.transaction = transaction;
        this._transmit("ABORT", headers);
    },

    ack: function (message_id, headers) {
        var headers = headers || {};
        headers["message-id"] = message_id;
        this._transmit("ACK", headers);
    },

    nack: function (message_id, headers) {
        // TODO: Add nack functionality.
    },

    // ----------------------------------------
    processMessage: function (message) {
        if (message.command == "MESSAGE") {
            var subId = message.headers['subscription'];
            var callback = this._subscriptions[ subId ];
            callback(message);
        } else if (message.command == "RECEIPT" && this.onreceipt) {
            this.onreceipt(message);
        } else if (message.command == "ERROR" && this.onerror) {
            this.onerror(message);
        }
    },
    // ----------------------------------------

    _login: undefined,
    _passcode: undefined,
    _connectCallback: undefined,
    _errorCallback: undefined,
    _webSocketEnabled: true,
    _longPollEnabled: true,

    _transport: undefined,
    _subscriptions: {},
    _counter: 0,

    _transmit: function (command, headers, body) {
        this._transport.transmit(command, headers, body);
    },

}
/*
 * Copyright 2013 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Eclipse Public License version 1.0, available at http://www.eclipse.org/legal/epl-v10.html
 */
Stomp.Transport.WebSocket = function (host, port, secure) {
    this._host = host;
    this._port = port;
    this._secure = secure;
}

Stomp.Transport.WebSocket.prototype = {
    _ws: undefined,
    _state: 'unconnected',

    transmit: function (command, headers, body) {
        var out = Stomp.marshal(command, headers, body);
        this._ws.send(out);
    },

    connect: function (callback, errorCallback) {
        var wsClass = null;
        if (typeof WebSocket != 'undefined') {
            wsClass = WebSocket;
        } else if (typeof MozWebSocket != 'undefined') {
            wsClass = MozWebSocket;
        } else {
            return;
        }

        this._connectCallback = callback;
        this._ws = new wsClass(this._url());
        this._ws.onopen = this._issueConnect.bind(this);
        this._ws.onmessage = this._handleMessage.bind(this);
        this._ws.onerror = errorCallback;
    },

    close: function () {
        this._ws.close();
    },

    send: function (data) {
        this._ws.send(data);
    },

    setAuth: function(login, passcode) {
      this._login = login;
      this._passcode = passcode;
    },

    _issueConnect: function () {
        console.log("issuing connect");
        var headers = {};
        if (this._login) {
            headers['login'] = this._login;
        }
        if (this._passcode) {
            headers['passcode'] = this._passcode;
        }
        Stomp.logger.debug(this.client);
        headers[Stomp.Headers.ACCEPT_VERSION] = this.client.supportedVersions();
        headers[Stomp.Headers.HOST] = this.client._host;
        this.transmit("CONNECT", headers)
    },

    _handleMessage: function (evt) {
        console.debug(evt);
        var frame = Stomp.unmarshal(evt.data);
        if (frame.command == "CONNECTED") {
            this._version = frame.headers[Stomp.Headers.VERSION];
            if (this._connectCallback) {
                this._connectCallback(frame);
            }
        } else {
            this.client.processMessage(frame);
        }
    },

    _url: function () {
        if (this._secure) {
            return "wss://" + this._host + ":" + this._port + "/";
        }
        return "ws://" + this._host + ":" + this._port + "/";
    },
}


Stomp.Transports.push(Stomp.Transport.WebSocket);


// ---------------------------------------------------------------
// Third-party Libraries
// ---------------------------------------------------------------

/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
 is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
 */
var swfobject = function () {
    var D = "undefined", r = "object", S = "Shockwave Flash", W = "ShockwaveFlash.ShockwaveFlash", q = "application/x-shockwave-flash", R = "SWFObjectExprInst", x = "onreadystatechange", O = window, j = document, t = navigator, T = false, U = [h], o = [], N = [], I = [], l, Q, E, B, J = false, a = false, n, G, m = true, M = function () {
        var aa = typeof j.getElementById != D && typeof j.getElementsByTagName != D && typeof j.createElement != D, ah = t.userAgent.toLowerCase(), Y = t.platform.toLowerCase(), ae = Y ? /win/.test(Y) : /win/.test(ah), ac = Y ? /mac/.test(Y) : /mac/.test(ah), af = /webkit/.test(ah) ? parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, X = !+"\v1", ag = [0, 0, 0], ab = null;
        if (typeof t.plugins != D && typeof t.plugins[S] == r) {
            ab = t.plugins[S].description;
            if (ab && !(typeof t.mimeTypes != D && t.mimeTypes[q] && !t.mimeTypes[q].enabledPlugin)) {
                T = true;
                X = false;
                ab = ab.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
                ag[0] = parseInt(ab.replace(/^(.*)\..*$/, "$1"), 10);
                ag[1] = parseInt(ab.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
                ag[2] = /[a-zA-Z]/.test(ab) ? parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0
            }
        } else {
            if (typeof O.ActiveXObject != D) {
                try {
                    var ad = new ActiveXObject(W);
                    if (ad) {
                        ab = ad.GetVariable("$version");
                        if (ab) {
                            X = true;
                            ab = ab.split(" ")[1].split(",");
                            ag = [parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10)]
                        }
                    }
                } catch (Z) {
                }
            }
        }
        return{w3: aa, pv: ag, wk: af, ie: X, win: ae, mac: ac}
    }(), k = function () {
        if (!M.w3) {
            return
        }
        if ((typeof j.readyState != D && j.readyState == "complete") || (typeof j.readyState == D && (j.getElementsByTagName("body")[0] || j.body))) {
            f()
        }
        if (!J) {
            if (typeof j.addEventListener != D) {
                j.addEventListener("DOMContentLoaded", f, false)
            }
            if (M.ie && M.win) {
                j.attachEvent(x, function () {
                    if (j.readyState == "complete") {
                        j.detachEvent(x, arguments.callee);
                        f()
                    }
                });
                if (O == top) {
                    (function () {
                        if (J) {
                            return
                        }
                        try {
                            j.documentElement.doScroll("left")
                        } catch (X) {
                            setTimeout(arguments.callee, 0);
                            return
                        }
                        f()
                    })()
                }
            }
            if (M.wk) {
                (function () {
                    if (J) {
                        return
                    }
                    if (!/loaded|complete/.test(j.readyState)) {
                        setTimeout(arguments.callee, 0);
                        return
                    }
                    f()
                })()
            }
            s(f)
        }
    }();

    function f() {
        if (J) {
            return
        }
        try {
            var Z = j.getElementsByTagName("body")[0].appendChild(C("span"));
            Z.parentNode.removeChild(Z)
        } catch (aa) {
            return
        }
        J = true;
        var X = U.length;
        for (var Y = 0; Y < X; Y++) {
            U[Y]()
        }
    }

    function K(X) {
        if (J) {
            X()
        } else {
            U[U.length] = X
        }
    }

    function s(Y) {
        if (typeof O.addEventListener != D) {
            O.addEventListener("load", Y, false)
        } else {
            if (typeof j.addEventListener != D) {
                j.addEventListener("load", Y, false)
            } else {
                if (typeof O.attachEvent != D) {
                    i(O, "onload", Y)
                } else {
                    if (typeof O.onload == "function") {
                        var X = O.onload;
                        O.onload = function () {
                            X();
                            Y()
                        }
                    } else {
                        O.onload = Y
                    }
                }
            }
        }
    }

    function h() {
        if (T) {
            V()
        } else {
            H()
        }
    }

    function V() {
        var X = j.getElementsByTagName("body")[0];
        var aa = C(r);
        aa.setAttribute("type", q);
        var Z = X.appendChild(aa);
        if (Z) {
            var Y = 0;
            (function () {
                if (typeof Z.GetVariable != D) {
                    var ab = Z.GetVariable("$version");
                    if (ab) {
                        ab = ab.split(" ")[1].split(",");
                        M.pv = [parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10)]
                    }
                } else {
                    if (Y < 10) {
                        Y++;
                        setTimeout(arguments.callee, 10);
                        return
                    }
                }
                X.removeChild(aa);
                Z = null;
                H()
            })()
        } else {
            H()
        }
    }

    function H() {
        var ag = o.length;
        if (ag > 0) {
            for (var af = 0; af < ag; af++) {
                var Y = o[af].id;
                var ab = o[af].callbackFn;
                var aa = {success: false, id: Y};
                if (M.pv[0] > 0) {
                    var ae = c(Y);
                    if (ae) {
                        if (F(o[af].swfVersion) && !(M.wk && M.wk < 312)) {
                            w(Y, true);
                            if (ab) {
                                aa.success = true;
                                aa.ref = z(Y);
                                ab(aa)
                            }
                        } else {
                            if (o[af].expressInstall && A()) {
                                var ai = {};
                                ai.data = o[af].expressInstall;
                                ai.width = ae.getAttribute("width") || "0";
                                ai.height = ae.getAttribute("height") || "0";
                                if (ae.getAttribute("class")) {
                                    ai.styleclass = ae.getAttribute("class")
                                }
                                if (ae.getAttribute("align")) {
                                    ai.align = ae.getAttribute("align")
                                }
                                var ah = {};
                                var X = ae.getElementsByTagName("param");
                                var ac = X.length;
                                for (var ad = 0; ad < ac; ad++) {
                                    if (X[ad].getAttribute("name").toLowerCase() != "movie") {
                                        ah[X[ad].getAttribute("name")] = X[ad].getAttribute("value")
                                    }
                                }
                                P(ai, ah, Y, ab)
                            } else {
                                p(ae);
                                if (ab) {
                                    ab(aa)
                                }
                            }
                        }
                    }
                } else {
                    w(Y, true);
                    if (ab) {
                        var Z = z(Y);
                        if (Z && typeof Z.SetVariable != D) {
                            aa.success = true;
                            aa.ref = Z
                        }
                        ab(aa)
                    }
                }
            }
        }
    }

    function z(aa) {
        var X = null;
        var Y = c(aa);
        if (Y && Y.nodeName == "OBJECT") {
            if (typeof Y.SetVariable != D) {
                X = Y
            } else {
                var Z = Y.getElementsByTagName(r)[0];
                if (Z) {
                    X = Z
                }
            }
        }
        return X
    }

    function A() {
        return !a && F("6.0.65") && (M.win || M.mac) && !(M.wk && M.wk < 312)
    }

    function P(aa, ab, X, Z) {
        a = true;
        E = Z || null;
        B = {success: false, id: X};
        var ae = c(X);
        if (ae) {
            if (ae.nodeName == "OBJECT") {
                l = g(ae);
                Q = null
            } else {
                l = ae;
                Q = X
            }
            aa.id = R;
            if (typeof aa.width == D || (!/%$/.test(aa.width) && parseInt(aa.width, 10) < 310)) {
                aa.width = "310"
            }
            if (typeof aa.height == D || (!/%$/.test(aa.height) && parseInt(aa.height, 10) < 137)) {
                aa.height = "137"
            }
            j.title = j.title.slice(0, 47) + " - Flash Player Installation";
            var ad = M.ie && M.win ? "ActiveX" : "PlugIn", ac = "MMredirectURL=" + O.location.toString().replace(/&/g, "%26") + "&MMplayerType=" + ad + "&MMdoctitle=" + j.title;
            if (typeof ab.flashvars != D) {
                ab.flashvars += "&" + ac
            } else {
                ab.flashvars = ac
            }
            if (M.ie && M.win && ae.readyState != 4) {
                var Y = C("div");
                X += "SWFObjectNew";
                Y.setAttribute("id", X);
                ae.parentNode.insertBefore(Y, ae);
                ae.style.display = "none";
                (function () {
                    if (ae.readyState == 4) {
                        ae.parentNode.removeChild(ae)
                    } else {
                        setTimeout(arguments.callee, 10)
                    }
                })()
            }
            u(aa, ab, X)
        }
    }

    function p(Y) {
        if (M.ie && M.win && Y.readyState != 4) {
            var X = C("div");
            Y.parentNode.insertBefore(X, Y);
            X.parentNode.replaceChild(g(Y), X);
            Y.style.display = "none";
            (function () {
                if (Y.readyState == 4) {
                    Y.parentNode.removeChild(Y)
                } else {
                    setTimeout(arguments.callee, 10)
                }
            })()
        } else {
            Y.parentNode.replaceChild(g(Y), Y)
        }
    }

    function g(ab) {
        var aa = C("div");
        if (M.win && M.ie) {
            aa.innerHTML = ab.innerHTML
        } else {
            var Y = ab.getElementsByTagName(r)[0];
            if (Y) {
                var ad = Y.childNodes;
                if (ad) {
                    var X = ad.length;
                    for (var Z = 0; Z < X; Z++) {
                        if (!(ad[Z].nodeType == 1 && ad[Z].nodeName == "PARAM") && !(ad[Z].nodeType == 8)) {
                            aa.appendChild(ad[Z].cloneNode(true))
                        }
                    }
                }
            }
        }
        return aa
    }

    function u(ai, ag, Y) {
        var X, aa = c(Y);
        if (M.wk && M.wk < 312) {
            return X
        }
        if (aa) {
            if (typeof ai.id == D) {
                ai.id = Y
            }
            if (M.ie && M.win) {
                var ah = "";
                for (var ae in ai) {
                    if (ai[ae] != Object.prototype[ae]) {
                        if (ae.toLowerCase() == "data") {
                            ag.movie = ai[ae]
                        } else {
                            if (ae.toLowerCase() == "styleclass") {
                                ah += ' class="' + ai[ae] + '"'
                            } else {
                                if (ae.toLowerCase() != "classid") {
                                    ah += " " + ae + '="' + ai[ae] + '"'
                                }
                            }
                        }
                    }
                }
                var af = "";
                for (var ad in ag) {
                    if (ag[ad] != Object.prototype[ad]) {
                        af += '<param name="' + ad + '" value="' + ag[ad] + '" />'
                    }
                }
                aa.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + ah + ">" + af + "</object>";
                N[N.length] = ai.id;
                X = c(ai.id)
            } else {
                var Z = C(r);
                Z.setAttribute("type", q);
                for (var ac in ai) {
                    if (ai[ac] != Object.prototype[ac]) {
                        if (ac.toLowerCase() == "styleclass") {
                            Z.setAttribute("class", ai[ac])
                        } else {
                            if (ac.toLowerCase() != "classid") {
                                Z.setAttribute(ac, ai[ac])
                            }
                        }
                    }
                }
                for (var ab in ag) {
                    if (ag[ab] != Object.prototype[ab] && ab.toLowerCase() != "movie") {
                        e(Z, ab, ag[ab])
                    }
                }
                aa.parentNode.replaceChild(Z, aa);
                X = Z
            }
        }
        return X
    }

    function e(Z, X, Y) {
        var aa = C("param");
        aa.setAttribute("name", X);
        aa.setAttribute("value", Y);
        Z.appendChild(aa)
    }

    function y(Y) {
        var X = c(Y);
        if (X && X.nodeName == "OBJECT") {
            if (M.ie && M.win) {
                X.style.display = "none";
                (function () {
                    if (X.readyState == 4) {
                        b(Y)
                    } else {
                        setTimeout(arguments.callee, 10)
                    }
                })()
            } else {
                X.parentNode.removeChild(X)
            }
        }
    }

    function b(Z) {
        var Y = c(Z);
        if (Y) {
            for (var X in Y) {
                if (typeof Y[X] == "function") {
                    Y[X] = null
                }
            }
            Y.parentNode.removeChild(Y)
        }
    }

    function c(Z) {
        var X = null;
        try {
            X = j.getElementById(Z)
        } catch (Y) {
        }
        return X
    }

    function C(X) {
        return j.createElement(X)
    }

    function i(Z, X, Y) {
        Z.attachEvent(X, Y);
        I[I.length] = [Z, X, Y]
    }

    function F(Z) {
        var Y = M.pv, X = Z.split(".");
        X[0] = parseInt(X[0], 10);
        X[1] = parseInt(X[1], 10) || 0;
        X[2] = parseInt(X[2], 10) || 0;
        return(Y[0] > X[0] || (Y[0] == X[0] && Y[1] > X[1]) || (Y[0] == X[0] && Y[1] == X[1] && Y[2] >= X[2])) ? true : false
    }

    function v(ac, Y, ad, ab) {
        if (M.ie && M.mac) {
            return
        }
        var aa = j.getElementsByTagName("head")[0];
        if (!aa) {
            return
        }
        var X = (ad && typeof ad == "string") ? ad : "screen";
        if (ab) {
            n = null;
            G = null
        }
        if (!n || G != X) {
            var Z = C("style");
            Z.setAttribute("type", "text/css");
            Z.setAttribute("media", X);
            n = aa.appendChild(Z);
            if (M.ie && M.win && typeof j.styleSheets != D && j.styleSheets.length > 0) {
                n = j.styleSheets[j.styleSheets.length - 1]
            }
            G = X
        }
        if (M.ie && M.win) {
            if (n && typeof n.addRule == r) {
                n.addRule(ac, Y)
            }
        } else {
            if (n && typeof j.createTextNode != D) {
                n.appendChild(j.createTextNode(ac + " {" + Y + "}"))
            }
        }
    }

    function w(Z, X) {
        if (!m) {
            return
        }
        var Y = X ? "visible" : "hidden";
        if (J && c(Z)) {
            c(Z).style.visibility = Y
        } else {
            v("#" + Z, "visibility:" + Y)
        }
    }

    function L(Y) {
        var Z = /[\\\"<>\.;]/;
        var X = Z.exec(Y) != null;
        return X && typeof encodeURIComponent != D ? encodeURIComponent(Y) : Y
    }

    var d = function () {
        if (M.ie && M.win) {
            window.attachEvent("onunload", function () {
                var ac = I.length;
                for (var ab = 0; ab < ac; ab++) {
                    I[ab][0].detachEvent(I[ab][1], I[ab][2])
                }
                var Z = N.length;
                for (var aa = 0; aa < Z; aa++) {
                    y(N[aa])
                }
                for (var Y in M) {
                    M[Y] = null
                }
                M = null;
                for (var X in swfobject) {
                    swfobject[X] = null
                }
                swfobject = null
            })
        }
    }();
    return{registerObject: function (ab, X, aa, Z) {
        if (M.w3 && ab && X) {
            var Y = {};
            Y.id = ab;
            Y.swfVersion = X;
            Y.expressInstall = aa;
            Y.callbackFn = Z;
            o[o.length] = Y;
            w(ab, false)
        } else {
            if (Z) {
                Z({success: false, id: ab})
            }
        }
    }, getObjectById: function (X) {
        if (M.w3) {
            return z(X)
        }
    }, embedSWF: function (ab, ah, ae, ag, Y, aa, Z, ad, af, ac) {
        var X = {success: false, id: ah};
        if (M.w3 && !(M.wk && M.wk < 312) && ab && ah && ae && ag && Y) {
            w(ah, false);
            K(function () {
                ae += "";
                ag += "";
                var aj = {};
                if (af && typeof af === r) {
                    for (var al in af) {
                        aj[al] = af[al]
                    }
                }
                aj.data = ab;
                aj.width = ae;
                aj.height = ag;
                var am = {};
                if (ad && typeof ad === r) {
                    for (var ak in ad) {
                        am[ak] = ad[ak]
                    }
                }
                if (Z && typeof Z === r) {
                    for (var ai in Z) {
                        if (typeof am.flashvars != D) {
                            am.flashvars += "&" + ai + "=" + Z[ai]
                        } else {
                            am.flashvars = ai + "=" + Z[ai]
                        }
                    }
                }
                if (F(Y)) {
                    var an = u(aj, am, ah);
                    if (aj.id == ah) {
                        w(ah, true)
                    }
                    X.success = true;
                    X.ref = an
                } else {
                    if (aa && A()) {
                        aj.data = aa;
                        P(aj, am, ah, ac);
                        return
                    } else {
                        w(ah, true)
                    }
                }
                if (ac) {
                    ac(X)
                }
            })
        } else {
            if (ac) {
                ac(X)
            }
        }
    }, switchOffAutoHideShow: function () {
        m = false
    }, ua: M, getFlashPlayerVersion: function () {
        return{major: M.pv[0], minor: M.pv[1], release: M.pv[2]}
    }, hasFlashPlayerVersion: F, createSWF: function (Z, Y, X) {
        if (M.w3) {
            return u(Z, Y, X)
        } else {
            return undefined
        }
    }, showExpressInstall: function (Z, aa, X, Y) {
        if (M.w3 && A()) {
            P(Z, aa, X, Y)
        }
    }, removeSWF: function (X) {
        if (M.w3) {
            y(X)
        }
    }, createCSS: function (aa, Z, Y, X) {
        if (M.w3) {
            v(aa, Z, Y, X)
        }
    }, addDomLoadEvent: K, addLoadEvent: s, getQueryParamValue: function (aa) {
        var Z = j.location.search || j.location.hash;
        if (Z) {
            if (/\?/.test(Z)) {
                Z = Z.split("?")[1]
            }
            if (aa == null) {
                return L(Z)
            }
            var Y = Z.split("&");
            for (var X = 0; X < Y.length; X++) {
                if (Y[X].substring(0, Y[X].indexOf("=")) == aa) {
                    return L(Y[X].substring((Y[X].indexOf("=") + 1)))
                }
            }
        }
        return""
    }, expressInstallCallback: function () {
        if (a) {
            var X = c(R);
            if (X && l) {
                X.parentNode.replaceChild(l, X);
                if (Q) {
                    w(Q, true);
                    if (M.ie && M.win) {
                        l.style.display = "block"
                    }
                }
                if (E) {
                    E(B)
                }
            }
            a = false
        }
    }}
}();

// Copyright: Hiroshi Ichikawa <http://gimite.net/en/>
// License: New BSD License
// Reference: http://dev.w3.org/html5/websockets/
// Reference: http://tools.ietf.org/html/rfc6455

WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;

(function () {

    if (window.WEB_SOCKET_FORCE_FLASH) {
        // Keeps going.
    } else if (window.WebSocket) {
        return;
    } else if (window.MozWebSocket) {
        // Firefox.
        window.WebSocket = MozWebSocket;
        return;
    }

    var logger;
    if (window.WEB_SOCKET_LOGGER) {
        logger = WEB_SOCKET_LOGGER;
    } else if (window.console && window.console.log && window.console.error) {
        // In some environment, console is defined but console.log or console.error is missing.
        logger = window.console;
    } else {
        logger = {log: function () {
        }, error: function () {
        }};
    }

    // swfobject.hasFlashPlayerVersion("10.0.0") doesn't work with Gnash.
    if (swfobject.getFlashPlayerVersion().major < 10) {
        logger.error("Flash Player >= 10.0.0 is required.");
        return;
    }
    if (location.protocol == "file:") {
        logger.error(
            "WARNING: web-socket-js doesn't work in file:///... URL " +
                "unless you set Flash Security Settings properly. " +
                "Open the page via Web server i.e. http://...");
    }

    /**
     * Our own implementation of WebSocket class using Flash.
     * @param {string} url
     * @param {array or string} protocols
     * @param {string} proxyHost
     * @param {int} proxyPort
     * @param {string} headers
     */
    window.WebSocket = function (url, protocols, proxyHost, proxyPort, headers) {
        var self = this;
        self.__id = WebSocket.__nextId++;
        WebSocket.__instances[self.__id] = self;
        self.readyState = WebSocket.CONNECTING;
        self.bufferedAmount = 0;
        self.__events = {};
        if (!protocols) {
            protocols = [];
        } else if (typeof protocols == "string") {
            protocols = [protocols];
        }
        // Uses setTimeout() to make sure __createFlash() runs after the caller sets ws.onopen etc.
        // Otherwise, when onopen fires immediately, onopen is called before it is set.
        self.__createTask = setTimeout(function () {
            WebSocket.__addTask(function () {
                self.__createTask = null;
                WebSocket.__flash.create(
                    self.__id, url, protocols, proxyHost || null, proxyPort || 0, headers || null);
            });
        }, 0);
    };

    /**
     * Send data to the web socket.
     * @param {string} data  The data to send to the socket.
     * @return {boolean}  True for success, false for failure.
     */
    WebSocket.prototype.send = function (data) {
        if (this.readyState == WebSocket.CONNECTING) {
            throw "INVALID_STATE_ERR: Web Socket connection has not been established";
        }
        // We use encodeURIComponent() here, because FABridge doesn't work if
        // the argument includes some characters. We don't use escape() here
        // because of this:
        // https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Functions#escape_and_unescape_Functions
        // But it looks decodeURIComponent(encodeURIComponent(s)) doesn't
        // preserve all Unicode characters either e.g. "\uffff" in Firefox.
        // Note by wtritch: Hopefully this will not be necessary using ExternalInterface.  Will require
        // additional testing.
        var result = WebSocket.__flash.send(this.__id, encodeURIComponent(data));
        if (result < 0) { // success
            return true;
        } else {
            this.bufferedAmount += result;
            return false;
        }
    };

    /**
     * Close this web socket gracefully.
     */
    WebSocket.prototype.close = function () {
        if (this.__createTask) {
            clearTimeout(this.__createTask);
            this.__createTask = null;
            this.readyState = WebSocket.CLOSED;
            return;
        }
        if (this.readyState == WebSocket.CLOSED || this.readyState == WebSocket.CLOSING) {
            return;
        }
        this.readyState = WebSocket.CLOSING;
        WebSocket.__flash.close(this.__id);
    };

    /**
     * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
     *
     * @param {string} type
     * @param {function} listener
     * @param {boolean} useCapture
     * @return void
     */
    WebSocket.prototype.addEventListener = function (type, listener, useCapture) {
        if (!(type in this.__events)) {
            this.__events[type] = [];
        }
        this.__events[type].push(listener);
    };

    /**
     * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
     *
     * @param {string} type
     * @param {function} listener
     * @param {boolean} useCapture
     * @return void
     */
    WebSocket.prototype.removeEventListener = function (type, listener, useCapture) {
        if (!(type in this.__events)) return;
        var events = this.__events[type];
        for (var i = events.length - 1; i >= 0; --i) {
            if (events[i] === listener) {
                events.splice(i, 1);
                break;
            }
        }
    };

    /**
     * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
     *
     * @param {Event} event
     * @return void
     */
    WebSocket.prototype.dispatchEvent = function (event) {
        var events = this.__events[event.type] || [];
        for (var i = 0; i < events.length; ++i) {
            events[i](event);
        }
        var handler = this["on" + event.type];
        if (handler) handler.apply(this, [event]);
    };

    /**
     * Handles an event from Flash.
     * @param {Object} flashEvent
     */
    WebSocket.prototype.__handleEvent = function (flashEvent) {

        if ("readyState" in flashEvent) {
            this.readyState = flashEvent.readyState;
        }
        if ("protocol" in flashEvent) {
            this.protocol = flashEvent.protocol;
        }

        var jsEvent;
        if (flashEvent.type == "open" || flashEvent.type == "error") {
            jsEvent = this.__createSimpleEvent(flashEvent.type);
        } else if (flashEvent.type == "close") {
            jsEvent = this.__createSimpleEvent("close");
            jsEvent.wasClean = flashEvent.wasClean ? true : false;
            jsEvent.code = flashEvent.code;
            jsEvent.reason = flashEvent.reason;
        } else if (flashEvent.type == "message") {
            var data = decodeURIComponent(flashEvent.message);
            jsEvent = this.__createMessageEvent("message", data);
        } else {
            throw "unknown event type: " + flashEvent.type;
        }

        this.dispatchEvent(jsEvent);

    };

    WebSocket.prototype.__createSimpleEvent = function (type) {
        if (document.createEvent && window.Event) {
            var event = document.createEvent("Event");
            event.initEvent(type, false, false);
            return event;
        } else {
            return {type: type, bubbles: false, cancelable: false};
        }
    };

    WebSocket.prototype.__createMessageEvent = function (type, data) {
        if (document.createEvent && window.MessageEvent && !window.opera) {
            var event = document.createEvent("MessageEvent");
            event.initMessageEvent("message", false, false, data, null, null, window, null);
            return event;
        } else {
            // IE and Opera, the latter one truncates the data parameter after any 0x00 bytes.
            return {type: type, data: data, bubbles: false, cancelable: false};
        }
    };

    /**
     * Define the WebSocket readyState enumeration.
     */
    WebSocket.CONNECTING = 0;
    WebSocket.OPEN = 1;
    WebSocket.CLOSING = 2;
    WebSocket.CLOSED = 3;

    // Field to check implementation of WebSocket.
    WebSocket.__isFlashImplementation = true;
    WebSocket.__initialized = false;
    WebSocket.__flash = null;
    WebSocket.__instances = {};
    WebSocket.__tasks = [];
    WebSocket.__nextId = 0;

    /**
     * Load a new flash security policy file.
     * @param {string} url
     */
    WebSocket.loadFlashPolicyFile = function (url) {
        WebSocket.__addTask(function () {
            WebSocket.__flash.loadManualPolicyFile(url);
        });
    };

    /**
     * Loads WebSocketMain.swf and creates WebSocketMain object in Flash.
     */
    WebSocket.__initialize = function () {

        if (WebSocket.__initialized) return;
        WebSocket.__initialized = true;

        if (WebSocket.__swfLocation) {
            // For backword compatibility.
            window.WEB_SOCKET_SWF_LOCATION = WebSocket.__swfLocation;
        }
        if (!window.WEB_SOCKET_SWF_LOCATION) {
            logger.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf");
            return;
        }
        if (!window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR && !WEB_SOCKET_SWF_LOCATION.match(/(^|\/)WebSocketMainInsecure\.swf(\?.*)?$/) &&
            WEB_SOCKET_SWF_LOCATION.match(/^\w+:\/\/([^\/]+)/)) {
            var swfHost = RegExp.$1;
            if (location.host != swfHost) {
                logger.error(
                    "[WebSocket] You must host HTML and WebSocketMain.swf in the same host " +
                        "('" + location.host + "' != '" + swfHost + "'). " +
                        "See also 'How to host HTML file and SWF file in different domains' section " +
                        "in README.md. If you use WebSocketMainInsecure.swf, you can suppress this message " +
                        "by WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;");
            }
        }
        var container = document.createElement("div");
        container.id = "webSocketContainer";
        // Hides Flash box. We cannot use display: none or visibility: hidden because it prevents
        // Flash from loading at least in IE. So we move it out of the screen at (-100, -100).
        // But this even doesn't work with Flash Lite (e.g. in Droid Incredible). So with Flash
        // Lite, we put it at (0, 0). This shows 1x1 box visible at left-top corner but this is
        // the best we can do as far as we know now.
        container.style.position = "absolute";
        if (WebSocket.__isFlashLite()) {
            container.style.left = "0px";
            container.style.top = "0px";
        } else {
            container.style.left = "-100px";
            container.style.top = "-100px";
        }
        var holder = document.createElement("div");
        holder.id = "webSocketFlash";
        container.appendChild(holder);
        document.body.appendChild(container);
        // See this article for hasPriority:
        // http://help.adobe.com/en_US/as3/mobile/WS4bebcd66a74275c36cfb8137124318eebc6-7ffd.html
        swfobject.embedSWF(
            WEB_SOCKET_SWF_LOCATION,
            "webSocketFlash",
            "1" /* width */,
            "1" /* height */,
            "10.0.0" /* SWF version */,
            null,
            null,
            {hasPriority: true, swliveconnect: true, allowScriptAccess: "always"},
            null,
            function (e) {
                if (!e.success) {
                    logger.error("[WebSocket] swfobject.embedSWF failed");
                }
            }
        );

    };

    /**
     * Called by Flash to notify JS that it's fully loaded and ready
     * for communication.
     */
    WebSocket.__onFlashInitialized = function () {
        // We need to set a timeout here to avoid round-trip calls
        // to flash during the initialization process.
        setTimeout(function () {
            WebSocket.__flash = document.getElementById("webSocketFlash");
            WebSocket.__flash.setCallerUrl(location.href);
            WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG);
            for (var i = 0; i < WebSocket.__tasks.length; ++i) {
                WebSocket.__tasks[i]();
            }
            WebSocket.__tasks = [];
        }, 0);
    };

    /**
     * Called by Flash to notify WebSockets events are fired.
     */
    WebSocket.__onFlashEvent = function () {
        setTimeout(function () {
            try {
                // Gets events using receiveEvents() instead of getting it from event object
                // of Flash event. This is to make sure to keep message order.
                // It seems sometimes Flash events don't arrive in the same order as they are sent.
                var events = WebSocket.__flash.receiveEvents();
                for (var i = 0; i < events.length; ++i) {
                    WebSocket.__instances[events[i].webSocketId].__handleEvent(events[i]);
                }
            } catch (e) {
                logger.error(e);
            }
        }, 0);
        return true;
    };

    // Called by Flash.
    WebSocket.__log = function (message) {
        logger.log(decodeURIComponent(message));
    };

    // Called by Flash.
    WebSocket.__error = function (message) {
        logger.error(decodeURIComponent(message));
    };

    WebSocket.__addTask = function (task) {
        if (WebSocket.__flash) {
            task();
        } else {
            WebSocket.__tasks.push(task);
        }
    };

    /**
     * Test if the browser is running flash lite.
     * @return {boolean} True if flash lite is running, false otherwise.
     */
    WebSocket.__isFlashLite = function () {
        if (!window.navigator || !window.navigator.mimeTypes) {
            return false;
        }
        var mimeType = window.navigator.mimeTypes["application/x-shockwave-flash"];
        if (!mimeType || !mimeType.enabledPlugin || !mimeType.enabledPlugin.filename) {
            return false;
        }
        return mimeType.enabledPlugin.filename.match(/flashlite/i) ? true : false;
    };

    if (!window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION) {
        // NOTE:
        //   This fires immediately if web_socket.js is dynamically loaded after
        //   the document is loaded.
        swfobject.addDomLoadEvent(function () {
            WebSocket.__initialize();
        });
    }

})();
/*
 * Copyright 2013 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Eclipse Public License version 1.0, available at http://www.eclipse.org/legal/epl-v10.html
 */
/*
 example:
 var options = { host: 'http://127.0.0.1', port: 8080 };
 var liveOak = LiveOak( options );
*/
var LiveOak = function( options ) {
    options = options || {};

    // Allow instantiation without using new
    if(!(this instanceof LiveOak)) {
        return new LiveOak( options );
    }

    // Use address of liveoak.js if server address not specified
    if (!options.host) {
        var server = parseScriptUrl();
        options.host = server.host;
        options.port = server.port;
        options.secure = server.secure;
    }

    var http = new Http(options);

    var stomp_client = new Stomp.Client( options.host, options.port, options.secure );

    this.connect = function( callback ) {
      // TODO: Better way to do this...
      if (arguments.length == 1) {
         stomp_client.connect( arguments[0] );
      }
      if (arguments.length == 2) {
        stomp_client.connect( arguments[0], arguments[1] );
      }
      if (arguments.length == 3) {
        stomp_client.connect( arguments[0], arguments[1], arguments[2] );
      }
      if (arguments.length == 4) {
        stomp_client.connect( arguments[0], arguments[1], arguments[2], arguments[3] );
      }
    };

    this.onStompError = function( callback ) {
        stomp_client.onerror = callback;
    }

    this.create = http.create;
    this.read = http.read;
    this.readMembers = http.readMembers;
    this.save = http.save;
    this.update = http.update;
    this.remove = http.remove;

    this.subscribe = function( path, callback ) {
        stomp_client.subscribe( path, function(msg) {
            var data = JSON.parse( msg.body );
            callback( data );
        });
    };

    if (options.auth) {
        if (!options.auth.url) {
            var port = options.port ? options.port + 303 : 8383;
            options.auth.url = (options.secure ? 'https://' : 'http://') + options.host + ':' + port;
        }

        this.auth = new Keycloak(options.auth);
    }

    function parseScriptUrl() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++)  {
            if (scripts[i].src.match(/.*liveoak\.js/)) {
                var parts = scripts[i].src.split('/');
                var server = {};
                if (parts[2].indexOf(':') == -1) {
                    server.host = parts[2];
                } else {
                    server.host = parts[2].substring(0, parts[2].indexOf(':'));
                    server.port = parseInt(parts[2].substring(parts[2].indexOf(':') + 1));
                }
                if (parts[0] == 'https') {
                    server.secure = true;
                }
                return server;
            }
        }
    }
};
