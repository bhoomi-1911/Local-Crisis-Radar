import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/client';
import ReportRow from '../components/ReportRow';
import { SEV_COLOR, TYPE_LABEL, timeAgo } from '../constants';

const BLR = [12.9716, 77.5946];

export default function Home() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/reports'),
      api.get('/reports/stats/summary'),
    ])
      .then(([r, s]) => {
        setReports(r.data.reports);
        setStats(s.data);
      })
      .catch(() => setErr('Could not reach the API — is the backend running on the configured VITE_API_URL?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="centered-msg">Loading live data…</div>;
  if (err) return <div className="centered-msg">{err}</div>;

  const latest = [...reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const ticker = latest[0];

  const totals = stats?.totals || {};
  const localityCount = totals.localities ?? new Set(reports.map((r) => r.area)).size;

  const trendData = buildTrendSeries(stats?.trend || []);

  return (
    <div>
      <section className="hero" style={{ paddingBottom: 48 }}>
        <div className="wrap hero-grid">
          <div>
            <h1>Know what's happening on your streets, right now.</h1>
            <p className="sub">
              Crisis Radar turns scattered reports of floods, roadblocks, outages and emergencies into one
              verified, live map — so people and responders act on the same picture.
            </p>
            <div className="hero-ctas">
              <Link className="btn btn-primary" to="/report">Report an Incident</Link>
              <Link className="btn btn-ghost-light" to="/map">View Live Map</Link>
            </div>
          </div>
          <div className="hero-map-card">
            <div className="maphead">
              <strong style={{ fontSize: 14 }}>Bengaluru — live view</strong>
              <span className="live"><span className="liveDot"></span>LIVE</span>
            </div>
            <MapContainer center={BLR} zoom={11} style={{ height: 260, width: '100%' }} zoomControl={false} scrollWheelZoom={false} dragging={false}>
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {reports.map((r) => (
                <CircleMarker key={r.id} center={[r.latitude, r.longitude]} radius={5}
                  pathOptions={{ color: SEV_COLOR[r.severity], fillColor: SEV_COLOR[r.severity], fillOpacity: 0.85, weight: 1 }} />
              ))}
            </MapContainer>
            {ticker && (
              <div className="ticker">
                <b>{TYPE_LABEL[ticker.type]}</b> reported near {ticker.area || 'an unspecified area'} — {timeAgo(ticker.created_at)}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="statsbar">
        <div className="wrap stats-grid">
          <div className="stat"><div className="num">{totals.active ?? '—'}</div><div className="lbl">Active incidents</div></div>
          <div className="stat"><div className="num">{totals.resolved_this_week ?? '—'}</div><div className="lbl">Resolved this week</div></div>
          <div className="stat"><div className="num">~1h</div><div className="lbl">Avg. time to verify</div></div>
          <div className="stat"><div className="num">{localityCount}</div><div className="lbl">Localities covered</div></div>
        </div>
      </div>

      <section className="wrap">
        <div className="section-head">
          <div>
            <h2>Latest reports</h2>
            <p>Freshly submitted, pending or already under verification</p>
          </div>
        </div>
        <div className="split">
          <div className="card">
            {latest.length ? latest.map((r) => <ReportRow key={r.id} report={r} />) : (
              <div style={{ padding: 20, color: 'var(--muted)' }}>No reports yet — be the first to submit one.</div>
            )}
          </div>
          <div className="card chartcard">
            <h3>Reports over the last 14 days</h3>
            <div className="sub">Submissions per day</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EA" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="count" name="Reported" stroke="#C1442D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="wrap">
        <div className="section-head">
          <div>
            <h2>How it works</h2>
            <p>From a first report to a closed incident</p>
          </div>
        </div>
        <div className="steps">
          <Step n="01" title="Report" text="Anyone nearby flags a flood, outage, roadblock or emergency with a location and a few details." />
          <Step n="02" title="Authority verification" text="A local authority or moderator checks the report, confirms severity, and rules out duplicates or spam." />
          <Step n="03" title="Track" text="The incident appears on the live map with a status, so nearby residents can plan around it." />
          <Step n="04" title="Resolved" text="Once the situation clears, the report is closed and logged for future response planning." />
        </div>
      </section>

      <section className="wrap">
        <div className="section-head"><div><h2>From people using it</h2></div></div>
        <div className="quotes-grid">
          <Quote text="I saw the waterlogging near my street was already flagged before I even stepped out. Took the other road instead." who="Resident, HSR Layout" />
          <Quote text="As a ward volunteer, having reports pre-sorted by severity means we check the worst ones first, not just the loudest ones." who="Ward volunteer, Jayanagar" />
          <Quote text="Our team used to rely on phone calls and guesswork. Now every report comes with a location pin and a timestamp." who="Municipal response coordinator" />
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>Crisis Radar — community incident tracking</span>
          <span>Copyright @ 2026</span>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, title, text }) {
  return (
    <div className="step">
      <div className="stepnum">{n}</div>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

function Quote({ text, who }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-soft)' }}>"{text}"</p>
      <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>{who}</div>
    </div>
  );
}

function buildTrendSeries(trendRows) {
  // trendRows: [{ day: ISOdate, count }] from the backend, sparse (only days with data)
  const byDay = {};
  trendRows.forEach((row) => {
    const key = new Date(row.day).toDateString();
    byDay[key] = Number(row.count);
  });
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    out.push({
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      count: byDay[d.toDateString()] || 0,
    });
  }
  return out;
}