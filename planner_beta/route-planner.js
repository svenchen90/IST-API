/*
step 1, by google API, get route between origin and destination
step 2, calculate the vacancy and decide buffer radius
step 3, divide route into sub routes, query POI in sub-buffer (popular), calculate weight based on preference. 
	signitured POI should sign with outstanding weight, for example 1000 * originWeight
step 4, filter POI into two pool, primary, secondary {and no-cost}. primary and secondary by weight/(time cost). {no-cost means time cost is negligible.} 
	Time cost = extra traveling + length of visit.
step 5, use 01 backpack soluction to find several outstanding solution for each day. 
* step 6, use GA to optimize on those solution. (mutation and crossover)
step 7, checked feasiblity over results. If yes, done. If no, back to 01 backpack.
*/
const COORDINATE_FORMAT = 'lnglat';
var turf = require('@turf/turf');

/* Mongo */
try{
	var mongoose = require('mongoose');
	mongoose.connect('mongodb://localhost/IST');
	var models = require('../models/models');
	var POI = models.POI;
	var Byway = models.Byway;
}catch(e){
	console.log(e);
}
/* ! Mongo */

var getRoute = function(origin, destination, waypoints, agent="GOOGLE", mode='DRIVING', geoFormat=COORDINATE_FORMAT){
	// Promise
	/* 
	return {
		steps: [route],
		originResult: result
	}
	 */
	console.log(origin, destination, waypoints, agent, mode);
	return new Promise(function(resolve, reject){
		switch(agent){
			case 'GOOGLE':
				var routeRequest = {
					origin: geoCoder(origin),
					destination: geoCoder(destination),
					waypoints: waypoints.map(function(item){
						return geoCoder(item);
					}),
					mode: mode.toLowerCase(),
					optimize: true
				};
				
				require('../planner_beta/agents/google').googleMapsClient.directions(routeRequest, function(err, result){
					if(err){
						reject('google agent error')
					}else{
						var route = result.json.routes[0];
						var data = {
							bounds: [route.bounds['southwest'], route.bounds['northeast']],
							/* bounds: Object.keys(route.bounds).map(function(key){
								if(geoFormat == 'lnglat')
									return [route.bounds[key]['lng'], route.bounds[key]['lat']];
								else if(geoFormat == 'latlng')
									return [route.bounds[key]['lat'], route.bounds[key]['lng']];
							}), */
							overview_path: polylineDecoder(route.overview_polyline.points),
							waypoint_order: route.waypoint_order,
							sub_route: route.legs.map(function(item){
								/* item.sub_overview_path = '';
								item.steps.forEach(function(step){
									//console.log(polylineDecoder(step.polyline.points))
									item.sub_overview_path += step.polyline.points;
								});
								console.log(item.sub_overview_path);
								item.sub_overview_path = polylineDecoder(route.overview_polyline.points); */
								return item;
							})
						};

						resolve(data);
					}
				});
				break;
			default:
				reject('error - unknow route agent ' + agent);
		}
	});
};

var geoCoder = function(string) {
	return string;
};

var getBuffer = function(polyline, radius, unit="miles") {
	var line = turf.lineString(polyline);
	var buffered = turf.buffer(line, radius, {units: unit});	
	
	return buffered.geometry.coordinates;
};

var getPOI = function(buffer, limit=100) {
	// promise
	// return lean
	return new Promise(function(resolve, reject){
		POI
			.where('geo')
			.within({
					type: "Polygon",
					coordinates: buffer
			})
			//.where('action')
			//.equals(your_action)
			//.skip(your_skip)
			.limit(limit)
			.lean()
			.exec(function(err, POIs) {
				if(err)
					reject(err);
				else{
					resolve(POIs);
				}
			});
	});
};

