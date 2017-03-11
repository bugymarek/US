var Map = GETSCHEMA('Map');
var Areal = GETSCHEMA('Areal');

exports.install = function () {
    F.route('/areals', viewAreals, ['authorize', 'get']);
	F.route('/areals/{id}', viewAreal, ['authorize', 'get']);
	F.route('/areals', createAreal, ['authorize', 'xhr', 'json', 'post']);
    F.route('/areals/{id}', updateAreal, ['authorize', 'xhr', 'json', 'put']);
    F.route('/areals/{id}', deleteAreal, ['authorize', 'xhr', 'delete']);
	F.route('/areal', viewArealForm, ['authorize', 'get']);
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

/**
 * GET - Nacitanie a zobrazenie arealu
 */
function viewAreal(id) {
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
			return self.throw404(new ErrorBuilder().push('errorAreal-notFound'));
		}
        return self.view(
			'areal', 
		{
            areal: model
        });
	});
}

//zobraznie prazdneho formularu pre areal
function viewArealForm() {
    var self = this;
    return self.view('areal');
}

/**
 * POST - Vytvorenie noveho arealu.
 */

function createAreal() {
	var self = this;
	Areal.make(self.body, function (err, model) {
		if (err) {
			return self.throw400(err);
		}
		model.$save(function (err) {
			if (err) {
				return self.throw500(err);
			}
			self.json({
				id: model._id
			});

		});
	});
}

/**
 * PUT - Aktualizacia existujuceho arealu.
 * 
 * @param {String} id ID arealu.
 */
function updateAreal(id) {
	var self = this;
	id = U.parseObjectID(id);
	if (!id) {
		return self.throw400(new ErrorBuilder().push('errorAreal-unableToUpdate'));
	}
	Areal.get({
		_id: id
	}, function (err, model) {
		if (err) {
			return self.throw500(err);
		}
		if (!model || !model._id) {
			return self.throw404(new ErrorBuilder().push('errorAreal-unableToUpdate'));
		}
		model.$workflow('update', self.body, function (err) {
			if (err) {
				return self.throw400(err);
			}
			model.$save(function (err) {
				if (err) {
					return self.throw500(err);
				}
				self.json({
					id: id
				});
			});
		});
	});
}

/**
 * DELETE - Odstranenie existujuceho arealu.
 * 
 * @param {String} id ID arealu.
 */
function deleteAreal(id) {
	var self = this;
	id = U.parseObjectID(id);
	if (!id) {
		return self.throw400(new ErrorBuilder().push('errorAreal-unableToDelete'));
	}
	Areal.remove({
		_id: id
	}, function (err) {
		if (err) {
			return self.throw500(err);
		}
		self.json({
			id: id
		});
	});
}
