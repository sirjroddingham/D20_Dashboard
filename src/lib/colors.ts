const COLORS = [
  // 10 base hues
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
  // 10 darker variants
  '#b91c1c', '#c2410c', '#b45309', '#4d7c0f', '#15803d',
  '#0f766e', '#0e7490', '#1d4ed8', '#7e22ce', '#be185d',
  // 10 lighter variants
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80',
  '#2dd4bf', '#22d3ee', '#60a5fa', '#c084fc', '#f472b6',
];

export function assignColors(codes: string[]): Map<string, string> {
  const sorted = [...codes].sort();
  const map = new Map<string, string>();
  for (let i = 0; i < sorted.length; i++) {
    map.set(sorted[i], COLORS[i % COLORS.length]);
  }
  return map;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getRTSColor(code: string): string {
  return COLORS[hashString(code) % COLORS.length];
}
