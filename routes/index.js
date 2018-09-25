var express = require('express');
var http = require('http');
var router = express.Router();

var test = require('../planner/test').test;
var planAgent = require('../planner/plan-agent').planAgent;
var turf = require('@turf/turf');

var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyD1LCWyuLkzDMvyOYxBIvmjyBJsqLDnPA4'
});

var models = require('../models/models');
var Route_Temp = models.Route_Temp;
var POI = models.POI;
var User = models.User;

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
	planAgent({
		origin: 'San Diego, CA',
		destination: 'Los Angeles, CA',
		//destination: 'Los Angeles, CA',
		waypoints: [
			[35.80949, -117.91897]
		],
	}).then(function(result){
		res.json(result);
	}).catch(function(exception){
		console.log(exception);
	});
	
	/* // Make the directions request
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
	});
	 */
});


router.route('/test_mine')
	.get(function(req, res, next){
		//console.log(req.query);
		res.render('ui-api',{});
	});

/* router.route('/test')
	.get(function(req, res, next){
		res.render('test',{});
	}); */

router.route('/test2')
	.get(function(req, res, next){
		require('../planner_beta/route-planner').getRoute_alpha('San Diego, CA', 'Los Angeles, CA', [/* {lng: -117.01129200000003, lat:32.75344799999999, abc:11} *//* 'Santa Barbara, CA', 'Calsbad, CA' */])
			.then(function(result){
				var promisePool = [];
				//var BywayPromisePool = [];
				// 
				
				var line = turf.lineString(result.overview_path);
				var chunk = turf.lineChunk(line, 100, {units: 'miles'});
				var buffers = chunk.features.map(function(item){
					var buffer = require('../planner_beta/route-planner').getBuffer(item.geometry.coordinates, 20);
					promisePool.push(require('../planner_beta/route-planner').getPOI(buffer));
					// BywayPromisePool.push(require('../planner_beta/route-planner').getByway(buffer));
					return buffer;
				});
				
				result.buffer = require('../planner_beta/route-planner').getBuffer(result.overview_path, 20)
				promisePool.push(require('../planner_beta/route-planner').getByway(result.buffer));
				/* result.sub_route.forEach(function(sub_route, index){
					sub_route.buffer = require('../planner_beta/route-planner').getBuffer(sub_route.sub_overview_path, 20);
					//console.log(index, sub_route.sub_overview_path[0], sub_route.sub_overview_path[sub_route.sub_overview_path.length-1])
					promisePool.push(require('../planner_beta/route-planner').getPOI(sub_route.buffer));
				}); */
				Promise.all(promisePool)
					.then(function(poi_list){
						result.poi_list = Array.prototype.concat.apply([], poi_list.slice(0, poi_list.length-1)); 
						result.poi_list.forEach(function(poi){
							require('../planner_beta/route-planner').signWeightToPOI(poi, 
								{
									NATURE: 1,
									CULTURE: 2,
									AMUSEMENT: 3,
									SHOPPING: 4,
									NIGHTLIFE: 5
								}
							)
							
							require('../planner_beta/route-planner').signTimeCostToPOI(poi, result.overview_path, 60);
						});
						result.poi_list = require('../planner_beta/route-planner').getPools(result.poi_list);
						
						try{
							var matrix = require('../planner_beta/route-planner').backpackAlgorithm(result.poi_list.primary.map(function(item, index){
								return {
									id: index,
									value: Math.ceil(item.weight.total_weight),
									cost: Math.ceil(item.time_cost.cost)
								};
							}), 40);
							
							result.matrix = matrix;
							result.solution = matrix.solutionMatrix[matrix.solutionMatrix.length-1]
								[matrix.solutionMatrix[matrix.solutionMatrix.length-1].length-1].map(function(item){
								return result.poi_list.primary[item];
							});
							result.solution.sort(function(a,b){
								return a.time_cost.location - b.time_cost.location; 
							});
							result.solution = result.solution.map(function(item){
								return {
									dist: item.time_cost.dist,
									cost: item.time_cost.cost,
									location: item.time_cost.location
								}
							});
							var scheduleBuffer = [];
							result.solution.forEach(function(item,index){
								if(index == 0){
									scheduleBuffer.push(item.location/60);
									scheduleBuffer.push(item.cost);
								}else{
									scheduleBuffer.push((item.location-result.solution[index-1].location)/60);
									scheduleBuffer.push(item.cost);
								}
								scheduleBuffer.push(1);
							});
							result.scheduleBuffer = scheduleBuffer;
							
							result.schedule = require('../planner_beta/route-planner').sliceScheduling(scheduleBuffer, 5);
						}catch(e){
							console.log(e);
						}
						
						
						result.byway_list = poi_list[poi_list.length-1];
						res.json(result);
					})
					.catch(function(exception){
						res.json(exception);
					});
				/* result.sub_route.forEach(function(sub_route){
					sub_route.buffer = require('../planner_beta/route-planner').getBuffer(sub_route.sub_overview_path, 20);
				});
				res.json(result); */
				
			})
			.catch(function(exception){
				console.log('error', exception)
				res.json(exception);
			});
	});

