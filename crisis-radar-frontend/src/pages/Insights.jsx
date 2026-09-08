import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import api from '../api/client';
import { TYPE_LABEL, SEV_ORDER, SEV_COLOR } from '../constants';

export default function Insights() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/reports'), api.get('/reports/stats/summary')])
      .then(([r, s]) => { setReports(r.data.reports); setStats(s.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="centered-msg">Loading insights…</div>;

  const totals = stats?.totals || {};
  const resolved = reports.filter((r) => r.status === 'resolved').length;
  const critical = reports.filter((r) => r.severity === 'critical' && r.status !== 'resolved').length;

  const byArea = {};
  reports.forEach((r) => { const key = r.area || 'Unspecified'; byArea[key] = (byArea[key] || 0) + 1; });
  const topAreas = Object.entries(byArea).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const trendData = buildTrendSeries(stats?.trend || []);

  const typeData = Object.entries(TYPE_LABEL).map(([k, label]) => ({
    label, count: reports.filter((r) => r.type === k).length,
  }));

  const sevData = SEV_ORDER.map((s) => ({
    label: s[0].toUpperCase() + s.slice(1), count: reports.filter((r) => r.severity === s).length, sev: s,
  }));

  return (
    <div className="wrap dashwrap">
      <h2 style={{ fontSize: 30, marginBottom: 22 }}>Crisis insights</h2>

      <div className="kpis">
        <div className="kpi"><div className="num">{reports.length}</div><div className="lbl">Total reports</div></div>
        <div className="kpi"><div className="num">{resolved}</div><div className="lbl">Resolved</div></div>
        <div className="kpi"><div className="num">{totals.active ?? '—'}</div><div className="lbl">Active now</div></div>
        <div className="kpi"><div className="num">{critical}</div><div className="lbl">Critical &amp; open</div></div>
      </div>

      <div className="insights-grid">
        <div className="chartbox">
          <h3>Incidents over time</h3>
          <div className="sub">Last 14 days, all types</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EA" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#C1442D" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chartbox">
          <h3>Top hotspots</h3>
          <div className="sub">By number of reports</div>
          {topAreas.map(([area, count]) => (
            <div className="hotspot-row" key={area}><span>{area}</span><strong>{count}</strong></div>
          ))}
        </div>
      </div>

      <div className="insights-grid">
        <div className="chartbox">
          <h3>By crisis type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EA" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2B3543" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chartbox">
          <h3>By severity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EA" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {sevData.map((d) => <Cell key={d.sev} fill={SEV_COLOR[d.sev]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function buildTrendSeries(trendRows) {
  const byDay = {};
  trendRows.forEach((row) => { byDay[new Date(row.day).toDateString()] = Number(row.count); });
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    out.push({ label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), count: byDay[d.toDateString()] || 0 });
  }
  return out;
}
