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

/* // 4.1 get Weight of POI
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
}; */

exports.sortPOI= sortPOI_Alpha;