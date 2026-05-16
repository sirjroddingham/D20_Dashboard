import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { useChartTheme } from '../hooks/useChartTheme';
import { assignColors } from '../lib/colors';

interface ScoreDistributionChartProps {
  title: string;
  scores: number[];
  maxScore: number;
}

const bucketDefs = [
  { range: '0-49%', minPct: 0, maxPct: 49 },
  { range: '50-59%', minPct: 50, maxPct: 59 },
  { range: '60-69%', minPct: 60, maxPct: 69 },
  { range: '70-79%', minPct: 70, maxPct: 79 },
  { range: '80-89%', minPct: 80, maxPct: 89 },
  { range: '90-99%', minPct: 90, maxPct: 99.994 },
  { range: 'Perfect', minPct: 99.995, maxPct: 100 },
];

function createBuckets(scores: number[], maxScore: number) {
  const buckets = bucketDefs.map(b => ({ ...b, count: 0 }));
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

  const shadowBlur = 12;
  const shadowOffsetY = 6;
  const shadowColor = 'rgba(0, 0, 0, 0.45)';
  const shadowOffsetYHover = 14;
  const shadowBlurHover = 22;
  const shadowColorHover = 'rgba(0, 0, 0, 0.6)';

  const buckets = useMemo(() => createBuckets(scores, maxScore), [scores, maxScore]);

  const pieData = useMemo(
    () => buckets.filter(b => b.count > 0).map(b => ({ name: b.range, value: b.count })),
    [buckets],
  );

  const total = useMemo(() => scores.length, [scores]);
  const colorMap = useMemo(() => assignColors(pieData.map(d => d.name)), [pieData]);

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number }) => {
        const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
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
      itemStyle: {
        borderRadius: 6,
        borderWidth: 0,
        borderColor: 'transparent',
        shadowBlur,
        shadowColor,
        shadowOffsetY,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: shadowBlurHover,
          shadowColor: shadowColorHover,
          shadowOffsetY: shadowOffsetYHover,
        },
      },
      label: {
        show: true,
        position: 'outside',
        fontSize: 10,
        minShowLabelAngle: 0,
        textStyle: { color: colors.pie.label },
        formatter: (params: { name: string; percent: number }) =>
          `${params.name}\n${params.percent.toFixed(1)}%`,
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
      animationDelay: (idx: number) => idx * 100,
      data: pieData.map((d) => ({
        ...d,
        itemStyle: { color: colorMap.get(d.name) },
      })),
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }), [pieData, total, colors, colorMap, title, shadowBlur, shadowColor, shadowOffsetY, shadowBlurHover, shadowColorHover, shadowOffsetYHover]);

  const chartStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const chartOpts = useMemo(() => ({ renderer: 'canvas' as const }), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-lg section-card p-2 sm:p-2 flex flex-col flex-1 min-h-0"
    >
      <div className="shrink-0 mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-subtle">{title}</h3>
        <span className="pill pill-default">
          {total} DAs
        </span>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full h-full">
          <ReactECharts
            option={option}
            theme={chartTheme}
            style={chartStyle}
            opts={chartOpts}
            notMerge={true}
            showLoading={false}
          />
        </div>
      </div>
    </motion.div>
  );
}
