/* jshint indent: 4 */

var	request = require('request'),
    async = module.parent.require('async'),
    winston = module.parent.require('winston'),
    S = module.parent.require('string'),
    meta = module.parent.require('./meta'),

    gfycatRegex = /<a href="(?:https?:\/\/)?(?:gfycat\.com)\/?(.+)">.+<\/a>/g,
    Embed = {},
    cache, appModule;

Embed.init = function(app, middleware, controllers) {
    appModule = app;
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
            getgfy(gfycatKey, function(err, gfycatObj) {
                if (err) {
                    return next(err);
                }

                cache.set(gfycatKey, gfycatObj);
                next(err, gfycatObj);
            });
        }
    }, function(err, webmgfy) {
        if (!err) {
            // Filter out non-existant webms
            webmgfy = webmgfy.filter(function(issue) {
                return issue;
            });

            appModule.render('partials/gfycat', {
                webmgfy: webmgfy
            }, function(err, html) {
                callback(null, raw += html);
            });
        } else {
            winston.warn('Encountered an error parsing Gfycat embed codes, not continuing... Stopping, basically');
            callback(null, raw);
        }
    });
};

var gfyWebm = function(gfycatKey, callback) {
    var gfyWebm = gfycatKey.split('#')[1];
    console.log('getting webm', gfyWebm);

    request.get({
        url: 'http://gfycat.com/cajax/get/' + gfycatKey + ''
    }, function(err, response, body) {
        if (response.statusCode === 200) {
            callback(null, JSON.parse(body));
        } else {
            callback(err);
        }
    });
};

// Initial setup
cache = require('lru-cache')({
    maxAge: 1000*60*60*24,
    max: 100
});

module.exports = Embed;