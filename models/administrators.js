exports.id = 'AdministratorLogins';
var AdministratorLogin = NEWSCHEMA('AdministratorLogin');

AdministratorLogin.define('email', String, true);
AdministratorLogin.define('password', String, true);
AdministratorLogin.define('remember', Boolean);

AdministratorLogin.setPrefix('errorLogin-');
AdministratorLogin.setValidate(function (name, value) {
    switch (name) {
        case 'email':
            return U.isEmail(value) && value.length >= 6 && value.length <= 200;
        case 'password':
            return !U.isNullOrEmpty(value) && value.length >= 6 && value.length <= 200;
        default:
            return false;
    }
});

AdministratorLogin.addWorkflow('login', function (error, model, controller, callback) {
    Administrator.get({
        filter: {
            email: model.email,
            isActive: true
        }
    }, function (err, administrator) {
        if (err) {
            error.push(err);
            return callback();
        }
        if (!administrator || !administrator._id) {
            error.push('notFound');
            return callback();
        }
        administrator.$workflow('verifyPassword', model.password, function (err, verified) {
            if (err) {
                error.push(err);
                return callback();
            }
            if (!verified) {
                error.push('notVerified');
                return callback();
            }
            var expiration = new Date().add(model.remember ? '30 days' : '5 minutes');
            var value = administrator._id + '|' + F.config.secret + '|' + controller.req.headers['user-agent'].substring(0, 20).replace(/\s/g, '') + '|' + controller.ip + '|';
            controller.cookie(F.config.cookie, F.encrypt(value, F.config.secret), expiration);
            return callback({
                id: administrator._id
            });
        });
    });
});

exports.AdministratorLogin = AdministratorLogin;

exports.id = 'Administrators';
var Administrator = NEWSCHEMA('Administrator');

Administrator.define('_id', Object);
Administrator.define('email', String, true);
Administrator.define('name', String, true);
Administrator.define('hash', String);
Administrator.define('salt', String);
Administrator.define('permissions', String, true);
Administrator.define('created', Date);
Administrator.define('updated', Date);
Administrator.define('isActive', Boolean);

Administrator.constant('allowed', ['name', 'permissions', 'updated', 'isActive']);
Administrator.setPrefix('errorAdministrator-');
Administrator.setDefault(function (name) {
    switch (name) {
        case 'created':
        case 'updated':
            return new Date();
    }
});

Administrator.setPrepare(function (name, value) {
    switch (name) {
        case 'email':
        case 'hash':
        case 'salt':
            return value.toLowerCase() || null;
        case 'permissions':
            return value ? value.toUpperCase() : 'ADMIN';
    }
});

Administrator.setValidate(function (name, value) {
    switch (name) {
        case 'name':
            return !U.isNullOrEmpty(value) && value.length >= 3;
        case 'password':
            return !U.isNullOrEmpty(value) && value.length >= 6 && value.length <= 200;
        case 'email':
            return U.isEmail(value) && value.length >= 6 && value.length <= 200;
        case 'permissions':
            return U.isAdministratorPermissions(value);
        default:
            return false;
    }
});

/**
 * Nacitanie zoznamu pouzivatelov podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} options Parametre vyhladavania (filter, fields, sort, offset, limit).
 * @return {*} Zoznam pouzivatelov.
 */
Administrator.setQuery(function (error, options, callback) {
    var cursor = DATABASE('administrators').find(options.filter || {}, options.fields || {});
    if (options.offset) {
        cursor.skip(options.offset);
    }
    if (options.limit) {
        cursor.limit(options.limit);
    }
    if (options.sort) {
        cursor.sort(options.sort);
    }
    cursor.toArray(function (err, administrators) {
        if (err) {
            error.push('unableToQuery');
            return callback();
        }
        return callback(administrators);
    });
});

/**
 * Nacitanie pouzivatela podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt pouzivatela.
 * @param {Object} options Parametre vyhladavania.
 * @return {*} Pouzivatel.
 */
Administrator.setGet(function (error, model, options, callback) {
    DATABASE('administrators').findOne(options.filter || {}, options.fields || {}, function (err, administrator) {
        if (err) {
            error.push('unableToGet');
            return callback();
        }
        if (administrator) {
            U.copy(administrator, model);
        }
        return callback();
    });
});

/**
 * Vytvorenie noveho pouzivatela alebo aktualizacia existujuceho pouzivatela.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt pouzivatela.
 * @param {Object} options Parametre funkcie.
 * @return {*} Pouzivatel.
 */
Administrator.setSave(function (error, model, options, callback) {
    var isUpdate = model._id ? true : false;
    if (isUpdate) {
        updateEntity(error, model, options, callback);
    }
    else {
        createEntity(error, model, options, callback);
    }
});

