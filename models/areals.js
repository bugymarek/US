exports.id = 'Areals';

var Areal = NEWSCHEMA('Areal');
var Vrchol = NEWSCHEMA('Vrchol');
var Hrana = NEWSCHEMA('Hrana');

Areal.define('_id', Object);
Areal.define('nazov', String, true);
Areal.define('budova', Boolean, true);
Areal.define('vrcholy', Array, true);
Areal.define('hrany', Array, true);

Areal.constant('allowed', ['nazov', 'budova', 'vrcholy', 'hrany']);
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

function onPrepare(name, value) {
    switch (name) {
        case 'nazov':
        case 'budova':
        case 'typ':
            return value || null;
        case 'vrcholy':
            return Vrchol.prepare(value);
        case 'hrany':
            return Hrana.prepare(value);
    }
}

function onValidate(name, value) {
    switch (name) {
        case 'nazov':
        case 'budova':
        case 'typ':
            return !U.isNullOrEmpty(value);
        case 'vrcholy':
            return Array.isArray(value) && value.findIndex(i => Vrchol.validate(i).hasError()) < 0;
        case 'hrana':
            return Array.isArray(value) && value.findIndex(i => Hrana.validate(i).hasError()) < 0;
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

exports.Areal = Areal;
exports.Vrchol = Vrchol;
exports.Hrana = Hrana;