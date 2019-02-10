var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
	username: {type:String, required: true},
	password: {type:String, required: true}
});

// Virtual for user profile URL
UserSchema.virtual('url').get(function() {
	return '/profile/' + this._id;
});

module.exports = mongoose.model('User', UserSchema);