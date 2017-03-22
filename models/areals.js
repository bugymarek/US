exports.id = 'Areals';

var Areal = NEWSCHEMA('Areal');
var Vrchol = NEWSCHEMA('Vrchol');
var Poschodie = NEWSCHEMA('Poschodie');

Areal.define('_id', Object);
Areal.define('nazov', String, true);
Areal.define('budova', Boolean, true);
Areal.define('vrcholy', Array, true);
Areal.define('url', String, true);
Areal.define('poschodia', Array, true);

Areal.constant('allowed', ['nazov', 'budova', 'vrcholy', 'url', 'poschodia']);
Areal.setPrefix('errorAreal-');

Areal.setPrepare(onPrepare);
Areal.setValidate(onValidate);

Vrchol.define('nazov', String, true);
Vrchol.define('typ', String, true);
Vrchol.define('poschodie', Number, true);
Vrchol.define('suradnicaX', Number, true);
Vrchol.define('suradnicaY', Number, true);

Vrchol.constant('allowed', ['nazov', 'typ', 'poschodie', 'suradnicaX', 'suradnicaY']);
Vrchol.setPrefix('errorEdges-');

Vrchol.setPrepare(onPrepare);
Vrchol.setValidate(onValidate);

Poschodie.define('cislo', Number, true);
Poschodie.define('url', String, true);

Poschodie.constant('allowed', ['cislo', 'url']);
Poschodie.setPrefix('errorPoschodie-');

Poschodie.setPrepare(onPrepare);
Poschodie.setValidate(onValidate);

function onPrepare(name, value) {
    switch (name) {
        case 'nazov':
        case 'typ':
        case 'url':
            return value || null;
        case 'cislo':
        case 'poschodie':
        case 'suradnicaX':
        case 'suradnicaY':
             return value || value === 0 ? value : null;   
        case 'budova':
            return value || value == false ? value : null
        case 'vrcholy':
            return Vrchol.prepare(value);
        case 'poschodia':
            return Poschodie.prepare(value);
    }
}

function onValidate(name, value, schema, model) {
    switch (name) {
        case 'nazov':
        case 'typ':
            return !U.isEmpty(value);
        case 'cislo':
        case 'poschodie':
        case 'suradnicaX':
        case 'suradnicaY':
            return value !== null && !isNaN(value);
        case 'url':
            return model.budova ? true : !U.isEmpty(value);
        case 'budova':
            return value == null ? false : true;
        case 'vrcholy':
            return Array.isArray(value) && value.findIndex(i => Vrchol.validate(i).hasError()) < 0 && value.length > 0;
        case 'poschodia':
            return model.budova ? Array.isArray(value) && value.length > 0 : true;     
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

/**
 * Vytvorenie noveho arealu alebo aktualizacia existujuceho arealu.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt arealu.
 * @param {Object} options Parametre funkcie.
 * @return {*} areal.
 */
Areal.setSave(function (error, model, options, callback) {
    var isUpdate = model._id ? true : false;
    if (isUpdate) {
        updateEntity(error, model, options, callback);
    }
    else {
        createEntity(error, model, options, callback);
    }
});

/**
 * Vytvorenie novej entity - pomocna funkcia.
 */
function createEntity(error, model, options, callback) {
    // skontrolujem, ci sa kapela s danym nazvom uz nenachadza v databaze
    model.$workflow('checkIfNotExists', function (err) {
        if (err) {
            error.push(err);
            return callback();
        }
        DATABASE('areals').insert(model.$clean(), function (err, result) {
            if (err) {
                error.push('unableToCreate');
                return callback();
            }       
            model._id = result.insertedCount == 1 ? result.ops[0]._id : null;
            return callback();
        });
    });
}

/**
 * Aktualizacia entity - pomocna funkcia.
 */
function updateEntity(error, model, options, callback) {
    // skontrolujem, ci sa kapela s danym nazvom uz nenachadza v databaze
    model.$workflow('checkIfNotExists', function (err) {
        if (err) {
            error.push(err);
            return callback();
        }
        DATABASE('areals').update({
            _id: model._id
        }, {
                $set: model.$clean(),

            }, function (err) {
                if (err) {
                    error.push('unableToUpdate');
                    return callback();
                }
                return callback();
            });
    });
}

/**
 * Aktualizacia atributov arealu.
 * 
 * Zo vstupnych parametrov sa vyberu len tie, ktorych aktualizacia je povolena.
 * Zoznam atributov, ktore je povolene aktualizovat sa nachadza v konstante 'allowed'.
 * 
 * Nasledne sa aktualizovany objekt upravy (prepare) a zvaliduje (validate).
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt areal.
 * @param {Object} options Parametre funkcie.
 */
Areal.addWorkflow('update', function (error, model, options, callback) {
    var allowed = model.$constant('allowed');
    Object.keys(options).forEach(function (key) {
        if (allowed.indexOf(key) >= 0) {
            model[key] = options[key];
        }
    });
    U.copy(model.$prepare().$clean(), model);
    error.push(model.$validate().prepare());
    return callback();
});


/**
 * Overenie, ci sa v databaze uz nenachadza entita s daným nazvom.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt arealu.
 * @param {Object} options Parametre funkcie.
 * @return {*}
 */
Areal.addWorkflow('checkIfNotExists', function (error, model, options, callback) {
    var nameLowerCase = new RegExp(["^", model.nazov, "$"].join(""), "i");
    DATABASE('areals').findOne({
        $and: [
                { nazov: nameLowerCase },
                { _id: { $ne: model._id} },    
              ]       
    }, function (err, areal) {
        if (areal) {
            error.push('alreadyExists');
            return callback();
        }
        return callback();
    });
});

/**
 * Odstranenie existujuceho arealu.
 * 
 * @param {Object} error Chyba.
 * @param {Object} options Parametre funkcie.
 * @return {*}
 */
Areal.setRemove(function (error, options, callback) {
    DATABASE('areals').remove({
        _id: options._id
    }, function (err) {
        if (err) {
            error.push('unableToDelete');
            return callback();
        }
        return callback();
    });
});

exports.Areal = Areal;
exports.Vrchol = Vrchol;