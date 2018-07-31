/*
step 1, by google API, get route between origin and destination
step 2, calculate the vacancy and decide buffer radius
step 3, divide route into sub routes, query POI in sub-buffer (popular), calculate weight based on preference. 
	signitured POI should sign with outstanding weight, for example 1000 * originWeight
step 4, filter POI into two pool, primary, secondary {and no-cost}. primary and secondary by weight/(time cost). {no-cost means time cost is negligible.} 
	Time cost = extra traveling + length of visit.
step 5, use 01 backpack solution to find several outstanding solution for each day. 
* step 6, use GA to optimize on those solution. (mutation and crossover)
step 7, checked feasiblity over results. If yes, done. If no, back to 01 backpack.
*/
const COORDINATE_FORMAT = 'lnglat';
const AGENT = 'google';

var googleMapsClient = require('../planner_beta/agents/google').googleMapsClient;

var turf = require('@turf/turf');

/* Mongo */
var POI, Byway, Route;
try{
	// var mongoose = require('mongoose');
	// mongoose.connect('mongodb://localhost/IST');
	var models = require('../models/models');
	POI = models.POI,
	Byway = models.Byway,
	Route = models.Route;
}catch(e){
	console.log(e);
}
/* ! Mongo */

/* 
new Route({
	id: 1,
	origin: {
		name: 'ori',
		geo: [-1312, 12312],
		address: 'origin, CA'
	},
	subRoute: [{
		origin: {
			name: 'ori',
			geo: [-1312, 12312],
			address: 'origin, CA'
		},
		steps: {
			htmlInstructions: '111111'
		}
	}] 
}).save(function(err){
	console.log(err);
}); */

/* data: {
	origin: string,
	destination: string,
	waypoints: []
	departure_date:
	arrival_date:
	preference: {
		
	}
} */
var planner = function(data, chunks_size = 50){
	return new Promise(function(resolve, reject){
		getRoute(data)
			.then(function(result){
				var duration_overall = Math.abs(new Date(data.arrival_date) - new Date(data.departure_date))/1000;
				var radius = getRadius(result.distance, duration_overall);
				
				var duration_day = duration_overall/24/60/60;
				/* var distance = result.distance/1600;
				var chunks_size = Math.ceil(distance/duration_day)/3; */
				
				var shrinkedPath = []
				result.path.coordinates.forEach(function(item, index){
					if(index%10 == 0)
						shrinkedPath.push(item);
				});
				
				var chunks = turf.lineChunk(turf.lineString(shrinkedPath), chunks_size, {units: 'miles'});
				var promisePool = [];
				
				var buffer_pool = [];
				var buffers = chunks.features.map(function(item){
					var buffer = getBuffer(item.geometry.coordinates, radius);
					
					buffer_pool.push(buffer);
					
					promisePool.push(getPOI(buffer));
					return buffer;
				});
				
				var buffer_overall = getBuffer(shrinkedPath, radius);
				promisePool.push(getByway(buffer_overall));
				
				Promise.all(promisePool)
					.then(function(list_poi_list){
						// console.log(poi_list );
						// resolve(result);
						byway_list = list_poi_list.pop();
						
						var poi_list = [];
						var poi_id_set = new Set() ;
						
						list_poi_list.forEach(function(list, index){
							// console.log(list.length);
							list.forEach(function(poi, index2){
								var id = String(poi._id);
								if(poi_id_set.has(id)){
									// console.log(id)
								}else{
									poi_id_set.add(id);
									poi.zoon = index;
									poi_list.push(poi);
								}
							});
						});
						
						poi_list.forEach(function(poi){
							signWeightToPOI(poi, data.preference);
							var speed = (result.distance/1600) / (result.duration/3600);
							signTimeCostToPOI(poi, result.path.coordinates, speed);
						});
						
						
						poi_list.forEach(function(item){
							// console.log(item.zoon);
						});
						
						poi_list = getPools(poi_list);
						
						// console.log('###' + poi_list.primary.length);
						// console.log('###' + poi_list.secondary.length);
						
						
						
						
						// console.log(poi_list.primary);
						try{
							var matrix = backpackAlgorithm(poi_list.primary.map(function(item, index){
								return {
									id: index,
									value: Math.ceil(item.weight.total_weight),
									cost: Math.ceil(item.time_cost.cost)
								};
							}), getActivityTime(duration_overall, result.duration));
							
							// result.poi = poi_list;
							// result.matrix = matrix;
							
							list_solution_id = matrix.solutionMatrix[matrix.solutionMatrix.length-1][matrix.solutionMatrix[matrix.solutionMatrix.length-1].length - 1]
							solution = list_solution_id.map(function(index, item){
								// console.log(poi_list.primary[item]._id);
								return poi_list.primary[item];
							});
							
							
							
							getRoute({
								origin: data.origin, //'San Diego, CA', 
								destination: data.destination, //'Los Angeles, CA',
								waypoints: solution.map(function(item){
									return {lng: item.geo[0], lat: item.geo[1]}
								})
								/* [
									{lng: -117.01129200000003, lat:32.75344799999999, _id: 1}
								] */
								// departure_time: Date | number,
								// arrival_time: Date | number,
							}).then(function(result2){
								result2.poi = poi_list.primary.map(function(item){
									if(item.zoon == 0)
										return item;
								});
								result2.solution = result2.waypoints_order.map(function(item){
									return solution[item];
								});
								result2.buffer = buffer_pool;
								
								var list_s = []
								result2.subRoute.forEach(function(r, i){
									if(i != result2.subRoute.length - 1){
										// #####
										list_s.push(2);
									}
									list_s.push(Math.ceil(r.duration/3600));
									
								});
								
								
								// schedule = sliceScheduling(list_s, duration_day);
								schedule = adaptiveScheduling(list_s, duration_day);
								console.log(list_s.length);
								itinerary = getItinerary(schedule, result2.subRoute, result2.solution)
								
								result2.schedule = schedule;
								result2.itinerary = itinerary;
								
								resolve(result2);
							})
							.catch(function(exception2){
								reject(exception)
							});
							
							
							// ####
							// result.matrix = matrix;
							/* result.solution = matrix.solutionMatrix[matrix.solutionMatrix.length-1]
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
							
							result.schedule = require('../planner_beta/route-planner').sliceScheduling(scheduleBuffer, 5); */
						}catch(e){
							console.log(e);
						}
						
						// result.byway_list = poi_list[poi_list.length-1];
					})
					.catch(function(exception){
						reject(exception)
					});
				
				// resolve(result);
			})
			.catch(function(exception){
				reject(exception)
			});
	});
};

