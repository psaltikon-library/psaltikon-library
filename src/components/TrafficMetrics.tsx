import { useEffect, useState } from 'react';
import {
  TRAFFIC_RANGES,
  TrafficDay,
  TrafficMetrics as TrafficMetricsData,
  loadTrafficMetrics,
} from '../utils/trafficMetrics';

const ROUTE_LABELS: Record<string, string> = {
  'chant-detail': 'Chant pages',
  home: 'Home',
  library: 'Library',
  services: 'Services',
  compositions: 'Services',
  booklets: 'Booklets',
  about: 'About',
  phonetics: 'Phonetics',
  'saved-items': 'Saved items',
  admin: 'Admin',
};

const fmt = (n: number) => n.toLocaleString();

const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Round a chart maximum up to a tidy 1 / 2 / 5 × 10^k so the grid lines read cleanly. */
function niceMax(value: number) {
  if (value <= 5) return 5;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((s) => s * power >= value) as number;
  return step * power;
}

function Delta({ current, previous, label }: { current: number; previous: number | undefined; label: string }) {
  if (previous == null || previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <div className="metrics-delta">No change {label}</div>;
  const up = pct > 0;
  return (
    <div className={`metrics-delta ${up ? 'is-up' : 'is-down'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% {label}
    </div>
  );
}

function DailyChart({ daily }: { daily: TrafficDay[] }) {
  const W = 720;
  const H = 230;
  const pad = { left: 40, right: 8, top: 12, bottom: 28 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = niceMax(Math.max(1, ...daily.map((d) => d.views)));
  const slot = innerW / Math.max(1, daily.length);
  const barW = Math.max(1.5, slot * 0.68);
  const x = (i: number) => pad.left + slot * i + slot / 2;
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const hasVisitors = daily.some((d) => d.visitors > 0);
  const labelAt = [0, Math.floor((daily.length - 1) / 2), daily.length - 1];

  return (
    <svg
      className="metrics-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Daily page views, ${daily.length} days, peak ${fmt(Math.max(0, ...daily.map((d) => d.views)))}`}
    >
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={W - pad.right} y1={y(max * t)} y2={y(max * t)} className="metrics-chart__grid" />
          <text x={pad.left - 8} y={y(max * t) + 4} textAnchor="end" className="metrics-chart__axis">
            {fmt(Math.round(max * t))}
          </text>
        </g>
      ))}

      {daily.map((d, i) => (
        <rect
          key={d.day}
          x={x(i) - barW / 2}
          y={y(d.views)}
          width={barW}
          height={Math.max(0, pad.top + innerH - y(d.views))}
          rx={Math.min(3, barW / 2)}
          className="metrics-chart__bar"
        >
          <title>{`${dayLabel(d.day)}: ${fmt(d.views)} views${hasVisitors ? `, ${fmt(d.visitors)} visitors` : ''}`}</title>
        </rect>
      ))}

      {hasVisitors && (
        <polyline
          className="metrics-chart__line"
          fill="none"
          points={daily.map((d, i) => `${x(i)},${y(d.visitors)}`).join(' ')}
        />
      )}

      {Array.from(new Set(labelAt)).map((i, idx, arr) => (
        <text
          key={daily[i]?.day}
          x={x(i)}
          y={H - 8}
          textAnchor={idx === 0 ? 'start' : idx === arr.length - 1 ? 'end' : 'middle'}
          className="metrics-chart__axis"
        >
          {daily[i] ? dayLabel(daily[i].day) : ''}
        </text>
      ))}
    </svg>
  );
}

type BarItem = { key: string; label: string; value: number; note?: string };

