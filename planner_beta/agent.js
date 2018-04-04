/*
step 1, by google API, get route between origin and destination
step 2, calculate the vacancy and decide buffer radius
step 3, divide route into sub routes, query POI in sub-buffer (popular), calculate weight based on preference. 
	signitured POI should sign with outstanding weight, for example 1000 * originWeight
step 4, filter POI into 3 pool, first, secound and no-cost. First and second by weight/(time cost). no-cost means time cost is negligible. 
	Time cost = extra traveling + length of visit.
step 5, use 01 backpack soluction to find several outstanding solution. 
* step 6, use GA to optimize on those solution. (mutation and crossover)
step 7, checked feasiblity over results. If yes, done. If no, back to 01 backpack.
*/

// Promise
// mode = ['DRIVE']
var getRoute = function(origin, desitination, waypoints, mode = 'DRIVE'){
	
};

// mode = [POINTS, ENCODED_PATH]
var getBuffer = function(polyline, type="POINTS") {
	
};