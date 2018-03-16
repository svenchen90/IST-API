var express = require('express');
var http = require('http');
var router = express.Router();

//MongoDB Connection
// var mongoose = require('mongoose');
// var models = require('../models/models');
// var POI = models.POI;
// mongoose.connect('mongodb://localhost/IST');

var test = require('../planner/test').test;

var polylineGear = require('../planner/polyline');
var polylineDecoder = polylineGear.PLDecoder;

var DBQuery = require('../planner/DBQuery');

var turf = require('@turf/turf');

// Google Client
/* var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyD1LCWyuLkzDMvyOYxBIvmjyBJsqLDnPA4'
}); */


// 1. Google Polyline Decoder
/* var polylineDecoder = function(polyline){
	var polylineDecoder = require('@mapbox/polyline');
	return polylineDecoder.decode(polyline);
}; */

// 2. Re-format Buffer for database query
/* var reformatBuffer = function(buffer){
	var cor_array = buffer.geometry.coordinates[0];
	var coordinates = [];
	for(var i=0; i<cor_array.length; i++){
		coordinates.push([parseFloat(cor_array[i][0]), parseFloat(cor_array[i][1])]);
	}
	return [coordinates];
}; */

// 2.1. Re-format POI result [lng, lat] to [lat, lng]
/* var reformatGeoGoogle = function(POIs){
	var result = [];
	for(var i=0; i< POIs.length; i++){
		var lng = POIs[i]['geo'][0];
		var lat = POIs[i]['geo'][1];
		POIs[i]['geo'] = [lat, lng];
		result.push(POIs[i]);
	}
	
	return result;
}; */

// 3. Get POI in Buffer
/* var getPOIInBuffer = function(coordinates){
	return new Promise(function(resolve, reject){
		POI.where('geo')
			.within({
					type: "Polygon",
					coordinates: coordinates
			})
			//.where('action')
			//.equals(your_action)
			//.skip(your_skip)
			.limit(1000)
			.exec(function(err, POIs) {
				if(err)
					reject(err);
				else{
					//console.log(POIs);
					resolve(POIs);
				}
			});
	});
}; */

// 4. Sort POI
var sortPOI = function(pois, preference){
	pois.sort(function(a, b) {
			return getWeight(b,preference) - getWeight(a,preference);
	});
};

// 4.1 get Weight of POI
var getWeight = function(poi, preference) {
	//average rates
	var rates = 0.0;
	var numRates = 0;
	for(var i = 0; i<poi.ratings.length; i++) {
		numRates += poi.ratings[i];
		rates += poi.ratings[i] * (5-i);
	}
		rates /= numRates;
	
	//totalreview = 	totalreviews + numRates
	var totalNumberOfReview = poi.totalreviews + numRates;
	
	
	//preference point to percentage
	var preferPercentage = preferToPercentage(preference);
	
	//find key of prefer
	var preferKey = Object.keys(preferPercentage);
	var key = null;
	for(var i = 0; i<poi.genres.length; i++) {
		var n = -1;
		for(var j = 0; j<preferKey.length; j++) {
			n = poi.genres[i].search(new RegExp(preferKey[j], "i"));
			if(n != -1){
				key = preferKey[j];
				break;
			}
		}
		if(n != -1)
			break;
	}
	
	//return weight
	var weight = -1;
	if(key != null)
		if(rates >= 4.5)
			weight = totalNumberOfReview * 1 * preferPercentage[key];
		else if(rates >= 4)
			weight = totalNumberOfReview * 2/3 * preferPercentage[key];
		else if(rates >= 3.5)
			weight = totalNumberOfReview * 1/3 * preferPercentage[key];
		else
			weight = 0;
	else
		weight = 0;
	
	
	// poi.weight = weight;
	
	return weight;
};

// 4.1.1 Pre-formate preference to proportion
var preferToPercentage = function(preference) {
	var newPref = {};
	var sum = 0;
	Object.keys(preference).forEach(function(key) {
		sum += preference[key];
	});
	
	Object.keys(preference).forEach(function(key) {
		newPref[key] = preference[key] / sum;
	});
	return newPref;
};


// 5. make plan
/* var getWaypoints = function(duration, pois){
	var points = [];
	for(var i=0; i<pois.length && i<duration*3; i++){
		points.push({
			location: pois[i].geo[0] + ', ' +pois[i].geo[1]
		});
	}
	return points;
}; */

