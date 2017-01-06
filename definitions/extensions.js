var ObjectID = require('mongodb').ObjectID;
var crypto = require('crypto');

/**
 * Parsovanie Mongo ObjectID zo vstupneho parametra.
 * 
 * @param {String} Parameter, z ktoreho bude parsovane Object ID.
 * @return {ObjectID} Mongo Object ID.
 */
U.parseObjectID = function (param) {
    return ObjectID.isValid(param) ? new ObjectID(param) : null;
};

U.prepareException = function (exception) {
    if (exception && exception instanceof ErrorBuilder && exception.hasError()) {
        exception = exception.transform('clear');
        exception.prepare();
        return {
            errors: exception.items
        };
    }
    return;
};

U.hashNewPassword = function (password, callback) {
    var salt = crypto.randomBytes(64).toString('hex');
    U.hashPassword(password, salt, function (err, hash) {
        if (err) {
            return callback(err);
        }
        return callback(null, {
            hash: hash,
            salt: salt
        });
    });
};

U.hashPassword = function (password, salt, callback) {
    crypto.pbkdf2(password, salt, 10000, 64, function (err, hash) {
        if (err) {
            return callback(err);
        }
        return callback(null, hash.toString('hex'));
    });
};

U.isAdministratorPermissions = function (value) {
    switch (value) {
        case 'ADMIN':
        case 'SUPERADMIN':
            return true;
        default:
            return false;
    }
};

U.isBandGenre = function (value) {
    return !value.find(i => !F.onValidate('genre', i));
};

U.isIDPrepare = function (value) {
    return ObjectID.isValid(value) ? value : null;
};

U.isIDValid = function (value) {
    return !value.find(i => !ObjectID.isValid(i));
};

U.isPriceValid = function (value) {
    var arr = value.split('-');
    return !arr.find(i => isNaN(parseInt(i)));
};

