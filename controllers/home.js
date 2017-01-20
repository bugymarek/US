var Map = GETSCHEMA('Map');
var Areal = GETSCHEMA('Areal');

exports.install = function () {
    F.route('/', viewDomov, ['get']);
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
                // vyberie vrcholy len typu miestnost
                for (var i = building.vrcholy.length - 1; i >= 0; i--) {
                    if (building.vrcholy[i].typ !== "miestnost") building.vrcholy.splice(i, 1);
                }
            });
        }
        return self.view('home', context.results);
    });
}

// nacitanie festivalov
function loadMaps(next) {
    var self = this;
    Map.query({
        sort: {
            name: 1
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
            name: 1
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