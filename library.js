(function() {
    "use strict";
    /* jshint indent: 4 */
    var	request = require('request'),
        async = module.parent.require('async'),
        winston = module.parent.require('winston'),
        S = module.parent.require('string'),
        meta = module.parent.require('./meta'),
        gfycatRegex = /(?:https?:\/\/)?(?:gfycat\.com)\/?([\w\-_]+)/g,
        Embed = {},
        cache, appModule;
    var getgfycat = function(gfycatKey, callback) {
        var gfycatNum = gfycatKey.split('.com/')[1];
        request.get({
            url: 'https://gfycat.com/cajax/get/' + gfycatNum + ''
        }, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                var gfycatData = JSON.parse(body).gfyItem;
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
    Embed.init = function(data, callback) {
        function render(req, res, next) {
            res.render('partials/gfycat-block', {});
        }
        appModule = data.router;
        if ( callback )
        callback();
    };
    Embed.parse = function(data, callback) {
        var gfycatKeys = [],
            raw = typeof data !== 'object',
            matches, cleanedText;
        cleanedText = S((raw ? data : data.postData.content)).stripTags().s;
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
                getgfycat(gfycatKey, function(err, gfycatObj) {
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
                    if (raw) {
                        var payload = data += html;
                        } else {
                        data.postData.content = data.postData.content.replace(new RegExp('https://gfycat.com' + gfycatData.gfyId, 'g'), html);;
                        }
                    callback(null, payload || data);
                });
            } else {
                winston.warn('Encountered an error parsing gfycat embed code, not continuing');
                callback(null, data);
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
