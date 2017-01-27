Author - Matthew Chernoff

usage:

(command line)
	npm install unzip
	npm install xmldom
	node getRouteCoordinates
	
If API key fails request a new one on https://developer.translink.ca/ServicesRtti

results are stored in routes.json:
{
	"name": "Routes",
	"RouteList": [
	{
		"name": "001",
		"Points": [
		{
			"lat": "100.000"
			"lng": "100.000"
		}...
		]
	}...
	]
}