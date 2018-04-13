var mongoose = require("mongoose");
var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

// POI
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

// Byway
var BywaySchema = new Schema({
	id: String,
	name: String,
	bounds: [[Number]],
	contact: String,
	description: String,
	designations: [String],
	distance: String,
	duration: String,
	ll: [Number],
	path: String,
	ps: [String],
	states: [String],
	website: [{name: String, url: String}],
	// includes
	// part of
});

var LocationSchema = new Schema({
	name: {type: String},
	geo: [Number],
	address: {type: String}
});

var PathSchema = new Schema({
	coordinates: [[Number]],
	encodedPath: String
});

var TravelSchema = new Schema({
	startGeo: [Number],
	endGeo: [Number],
	distance: Number,
	duration: Number,
	path: PathSchema,
	travelMode: String,
	htmlInstructions: String
});

var SubrouteSchema = new Schema({
	origin: LocationSchema,
	destine: LocationSchema,
	path: PathSchema,
	distance: Number,
	duration: Number,
	steps: [TravelSchema]
});

// Route
var RouteSchema = new Schema({
	id: {type: String},
	origin: LocationSchema,
	destine: LocationSchema,
	waypoints: [LocationSchema],
	waypointsOrder: [Number],
	path: PathSchema,
	distance: Number,
	duration: Number,
	subRoute: [SubrouteSchema]
});



exports.POI = mongoose.model('poi', POISchema, 'poi2s');
exports.Byway = mongoose.model('byway', BywaySchema, 'byway');
exports.Route = mongoose.model('route', RouteSchema, 'routes');