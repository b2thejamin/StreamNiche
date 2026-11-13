from flask import Flask, jsonify
import json
import os

app = Flask(__name__)

@app.route('/api/games')
def games():
    path = os.path.join(os.path.dirname(__file__), '..', '..', 'backend', 'cache', 'games.json')
    path = os.path.abspath(path)
    with open(path) as f:
        data = json.load(f)
    return jsonify(data)

def handler(request):
    return app(request)