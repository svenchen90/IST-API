const LEFT_NAV = ['select-city', 'select-date', 'input-traveler', 'select-preference', 'get-hotel', 'get-food', 'get-itinerary', 'get-weather'];
const INPUT_BLOCK_ID = LEFT_NAV.map(function(item){
	return '#' + item;
});
var disable_list = [2,5,7];

var enableFollow = function(nav_name, len=1){
	var index = LEFT_NAV.indexOf(nav_name);
	while(len != 0 && index + 1 < LEFT_NAV.length){
		index += 1;
		len -= 1;
		if(!disable_list.includes(index))
			$('[data-action="' + LEFT_NAV[index] + '"]').removeClass('disabled');
	}
};

var disableAllFollow = function(nav_name){
	var index = LEFT_NAV.indexOf(nav_name) + 1;
	for(; index<LEFT_NAV.length;index ++){
		$('[data-action="' + LEFT_NAV[index] + '"]').addClass('disabled');
	}
};

$('.left-nav').on('click', '[data-action]:not(.disabled)', function(){
	var action_type = $(this).attr('data-action');

	$(INPUT_BLOCK_ID.join(', ')).css({
		'display': 'none'
	});
	
	$(INPUT_BLOCK_ID[LEFT_NAV.indexOf(action_type)]).css({'display': 'block'})

	$(this).siblings().removeClass('active');
	$(this).addClass('active');
});

var form = {};
var current_trip;
// 1. select-city
var initialCitySelection = function(form){
	var completionCheck = function(){
		if(form.origin == '' || form.origin == undefined  || form.destination == '' || form.destination == undefined)
			return false;
		else
			return true;
	};
	
	var completionCallback = function(){
		if(completionCheck()){
			enableFollow('select-city');
		}else{
			disableAllFollow('select-city');
		}
	};
	
	var geocoder1 = new MapboxGeocoder({
		accessToken: mapboxgl.accessToken
	});
	$('#select-city #origin').append(geocoder1.onAdd(map));
	var geocoder2 = new MapboxGeocoder({
		accessToken: mapboxgl.accessToken
	});
	$('#select-city #destination').append(geocoder2.onAdd(map));
	
	
	$('#select-city #origin input, #select-city #destination input').on('change', function(e){
		var key = $(this).closest('[data-container]').attr('id');
		var value = $(this).val();
		form[key] = value;
		completionCallback();
	});

	$('.geocoder-icon-close').on('click', function(e){
		var id = $(this).closest('#origin, #destination').attr('id');
		form[id] = '';
		completionCallback();
	});
};

// 2. select-date 
var initialDateSelection = function(form){
	var completionCheck = function(){
		if(form.start == '' || form.start == undefined  || form.end == '' || form.end == undefined)
			return false;
		else
			return true;
	};
	
	var validation = function(){
		// var current_time = new Date().getTime();
		var start_time = new Date(form.start).getTime()
		var end_time = new Date(form.end).getTime()
		if(start_time >= end_time)
			return false;
		else
			return true;

	};
	
	var completionCallback = function(){
		if(completionCheck() && validation()){
			enableFollow('select-date', 2);
		}else{
			disableAllFollow('select-date');
		}
	};
	
	var $calendar = $('#calendar');
	var setRange = function(dates, language = 'en', $container = $('#calendar-top')){
		var getMonthName = function(date) {
			const monthNames = ["January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"
			];
			
			return monthNames[date.getMonth()];
		};
		
		var getWeekday = function(date) {
			const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
			return weekdayNames[date.getDay()];
		}
		
		var updateDateField = function(date, start_or_end) {
			var $html;
			if(date == ''){
				$html = $(
					'<span class="' + start_or_end + '"><span>' + start_or_end + '</span></span>\n'
				);
			}else{
				$html = $(
					'<div class="left">\n' +
					'	<span class="day">' + date.getDate() + '</span>\n' +
					'</div>\n' +
					'<div class="right">\n' +
					'	<span class="order"><span>' + start_or_end + '</span></span>\n' +
					'	<span class="weekday">' + getWeekday(date) + '</span>\n' +
					'	<span class="month">' + getMonthName(date) + '/' + date.getFullYear() + '</span>\n' +
					'</div>\n'
				);
			}
			
			$container.find('.' + start_or_end + '-date')
				.empty()
				.append($html);
		}
		
		dates.sort(function(d1, d2){
			return d1.getTime() >= d2.getTime();
		});
		
		if(dates.length == 0){
			updateDateField('', 'start');
			updateDateField('', 'end');
		}else if(dates.length == 1){
			updateDateField(dates[0], 'start');
			updateDateField('', 'end');
		}else if(dates.length == 2){
			updateDateField(dates[0], 'start');
			updateDateField(dates[1], 'end');
		}else{
			console.log('error');
		}
	};
	
	var setCalendarRangeView = function($container = $calendar){
		var dates = $container.datepicker('getDates');
		dates.sort(function(d1, d2){
			return d1.getTime() >= d2.getTime();
		});
		if(dates.length < 2){
			$container.find('.day.range').removeClass('range');
		}else if(dates.length == 2){
			var start_datetime = dates[0].getTime();
			var end_datetime = dates[1].getTime();
			$container.find('.day').each(function(index, day){
				var dt = $(day).attr('data-date');
				if(start_datetime < dt && end_datetime > dt)
					$(this).addClass('range');
			});
		}else{
			console.log('error');
		}
	};
	
	$calendar.datepicker({
		// language: 'zh-CN'
		multidate: true
	}).on('changeDate', function(e) {
		var dates = $(this).datepicker('getDates');
		var d = $(this).datepicker('getDate');
		
		if(dates.length > 2){
			$calendar.datepicker('update', d);
		}
		dates = $(this).datepicker('getDates');
		setRange(dates);
		setCalendarRangeView();
		
		var DateToYYYYMMDD = function(d){
			var year = d.getFullYear();
			var month = d.getMonth()+1;
			month = month < 10 ? '0' + month : month;
			var day = d.getDate();
			day = day <10 ? '0' + day : day;
			
			
			return year + '-' + month + '-' + day;
		};
		
		// set form
		if(dates.length == 0){
			form.start = '';
			form.end = '';
		}else if(dates.length == 1){
			form.start = DateToYYYYMMDD(dates[0]);
			form.end = '';
		}else if (dates.length == 2){
			form.start = DateToYYYYMMDD(dates[0]);
			form.end = DateToYYYYMMDD(dates[1]);
		}else{
			// console.log(1);
		};
		
		completionCallback();
	});
};

