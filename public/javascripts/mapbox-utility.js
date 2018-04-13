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
var initializeRouteLayer = function(map, data, id='route', color="#4285F4", lineWidth=10){
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
			"line-color": color,
			 "line-width": lineWidth,
			 "line-blur": 1,
			// "line-gap-width": 5
		}
	});
			
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
		clusterRadius: 40
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
			"circle-radius": 0
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
			'img': POI.poster
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

/* 
var addMarker = function(map, data){
	var size = 50
	var $marker = $(
		'<div class="marker" id="' + localIDGenerator() + '">' + data.count + '</div>'
	).css({
		'background-image': 'url(' + data.img + ')',
		'width': size + 'px',
		'height': size + 'px',
		'line-height': size + 'px'
	});
	
	var styleTag = $('<style>:root {--marker-ripple-size: ' + size + 'px !important;}</style>')
	$('html > head').append(styleTag);
	
	new mapboxgl.Marker($marker.get(0))
		.setLngLat(data.geo)
		.addTo(map);
};
 */
var addMarker = function(map, data, size=50){
	var $marker = $(
		'<div class="marker" id="' + localIDGenerator() + '">\n' +
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
		if(data.img)
			$marker.find('.icon')
				.css({'background-image': 'url(' + data.img + ')'});
		else
			$marker.find('.icon')
				.css({'background-color': 'rgba(255,255,255,1)'});
	}
	
	/* delay of hover effect  */
	$marker.on('mouseenter', function(e){
		$marker.addClass('hover');
	});
	
	$marker.on('mouseleave', function(e){
		delay(function(){
			$marker.removeClass('hover');
		}, 1000)
	});
	
	new mapboxgl.Marker($marker.get(0))
		.setLngLat(data.geo)
		.addTo(map);
};

var clearMarker = function($container) {
	$container.find('.marker').remove();
};

var removeMarkerByID = function($container, id){
	$container.find('#' + id).remove();
}

var bindMaker = function(map) {
	var features = map.queryRenderedFeatures({ layers: ['POI'] });
	clearMarker($('#map'));
	
	var iconSize = Math.max(Math.ceil(map.getZoom()*5), 30);
	features.forEach(function(item){
		//console.log(item)
		addMarker(map, {img: item.properties.img, geo: item.geometry.coordinates, count: item.properties.point_count_abbreviated}, iconSize);
	});
};

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

(function(){
	console.log('loading mapbox');
	
	
	console.log('! loading mapbox');
})();
