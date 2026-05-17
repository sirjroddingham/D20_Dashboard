import type { ScorecardRow } from '../lib/scorecard/types';

interface RankingItem {
  rank: number;
  name: string;
  transporterId: string;
  score: number;
  packages: number;
  standing?: string;
}

type TitleColorType = 'overall' | 'safety' | 'quality' | 'bottom' | 'muted';

interface RankingTableProps {
  title: string;
  data: RankingItem[];
  maxScore: number;
  titleColor: TitleColorType;
  scoreLabel: string;
  showStanding?: boolean;
}

const scoreColorClass = (pct: number) => {
  if (pct >= 90) return 'score-cell-excellent';
  if (pct >= 80) return 'score-cell-good';
  if (pct >= 70) return 'score-cell-average';
  if (pct >= 60) return 'score-cell-below-avg';
  if (pct >= 50) return 'score-cell-poor';
  return 'score-cell-critical';
};

const scoreBgClass = (pct: number) => {
  if (pct >= 90) return 'score-cell-excellent-bg';
  if (pct >= 80) return 'score-cell-good-bg';
  if (pct >= 70) return 'score-cell-average-bg';
  if (pct >= 60) return 'score-cell-below-avg-bg';
  if (pct >= 50) return 'score-cell-poor-bg';
  return 'score-cell-critical-bg';
};

const titleStyle = 'bg-surface-2 text-text-subtle';

const standingStyles: Record<string, string> = {
  Platinum: 'bg-standing-platinum-bg text-standing-platinum-text',
  Gold: 'bg-standing-gold-bg text-standing-gold-text',
  Silver: 'bg-standing-silver-bg text-standing-silver-text',
  Bronze: 'bg-standing-bronze-bg text-standing-bronze-text',
};

export default function RankingTable({
  title,
  data,
  maxScore,
  scoreLabel,
  showStanding = true,
}: RankingTableProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg section-card backdrop-blur-sm p-3 overflow-hidden">
      <div
        className={`px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider ${titleStyle}`}
      >
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[420px]">
          <thead>
            <tr className="border-b border-surface-3 text-text-subtle">
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium">Name</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">{scoreLabel}</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Pkg</th>
              {showStanding && <th className="px-2 sm:px-3 py-1.5 text-center font-medium hidden sm:table-cell">Standing</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const pct = (item.score / maxScore) * 100;
              const colorCls = scoreColorClass(pct);
              const bgCls = scoreBgClass(pct);
              return (
                <tr
                  key={item.transporterId}
                  className={`border-b border-surface-3/30 last:border-b-0 ${bgCls}`}
                >
                  <td className={`px-2 sm:px-3 py-1 font-bold text-center text-text-heading ${colorCls}`}>
                    {item.rank}
                  </td>
                  <td className="px-2 sm:px-3 py-1">
                    <div className="font-medium text-text-heading">{item.name}</div>
                  </td>
                  <td className={`px-2 sm:px-3 py-1 text-right font-bold text-text-heading ${colorCls}`}>
                    {item.score.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                    {item.packages.toLocaleString()}
                  </td>
                  {showStanding && (
                    <td className="px-2 sm:px-3 py-1 text-center hidden sm:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          standingStyles[item.standing ?? ''] ?? 'text-text-subtle'
                        }`}
                      >
                        {item.standing ?? '\u2014'}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
    <div className="rounded-lg section-card backdrop-blur-sm p-3 overflow-hidden">
      <div className={`px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider ${titleStyle}`}>
        Employees Without Safety Data
      </div>
      <div className="px-3 sm:px-4 py-1.5 text-[11px] text-text-subtle italic">
        These DAs have no safety metrics recorded and are excluded from safety rankings.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[420px]">
          <thead>
            <tr className="border-b border-surface-3 text-text-subtle">
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium">Name</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">Quality Score</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Pkg</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const qData = qualityScores.find(q => q.transporterId === row.transporterId);
              return (
                <tr key={row.transporterId} className="border-b border-surface-3/30 last:border-b-0 bg-surface-2/30">
                  <td className="px-2 sm:px-3 py-1 text-center text-text-subtle">{idx + 1}</td>
                  <td className="px-2 sm:px-3 py-1">
                    <div className="font-medium text-text-heading">{row.name}</div>
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums">
                    {qData ? qData.score.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                    {row.packagesDelivered.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
  titleColor: TitleColorType;
  scoreLabel: string;
}

export function TrailingTable({
  title,
  data,
  maxScore,
  scoreLabel,
}: TrailingTableProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg section-card backdrop-blur-sm p-3 overflow-hidden">
      <div
        className={`px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider ${titleStyle}`}
      >
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[420px]">
          <thead>
            <tr className="border-b border-surface-3 text-text-subtle">
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 sm:px-3 py-1.5 text-left font-medium">Name</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium">{scoreLabel}</th>
              <th className="px-2 sm:px-3 py-1.5 text-right font-medium hidden sm:table-cell">Pkg</th>
              <th className="px-2 sm:px-3 py-1.5 text-center font-medium hidden sm:table-cell">Wks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const pct = (item.avgScore / maxScore) * 100;
              const colorCls = scoreColorClass(pct);
              const bgCls = scoreBgClass(pct);
              return (
                <tr
                  key={item.transporterId}
                  className={`border-b border-surface-3/30 last:border-b-0 ${bgCls}`}
                >
                  <td className={`px-2 sm:px-3 py-1 font-bold text-center text-text-heading ${colorCls}`}>
                    {item.rank}
                  </td>
                  <td className="px-2 sm:px-3 py-1">
                    <div className="font-medium text-text-heading">{item.name}</div>
                  </td>
                  <td className={`px-2 sm:px-3 py-1 text-right font-bold text-text-heading ${colorCls}`}>
                    {item.avgScore.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-right text-text-heading tabular-nums hidden sm:table-cell">
                    {item.totalPackages.toLocaleString()}
                  </td>
                  <td className="px-2 sm:px-3 py-1 text-center text-text-subtle tabular-nums hidden sm:table-cell">
                    {item.weekCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
