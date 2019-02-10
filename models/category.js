var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CategorySchema = mongoose.Schema({
	name: {type: String, required: true},
	user: {type: Schema.Types.ObjectId, ref: 'User', required: true}
});

module.exports = mongoose.model('Category', CategorySchema);