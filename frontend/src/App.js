import { useEffect, useState } from "react";
import "./App.css";
import Detail from "./Detail";

function App() {
    const [games, setGames] = useState([]);
    const [search, setSearch] = useState("");
    const [genre, setGenre] = useState("All");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetch("/games.json")
            .then((res) => res.json())
            .then((data) => setGames(data.games || []))
            .catch(() => setGames([]));
    }, []);

    const genres = ["All", ...new Set(games.map((g) => g.genre).filter(Boolean))];

    const filtered = games.filter((g) => {
        const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
        const matchesGenre = genre === "All" || g.genre === genre;
        return matchesSearch && matchesGenre;
    });

    const display = search === "" ? filtered.slice(0, 10) : filtered;

    const scoreColor = (score) => {
        if (score >= 70) return "#22c55e";
        if (score >= 50) return "#eab308";
        return "#ef4444";
    };

    if (selected) {
        return (
            <div className="app">
                <Detail game={selected} onBack={() => setSelected(null)} />
            </div>
        );
    }

    return (
        <div className="app">
            <div className="header">
                <h1 className="logo">StreamNiche</h1>
                <div className="search-wrap">
                    <input
                        className="search"
                        placeholder="Search games..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="filters">
                {genres.map((g) => (
                    <button
                        key={g}
                        className={`filter ${genre === g ? "active" : ""}`}
                        onClick={() => setGenre(g)}
                    >
                        {g}
                    </button>
                ))}
            </div>

            <div className="list">
                {display.map((g) => (
                    <div
                        key={g.id}
                        className="row"
                        onClick={() => setSelected(g)}
                    >
                        <div className="name">{g.name}</div>
                        <div className="score" style={{ color: scoreColor(g.score) }}>
                            {g.score}
                        </div>
                        <div className="meta">
                            <span>{g.total_viewers?.toLocaleString() || "—"} viewers</span>
                            <span>{g.streamer_count?.toLocaleString() || "—"} streamers</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;