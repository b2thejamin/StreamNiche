import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";

const Plot = createPlotlyComponent(Plotly);

const parseDateUTC = (str) => new Date(`${str}T00:00:00Z`);
const formatDateUTC = (date) => date.toISOString().slice(0, 10);

const slugifyGameName = (name) => {
    if (!name) return "";
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
};

const buildSevenDayTrend = (history) => {
    if (!history || history.length === 0) return [];

    const sorted = [...history].sort(
        (a, b) => parseDateUTC(a.date) - parseDateUTC(b.date)
    );
    const byDate = new Map(sorted.map((d) => [d.date, d.score]));
    const oldestScore = sorted[0].score;
    const lastDate = parseDateUTC(sorted[sorted.length - 1].date);

    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(lastDate);
        d.setUTCDate(d.getUTCDate() - i);
        const dateStr = formatDateUTC(d);
        const score = byDate.has(dateStr) ? byDate.get(dateStr) : oldestScore;
        result.push({ date: dateStr, score });
    }
    return result;
};

export default function Detail({ game, onBack }) {
    if (!game) return null;

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

    const trendData = buildSevenDayTrend(game.score_history || []);

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
                        line: { color: "#7C22FD", width: 3 },
                        marker: { color: "#7C22FD", size: 9, line: { color: "#000000", width: 1 } },
                        hoverinfo: "skip",
                    },
                ]}
                layout={{
                    autosize: true,
                    margin: { l: 36, r: 12, t: 16, b: 44 },
                    paper_bgcolor: "rgba(0,0,0,0)",
                    plot_bgcolor: "rgba(0,0,0,0)",
                    font: { color: "#ffffff", size: 14 },
                    dragmode: false,
                    hovermode: false,
                    xaxis: {
                        gridcolor: "#333",
                        zerolinecolor: "#333",
                        tickfont: { color: "#ccc", size: 13 },
                        tickformat: "%b %-d",
                        type: "date",
                        fixedrange: true,
                    },
                    yaxis: {
                        gridcolor: "#333",
                        zerolinecolor: "#333",
                        tickfont: { color: "#ccc", size: 13 },
                        range: [0, 100],
                        fixedrange: true,
                        nticks: 6,
                    },
                }}
                config={{
                    displayModeBar: false,
                    responsive: true,
                    staticPlot: true,
                    scrollZoom: false,
                    doubleClick: false,
                    showTips: false,
                }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
            />
        );
    };

    return (
        <div className="detail-page">
            <img src="/streamniche-logo.png" alt="StreamNiche" className="detail-logo" />
            <div className="detail-header">
                <button className="back" onClick={onBack} aria-label="Back to list">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <a
                    className="detail-title-link"
                    href={`https://www.twitch.tv/directory/category/${slugifyGameName(game.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h1 className="detail-title">{game.name}</h1>
                </a>
            </div>
            <div className="detail-main">
                {game.box_art_url ? (
                    <img src={game.box_art_url} alt={`${game.name} box art`} className="detail-box-art" />
                ) : (
                    <div className="detail-box-art detail-box-art-placeholder" aria-hidden="true" />
                )}
                <div className="detail-main-info">
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
                            <div className="stat-label">
                                Streamers
                            </div>
                        </div>
                    </div>
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