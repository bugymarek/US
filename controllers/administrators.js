var mail = require('total.js/mail');
var moment = require("moment-timezone");
var Administrator = GETSCHEMA('Administrator');


exports.install = function () {
	F.route('/administrators', viewAdministrators, ['authorize', 'get']);
	F.route('/administrators', createAdministrator, ['authorize', 'xhr', 'post', '*Administrator']);
	F.route('/administrators/{id}', deleteAdministrator, ['authorize', 'xhr', 'delete']);
	F.route('/administrators/{id}', updateAdmnistrator, ['authorize', 'xhr', 'put']);
};


/**
 * POST - Vytvorenie noveho pouzivatela.
 */

function createAdministrator() {
	var self = this;
	if (self.user.permissions !== 'SUPERADMIN') {
		return self.throw403(new ErrorBuilder().push('errorAdministrator-permissions'));
	}
	Administrator.make(self.body, function (err, model) {
		if (err) {
			return self.throw400(err);
		}
		model.$save(function (err, obj) {
			if (err) {
				return self.throw500(err);
			}
			 sendEmailNotification(obj.email, obj.password);
			 return self.json({
			     id: obj._id
			 });
		});
	});
}

/**
 * Na emailovu adresu zadanu pri registracii sa odosle emailom automaticky vygenerovane heslo.
 * 
 * @param {String} email Emailova adresa pouzivatela.
 * @param {String} password Vygenerovane heslo.
 */
function sendEmailNotification(email, password) {
	var text = 'Vitajte v službe ' + F.config.name + '!\n\n';
	text += 'Prihlásiť sa môžete na adrese: ' + F.config.address + '\n\n';
	text += 'Pre prihlásenie Vám bolo vygenerované heslo: ' + password + '\n\n';
	text += 'Na emailovú adresu, z ktorej bol odoslaný tento email prosím neodpovedajte.';
	var message = new mail.Message('Registrácia ' + F.config.name, text);
	message.from(F.config['mail.address.from'], F.config.name);
	message.to(email);
	message.send(F.config['mail.smtp'], JSON.parse(F.config['mail.smtp.options']));
}



/**
 * PUT - Aktualizacia existujuceho pouzivatela.
 * 
 * @param {String} id ID pouzivatela.
 */
function updateAdmnistrator(id) {
	var self = this;
	if (self.user.permissions !== 'SUPERADMIN') {
		return self.throw403(new ErrorBuilder().push('errorAdministrator-permissions'));
	}
	id = U.parseObjectID(id);
	if (!id) {
		return self.throw400(new ErrorBuilder().push('errorAdministrator-unableToUpdate'));
	}
	Administrator.get({
		filter: {
			_id: id
		}
	}, function (err, model) {
		if (err) {
			return self.throw500(err);
		}
		if (!model || !model._id) {
			return self.throw404(new ErrorBuilder().push('errorAdministrator-unableToUpdate'));
		}
		model.$workflow('update', self.body, function (err) {
			if (err) {
				return self.throw400(err);
			}
			model.$save(function (err) {
				if (err) {
					return self.throw500(err);
				}
				return self.json({
					id: id
				});
			});
		});
	});
}

/**
 * DELETE - Odstranenie existujuceho pouzivatela.
 * @param {String} id ID pouzivatela.
 */

function deleteAdministrator(id) {
	var self = this;
	if (self.user.permissions !== 'SUPERADMIN') {
		return self.throw403(new ErrorBuilder().push('errorAdministrator-permissions'));
	}
	id = U.parseObjectID(id);
	if (!id) {
		return self.throw400(new ErrorBuilder().push('errorAdministrator-unableToDelete'))
	}
	Administrator.remove({
		_id: id
	}, function (err) {
		if (err) {
			return self.throw500;
		}
		return self.json({
			id: id
		});
	});
}

/**
 * GET - Nacitanie a zobrazenie zoznamu pouzivatelov + strankovanie vysledkov.
 */
function viewAdministrators() {
	var self = this;
	id = U.parseObjectID(self.user._id);
	if (self.user.permissions !== 'SUPERADMIN' || !id) {
		return self.redirect('/');
	}
	var limit = 10;
	var page = U.parseInt(self.query.p, 1);
	if (page <= 0 || (self.query.p && self.query.p != page.toString())) {
		return self.redirect('/administrators');
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
	context.async.await(loadAdministrators.bind(context));
	context.async.await(loadAdministratorsCount.bind(context));
	context.async.run(function () {
		if (context.error.hasError()) {
			return self.throw500(context.error);
		}
		if ((page * limit - limit) >= context.results.count && page > 1) {
			return self.redirect('/administrators');
		}
		context.results.pagination = new Builders.Pagination(context.results.count, page, limit, '?p={0}');
		return self.view('administrators', context.results);
	});
}

/**
 * Nacitanie zoznamu pouzivatelov na danej stranke (offset + limit) utriedeneho podla _id.
 */
function loadAdministrators(next) {
	var self = this;
	Administrator.query({
		fields: {
			hash: 0,
			salt: 0
		},
		sort: {
			permissions: -1,
			name: 1
		},
		offset: self.context.offset,
		limit: self.context.limit
	}, function (err, administrators) {
		if (err) {
			self.error.push(err);
			self.async.cancel();
			return next();
		}
		self.results.administrators = administrators;
		return next();
	});
}


/**
 * Nacitanie poctu vsetkych pouzivatelov v databaze pre potreby strankovania.
 */
function loadAdministratorsCount(next) {
	var self = this;
	Administrator.operation('count', function (err, count) {
		if (err) {
			self.error.push(err);
			self.async.cancel();
			return next();
		}
		self.results.count = count;
		return next();
	});
}