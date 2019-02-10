var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EntrySchema = mongoose.Schema({
	title: {type:String, required: true},
	date: {type:String},
	location: {type:String, required: true},
	description: {type:String, required: true},
	idea:{type:String, required:true},
	size: {type:String, enum:['A little', 'Somewhat', 'Very'], required: true}, 
	user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
	category: {type: Schema.Types.ObjectId, ref: 'Category', required: true}
});

// Virtual for task URL
EntrySchema.virtual('url').get(function() {
	return '/journal/' + this._id;
});

module.exports = mongoose.model('Entry', EntrySchema);