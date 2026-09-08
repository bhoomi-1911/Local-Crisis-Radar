export const TYPE_LABEL = {
  flood: 'Flood',
  roadblock: 'Roadblock',
  power: 'Power outage',
  fire: 'Fire',
  medical: 'Medical',
  infrastructure: 'Infrastructure',
};

export const SEV_ORDER = ['critical', 'high', 'moderate', 'low'];
export const STATUS_ORDER = ['reported', 'verified', 'progress', 'resolved'];

export const STATUS_LABEL = {
  reported: 'Reported',
  verified: 'Verified',
  progress: 'In progress',
  resolved: 'Resolved',
};

export const SEV_COLOR = {
  critical: '#C1442D',
  high: '#D98A2B',
  moderate: '#4C7A6E',
  low: '#5C7A97',
};

export function timeAgo(dateStr) {
  const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
