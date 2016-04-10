from collections import defaultdict
import json
import re
from internetarchive import search_items


collections = defaultdict(dict)

# Iterate through all Grateful Dead shows, add to collections as year, concert, songs.
for item in search_items('gratefuldead').iter_as_items():
    try:
        # Title's are the most consistent method for determining performance date.
        if 'title' in item.metadata:
            match = re.search(r'(\d{1,2}[-|/]\d{1,2}[-|/]\d{2,4})', item.metadata['title'])

        if match:
            # Create an array of songs
            files = [x['title'] for x in item.files if 'title' in x]

            # Assemble year, necessary due to data inconsistencies e.g., 01/02/1994 vs. 1/2/07.
            date_group = match.group()[-2:]
            if int(date_group) < 65:
                year = '20{0}'.format(date_group)
            else:
                year = '19{0}'.format(date_group)

            title = item.metadata['title']
            collections[year][title] = files
    except TypeError:
        break

with open('data.json', 'w') as outfile:
    json.dump(collections, outfile)