router.route('/test3')
	.get(function(req, res, next){
		//console.log(req.query);
		res.render('test3',{});
	});

router.route('/test4')
	.get(function(req, res, next){
		try{
			require('../planner_beta/route-planner').getRoute({
				origin: {lng: -117.1611, lat:32.7157, name: 'San Diego, CA'}, //'San Diego, CA', 
				destination: {lng: -118.2437, lat:34.0522, name: 'Los Angeles, CA'}, //'Los Angeles, CA',
				waypoints: [
					// {lng: -117.01129200000003, lat:32.75344799999999, _id: 1}
				]
				// departure_time: Date | number,
				// arrival_time: Date | number,
			}).then(function(result){
				res.json(result);
			}).catch(function(exception){
				console.log('error', exception);
				res.json(exception);
			});
		}catch(e){
			console.log(e);
		}
	});
	

router.route('/test6')
	.get(function(req, res, next){
		//console.log(req.query);
		res.render('test6',{});
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



	

	
router.route('/get-trip-by-id')
	.get(function(req, res, next){
		Route_Temp.findOne({_id : req.query._id})
			.exec(function(err, result){
				// console.log(result);
				res.json(result);
			});
	});


router.route('/test-google')
	.get(function(req, res, next){
		googleMapsClient.directions(
			{
				origin: 'San Diego, CA',
				destination: 'Los Angeles, CA',
			}
			, function(err, result){
			if(err)
				res.json(err);
			res.json(result);
			
		});

	});
	

router.route('/get-poi-by-id')
	.get(function(req, res, next){
		POI.findById(req.query.id, function (err, poi) {
			if (err) return handleError(err);
			res.json(poi);
		});
	});

router.route('/trip')
	.get(function(req, res, next){
		//console.log(req.query);
		if(req.device.type == 'desktop') {
			res.render('trip-share', {});
		}else {
			res.render('mobile/trip-share', {});
		}
	});

router.route('/generate-trip')
	.get(function(req, res, next){
		try{
			//console.log(req.query);
			req.query.waypoints = [];
			req.query.departure_date = req.query.start;
			req.query.arrival_date = req.query.end;
			require('../planner_beta/route-planner').planner(
				req.query
			/* {
				origin: 'New York, NY', //'San Diego, CA', 
				destination: 'Chicago, IL', //'Los Angeles, CA',
				waypoints: [],
				departure_date: '2018-05-20',
				arrival_date: '2018-05-28',
				preference: {
					NATURE: 1,
					CULTURE: 2,
					AMUSEMENT: 3,
					SHOPPING: 4,
					NIGHTLIFE: 5
				}
			} */
			).then(function(result){
				//console.log(req.query);
				if(req.user){
					// console.log(req.query.start, req.query.end);
					new Route_Temp({
						_userId: req.user.id,
						origin:  result.origin,
						destination: result.destination,
						start_date: req.query.start,
						end_date: req.query.end,
						path: result.path,
						distance: result.distance,
						duration: result.duration,
						itinerary: result.itinerary,
						solution: result.solution,
						bounds: result.bounds,
						preference: result.preference
					}).save(function(err){
						if (err) return handleError(err);
						User.findById(req.user.id, function (err, user) {
							if (err) return handleError(err);
							
							user.travel_miles = user.travel_miles + result.distance;
							
							result.solution.forEach(function(item, index){
								var temp = item.address.split(',');
								var city = temp[temp.length-2].trim();
								var country = 'USA';
								
								if(!user.travel_countries.includes(country)) {
									user.travel_countries.push(country);
								}
								if(!user.travel_cities.includes(city)) {
									user.travel_cities.push(city);
								}
								
								user.travel_POIs = user.travel_POIs.map(function(item, index){
									return String(item);
								});
								
								if(!user.travel_POIs.includes(item._id)) {
									user.travel_POIs.push(item._id);
								}
							});												
							user.save(function (err, updatedUser) {
								if (err) return handleError(err);
								// console.log(updatedUser);
								// res.send(updatedTank);
							});
						});
					});
				}
				// Route_Temp.remove({}, function(){});
				res.json(result);
			}).catch(function(exception){
				console.log('error', exception);
				res.json(exception);
			});
		}catch(e){
			console.log(e);
		}
	});
	
router.route('/')
	.get(function(req, res, next){
		res.render('index',{});
	});

router.route('/user-main')
	.get(function(req, res, next){
		//console.log(req.query);
		res.render('user-main',{});
	});	

router.route('/update-user-profile')
	.post(function(req, res, next){
		console.log(req.body);
		User.update({ _id: req.user.id }, { $set: req.body}, function(err, user){
			if (err) return handleError(err);
			res.json(1);
		});
	});

router.route('/update-user-password')
	.post(function(req, res, next){
		console.log(req.body);
		User.findOne({ _id: req.user.id, password: req.body.current_password }, function (err, user) {
			if(user){
				user.password = req.body.new_password;
				user.save(function (err, updatedUser) {
					if (err) return handleError(err);
					res.json(1);
				});
			}else{
				var err_msg = {};
				err_msg.currentPassword = 1
				res.json(err_msg);
			}
    });
	});	
	
router.route('/get-user-routes')
	.get(function(req, res, next){
		Route_Temp.find({_userId: req.user.id})
			.exec(function(err, result){
				// console.log(result);
				res.json(result);
			});
	});
	
router.route('/signup')
	.post(function(req, res, next){
		var user_data = req.body;
		user_data.date_create = new Date();
		
		User.findOne({ email: user_data.email }, function (err, user) {
			if(user){
				var err_msg = {};
				err_msg.email = 'Email exists!'
				res.json(err_msg);
			}else{
				user_data.travel_miles = 0;
				user_data.travel_countries = [];
				user_data.travel_cities = [];
				user_data.travel_POIs = [];
				user_data.status = 0;
				
				new User(user_data).save(function (err) {
					if (err) return handleError(err);
					res.json(1);
				});
			}
    });
	});


router.route('/validateEmail')
	.post(function(req, res, next){
		User.findOne({ email: req.body.email }, function (err, user) {
			if(user){
				res.json(0);
			}else{
				res.json(1);
			}
    });
	});

router.route('/email')
	.get(function(req, res, next){
			var emailAddressValidation = require('../routes/email').emailAddressValidation;
			emailAddressValidation(
				'svenchen90@gmail.com',
				'208.59.145.29',
				function(err){console.log(err)},
				function(info){console.log(info)}
			);
	});	
	
// google place
var NearBySearch = require('../planner_beta/agents/google-place').NearBySearch;
var ImageFetch = require('../planner_beta/agents/google-place').ImageFetch;
var PlaceDetailsRequest = require('../planner_beta/agents/google-place').PlaceDetailsRequest;
router.route('/place')
	.get(function(req, res, next){
			var parameters = {
					location: [req.query.lat, req.query.lng],
					type: req.query.type,
					radius: req.query.distance,
					// keyword: "doctor",
					// rankby: 'distance'
			};
			
			NearBySearch(parameters, function (error, response) {
					if (error) throw error;
					res.json(response);
					//assert.notEqual(response.results.length, 0, "Place search must not return 0 results");
			});
	});	
	
router.route('/google-place-photo')
	.get(function(req, res, next){
			// console.log(req.query.ref);
			var parameters = {
				photoreference: req.query.ref,
				sensor: false
			};

			ImageFetch(parameters, function (error, response) {
				if (error) throw error;
				res.json(response);
			});
	});	
	
router.route('/google-place-detail')
	.get(function(req, res, next){
			var parameters = {
					reference: req.query.ref
			};
		
			PlaceDetailsRequest(parameters, function (error, response) {
					if (error) throw error;
					res.json(response);
			});
	});	


// test
router.route('/test')
	.get(function(req, res, next){
		//console.log(req.query);
		res.render('test-console',{});
	});
	
module.exports = router;

