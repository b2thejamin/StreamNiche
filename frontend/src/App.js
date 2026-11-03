import { useEffect, useState } from "react";
import "./App.css";
 
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
                        className={`row ${selected?.id === g.id ? "selected" : ""}`}
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

            {selected && (
                <div className="detail">
                    <button className="close" onClick={() => setSelected(null)}>
                        Close
                    </button>
                    <h2>{selected.name}</h2>
                    <p>
                        Score: <span style={{ color: scoreColor(selected.score) }}>{selected.score}</span>
                    </p>
                    <p>Streamers: {selected.streamer_count}</p>
                    <p>Viewers: {selected.total_viewers?.toLocaleString()}</p>
                    <p>Ratio: {selected.ratio}</p>
                    <p>Genre: {selected.genre}</p>
                </div>
            )}
        </div>
    );
}

export default App;