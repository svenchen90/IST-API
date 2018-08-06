var mongoose = require("mongoose");
var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
	email: {type: Schema.Types.String, unique: true},
	password: {type: String},
	first_name: {type: String},
	last_name: {type: String},
	date_create: {type: Date},
	travel_miles: {type: Number},
	travel_countries: [String],
	travel_cities: [String],
	travel_POIs: [Schema.Types.ObjectId],
	status: {type: Number}
});
	
	
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

/* Route */
var LocationSchema = new Schema({
	id: String,
	name: String,
	geo: [Number],
	address: String
});

var PathSchema = new Schema({
	coordinates: [[Number]],
	encodedPath: String
});

var TravelSchema = new Schema({
	// start_location: [Number],
	// end_location: [Number],
	// distance: Number,
	// duration: Number,
	// path: PathSchema,
	// travel_mode: String,
	// html_instructions: String
});

var SubrouteSchema = new Schema({
	origin: LocationSchema,
	destination: LocationSchema,
	path: PathSchema,
	distance: Number,
	duration: Number,
	steps: [TravelSchema]
});

var RouteSchema = new Schema({
	id: String,
	origin: LocationSchema,
	destination: LocationSchema,
	waypoints: [LocationSchema],
	// waypointsOrder: [Number],
	path: PathSchema,
	distance: Number,
	duration: Number,
	subRoute: [SubrouteSchema],
	bounds:[[Number]]
});
/* Route */

var RouteTempSchema = new Schema({
	_userId: Schema.Types.ObjectId,
	origin: {
		address: String,
		geo: [Number]
	},
	destination: {
		address: String,
		geo: [Number]
	},
	start_date: Date,
	end_date: Date,
	path: {
		coordinates: [[Number]],
		encodedPath: String
	},
	distance: Number,
	duration: Number,
	itinerary: [[Schema.Types.Mixed]],
	solution: [Schema.Types.Mixed],
	bounds: [Schema.Types.Mixed]
});

exports.POI = mongoose.model('poi', POISchema, 'poi2s');
exports.Byway = mongoose.model('byway', BywaySchema, 'byway');
exports.Route = mongoose.model('route', RouteSchema, 'routes');
exports.Route_Temp = mongoose.model('route_temp', RouteTempSchema, 'routes_temp');

exports.User = mongoose.model('user', UserSchema, 'users');