(function(module) {
    "use strict";

    var GfyCat = {},
        embedgfy = '<img class="gfyitem" data-id="$1" data-perimeter="true" />';
    var gfycat = /<a href="(?:https?:\/\/)?(?:gfycat\.com)\/?([\w\-_]+)">.+<\/a>/g;

    Embedly.parse = function(data, callback) {
        if (!data || !data.postData || !data.postData.content) {
            return callback(null, data);
        }
        if (data.postData.content.match(gfycat)) {
            data.postData.content = data.postData.content.replace(gfycat, embedgfy);
        }
        callback(null, data);

    };

    module.exports = GfyCat;
}(module));
