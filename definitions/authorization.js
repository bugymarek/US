/**
 * Autorizacia pouzivatela spustana pred kazdym requestom.
 * 
 * @param {Object} req Request.
 * @param {Object} res Response.
 * @param {Array} flags Zoznam atributov requestu.
 * @return {*} true + pouzivatel = prihlaseny / false = neprihlaseny
 */
F.onAuthorize = function (req, res, flags, callback) {
    // Nacitam cookie a desifrujem jej obsah
	// Ak sa nepodarilo desifrovat obsah cookie,
	// alebo udaje ulozene v cookie nemaju pozadovane hodnoty,
	// pouzivatela povazujeme za neprihlaseneho
	var cookie = req.cookie(F.config.cookie);
	if (cookie === null || cookie.length < 10) {
		return callback(false);
	}
	var obj = F.decrypt(cookie, F.config.secret, false);
	if (obj === null || obj === '') {
		return callback(false);
	}
	var values = obj.split('|');
    if (values[1] !== F.config.secret || values[3] !== req.ip || values[2] !== req.headers['user-agent'].substring(0, 20).replace(/\s/g, '')) {
        return callback(false);
    }
    // Podla ID pouzivatela ulozeneho v cookie overime, ci sa nachadza v DB a ci je aktivny
	var id = U.parseObjectID(values[0]);
	if (!id) {
		return callback(false);
	}
	DATABASE('administrators').findOne({
		_id: id
	}, function (err, administrator) {
		if (err || !administrator || !administrator._id || !administrator.isActive) {
			return callback(false);
		}
        // Nastavime pouzivatelovi novy datum a cas poslednej aktivity
		DATABASE('administrators').update({
			_id: id
		}, {
				$set: {
					lastActivity: new Date().getTime()
				}
			}, function (err) {
				if (err) {
					return callback(false);
				}
				delete administrator.hash;
				delete administrator.salt;
				return callback(true, administrator);
			});
	});
};