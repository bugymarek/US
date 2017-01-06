var Administrator = GETSCHEMA('Administrator');

exports.install = function () {
    F.route('/login', viewLoginForm, ['unauthorize', 'get']);
    F.route('/login', login, ['unathorized', 'post', '*AdministratorLogin']);
    F.route('/logout', logout, ['authorize', 'post']);
};

// zobrazenia formularu pre login
function viewLoginForm() {
    var self = this;
    return self.view('login');
}

/**
 * POST - Prihlasenie pouzivatela
 */
function login() {
    var self = this;
    self.body.$workflow('login', self, function (err, administrator) {
        if (err && err.hasError()) {
            if (err.items[0].name == 'notFound') {
                return self.throw404(err);
            }
            if (err.items[0].name == 'notVerified') {
                return self.throw401(err);
            }
            return self.throw500(err);
        }
        return self.json({
            id: administrator._id
        });
    });
}

/**
 * POST - Odhlasenie pouzivatela.
 */
function logout() {
    var self = this;
    self.cookie(F.config.cookie, '', new Date().add('-1 year'));
    return self.json();
}