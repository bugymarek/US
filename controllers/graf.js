var Graf = GETSCHEMA('Graf');
var Areal = GETSCHEMA('Areal');

exports.install = function () {
	F.route('/graf', viewGraf, ['authorize', 'get']);
	//F.route('/areals/{id}', viewAreal, ['authorize', 'get']);
	// F.route('/areals', createAreal, ['authorize', 'xhr', 'json', 'post']);
	// F.route('/areals/{id}', updateAreal, ['authorize', 'xhr', 'json', 'put']);
	// F.route('/areals/{id}', deleteAreal, ['authorize', 'xhr', 'delete']);
	F.route('/node', viewNodeForm, ['authorize', 'get']);
};

/**
 * GET - Nacitanie a zobrazenie zoznamu vrcholov v grafe + strankovanie vysledkov.
 */
function viewGraf() {
	var self = this;
	var limit = 10;
	var page = U.parseInt(self.query.p, 1);
	if (page <= 0 || (self.query.p && self.query.p != page.toString())) {
		return self.redirect('/graf');
	}
	var context = {
		async: new Utils.Async(),
		error: new ErrorBuilder(),
		results: {},
		context: {
			offset: page * limit - limit,
			limit: limit
		}
	};
	context.async.await(loadGraf.bind(context));
	context.async.await(loadNodesCount.bind(context));
	context.async.run(function () {
		if (context.error.hasError()) {
			return self.throw500(context.error);
		}
		if ((page * limit - limit) >= context.results.count && page > 1) {
			return self.redirect('/graf');
		}
		context.results.pagination = new Builders.Pagination(context.results.count, page, limit, '?p={0}');

		return self.view('graf', context.results);
	});
}

/**
 * Nacitanie zoznamu arealov na danej stranke (offset + limit) utriedeneho v poradi podla arealu, poschodia, nazvu vrcholu.
 */
function loadGraf(next) {
	var self = this;
	Graf.query({
		sort: {
			areal: 1,
		},
		offset: self.context.offset,
		limit: self.context.limit
	}, function (err, graf) {
		if (err) {
			self.error.push(err);
			self.async.cancel();
			return next();
		}
		var context = {
			async: new Utils.Async(),
			error: new ErrorBuilder(),
			graf: graf,
			results: []
		};
		context.async.await(getPropertyOfArealForNode.bind(context));
		context.async.run(function () {
			if (context.error.hasError()) {
				return self.throw500(context.error);
				}
			//utriedenie v poradi podla poschodia, nazvu vrcholu.
			context.results.sort(function (a, b) {
				if (a.poschodie < b.poschodie) return -1;
				if (a.poschodie > b.poschodie) return 1;
				if (a.nazov < b.nazov) return -1;
				if (a.nazov > b.nazov) return 1;
				return 0;
			});
			self.results.graf = context.results;
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
	self.graf.forEach(function (element) {
		Areal.get({
			nazov: element.areal
		}, function (err, model) {
			if (err) {
				return self.throw500(err);
			}
			if (!model || !model.nazov || !Array.isArray(model.vrcholy) || model.vrcholy.length === 0) {
				return self.throw404(new ErrorBuilder().push('errorAreal-unableToGet'));
			}

			delete model.budova;
			delete model.poschodia;
			model.areal = model.nazov;
			model.poschodie = model.vrcholy.find(x => x.nazov === element.nazov).poschodie;
			model.nazov = model.vrcholy.find(x => x.nazov === element.nazov).nazov;
			model.typ = model.vrcholy.find(x => x.nazov === element.nazov).typ;
			delete model.vrcholy;
			self.results.push(model);

			// ak je to posledny prvok pola, potom vyskoc z metody getPropertyOfArealForNode()
			if (self.graf.length - 1 === self.graf.lastIndexOf(element)) {
				return next();
			}
			return
		});
	});
}

/**
 * Nacitanie z databazi pocet vsetkych vrcholov v grafe pre potreby strankovania.
 */
function loadNodesCount(next) {
	var self = this;
	Graf.operation('count', function (err, count) {
		if (err) {
			self.error.push(err);
			self.async.cancel();
			return next();
		}
		self.results.count = count;
		return next();
	});
}

/**************************************************************************
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

/**
 * GET - Zobraznie prazdneho formularu pre vrchol grafu.
 */
function viewNodeForm() {
	var self = this;
	return self.view('node');
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
