from flask import Flask, render_template, jsonify, url_for, redirect, request
from flask_pymongo import PyMongo
from flask_restful import Api, Resource
from data_builder.data_builder import *

# Create app and connect to MongoDB
app = Flask(__name__)
app.config["MONGO_DBNAME"] = "setlists"
mongo = PyMongo(app, config_prefix='MONGO')


# Get concert dates for available artist
class Shows(Resource):
    def get(self, artist=None):

        # If an artist is passed in, grab all shows from MongoDB.
        if artist:
            shows = get_shows(mongo, artist, request.args)
            if shows['total']:
                return jsonify({"status": "ok", "data": shows})
        return {"status": "fail", "data": "No shows found for artist {0}".format(artist)}


# Get list of all tours
class Tours(Resource):
    def get(self, artist=None):

        # If an artist is passed in, grab all tours from MongoDB.
        if artist:
            # Filter our null values and group by tour name
            tours = get_tours(mongo, artist, request.args)
            if tours['total']:
                return jsonify({"status": "ok", "data": tours['tours'], "total": tours['total']})
            return jsonify({"status": "fail", "data": "No tours found for artist {0}".format(artist)})


# Get available artists
class Artists(Resource):
    def get(self):
        artists = get_artists(mongo, request.args)
        if artists['total']:
            return jsonify({"status": "ok", "data": artists['artists'], "total": artists['total']})
        return jsonify({"status": "fail", "data": "No artists found "})


# Homepage, placeholder for metrics.
def index():
    return render_template('index.html')


# App routes
app.add_url_rule('/', 'index', index)

# API routes
api = Api(app)
api.add_resource(Artists, "/api/v1/artists", endpoint="artists")
api.add_resource(Shows, "/api/v1/shows/<string:artist>", endpoint="shows")
api.add_resource(Tours, "/api/v1/tours/<string:artist>", endpoint="tours")

if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True)