var getByway = function(buffer, limit=100) {
		// promise
	// return lean
	return new Promise(function(resolve, reject){
		Byway
			.where('ll')
			.within({
					type: "Polygon",
					coordinates: buffer
			})
			//.where('action')
			//.equals(your_action)
			//.skip(your_skip)
			.limit(limit)
			.lean()
			.exec(function(err, POIs) {
				if(err)
					reject(err);
				else{
					POIs.forEach(function(poi){
						poi.path = polylineDecoder(poi.path)
					});
					resolve(POIs);
				}
			});
	});
	
	
	
};

/* Calcucate weight  */
var signWeightToPOI = function(POI, preference, act_fun=square) {
	POI.weight = {
		fitting_weight: act_fun(getFittingWeight(POI, preference)),
		pop_weight: act_fun(getPopularityWeight(POI)),
	}
	
	// expoential function
	POI.weight.total_weight = act_fun(POI.weight.fitting_weight * POI.weight.pop_weight);
/* 	if(POI.weight.fitting_weight == undefined || POI.weight.pop_weight == undefined || POI.weight.total_weight == undefined)
		console.log('=======================') */
};

var sortPOI_Alpha = function(POIs, preference){
	// 1) Popularity Rank
	POIs.sort(function(a, b){
		return getPopularityWeight(b) - getPopularityWeight(a);
	});
	POIs.forEach(function(POI, index){
		POI.pop_rank = index+1;
	});
	
	// 2) Preference Rank
	var preference = preferToPercentage(preference);
	POIs.sort(function(a, b){
		return getFittingWeight(b, preference) - getFittingWeight(a, preference);
	});
	POIs.forEach(function(POI, index){
		POI.fitting_rank = index+1;
	});
	
	// 3) aggregation
	var alpha = 0.5;
	var beta = 0.5;
	POIs.sort(function(a, b){
		return (alpha * a.pop_rank + beta * a.fitting) - (alpha * b.pop_rank + beta * b.fitting);
	});
	return POIs
};

var getPopularityWeight = function(POI){
	var weight = {
		0: 3,
		1: 1,
		2: 0,
		3: -1,
		4: -3
	}
	var popularity = 0.0;
	
	POI.ratings.forEach(function(rate, index){
		popularity += rate * weight[index];
	});
	return popularity
};

var getFittingWeight = function(POI, preference){
	var fitting = 0;
	
	//Pre-formate preference to proportion
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
	
	preference = preferToPercentage(preference)
	Object.keys(preference).forEach(function(key){
		var contains = POI.genres.some(function(g){
			return g.search(new RegExp(key, "i")) > -1;
		});
		if(contains){
			fitting += preference[key];
		}
	});
	
	return fitting;
};
/* ! Calcucate weight  */

/* Calcucate time cost */
var signTimeCostToPOI = function(POI, route, speed){
	
	var line = turf.lineString(route);
	var pt = turf.point(POI.geo);
	
	var point = turf.nearestPointOnLine(line, pt, {units: 'miles'});
	
	POI.time_cost = {
		closest_point: point.geometry.coordinates,
		point_on: point.properties.index,
		dist: point.properties.dist,
		location: point.properties.location
	};
	// POI lenth of visit
	POI.time_cost.cost = POI.time_cost.dist * 2 / speed + 2;
};

var getCostOfByway = function(POI, route) {
	
};
/* Calcucate time cost */

var getPools = function(POIs, byway, ratio=0.3, minimal=20, maximum=100){
	sortPOI(POIs);
	var length_primary = Math.floor(POIs.length*ratio);
	var split_index = 0;
	if(length_primary<minimal){
		split_index = minimal;
	}else if(length_primary > maximum){
		split_index = maximum;
	}else{
		split_index = length_primary;
	}
	
	return {
		primary: POIs.slice(0, split_index),
		secondary: POIs.slice(split_index)
	}
};

var sortPOI = function(POIs){
	POIs.sort(function(a,b){
		return b.weight.total_weight / b.time_cost.cost - a.weight.total_weight / a.time_cost.cost;
	});
};