/**
 * Odstranenie existujuceho pouzivatela.
 * 
 * @param {Object} error Chyba.
 * @param {Object} options Parametre funkcie.
 * @return {*}
 */
Administrator.setRemove(function (error, options, callback) {
    DATABASE('administrators').remove({
        _id: options._id
    }, function (err) {
        if (err) {
            error.push('unableToDelete');
            return callback();
        }
        return callback();
    });
});

/**
 * Nacitanie poctu pouzivatelov podla filtra.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt pouzivatela.
 * @param {Object} options Parametre funkcie.
 * @return {*} Pocet pouzivatelov.
 */
Administrator.addOperation('count', function (error, model, options, callback) {
    DATABASE('administrators').count(options || {}, function (err, count) {
        if (err) {
            error.push('unableToCount');
            return callback();
        }
        return callback(count);
    });
});

/**
 * Overenie zhody zadaneho heslo s heslom pouzivatela.
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt pouzivatela.
 * @param {String} password Zadane heslo pouzivatela.
 * @return {Boolean} true = hesla su totozne / false = hesla su rozne.
 */
Administrator.addWorkflow('verifyPassword', function (error, model, password, callback) {
    U.hashPassword(password, model.salt, function (err, hash) {
        if (err) {
            error.push('passwordNotVerified');
            return callback();
        }
        return callback(null, hash === model.hash);
    });
});

/**
 * Aktualizacia atributov pouzivatela.
 * 
 * Zo vstupnych parametrov sa vyberu len tie, ktorych aktualizacia je povolena.
 * Zoznam atributov, ktore je povolene aktualizovat sa nachadza v konstante 'allowed'.
 * 
 * Nasledne sa aktualizovany objekt upravy (prepare) a zvaliduje (validate).
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt pouzivatela.
 * @param {Object} options Parametre funkcie.
 */
Administrator.addWorkflow('update', function (error, model, options, callback) {
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
 * Overenie, ci sa v databaze uz nenachadza pouzivatel s danym emailom.
 * 
 * @param {Object} error Chyba.
 * @param {Object} model Aktualny objekt pouzivatela.
 * @param {Object} options Parametre funkcie.
 * @return {*}
 */
Administrator.addWorkflow('checkIfNotExists', function (error, model, options, callback) {
    DATABASE('administrators').findOne({
        email: model.email
    }, function (err, administrator) {
        if (err) {
            error.push('unableToVerify');
            return callback();
        }
        if (administrator) {
            error.push('alreadyExists');
            return callback();
        }
        return callback();
    });
});

Administrator.addWorkflow('changePassword', function (error, model, password, callback) {
    U.hashNewPassword(password, function (err, data) {
        if (err) {
            error.push('unableToChangePassword');
            return callback();
        }
        model.updated = new Date();
        DATABASE('administrators').update({
            _id: model._id
        }, {
                $set: {
                    hash: data.hash,
                    salt: data.salt
                }
            }, function (err) {
                if (err) {
                    error.push('unableToChangePassword');
                    return callback();
                }
                return callback();
            });
    });
});

/**
 * Aktualizacia entity - pomocna funkcia.
 */
function updateEntity(error, model, options, callback) {
    model.updated = new Date();
    DATABASE('administrators').update({
        _id: model._id
    }, {
            $set: model.$clean()
        }, function (err) {
            if (err) {
                error.push('unableToUpdate');
                return callback();
            }
            return callback();
        });
}

/**
 * Vytvorenie novej entity - pomocna funkcia.
 */
function createEntity(error, model, options, callback) {
    // skontrolujem, ci sa pouzivatel so zadanym emailom uz v databaze nenachadza
    model.$workflow('checkIfNotExists', function (err) {
        if (err) {
            error.push(err);
            return callback();
        }
        // vygenerujem nove nahodne heslo a zahashujem ho
        var password = generatePassword();
        U.hashNewPassword(password, function (err, data) {
            if (err) {
                error.push('unableToCreate');
                return callback();
            }
            model.hash = data.hash;
            model.salt = data.salt;
            // ulozim noveho pouzivatela do databazy
            DATABASE('administrators').insert(model.$clean(), function (err, result) {
                if (err) {
                    error.push('unableToCreate');
                    return callback();
                }
                model._id = result.insertedCount == 1 ? result.ops[0]._id : null;
                model.password = password;
                return callback();
            });
        });
    });
}

/**
 * Vygenerovanie nahodneho hesla.
 */
function generatePassword() {
    var length = 8;
    var charset = 'abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var password = '';
    for (var i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

exports.Administrator = Administrator;