// 3. select-preference
var intialPreferenceSelection = function(form){
	var completionCallback = function(){
		enableFollow('select-date', 4);
	};

	$("#pace").slider({ id: "pace_bar", min: 0, max: 10, value: 5 });
	$("#nature").slider({ id: "nature_bar", min: 0, max: 10, value: 5 });
	$("#culture").slider({ id: "culture_bar", min: 0, max: 10, value: 5 });
	$("#amusement").slider({ id: "amusement_bar", min: 0, max: 10, value: 5 });
	$("#shopping").slider({ id: "shopping_bar", min: 0, max: 10, value: 5 });
	$("#nightlife").slider({ id: "nightlife_bar", min: 0, max: 10, value: 5 });
	
	form.preference = {
		'nature': 5,
		'culture': 5,
		'amusement': 5,
		'shopping': 5,
		'nightlife': 5
	}
	
	// console.log(11);
	$('#select-preference').on('change', '[data-container] input', function(e){
		var key = $(this).attr('id');
		var value = parseInt($(this).val());
		form.preference[key] = value;
		// console.log(form.preference)
		getPieChart('#donut-chart', form.preference);
	});
	
	$('#select-preference').on('click', '[data-action="submit"]', function(e){
		form.waypoints = []
		var $btn = $(this);
		$btn.addClass('disabled');
		
		$('.loader, .loader-bg').css({'display': 'block'});
		
		$.ajax({
			url : '/generate-trip',
			data: form,
			type : "GET",
			dataType : 'json',
			success : function (result){
				current_trip = result;
				// console.log(form);
				// console.log(result);
				initializeRouteLayer(map, 
					[{route: result.path.coordinates}]
				);
				
				initializePOILayer(map, result.solution);
				// console.log(result);
				/*
				initializeBufferLayer(map, 
					result.buffer.map(function(b){
						return {points: b}
					})
				);
				*/
				
				
				$(INPUT_BLOCK_ID[3]).css({'display': 'none'});
				$('[data-action="' + LEFT_NAV[3] + '"]').removeClass('active');							
				$('[data-action="' + LEFT_NAV[6] + '"]').addClass('active').removeClass('disabled');							
				$(INPUT_BLOCK_ID[6]).css({'display': 'block'});							
				
				loadItinerary(result);
				completionCallback();
				
				$btn.remove();
				
				map.fitBounds(result.bounds,{
						padding: {top: 100, bottom:50, left: 600, right: 50}
					}
				)
				bindMaker_Static(map)
				// map.moveLayer('buffer', 'route')
				// console.log(result);
			},
			error: function(err){
				console.log('error');
			}
		}).done(function() {
			//console.log();
			})
			.fail(function() {
			//console.log('fail')
			})
			.always(function() {
			$('.loader, .loader-bg').css({'display': 'none'});
			});
	});
};

