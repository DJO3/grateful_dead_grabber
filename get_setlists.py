import json
import math
from os.path import isfile
from requests import Session
from sys import exc_info
from pymongo import MongoClient


# Create connection to MongoDB
def mongo(host, port):
    client = MongoClient(host, port)
    return client


# Adds to MongoDB in format '_id': eventDate, 'data': setlist
def add_to_mongo(db, collection_name, data):
    collection = db[collection_name]
    try:
        collection.update_one({'_id': data['@eventDate']}, {'$set': {'_id': data['@eventDate'], 'data': data}}, upsert=True)
    except:
        print("Unexpected error:", exc_info())


# Query setlist.fm for all artist setlists
def get_all_setlists(artist, page_number, sets_per_page):
    headers = {'Accept': 'application/json'}
    url = "http://api.setlist.fm/rest/0.1/search/setlists?artistName={0}&p={1}".format(artist, page_number)
    session = Session()
    response = session.get(url, headers=headers)
    data = response.json()

    setlists = data['setlists']['setlist']
    total = data['setlists']['@total']
    total_pages = math.ceil(int(total) / sets_per_page)

    for page in range(page_number + 1, total_pages + 1):
        print(page)
        url = "http://api.setlist.fm/rest/0.1/search/setlists?artistName={0}&p={1}".format(artist, page)
        response = session.get(url, headers=headers)
        data = response.json()
        setlists = setlists + data['setlists']['setlist']

    return setlists


def main():
    # Connect to MongoDB, select grateful_dead collection.
    connection = mongo('localhost', 27017)
    db = connection.grateful_dead

    # Get setlists - check if cached first - if not use setlist.fm REST api and then cache it.
    if isfile('setlists.json'):
        with open('setlists.json') as file:
            setlists = json.load(file)
    else:
        setlists = get_all_setlists('grateful-dead', 1, 20)
        with open('setlists.json', 'w') as outfile:
            json.dump(setlists, outfile)

    # Add setlists to MongoDB for future use.
    for setlist in setlists:
        collection_name = setlist['@eventDate']
        add_to_mongo(db, collection_name, setlist)


if __name__ == '__main__':
    main()