var backpackAlgorithm = function(list, capacity) {
	// list: [{id, value, cost}]
	// return {total value matrix, solution matrix}
	// total value: f(i, j) = max(f(i-1, j), f(i-1, j-cost(i)) + value(i))
	// sequence: s(i, j) = {...}
	
	// initialize matrix
	var valueMatrix = [];
	var solutionMatrix = [];
	for(var i=0;i<=list.length;i++){
		valueMatrix.push([]);
		solutionMatrix.push([]);
		for(var j=0;j<=capacity;j++){
			valueMatrix[i].push(0);
			solutionMatrix[i].push([]);
		}
	}

	
	// DP
	for(var j=1; j<=capacity; j++){
		for(var i=1; i<=list.length; i++){
			var value_i = list[i-1]['value'];
			var cost_i = list[i-1]['cost'];
			var id_i = list[i-1]['id'];
			
			var contains_i = j-cost_i>=0 ? valueMatrix[i-1][j-cost_i] + value_i : -1;
			var not_contains_i = valueMatrix[i-1][j];
			
			valueMatrix[i][j] = Math.max(contains_i, not_contains_i);
			
			if(not_contains_i > contains_i){
				solutionMatrix[i][j] = solutionMatrix[i-1][j].slice();
			}else{
				var temp = solutionMatrix[i-1][j-cost_i].slice();
				temp.push(id_i)
				solutionMatrix[i][j] = temp;
			}
		}
	}
	
	return {
		valueMatrix: valueMatrix,
		solutionMatrix: solutionMatrix
	}
};

/*
var greedyScheduling = function(list, days) {
	// list {}
}; 
*/

var sliceScheduling = function(list, days) {
	var schedule = [];
	var total = 0.0;
	list.forEach(function(i){
		total += i;
	});
	var meanLoad = Math.ceil(total/days);
	
	var currentLoad = 0;
	var currentSchedule_load = [];
	var currentSchedule_index = [];
	list.forEach(function(item, index){
		// ratio
		if(currentLoad + item <= meanLoad){
			currentLoad += item;
			currentSchedule_load.push(item);
			currentSchedule_index.push(index);
		}else{
			if(index%2 == 0){
				// schedule.push(meanLoad);
				currentSchedule_load.push(meanLoad - currentLoad);
				// schedule.push(currentSchedule_load);
				currentLoad = item + currentLoad - meanLoad;
				currentSchedule_load = [item + currentLoad - meanLoad]
				
				currentSchedule_index.push(index);
				schedule.push(currentSchedule_index);
				currentSchedule_index = [index];
			}else{
				// schedule.push(currentSchedule_load);
				currentLoad = item;
				currentSchedule_load = [item];
				schedule.push(currentSchedule_index);
				currentSchedule_index = [index];
				
			}
		}
	});
	return schedule
};

// Utility
/* Polyline */
var polylineDecoder = function(polyline, geoFormat=COORDINATE_FORMAT){
	if(!polylineValidation(polyline))
		polyline = polylineReformat(polyline)
	
	return require('@mapbox/polyline').decode(polyline).map(function(item){
		// [lng, lat]
		if(geoFormat == 'lnglat')
			return [item[1], item[0]];
		else if(geoFormat == 'lnglat')
			return item;
		else{
			console.log('geo format error');
			return;	
		}
	});
};

var polylineValidation = function(polyline){
	return false;
};

var polylineReformat = function(polyline){
	//return polyline.replace('\\\\', '\\');
	return polyline.replace(/\\\\/g, "\\");
};
/* ! Polyline */

/* Math */
var square = function(number){
	return Math.pow(number, 2)
};
/* ! Math */

exports.getRoute = getRoute;
exports.getBuffer = getBuffer;
exports.getPOI = getPOI;
exports.getByway = getByway;
exports.signWeightToPOI = signWeightToPOI;
exports.signTimeCostToPOI = signTimeCostToPOI;
exports.getPools = getPools;
exports.backpackAlgorithm = backpackAlgorithm;
exports.sliceScheduling = sliceScheduling;
