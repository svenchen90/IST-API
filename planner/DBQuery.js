//MongoDB Connection
/* var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/IST');

var models = require('../models/models');
var POI = models.POI;
var Byway = models.Byway; */

// 0. Test
var getPOIs_test = function(limit){
	return new Promise(function(resolve, reject){
		POI.find()
			.lean()
			//.where('geo')
			/* .within({
					type: "Polygon",
					coordinates: coordinates
			}) */
			//.where('action')
			//.equals(your_action)
			//.skip(your_skip)
			.limit(limit)
			.exec(function(err, POIs) {
				if(err){
					reject(err);
				}else{
					//console.log(POIs);
					resolve(POIs);
				}
			});
	});
};


// 1. Get POI in Buffer
var getPOIInBuffer = function(coordinates, limit){
	return new Promise(function(resolve, reject){
		POI
			.find()
			.where('geo')
			.within({
					type: "Polygon",
					coordinates: coordinates
			})
			//.where('action')
			//.equals(your_action)
			//.skip(your_skip)
			.limit(limit)
			.lean()
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

var getBywayInBuffer = function(coordinates, limit){
	return new Promise(function(resolve, reject){
		Byway
			.where('ll')
			.within({
					type: "Polygon",
					coordinates: coordinates
			})
			
			//.where('action')
			//.equals(your_action)
			//.skip(your_skip)
			.limit(10)
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




exports.getPOIs_test = getPOIs_test;
exports.getPOIInBuffer = getPOIInBuffer;
exports.getBywayInBuffer = getBywayInBuffer;