var linkInternaryAndMark = function(){
	$('#map').on('click', '.marker', function(){
		var _id = $(this).attr('data-id');
		$('#get-itinerary').animate({
			scrollTop: $('#get-itinerary [data-id="' + _id + '"]').position().top
		}, 2000);
		
		$('#map .marker').removeClass('active');
		$(this)
			.addClass('active')
			.siblings().removeClass('active');
			
			loadPOIInfo(_id);
	});
	
	$('#map').on('click', ':not(.marker)' ,function(){
		$('#map .marker').removeClass('active');
	});
	
	
	/* $('#get-itinerary').on('click', 'li[data-id]', function(){
		var _id = $(this).attr('data-id');
		$('#map .marker').removeClass('active');
		var $marker = $('#map .marker[data-id="' + _id + '"]')
		
		$marker.addClass('active');
		map.flyTo({
			center: [
				$marker.attr('data-lng'),
				$marker.attr('data-lat')
			],
			zoom: 12,
			speed: 0.8,
			curve: 1,
		});
		
		loadPOIInfo();
		
	}); */
};

var loadItinerary = function(data, $container = $('#get-itinerary')) {	
	$container.on('click', '[data-action]', function(e){
		var actionType = $(this).attr('data-action');
		if(actionType == 'share') {
			var url = DOMIAN_URL + "/trip?_id=" + data._id;
			callQRCode(url);
		}else if(actionType == 'save') {
			getItineraryPDF(data);
		}
	});
	
	var $summary = $container.find('.summary');
	$summary.find('[data-type="origin"]').html(data.origin.address);
	$summary.find('[data-type="destination"]').html(data.destination.address);
	$summary.find('[data-type="startDate"]').html(DateToMMDDYY(new Date(data.start_date))); // getDuration(data.start_date, data.end_date)
	$summary.find('[data-type="endDate"]').html(DateToMMDDYY(new Date(data.end_date))); // getDuration(data.start_date, data.end_date)
	$summary.find('[data-type="time"]').html(Math.ceil(data.duration/3600));
	$summary.find('[data-type="poi"]').html(data.solution.length);
	$summary.find('[data-type="mile"]').html(Math.ceil(data.distance/1600));
	
	getPieChart('#donut-chart2', data.preference, true, 0, true)
	
	var getPOICard = function(data) {
		// console.log(data);

		var $card = $(
			'<li class="theme-bg-blue" data-id="' + data._id + '">\n' +
			'	<i class="fa fa-university"></i>\n' +
			'	<div class="timeline-item">\n' +
			'		<!-- <span class="time"><i class="fa fa-clock-o"></i> 12:05</span> -->\n' +
			'		<h3 class="timeline-header"><a href="#"><i class="fa fa-university"></i> ' + data.name + '</a></h3>\n' +
			'		<div class="timeline-body">\n' +
			'			<div class="poster">\n' +
			'				<img src="' + data.poster + '" alt="...">\n' +
			'			</div>\n' +
			'			<!-- <div class="details">\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-building-o"></i> Description: </span>\n' +
			'					<div class="text">\n' +
			'						' + (data.description ? data.description : 'N/A') + '\n' +
			'					</div>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-table"></i> Rates: </span>\n' +
			'					<div class="text" style="color: gold;">\n' +
			'						' + getRatesText(getRates(data.ratings)) + '\n' +						
			'					</div>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-location-arrow"></i> Address: </span>\n' +
			'					<div class="text">\n' +
			'						' + data.address + '\n' +
			'					</div>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-child"></i> Length of Visit: </span>\n' +
			'					<div class="text">\n' +
			'						 ' + data.length_visit + '\n' +
			'					</div>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-globe"></i> Website: </span>\n' +
			'					<div class="text">\n' +
			'						 ' + data.website + '\n' +
			'					</div>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-calendar-times-o"></i> Hours: </span>\n' +
			'					<div class="text">\n' +
			'						 ' + data.hours + '\n' +
			'					</div>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-phone"></i> Phone: </span>\n' +
			'					<div class="text">\n' +
			'						 ' + data.phone + '\n' +
			'					</div>\n' +
			'				</div>\n' +
			'			</div> -->\n' +
			'		</div>\n' +
			'		<!-- <div class="timeline-footer">\n' +
			'			<a class="btn btn-primary btn-xs">Read more</a>\n' +
			'			<a class="btn btn-danger btn-xs">Delete</a>\n' +
			'		</div> -->\n' +
			'	</div>\n' +
			'</li>\n'
		);
		
		$card.on('click', function(){
			var _id = $(this).attr('data-id');
			$('#map .marker').removeClass('active');
			var $marker = $('#map .marker[data-id="' + _id + '"]')
			
			$marker.addClass('active');
			map.flyTo({
				center: [
					$marker.attr('data-lng'),
					$marker.attr('data-lat')
				],
				zoom: 12,
				speed: 0.8,
				curve: 1,
			});
			
			loadPOIInfo(_id);
			
		});
		
		return $card;
	};
	
	var getRouteCard = function(data) {
		var $card = $(
			'<li class="theme-bg-maroon">\n' +
			'	<i class="fa fa-road"></i>\n' +
			'	<div class="timeline-item">\n' +
			'		<!-- <span class="time" style="color: white;"><i class="fa fa-clock-o"></i> 12:05</span> -->\n' +
			'		<h3 class="timeline-header"><a href="#"><i class="fa fa-road"></i></a></h3>\n' +
			'		<div class="timeline-body">\n' +
			'			<div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-circle-o"></i> Start: </span>\n' +
			'					<span class="text">\n' +
			'						' + data.origin.address + '\n' +
			'					</span>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span  class="label"><i class="fa fa-map-pin"></i> End: </span>\n' +
			'					<span class="text">\n' +
			'						' + data.destination.address + '\n' +
			'					</span>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-table"></i> Time Cost: </span>\n' +
			'					<span class="text">\n' +
			'						' + secondToHourMinute(data.duration) + '\n' +
			'					</span>\n' +
			'				</div>\n' +
			'				<div class="detail-block">\n' +
			'					<span class="label"><i class="fa fa-car"></i> Distance: </span>\n' +
			'					<span class="text">\n' +
			'						' + meterToMile(data.distance) + ' miles\n' +
			'					</span>\n' +
			'				</div>\n' +
			'		</div>\n' +
			'		</div>\n' +
			'	</div>\n' +
			'</li>\n'
		);
		return $card;
	};
	
	var getDayCard = function(date, index) {
		var getRandomInt =  function(max) {
			return Math.floor(Math.random() * Math.floor(max));
		}
		
		var randomTheme = function(){
			var themes = ['bg-blue','bg-navy','bg-teal','bg-olive','bg-lime','bg-orange','bg-fuchsia','bg-purple','bg-maroon'];
			return themes[getRandomInt(themes.length)];
		};
		
		var getDate = function(start_date, index) {
			var getMonthName_Short = function(date) {
				const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
					"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
				];
				
				return monthNames[date.getMonth()];
			};
			
			var date = new Date(start_date);
			var next_day = new Date(date.getTime() + (index+1) * (24 * 60 * 60 * 1000));

			return next_day.getDate() + ' ' + getMonthName_Short(next_day) + '. ' + next_day.getFullYear();
		};
		
		return $(
			'<li class="time-label">\n' +
			'	<span class="' + randomTheme() + '">\n' +
			'		' + getDate(date, index) + '\n' +
			'	</span>\n' +
			'</li>\n'
		);
	};
	
	var $ul = $container.find('ul');
	data.itinerary.forEach(function(list, index){
		var $day_card = getDayCard(data.start_date, index);
		$ul.append($day_card);
			// console.log(index);
		list.forEach(function(item, index2){
			// console.log(item);
			var $card;
			if(item['_type'] == 'route'){
				$card = getRouteCard(item);
			}else if(item['_type'] == 'poi'){
				$card = getPOICard(item);
			}
			$ul.append($card);
		});
	});
	
	$ul.append(
		'<li>\n' +
		'	<i class="fa fa-clock-o bg-gray"></i>\n' +
		'</li>\n'
	);
};

/* initial */
var map = initializeMapbox('map', 'streets', [-98.2093396778871, 39.61233583451258], 4);
map.on('load', function(){
	/*
	map.on('render', function(e){
		delay(function(){
			bindMaker(map);
		}, 50);
	});
	*/
});
initialCitySelection(form);
initialDateSelection(form);
intialPreferenceSelection(form);
linkInternaryAndMark();

// $('[data-action="' + LEFT_NAV[0] + '"]').removeClass('disabled');
// $(INPUT_BLOCK_ID[0]).css({'display': 'block'});
$('[data-action="' + LEFT_NAV[4] + '"]').removeClass('disabled');
$(INPUT_BLOCK_ID[4]).css({'display': 'block'});

map.on('contextmenu', function(e){
	console.log(map.getZoom());
	console.log(map.getCenter());
	/*
	console.log(form);
	
	var test_data = { preference:
		 { nature: '3',
		 culture: '3',
		 amusement: '3',
		 shopping: '3',
		 nightlife: '3' },
		origin: 'San Diego, California, United States',
		destination: 'Los Angeles, California, United States',
		start: '2018-06-15',
		end: '2018-06-17' }
		*/
});

map.on('click', function(e){
	// console.log(current_trip);
});
/* ! initial */