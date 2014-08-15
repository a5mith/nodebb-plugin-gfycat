(function() {
    "use strict";
    /* jshint indent: 4 */

    var	request = require('request'),
        async = module.parent.require('async'),
        winston = module.parent.require('winston'),
        S = module.parent.require('string'),
        meta = module.parent.require('./meta'),

        GfyCatRegex = /<a href="(?:http|https?:\/\/)?(?:gfycat\.com)\/([\w\-_]+)">.+<\/a>/g,
        Embed = {},
        appModule;

    var getGfyCat = function(gfyCatKey, callback) {

        request.get({
            url: 'www.gfycat.com/cajax/get/$1'
        }, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                var gfyData = JSON.parse(body).results[0];

                if (!gfyData) {
                    return callback(null, {});
                }

                callback(null, {
                    mp4Url: gfyData.mp4Url,
                    webmUrl: gfyData.webmUrl,
                    gifUrl: gfyData.gifUrl,
                    width: gfyData.width,
                    height: gfyData.height,
                    gfyId: gfyData.gfyId,
                    numFrames: gfyData.numFrames
                });
            } else {
                callback(err);
            }
        });
    };

    Embed.init = function(app, middleware, controllers, callback) {
        function render(req, res, next) {
            res.render('partials/gfycat-block', {});
        }

        appModule = app;

        callback();
    };

    Embed.parse = function(raw, callback) {
        var gfyCatKeys = [],
            matches, cleanedText;

        cleanedText = S(raw).stripTags().s;
        matches = cleanedText.match(gfyCatRegex);



        if (matches && matches.length) {
            matches.forEach(function(match) {
                if (gfyCatKeys.indexOf(match) === -1) {
                    gfyCatKeys.push(match);
                }
            });
        }

        async.map(gfyCatKeys, function(gfyCatKey, next) {
                getGfyCat(gfyCatKey, function(err, gfyCatObj) {
                    if (err) {
                        return next(err);
                    }

                    cache.set(gfyCatKey, gfyCatObj);
                    next(err, gfyCatObj);
                });
        }, function(err, gfycatinfo) {
            if (!err) {
                // Filter
                gfycatinfo = gfycatinfo.filter(function(issue) {
                    return issue;
                });

                appModule.render('partials/gfycat-block', {
                    gfycatinfo: gfycatinfo
                }, function(err, html) {
                    callback(null, raw += html);
                });
            } else {
                winston.warn('Encountered an error parsing GfyCat embed code, not continuing');
                callback(null, raw);
            }
        });
    };

    module.exports = Embed;
})();





