exports.id = 'Graf';

var Graf = NEWSCHEMA('Graf');
var SusednyVrchol = NEWSCHEMA('SusedneVrcholy');

Graf.define('_id', Object);
Graf.define('areal', String, true);
Graf.define('nazov', String, true);
Graf.define('susedneVrcholy', Array, true);

Graf.constant('allowed', ['areal', 'nazov', 'susedneVrcholy']);
Graf.setPrefix('errorGraf-');

Graf.setPrepare(onPrepare);
Graf.setValidate(onValidate);

SusednyVrchol.define('nazov', String, true);
SusednyVrchol.define('cena', Number, true);
SusednyVrchol.define('areal', String, true);

SusednyVrchol.constant('allowed', ['cena', 'nazov, areal']);
SusednyVrchol.setPrefix('errorGrafVrchol-');

SusednyVrchol.setPrepare(onPrepare);
SusednyVrchol.setValidate(onValidate);


function onPrepare(name, value) {
    switch (name) {
        case 'areal':
        case 'nazov':
        case 'cena':
            return value || null;
        case 'susedneVrcholy':
            return SusednyVrchol.prepare(value);
    }
}

function onValidate(name, value) {
    switch (name) {
        case 'areal':
        case 'nazov':
            return !U.isEmpty(value) || value !== null;
        case 'cena':
            return !isNaN(value);
        case 'susedneVrcholy':
            return Array.isArray(value) && value.findIndex(i => SusednyVrchol.validate(i).hasError()) < 0 && value.length > 0;
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

/**
 * Nacitanie vrcholu podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt vrcholu.
 * @param {Object} options Parametre vyhladavania.
 * @return {*} Node.
 */
Graf.setGet(function (error, model, options, callback) {
    DATABASE('graf').findOne(options, function (err, node) {
        if (err) {
            error.push('unableToGet');
            return callback();
        }
        if (node) {
            U.copy(node, model);
        }
        return callback();
    });
});

/**
 * Vytvorenie noveho vrcholu alebo aktualizacia existujuceho.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt vrcholu.
 * @param {Object} options Parametre funkcie.
 * @return {*} vrchol.
 */
Graf.setSave(function (error, model, options, callback) {
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
        DATABASE('graf').insert(model.$clean(), function (err, result) {
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
        DATABASE('graf').update({
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
 * Aktualizacia atributov kapely.
 * 
 * Zo vstupnych parametrov sa vyberu len tie, ktorych aktualizacia je povolena.
 * Zoznam atributov, ktore je povolene aktualizovat sa nachadza v konstante 'allowed'.
 * 
 * Nasledne sa aktualizovany objekt upravy (prepare) a zvaliduje (validate).
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt kapely.
 * @param {Object} options Parametre funkcie.
 */
Graf.addWorkflow('update', function (error, model, options, callback) {
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
 * @param {Object} model Aktualny objekt vrcholu.
 * @param {Object} options Parametre funkcie.
 * @return {*}
 */
Graf.addWorkflow('checkIfNotExists', function (error, model, options, callback) {
    var nameLowerCase = new RegExp(["^", model.nazov, "$"].join(""), "i");
    DATABASE('graf').findOne({
        $and: [
                { nazov: nameLowerCase },
                { _id: { $ne: model._id} },    
              ]       
    }, function (err, node) {
        if (node) {
            error.push('alreadyExists');
            return callback();
        }
        return callback();
    });
});


/**
 * Odstranenie existujuceho vrcholu z grafu.
 * 
 * @param {Object} error Chyba.
 * @param {Object} options Parametre funkcie.
 * @return {*}
 */
Graf.setRemove(function (error, options, callback) {
    DATABASE('graf').remove({
        _id: options._id
    }, function (err) {
        if (err) {
            error.push('unableToDelete');
            return callback();
        }
        return callback();
    });
});
exports.Graf = Graf;