export default function Detail({ game, onBack }) {
    if (!game) return null;

    const scoreColor = (score) => {
        if (score >= 70) return "#22c55e";
        if (score >= 50) return "#eab308";
        return "#ef4444";
    };

    const getDescription = (g) => {
        const viewers = g.total_viewers?.toLocaleString() || "—";
        const streamers = g.streamer_count?.toLocaleString() || "—";
        if (g.score >= 70) {
            return `${g.name} earns a StreamNiche score of ${g.score}, indicating strong streaming interest with relatively low competition. With ${viewers} viewers and ${streamers} active streamers, it shows good potential for new streamers.`;
        } else if (g.score >= 50) {
            return `${g.name} earns a StreamNiche score of ${g.score}, indicating solid but competitive streaming interest. With ${viewers} viewers and ${streamers} active streamers, it shows engagement across the streaming ecosystem.`;
        } else {
            return `${g.name} earns a StreamNiche score of ${g.score}, indicating high competition relative to viewership. With ${viewers} viewers and ${streamers} active streamers, it may be harder for new streamers to gain visibility.`;
        }
    };

    return (
        <div className="detail-page">
            <h1 className="detail-logo">StreamNiche</h1>
            <div className="detail-header">
                <button className="back" onClick={onBack}>←</button>
                <h1 className="detail-title">{game.name}</h1>
            </div>
            <div className="detail-score" style={{ color: scoreColor(game.score) }}>
                {game.score}
            </div>
            <div className="detail-stats">
                <div>
                    <div className="stat-num">{game.total_viewers?.toLocaleString() || "—"}</div>
                    <div className="stat-label">Viewers</div>
                </div>
                <div>
                    <div className="stat-num">{game.streamer_count?.toLocaleString() || "—"}</div>
                    <div className="stat-label">Streamers</div>
                </div>
            </div>
            <p className="detail-desc">{getDescription(game)}</p>
            <div className="trend">
                <div className="trend-label">Score Trend (Last 7 Days)</div>
                <svg viewBox="0 0 300 60" className="sparkline">
                </svg>
            </div>
        </div>
    );
}