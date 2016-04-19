from collections import Counter


# Get all artists within MongoDB. Returns list of artists and total found.
def get_artists(mongo, kwargs=None):
    return_dict = {'total': 0, 'artists': []}
    return_dict['artists'] = mongo.db.collection_names()
    return_dict['artists'].remove('system.indexes')
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

        # Check options for count - accepts day, month or year.
        if kwargs and 'count' in kwargs:
            ordinal = {'day': 0, 'month': 1, 'year': 2}
            if kwargs['count'] in ordinal:
                index = ordinal[kwargs['count']]
                months_dict = Counter([month.split('-')[index] for month in return_dict['shows']])
                months = []
                for month in range(1, 13):
                    padded_month = str(month).zfill(2)
                    count = months_dict[padded_month]
                    months.append(count)
                return_dict['count'] = months
            else:
                return_dict['count'] = 'Only day, month, or year are available options for count'

        return return_dict
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
