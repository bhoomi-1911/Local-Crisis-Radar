import Badge from './Badge';
import { TYPE_LABEL, STATUS_LABEL, SEV_COLOR, timeAgo } from '../constants';

const sevBadgeClass = (s) => ({ critical: 'badge-critical', high: 'badge-high', moderate: 'badge-moderate', low: 'badge-low' }[s]);
const statusBadgeClass = (s) => ({ reported: 'badge-reported', verified: 'badge-verified', progress: 'badge-progress', resolved: 'badge-resolved' }[s]);

export default function ReportRow({ report }) {
  return (
    <div className="reportrow">
      <div className="sev-chip" style={{ background: SEV_COLOR[report.severity] }}></div>
      <div style={{ flex: 1 }}>
        <div className="rtitle">{report.title}</div>
        <div className="rmeta">
          {report.area || 'Unknown area'} · <Badge text={TYPE_LABEL[report.type]} className="badge-low" />{' '}
          <Badge text={STATUS_LABEL[report.status]} className={statusBadgeClass(report.status)} />
          {' '}· <span className="mono">{timeAgo(report.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export { sevBadgeClass, statusBadgeClass };
