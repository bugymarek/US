var Graph = require('node-dijkstra');
var Graf = GETSCHEMA('Graf');
exports.install = function () {
    F.route('/graf', returnGraf, ['json', 'post']);
};


function returnPath(graf, from, to) {
    var objGraf = {};
    graf.forEach(function (element) {
        var vrcholy = {};
        element.vrcholyDo.forEach(function (vrchol) {
            vrcholy[vrchol.vrchol] = vrchol.cena;
        });
        objGraf[element.vrchol] = vrcholy;
    });
    var createdGraf = new Graph(objGraf);
    var path = createdGraf.shortestPath(from, to);
    if(path == null) return null;

    // vytvorenie pola typu objek pre jednotlive vrcholy.   
    var expandPath = [];
    path.forEach(function (element) {
        var vrchol = {
            vrchol: element,
            areal: graf.find(x => x.vrchol === element).areal,
            poschodie: graf.find(x => x.vrchol === element).poschodie,
            suradnicaX: graf.find(x => x.vrchol === element).suradnicaX,
            suradnicaY: graf.find(x => x.vrchol === element).suradnicaY,
            typ: graf.find(x => x.vrchol === element).typ,
        };
        expandPath.push(vrchol);
    });
    return expandPath;
}

/**
 * GET - Nacitanie grafu
 */
function returnGraf() {
    var self = this;
    var from = self.body.from;
    var to = self.body.to;
    var context = {
        async: new Utils.Async(),
        error: new ErrorBuilder(),
        results: {}
    };
    context.async.await(loadGraf.bind(context));
    context.async.run(function () {
        if (context.error.hasError()) {
            return self.throw500(context.error);
        }
        var path = returnPath(context.results.graf, from, to);
        return self.json(path);
    });
}

// nacitanie grafu
function loadGraf(next) {
    var self = this;
    Graf.query({
        sort: {
            vrchol: 1
        }
    }, function (err, graf) {
        if (err) {
            self.error.push(err);
            self.async.cancel();
            return next();
        }
        self.results.graf = graf;
        return next();
    });
}