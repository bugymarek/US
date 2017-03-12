
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
		case 'password':
			return !U.isEmpty(value);
		default:
			return false;
	};
};