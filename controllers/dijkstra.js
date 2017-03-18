var Graph = require('node-dijkstra');
var Graf = GETSCHEMA('Graf');
var Areal = GETSCHEMA('Areal');

exports.install = function () {
    F.route('/path', returnPath, ['json', 'post']);
};

/**
 * GET - Metoda vracia najkratsiu najdenu cestu
 */
function returnPath() {
    var self = this;
    var context = {
        from: self.body.from,
        to: self.body.to,
        async: new Utils.Async(),
        error: new ErrorBuilder(),
        results: {},
        expandPath: []
    };
    context.async.await(loadGrafandAplyDijksra.bind(context));
    context.async.run(function () {
        if (context.error.hasError()) {
            return self.throw500(context.error);
        }
        return self.json(context.expandPath);
    });
}

/**
 * GET -Nacitanie grafu a pomocou dijkstrovho algoritmu najdenie najkratsiej cesty
 */
function loadGrafandAplyDijksra(next) {
    var self = this;
    Graf.query({
        sort: {
            nazov: 1
        }
    }, function (err, graf) {
        if (err) {
            self.error.push(err);
            self.async.cancel();
            return next();
        }

        var objGraf = {};
        graf.forEach(function (element) {
            var vrcholy = {};
            element.vrcholyDo.forEach(function (vrchol) {
                vrcholy[vrchol.nazov] = vrchol.cena;
            });
            objGraf[element.nazov] = vrcholy;
        });
        var createdGraf = new Graph(objGraf);
        self.results.path = createdGraf.shortestPath(self.from, self.to);

        var context = {
            async: new Utils.Async(),
            error: new ErrorBuilder(),
            path: self.results.path,
            graf: graf,
            results: []
        };
        context.async.await(getPropertyOfArealForNode.bind(context));
        context.async.run(function () {
            if (context.error.hasError()) {
                return self.throw500(context.error);
            }
            self.expandPath = context.results;
            return next();
        });
    });
}


/**
 *  GET - vrati vlastnosti vrcholu arealu
 * @param {String} id ID arealu.
 * @param {String} name nazov vrcholu.
 */
function getPropertyOfArealForNode(next) {
    self = this;
    self.path.forEach(function (element) {
        Areal.get({
            nazov: self.graf.find(x => x.nazov === element).areal
        }, function (err, model) {
            if (err) {
                return self.throw500(err);
            }
            if (!model || !model.nazov || !Array.isArray(model.vrcholy) || model.vrcholy.length === 0) {
                return self.throw404(new ErrorBuilder().push('errorAreal-unableToGet'));
            }

            delete model._id
            delete model.budova;

            model.areal = model.nazov;
            model.poschodie = model.vrcholy.find(x => x.nazov === element).poschodie;
            model.nazov = model.vrcholy.find(x => x.nazov === element).nazov;
            model.suradnicaX = model.vrcholy.find(x => x.nazov === element).suradnicaX;
            model.suradnicaY = model.vrcholy.find(x => x.nazov === element).suradnicaY;
            model.typ = model.vrcholy.find(x => x.nazov === element).typ;
            delete model.vrcholy;
            self.results.push(model);

            // ak je to posledny prvok pola, potom vyskoc z metody getPropertyOfArealForNode()
            if (self.path.length - 1 === self.path.lastIndexOf(element)) {
                return next();
            }
            return
        });
    });
}