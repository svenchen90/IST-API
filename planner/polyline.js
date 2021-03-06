var turf = require('@turf/turf');

var PLDivider = function(list, splitBy){
	var map = [];
	list.forEach(function(note,index){
		if(index == 0)
			map.push(0);
		else{
			var distance = function(p1, p2){
				var a = p1[0] - p2[0];
				var b = p1[1] - p2 [1];
				return Math.sqrt( a*a + b*b );
			};
			var ds = distance(list[index-1], list[index]);
			map.push(map[index-1] + ds);
		}
			
	});
	
	var clusterLenght = map[map.length-1] / splitBy;
	var ds = clusterLenght;
	var DVPoints = [];
	map.forEach(function(length, index){
		if(length >= ds){
			DVPoints.push(index);
			ds += clusterLenght;
		}
	});
	
	var last = DVPoints.pop();
	if(last != list.length-1)
		last = list.length-1;
	DVPoints.push(last);
	
	var result = [];
	var s_index = 0;
	DVPoints.forEach(function(item, index){
		result.push(list.slice(s_index, item+1));
		s_index = item;
	});
	
	return result;
};

var PLDecoder = function(polyline){
	var MBDecoder = require('@mapbox/polyline');
	if(!PLValidation(polyline))
		polyline = PLReformat(polyline)
	
	return MBDecoder.decode(polyline).map(function(item){
		// [lng, lat]
		return [item[1], item[0]]
	});
};

var PLValidation = function(polyline){
	return true;
};

var PLReformat = function(polyline){
	//return polyline.replace('\\\\', '\\');
	return polyline.replace(/\\\\/g, "\\");
};

var polylineToBuffer = function(polyline, radius){
	var polylinePoints;
	if(typeof polyline == 'string')
		polylinePoints = PLDecoder(polyline);
	else
		polylinePoints = polyline;
	
	var line = turf.lineString(polylinePoints);
	var buffered = turf.buffer(line, radius, {units: 'miles'});	
	
	return buffered.geometry.coordinates;
};

exports.PLDivider = PLDivider;
exports.PLDecoder = PLDecoder;
exports.PLReformat = PLReformat;
exports.polylineToBuffer = polylineToBuffer;