(function(module) {
    "use strict";

    var gfycat = {},
        embedgfy = '<img class="gfyitem" data-id="$1" data-perimeter="true" />';


    GfyCat.parse = function(postContent, callback) {
        postContent = postContent.replace(/<a href="(?:https?:\/\/)?(?:gfycat\.com)\/?([\w\-_]+)">.+<\/a>/g, embed);
        callback(null, postContent);
    };

    module.exports = gfycat;
}(module));
