Author - Matthew Chernoff

usage:

(command line)

	npm install 
	node getRouteCoordinates
	
npm - xmldom and unzip modules required, included in package.json
If API key fails request a new one on https://developer.translink.ca/ServicesRtti

ROUTES.JSON structure:

	Routes object - name (string), RouteList (array of ROUTE objects)

	Route object - name (string), Points (array of POINT objects), results (number of survey entries),
				   popularity (number, weighted by how often they use route), crowded (number, 1-10),
				   late (number, 1-10), skips stops? (number, 1-10)

	Point object - lat (number), lng (number)

	
	
REGIONS.JSON structure: 

If region is in Vancouver (Dunbar, Kitsilano) then use that. Otherwise use city (Richmond, Coquitlam)

	Regions object - name (string), RegionList(array of REGION objects)

	Region object - name (string), results (number of survey entries), popularRoutes(array of 3 most popular route names),
					commute time(number, earliest time they catch the bus)
	
	
	