import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { useChartTheme } from '../hooks/useChartTheme';


interface ScoreDistributionChartProps {
  title: string;
  scores: number[];
  maxScore: number;
}

const bucketRanges = [
  { range: '0-49%', minPct: 0, maxPct: 49, color: '#d32f2f' },
  { range: '50-59%', minPct: 50, maxPct: 59, color: '#f4511e' },
  { range: '60-69%', minPct: 60, maxPct: 69, color: '#ff9800' },
  { range: '70-79%', minPct: 70, maxPct: 79, color: '#fdd835' },
  { range: '80-89%', minPct: 80, maxPct: 89, color: '#7cb342' },
  { range: '90-99%', minPct: 90, maxPct: 99.994, color: '#0f9d58' },
  { range: 'Perfect', minPct: 99.995, maxPct: 100, color: '#067d3c' },
];

function createBuckets(scores: number[], maxScore: number) {
  const buckets = bucketRanges.map(b => ({ ...b, count: 0 }));
  scores.forEach(score => {
    const pct = (score / maxScore) * 100;
    for (const bucket of buckets) {
      if (pct >= bucket.minPct && pct <= bucket.maxPct) {
        bucket.count++;
        break;
      }
    }
  });
  return buckets;
}

export function ScoreDistributionChart({ title, scores, maxScore }: ScoreDistributionChartProps) {
  const { colors, theme: chartTheme } = useChartTheme();

  const buckets = useMemo(() => createBuckets(scores, maxScore), [scores, maxScore]);
  const total = useMemo(() => scores.length, [scores]);

  const pieData = useMemo(
    () =>
      buckets
        .filter(b => b.count > 0)
        .map(b => ({ name: b.range, value: b.count, color: b.color })),
    [buckets],
  );

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number }) => {
        const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0';
        return `<div style="font-weight:600;margin-bottom:4px;color:${colors.tooltip.text};">${params.name}</div>
          <div style="color:${colors.tooltip.muted};">Count: <strong style="color:${colors.tooltip.text};">${params.value}</strong></div>
          <div style="color:${colors.tooltip.muted};">Percentage: <strong style="color:${colors.tooltip.text};">${pct}%</strong></div>`;
      },
    },
    legend: { show: false },
    series: [{
      name: title,
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      padAngle: 1,
      minAngle: 1,
      itemStyle: { borderRadius: 6, borderWidth: 0 },
      label: {
        show: true,
        position: 'outside',
        fontSize: 10,
        textStyle: { color: colors.pie.label },
        formatter: (params: { name: string; percent: number }) => `${params.name}\n${params.percent.toFixed(1)}%`,
      },
      labelLine: {
        show: true,
        length: 20,
        length2: 30,
        smooth: true,
        lineStyle: { color: colors.pie.line, width: 1 },
      },
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: (idx: number) => idx * 80,
      data: pieData.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: d.color },
      })),
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }), [pieData, total, colors, title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg section-card p-3 sm:p-4 flex flex-col h-full min-h-[260px]"
    >
      <div className="shrink-0 mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <span className="rounded-full surface-elevated px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {total} DAs
        </span>
      </div>
      {/* Chart area: grows to fill card, but caps at 480px so it doesn't look absurd
          when the sibling ranking table is extremely tall (e.g. 43 perfect scorers).
          Centered vertically so it sits nicely in the middle of the available space. */}
      <div className="flex flex-1 items-center justify-center min-h-0">
        <div className="w-full min-h-[240px] max-h-[480px] h-full">
          <ReactECharts
            option={option}
            theme={chartTheme}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
          />
        </div>
      </div>
    </motion.div>
  );
}