function BarList({ items, empty }: { items: BarItem[]; empty: string }) {
  if (items.length === 0) return <p className="metrics-empty">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className="metrics-bars">
      {items.map((item) => (
        <li key={item.key}>
          <div className="metrics-bars__row">
            <span className="metrics-bars__label" title={item.label}>
              {item.label}
            </span>
            <span className="metrics-bars__value">
              {fmt(item.value)}
              {item.note && <span className="metrics-bars__note"> · {item.note}</span>}
            </span>
          </div>
          <div className="metrics-bars__track">
            <div className="metrics-bars__fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

type ViewProps = {
  data: TrafficMetricsData | null;
  days: number;
  onDays: (days: number) => void;
  loading: boolean;
  error: string;
};

export function TrafficMetricsView({ data, days, onDays, loading, error }: ViewProps) {
  const rangeLabel = TRAFFIC_RANGES.find((r) => r.days === days)?.label.toLowerCase() ?? `${days} days`;
  const prevLabel = days > 0 ? `vs previous ${days} days` : '';

  let notice = '';
  if (data) {
    if (!data.totals.tracked_since) {
      notice =
        'Visitor, visit, device and referrer tracking has just been switched on, so those cards fill in as people visit. Page views include everything recorded so far.';
    } else if (new Date(data.range.from).getTime() < new Date(data.totals.tracked_since).getTime() - 86_400_000) {
      notice = `Visitor, visit, device and referrer numbers cover traffic since ${new Date(
        data.totals.tracked_since
      ).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}. Earlier days show page views only.`;
    }
  }

  const routes: BarItem[] = [];
  data?.routes.forEach((r) => {
    const label = ROUTE_LABELS[r.route] ?? r.route.replace(/-/g, ' ');
    const existing = routes.find((i) => i.label === label);
    if (existing) existing.value += r.views;
    else routes.push({ key: r.route, label, value: r.views });
  });
  routes.sort((a, b) => b.value - a.value);

  const deviceTotal = data?.devices.reduce((sum, d) => sum + d.views, 0) || 0;

  return (
    <div className={`metrics${loading ? ' is-loading' : ''}`}>
      <div className="metrics-toolbar">
        <div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: 4 }}>Web Traffic</h2>
          {data && (
            <p className="metrics-sub">
              {days === 0 ? 'Everything recorded' : `Last ${days} days`} · times in {data.range.tz.replace(/_/g, ' ')}
            </p>
          )}
        </div>
        <div className="metrics-range" role="group" aria-label="Date range">
          {TRAFFIC_RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              className={`metrics-range__btn${r.days === days ? ' is-active' : ''}`}
              aria-pressed={r.days === days}
              onClick={() => onDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="metrics-error">{error}</div>}

      {!data && loading && <p className="metrics-empty">Loading traffic…</p>}

      {data && (
        <>
          {notice && <div className="metrics-notice">{notice}</div>}

          <div className="metrics-stats">
            <div className="card metrics-stat">
              <div className="metrics-stat__label">Page views</div>
              <div className="metrics-stat__value">{fmt(data.totals.views)}</div>
              <Delta current={data.totals.views} previous={data.previous?.views} label={prevLabel} />
            </div>
            <div className="card metrics-stat">
              <div className="metrics-stat__label">Unique visitors</div>
              <div className="metrics-stat__value">{data.totals.tracked_since ? fmt(data.totals.visitors) : '—'}</div>
              <Delta current={data.totals.visitors} previous={data.previous?.visitors} label={prevLabel} />
              <div className="metrics-stat__hint">Counted by a random, anonymous browser id</div>
            </div>
            <div className="card metrics-stat">
              <div className="metrics-stat__label">Visits</div>
              <div className="metrics-stat__value">{data.totals.tracked_since ? fmt(data.totals.sessions) : '—'}</div>
              <Delta current={data.totals.sessions} previous={data.previous?.sessions} label={prevLabel} />
              <div className="metrics-stat__hint">One visit = one browsing session</div>
            </div>
            <div className="card metrics-stat">
              <div className="metrics-stat__label">Signed-in views</div>
              <div className="metrics-stat__value">
                {data.totals.views > 0 ? `${Math.round((data.totals.signed_in_views / data.totals.views) * 100)}%` : '—'}
              </div>
              <div className="metrics-stat__hint">{fmt(data.totals.signed_in_views)} of {fmt(data.totals.views)} views</div>
            </div>
          </div>

          <section className="card metrics-card">
            <div className="metrics-card__head">
              <h3>Daily page views</h3>
              <div className="metrics-legend">
                <span><i className="metrics-legend__bar" /> Views</span>
                {data.daily.some((d) => d.visitors > 0) && (
                  <span><i className="metrics-legend__line" /> Visitors</span>
                )}
              </div>
            </div>
            {data.daily.length > 0 ? <DailyChart daily={data.daily} /> : <p className="metrics-empty">No traffic in this range.</p>}
          </section>

          <div className="metrics-grid">
            <section className="card metrics-card">
              <h3>Top pages</h3>
              <BarList items={routes} empty={`No page views in the ${rangeLabel}.`} />
            </section>

            <section className="card metrics-card">
              <h3>Top chants</h3>
              <BarList
                items={data.chants.map((c) => ({
                  key: c.chant_id,
                  label: c.title || 'Removed chant',
                  value: c.views,
                }))}
                empty={`No chant pages viewed in the ${rangeLabel}.`}
              />
            </section>

            <section className="card metrics-card">
              <h3>Where visitors come from</h3>
              <BarList
                items={data.referrers.map((r) => ({
                  key: r.host,
                  label: r.host === '(direct)' ? 'Direct or typed link' : r.host,
                  value: r.views,
                }))}
                empty="No referrer data yet. It appears as new visits arrive."
              />
            </section>

            <section className="card metrics-card">
              <h3>Most active members</h3>
              <p className="metrics-note">Top 10 signed-in members by page views. Visits are counted as days active. Admins are left out.</p>
              <BarList
                items={data.members.map((m) => ({
                  key: m.user_id,
                  label: m.banned ? `${m.name} (banned)` : m.name,
                  value: m.views,
                  note: `${fmt(m.active_days)} ${m.active_days === 1 ? 'day' : 'days'} active`,
                }))}
                empty={`No signed-in members were active in the ${rangeLabel}.`}
              />
            </section>

            <section className="card metrics-card">
              <h3>Devices</h3>
              <BarList
                items={data.devices.map((d) => ({
                  key: d.device,
                  label: d.device.charAt(0).toUpperCase() + d.device.slice(1),
                  value: d.views,
                  note: deviceTotal ? `${Math.round((d.views / deviceTotal) * 100)}%` : undefined,
                }))}
                empty="No device data yet. It appears as new visits arrive."
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default function TrafficMetrics({ refreshKey = 0 }: { refreshKey?: number }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TrafficMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    loadTrafficMetrics(days)
      .then((next) => active && setData(next))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load traffic metrics.'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [days, refreshKey]);

  return <TrafficMetricsView data={data} days={days} onDays={setDays} loading={loading} error={error} />;
}
