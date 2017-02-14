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
//Skytrain, seabus, WCE not available
	
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

//Add routes not available on translink API
addExtraRoutes();

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
		newRoute.results = 0;
		newRoute.crowded = 0;
		newRoute.popularity = 0;
			
		newRoute.Points = [];
		var ls = xml.getElementsByTagName("coordinates");
		var lng, lat, c, cs;
		for(var n = 0; n < ls.length; n++){
			c = ls[n].firstChild.nodeValue;
			cs = c.split(/,| /);
			lng = parseFloat(cs[0]);
			lat = parseFloat(cs[1]);
			//ignore latter coordinate pair (duplicate)
			newRoute.Points.push({'lat': lat, 'lng': lng});
		}
		//Get last coordinate pair
		c = ls[ls.length-1].firstChild.nodeValue;
		cs = c.split(/,| /); 
		lng = parseFloat(cs[3]);
		lat = parseFloat(cs[4]);
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

function addExtraRoutes(){
	//Evergreen Line
	var route = {};	
	route.name = "Evergreen Line";
	route.results = 0;
	route.crowded = 0;
	route.popularity = 0;
	route.Points = [{"lat":49.248507,"lng":-122.897015},{"lat":49.261419,"lng":-122.889805},
					{"lat":49.277997,"lng":-122.845860},{"lat":49.277325,"lng":-122.828178},
					{"lat":49.274637,"lng":-122.800884},{"lat":49.280460,"lng":-122.793846},
					{"lat":49.285611,"lng":-122.791786}];
	
	json.RouteList.push(route);
	
	//Millennium Line
	route = {};
	route.name = "Millennium Line";
	route.results = 0;
	route.crowded = 0;
	route.popularity = 0;
	route.Points = [{"lat":49.285863,"lng":-123.112020},{"lat":49.285667,"lng":-123.120217},
					{"lat":49.283288,"lng":-123.116140},{"lat":49.279313,"lng":-123.109188},
					{"lat":49.273181,"lng":-123.100476},{"lat":49.262652,"lng":-123.069277},
					{"lat":49.248394,"lng":-123.055887},{"lat":49.244332,"lng":-123.046274},
					{"lat":49.238504,"lng":-123.032069},{"lat":49.229789,"lng":-123.012714},
					{"lat":49.225782,"lng":-123.003788},{"lat":49.220092,"lng":-122.988467},
					{"lat":49.212243,"lng":-122.959156},{"lat":49.199990,"lng":-122.949200},
					{"lat":49.201448,"lng":-122.912765},{"lat":49.204841,"lng":-122.906113},
					{"lat":49.204420,"lng":-122.874184},{"lat":49.198924,"lng":-122.850666},
					{"lat":49.189670,"lng":-122.847919},{"lat":49.182769,"lng":-122.844658}];

	json.RouteList.push(route);
	
	//Expo Line
	route = {};
	route.name = "Expo Line";
	route.results = 0;
	route.crowded = 0;
	route.popularity = 0;
	route.Points = [{"lat":49.265704,"lng":-123.079147},{"lat":49.262652,"lng":-123.069277},
					{"lat":49.258899,"lng":-123.045115},{"lat":49.260831,"lng":-123.033056},
					{"lat":49.265004,"lng":-123.013530},{"lat":49.266432,"lng":-123.001771},
					{"lat":49.264752,"lng":-122.982202},{"lat":49.258207,"lng":-122.964091},
					{"lat":49.254641,"lng":-122.939243},{"lat":49.253409,"lng":-122.918172},
					{"lat":49.248507,"lng":-122.897015}];

	json.RouteList.push(route);
	
	//Canada Line
	route = {};
	route.name = "Canada Line";
	route.results = 0;
	route.crowded = 0;
	route.popularity = 0;
	route.Points = [{"lat":49.285863,"lng":-123.112020},{"lat":49.282504,"lng":-123.118587},
					{"lat":49.274525,"lng":-123.121891},{"lat":49.266516,"lng":-123.115754},
					{"lat":49.262960,"lng":-123.114510},{"lat":49.249263,"lng":-123.115883},
					{"lat":49.233180,"lng":-123.116655},{"lat":49.226342,"lng":-123.116913},
					{"lat":49.209383,"lng":-123.116891},{"lat":49.195531,"lng":-123.126054},
					{"lat":49.183976,"lng":-123.136482},{"lat":49.174746,"lng":-123.136611},
					{"lat":49.168096,"lng":-123.136268},{"lat":49.168096,"lng":-123.136268}];

	json.RouteList.push(route);
	
	//Seabus
	route = {};
	route.name = "Seabus";
	route.results = 0;
	route.crowded = 0;
	route.popularity = 0;
	route.Points = [{"lat": 49.286787,"lng": -123.110433},{"lat":49.30996,"lng":-123.082795}];

	json.RouteList.push(route);
	
	//West Coast Express
	route = {};
	route.name = "West Coast Express";
	route.results = 0;
	route.crowded = 0;
	route.popularity = 0;
	route.Points = [{"lat":49.285863,"lng":-123.112020},{"lat":49.277969,"lng":-122.845860},
					{"lat":49.274609,"lng":-122.800798},{"lat":49.261503,"lng":-122.774105},
					{"lat":49.225838,"lng":-122.688446},{"lat":49.216532,"lng":-122.666130},
					{"lat":49.212271,"lng":-122.605233},{"lat":49.133879,"lng":-122.304697}];

	json.RouteList.push(route);
}