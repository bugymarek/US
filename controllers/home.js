exports.install = function () {
    F.route('/', viewDomov, ['get']);
};

function viewDomov() {
	var self = this;
    return self.view('home');
}