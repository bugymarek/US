var Map = GETSCHEMA('Map');
var Areal = GETSCHEMA('Areal');

exports.install = function () {
    F.route('/areals', viewAreals, ['authorize', 'get']);
};   

/**
 * GET - Nacitanie a zobrazenie zoznamu arealov + strankovanie vysledkov.
 */
function viewAreals() {
	var self = this;
	var context = {
		async: new Utils.Async(),
		error: new ErrorBuilder(),
		results: {}
	};
	context.async.await(loadAreals.bind(context));
	context.async.run(function () {
		if (context.error.hasError()) {
			return self.throw500(context.error);
		}
		return self.view('areals', context.results);
	});
}

/**
 * Nacitanie zoznamu arealov na danej stranke (offset + limit) utriedeneho podla _id.
 */
function loadAreals(next) {
	var self = this;
	Areal.query({
		sort: {
			nazov: 1
		}
	}, function (err, areals) {
		if (err) {
			self.error.push(err);
			self.async.cancel();
			return next();
		}
		self.results.areals = areals;
		return next();
	});
}
