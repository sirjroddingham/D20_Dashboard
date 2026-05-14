import { useMemo, useRef, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { useRTSStore } from '../store/useRTSStore';
import { useChartTheme } from '../hooks/useChartTheme';
import { getBarChartData } from '../lib/utils';
import { assignColors } from '../lib/colors';

export default function StackedBarChart() {
  const filteredData = useRTSStore(s => s.filteredData);
  const filters = useRTSStore(s => s.filters);
  const setFilters = useRTSStore(s => s.setFilters);
  const chartRef = useRef<ReactECharts>(null);
  const hoveredSeries = useRef<string | null>(null);

  const barData = useMemo(() => getBarChartData(filteredData), [filteredData]);
  const dates = useMemo(() => barData.map(d => d.date), [barData]);
  const codes = useMemo(() => {
    const allCodes = new Set<string>();
    for (const d of barData) {
      for (const code of Object.keys(d.counts)) {
        allCodes.add(code);
      }
    }
    return Array.from(allCodes).sort();
  }, [barData]);

  const colorMap = useMemo(() => assignColors(codes), [codes]);

  const series = useMemo(() => {
    return codes.map((code) => ({
      name: code,
      type: 'bar' as const,
      stack: 'total',
      emphasis: { focus: 'series' as const },
      data: barData.map(d => d.counts[code] || 0),
      itemStyle: {
        color: colorMap.get(code),
        borderRadius: 2,
      },
      barWidth: '60%',
    }));
  }, [barData, codes, colorMap]);

  const { colors, theme: chartTheme } = useChartTheme();

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;

    const handleMouseMove = (params: { seriesIndex?: number; seriesName?: string }) => {
      hoveredSeries.current = params.seriesName || null;
    };
    const handleMouseOut = () => {
      hoveredSeries.current = null;
    };

    chart.on('mousemove', handleMouseMove);
    chart.on('globalout', handleMouseOut);

    return () => {
      chart.off('mousemove', handleMouseMove);
      chart.off('globalout', handleMouseOut);
    };
  }, [codes]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const handleClick = useCallback((params: Record<string, unknown>) => {
    if (params.componentType !== 'series') return;
    const clickedDateStr = params.axisValue as string | undefined;
    if (!clickedDateStr) return;

    const [y, m, d] = clickedDateStr.split('-').map(Number);
    const clicked = new Date(y, m - 1, d);

    const range = filters.dateRange;
    if (range && range[0] && isSameDay(range[0], clicked)) {
      setFilters({ dateRange: null });
      return;
    }

    const clickedEnd = new Date(clicked.getFullYear(), clicked.getMonth(), clicked.getDate() + 1);
    setFilters({ dateRange: [clicked, clickedEnd] });
  }, [filters.dateRange, setFilters]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) {
      chart.on('click', handleClick);
      return () => {
        chart.off('click', handleClick);
      };
    }
  }, [handleClick]);

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      formatter: (params: { axisValue?: string; seriesName?: string; value?: number; marker?: string; color?: string }[]) => {
        const date = (params[0]?.axisValue as string) || '';

        let html = `<div style="font-weight:600;margin-bottom:6px;color:${colors.tooltip.text};">${date}</div>`;
        for (const p of params) {
          const isHovered = p.seriesName === hoveredSeries.current;
          const rowColor = isHovered ? colors.tooltip.text : colors.tooltip.muted;
          const fontWeight = isHovered ? '600' : '400';
          const bgColor = isHovered ? colors.tooltip.hoverBg : 'transparent';
          const borderColor = isHovered ? colors.tooltip.hoverBorder : 'transparent';
          const dotColor = p.color || '';
          html += `<div style="display:flex;justify-content:space-between;gap:16px;color:${rowColor};font-weight:${fontWeight};background:${bgColor};border-left:3px solid ${borderColor};padding:2px 6px;margin:1px 0;">
            <span style="display:flex;align-items:center;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};margin-right:6px;"></span>${p.seriesName}:</span>
            <strong style="color:${rowColor};">${p.value}</strong>
          </div>`;
        }
        const row = barData.find(d => d.date === date);
        if (row) {
          html += `<div style="border-top:1px solid ${colors.axisLine};margin-top:6px;padding-top:4px;font-weight:600;color:${colors.tooltip.text};">
            Total RTS: ${row.total}
          </div>`;
        }
        return html;
      },
    },
    legend: { show: false },
    grid: { left: 50, right: 20, top: 10, bottom: 80, containLabel: false },
    xAxis: {
      type: 'category' as const,
      data: dates,
      axisLabel: {
        fontSize: 11,
        rotate: 45,
        interval: 'auto',
        formatter: (val: string) => {
          const [y, m, d] = val.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { fontSize: 11 },
      axisLine: { show: false },
    },
    dataZoom: [
      {
        type: 'slider' as const,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        bottom: 10,
        height: 20,
        handleSize: '80%',
      },
      { type: 'inside' as const, xAxisIndex: [0], start: 0, end: 100 },
    ],
    series,
  }), [barData, dates, series, colors]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-lg section-card p-5"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-subtle">Daily RTS Trends</h3>
      </div>
      <p className="mb-3 text-xs text-text-subtle">
        Stacked bars show RTS codes by day. Click a bar to filter to that date.
      </p>
      <ReactECharts
        ref={chartRef}
        option={option}
        theme={chartTheme}
        style={{ height: 320, width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </motion.div>
  );
}
