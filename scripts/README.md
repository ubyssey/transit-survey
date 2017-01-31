Author - Matthew Chernoff

usage:

(command line)
	npm install unzip
	
	npm install xmldom
	
	node getRouteCoordinates
	
	
If API key fails request a new one on https://developer.translink.ca/ServicesRtti

JSON structure:

ROUTES object - name (string), RouteList (array of ROUTE objects)

ROUTE object - name (string), Points (array of POINT objects)

POINT object - lat (string), lng (string)
