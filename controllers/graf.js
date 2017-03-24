var Graf = GETSCHEMA('Graf');
var Areal = GETSCHEMA('Areal');

exports.install = function () {
	F.route('/graf', viewGraf, ['authorize', 'get']);
	F.route('/nodes/{id}', viewNode, ['authorize', 'get']);
	F.route('/nodes', createNode, ['authorize', 'xhr', 'json', 'post']);
	F.route('/nodes/{id}', updateNode, ['authorize', 'xhr', 'json', 'put']);
	F.route('/nodes/{id}', deleteNode, ['authorize', 'xhr', 'delete']);
	F.route('/node', viewNodeForm, ['authorize', 'get']);
};

/**
 * GET - Nacitanie a zobrazenie zoznamu vrcholov v grafe + strankovanie vysledkov.
 */
function viewGraf() {
	var self = this;
	var limit = 30;
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
		if(!Array.isArray(graf) || !graf || graf.length == 0){
			console.log();
			self.results.graf = graf;
			self.async.cancel();
			return next();
		}		
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
			model._id = element._id;
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

/**
 * GET - Zobraznie prazdneho formularu pre vrchol grafu.
 */
function viewNodeForm() {
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
		return self.view('node', context.results);
	});
}

/**
 * Nacitanie zoznamu arealov utriedeneho nazvu.
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
 * GET - Zobraznie detailu existujuceho vrcholu grafu.
 */
function viewNode(id) {
	var self = this;
	var context = {
		async: new Utils.Async(),
		error: new ErrorBuilder(),
		id: id,
		results: {}
	};
	context.async.await(loadAreals.bind(context));
	context.async.await(loadNode.bind(context));
	context.async.run(function () {
		if (context.error.hasError()) {
			return self.throw500(context.error);
		}
		return self.view('node', context.results);
	});
}

/*
 * GET - Nacitanie vrcholu grafu
 */
function loadNode(next) {
	var self = this;
	id = U.parseObjectID(self.id);
	if (!id) {
		return self.throw400(new ErrorBuilder().push('errorNode-unableToGet'));
	}
	Graf.get({
		_id: id
	}, function (err, model) {
		if (err) {
			self.error.push(err);
			self.async.cancel();
			return next();
		}
		if (!model || !model._id) {
			self.error.push('errorNode-notFound');
			self.async.cancel();
			return next();
		}
		self.results.node = model;
		var context = {
			async: new Utils.Async(),
			error: new ErrorBuilder(),
			node: model,
			results: {}
		};
		context.async.await(getNodesOfArealForNode.bind(context));
		context.async.run(function () {
			if (self.error.hasError()) {
				return self.error.push(context.error);
			}
			self.results.nodes = context.results.nodes;
			return next();
		});
	});
}

/**
 *  GET - vrati vrcholy arealu potrebne pre vrchol grafu.
 * @param {String} id ID arealu.
 * @param {String} name nazov vrcholu.
 */
function getNodesOfArealForNode(next) {
	self = this;
	Areal.get({
		nazov: self.node.areal
	}, function (err, model) {
		if (err) {
			return self.throw500(err);
			self.async.cancel();
			return next();
		}
		if (!model || !model.nazov || !Array.isArray(model.vrcholy) || model.vrcholy.length === 0) {
			return self.throw404(new ErrorBuilder().push('errorAreal-unableToGet'));
			self.async.cancel();
			return next();
		}

		delete model._id
		delete model.budova;
		delete model.nazov;
		delete model.url;
		delete model.poschodia;
		self.node.poschodie = model.vrcholy.find(x => x.nazov === self.node.nazov).poschodie;
		self.node.suradnicaX = model.vrcholy.find(x => x.nazov === self.node.nazov).suradnicaX;
		self.node.suradnicaY = model.vrcholy.find(x => x.nazov === self.node.nazov).suradnicaY;

		//utriedenie v poradi podla poschodia, nazvu vrcholu.
			model.vrcholy.sort(function (a, b) {
				if (a.poschodie < b.poschodie) return -1;
				if (a.poschodie > b.poschodie) return 1;
				if (a.nazov < b.nazov) return -1;
				if (a.nazov > b.nazov) return 1;
				return 0;
			});
		self.results.nodes = model.vrcholy;
		return next();
	});
}

/**
 * POST - Vytvorenie noveho vrcholuj v grafe.
 */

function createNode() {
	var self = this;
	Graf.make(self.body, function (err, model) {
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
 * PUT - Aktualizacia existujuceho vrchlu v grafe.
 * 
 * @param {String} id ID vrcholu v grafe.
 */
function updateNode(id) {
	var self = this;
	id = U.parseObjectID(id);
	if (!id) {
		return self.throw400(new ErrorBuilder().push('errorGraf-unableToUpdate'));
	}
	Graf.get({
		_id: id
	}, function (err, model) {
		if (err) {
			return self.throw500(err);
		}
		if (!model || !model._id) {
			return self.throw404(new ErrorBuilder().push('errorGraf-unableToUpdate'));
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
 * DELETE - Odstranenie existujuceho vrchlu z grafu.
 * 
 * @param {String} id ID vrchlu.
 */
function deleteNode(id) {
	var self = this;
	id = U.parseObjectID(id);
	if (!id) {
		return self.throw400(new ErrorBuilder().push('errorGraf-unableToDelete'));
	}
	Graf.remove({
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