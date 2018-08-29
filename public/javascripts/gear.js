/* 1. 提示框 */
var callAlert = function(text, icon, callback){
	var html = $(
		'<div class="modal fade">\n' +
		'	<div class="modal-dialog" style="width: 150px; opacity: 0.6">\n' +
		'		<div class="modal-content">\n' +
		'			<div class="modal-body" style="padding: 0;  height: 150px; background-color: rgba(0,0,0,1);">\n' +
		'				<p style="color: rgba(255,255,255, 1); font-size: 16px; text-align: center;">' + text + '</p>\n' +
		'			</div>\n' +
		'		</div>\n' +
		'	</div>\n' +
		'</div>'
	);
	
	//加载图标
	var icon = $(icon).css({
		'margin-left': '25px',
		'font-size': '100px',
		'color': 'rgba(255,255,255, 1)'
	});
	html.find('.modal-body').prepend(icon);
	
	
	html.on('hidden.bs.modal', function(){
		$(this).remove();
	});
	
	html.modal('show');
	
	setTimeout(function(){
		html.modal('hide');
		callback();
	}, 1000);
};

/* 2. 确认框 */
var callConfirm = function(title, text, actionConfirm, actionCancel){
	$.confirm({
		title: title,
		content: text,
		buttons: {
			确定: function () {
				actionConfirm();
				/* callAlert('操作完成', 'done'); */
			},
			取消: function () {
				actionCancel();
			}
		}
	});
};


/* SIGN UP */
/* email验证 */
var validateEmail = function(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
};

/* password验证 */
var validatePassword = function(password) {
	var re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,20}$/;
	return re.test(password);
};

/* name验证 */
var validateName = function(name) {
	var re = /^[a-zA-Z]+$/;
	return re.test(name);
}

var errorMap = function(errorIndex, errorDict){
	var result = {};
	Object.keys(errorIndex).forEach(function(key, index){
		if(errorDict[key] != undefined) {
			result[key] = errorDict[key][errorIndex[key]];
		}else {
			console.log('error dictionary not sufficient!');
		}
	});
	
	return result;
};

var updateErrMsg = function(err_msg, $container){
	var flag = 0;
	for(var k in err_msg){
		if(err_msg[k] != '')
			flag ++;
		$container.find('[data-value="errorMsg"][data-target="' + k + '"]').html(err_msg[k]);
	}
	return flag;
};

var getPieChart = function(id, data, showLabel=true, innerRadius=0.85, useCustomizeLable=false){
	const CHART_COLOR = {
		nature: '#a1b968',
		culture: '#073b56',
		amusement: '#008eb8',
		shopping: '#c22c11',
		nightlife: '#f36c00',
	};
	
	var donutData = [];
	Object.keys(data).forEach(function(k, index){
		donutData.push({
			label: k,
			data : data[k],
			color: CHART_COLOR[k]
		});
	});
	
	var labelFormatter = function(label, series) {
		return '<div style="font-size:10px; text-align:center;  color: rgba(255,255,255,1);">'
			 + series.label + '</div>';
	}
	
	var label = {
		show     : showLabel,
		radius   : 2 / 3,
		// formatter: useCustomizeLable ? labelFormatter : null,
		threshold: 0.1,
	}
	if(useCustomizeLable)
		label.formatter = labelFormatter;
	
	$.plot(id, donutData, {
		series: {
			pie: {
				show       : true,
				radius     : 1,
				innerRadius: innerRadius,
				label      : label
			}
		},
		legend: {
			show: false
		}
	});
	
	
};

var getDuration = function(start_date, end_data) {
	var mil_s = new Date(end_data).getTime() - new Date(start_date).getTime();
	return mil_s/1000/3600/24;
};

var getRates = function(rates_list){
	var total_scores = 0.0;
	var total_number = 0;
	rates_list.forEach(function(r, index){
		total_number += parseInt(r);
		total_scores += (rates_list.length-index) * parseInt(r);
	});
	
	return total_scores/total_number;
};

