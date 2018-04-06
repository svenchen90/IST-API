/*
step 1, by google API, get route between origin and destination
step 2, calculate the vacancy and decide buffer radius
step 3, divide route into sub routes, query POI in sub-buffer (popular), calculate weight based on preference. 
	signitured POI should sign with outstanding weight, for example 1000 * originWeight
step 4, filter POI into two pool, primary, secondary {and no-cost}. primary and secondary by weight/(time cost). {no-cost means time cost is negligible.} 
	Time cost = extra traveling + length of visit.
step 5, use 01 backpack soluction to find several outstanding solution. 
* step 6, use GA to optimize on those solution. (mutation and crossover)
step 7, checked feasiblity over results. If yes, done. If no, back to 01 backpack.
*/

var getRoute = function(origin, desitination, waypoints, agent="GOOGLE", mode = 'DRIVE'){
	// Promise
	// Return {route: [points], distance: float(mile), duration: float(hour), speed: float(miles/hour)}
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

