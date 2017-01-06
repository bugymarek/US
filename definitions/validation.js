var genres = ['rock', 'elektro', 'alternative', 'metal', 'reggae', 'blues', 'jazz', 'drumbass', 'punk', 'pop', 'disco', 'hiphop', 'country'];

/**
 * Validacia vstupnych parametrov requestov pre API a Web (administracne rozhranie).
 * 
 * @param {String} name Nazov parametra.
 * @param {Object} value Hodnota parametra.
 * @param {String} path Cesta parametra v modeli.
 * @param {Object} model Objekt obsahujuci parametre na validaciu.
 * @param {String} schema Nazov schemy.
 * @return {Boolean} true = hodnota parametra vyhovuje / false = hodnota nevyhovuje
 */
F.onValidate = function(name, value, path, model, schema) {
	switch (name) {
		case 'email':
			return U.isEmail(value);
		case 'password':
			return !U.isNullOrEmpty(value);
        case 'genre':
            return !U.isNullOrEmpty(value) && genres.indexOf(value) >= 0;
		default:
			return false;
	};
};