var getWaypoints_beta = function(poi_list, preference){
	var points = [];
	var numOfVisit= 3;
	for(var i=0; i<poi_list.length; i++){
		sortPOI(poi_list[i], preference);
		for(var j=0; j<3; j++){
			points.push({
				location:  poi_list[i][j]['geo'][0] + ', ' + poi_list[i][j]['geo'][1]
			});
		}
	};
	return points;
};

/* 
The purpose of this API is to make a decent trip plan for customer based on his/her preference.
The plan might not be the best, but one of the bests.

Scenario:
	1. Get all avaliable POIs along the path. The path should go through departure, POIs customer prefered, destination;
	2. Sort POIs based on customer's preference;
	3. Pick POIs and check the possiblity;
	4. Generate the planner with details
 */
router.get('/itripsmarty-api-alpha', function(req, res, next){
	var defaultOrigin = '69 7th Ave S New York, NY 10014',
		defaultDestination = '160 Convent Ave New York, NY 10031',
		defaultRange = 1;
	
	var routerequest = {
		origin: req.query.origin ? req.query.origin : defaultOrigin,
		destination: req.query.destination ? req.query.destination : defaultDestination,
		waypoints: [
			 // [ 40.724987, -74.10292 ]
		],
		mode: 'driving',
		optimize: true
	}
	
	// Make the directions request
	googleMapsClient.directions(routerequest, function(unknown, result) {
		// 1. Get Buffer
		var polylinePoints = polylineDecoder(result.json.routes[0].overview_polyline.points);
		var buffered, lineArr = [], pointArr = [];

		for (var i = 0; i < polylinePoints.length; i++) {
			pointArr.push(turf.point([polylinePoints[i][1], polylinePoints[i][0]]));
			lineArr.push([polylinePoints[i][1], polylinePoints[i][0]]);
		}
		
		var linestring = turf.lineString(lineArr);
		buffered = turf.buffer(linestring, req.query.range ? req.query.range: defaultRange, "miles");
		
		var range = req.query.range;
		var wholeSize = lineArr.length;
		var clusterSize = Math.ceil(wholeSize/req.query.duration);
		var clusterIndex = 1;
		var promisePool = [];
		while(clusterIndex * clusterSize - wholeSize <= clusterSize){
			var subLineArr = lineArr.slice((clusterIndex-1)*clusterSize, clusterIndex*clusterSize);
			var linestring = turf.lineString(subLineArr);
			var bufferDatabase = reformatBuffer(turf.buffer(linestring, range, "miles"));
			promisePool.push(getPOIInBuffer(bufferDatabase));
			clusterIndex ++ ;
		}
		Promise.all(promisePool)
			.then(function(result){
				var POI_rare = []
				for(var i=0; i<result.length; i++){
					POI_rare = POI_rare.concat(result[i]);
				}
				var POIs = reformatGeoGoogle(POI_rare);
				sortPOI(POIs, req.query.preference);
				res.json(
					{
						route: result.json,
						buffer: buffered,
						pois: POIs,
						waypoints: getWaypoints_beta(result, req.query.preference),
						others: bufferDatabase
					}
				);
			})
			.catch(function(exception){
				console.log(exception);
				res.json(
					{
						route: result.json,
						buffer: buffered,
						pois: [],
						waypoints: [],
						others: bufferDatabase
					}
				);
			});
		
		
		// 2. Re-format Buffer
		/* var bufferDatabase = reformatBuffer(buffered);

		
		getPOIInBuffer(bufferDatabase)
			.then(function(result){
				var POIs = reformatGeoGoogle(result);
				sortPOI(POIs, req.query.preference);
				res.json(
					{
						route: result.json,
						buffer: buffered,
						pois: POIs,
						waypoints: getWaypoints(req.query.duration, POIs),
						others: bufferDatabase
					}
				);
			})
			.catch(function(exception){
				console.log(exception);
				res.json(
					{
						route: result.json,
						buffer: buffered,
						pois: [],
						waypoints: [],
						others: bufferDatabase
					}
				);
			}); */
		
	});
});


router.route('/test_mine')
	.get(function(req, res, next){
		//console.log(req.query);
		res.render('ui-api',{});
	});



/* router.get('/testgooglejscall', function(req, res, next){
	var options = {
			host: 'road.li',
			port: 80,
			path: '/?start=San%20Jose%2C%20CA%2C%20United%20States&end=San%20Francisco%2C%20CA%2C%20United%20States&via=attraction'
	};
	
	http.get(options, function(resp){
		resp.on('data', function(chunk){
			res.json(chunk);
		});
	}).on("error", function(e){
		console.log("Got error: " + e.message);
	});
}); */

module.exports = router;
