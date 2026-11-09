import { useEffect, useState } from 'react';
import { api } from '../api.js';

const Bars = ({ title, data = {} }) => {
  const max = Math.max(1, ...Object.values(data));
  return (
    <div className="card">
      <h3>{title}</h3>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="bar-row">
          <span>{k}</span>
          <div className="bar"><div style={{ width: `${(v / max) * 100}%` }} /></div>
          <b>{v}</b>
        </div>
      ))}
      {!Object.keys(data).length && <p className="muted">No data yet</p>}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="card stat"><div className="muted">{label}</div><div className="big">{value}</div></div>
);

export default function Analytics() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/analytics').then(setD).catch(console.error); }, []);
  if (!d) return <p>Loading…</p>;
  const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);
  return (
    <>
      <h1>Analytics</h1>
      <div className="grid4">
        <Stat label="Total tickets" value={d.total} />
        <Stat label="Resolved by AI alone" value={pct(d.aiResolutionRate)} />
        <Stat label="Avg resolution time" value={d.avgResolutionMinutes == null ? '—' : `${d.avgResolutionMinutes} min`} />
        <Stat label={`AI accuracy (${d.feedbackCount} ratings)`} value={pct(d.aiAccuracy)} />
      </div>
      <div className="grid3">
        <Bars title="By status" data={d.byStatus} />
        <Bars title="By category" data={d.byCategory} />
        <Bars title="By sentiment" data={d.bySentiment} />
      </div>
      <Bars title="Tickets per day (last 7 days)" data={Object.fromEntries(d.daily.map((x) => [x.date, x.count]))} />
    </>
  );
}
