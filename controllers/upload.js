// maximalna velkost img obmedzena na 4 MB
const maxImageSize = 4096;

var crypto = require('crypto');

exports.install = function () {
    F.route('/upload', uploadImage, ['upload'], maxImageSize);
};

function uploadImage() {
	var self = this;
  var name = crypto.randomBytes(25).toString('hex');
  var file = self.files[0];
  var type = '.' + file.type.split("/")[1];
  file.rename(F.path.public('uploads/' + name + type));
 return self.json({url: '/uploads/' + name + type[0]});
}