var getRoute = function(data, agent=AGENT, mode='driving', coordinate_format=COORDINATE_FORMAT, geo_code=false){
	/* google data: {
		origin: {lat: , lng: , name:}, 
		destination: {lat: , lng: ,name:},
		waypoints: [
			string / {lat: , lng: , id:}
		],
		* departure_time: Date | number,
		* arrival_time: Date | number,
	} */
	return new Promise(function(resolve, reject){
		switch(agent){
			case 'google':
				var request = {
					origin: data.origin,
					destination: data.destination,
					waypoints: data.waypoints.map(function(item){
						return {lat: item.lat, lng: item.lng}
					}),
					mode: mode.toLowerCase(),
					optimize: true
				};
				googleMapsClient.directions(request, function(err, result){
					if(err){
						reject('#error - google agent')
					}else{
						// console.log(result);
						// ###
						var formated = googleRouteFormat(result, data);
						resolve(formated);
					}
				});
				break;
			default:
				reject('###error - unknow route agent ' + agent);
		}
	});
};

var googleRouteFormat = function(routeResult, originData){
	try{
		var result = {
		
		};
		
		var route = routeResult.json.routes[0];
		// origin
		result.origin = {
			id: originData.origin.id,
			name: originData.origin.name,
			geo: [route.legs[0].start_location.lng, route.legs[0].start_location.lat],
			address: route.legs[0].start_address
		};
		// destination
		result.destination = {
			id: originData.destination.id,
			name: originData.destination.name,
			geo: [route.legs[route.legs.length-1].end_location.lng, route.legs[route.legs.length-1].end_location.lat],
			address: route.legs[route.legs.length-1].end_address
		};
		// waypoints
		result.waypoints = [];
		result.waypoints_order = route.waypoint_order;
		route.waypoint_order.forEach(function(value, index){
			var point = {
				id: originData.waypoints[value].id,
				name: originData.waypoints[value].name,
				geo: [route.legs[index].end_location.lng, route.legs[index].end_location.lat],
				address: route.legs[index].end_address
			};
			result.waypoints.push(point);
		});
		// path
		result.path = {
			encodedPath: route.overview_polyline.points,
			coordinates: polylineDecoder(route.overview_polyline.points)
		};
		// distance
		result.distance = 0;
		// duration
		result.duration = 0;
		route.legs.forEach(function(item, index){
			result.distance += item.distance.value;
			result.duration += item.duration.value;
		});
		// subRoute
		result.subRoute = [];
		route.legs.forEach(function(item, index){
			var sub = {
				
			};
			// origin
			if(index == 0){
				sub.origin = Object.assign({}, result.origin);
			}else{
				sub.origin = Object.assign({}, result.waypoints[index-1]);
			}
			// destination
			if(index == route.legs.length-1){
				sub.destination = Object.assign({}, result.destination);
			}else{
				sub.destination = Object.assign({}, result.waypoints[index]);
			}
			// distance: Number,
			sub.distance = item.distance.value;
			// duration: Number,
			sub.duration = item.duration.value;
			// steps: [TravelSchema]
			sub.steps = [];
			item.steps.forEach(function(item2, index2){
				var s = {
					
				};
				// start_location: [Number]
				s.start_location = [item2.start_location.lng, item2.start_location.lat];
				// end_location: [Number]
				s.end_location = [item2.end_location.lng, item2.end_location.lat];
				// distance: Number
				s.distance = item2.distance.value;
				// duration: Number
				s.duration = item2.duration.value;
				// path: PathSchema,
				s.path = {
					coordinates: polylineDecoder(item2.polyline.points),
					encodedPath: item2.polyline.points
				};
				// travelMode: String,
				s.travel_mode = item2.travel_mode;
				s.html_instructions = item2.html_instructions;
				
				sub.steps.push(s);
			});
			// path: PathSchema,
			// ! Uncompleted
			sub.path = {
				coordinates: [],
				// encodedPath: String
			};
			sub.steps.forEach(function(item3, index3){
				var s_path = item3.path.coordinates;
				if(index3 == sub.steps.length-1){
					sub.path.coordinates = sub.path.coordinates.concat(s_path);
				}else{
					sub.path.coordinates = sub.path.coordinates.concat(s_path.slice(1, s_path.length-1));
				}
			});
			sub.path.encodedPath = polylineEncoder(sub.path.coordinates);
		
			result.subRoute.push(sub);
		});
		// bounds
		result.bounds = [route.bounds.southwest, route.bounds.northeast];
		
		return result;
	}catch(exception){
		console.log(exception);
	}
};

