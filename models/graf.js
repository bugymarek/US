exports.id = 'Graf';

var Graf = NEWSCHEMA('Graf');
var VrcholDo = NEWSCHEMA('VrcholyDo');

Graf.define('_id', Object);
Graf.define('areal', String, true);
Graf.define('vrchol', String, true);
Graf.define('vrcholyDo', Array, true);

Graf.constant('allowed', ['areal', 'vrchol', 'vrcholyDo']);
Graf.setPrefix('errorGraf-');

Graf.setPrepare(onPrepare);
Graf.setValidate(onValidate);

VrcholDo.define('vrchol', String, true);
VrcholDo.define('cena', String, true);

VrcholDo.constant('allowed', ['cena', 'vrchol']);
VrcholDo.setPrefix('errorGrafVrchol-');

VrcholDo.setPrepare(onPrepare);
VrcholDo.setValidate(onValidate);


function onPrepare(name, value) {
    switch (name) {
        case 'areal':
        case 'vrchol':
        case 'cena':
            return value || null;
        case 'vrcholyDo':
            return VrcholDo.prepare(value);
    }
}

function onValidate(name, value) {
    switch (name) {
        case 'areal':
        case 'vrchol':
            return !U.isNullOrEmpty(value);
        case 'cena':
            return !isNaN(value);
        case 'vrcholyDo':
            return Array.isArray(value) && value.findIndex(i => VrcholDo.validate(i).hasError()) < 0;
        default:
            return false;
    }
}

/**
 * Nacitanie grafu.
 * 
 * @param {Object} error Chyba.
 * @param {Object} options Parametre vyhladavania (filter, fields, sort, offset, limit).
 * @param {Object} sort Zoznam atributov pre triedenie nacitaneho grafu.
 * @return {*} Graf.
 */
Graf.setQuery(function (error, options, callback) {
    var cursor = DATABASE('graf').find(options.filter || {}, options.fields || {});
    if (options.sort) {
        cursor.sort(options.sort);
    }
    cursor.toArray(function (err, graf) {
        if (err) {
            error.push('unableToQuery');
            return callback();
        }
        return callback(graf);
    });
});

exports.Graf = Graf;