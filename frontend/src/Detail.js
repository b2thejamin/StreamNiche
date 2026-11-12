import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";

const Plot = createPlotlyComponent(Plotly);

export default function Detail({ game, onBack }) {
    if (!game) return null;

    const scoreColor = (score) => {
        if (score >= 90) return "#22c55e";
        if (score >= 70) return "#84cc16";
        if (score >= 50) return "#eab308";
        if (score >= 30) return "#f97316";
        return "#ef4444";
    };

    const getDescription = (g) => {
        const viewers = g.total_viewers?.toLocaleString() || "—";
        const streamers = g.streamer_count?.toLocaleString() || "—";
        if (g.score >= 90) {
            return `${g.name} earns a StreamNiche score of ${g.score}, indicating an excellent streaming opportunity with very low competition. With ${viewers} viewers and ${streamers} active streamers, it's an ideal pick for new streamers looking to stand out.`;
        } else if (g.score >= 70) {
            return `${g.name} earns a StreamNiche score of ${g.score}, indicating strong streaming interest with relatively low competition. With ${viewers} viewers and ${streamers} active streamers, it shows good potential for new streamers.`;
        } else if (g.score >= 50) {
            return `${g.name} earns a StreamNiche score of ${g.score}, indicating solid but competitive streaming interest. With ${viewers} viewers and ${streamers} active streamers, it shows engagement across the streaming ecosystem.`;
        } else if (g.score >= 30) {
            return `${g.name} earns a StreamNiche score of ${g.score}, indicating weaker streaming interest and noticeable competition. With ${viewers} viewers and ${streamers} active streamers, new streamers may find it harder to stand out here.`;
        } else {
            return `${g.name} earns a StreamNiche score of ${g.score}, indicating high competition relative to viewership. With ${viewers} viewers and ${streamers} active streamers, it may be harder for new streamers to gain visibility.`;
        }
    };

    // TODO: replace with real historical data from the backend once available.
    const trendData = game.score_history || [
        { date: "2026-11-03", score: 61 },
        { date: "2026-11-04", score: 64 },
        { date: "2026-11-05", score: 58 },
        { date: "2026-11-06", score: 70 },
        { date: "2026-11-07", score: 73 },
        { date: "2026-11-08", score: 69 },
        { date: "2026-11-09", score: game.score },
    ];

    const renderTrendChart = () => {
        if (!trendData || trendData.length === 0) {
            return <div className="trend-empty">No trend data yet</div>;
        }

        return (
            <Plot
                data={[
                    {
                        x: trendData.map((d) => d.date),
                        y: trendData.map((d) => d.score),
                        type: "scatter",
                        mode: "lines+markers",
                        line: { color: "#7C22FD", width: 2 },
                        marker: { color: "#7C22FD", size: 6 },
                        hovertemplate: "%{x}<br>Score: %{y}<extra></extra>",
                    },
                ]}
                layout={{
                    autosize: true,
                    height: 220,
                    margin: { l: 36, r: 16, t: 10, b: 36 },
                    paper_bgcolor: "#1a1a1a",
                    plot_bgcolor: "#1a1a1a",
                    font: { color: "#eee", size: 12 },
                    xaxis: {
                        gridcolor: "#333",
                        zerolinecolor: "#333",
                        tickfont: { color: "#999" },
                        tickformat: "%b %-d",
                    },
                    yaxis: {
                        gridcolor: "#333",
                        zerolinecolor: "#333",
                        tickfont: { color: "#999" },
                        range: [0, 100],
                    },
                    hoverlabel: {
                        bgcolor: "#000000",
                        bordercolor: "#7C22FD",
                        font: { color: "#eee" },
                    },
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
            />
        );
    };

    return (
        <div className="detail-page">
            <img src="/streamniche-logo.png" alt="StreamNiche" className="detail-logo" />
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
                <div className="trend-chart">
                    {renderTrendChart()}
                </div>
            </div>
        </div>
    );
}