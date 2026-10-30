import os
import requests
from dotenv import load_dotenv
from datetime import datetime
import json
import pandas as pd
import ast

load_dotenv()
CLIENT_ID = os.getenv("TWITCH_CLIENT_ID")
CLIENT_SECRET = os.getenv("TWITCH_CLIENT_SECRET")

try:
    genre_df = pd.read_csv("genres.csv", low_memory=False)
    GENRE_LOOKUP = {}
    for _, row in genre_df.iterrows():
        game_name = str(row["name"]).lower()
        raw = row["genres"]
        if pd.isna(raw) or not isinstance(raw, str) or raw.strip() == "":
            genre = "Other"
        else:
            genre = raw.split("|")[0].strip()
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

def get_top_games(token, first=100):
    url = "https://api.twitch.tv/helix/games/top"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}"
    }
    params = {"first": first}
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()["data"]

def get_streams_for_game(token, game_id, first=100):
    url = "https://api.twitch.tv/helix/streams"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}"
    }
    params = {"game_id": game_id, "first": first}
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()["data"]

def score_games(token, games):
    results = []
    for game in games:
        streams = get_streams_for_game(token, game["id"])
        streamer_count = len(streams)
        total_viewers = sum(s.get("viewer_count", 0) for s in streams)
        ratio = total_viewers / streamer_count if streamer_count > 0 else 0
        genre = GENRE_LOOKUP.get(game["name"].lower(), "Other")
        results.append({
            "id": game["id"],
            "name": game["name"],
            "streamer_count": streamer_count,
            "total_viewers": total_viewers,
            "ratio": round(ratio, 2),
            "genre": genre
        })
    return results

if __name__ == "__main__":
    token = get_app_token()
    games = get_top_games(token, first=100)
    scored = score_games(token, games)

    for g in scored:
        g["score"] = min(100, round(g["ratio"] / 10))

    scored.sort(key=lambda g: g["score"], reverse=True)

    cache_path = "cache/games.json"
    os.makedirs("cache", exist_ok=True)
    with open(cache_path, "w") as f:
        json.dump({"updated": datetime.now().isoformat(), "games": scored}, f, indent=2)

    print(f"Wrote {len(scored)} games to {cache_path}")
    for g in scored[:10]:
        print(f"{g['name']}: score {g['score']} (ratio {g['ratio']}, {g['streamer_count']} streamers, {g['total_viewers']} viewers, genre {g['genre']})")