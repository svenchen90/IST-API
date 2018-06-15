/* $.getScript("https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.1/mapbox-gl.js", function() {
  alert("Script loaded but not necessarily executed.");
}); */

/* Map */
var initializeMapbox = function(container_id, style, coordinates, zoom){
	// style: [basic, streets, bright, light, dark, satellite]
	// coordinates: [lng, lat]
	mapboxgl.accessToken = 'pk.eyJ1Ijoic3ZlbmNoZW4iLCJhIjoiY2ludTBwc2k0MTFkaHRxa2pqZDFrenRxbSJ9.0df0NgCDfQSolkaLSmMIIg';
	return new mapboxgl.Map({
			container: container_id,
			style: 'mapbox://styles/mapbox/' + style + '-v9',
			center: coordinates,
			zoom: zoom
	});
};
/* ! Map */

/* Point */
var initializePointLayer = function(map, list, id, options){
	if(map.getSource(id) != undefined){
		throw id + ' source already exist!';
	}else if(map.getLayer(id) != undefined){
		throw id + ' layer already exist!';
	}else{
		try{
			var defaultOptions = {
				cluster: true,
				clusterMaxZoom: 12,
				clusterRadius: 40,
				"circle-radius": 0
			};
			$.extend( true, defaultOptions, options);
			
			map.addSource(id, {
				type: "geojson",
				data: {
					"type": "FeatureCollection",
					"features": list,
				},
				/*cluster: defaultOptions.cluster,
				clusterMaxZoom: defaultOptions.clusterMaxZoom,
				clusterRadius: defaultOptions.clusterRadius*/
			});
			
			/* map.addLayer({
				id: "clusters-bg",
				type: "circle",
				source: id,
				filter: ["has", "point_count"],
				paint: {
					// with three steps to implement three types of circles:
					//   * Blue, 20px circles when point count is less than 20
					//   * Yellow, 30px circles when point count is between 20 and 50
					//   * Pink, 40px circles when point count is greater than or equal to 50
					"circle-color": [
						"step",
						["get", "point_count"],
						"#ffffff",
						20,
						"#ffffff",
						50,
						"#ffffff"
					],
					"circle-radius": [
						"step",
						["get", "point_count"],
						15,
						20,
						20,
						50,
						30
					],
					"circle-stroke-width": 2,
					"circle-stroke-color": "#11b4da"
				}
			}); */
			
			map.addLayer({
				id: id,
				type: "circle",
				source: id,
				//	filter: ["has", "point_count"],
				paint: {
					"circle-radius": defaultOptions["circle-radius"]
				}
			});
			return id;
		}catch(e){
			throw 'error at initializePolylineLayer';
		}
	}
};
/* ! Point */

/* Polyline */
var initializePolylineLayer = function(map, list, id, options){
	if(map.getSource(id) != undefined){
		throw id + ' source already exist!';
	}else if(map.getLayer(id) != undefined){
		throw id + ' layer already exist!';
	}else{
		try{
			var defaultOptions = {
				"line-color": "#4285F4",
				"line-width": 3,
				"line-join": "round",
				"line-cap": "round",
				"line-blur": 1
			};
			$.extend( true, defaultOptions, options);
			
			map.addSource(id, {
				type: "geojson",
				data: {
					"type": "FeatureCollection",
					"features": list
				}
			});
			
			map.addLayer({
				"id": id,
				"type": "line",
				"source": id,
				"layout": {
					"line-join": defaultOptions["line-join"],
					"line-cap": defaultOptions["line-cap"]
				},
				"paint": {
					"line-color": defaultOptions["line-color"],
					 "line-width": defaultOptions["line-width"],
					 "line-blur": defaultOptions["line-blur"],
					// "line-gap-width": 5
				}
			});
			return id;
		}catch(e){
			throw 'error at initializePolylineLayer';
		}
	}
};
/* ! Polyline */

/* Polygon */
var initializePolygonLayer = function(map, list, id, options){
	if(map.getSource(id) != undefined){
		throw id + ' source already exist!';
	}else if(map.getLayer(id) != undefined){
		throw id + ' layer already exist!';
	}else{
		try{
			var defaultOptions = {
				'fill-color': '#088',
				'fill-opacity': 0.2
			};
			$.extend( true, defaultOptions, options);
			
			map.addSource(id, {
				type: "geojson",
				data: {
					"type": "FeatureCollection",
					"features": list,
				}
			});
			
			map.addLayer({
				'id': id,
				'type': 'fill',
				'source': id,
				'layout': {},
				'paint': {
					'fill-color': defaultOptions['fill-color'],
					'fill-opacity': defaultOptions['fill-opacity'],
				}
			});
			
			return id;
		}catch(e){
			throw 'error at initializePolylineLayer';
		}
	}
};
/* ! Polygon */
var addDataToLayer = function(map, list, id){
	if(map.getSource(id) == undefined){
		throw id + ' not exist!';
	}else{
		var source = map.getSource(id);
		var sData = source._data;
		sData.features = sData.features.concat(list);
		source.setData(sData);
		return source;
	};
};

