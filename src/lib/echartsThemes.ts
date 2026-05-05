function toRgba(v: string, alpha?: number): string {
  const trimmed = v.trim();
  if (!trimmed) return 'transparent';

  const rgbaMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    if (alpha !== undefined) return `rgba(${r},${g},${b},${alpha})`;
    return trimmed;
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3 && alpha !== undefined) {
    return `rgba(${parts.slice(0, 3).join(',')},${alpha})`;
  }
  if (parts.length === 4) return `rgba(${parts.join(',')})`;
  if (parts.length === 3) return `rgb(${parts.join(',')})`;
  return trimmed;
}

export interface TooltipColors {
  bg: string;
  border: string;
  text: string;
  muted: string;
  hoverBg: string;
  hoverBorder: string;
}

export interface PieColors {
  label: string;
  line: string;
  border: string;
}

export interface ChartColors {
  tooltip: TooltipColors;
  pie: PieColors;
  axisText: string;
  axisLine: string;
  gridLine: string;
  zoomBorder: string;
  zoomFill: string;
}

export interface EChartsThemeObject {
  color: string[];
  backgroundColor: string;
  textStyle: { color: string };
  tooltip: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    textStyle: { color: string; fontSize: number };
  };
  axisLine: { lineStyle: { color: string } };
  axisLabel: { color: string };
  splitLine: { lineStyle: { color: string; type: 'dashed' } };
  dataZoom: Array<{
    type: 'slider';
    borderColor: string;
    fillerColor: string;
  }>;
}

function readCSSVars() {
  const s = getComputedStyle(document.documentElement);
  const get = (v: string) => s.getPropertyValue(v).trim();

  return {
    tooltipBg: toRgba(get('--chart-tooltip-bg-alpha')),
    tooltipBorder: toRgba(get('--chart-tooltip-border')),
    tooltipText: toRgba(get('--chart-tooltip-text')),
    tooltipMuted: toRgba(get('--chart-tooltip-muted')),
    tooltipHoverBg: toRgba(get('--chart-tooltip-hover-bg'), 0.9),
    tooltipHoverBorder: toRgba(get('--chart-tooltip-hover-border'), 0.3),
    axisText: toRgba(get('--chart-axis-text')),
    axisLine: toRgba(get('--chart-axis-line'), 0.3),
    gridLine: toRgba(get('--chart-grid-line')),
    pieBorder: toRgba(get('--chart-pie-border')),
    pieLabel: toRgba(get('--chart-pie-label')),
    pieLine: toRgba(get('--chart-pie-line')),
    zoomBorder: toRgba(get('--chart-zoom-border')),
    zoomFill: toRgba(get('--chart-zoom-fill')),
  };
}

export function getChartColors(): ChartColors {
  const v = readCSSVars();
  return {
    tooltip: {
      bg: v.tooltipBg,
      border: v.tooltipBorder,
      text: v.tooltipText,
      muted: v.tooltipMuted,
      hoverBg: v.tooltipHoverBg,
      hoverBorder: v.tooltipHoverBorder,
    },
    pie: {
      label: v.pieLabel,
      line: v.pieLine,
      border: v.pieBorder,
    },
    axisText: v.axisText,
    axisLine: v.axisLine,
    gridLine: v.gridLine,
    zoomBorder: v.zoomBorder,
    zoomFill: v.zoomFill,
  };
}

export function buildEChartsTheme(): EChartsThemeObject {
  const v = readCSSVars();
  return {
    color: [],
    backgroundColor: 'transparent',
    textStyle: {
      color: v.axisText,
    },
    tooltip: {
      backgroundColor: v.tooltipBg,
      borderColor: v.tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: v.tooltipText,
        fontSize: 13,
      },
    },
    axisLine: {
      lineStyle: {
        color: v.axisLine,
      },
    },
    axisLabel: {
      color: v.axisText,
    },
    splitLine: {
      lineStyle: {
        color: v.gridLine,
        type: 'dashed',
      },
    },
    dataZoom: [
      {
        type: 'slider',
        borderColor: v.zoomBorder,
        fillerColor: v.zoomFill,
      },
    ],
  };
}
