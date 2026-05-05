import { useEffect, useState } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { getChartColors, buildEChartsTheme, type ChartColors, type EChartsThemeObject } from '../lib/echartsThemes';

export interface ChartTheme {
  colors: ChartColors;
  theme: EChartsThemeObject;
}

export function useChartTheme(): ChartTheme {
  const themeVersion = useThemeStore(s => s.themeVersion);

  const [theme, setTheme] = useState<ChartTheme>(() => ({
    colors: getChartColors(),
    theme: buildEChartsTheme(),
  }));

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTheme({
          colors: getChartColors(),
          theme: buildEChartsTheme(),
        });
      });
    });
  }, [themeVersion]);

  return theme;
}
