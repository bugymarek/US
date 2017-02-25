var Map = GETSCHEMA('Map');
var Areal = GETSCHEMA('Areal');

exports.install = function () {
    F.route('/', viewDomov, ['get']);
    F.route('/map/{name}', getMap, ['get']);
    F.route('/building/{id}', getRoomsOfBuilding, ['get']);
};    


/**
 * GET - Nacitanie map, budou a zobrazenie domovskej stranky.
 */
function viewDomov() {
    var self = this;
    var context = {
        async: new Utils.Async(),
        error: new ErrorBuilder(),
        results: {}
    };
    context.async.await(loadMaps.bind(context));
    context.async.await(loadBuildings.bind(context));
    context.async.run(function () {
        if (context.error.hasError()) {
            return self.throw500(context.error);
        }
        if (Array.isArray(context.results.buildings)) {
            context.results.buildings.forEach(function (building) {
                delete building.hrany;
                delete building.vrcholy;
                delete building.budova;
            });
        }
        return self.view('home', context.results);
    });
}

// nacitanie map
function loadMaps(next) {
    var self = this;
    Map.query({
        sort: {
            nazov: 1
        }
    }, function (err, maps) {
        if (err) {
            self.error.push(err);
            self.async.cancel();
            return next();
        }
        self.results.maps = maps;
        return next();
    });
}

// nacitanie budov
function loadBuildings(next) {
    var self = this;
    Areal.query({
        sort: {
            nazov: 1
        },
        filter: {
            budova: true
        }
    }, function (err, buildings) {
        if (err) {
            self.error.push(err);
            self.async.cancel();
            return next();
        }
        self.results.buildings = buildings;
        return next();
    });
}

// vrati budovu podla id s jej miestnstami.
function getRoomsOfBuilding(id) {
    var self = this;
    id = U.parseObjectID(id);
    if (!id) {
        return self.throw400(new ErrorBuilder().push('errorAreal-unableToGet'));
    }
    Areal.get({
        _id: id
    }, function (err, model) {
        if (err) {
            return self.throw500(err);
        }      
        if (!model || !model._id) {
            return self.throw404(new ErrorBuilder().push('errorAreal-unableToGet'));
        }
            delete model.hrany;
            // vyberie vrcholy len typu miestnost
            for (var i = model.vrcholy.length - 1; i >= 0; i--) {
                if (model.vrcholy[i].typ !== "miestnost") model.vrcholy.splice(i, 1);
            }
            model.vrcholy.forEach(function (vrchol) {
                delete vrchol.typ;
            });
        return self.json(model);
    });
}

// vrati mapu podla nazvu.
function getMap(name) {
    var self = this;
    Map.get({
        nazov: name
    }, function (err, model) {
        if (err) {
            return self.throw500(err);
        }      
        if (!model || !model.nazov) {
            return self.throw404(new ErrorBuilder().push('errorMap-unableToGet'));
        }
        return self.json(model);
    });
}