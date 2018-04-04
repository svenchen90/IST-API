// 1. distance between two coordinates
/* 
var from = turf.point([-75.343, 39.984]);
var to = turf.point([-75.534, 39.123]);
var options = {units: 'miles'};

var distance = turf.distance(from, to, options); 
*/

// 2. length of polyline
/* 
var line = turf.lineString([[115, -32], [131, -22], [143, -25], [150, -34]]);
var length = turf.length(line, {units: 'miles'});
 */
 
// 3. distance between point and polyline
/* 
var line = turf.lineString([
    [-77.031669, 38.878605],
    [-77.029609, 38.881946],
    [-77.020339, 38.884084],
    [-77.025661, 38.885821],
    [-77.021884, 38.889563],
    [-77.019824, 38.892368]
]);
var pt = turf.point([-77.037076, 38.884017]);

var snapped = turf.nearestPointOnLine(line, pt, {units: 'miles'});
 */

// 4. divide polyline into chunks
/* 
var line = turf.lineString([[-95, 40], [-93, 45], [-85, 50]]);

var chunk = turf.lineChunk(line, 15, {units: 'miles'});
 */