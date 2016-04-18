# Get all artists within MongoDB. Returns list of artists and total found.
def get_artists(mongo):
    return_dict = {'total': 0, 'artists': []}
    return_dict['artists'] = mongo.db.collection_names()
    return_dict['artists'].remove('system.indexes')
    return_dict['total'] = len(return_dict['artists'])
    return return_dict


# Get all shows performed by artist. Returns list of shows and total found.
def get_shows(mongo, artist):
    return_dict = {'total': 0, 'shows': []}
    shows_data = mongo.db[artist].find()
    if shows_data.count():
        return_dict['shows'] = [show['_id'] for show in shows_data]
        return_dict['total'] = len(return_dict['shows'])
        return return_dict
    return return_dict


# Get all tours performed by artist. Returns list of tours and total found.
def get_tours(mongo, artist):
    return_dict = {'total': 0, 'tours': []}
    
    # Query MongoDB for tours that exist and are not null
    pipeline = [
        {"$match": {"data.@tour": {"$exists": True, "$ne": None}}},
        {'$group': {'_id': "$data.@tour"}}
    ]
    tour_data = list(mongo.db[artist].aggregate(pipeline))
    if tour_data:
        return_dict['tours'] = [tour['_id'] for tour in tour_data]
        return_dict['total'] = len(return_dict['tours'])
        return return_dict
    return return_dict
