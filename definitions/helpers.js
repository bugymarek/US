/**
 * Priradenie CSS triedy podla aktualneho stavu aktivacie prvku
 * 
 * @param {Boolean} state Aktualny stav aktivacie prvku.
 * @return {String} CSS trieda podla aktualneho stavu prvku.
 */
F.helpers.activationCss = function(state) {
	return state ? 'activated' : 'deactivated';
};

/**
 * Priradenie tooltipu podla aktualneho stavu aktivacie prvku.
 * @param {Boolean} state Aktualny stav aktivacie prvku.
 * @param {String} positive Text, ktory bude vrateny v pripade aktivneho stavu.
 * @param {String} negative Text, ktory bude vrateny v pripade neaktivneho stavu.
 * @return {String} Text pre tooltip podla aktualneho stavu prvku.
 */
F.helpers.activationText = function(state, positive, negative) {
	return state ? positive : negative;
};

/**
 * Priradenie CSS triedy znacky podla aktualneho stavu aktivacie prvku.
 * 
 * @param {Boolean} state Aktualny stav aktivacie prvku.
 * @return {String} CSS trieda znacky podla aktualneho stavu prvku.
 */
F.helpers.activationMarker = function(state) {
	return state ? 'fa-check' : 'fa-times';
};