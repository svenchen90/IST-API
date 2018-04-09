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

// Route
var initializeRouteLayer = function(map, data, id='route'){
	if(map.getSource(id) != undefined){
		map.removeSource(id);
	}
	//steps: [route: [points], start: String, end: '',  distance: float(mile), duration: float(hour), speed: float(miles/hour)]
	
	map.addSource(id, {
		type: "geojson",
		data: {
			"type": "FeatureCollection",
			"features": data.map(function(step){
				return formateRoute(step);
			})
		}
	});
	
	map.addLayer({
		"id": id,
		"type": "line",
		"source": id,
		"layout": {
			"line-join": "round",
			"line-cap": "round"
		},
		"paint": {
			"line-color": randomColor(),
			"line-width": 3
		}
	});
};

var addRoute = function(map, route, id='route'){
	if(map.getSource(id) == undefined){
		initializeRouteLayer(map, [route], id);
	}else{
		var source = map.getSource(id);
		var sData = source._data;
		sData.features.push(formateRoute(route));
		source.setData(sData)
	};
};

var clearRoute = function(map, id='route'){
	var source = map.getSource(id);
	var sData = source._data;
	sData.features = []
	source.setData(sData);
};

var formateRoute = function(route){
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

// POI
var initializePOILayer = function(map, data, id="POI"){
	if(map.getSource(id) != undefined){
		map.removeSource(id);
	}
	
	map.addSource(id, {
		type: "geojson",
		data: {
			"type": "FeatureCollection",
			"features": data.map(function(point){
				return formatePOI(point)
			})
		},
		cluster: true,
		clusterMaxZoom: 12,
		clusterRadius: 50
	});
	
	map.addLayer({
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
	});
	
	map.addLayer({
		id: "cluster-" + id,
		type: "symbol",
		source: id,
		filter: ["has", "point_count"],
		layout: {
			"text-field": "{point_count_abbreviated}",
			"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
			"text-size": 12
		}
	});
	
	map.addLayer({
		id: "unclustered-" + id,
		type: "circle",
		source: id,
		filter: ["!has", "point_count"],
		paint: {
			"circle-color": "#11b4da",
			"circle-radius": [
				"interpolate", ["linear"], ["zoom"],
				// zoom is 5 (or less) -> circle radius will be 1px
				5, 5,
				// zoom is 10 (or greater) -> circle radius will be 5px
				15, 10
			],
			"circle-stroke-width": 2,
			"circle-stroke-color": "#fff"
		}
	});
};

var addPOI = function(map, POI, id="POI"){
	if(map.getSource(id) == undefined){
		initializePOI(map, [POI], id);
	}else{
		var source = map.getSource(id);
		var sData = source._data;
		sData.features.push(formatePOI(POI));
		source.setData(sData)
	}
};

var clearPOI = function(map,id="POI"){
	var source = map.getSource(id);
	var sData = source._data;
	sData.features = []
	source.setData(sData);
};

var formatePOI = function(POI){
	return {
		"type": "Feature",
		"geometry": {
			"type": "Point",
			"coordinates": POI.geo
		},
		"properties": {
			"name": POI.name,
			// "icon": "monument",
		}
	}
};

// Buffer
var initializeBufferLayer = function(map, data, id="buffer"){
	if(map.getSource(id) != undefined){
		map.removeSource(id);
	}

	map.addSource(id, {
		type: "geojson",
		data: {
			"type": "FeatureCollection",
			"features": data.map(function(buffer){
				return formateBuffer(buffer);
			})
		}
	});
	
	map.addLayer({
		'id': id,
		'type': 'fill',
		'source': id,
		'layout': {},
		'paint': {
			'fill-color': '#088',
			'fill-opacity': 0.3
		}
	});
};

var addBuffer = function(map, buffer, id="buffer"){
	if(map.getSource(id) == undefined){
		initializePOI(map, [buffer], id);
	}else{
		var source = map.getSource(id);
		var sData = source._data;
		sData.features.push(formateBuffer(buffer));
		source.setData(sData)
	}
};

var clearBuffer = function(map,id="buffer"){
	var source = map.getSource(id);
	var sData = source._data;
	sData.features = []
	source.setData(sData);
};

var formateBuffer = function(buffer){
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

// Marker
var addMarker = function(map, data){
	var el = document.createElement('div');
	el.className = 'marker';
	el.style.backgroundImage = 'url(' + data.img + ')';
	
	new mapboxgl.Marker(el)
		.setLngLat(data.geo)
		.addTo(map);
};

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

(function(){
	console.log('loading mapbox');
	
	
		
		
	console.log('! loading mapbox');
})();