var getRatesText = function(rates){
	// console.log(rates);
	var $text = $('<span></span>');
	var round_rates = rates.toFixed(1);
	for(var i=1; i<=5; i++){
		if(i <= rates){
			$text.append('<i class="fa fa-star"></i>\n');
		}else if(i > rates && i-1 < rates){
			$text.append('<i class="fa fa-star-half-o"></i>\n');
		}else{
			$text.append('<i class="fa fa-star-o"></i>\n');
		}
	}
	$text.append('<span>' + round_rates + '</span>\n');
	//console
	return $text.html();
};

var DateToYYYYMMDD = function(d){
	var year = d.getFullYear();
	var month = d.getMonth()+1;
	month = month < 10 ? '0' + month : month;
	var day = d.getDate() + 1;
	day = day <10 ? '0' + day : day;
	
	
	return year + '-' + month + '-' + day;
};

var DateToMMDDYY = function(s){
	var d = new Date(s);
	var year = d.getFullYear() - 2000;
	year = year < 10 ? '0' + year : year;
	var month = d.getMonth()+1;
	month = month < 10 ? '0' + month : month;
	var day = d.getDate() + 1;
	day = day <10 ? '0' + day : day;
	
	
	return month + '|' + day + '|' + year;
};

var DateToMMDD = function(s){
	var d = new Date(s);
	var month = d.getMonth()+1;
	month = month < 10 ? '0' + month : month;
	var day = d.getDate() + 1;
	day = day <10 ? '0' + day : day;
	
	return month + '-' + day
};

var secondToHourMinute = function(s) {
	var s = parseInt(s);
	var h = Math.floor(s/3600);
	var m = Math.floor((s%3600) / 60);
	
	var result = '';
	if(h > 0)
		result += h + ' h ';
	result += m + ' min';
	return result;
};

var meterToMile = function(m, fix= 1) {
	var m = parseInt(m);
	var result = (m / 1609).toFixed(fix);
	if(result == 0 & fix<3)
		return meterToMile(m, fix+1);
	return result;
}

var getItineraryPDF = function(data) {
	var doc = new jsPDF('p', 'pt', 'a4');
	
	var getRouteText = function(data){
		var text = '';
		text += 'Start: ' + data.origin.address + '\n';
		text += 'End: ' + data.destination.address + '\n';
		text += 'Duration: ' + secondToHourMinute(data.duration) + '\n';
		text += 'Miles: ' + meterToMile(data.distance) + '\n';
		
		return text;
	};
	
	var getPOIText = function(data){
		var text = '';
		text += 'Name: ' + data.name + '\n';
		text += 'Description: ' + (data.description ? data.description : 'N/A') + '\n';
		text += 'Rates: ' + /* getRatesText(getRates(data.ratings)) */ + '\n';
		text += 'Address: ' + data.address + '\n';
		text += 'Length of Visit: ' + data.length_visit + '\n';
		text += 'Website: ' + data.website + '\n';
		text += 'Hours: ' + data.hours + '\n';
		text += 'Phone: ' + data.phone + '\n';
		
		return text;
	};
	
	var text = '';
	// summary
	text += 'Trip Itinerary\n\n';
	text += 'Origin: ' + data.origin.address + '\n';
	text += 'Destination: ' + data.destination.address + '\n';
	text += 'Start Date: ' + DateToMMDDYY(new Date(data.start_date)) + '\n';
	text += 'End Date: ' + DateToMMDDYY(new Date(data.end_date)) + '\n';
	text += 'Hours of Driving: ' + Math.ceil(data.duration/3600) + '\n';
	text += 'Length of Routes: ' + Math.ceil(data.distance/1600) + '\n';
	text += 'Total POIs: ' + data.solution.length + '\n\n\n';
	
	data.itinerary.forEach(function(list, index){
		var date = DateToMMDDYY(new Date(new Date(data.start_date).getTime() + (index+1)*1000*3600*24));
		text += date + '\n';
		
		list.forEach(function(item, index2){
			if(item['_type'] == 'route'){
				text += getRouteText(item);
			}else if(item['_type'] == 'poi'){
				text += getPOIText(item);
			}
			
		});
	});
	
  
	var options = {
		pagesplit: true
	};

	doc.addHTML($("#get-itinerary"), options, function(){
		doc.save("test.pdf");
	});
	
	// doc.save('a4.pdf');
};