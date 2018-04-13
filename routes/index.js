var express = require('express');
var http = require('http');
var router = express.Router();

var test = require('../planner/test').test;
var planAgent = require('../planner/plan-agent').planAgent;
var turf = require('@turf/turf');

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
			/* 'Hayward, CA',
			'Fremont, CA', */
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

router.route('/test')
	.get(function(req, res, next){
		//console.log(req.query);
		res.render('test',{});
	});

router.route('/test2')
	.get(function(req, res, next){
		require('../planner_beta/route-planner').getRoute('San Diego, CA', 'Los Angeles, CA', [/* 'Calsbad, CA', 'Santa Barbara, CA' */])
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
