import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { useChartTheme } from '../hooks/useChartTheme';
import { CDF_DEFECT_COLUMNS, CDF_DEFECT_LABELS, CDF_DEFECT_COLORS } from '../store/useCDFStore';
import type { EmployeeSummary } from '../store/useCDFStore';

interface CDFCategoryChartProps {
  categoryTotals: Record<string, number>;
}

export function CDFCategoryChart({ categoryTotals }: CDFCategoryChartProps) {
  const { colors } = useChartTheme();

  const pieData = useMemo(
    () =>
      CDF_DEFECT_COLUMNS
        .filter(c => (categoryTotals[c] || 0) > 0)
        .map(c => ({
          name: (CDF_DEFECT_LABELS[c as keyof typeof CDF_DEFECT_LABELS] || c).split(' ').slice(0, 3).join(' '),
          value: categoryTotals[c] || 0,
          _key: c,
        })),
    [categoryTotals]
  );

  const total = useMemo(() => pieData.reduce((s, d) => s + d.value, 0), [pieData]);

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
      name: 'Defect Categories',
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
      emphasis: {
        itemStyle: {
          shadowBlur: 22,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
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
        name: d.name,
        value: d.value,
        itemStyle: { color: CDF_DEFECT_COLORS[d._key] || '#888' },
      })),
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }), [pieData, total, colors]);

  const chartStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const chartOpts = useMemo(() => ({ renderer: 'canvas' as const }), []);

  if (pieData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg section-card backdrop-blur-sm p-4 flex flex-col flex-1 min-h-0 items-center justify-center"
      >
        <p className="text-sm text-text-subtle">No defect data to display</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-lg section-card backdrop-blur-sm p-4 flex flex-col"
      style={{ minHeight: 320 }}
    >
      <div className="shrink-0 mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-subtle">Defect Distribution by Category</h3>
        <span className="pill pill-default">
          {total} defects
        </span>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full h-full">
          <ReactECharts
            option={option}
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

interface CDFDefectSplitChartProps {
  summaries: EmployeeSummary[];
}

export function CDFDefectSplitChart({ summaries }: CDFDefectSplitChartProps) {
  const { colors } = useChartTheme();

  const { zeroCount, withDefectCount } = useMemo(() => {
    const zero = summaries.filter(e => e.totalDefects === 0).length;
    const withD = summaries.filter(e => e.totalDefects > 0).length;
    return { zeroCount: zero, withDefectCount: withD };
  }, [summaries]);

  const total = zeroCount + withDefectCount;

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
      name: 'Defect Status',
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      padAngle: 1,
      itemStyle: {
        borderRadius: 6,
        borderWidth: 0,
        borderColor: 'transparent',
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 22,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
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
      data: [
        { name: 'Defect-Free', value: zeroCount, itemStyle: { color: '#34a853' } },
        { name: 'With Defects', value: withDefectCount, itemStyle: { color: '#ea4335' } },
      ],
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }), [zeroCount, withDefectCount, total, colors]);

  const chartStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const chartOpts = useMemo(() => ({ renderer: 'canvas' as const }), []);

  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg section-card backdrop-blur-sm p-4 flex flex-col flex-1 min-h-0 items-center justify-center"
      >
        <p className="text-sm text-text-subtle">No data to display</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-lg section-card backdrop-blur-sm p-4 flex flex-col flex-1 min-h-0"
    >
      <div className="shrink-0 mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-subtle">Employees: Defect-Free vs With Defects</h3>
        <span className="pill pill-default">
          {total} employees
        </span>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full h-full">
          <ReactECharts
            option={option}
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