var clearLayer = function(map,id){
	if(map.getSource(id) == undefined){
		throw id + ' not exist!';
	}else{
		var source = map.getSource(id);
		var sData = source._data;
		sData.features = [];
		source.setData(sData);
		return source;
	}
};


/* **************************************** */


/* Route */
/* route: {
	id: ,
	isScenic: boolean,
	details: {} // for Scenic,
	start_name: String,
	start_coordinates: [],
	end_name: String,
	end_coordinates: [],
	coordinates: [[lng, lat]],
	distance: Number(miles),
	duration: Number(hours),
	speed: Number(m/h)
} */
var formateRoute_ALPHA = function(route){
	return {
		"type": "Feature",
		"properties": {
			"start": route.start,
			"end": route.end,
			"distance": route.distance,
			"duration": route.duration,
			"speed": route.speed
		},
		"geometry": {
			"type": "LineString",
			"coordinates": route.route
		}
	}
};

var formateRoute = function(route){
	var result = {
		"type": "Feature",
		"properties": {
		},
		"geometry": {
			"type": "LineString",
			"coordinates": route.coordinates
		}
	};
	
	Object.keys(route).forEach(function(key){
		if(key != 'coordinates')
			result.properties[key] = route[key];
	});
	
	return result;
};

var initializeRouteLayer = function(map, list, options){
	var defaultOptions = {
		id: 'route',
		formateFunct: formateRoute_ALPHA,
		"line-color": "#4285F4",
		"line-width": 3
	};
	
	$.extend(true, defaultOptions, options);
	
	var data = list.map(function(r){
		return defaultOptions.formateFunct(r);
	});
	
	return initializePolylineLayer(map, data, defaultOptions.id, defaultOptions);

	/* var routePointer = new mapboxgl.Marker($('<div class="route-pointer"></div>').get(0))
		.setLngLat([1,1])
		.addTo(map);
	
	map.on('mousemove', function (e) {
		var features = map.queryRenderedFeatures(e.point, { layers: [id] });
		// UI indicator for clicking/hovering a point on the map
		// map.getCanvas().style.cursor = (features.length) ?  '' :'pointer';
		
		if(features.length){
			routePointer.setLngLat(e.lngLat);
			$('.route-pointer').removeClass('hide');
		}else{
			$('.route-pointer').addClass('hide');
		}
	}); */
};

var addRoute = function(map, list, id='route', formateFunct=formateRoute_ALPHA){
	return addDataToLayer(map, 
		list.map(function(i){
			return formateFunct(i);
		}),	
		id
	);
};

var clearRoute = function(map, id='route'){
	return clearLayer(map, id);
};
/* ! Route */

/* POI */
/* POI: {
	id: ,
	name: ,
	geo: [lng, lat],
	address: {type: String},
	genres: [String],
	poster: String,
	
	rates: [5,4,3,2,1],
	reviews: [{}],
	totalreviews: Number,
	
	hours: {type: String},
	length_visit: {type: String},
	phone: {type: String},
	website: {type: String},
	email: {type: String},
	
	description: {type: String},
	certification: {type: String},
	rank: [String],
}; */
var formatePOI_ALPHA = function(poi){
	return {
		"type": "Feature",
		"geometry": {
			"type": "Point",
			"coordinates": poi.geo
		},
		"properties": {
			"name": poi.name,
			'poster': poi.poster,
			'_id': poi._id
			// "icon": "monument",
		}
	}
};

var formatePOI = function(poi){
		var result = {
			"type": "Feature",
			"properties": {
			},
			"geometry": {
				"type": "Point",
				"coordinates": poi.geo
			}
		};
		
		Object.keys(poi).forEach(function(key){
			if(key != 'geo')
				result.properties[key] = poi[key];
		});
		
		return result;
};

var initializePOILayer = function(map, data, options){
	var defaultOptions = {
		id: 'POI',
		formateFunct: formatePOI_ALPHA
	};
	$.extend(true, defaultOptions, options);
	
	var list = data.map(function(poi){
		return defaultOptions.formateFunct(poi);
	});
	
	return initializePointLayer(map, list, defaultOptions.id, defaultOptions);
};

var addPOI = function(map, POI, id="POI", formateFunct=formatePOI_ALPHA){
	return addDataToLayer(map, 
		list.map(function(i){
			return formateFunct(i);
		}),	
		id
	);
};

