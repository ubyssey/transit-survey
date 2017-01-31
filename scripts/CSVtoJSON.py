"""
Python 3.5.2
CSV to JSON
"""

# Import the modules
import csv
import json

# Open your files
jsonfile = open('../data/SurveyResultsJSON.json', 'w')
csvfile = open('../data/SurveyResultsCSV.csv', 'r')

# Fieldnames for the JSON file
fieldnames = ('Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
    'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18')

# Create a reader object with the CSV file, and fieldnames as the header
readerObject = csv.DictReader(csvfile, fieldnames)

# Write each row to the json file
for row in readerObject:
    json.dump(row, jsonfile)
    jsonfile.write('\n')


# Close your files
jsonfile.close()
csvfile.close()