var getRoute_alpha = function(origin, destination, waypoints, agent="GOOGLE", mode='DRIVING', geoFormat=COORDINATE_FORMAT){
	/* 
	return {
		steps: [route],
		originResult: result
	}
	 */
	// console.log(origin, destination, waypoints, agent, mode);
	
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
				
				//console.log(routeRequest)
				
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
									item.sub_overview_path += step.polyline.points;
								});
								console.log(item.sub_overview_path);
								item.sub_overview_path = polylineDecoder(route.overview_polyline.points); */
								item.steps.forEach(function(s){
									s.polyline_points = polylineDecoder(s.polyline.points);
								});
								return item;
							}),
							origin: result
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
						if(Array.isArray(poi.path)){
							poi.path = poi.path.map(function(item){
								return polylineDecoder(item)
							});
						}else
							poi.path = polylineDecoder(poi.path)
					});
					resolve(POIs);
				}
			});
	});
};

var getRadius = function(distance, duration){
	return Math.ceil(30*duration / distance);
};

var getActivityTime = function(duration_overall, duration_driving, pace=0.8){
	return (duration_overall / 2  - duration_driving) / 3600 * pace;
};

var signWeightToPOI_adaptive = function(list_poi, preference, act_fun=linear){
	list_poi.forEach(function(poi, index){
		
	});
};

/* Calcucate weight  */
var signWeightToPOI = function(POI, preference, act_fun=linear) {
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
/* ! Calcucate time cost */

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
	console.log(days);
	var meanLoad = total/days;
	
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

var adaptiveScheduling = function(list, days){
	var total = 0.0;
	list.forEach(function(i){
		total += i;
	});
	var meanLoad = total/days;
	
	var split = []
	var left = 0.0;
	var index = -1;
	for(var i=1; i< days; i++){
		var current_index = index + 1;
		while(current_index<list.length){
			var current_length = list[current_index];
			if(left + current_length < meanLoad*i){
				left = left + current_length;
				current_index += 1;
			}else{
				split.push(current_index);
				index = current_index-1;
				break;
			}
		}
	};
	
	split.push(list.length);
	
	// ### optimize
	var schedule = [];
	var initial = 0;
	split.forEach(function(sp){
		var temp = [];
		for(var i=initial; i<sp; i++){
			temp.push(i);
		}
		schedule.push(temp);
		initial = sp;
		
	});
	
	return schedule;
};

var getItinerary = function(schedule, subRoute, pois){
	var itinerary = schedule.map(function(list, index){
		return list.map(function(item, index2){
			var item;
			if(item%2 == 0){
				item = subRoute[parseInt(item/2)];
				item['_type'] = 'route';
			}else{
				item = pois[parseInt(item/2)];
				item['_type'] = 'poi';
			}
			return item;
		});
	});
	
	return itinerary;
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
		else if(geoFormat == 'latlng')
			return item;
		else{
			console.log('geo format error');
			return;	
		}
	});
};

var polylineEncoder = function(coordinate, geoFormat=COORDINATE_FORMAT){
	return require('@mapbox/polyline').encode(coordinate);
};

var polylineValidation = function(polyline){
	return false;
};

var polylineReformat = function(polyline){
	try{
		return polyline.replace(/\\\\/g, "\\");
	}catch(exception){
		console.log(polyline);
	}
	
};
/* ! Polyline */

/* Math */
var square = function(number){
	return Math.pow(number, 2)
};

var linear = function(number){
	return number;
};

/* ! Math */

exports.planner = planner;
exports.getRoute = getRoute;
exports.getRoute_alpha = getRoute_alpha;
exports.getBuffer = getBuffer;
exports.getPOI = getPOI;
exports.getByway = getByway;
exports.signWeightToPOI = signWeightToPOI;
exports.signTimeCostToPOI = signTimeCostToPOI;
exports.getPools = getPools;
exports.backpackAlgorithm = backpackAlgorithm;
exports.sliceScheduling = sliceScheduling;
