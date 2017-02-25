exports.id = 'Maps';

var Map = NEWSCHEMA('Map');
var Poschodie = NEWSCHEMA('Poschodie');

Map.define('_id', Object);
Map.define('nazov', String, true);
Map.define('url', String, true);
Map.define('poschodia', Array, true);

Map.constant('allowed', ['nazov', 'url', 'poschodia']);
Map.setPrefix('errorMap-');

Map.setPrepare(onPrepare);
Map.setValidate(onValidate);

Poschodie.define('cislo', String, true);
Poschodie.define('url', String, true);

Poschodie.constant('allowed', ['cislo', 'url']);
Poschodie.setPrefix('errorPoschodie-');

Poschodie.setPrepare(onPrepare);
Poschodie.setValidate(onValidate);

function onPrepare(name, value) {
    switch (name) {
        case 'nazov':
        case 'cislo':
        case 'url':
            return value || null;
        case 'poschodia':
            return Poschodie.prepare(value);
    }
}

function onValidate(name, value) {
    switch (name) {
        case 'nazov':
        case 'cislo':
            return !U.isNullOrEmpty(value);
        case 'url':
            return U.isURL(value);
        case 'poschodia':
            return Array.isArray(value) && value.findIndex(i => Poschodie.validate(i).hasError()) < 0;
        default:
            return false;
    }
}

/**
 * Nacitanie zoznamu map podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} options Parametre vyhladavania (filter, fields, sort, offset, limit).
 * @param {Object} sort Zoznam atributov pre triedenie nacitaneho zoznamu.
 * @return {*} Zoznam map.
 */
Map.setQuery(function (error, options, callback) {
    var cursor = DATABASE('maps').find(options.filter || {}, options.fields || {});
    if (options.sort) {
        cursor.sort(options.sort);
    }
    cursor.toArray(function (err, maps) {
        if (err) {
            error.push('unableToQuery');
            return callback();
        }
        return callback(maps);
    });
});

/**
 * Nacitanie mapy podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt mapy.
 * @param {Object} options Parametre vyhladavania.
 * @return {*} map.
 */
Map.setGet(function (error, model, options, callback) {
    DATABASE('maps').findOne(options, function (err, areal) {
        if (err) {
            error.push('unableToGet');
            return callback();
        }
        if (areal) {
            U.copy(areal, model);
        }
        return callback();
    });
});

exports.Map = Map;
exports.Poschodie = Poschodie;