import os
import requests
import threading
import time
from dotenv import load_dotenv
from datetime import datetime, timedelta
from tqdm import tqdm
from statistics import median
import json
import pandas as pd
import math
from flask import Flask, jsonify
from flask_cors import CORS

CACHE_PATH = "cache/games.json"

print("APP.PY LOADED", flush=True)
print("CACHE_PATH exists:", os.path.exists(CACHE_PATH), flush=True)

load_dotenv()
CLIENT_ID = os.getenv("TWITCH_CLIENT_ID")
CLIENT_SECRET = os.getenv("TWITCH_CLIENT_SECRET")

# Streamer counts below this floor get their score scaled down proportionally.
# So a game with a single lucky high-viewer stream doesn't look like a great niche.
STREAMER_FLOOR = 12

try:
    genre_df = pd.read_csv("genres.csv", low_memory=False)
    GENRE_LOOKUP = {}
    for _, row in genre_df.iterrows():
        game_name = str(row["name"]).lower()
        raw = row["genres"]
        if pd.isna(raw) or not isinstance(raw, str) or raw.strip() == "":
            genre = "Other"
        else:
            genre = raw.split(",")[0].strip()
            if not genre:
                genre = "Other"
        GENRE_LOOKUP[game_name] = genre
except Exception as e:
    print("Could not load genres.csv:", e)
    GENRE_LOOKUP = {}

def get_app_token():
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }
    response = requests.post(url, params=params)
    response.raise_for_status()
    return response.json()["access_token"]

def get_top_games(token, max_games=200, page_size=100):
    url = "https://api.twitch.tv/helix/games/top"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}"
    }
    all_games = []
    after = None
    pbar = tqdm(total=max_games, desc="Fetching games", unit="game")

    while len(all_games) < max_games:
        params = {"first": min(page_size, max_games - len(all_games))}
        if after:
            params["after"] = after

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        batch = data.get("data", [])
        if not batch:
            break

        all_games.extend(batch)
        pbar.update(len(batch))
        after = data.get("pagination", {}).get("cursor")
        if not after:
            break

    pbar.close()
    return all_games[:max_games]

def get_streams_for_game(token, game_id, max_streams=200, page_size=100):
    url = "https://api.twitch.tv/helix/streams"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}"
    }
    all_streams = []
    after = None

    while len(all_streams) < max_streams:
        params = {
            "game_id": game_id,
            "first": min(page_size, max_streams - len(all_streams))
        }
        if after:
            params["after"] = after

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        batch = data.get("data", [])
        if not batch:
            break

        all_streams.extend(batch)
        after = data.get("pagination", {}).get("cursor")
        if not after:
            break

    return all_streams[:max_streams]

def score_games(token, games, max_streams_per_game=200):
    results = []
    for game in tqdm(games, desc="Scoring games", unit="game"):
        streams = get_streams_for_game(token, game["id"], max_streams=max_streams_per_game)

        streamer_count = len(streams)
        viewer_counts = [s.get("viewer_count", 0) for s in streams]
        total_viewers = sum(viewer_counts)
        median_viewers = median(viewer_counts) if viewer_counts else 0

        genre = GENRE_LOOKUP.get(game["name"].lower(), "Other")

        results.append({
            "id": game["id"],
            "name": game["name"],
            "streamer_count": streamer_count,
            "total_viewers": total_viewers,
            "median_viewers": round(median_viewers, 2),
            "genre": genre
        })
    return results

def compute_score(game):
    median = max(game["median_viewers"], 0)
    streamers = game["streamer_count"]

    # Base score from median viewers
    raw = math.log10(median + 1) * 78

    # Penalize games below the streamer floor
    if streamers < STREAMER_FLOOR:
        penalty = streamers / STREAMER_FLOOR
        raw *= penalty

    return max(0, min(100, round(raw)))

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@app.route("/api/games", methods=["GET"])
def get_games():
    if not os.path.exists(CACHE_PATH):
        return jsonify({"error": "Cache not ready"}), 503

    with open(CACHE_PATH, "r") as f:
        data = json.load(f)

    return jsonify(data)

def refresh_cache(max_games=300, max_streams_per_game=7000):
    token = get_app_token()
    games = get_top_games(token, max_games=max_games)
    scored = score_games(token, games, max_streams_per_game=max_streams_per_game)

    for g in scored:
        g["score"] = compute_score(g)

    scored.sort(key=lambda g: g["score"], reverse=True)

    os.makedirs("cache", exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump({"updated": datetime.now().isoformat(), "games": scored}, f, indent=2)

    print(f"Wrote {len(scored)} games to {CACHE_PATH}")
    for g in scored[:10]:
        print(f"{g['name']}: score {g['score']} (median {g['median_viewers']}, {g['streamer_count']} streamers, {g['total_viewers']} viewers, genre {g['genre']})")

    return scored

# Build cache on startup if it doesn't exist
if not os.path.exists(CACHE_PATH):
    print("No cache found, building on startup...")
    try:
        refresh_cache()
    except Exception as e:
        print("Startup cache refresh failed:", e)

def scheduled_refresh():
    while True:
        now = datetime.utcnow()
        next_run = now.replace(hour=0, minute=0, second=0, microsecond=0)
        if now >= next_run:
            next_run += timedelta(days=1)
        sleep_seconds = (next_run - now).total_seconds()
        print(f"Next cache refresh in {sleep_seconds / 3600:.1f} hours", flush=True)
        time.sleep(sleep_seconds)
        try:
            print("Running scheduled cache refresh...", flush=True)
            refresh_cache(max_games=300, max_streams_per_game=7000)
            print("Cache refresh complete", flush=True)
        except Exception as e:
            print(f"Scheduled refresh failed: {e}", flush=True)

threading.Thread(target=scheduled_refresh, daemon=True).start()

if __name__ == "__main__":
    refresh_cache()
    # app.run() only matters for local dev; gunicorn handles the real server on Railway
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)