var clearPOI = function(map,id="POI"){
	return clearLayer(map, id);
};
/* ! POI */


/* Buffer */
/* buffer: {
	id: ,
	points: [[[Number, Number]]]
} */
var formateBuffer_AlPHA = function(buffer){
	return {
		'type': 'Feature',
		'geometry': {
			'type': 'Polygon',
			'coordinates': buffer.points
		},
		"properties": {

		}
	}
};

var formateBuffer = function(buffer){
	
};

var initializeBufferLayer = function(map, data, options){
	var defaultOptions = {
		id: 'buffer',
		formateFunct: formateBuffer_AlPHA
	};
	$.extend(true, defaultOptions, options);
	
	var list = data.map(function(buffer){
		return defaultOptions.formateFunct(buffer);
	});
	
	return initializePolygonLayer(map, list, defaultOptions.id, defaultOptions);
};

var addBuffer = function(map, buffer, id="buffer", formateFunct=formateBuffer_AlPHA){
	return addDataToLayer(map, 
		list.map(function(i){
			return formateFunct(i);
		}),	
		id
	);
};

var clearBuffer = function(map,id="buffer"){
	return clearLayer(map, id);
};
/* ! Buffer */

/* Marker */
var addMarker = function(map, data, size=50){
	//var id = localIDGenerator();
	var $marker = $(
		'<div class="marker" data-id="' + data._id + '" data-lng="' + data.geo[0] + '" data-lat="' + data.geo[1] + '">\n' +
		' <div class="ripple"></div>\n' +
		' <div class="ripple delay-05"></div>\n' +
		' <div class="ripple delay-1"></div>\n' +
		' <div class="icon"></div>\n' +
		'</div>'
	).css({
		'width': size + 'px',
		'height': size + 'px',
		'line-height': size + 'px'
	});
	
	if(data.count){
		$marker.find('.icon')
			.addClass('cluster-icon')
			.text(data.count)
			.css({'font-family': 'Arial'});
	}else{
		if(data.poster)
			$marker.find('.icon')
				.css({'background-image': 'url(' + data.poster + ')'});
		else
			$marker.find('.icon')
				.css({'background-color': 'rgba(255,255,255,1)'});
	}
	
	/* delay of hover effect  */
	/*
	$marker.on('mouseenter', function(e){
		$marker.addClass('hover');
	});
	
	
	$marker.on('mouseleave', function(e){
		delay(function(){
			$marker.removeClass('hover');
		}, 1000)
	});
	*/
	
	
	return new mapboxgl.Marker($marker.get(0))
		.setLngLat(data.geo)
		.addTo(map);
};

var clearMarker = function(map) {
	$(map.getContainer()).find('.marker').remove();
};

var removeMarkerByID = function(map, id){
	$(map.getContainer()).find('.marker[data-id="' + id + '"]').remove();
};

var bindMaker = function(map, layers=['POI']) {
	var features = map.queryRenderedFeatures({ layers: layers});
	
	clearMarker(map);
	
	// ###
	var iconSize = Math.max(Math.ceil(map.getZoom()*5), 30);
	
	features.forEach(function(item){
		addMarker(map, {_id: item.properties._id, poster: item.properties.poster, geo: item.geometry.coordinates, count: item.properties.point_count_abbreviated}, iconSize);
	});
};

var bindMaker_Static = function(map, sources_id='POI') {
	var features = map.getSource(sources_id)._data.features
	
	clearMarker(map);
	
	// ###
	var iconSize = Math.max(Math.ceil(map.getZoom()*5), 30);
	
	features.forEach(function(item){
		addMarker(map, {_id: item.properties._id, poster: item.properties.poster, geo: item.geometry.coordinates, count: item.properties.point_count_abbreviated}, iconSize);
	});
};

/* ! Marker */


/* **************************************** */


// Tool
var randomHex = function(){
	var x = Math.floor((Math.random() * 15));
	var code = '0';
	switch(x){
		case 10:
			code = 'A';
			break;
		case 11:
			code = 'B';
			break;
		case 12:
			code = 'C';
			break;
		case 13:
			code = 'D';
			break;
		case 14:
			code = 'E';
			break;
		case 15:
			code = 'F';
			break;
		default:
			code = x.toString();
			break;
	};
	return code;
};

var randomColor = function(){
	var result = "#"
	for(var i=0; i<6; i++){
		result += randomHex();
	}
	return result;
};

var localIDGenerator = function () {
	return '_' + Math.random().toString(36).substr(2, 9);
};

var delay = (function(){
  var timer = 0;
  return function(callback, ms){
	clearTimeout (timer);
	timer = setTimeout(callback, ms);
  };
})();


/* **************************************** */


(function(){
	console.log('loading mapbox');
	
	
	console.log('! loading mapbox');
})();
