cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.apache.cordova.inappbrowser/www/inappbrowser.js",
        "id": "org.apache.cordova.inappbrowser.inappbrowser",
        "clobbers": [
            "window.open"
        ]
    },
    {
        "file": "plugins/com.phonegap.plugins.childbrowser/www/childbrowser.js",
        "id": "com.phonegap.plugins.childbrowser.ChildBrowser",
        "clobbers": [
            "ChildBrowser"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "org.apache.cordova.inappbrowser": "0.3.3",
    "com.phonegap.plugins.childbrowser": "5.0.0"
}
// BOTTOM OF METADATA
});