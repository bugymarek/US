var MC = require('mongodb').MongoClient;
var DB = null;

MC.connect(process.env.MONGO_URL, function (err, db) {
    if (err) {
        throw err;
    }
    DB = db;
});

F.database = function (collection) {
    if (collection) {
        return DB.collection(collection);
    }
    return DB;
};