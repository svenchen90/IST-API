// 1 Reformat Turf buffer to database polygon
var reformatBuffer = function(buffer){
	var coordinates = buffer.geometry.coordinates[0].map(function(point){
		return [parseFloat(point[0]), parseFloat(point[1])]
	});
	
	return [coordinates];
};

// 2. Reformat POI result [lng, lat] to [lat, lng]
//  MongoDB: [lng, lat]
//	Google/Mapbox: [lat, lng]
var reformatGeoGoogle = function(POIs){
	var result = [];
	for(var i=0; i< POIs.length; i++){
		var lng = POIs[i]['geo'][0];
		var lat = POIs[i]['geo'][1];
		POIs[i]['geo'] = [lat, lng];
		result.push(POIs[i]);
	}
	
	return result;
};