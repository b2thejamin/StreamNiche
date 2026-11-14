import { useEffect, useState } from "react";
import "./App.css";
import Detail from "./Detail";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function App() {
    const [games, setGames] = useState([]);
    const [search, setSearch] = useState("");
    const [genre, setGenre] = useState("All");
    const [sortBy, setSortBy] = useState("score");
    const [sortDir, setSortDir] = useState("desc");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/games`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                return res.json();
            })
            .then((data) => setGames(data.games || []))
            .catch((err) => {
                console.error("Failed to fetch games from", `${API_BASE}/api/games`, err);
                setGames([]);
            });
    }, []);

    const genres = ["All", ...new Set(games.map((g) => g.genre).filter(Boolean))].sort((a, b) => {
        if (a === "All") return -1;
        if (b === "All") return 1;
        return a.localeCompare(b);
    });

    const filtered = games.filter((g) => {
        const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
        const matchesGenre = genre === "All" || g.genre === genre;
        return matchesSearch && matchesGenre;
    });

    const sorted = [...filtered].sort((a, b) => {
        let aVal = 0, bVal = 0;
        if (sortBy === "streamers") {
            aVal = a.streamer_count || 0;
            bVal = b.streamer_count || 0;
        } else if (sortBy === "viewers") {
            aVal = a.total_viewers || 0;
            bVal = b.total_viewers || 0;
        } else {
            aVal = a.score || 0;
            bVal = b.score || 0;
        }
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

    const display = sorted.slice(0, 10);

    const scoreColor = (score) => {
        if (score >= 90) return "#22c55e";
        if (score >= 70) return "#84cc16";
        if (score >= 50) return "#eab308";
        if (score >= 30) return "#f97316";
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
                <img src="/streamniche-logo.png" alt="StreamNiche" className="logo" />
            </div>

            <div className="controls" style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
                <input
                    className="search control-input"
                    placeholder="Search games..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: "6px", background: "#1e1e1e", color: "#fff", width: "220px", flex: "0 0 auto" }}
                />

                <select
                    className="control-select"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", background: "#1e1e1e", color: "#fff", flexShrink: 0 }}
                >
                    {genres.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>

                <select
                    className="control-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", background: "#1e1e1e", color: "#fff", flexShrink: 0 }}
                >
                    <option value="score">Score</option>
                    <option value="streamers">Streamers</option>
                    <option value="viewers">Viewers</option>
                </select>

                <button
                    className="sort-btn"
                    onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
                    style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: "#2a2a2a",
                        color: "#fff",
                        cursor: "pointer",
                        flexShrink: 0,
                        whiteSpace: "nowrap"
                    }}
                >
                    {sortDir === "desc" ? "High → Low" : "Low → High"}
                </button>
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