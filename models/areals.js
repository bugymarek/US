exports.id = 'Areals';

var Areal = NEWSCHEMA('Areal');
var Vrchol = NEWSCHEMA('Vrchol');
var Hrana = NEWSCHEMA('Hrana');
var Poschodie = NEWSCHEMA('Poschodie');

Areal.define('_id', Object);
Areal.define('nazov', String, true);
Areal.define('budova', Boolean, true);
Areal.define('vrcholy', Array, true);
Areal.define('hrany', String, true);
Areal.define('url', String, true);
Areal.define('poschodia', Array, true);

Areal.constant('allowed', ['nazov', 'budova', 'vrcholy', 'hrany', 'url', 'poschodia']);
Areal.setPrefix('errorAreal-');

Areal.setPrepare(onPrepare);
Areal.setValidate(onValidate);

Vrchol.define('nazov', String, true);
Vrchol.define('typ', String, true);

Vrchol.constant('allowed', ['nazov', 'typ']);
Vrchol.setPrefix('errorEdges-');

Vrchol.setPrepare(onPrepare);
Vrchol.setValidate(onValidate);

Hrana.define('nazov', String, true);
Hrana.define('typ', String, true);

Hrana.constant('allowed', ['nazov', 'typ']);
Hrana.setPrefix('errorNodes-');

Hrana.setPrepare(onPrepare);
Hrana.setValidate(onValidate);

Poschodie.define('cislo', String, true);
Poschodie.define('url', String, true);

Poschodie.constant('allowed', ['cislo', 'url']);
Poschodie.setPrefix('errorPoschodie-');

Poschodie.setPrepare(onPrepare);
Poschodie.setValidate(onValidate);

function onPrepare(name, value) {
    switch (name) {
        case 'nazov':
        case 'budova':
        case 'typ':
        case 'url':
            return value || null;
        case 'vrcholy':
            return Vrchol.prepare(value);
        case 'hrany':
            return Hrana.prepare(value);
        case 'poschodia':
            return Poschodie.prepare(value);
    }
}

function onValidate(name, value) {
    switch (name) {
        case 'nazov':
        case 'budova':
        case 'typ':
            return !U.isNullOrEmpty(value);
        case 'url':
            return U.isURL(value);
        case 'vrcholy':
            return Array.isArray(value) && value.findIndex(i => Vrchol.validate(i).hasError()) < 0;
        case 'hrana':
            return Array.isArray(value) && value.findIndex(i => Hrana.validate(i).hasError()) < 0;
        case 'poschodia':
            return Array.isArray(value) && value.findIndex(i => Poschodie.validate(i).hasError()) < 0;     
        default:
            return false;
    }
}

/**
 * Nacitanie zoznamu budov podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} options Parametre vyhladavania (filter, fields, sort, offset, limit).
 * @param {Object} sort Zoznam atributov pre triedenie nacitaneho zoznamu.
 * @return {*} Zoznam map.
 */
Areal.setQuery(function (error, options, callback) {
    var cursor = DATABASE('areals').find(options.filter || {}, options.fields || {});
    if (options.sort) {
        cursor.sort(options.sort);
    }
    cursor.toArray(function (err, areals) {
        if (err) {
            error.push('unableToQuery');
            return callback();
        }
        return callback(areals);
    });
});

/**
 * Nacitanie arealu podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt arealu.
 * @param {Object} options Parametre vyhladavania.
 * @return {*} Areal.
 */
Areal.setGet(function (error, model, options, callback) {
    DATABASE('areals').findOne(options, function (err, areal) {
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

/**
 * Nacitanie poctu arealov podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt pouzivatela.
 * @param {Object} options Parametre funkcie.
 * @return {*} Pocet arealov.
 */
Areal.addOperation('count', function (error, model, options, callback) {
    DATABASE('areals').count(options || {}, function (err, count) {
        if (err) {
            error.push('unableToCount');
            return callback();
        }
        return callback(count);
    });
});

exports.Areal = Areal;
exports.Vrchol = Vrchol;
exports.Hrana = Hrana;