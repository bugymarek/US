exports.id = 'Graf';

var Graf = NEWSCHEMA('Graf');
var VrcholDo = NEWSCHEMA('VrcholyDo');

Graf.define('_id', Object);
Graf.define('areal', String, true);
Graf.define('nazov', String, true);
Graf.define('vrcholyDo', Array, true);

Graf.constant('allowed', ['areal', 'nazov', 'vrcholyDo']);
Graf.setPrefix('errorGraf-');

Graf.setPrepare(onPrepare);
Graf.setValidate(onValidate);

VrcholDo.define('nazov', String, true);
VrcholDo.define('cena', String, true);

VrcholDo.constant('allowed', ['cena', 'nazov']);
VrcholDo.setPrefix('errorGrafVrchol-');

VrcholDo.setPrepare(onPrepare);
VrcholDo.setValidate(onValidate);


function onPrepare(name, value) {
    switch (name) {
        case 'areal':
        case 'nazov':
        case 'cena':
            return value || null;
        case 'vrcholyDo':
            return VrcholDo.prepare(value);
    }
}

function onValidate(name, value) {
    switch (name) {
        case 'areal':
        case 'nazov':
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
    if (options.offset) {
        cursor.skip(options.offset);
    }
    if (options.limit) {
        cursor.limit(options.limit);
    }
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

/**
 * Nacitanie poctu vrcholov podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt pouzivatela.
 * @param {Object} options Parametre funkcie.
 * @return {*} Pocet vrcholov.
 */
Graf.addOperation('count', function (error, model, options, callback) {
    DATABASE('graf').count(options || {}, function (err, count) {
        if (err) {
            error.push('unableToCount');
            return callback();
        }
        return callback(count);
    });
});

exports.Graf = Graf;