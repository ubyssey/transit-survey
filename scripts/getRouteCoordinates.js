var fs = require('fs');
var http = require('http');

//npm install required
var unzip = require('unzip');
var DOMParser = require('xmldom').DOMParser;

var apiKey = 'V8AZONNoNOrhoS9lxq3k';
var routeNums = ['2','3','4','5','6','7','8','9','10','14',
				'15','16','17','19','20','22','23','25','26','27',
				'28','29','32','33','41','43','44','49','50','84',
				'96','99','100','258','480','C18', 'C20'];
//C19, skytrain, seabus, WCE not available
	
var total = 0;

if(!fs.existsSync('./kml')){
	fs.mkdirSync('./kml');
}
if(!fs.existsSync('./kmz')){
	fs.mkdirSync('./kmz');
}
var json = {};

iterateRoutes();
extractKmz(fs.readdirSync('./kmz/'));
readKml(fs.readdirSync('./kml/'));

process.stdout.write(currentTime() + ' Writing to JSON file... ');
fs.writeFileSync('../data/routes.json', JSON.stringify(json));
process.stdout.write('done\n');
process.exit(0);

function iterateRoutes(){
	process.stdout.write(currentTime() + ' Calling Translink API... ');
	for(var n in routeNums){
		try{
			num = parseRouteNumber(routeNums[n]);
			total++;
			getData(num);
		}
		catch(e){
			console.log(e);
			continue;
		}
	}
	process.stdout.write('done\n');
}

//Unzip KMZ files
function extractKmz(files){
	process.stdout.write(currentTime() + ' Extracting KMZ files... ');
	for(var n in files){
		fs.createReadStream('./kmz/' + files[n]).pipe(unzip.Extract(
				{ path: './kml/' + files[n].substring(0,files[n].length-4)}));
	}
	process.stdout.write('done\n');
}

//Create JSON file with all route coordinates
function readKml(files){
	process.stdout.write(currentTime() + ' Reading KML files... ');
	json.name = "Routes";
	json.RouteList = [];
	for(var n in files){
		var content = fs.readFileSync('./kml/' + files[n] + '/doc.kml', 'utf8');
		var parser = new DOMParser();
		var xml = parser.parseFromString(content, "text/xml");
		var newRoute = {};
		var folder = xml.getElementsByTagName("Folder")[0];
			
		var routeName = folder.getElementsByTagName("name")[0].firstChild.nodeValue;
		newRoute.name = routeName.substring(0, routeName.indexOf('-'));
			
		newRoute.Points = [];
		var ls = xml.getElementsByTagName("coordinates");
		var lng, lat, c, cs;
		for(var n = 0; n < ls.length; n++){
			c = ls[n].firstChild.nodeValue;
			cs = c.split(/,| /);
			lng = cs[0];
			lat = cs[1];
			//ignore latter coordinate pair (duplicate)
			newRoute.Points.push({'lat': lat, 'lng': lng});
		}
		//Get last coordinate pair
		c = ls[ls.length-1].firstChild.nodeValue;
		cs = c.split(/,| /); 
		lng = cs[3];
		lat = cs[4];
		newRoute.Points.push({'lat': lat, 'lng': lng});
		
		json.RouteList.push(newRoute);
	}
	process.stdout.write('done\n');
}

// Transforms route number into 3-character code by adding leading 0's
function parseRouteNumber(routeNum){
	if(routeNum.length > 3 || routeNum.length <= 0) throw 'Invalid route number' + routeNum;
	if(routeNum.charAt(0) != 'C' && routeNum.charAt(0) != 'N'){
		if(routeNum.length == 1){
			return '00' + routeNum;
		}
		else if(routeNum.length == 2){
			return '0' + routeNum;
		}
	}
	return routeNum;
}

function currentTime(){
	var time = new Date();
	var addLeadingZeros = function(num){
		num = num + '';
		if(num.length < 2)
			return '0' + num;
		return num;
	}
	return '[' + addLeadingZeros(time.getHours()) + ':' + addLeadingZeros(time.getMinutes()) + ':' +
		addLeadingZeros(time.getSeconds()) + '.' + time.getMilliseconds() + ']';
}

function getData(routeNum){
	var str = '';

	var options = {
		host: 'api.translink.ca',
		path: '/RTTIAPI/V1/routes/' + 
				routeNum +
				'?apiKey=' + apiKey,
		headers: {
			'content-type': 'application/JSON'
		}
	};
	callback = function(response) {
		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			var json = JSON.parse(str);
			var ubcRoute = false;
			var kmzUrl = '';
			for(var n in json.Patterns){
				if(json.Patterns[n].Destination.toUpperCase() === 'UBC'){
					ubcRoute = true;
					kmzUrl = json.Patterns[n].RouteMap.Href;
				}
			}
			if(!ubcRoute){
				try{
					kmzUrl = json.Patterns[json.Patterns.length-1].RouteMap.Href;
				}
				catch(e){
					console.log(json);
					console.log(e.message);
				}
			}
			var file = fs.createWriteStream('./kmz/' + kmzUrl.substring(kmzUrl.indexOf('trip')+5));
			try{
				var request = http.get(kmzUrl, function(response) {
					response.pipe(file);
				});
			}catch(e){
				console.log(kmzUrl);
				console.log(e.message);
			}
		});
	}

	var req = http.request(options, callback).end();
}