import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { useRTSStore } from '../store/useRTSStore';
import { useChartTheme } from '../hooks/useChartTheme';
import { getRTSDistribution } from '../lib/utils';
import { assignColors } from '../lib/colors';

export default function RTSPieChart() {
  const filteredData = useRTSStore(s => s.filteredData);
  const { colors, theme: chartTheme } = useChartTheme();

  const pieData = useMemo(() => getRTSDistribution(filteredData), [filteredData]);
  const total = useMemo(() => pieData.reduce((sum, d) => sum + d.value, 0), [pieData]);
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
    legend: {
      show: false,
    },
    series: [{
      name: 'RTS Codes',
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
      },
       label: {
         show: true,
         position: 'outside',
         fontSize: 10,
         minShowLabelAngle: 0,
         textStyle: {
           color: colors.pie.label,
         },
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
        itemStyle: {
          color: colorMap.get(d.name),
        },
      })),
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }), [pieData, total, colors, colorMap]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-lg section-card p-5"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">RTS Code Distribution</h3>
        <span className="rounded-full surface-elevated px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {total} total
        </span>
      </div>
      <ReactECharts
        option={option}
        theme={chartTheme}
        style={{ height: 350, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
        showLoading={false}
      />
    </motion.div>
  );
}
