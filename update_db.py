import re
import sys
from internetarchive import search_items
from pymongo import MongoClient


# Create connection to MongoDB
def mongo(host, port):
    client = MongoClient(host, port)
    return client


# Collection = performance date, data = {concert_title, songs}
def add_to_mongo(db, collection_name, data):
    collection = db[collection_name]
    try:
        # Check shows to avoid inserting duplicate concerts
        dupe_check = collection.find_one({'title': {'$regex': collection_name}})
        if not dupe_check:
            collection.update_one({'title': data['title']}, {'$set': {'files': data['files']}}, upsert=True)
    except:
        print("Unexpected error:", sys.exc_info())


def main():
    # Connect to MongoDB, select grateful_dead collection.
    connection = mongo('localhost', 27017)
    db = connection.grateful_dead

    # Iterate through all Grateful Dead shows, add to collections as year, concert, songs.
    for item in search_items('gratefuldead').iter_as_items():
        try:
            # Title's are the most consistent method for determining performance date.
            if 'title' in item.metadata:
                match = re.search(r'(\d{1,4}[-|/]\d{1,2}[-|/]\d{2,4})', item.metadata['title'])

            if match:
                # Create an array of songs
                files = [x['title'] for x in item.files if 'title' in x]

                title = item.metadata['title']
                data = {'title': title, 'files': files}

                # Add to database
                add_to_mongo(db, match.group(), data)
        except TypeError:
            pass


if __name__ == '__main__':
    main()
