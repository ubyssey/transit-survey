var fs = require('fs');
var http = require('http');

//npm install required
var unzip = require('unzip');
var DOMParser = require('xmldom').DOMParser;

var routeNums = ['2','3','4','5','6','7','8','9','10','14',
				'15','16','17','19','20','22','23','25','26','27',
				'28','29','32','33','41','43','44','49','50','84',
				'99','100','C18', 'C20'];
//C19, skytrain, seabus, WCE not available
	
var total = 0;

if(!fs.existsSync('./kml')){
	fs.mkdirSync('./kml');
}
if(!fs.existsSync('./kmz')){
	fs.mkdirSync('./kmz');
}


function iterateRoutes(callback){
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
	setTimeout(function(){callback(fs.readdirSync('./kmz/'));},10000);
}

var json = {};
iterateRoutes(extractKmz);


function addNewRoute(newRoute){
	json.RouteList.push(newRoute);
	if(json.RouteList.length >= total){
		fs.writeFile('../data/routes.json', JSON.stringify(json));
	}
}

function extractKmz(files){
	for(var n in files){
		fs.createReadStream('./kmz/' + files[n]).pipe(unzip.Extract(
				{ path: './kml/' + files[n].substring(0,files[n].length-4)}));
	}
	
	//Create JSON file with all route coordinates
	setTimeout(function(){readKml(fs.readdirSync('./kml/'));}, 10000);
}

function readKml(files){
	json.name = "Routes";
	json.RouteList = [];
	for(var n in files){
		var stream = fs.createReadStream('./kml/' + files[n] + '/doc.kml');
		var str = '';
		stream.on('data', function(chunk){
			str += chunk;
		});
		stream.on('end', function(){
			var parser = new DOMParser();
			var xml = parser.parseFromString(str, "text/xml");
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
				newRoute.Points.push({'lat': lat, 'lng': lng});
			}
			//Get last coordinate
			c = ls[ls.length-1].firstChild.nodeValue;
			cs = c.split(/,| /); 
			lng = cs[2];
			lat = cs[3];
			newRoute.Points.push({'lat': lat, 'lng': lng});
			
			addNewRoute(newRoute);
		});
	}
}

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

function getData(routeNum){
	var str = '';

	var options = {
		host: 'api.translink.ca',
		path: '/RTTIAPI/V1/routes/' + 
				routeNum +
				'?apiKey=V8AZONNoNOrhoS9lxq3k',
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