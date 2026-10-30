import { useEffect, useState } from "react";

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

    return (
        <div style={{ padding: 20, fontFamily: "sans-serif" }}>
            <h1>StreamNiche</h1>

            <input
                placeholder="Search game..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: 16, padding: 8, width: 300 }}
            />

            <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                style={{ marginLeft: 8, padding: 8 }}
            >
                {genres.map((g) => (
                    <option key={g} value={g}>
                        {g}
                    </option>
                ))}
            </select>

            <ul style={{ listStyle: "none", padding: 0 }}>
                {display.map((g) => (
                    <li
                        key={g.id}
                        onClick={() => setSelected(g)}
                        style={{
                            padding: 12,
                            marginBottom: 8,
                            border: "1px solid #ccc",
                            cursor: "pointer",
                            background: selected?.id === g.id ? "#f0f0f0" : "white",
                        }}
                    >
                        <strong>{g.name}</strong> — Score: {g.score} | {g.streamer_count} streamers | {g.total_viewers} viewers
                    </li>
                ))}
            </ul>

            {selected && (
                <div style={{ marginTop: 20, padding: 16, border: "1px solid #999" }}>
                    <button
                        onClick={() => setSelected(null)}
                        style={{ float: "right", padding: "4px 8px" }}
                    >
                        Close
                    </button>
                    <h2>{selected.name}</h2>
                    <p>Score: {selected.score}</p>
                    <p>Streamers: {selected.streamer_count}</p>
                    <p>Viewers: {selected.total_viewers}</p>
                    <p>Ratio: {selected.ratio}</p>
                    <p>Genre: {selected.genre}</p>
                </div>
            )}
        </div>
    );
}

export default App;