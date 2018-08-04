var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'ismarttrip01@gmail.com',
		pass: 'Abc#123456789'
	}
});


var emailAddressValidation = function(to, url, error_fun, done_fun, locale='en'){
	var mailOptions = {
		from: 'ismarttrip01@gmail.com',
		to : to,
		subject: 'Sending Email using Node.js',
		html: '<a href="' + url + '">' + url + '</a>'
	};
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			error_fun(error);
		} else {
			done_fun(info.response);
		}
	});
};

exports.emailAddressValidation = emailAddressValidation;