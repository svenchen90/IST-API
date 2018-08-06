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