import xlrd
import json

# Open file, and prepare for reading
Raw_Data = xlrd.open_workbook("SurveyResults.xls")
sheet = Raw_Data.sheet_by_index(0)

"""
regions E.g.
{"name":"regions", "RegionList":[list of region objects]}

region object E.g.
{"Richmond":{"results":22, "popularRoutes":[Most Popular route, second most
popular route, 3rd most popular route], "Commutetime": 0900}}
"""

regions = {} # Regions object - name (string), RegionList(array of REGION objects)

regions["name"] = "regions"
regions["RegionList"] = []
raw_location_data = {} # Store info for each location in this.

# Iterate through excel file to get data you want
for row in range(2,sheet.nrows):

    # Get location - either in row 8 or 9.
    location = ""
    if sheet.cell_value(row,9) == "":
        location = sheet.cell_value(row,8)
    else:
        location = sheet.cell_value(row,9)

    # If the location hasn't been seen before, create a dict of it.
    if location not in raw_location_data:
        raw_location_data[location] = {
            "results":1,
            "popularRoutes":{sheet.cell_value(row,5):1}
        }
    else:

        # Increase the number of times that this location has been seen by 1
        raw_location_data[location]["results"] += 1

        # Keep track of which routes are being used most.
        if sheet.cell_value(row,5) not in raw_location_data[location]["popularRoutes"]:
            raw_location_data[location]["popularRoutes"][sheet.cell_value(row,5)] = 1
        else:
            raw_location_data[location]["popularRoutes"][sheet.cell_value(row,5)] += 1

""" Now, all the raw data we need is in the dictionary
    "raw_location_data". All we have to do is copy each
    location (including results  and list of three most popular
    routes) into regions["RegionList"]
"""

# Change the dictionary of routes used to the top 3 most popular routes
for location in raw_location_data:

    # Sort the routed via the values, and reverse so the list is from highest to lowest values
    sorted_routes = sorted(raw_location_data[location]["popularRoutes"], key=raw_location_data[location]["popularRoutes"].__getitem__)[::-1]

    # Change the popular routes in raw data to just the top 3
    raw_location_data[location]["popularRoutes"]=sorted_routes[:3]

    # Name each location
    raw_location_data[location]["name"] = location

    # 


for location in raw_location_data:
    regions["RegionList"].append(raw_location_data[location])


# Format route dictionary to a json object
jsonobject = json.dumps(regions)

# Write json data to Route
with open("regions.json", 'w') as jsonfile:
    jsonfile.write(jsonobject)
