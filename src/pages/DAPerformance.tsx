import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BarChart3 } from 'lucide-react';
import { useDAPerformanceStore, STANDARD_SAFETY_WEIGHT, STANDARD_QUALITY_WEIGHT } from '../store/useDAPerformanceStore';
import {
  PERFECT_OVERALL,
  PERFECT_SAFETY,
  PERFECT_QUALITY,
} from '../lib/scorecard/parseScorecard';
import ScorecardCSVUpload from '../components/ScorecardCSVUpload';
import RankingTable, { NoSafetyDataTable, TrailingTable } from '../components/RankingTable';
import { ScoreDistributionChart } from '../components/ScoreDistributionChart';

interface RankedItem {
  transporterId: string;
  name: string;
  score: number;
  packages: number;
  standing?: string;
}

function getTopN(items: RankedItem[], n: number, perfectThreshold: number) {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const perfect = sorted.filter(item => item.score >= perfectThreshold);
  const selected = perfect.length > n ? perfect : sorted.slice(0, n);
  selected.sort((a, b) => Math.round(b.score * 100) - Math.round(a.score * 100) || b.packages - a.packages);
  return selected;
}

function getBottomN(items: RankedItem[], n: number) {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  return sorted.slice(-n).reverse();
}

export default function DAPerformance() {
  const rows = useDAPerformanceStore(s => s.rows);
  const loadedWeeks = useDAPerformanceStore(s => s.loadedWeeks);
  const mostRecentWeek = useDAPerformanceStore(s => s.mostRecentWeek);
  const fileName = useDAPerformanceStore(s => s.fileName);
  const [selectedWeek, setSelectedWeek] = useState<string>(mostRecentWeek);

  // Auto-select latest week when a new CSV is uploaded
  useEffect(() => {
    if (mostRecentWeek && mostRecentWeek !== selectedWeek) {
      setSelectedWeek(mostRecentWeek);
    }
  }, [mostRecentWeek]);

  const weekRows = useMemo(() => {
    if (!selectedWeek) return rows;
    return rows.filter(r => r.week === selectedWeek);
  }, [rows, selectedWeek]);

  const trailingAverages = useDAPerformanceStore(s => s.trailingAverages);

  // Overall scores
  const overallScores = useMemo(
    () =>
      weekRows
        .filter(r => r.overallScore > 0)
        .map(r => ({
          transporterId: r.transporterId,
          name: r.name,
          score: r.overallScore,
          packages: r.packagesDelivered,
          standing: r.standing,
        })),
    [weekRows],
  );

  const topOverall = useMemo(() => getTopN(overallScores, 10, PERFECT_OVERALL), [overallScores]);
  const bottomOverall = useMemo(() => getBottomN(overallScores, 10), [overallScores]);

  // Safety scores
  const safetyWithScores = useMemo(
    () =>
      weekRows
        .filter(r => r.hasSafetyData)
        .map(r => ({
          transporterId: r.transporterId,
          name: r.name,
          score: r.normalizedSafetyScore,
          packages: r.packagesDelivered,
          standing: r.standing,
        })),
    [weekRows],
  );

  const safetyNoData = useMemo(
    () => weekRows.filter(r => !r.hasSafetyData),
    [weekRows],
  );

  const topSafety = useMemo(() => getTopN(safetyWithScores, 10, PERFECT_SAFETY), [safetyWithScores]);
  const bottomSafety = useMemo(() => getBottomN(safetyWithScores, 10), [safetyWithScores]);

  // Quality scores
  const qualityScores = useMemo(
    () =>
      weekRows
        .filter(r => r.normalizedQualityScore > 0)
        .map(r => ({
          transporterId: r.transporterId,
          name: r.name,
          score: r.normalizedQualityScore,
          packages: r.packagesDelivered,
          standing: r.standing,
        })),
    [weekRows],
  );

  const topQuality = useMemo(() => getTopN(qualityScores, 10, PERFECT_QUALITY), [qualityScores]);
  const bottomQuality = useMemo(() => getBottomN(qualityScores, 10), [qualityScores]);

  // Quality scores for no-safety-data DAs
  const qualityForNoSafety = useMemo(
    () =>
      safetyNoData.map(r => ({
        transporterId: r.transporterId,
        name: r.name,
        score: r.normalizedQualityScore,
        packages: r.packagesDelivered,
      })),
    [safetyNoData],
  );

  // Trailing top/bottom 30
  const trailingOverallData = useMemo(
    () =>
      [...trailingAverages].sort((a, b) => b.avgOverallScore - a.avgOverallScore),
    [trailingAverages],
  );

  const top30Overall = useMemo(
    () =>
      getTopN(
        trailingOverallData.map(t => ({ transporterId: t.transporterId, name: t.name, score: t.avgOverallScore, packages: t.totalPackages })),
        30,
        PERFECT_OVERALL,
      ),
    [trailingOverallData],
  );

  const bottom30Overall = useMemo(
    () =>
      getBottomN(
        trailingOverallData.map(t => ({ transporterId: t.transporterId, name: t.name, score: t.avgOverallScore, packages: t.totalPackages })),
        30,
      ),
    [trailingOverallData],
  );

  const trailingSafetyData = useMemo(
    () =>
      trailingAverages.filter(t => t.avgSafetyScore > 0 || t.weekCount > 0).sort((a, b) => b.avgSafetyScore - a.avgSafetyScore),
    [trailingAverages],
  );

  const top30Safety = useMemo(
    () =>
      getTopN(
        trailingSafetyData.map(t => ({ transporterId: t.transporterId, name: t.name, score: t.avgSafetyScore, packages: t.totalPackages })),
        30,
        PERFECT_SAFETY,
      ),
    [trailingSafetyData],
  );

  const bottom30Safety = useMemo(
    () =>
      getBottomN(
        trailingSafetyData.map(t => ({ transporterId: t.transporterId, name: t.name, score: t.avgSafetyScore, packages: t.totalPackages })),
        30,
      ),
    [trailingSafetyData],
  );

  const trailingQualityData = useMemo(
    () =>
      trailingAverages.filter(t => t.avgQualityScore > 0).sort((a, b) => b.avgQualityScore - a.avgQualityScore),
    [trailingAverages],
  );

  const top30Quality = useMemo(
    () =>
      getTopN(
        trailingQualityData.map(t => ({ transporterId: t.transporterId, name: t.name, score: t.avgQualityScore, packages: t.totalPackages })),
        30,
        PERFECT_QUALITY,
      ),
    [trailingQualityData],
  );

  const bottom30Quality = useMemo(
    () =>
      getBottomN(
        trailingQualityData.map(t => ({ transporterId: t.transporterId, name: t.name, score: t.avgQualityScore, packages: t.totalPackages })),
        30,
      ),
    [trailingQualityData],
  );

  // Distribution chart data
  const overallChartScores = useMemo(() => overallScores.map(s => s.score), [overallScores]);
  const safetyChartScores = useMemo(() => safetyWithScores.map(s => s.score), [safetyWithScores]);
  const qualityChartScores = useMemo(() => qualityScores.map(s => s.score), [qualityScores]);

  const trailingOverallChartScores = useMemo(() => trailingAverages.map(t => t.avgOverallScore).filter(s => s > 0), [trailingAverages]);
  const trailingSafetyChartScores = useMemo(() => trailingSafetyData.map(t => t.avgSafetyScore), [trailingSafetyData]);
  const trailingQualityChartScores = useMemo(() => trailingQualityData.map(t => t.avgQualityScore), [trailingQualityData]);

  const hasData = rows.length > 0;

  const toTopRanking = (items: typeof topOverall) =>
    items.map((item, idx) => ({
      rank: idx + 1,
      name: item.name,
      transporterId: item.transporterId,
      score: item.score,
      packages: item.packages,
      standing: 'standing' in item ? (item as any).standing : undefined,
    }));

  const toBottomRanking = (items: typeof bottomOverall) =>
    items.map((item, idx) => ({
      rank: idx + 1,
      name: item.name,
      transporterId: item.transporterId,
      score: item.score,
      packages: item.packages,
      standing: 'standing' in item ? (item as any).standing : undefined,
    }));

  const toTrailingRanking = (items: Array<{ transporterId: string; name: string; score: number; packages: number }>) =>
    items.map((item, idx) => {
      const avg = trailingAverages.find(t => t.transporterId === item.transporterId);
      return {
        rank: idx + 1,
        name: item.name,
        transporterId: item.transporterId,
        avgScore: item.score,
        totalPackages: item.packages,
        weekCount: avg?.weekCount ?? 0,
      };
    });

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex items-center justify-between rounded-lg section-card p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-foreground">DA Performance</h1>
          {fileName && (
            <div className="flex items-center gap-2 rounded-md surface-elevated px-3 py-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{fileName}</span>
            </div>
          )}
        </div>
        <ScorecardCSVUpload compact />
      </div>

      <AnimatePresence mode="wait">
        {!hasData ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8"
          >
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-6 rounded-xl section-card p-6"
              >
                <BarChart3 className="h-16 w-16 text-muted-foreground" />
              </motion.div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">DA Performance Rankings</h2>
              <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
                Upload one or more Scorecard CSV files to view overall, safety, and quality rankings with trailing averages.
              </p>
              <div className="w-full max-w-lg">
                <ScorecardCSVUpload />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 rounded-lg section-card p-4">
              <label className="text-sm font-medium text-muted-foreground">Week:</label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {loadedWeeks.map(week => (
                  <option key={week} value={week}>{week}</option>
                ))}
              </select>
              <span className="rounded-full surface-elevated px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {weekRows.length} DAs
              </span>
            </div>

            {/* === OVERALL === */}
            <div className="rounded-lg section-card p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">Overall Performance Rankings</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <RankingTable
                    title={topOverall.length > 10 ? `Top Overall Performers — All Perfect Scores (${topOverall.length})` : 'Top 10 Overall Performers'}
                    data={toTopRanking(topOverall)}
                    maxScore={100}
                    titleColor="#4285f4"
                    scoreLabel="Overall Score"
                  />
                  <RankingTable
                    title="Bottom 10 Overall Performers"
                    data={toBottomRanking(bottomOverall)}
                    maxScore={100}
                    titleColor="#ea4335"
                    scoreLabel="Overall Score"
                  />
                </div>
                <div className="flex items-center">
                  <ScoreDistributionChart
                    title="Overall Score Distribution"
                    scores={overallChartScores}
                    maxScore={100}
                  />
                </div>
              </div>
            </div>

            {/* === SAFETY === */}
            <div className="rounded-lg section-card p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">Safety Group Rankings</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <RankingTable
                    title={topSafety.length > 10 ? `Top Safety Performers — All Perfect Scores (${topSafety.length})` : 'Top 10 Safety Performers'}
                    data={toTopRanking(topSafety)}
                    maxScore={STANDARD_SAFETY_WEIGHT}
                    titleColor="#34a853"
                    scoreLabel="Safety Score"
                  />
                  <RankingTable
                    title="Bottom 10 Safety Performers"
                    data={toBottomRanking(bottomSafety)}
                    maxScore={STANDARD_SAFETY_WEIGHT}
                    titleColor="#ea4335"
                    scoreLabel="Safety Score"
                  />
                </div>
                <div className="flex items-center">
                  <ScoreDistributionChart
                    title="Safety Score Distribution"
                    scores={safetyChartScores}
                    maxScore={STANDARD_SAFETY_WEIGHT}
                  />
                </div>
              </div>

              {safetyNoData.length > 0 && (
                <div className="mt-4">
                  <NoSafetyDataTable rows={safetyNoData} qualityScores={qualityForNoSafety} />
                </div>
              )}
            </div>

            {/* === QUALITY === */}
            <div className="rounded-lg section-card p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">Quality Group Rankings</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <RankingTable
                    title={topQuality.length > 10 ? `Top Quality Performers — All Perfect Scores (${topQuality.length})` : 'Top 10 Quality Performers'}
                    data={toTopRanking(topQuality)}
                    maxScore={STANDARD_QUALITY_WEIGHT}
                    titleColor="#fbbc04"
                    scoreLabel="Quality Score"
                  />
                  <RankingTable
                    title="Bottom 10 Quality Performers"
                    data={toBottomRanking(bottomQuality)}
                    maxScore={STANDARD_QUALITY_WEIGHT}
                    titleColor="#ea4335"
                    scoreLabel="Quality Score"
                  />
                </div>
                <div className="flex items-center">
                  <ScoreDistributionChart
                    title="Quality Score Distribution"
                    scores={qualityChartScores}
                    maxScore={STANDARD_QUALITY_WEIGHT}
                  />
                </div>
              </div>
            </div>

            {/* === TRAILING AVERAGES === */}
            {loadedWeeks.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="rounded-lg section-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-px bg-border" />
                    <h2 className="text-base font-semibold text-foreground">Trailing Performance Averages</h2>
                    <span className="rounded-full surface-elevated px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {loadedWeeks.length} week(s) · Scores averaged · Packages totaled
                    </span>
                  </div>
                </div>

                <div className="rounded-lg section-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Extended Overall Rankings (Top / Bottom 30)</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TrailingTable
                      title={top30Overall.length > 30 ? `Top Overall — All Perfect (${top30Overall.length})` : 'Top 30 Overall'}
                      data={toTrailingRanking(top30Overall)}
                      maxScore={100}
                      titleColor="#4285f4"
                      scoreLabel="Avg Overall"
                    />
                    <TrailingTable
                      title="Bottom 30 Overall"
                      data={toTrailingRanking(bottom30Overall)}
                      maxScore={100}
                      titleColor="#ea4335"
                      scoreLabel="Avg Overall"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <ScoreDistributionChart
                      title="Trailing Overall Distribution"
                      scores={trailingOverallChartScores}
                      maxScore={100}
                    />
                    <ScoreDistributionChart
                      title="Trailing Safety Distribution"
                      scores={trailingSafetyChartScores}
                      maxScore={STANDARD_SAFETY_WEIGHT}
                    />
                    <ScoreDistributionChart
                      title="Trailing Quality Distribution"
                      scores={trailingQualityChartScores}
                      maxScore={STANDARD_QUALITY_WEIGHT}
                    />
                  </div>
                </div>

                <div className="rounded-lg section-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Extended Safety Rankings (Top / Bottom 30)</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TrailingTable
                      title={top30Safety.length > 30 ? `Top Safety — All Perfect (${top30Safety.length})` : 'Top 30 Safety'}
                      data={toTrailingRanking(top30Safety)}
                      maxScore={STANDARD_SAFETY_WEIGHT}
                      titleColor="#34a853"
                      scoreLabel="Avg Safety"
                    />
                    <TrailingTable
                      title="Bottom 30 Safety"
                      data={toTrailingRanking(bottom30Safety)}
                      maxScore={STANDARD_SAFETY_WEIGHT}
                      titleColor="#ea4335"
                      scoreLabel="Avg Safety"
                    />
                  </div>
                </div>

                <div className="rounded-lg section-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Extended Quality Rankings (Top / Bottom 30)</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TrailingTable
                      title={top30Quality.length > 30 ? `Top Quality — All Perfect (${top30Quality.length})` : 'Top 30 Quality'}
                      data={toTrailingRanking(top30Quality)}
                      maxScore={STANDARD_QUALITY_WEIGHT}
                      titleColor="#fbbc04"
                      scoreLabel="Avg Quality"
                    />
                    <TrailingTable
                      title="Bottom 30 Quality"
                      data={toTrailingRanking(bottom30Quality)}
                      maxScore={STANDARD_QUALITY_WEIGHT}
                      titleColor="#ea4335"
                      scoreLabel="Avg Quality"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
