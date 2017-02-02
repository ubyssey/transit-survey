Author - Matthew Chernoff

usage:

(command line)

	npm install 
	node getRouteCoordinates
	
npm - xmldom and unzip modules required, included in package.json
If API key fails request a new one on https://developer.translink.ca/ServicesRtti

JSON structure:

ROUTES object - name (string), RouteList (array of ROUTE objects)

ROUTE object - name (string), Points (array of POINT objects)

POINT object - lat (string), lng (string)
