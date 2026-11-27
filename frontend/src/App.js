import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Detail from "./Detail";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 10;

// redeploy 
function App() {
    const [games, setGames] = useState([]);
    const [search, setSearch] = useState("");
    const [genre, setGenre] = useState("All");
    const [sortBy, setSortBy] = useState("score");
    const [selected, setSelected] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [now, setNow] = useState(Date.now());
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetch(`${API_BASE}/api/games`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setGames(data.games || []);
                const updatedTime = data.updated ? new Date(data.updated).getTime() : null;
                setLastUpdated(Number.isNaN(updatedTime) ? null : updatedTime);
            })
            .catch((err) => {
                console.error("Failed to fetch games from", `${API_BASE}/api/games`, err);
                setGames([]);
            });
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, genre, sortBy]);

    const getUpdatedLabel = () => {
        if (!lastUpdated) return "Updating...";
        const diffMs = now - lastUpdated;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Twitch data updated just now";
        if (diffMin === 1) return "Twitch data updated 1 minute ago";
        if (diffMin < 60) return `Twitch data updated ${diffMin} minutes ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr === 1) return "Twitch data updated 1 hour ago";
        if (diffHr < 24) return `Twitch data updated ${diffHr} hours ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay === 1) return "Twitch data updated 1 day ago";
        return `Twitch data updated ${diffDay} days ago`;
    };

    const genres = useMemo(() => {
        return ["All", ...new Set(games.map((g) => g.genre).filter(Boolean))].sort((a, b) => {
            if (a === "All") return -1;
            if (b === "All") return 1;
            return a.localeCompare(b);
        });
    }, [games]);

    const sortedFiltered = useMemo(() => {
        const filtered = games.filter((g) => {
            const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
            const matchesGenre = genre === "All" || g.genre === genre;
            return matchesSearch && matchesGenre;
        });

        return [...filtered].sort((a, b) => {
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
            return bVal - aVal;
        });
    }, [games, search, genre, sortBy]);

    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);

    const display = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedFiltered.slice(start, start + PAGE_SIZE);
    }, [sortedFiltered, currentPage]);

    const scoreColor = (score) => {
        if (score >= 90) return "#00e676"; // electric green
        if (score >= 80) return "#39ff14"; // neon green
        if (score >= 70) return "#b8ff00"; // vivid lime
        if (score >= 60) return "#ffe600"; // bright yellow
        if (score >= 50) return "#ffab00"; // vivid amber
        if (score >= 40) return "#ff6d00"; // punchy orange
        if (score >= 30) return "#ff3d00"; // intense orange-red
        if (score >= 20) return "#ff1744"; // vivid red
        if (score >= 10) return "#d50000"; // deep red
        return "#9e2a2b"; // muted red
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

            <p className="tagline">
                StreamNiche scores games by viewership vs. competition. Higher scores mean better opportunities for new streamers. <span className="refresh-indicator">{getUpdatedLabel()}</span>
            </p>

            <div className="controls">
                <input
                    className="search control-input"
                    placeholder="Search games..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: "6px 12px", borderRadius: "6px", background: "#1e1e1e", color: "#ffffff", width: "190px", flex: "0 0 auto" }}
                />

                <select
                    className="control-select"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", background: "#1e1e1e", color: "#ffffff", flexShrink: 0 }}
                >
                    {genres.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>

                <select
                    className="control-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "6px", background: "#1e1e1e", color: "#ffffff", flexShrink: 0 }}
                >
                    <option value="score">Score</option>
                    <option value="streamers">Streamers</option>
                    <option value="viewers">Viewers</option>
                </select>

                <a
                    href="https://clipsistent.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="promo"
                >
                    <span className="promo-title">Try clipsistent.com</span>
                    <span className="promo-sub">Daily clips, posted automatically.</span>
                </a>
            </div>

            <div className="list">
                {display.map((g) => (
                    <div
                        key={g.id}
                        className="row"
                        onClick={() => setSelected(g)}
                    >
                        <div className="name-wrap">
                            {g.box_art_url ? (
                                <img src={g.box_art_url} alt={`${g.name} box art`} className="box-art" />
                            ) : (
                                <div className="box-art box-art-placeholder" aria-hidden="true" />
                            )}
                            <div className="name">{g.name}</div>
                        </div>
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

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        ← Previous
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="page-btn"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;