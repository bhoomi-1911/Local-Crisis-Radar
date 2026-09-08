import { useEffect, useMemo, useState } from 'react';

import {
  MapContainer,
  TileLayer,
  CircleMarker,
} from 'react-leaflet';

import api from '../api/client';

import Badge from '../components/Badge';

import {
  sevBadgeClass,
  statusBadgeClass,
} from '../components/ReportRow';

import {
  TYPE_LABEL,
  SEV_ORDER,
  STATUS_ORDER,
  STATUS_LABEL,
  SEV_COLOR,
  timeAgo,
} from '../constants';

const BLR = [12.9716, 77.5946];

/* =========================================================
   EVIDENCE IMAGE URL

   Local uploads:
   /uploads/reports/photo.jpg
        ↓
   http://localhost:4000/uploads/reports/photo.jpg

   Cloudinary / external URLs:
   https://...
        ↓
   Used directly
   ========================================================= */

function getEvidenceUrl(path) {
  if (!path) return null;

  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    'http://localhost:4000/api';

  const apiOrigin = apiUrl.replace(/\/api\/?$/, '');

  return `${apiOrigin}${
    path.startsWith('/') ? path : `/${path}`
  }`;
}

export default function LiveMap() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [types, setTypes] = useState(
    new Set(Object.keys(TYPE_LABEL))
  );

  const [severities, setSeverities] = useState(
    new Set(SEV_ORDER)
  );

  const [statuses, setStatuses] = useState(
    new Set(STATUS_ORDER)
  );

  const [selected, setSelected] = useState(null);

  /* =======================================================
     LOAD REPORTS
     ======================================================= */

  useEffect(() => {
    api
      .get('/reports')
      .then((r) => {
        setReports(r.data.reports);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* =======================================================
     FILTER TOGGLE
     ======================================================= */

  const toggle = (set, setSet, val) => {
    const next = new Set(set);

    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }

    setSet(next);
  };

  /* =======================================================
     FILTER REPORTS
     ======================================================= */

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return reports.filter((r) => {
      const matchesFilters =
        types.has(r.type) &&
        severities.has(r.severity) &&
        statuses.has(r.status);

      const matchesSearch =
        q === '' ||
        r.title.toLowerCase().includes(q) ||
        (r.area || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q);

      return matchesFilters && matchesSearch;
    });
  }, [
    reports,
    types,
    severities,
    statuses,
    search,
  ]);

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="mapview">

      {/* ================= FILTERS ================= */}

      <div className="mapfilters">

        <input
          className="search-input"
          placeholder="Search location or keyword…"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        {/* CRISIS TYPE */}

        <div className="filtergroup">
          <h3>Crisis type</h3>

          {Object.entries(TYPE_LABEL).map(
            ([k, label]) => (
              <label
                className="fchk"
                key={k}
              >
                <input
                  type="checkbox"
                  checked={types.has(k)}
                  onChange={() =>
                    toggle(
                      types,
                      setTypes,
                      k
                    )
                  }
                />

                {label}
              </label>
            )
          )}
        </div>

        {/* SEVERITY */}

        <div className="filtergroup">
          <h3>Severity</h3>

          {SEV_ORDER.map((s) => (
            <label
              className="fchk"
              key={s}
            >
              <input
                type="checkbox"
                checked={severities.has(s)}
                onChange={() =>
                  toggle(
                    severities,
                    setSeverities,
                    s
                  )
                }
              />

              <Badge
                text={
                  s[0].toUpperCase() +
                  s.slice(1)
                }
                className={sevBadgeClass(s)}
              />
            </label>
          ))}
        </div>

        {/* STATUS */}

        <div className="filtergroup">
          <h3>Status</h3>

          {STATUS_ORDER.map((s) => (
            <label
              className="fchk"
              key={s}
            >
              <input
                type="checkbox"
                checked={statuses.has(s)}
                onChange={() =>
                  toggle(
                    statuses,
                    setStatuses,
                    s
                  )
                }
              />

              {STATUS_LABEL[s]}
            </label>
          ))}
        </div>
      </div>

      {/* ================= MAP ================= */}

      <div id="mapCanvasWrap">

        {!loading && (
          <MapContainer
            center={BLR}
            zoom={11.5}
            className="leaflet-map-fill"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filtered.map((r) => {
              const radius =
                r.severity === 'critical'
                  ? 11
                  : r.severity === 'high'
                  ? 9
                  : r.severity === 'moderate'
                  ? 7.5
                  : 6.5;

              return (
                <CircleMarker
                  key={r.id}
                  center={[
                    Number(r.latitude),
                    Number(r.longitude),
                  ]}
                  radius={radius}
                  pathOptions={{
                    color: '#fff',
                    weight: 2,
                    fillColor:
                      SEV_COLOR[r.severity],
                    fillOpacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () =>
                      setSelected(r),
                  }}
                />
              );
            })}
          </MapContainer>
        )}

        {/* ================= INCIDENT PANEL ================= */}

        {selected && (
          <div className="incident-panel show">

            <button
              className="close"
              onClick={() =>
                setSelected(null)
              }
            >
              &times;
            </button>

            {/* TYPE + SEVERITY */}

            <div>
              <Badge
                text={
                  TYPE_LABEL[selected.type] ||
                  selected.type
                }
                className="badge-low"
              />{' '}

              <Badge
                text={
                  selected.severity[0].toUpperCase() +
                  selected.severity.slice(1)
                }
                className={sevBadgeClass(
                  selected.severity
                )}
              />
            </div>

            {/* TITLE */}

            <h3>{selected.title}</h3>

            {/* LOCATION */}

            <div className="imeta">
              {selected.area ||
                'Unspecified area'}{' '}
              ·{' '}

              <span className="mono">
                {Number(
                  selected.latitude
                ).toFixed(4)}
                ,{' '}
                {Number(
                  selected.longitude
                ).toFixed(4)}
              </span>{' '}
              · reported{' '}
              {timeAgo(
                selected.created_at
              )}
            </div>

            {/* STATUS */}

            <div>
              <Badge
                text={
                  STATUS_LABEL[
                    selected.status
                  ]
                }
                className={statusBadgeClass(
                  selected.status
                )}
              />
            </div>

            {/* DESCRIPTION */}

            <p className="idesc">
              {selected.description}
            </p>

            {/* ================= PHOTO EVIDENCE ================= */}

            {selected.evidence_url ? (
              <div
                style={{
                  marginTop: 14,
                  marginBottom: 16,
                }}
              >
                <img
                  src={getEvidenceUrl(
                    selected.evidence_url
                  )}
                  alt={`Evidence for ${selected.title}`}
                  style={{
                    width: '100%',
                    maxHeight: '260px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    display: 'block',
                  }}
                  onError={(e) => {
                    console.error(
                      'Could not load evidence image:',
                      e.currentTarget.src
                    );
                  }}
                />

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}
                >
                  Photo evidence
                </div>
              </div>
            ) : (
              <div className="evidence-ph">
                No photo evidence attached
              </div>
            )}

            {/* ================= TIMELINE ================= */}

            <div className="timeline">

              <div className="tl-item">
                Reported by{' '}
                {selected.reporter_name ||
                  'a community member'}{' '}
                —{' '}
                {timeAgo(
                  selected.created_at
                )}
              </div>

              {selected.verified_by_name ? (
                <div className="tl-item">
                  Verified by{' '}
                  {
                    selected.verified_by_name
                  }
                </div>
              ) : (
                <div
                  className="tl-item"
                  style={{
                    opacity: 0.5,
                  }}
                >
                  Awaiting authority
                  verification
                </div>
              )}

              {selected.status ===
                'resolved' && (
                <div className="tl-item">
                  Marked resolved
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}