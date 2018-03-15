var mongoose = require("mongoose");
var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

//User
var POISchema = new Schema({
	name: {type: String},
	poster: {type: String},
	description: {type: String},
	certification: {type: String},
	ratings: [Number],
	genres: [String],
	totalreviews: Number,
	rank: [String],
	hours: {type: String},
	length_visit: {type: String},
	phone: {type: String},
	website: {type: String},
	email: {type: String},
	address: {type: String},
	geo: [Number]
});

var PointSchema = new mongoose.Schema({
    //_id: mongoose.Schema.ObjectId,
    loc: [Number]
});

//PointSchema.index({ loc: "2dsphere" });
exports.Point = mongoose.model("Point", PointSchema);
exports.POI = mongoose.model('poi', POISchema, 'poi2s');