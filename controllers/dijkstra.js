var Graph = require('node-dijkstra');

exports.install = function () {
    F.route('/home', viewDomov, ['get']);
};    

function viewDomov() {
    var g = new Graph();

g.addVertex('A', {B:1});
g.addVertex('B', {A:1, C:2, D: 4});
g.addVertex('C', {B:2, D:1});
g.addVertex('D', {C:1, B:4});
var path = {path: g.shortestPath('A', 'A')};
console.log(path);
	var self = this;
    return self.view('home', path);
}