from flask import Flask, render_template, jsonify, url_for, redirect, request
from flask_pymongo import PyMongo
from flask_restful import Api, Resource

# Create app and connect to MongoDB
app = Flask(__name__)
app.config["MONGO_DBNAME"] = "setlists"
mongo = PyMongo(app, config_prefix='MONGO')


# Get concert dates for available artist
class Shows(Resource):
    def get(self):

        # Get url arguments
        if request.args:
            kwargs = request.args
        else:
            return jsonify({"status": "fail", "data": "No arguments passed in."})

        # If an artist is passed in, grab all shows from MongoDB.
        if kwargs['artist']:
            artist = kwargs['artist']
            setlists = mongo.db[artist].find()
            if setlists.count():
                shows = [setlist['_id'] for setlist in setlists]
                return jsonify({"status": "ok", "data": shows})
        return {"status": "fail", "data": "No shows found!"}


# Get list of all tours
class Tours(Resource):
    def get(self):

        # Get url arguments
        if request.args:
            kwargs = request.args
        else:
            return jsonify({"status": "fail", "data": "No arguments passed in."})

        # If an artist is passed in, grab all tours from MongoDB.
        if kwargs['artist']:
            artist = kwargs['artist']

            # Filter our null values and group by tour name
            pipeline = [
                {"$match": {"data.@tour": {"$exists": True, "$ne": None}}},
                {'$group': {'_id': "$data.@tour"}}
            ]
            tour_data = list(mongo.db[artist].aggregate(pipeline))
            tours = [tour['_id'] for tour in tour_data]
            if tours:
                return jsonify({"status": "ok", "data": tours})
        return jsonify({"status": "fail", "data": "No tours found!"})


# Get available artists
class Artists(Resource):
    def get(self):
        artists = mongo.db.collection_names()
        artists.remove('system.indexes')
        return jsonify({"status": "ok", "data": artists})


# Homepage, placeholder for metrics.
def index():
    return render_template('index.html')


# App routes
app.add_url_rule('/', 'index', index)

# API routes
api = Api(app)
api.add_resource(Artists, "/api/v1/artists", endpoint="artists")
api.add_resource(Shows, "/api/v1/shows", endpoint="shows")
api.add_resource(Tours, "/api/v1/tours/", endpoint="tours")

if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True)
