import type { ScorecardRow } from '../lib/scorecard/types';

interface RankingItem {
  rank: number;
  name: string;
  transporterId: string;
  score: number;
  packages: number;
  standing?: string;
}

interface RankingTableProps {
  title: string;
  data: RankingItem[];
  maxScore: number;
  titleColor: string;
  scoreLabel: string;
  showStanding?: boolean;
}

const scoreColor = (pct: number) => {
  if (pct >= 90) return '#0f9d58';
  if (pct >= 80) return '#7cb342';
  if (pct >= 70) return '#fdd835';
  if (pct >= 60) return '#ff9800';
  if (pct >= 50) return '#f4511e';
  return '#d32f2f';
};

const scoreBgColor = (pct: number) => {
  if (pct >= 90) return 'rgba(15,157,88,0.08)';
  if (pct >= 80) return 'rgba(124,179,66,0.08)';
  if (pct >= 70) return 'rgba(253,216,53,0.08)';
  if (pct >= 60) return 'rgba(255,152,0,0.08)';
  if (pct >= 50) return 'rgba(244,81,30,0.08)';
  return 'rgba(211,47,47,0.08)';
};

const standingStyles: Record<string, string> = {
  Platinum: 'bg-[#e5e4e2]/30 text-gray-400 border border-gray-400/20',
  Gold: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  Silver: 'bg-gray-400/15 text-gray-300 border border-gray-400/20',
  Bronze: 'bg-orange-600/15 text-orange-400 border border-orange-600/20',
};

export default function RankingTable({
  title,
  data,
  maxScore,
  titleColor,
  scoreLabel,
  showStanding = true,
}: RankingTableProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg section-card overflow-hidden">
      <div
        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
        style={{ backgroundColor: titleColor }}
      >
        {title}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-3 py-1.5 text-left font-medium w-8">#</th>
            <th className="px-3 py-1.5 text-left font-medium">Name</th>
            <th className="px-3 py-1.5 text-right font-medium">{scoreLabel}</th>
            <th className="px-3 py-1.5 text-right font-medium">Pkg</th>
            {showStanding && <th className="px-3 py-1.5 text-center font-medium">Standing</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const pct = (item.score / maxScore) * 100;
            const color = scoreColor(pct);
            const bg = scoreBgColor(pct);
            return (
              <tr
                key={item.transporterId}
                className="border-b border-border/30 last:border-b-0"
                style={{ backgroundColor: bg }}
              >
                <td
                  className="px-3 py-1 font-bold text-white text-center"
                  style={{ backgroundColor: color }}
                >
                  {item.rank}
                </td>
                <td className="px-3 py-1">
                  <div className="font-medium text-foreground">{item.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{item.transporterId}</div>
                </td>
                <td
                  className="px-3 py-1 text-right font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {item.score.toFixed(2)}
                </td>
                <td className="px-3 py-1 text-right text-foreground tabular-nums">
                  {item.packages.toLocaleString()}
                </td>
                {showStanding && (
                  <td className="px-3 py-1 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        standingStyles[item.standing ?? ''] ?? 'text-muted-foreground'
                      }`}
                    >
                      {item.standing ?? '—'}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface NoSafetyDataProps {
  rows: ScorecardRow[];
  qualityScores: Array<{ transporterId: string; name: string; score: number; packages: number }>;
}

export function NoSafetyDataTable({ rows, qualityScores }: NoSafetyDataProps) {
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="rounded-lg section-card overflow-hidden">
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white" style={{ backgroundColor: '#9e9e9e' }}>
        Employees Without Safety Data
      </div>
      <div className="px-4 py-1.5 text-[11px] text-muted-foreground italic">
        These DAs have no safety metrics recorded and are excluded from safety rankings.
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-3 py-1.5 text-left font-medium w-8">#</th>
            <th className="px-3 py-1.5 text-left font-medium">Name</th>
            <th className="px-3 py-1.5 text-right font-medium">Quality Score</th>
            <th className="px-3 py-1.5 text-right font-medium">Pkg</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => {
            const qData = qualityScores.find(q => q.transporterId === row.transporterId);
            return (
              <tr key={row.transporterId} className="border-b border-border/30 last:border-b-0 bg-muted/30">
                <td className="px-3 py-1 text-center text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-1">
                  <div className="font-medium text-foreground">{row.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{row.transporterId}</div>
                </td>
                <td className="px-3 py-1 text-right text-foreground tabular-nums">
                  {qData ? qData.score.toFixed(2) : '0.00'}
                </td>
                <td className="px-3 py-1 text-right text-foreground tabular-nums">
                  {row.packagesDelivered.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface TrailingTableProps {
  title: string;
  data: Array<{
    rank: number;
    name: string;
    transporterId: string;
    avgScore: number;
    totalPackages: number;
    weekCount: number;
  }>;
  maxScore: number;
  titleColor: string;
  scoreLabel: string;
}

export function TrailingTable({
  title,
  data,
  maxScore,
  titleColor,
  scoreLabel,
}: TrailingTableProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg section-card overflow-hidden">
      <div
        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
        style={{ backgroundColor: titleColor }}
      >
        {title}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-3 py-1.5 text-left font-medium w-8">#</th>
            <th className="px-3 py-1.5 text-left font-medium">Name</th>
            <th className="px-3 py-1.5 text-right font-medium">{scoreLabel}</th>
            <th className="px-3 py-1.5 text-right font-medium">Pkg</th>
            <th className="px-3 py-1.5 text-center font-medium">Wks</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const pct = (item.avgScore / maxScore) * 100;
            const color = scoreColor(pct);
            const bg = scoreBgColor(pct);
            return (
              <tr
                key={item.transporterId}
                className="border-b border-border/30 last:border-b-0"
                style={{ backgroundColor: bg }}
              >
                <td
                  className="px-3 py-1 font-bold text-white text-center"
                  style={{ backgroundColor: color }}
                >
                  {item.rank}
                </td>
                <td className="px-3 py-1">
                  <div className="font-medium text-foreground">{item.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{item.transporterId}</div>
                </td>
                <td
                  className="px-3 py-1 text-right font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {item.avgScore.toFixed(2)}
                </td>
                <td className="px-3 py-1 text-right text-foreground tabular-nums">
                  {item.totalPackages.toLocaleString()}
                </td>
                <td className="px-3 py-1 text-center text-muted-foreground tabular-nums">
                  {item.weekCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
