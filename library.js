(function() {
    "use strict";
    /* jshint indent: 4 */
    var	request = require('request'),
        async = module.parent.require('async'),
        winston = module.parent.require('winston'),
        S = module.parent.require('string'),
        meta = module.parent.require('./meta'),
        gfycatRegex = /<a href="(?:https?:\/\/)?(?:gfycat\.com)\/?([\w\-_]+)"><\/a>/gm,
        Embed = {},
        cache, appModule;
    var getgfycat = function(gfycatKey, callback) {
        var gfycatNum = gfycatKey.split('.com/')[1];
        request.get({
            url: 'http://gfycat.com/cajax/get/' + gfycatNum + ''
        }, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                var gfycatData = JSON.parse(body).results[0];
                if (!gfycatData) {
                    return callback(null, {});
                }
                callback(null, {
                    width: gfycatData.width,
                    height: gfycatData.height,
                    webmUrl: gfycatData.webmUrl,
                    gifUrl: gfycatData.gifUrl,
                    mp4Url: gfycatData.mp4Url,
                    gfyId: gfycatData.gfyId,
                    numFrames: gfycatData.numFrames
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
        var gfycatKeys = [],
            matches, cleanedText;
        cleanedText = S(raw).stripTags().s;
        matches = cleanedText.match(gfycatRegex);
        if (matches && matches.length) {
            matches.forEach(function(match) {
                if (gfycatKeys.indexOf(match) === -1) {
                    gfycatKeys.push(match);
                }
            });
        }
        async.map(gfycatKeys, function(gfycatKey, next) {
            if (cache.has(gfycatKey)) {
                next(null, cache.get(gfycatKey));
            } else {
                getDiscog(gfycatKey, function(err, gfycatObj) {
                    if (err) {
                        return next(err);
                    }
                    cache.set(gfycatKey, gfycatObj);
                    next(err, gfycatObj);
                });
            }
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
                winston.warn('Encountered an error parsing gfycat embed code, not continuing');
                callback(null, raw);
            }
        });
    };
// Initial setup
    cache = require('lru-cache')({
        maxAge: 1000*60*60*24,
        max: 100
    });
    module.exports = Embed;
})();