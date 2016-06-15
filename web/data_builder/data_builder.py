from collections import Counter


# Get all artists within MongoDB. Returns list of artists and total found.
def get_artists(mongo, kwargs=None):
    return_dict = {'total': 0, 'artists': []}
    return_dict['artists'] = mongo.db.collection_names()
    # return_dict['artists'].remove('system.indexes')
    return_dict['total'] = len(return_dict['artists'])
    return return_dict


# Get all shows performed by artist. Returns list of shows and total found.
def get_shows(mongo, artist, kwargs=None):
    return_dict = {'total': 0, 'shows': []}

    # Get shows from MongoDB.
    shows_data = mongo.db[artist].find()
    if shows_data.count():
        return_dict['shows'] = [show['_id'] for show in shows_data]
        return_dict['total'] = len(return_dict['shows'])

        # Check additional return options
        if kwargs:

            # Check options for count - accepts day, month or year.
            if 'count' in kwargs:
                return_dict['count'] = count(kwargs, return_dict['shows'])

    return return_dict


# Get all tours performed by artist. Returns list of tours and total found.
def get_tours(mongo, artist, kwargs=None):
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


# Return a dict of day/month/year: count
def count(kwargs, dates):
    # Check options for count - accepts day, month or year.
    ordinal = {'day': 0, 'month': 1, 'year': 2}
    if kwargs['count'] in ordinal:
        index = ordinal[kwargs['count']]

        # Key:Value - For future when JS Object.values() is implemented.
        date_dict = Counter([date.split('-')[index] for date in dates])

        # Arrays of Keys and Values - For current use.
        date_dict['keys'] = sorted(date_dict.keys())
        date_dict['values'] = [date_dict[key] for key in date_dict['keys']]
        return date_dict
    else:
        return_count = 'Only day, month, or year are available options for count'
    return return_count
