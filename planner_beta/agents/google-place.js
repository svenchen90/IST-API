var NearBySearch = require("googleplaces/lib/NearBySearch");
var config = require("/google-config.js");

var nearBySearch = new NearBySearch(config.apiKey, config.outputFormat);

var parameters = {
		location: [40.7127, -74.0059],
		keyword: "doctor"
};

nearBySearch(parameters, function (error, response) {
		if (error) throw error;
		//assert.notEqual(response.results.length, 0, "Place search must not return 0 results");
});


exports.googleMapsClient = googleMapsClient;