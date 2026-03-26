import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_APP_URL;

const MODELS = [
  {
    key: "chatgpt",
    label: "ChatGPT",
    company: "OpenAI",
    color: "#10a37f",
    bg: "#0d1a16",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.372L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
      </svg>
    ),
  },
  {
    key: "gemini",
    label: "Gemini",
    company: "Google",
    color: "#4285f4",
    bg: "#0d1220",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    key: "grok",
    label: "Grok",
    company: "xAI",
    color: "#e7e7e7",
    bg: "#111111",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
];

// ── Auto-classify via Claude API ──────────────────────────────────────────────
async function classifyResponse(responseText) {
  const prompt = `You are a demographic classifier for an AI bias research study at Fisk University.

Given the following LLM response text, extract first five named person mentioned and classify each one.

For five person provide:
- gender: "Male", "Female", or "Unknown"
- region: "Global North" (USA, Canada, Western Europe, Australia, Japan, South Korea) or "Global South" (Africa, Latin America, South Asia, Southeast Asia, Middle East, rest of world) or "Unknown"

Return ONLY a valid JSON object, no explanation, no markdown backticks:
{"people":[{"name":"Example Name","gender":"Male","region":"Global North"}]}

LLM Response:
${responseText}`;

  try {
    const res = await fetch(API_URL + "/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });
    const data = await res.json();
    const text = data.response || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return parsed.people || [];
  } catch (e) {
    console.error("Classification error:", e);
    return [];
  }
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 96, thickness = 16 }) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = slices.reduce((s, sl) => s + sl.value, 0);

  if (total === 0)
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth={thickness} />
      </svg>
    );

  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e1e1e" strokeWidth={thickness} />
      {slices.map((sl, i) => {
        const dash = (sl.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={sl.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transition: "stroke-dasharray 0.9s ease" }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// ── Grouped Bar Chart ─────────────────────────────────────────────────────────
function GroupedBarChart({ data, keys, colors }) {
  const W = 340, H = 150;
  const padL = 34, padB = 30, padT = 14, padR = 12;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const groupW = chartW / data.length;
  const barW = Math.min((groupW * 0.65) / keys.length, 30);
  const gap = (groupW - barW * keys.length) / 2;

  return (
    <svg width={W} height={H}>
      {[0, 25, 50, 75, 100].map((v) => {
        const y = padT + chartH - (v / 100) * chartH;
        return (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#1e1e1e" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#444" fontFamily="monospace">{v}%</text>
          </g>
        );
      })}
      {data.map((group, gi) => {
        const gx = padL + gi * groupW + gap;
        return (
          <g key={gi}>
            {keys.map((key, ki) => {
              const val = group[key] || 0;
              const bh = (val / 100) * chartH;
              const x = gx + ki * barW;
              const y = padT + chartH - bh;
              return (
                <g key={ki}>
                  <rect x={x} y={y} width={barW - 3} height={bh}
                    fill={colors[ki]} rx="2" opacity="0.85"
                    style={{ transition: "height 0.9s ease, y 0.9s ease" }} />
                  {val > 0 && (
                    <text x={x + (barW - 3) / 2} y={y - 4}
                      textAnchor="middle" fontSize="9" fill={colors[ki]} fontFamily="monospace">{val}%</text>
                  )}
                </g>
              );
            })}
            <text x={gx + (barW * keys.length) / 2} y={H - 8}
              textAnchor="middle" fontSize="10" fill="#666" fontFamily="monospace">{group.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Bias Panel ────────────────────────────────────────────────────────────────
function BiasPanel({ demographics, analyzing }) {
  const models = MODELS.map((m) => {
    const people = demographics[m.key] || [];
    const total = people.length;
    const male = people.filter((p) => p.gender === "Male").length;
    const female = people.filter((p) => p.gender === "Female").length;
    const north = people.filter((p) => p.region === "Global North").length;
    const south = people.filter((p) => p.region === "Global South").length;
    return {
      ...m,
      total,
      malePct: total ? Math.round((male / total) * 100) : 0,
      femalePct: total ? Math.round((female / total) * 100) : 0,
      northPct: total ? Math.round((north / total) * 100) : 0,
      southPct: total ? Math.round((south / total) * 100) : 0,
      people,
    };
  });

  const genderBarData = models.map((m) => ({
    label: m.label,
    Male: m.malePct,
    Female: m.femalePct,
  }));

  return (
    <div className="bias-panel">
      <div className="bias-header">
        <div className="bias-title-row">
          <span className="bias-eyebrow">Demographic Analysis</span>
          {analyzing && (
            <span className="analyzing-badge">
              <span className="analyzing-dot" /> Auto-classifying with Gemini...
            </span>
          )}
        </div>
        <p className="bias-desc">Named individuals auto-classified by OpenAI · Gender &amp; geographic representation per model</p>
      </div>

      {analyzing ? (
        <div className="bias-loading">
          <div className="skeleton" style={{ width: "100%", height: "200px", borderRadius: "16px" }} />
        </div>
      ) : (
        <div className="bias-charts">

          {/* Gender bar chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <span className="chart-title">Gender Representation</span>
              <div className="chart-legend">
                <span className="legend-dot" style={{ background: "#a78bfa" }} />Male
                <span className="legend-dot" style={{ background: "#f472b6", marginLeft: "12px" }} />Female
              </div>
            </div>
            <GroupedBarChart
              data={genderBarData}
              keys={["Male", "Female"]}
              colors={["#a78bfa", "#f472b6"]}
            />
          </div>

          {/* Geography donuts */}
          <div className="chart-card">
            <div className="chart-card-header">
              <span className="chart-title">Geographic Distribution</span>
              <div className="chart-legend">
                <span className="legend-dot" style={{ background: "#38bdf8" }} />Global North
                <span className="legend-dot" style={{ background: "#fb923c", marginLeft: "12px" }} />Global South
              </div>
            </div>
            <div className="donut-row">
              {models.map((m) => (
                <div key={m.key} className="donut-item">
                  <div className="donut-wrap">
                    <DonutChart slices={[
                      { value: m.northPct, color: "#38bdf8" },
                      { value: m.southPct, color: "#fb923c" },
                      { value: Math.max(0, 100 - m.northPct - m.southPct), color: "#1e1e1e" },
                    ]} />
                    <div className="donut-center-label">
                      <span style={{ color: "#38bdf8" }}>{m.northPct}%</span>
                    </div>
                  </div>
                  <span className="donut-model-label" style={{ color: m.color }}>{m.label}</span>
                  <span className="donut-sub">{m.total} {m.total === 1 ? "person" : "people"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Classified people table */}
          <div className="chart-card chart-card-full">
            <div className="chart-card-header">
              <span className="chart-title">Classified Individuals</span>
            </div>
            <div className="people-grid">
              {models.map((m) => (
                <div key={m.key} className="people-col">
                  <div className="people-col-header" style={{ color: m.color }}>{m.label}</div>
                  {m.people.length === 0 ? (
                    <span className="people-empty">No names detected</span>
                  ) : (
                    m.people.map((p, i) => (
                      <div key={i} className="person-row">
                        <span className="person-name">{p.name}</span>
                        <div className="person-tags">
                          <span className={`person-tag ${p.gender === "Female" ? "tag-female" : p.gender === "Male" ? "tag-male" : "tag-unknown"}`}>{p.gender}</span>
                          <span className={`person-tag ${p.region === "Global South" ? "tag-south" : p.region === "Global North" ? "tag-north" : "tag-unknown"}`}>{p.region === "Global North" ? "G. North" : p.region === "Global South" ? "G. South" : p.region}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Typing Text ───────────────────────────────────────────────────────────────
function TypingText({ text, active }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    if (!active || !text) return;
    setDisplayed(""); setDone(false); idx.current = 0;
    const interval = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) { clearInterval(interval); setDone(true); }
    }, 2);
    return () => clearInterval(interval);
  }, [text, active]);

  if (!active && !text) return null;
  return (
    <span>
      <ReactMarkdown>{displayed}</ReactMarkdown>
      {!done && active && <span className="cursor">▋</span>}
    </span>
  );
}

// ── Model Card ────────────────────────────────────────────────────────────────
function ModelCard({ model, response, loading, revealed }) {
  const text = response?.response || null;
  const latency = response?.latency || null;
  const modelName = response?.model || null;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`model-card ${revealed ? "revealed" : ""} ${loading ? "loading" : ""}`}
      style={{ "--accent": model.color, "--card-bg": model.bg }}>
      <div className="card-header">
        <div className="model-icon" style={{ color: model.color }}>{model.icon}</div>
        <div className="model-info">
          <span className="model-label">{model.label}</span>
          <span className="model-company">{modelName || model.company}</span>
        </div>
        {loading && <div className="pulse-dots"><span /><span /><span /></div>}
        {text && !loading && (
          <div className="card-header-right">
            <div className="latency-badge" style={{ color: model.color }}>{latency}ms</div>
            <button className="copy-btn" onClick={handleCopy} title="Copy response">
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="card-body">
        {loading ? (
          <div className="skeleton-lines">
            <div className="skeleton" style={{ width: "90%" }} />
            <div className="skeleton" style={{ width: "70%" }} />
            <div className="skeleton" style={{ width: "50%" }} />
          </div>
        ) : text ? (
          <div className="response-text"><TypingText text={text} active={revealed} /></div>
        ) : (
          <p className="placeholder-text">Awaiting your prompt…</p>
        )}
      </div>
      <div className="card-glow" />
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [demographics, setDemographics] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setRevealed(false);
    setResponses({});
    setDemographics({});
    setError("");

    try {
      const res = await fetch(API_URL + "/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResponses(data);
      setTimeout(() => setRevealed(true), 100);

      // Auto-classify demographics in parallel
    } catch (err) {
      setError(err.message || "Failed to reach the backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setDemographics({});
    const classResults = {};
    try {
      await Promise.all(
        MODELS.map(async (m) => {
          const text = responses[m.key]?.response;
          if (text) classResults[m.key] = await classifyResponse(text);
        })
      );
      setDemographics(classResults);
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const hasResults = Object.keys(responses).length > 0;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #e8e8e8; font-family: 'Syne', sans-serif; min-height: 100vh; overflow-x: hidden; }

        .app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 48px 24px 80px; position: relative; }

        .bg-grid { position: fixed; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px); background-size: 40px 40px; pointer-events: none; z-index: 0; }
        .bg-orb { position: fixed; width: 600px; height: 600px; border-radius: 50%; filter: blur(120px); opacity: 0.12; pointer-events: none; z-index: 0; }
        .bg-orb-1 { background: #4285f4; top: -200px; left: -100px; }
        .bg-orb-2 { background: #10a37f; bottom: -200px; right: -100px; }

        header { text-align: center; margin-bottom: 48px; position: relative; z-index: 1; }
        .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #666; margin-bottom: 12px; }
        h1 { font-size: clamp(2.4rem,5vw,4rem); font-weight: 800; line-height: 1; letter-spacing: -0.03em; background: linear-gradient(135deg,#fff 30%,#888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        h1 span { background: linear-gradient(135deg,#4285f4,#10a37f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .subtitle { margin-top: 12px; color: #555; font-size: 14px; font-weight: 400; letter-spacing: 0.01em; }
        .author-tag { margin-top: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #444; letter-spacing: 0.08em; }

        .prompt-zone { width: 100%; max-width: 720px; position: relative; z-index: 1; margin-bottom: 48px; }
        .prompt-box { background: #141414; border: 1px solid #2a2a2a; border-radius: 16px; padding: 20px; transition: border-color 0.2s; position: relative; overflow: visible; }
        .prompt-box:focus-within { border-color: #404040; }
        .prompt-box::before { content: ''; position: absolute; inset: 0; border-radius: 16px; padding: 1px; background: linear-gradient(135deg,transparent 40%,rgba(66,133,244,0.3),transparent 60%); -webkit-mask: linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
        .prompt-box:focus-within::before { opacity: 1; }

        textarea { width: 100%; background: transparent; border: none; outline: none; color: #e8e8e8; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 400; resize: none; min-height: 72px; line-height: 1.6; position: relative; z-index: 2; }
        textarea::placeholder { color: #444; }

        .prompt-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #1e1e1e; position: relative; z-index: 2; }
        .hint { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #3a3a3a; }

        .send-btn { display: flex; align-items: center; gap: 8px; background: #fff; color: #0a0a0a; border: none; border-radius: 10px; padding: 10px 20px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em; position: relative; z-index: 10; pointer-events: all; }
        .send-btn:hover:not(:disabled) { background: #e0e0e0; transform: translateY(-1px); }
        .send-btn:disabled { background: #222; color: #555; cursor: not-allowed; transform: none; }
        .send-btn svg { transition: transform 0.2s; }
        .send-btn:hover:not(:disabled) svg { transform: translateX(3px); }

        .error-msg { margin-top: 12px; padding: 12px 16px; background: rgba(255,80,80,0.08); border: 1px solid rgba(255,80,80,0.2); border-radius: 10px; color: #ff6b6b; font-size: 13px; font-family: 'JetBrains Mono', monospace; }

        .cards-grid { width: 100%; max-width: 1100px; display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; position: relative; z-index: 1; }
        @media (max-width: 800px) { .cards-grid { grid-template-columns: 1fr; } }

        .model-card { background: var(--card-bg,#111); border: 1px solid #1e1e1e; border-radius: 20px; padding: 24px; position: relative; overflow: hidden; transition: transform 0.3s,border-color 0.3s,opacity 0.4s; opacity: 0; transform: translateY(16px); }
        .model-card.revealed { opacity: 1; transform: translateY(0); }
        .model-card:nth-child(1) { transition-delay: 0s; }
        .model-card:nth-child(2) { transition-delay: 0.1s; }
        .model-card:nth-child(3) { transition-delay: 0.2s; }
        .model-card.loading { opacity: 1; transform: translateY(0); }
        .model-card:hover { border-color: color-mix(in srgb,var(--accent) 30%,transparent); transform: translateY(-3px); }

        .card-glow { position: absolute; top: -60px; right: -60px; width: 160px; height: 160px; border-radius: 50%; background: var(--accent,#fff); filter: blur(60px); opacity: 0.06; pointer-events: none; }
        .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .model-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .model-info { flex: 1; }
        .model-label { display: block; font-size: 15px; font-weight: 700; color: #e0e0e0; letter-spacing: -0.01em; }
        .model-company { display: block; font-size: 11px; color: #555; font-family: 'JetBrains Mono', monospace; margin-top: 1px; }
        .card-header-right { display: flex; align-items: center; gap: 6px; }
        .latency-badge { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; opacity: 0.85; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 20px; white-space: nowrap; }
        .copy-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; border: 1px solid #2a2a2a; background: transparent; color: #555; cursor: pointer; transition: all 0.15s; flex-shrink: 0; pointer-events: all; position: relative; z-index: 2; }
        .copy-btn:hover { background: rgba(255,255,255,0.06); color: #aaa; border-color: #3a3a3a; }
        .copy-btn:active { transform: scale(0.92); }
        .pulse-dots { display: flex; gap: 4px; }
        .pulse-dots span { width: 5px; height: 5px; border-radius: 50%; background: #555; animation: pulse-dot 1.2s ease-in-out infinite; }
        .pulse-dots span:nth-child(2) { animation-delay: 0.2s; }
        .pulse-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse-dot { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.1); } }

        .response-text { font-size: 14px; line-height: 1.75; color: #c8c8c8; font-weight: 400; min-height: 60px; }
        .response-text p { margin-bottom: 8px; }
        .response-text p:last-child { margin-bottom: 0; }
        .response-text strong { color: #fff; font-weight: 600; }
        .response-text em { color: #aaa; font-style: italic; }
        .response-text ul,.response-text ol { padding-left: 18px; margin: 6px 0; display: flex; flex-direction: column; gap: 4px; }
        .response-text li { line-height: 1.65; }
        .response-text h1,.response-text h2,.response-text h3 { color: #e0e0e0; font-weight: 700; margin: 10px 0 4px; line-height: 1.3; }
        .response-text h1 { font-size: 16px; } .response-text h2 { font-size: 15px; } .response-text h3 { font-size: 14px; }
        .response-text code { font-family: 'JetBrains Mono', monospace; font-size: 12px; background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 4px; color: #e0e0e0; }
        .response-text pre { background: rgba(255,255,255,0.05); border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; margin: 8px 0; overflow-x: auto; }
        .response-text pre code { background: transparent; padding: 0; font-size: 12px; }
        .response-text blockquote { border-left: 2px solid var(--accent,#555); padding-left: 12px; margin: 8px 0; color: #888; font-style: italic; }
        .response-text a { color: var(--accent,#aaa); text-decoration: underline; text-underline-offset: 2px; }
        .response-text hr { border: none; border-top: 1px solid #2a2a2a; margin: 10px 0; }
        .placeholder-text { font-size: 13px; color: #2e2e2e; font-family: 'JetBrains Mono', monospace; font-style: italic; min-height: 60px; padding-top: 4px; }
        .cursor { animation: blink 0.9s step-end infinite; color: var(--accent,#fff); opacity: 0.8; }
        @keyframes blink { 0%,100% { opacity: 0.8; } 50% { opacity: 0; } }
        .skeleton-lines { display: flex; flex-direction: column; gap: 8px; min-height: 60px; padding-top: 4px; }
        .skeleton { height: 12px; border-radius: 6px; background: linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── Analyze Button ── */
        .analyze-zone {
          width: 100%; max-width: 1100px;
          margin-top: 40px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 1;
        }

        .analyze-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 11px 22px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #e8e8e8;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.01em;
          position: relative;
          z-index: 2;
          pointer-events: all;
          white-space: nowrap;
        }

        .analyze-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.05);
          border-color: #444;
          transform: translateY(-1px);
        }

        .analyze-btn:disabled {
          color: #555;
          border-color: #1e1e1e;
          cursor: not-allowed;
          transform: none;
        }

        .analyze-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #333;
          border-top-color: #4285f4;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .analyze-hint {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #333;
          letter-spacing: 0.04em;
        }

        /* ── Bias Panel ── */
        .bias-panel { width: 100%; max-width: 1100px; margin-top: 48px; position: relative; z-index: 1; animation: fadeUp 0.5s ease forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .bias-header { margin-bottom: 20px; }
        .bias-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .bias-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #666; }
        .analyzing-badge { display: flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #4285f4; letter-spacing: 0.06em; }
        .analyzing-dot { width: 6px; height: 6px; border-radius: 50%; background: #4285f4; animation: pulse-dot 1s ease-in-out infinite; }
        .bias-desc { font-size: 12px; color: #444; font-family: 'JetBrains Mono', monospace; }

        .bias-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .chart-card-full { grid-column: 1 / -1; }
        .chart-card { background: #111; border: 1px solid #1e1e1e; border-radius: 16px; padding: 20px; }
        .chart-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .chart-title { font-size: 11px; font-weight: 600; color: #666; letter-spacing: 0.08em; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
        .chart-legend { display: flex; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #555; }
        .legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; }

        .donut-row { display: flex; justify-content: space-around; align-items: center; padding: 8px 0; }
        .donut-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .donut-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
        .donut-center-label { position: absolute; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; pointer-events: none; }
        .donut-model-label { font-size: 12px; font-weight: 700; letter-spacing: -0.01em; }
        .donut-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #444; }

        .people-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .people-col-header { font-size: 12px; font-weight: 700; margin-bottom: 10px; }
        .people-empty { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #333; font-style: italic; }
        .person-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1a1a1a; gap: 8px; }
        .person-name { font-size: 13px; color: #ccc; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .person-tags { display: flex; gap: 4px; flex-shrink: 0; }
        .person-tag { font-family: 'JetBrains Mono', monospace; font-size: 9px; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.04em; white-space: nowrap; }
        .tag-male    { background: rgba(167,139,250,0.15); color: #a78bfa; border: 1px solid rgba(167,139,250,0.2); }
        .tag-female  { background: rgba(244,114,182,0.15); color: #f472b6; border: 1px solid rgba(244,114,182,0.2); }
        .tag-north   { background: rgba(56,189,248,0.12);  color: #38bdf8; border: 1px solid rgba(56,189,248,0.2);  }
        .tag-south   { background: rgba(251,146,60,0.12);  color: #fb923c; border: 1px solid rgba(251,146,60,0.2);  }
        .tag-unknown { background: rgba(255,255,255,0.05); color: #555;    border: 1px solid #2a2a2a; }
      `}</style>

      <div className="app">
        <div className="bg-grid" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />

        <header>
          <p className="eyebrow">Sandesh Gnawali · Senior Honors Project · Fisk University · March 31, 2026</p>
          <h1>Dataset Bias in <span>Large Language Models</span></h1>
          <p className="subtitle">A comparative analysis of ChatGPT, Gemini, and Grok — Fisk University, 2026</p>
        </header>

        <div className="prompt-zone">
          <div className="prompt-box">
            <textarea
              ref={textareaRef}
              rows={3}
              placeholder="Enter a prompt here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="prompt-footer">
              <span className="hint">⌘ + Enter to send</span>
              <button className="send-btn" onClick={handleSubmit} disabled={loading || !prompt.trim()}>
                {loading ? "Running Prompt..." : "Run Prompt"}
                {!loading && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="error-msg">⚠ {error}</div>}
        </div>

        <div className="cards-grid">
          {MODELS.map((model) => (
            <ModelCard
              key={model.key}
              model={model}
              response={responses[model.key] || null}
              loading={loading}
              revealed={revealed || loading}
            />
          ))}
        </div>

        {hasResults && (
          <div className="analyze-zone">
            <button
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <span className="analyze-spinner" />
                  Classifying demographics…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Analyze Demographic Bias
                </>
              )}
            </button>
          </div>
        )}

        {(Object.keys(demographics).length > 0 || analyzing) && (
          <BiasPanel demographics={demographics} analyzing={analyzing} />
        )}
      </div>
    </>
  );
}