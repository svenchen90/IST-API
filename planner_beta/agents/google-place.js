var config = {
	// apiKey: process.env.GOOGLE_PLACES_API_KEY || "AIzaSyAOfXmpPxCXjGchGCtmEZHQHeqyKqe5vnc",
	apiKey: process.env.GOOGLE_PLACES_API_KEY || "AIzaSyCnfkwH-NUX5aCpcZVDf5YYlNw7itJEg48",
	outputFormat: process.env.GOOGLE_PLACES_OUTPUT_FORMAT || "json"
};

var NearBySearch = require("googleplaces/lib/NearBySearch");
var nearBySearch = new NearBySearch(config.apiKey, config.outputFormat);

var ImageFetch = require("googleplaces/lib/ImageFetch.js");
var imageFetch = new ImageFetch(config.apiKey);

var PlaceDetailsRequest = require("googleplaces/lib/PlaceDetailsRequest.js");
var placeDetailsRequest = new PlaceDetailsRequest(config.apiKey, config.outputFormat);


exports.NearBySearch = nearBySearch;
exports.ImageFetch = imageFetch;
exports.PlaceDetailsRequest = placeDetailsRequest;