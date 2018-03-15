//MongoDB Connection
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/IST');

var models = require('../models/models');
var POI = models.POI;

// 1. Get POI in Buffer
var getPOIInBuffer = function(coordinates, limit){
	return new Promise(function(resolve, reject){
		POI.where('geo')
			.within({
					type: "Polygon",
					coordinates: coordinates
			})
			//.where('action')
			//.equals(your_action)
			//.skip(your_skip)
			.limit(limit)
			.exec(function(err, POIs) {
				if(err)
					reject(err);
				else{
					//console.log(POIs);
					resolve(POIs);
				}
			});
	});
};

exports.getPOIInBuffer = getPOIInBuffer;