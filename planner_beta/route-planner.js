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

var getBuffer = function(polyline, radius, unit="mile") {
	
};

var getPOI = function(buffer, limit=100) {
	// promise
	// return lean
};

var getByway = function(buffer) {
	// promise
	// return lean
};

var getWeightOfPOI = function(POI, preference) {
	
};

var getCostOfPOI = function(POI, route) {
	
};

var getCostOfByway = function(POI, route) {
	
};

var getPools = function(POIs, byway) {
	// return {primary: [], secondary: []} divide by limit and ratio
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
		solutionMatrix: valueMatrix,
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
	var meanLoad = Math.ceil(total/day);
	
	var currentLoad = 0;
	list.forEach(function(item, index){
		// ratio
		if(currentLoad + item <= meanLoad){
			currentLoad += item;
		}else{
			if(index%2 == 0){
				schedule.push(meanLoad);
				currentLoad = item + currentLoad - meanLoad;
			}else{
				schedule.push(currentLoad);
				currentLoad = item;
			}
		}
	});
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

exports.getRoute = getRoute