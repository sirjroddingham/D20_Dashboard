import Papa from 'papaparse';
import type { ScorecardRow } from './types';

export const STANDARD_SAFETY_WEIGHT = 52.1;
export const STANDARD_QUALITY_WEIGHT = 48.2;

export const PERFECT_OVERALL = 99.995;
export const PERFECT_SAFETY = 52.095;
export const PERFECT_QUALITY = 48.195;

interface ColumnMap {
  overallScore: number;
  packagesDelivered: number;
  safetyScores: number[];
  safetyWeights: number[];
  qualityScores: number[];
  qualityWeights: number[];
}

function mapColumns(headers: string[]): ColumnMap {
  const find = (name: string) => headers.findIndex(h => h.trim() === name);

  return {
    overallScore: find('Overall Score'),
    packagesDelivered: find('Packages Delivered'),
    safetyScores: [
      'Speeding Event Rate Score',
      'Seatbelt-Off Rate Score',
      'Distractions Rate Score',
      'Sign/ Signal Violations Rate Score',
      'Following Distance Rate Score',
    ].map(find),
    safetyWeights: [
      'Speeding Event Rate Weight Applied',
      'Seatbelt-Off Rate Weight Applied',
      'Distractions Rate Weight Applied',
      'Sign/ Signal Violations Rate Weight Applied',
      'Following Distance Rate Weight Applied',
    ].map(find),
    qualityScores: [
      'CDF DPMO Score',
      'CED Score',
      'DCR Score',
      'DSB DPMO Score',
      'POD Score',
    ].map(find),
    qualityWeights: [
      'CDF DPMO Weight Applied',
      'CED Weight Applied',
      'DCR Weight Applied',
      'DSB DPMO Weight Applied',
      'POD Weight Applied',
    ].map(find),
  };
}

function num(val: string): number | null {
  if (!val || val.trim() === '') return null;
  const trimmed = val.trim();
  if (trimmed.includes('%')) {
    const parsed = parseFloat(trimmed.replace('%', ''));
    return isNaN(parsed) ? null : parsed / 100;
  }
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? null : parsed;
}

export function parseScorecardCSV(csvText: string): ScorecardRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    worker: false,
    download: false,
  });

  if (result.errors.length > 0 || result.data.length === 0) return [];

  const headers = result.meta?.fields || [];
  const cols = mapColumns(headers);

  const nameIdx = headers.findIndex(h => h.trim() === 'Delivery Associate');
  const idIdx = headers.findIndex(h => h.trim() === 'Transporter ID');
  const weekIdx = headers.findIndex(h => h.trim() === 'Week');
  const standingIdx = headers.findIndex(h => h.trim() === 'Overall Standing');

  return result.data.map((row, idx) => {
    const get = (colIdx: number): string => {
      if (colIdx === -1) return '';
      const val = row[headers[colIdx]];
      return val != null && typeof val === 'string' ? val.trim() : '';
    };

    const week = get(weekIdx) || '';
    const name = get(nameIdx) || '';
    const transporterId = get(idIdx) || '';

    const safety = {
      speeding: { score: num(get(cols.safetyScores[0])) ?? null, weight: num(get(cols.safetyWeights[0])) ?? 0 },
      seatbelt: { score: num(get(cols.safetyScores[1])) ?? null, weight: num(get(cols.safetyWeights[1])) ?? 0 },
      distractions: { score: num(get(cols.safetyScores[2])) ?? null, weight: num(get(cols.safetyWeights[2])) ?? 0 },
      signSignal: { score: num(get(cols.safetyScores[3])) ?? null, weight: num(get(cols.safetyWeights[3])) ?? 0 },
      followingDistance: { score: num(get(cols.safetyScores[4])) ?? null, weight: num(get(cols.safetyWeights[4])) ?? 0 },
    };

    const quality = {
      cdfDpmo: { score: num(get(cols.qualityScores[0])) ?? null, weight: num(get(cols.qualityWeights[0])) ?? 0 },
      ced: { score: num(get(cols.qualityScores[1])) ?? null, weight: num(get(cols.qualityWeights[1])) ?? 0 },
      dcr: { score: num(get(cols.qualityScores[2])) ?? null, weight: num(get(cols.qualityWeights[2])) ?? 0 },
      dsb: { score: num(get(cols.qualityScores[3])) ?? null, weight: num(get(cols.qualityWeights[3])) ?? 0 },
      pod: { score: num(get(cols.qualityScores[4])) ?? null, weight: num(get(cols.qualityWeights[4])) ?? 0 },
    };

    // Weighted safety score (Code.js lines 282-298)
    const safetyMetrics = [safety.speeding, safety.seatbelt, safety.distractions, safety.signSignal, safety.followingDistance];
    let weightedSafetyTotal = 0;
    let totalSafetyWeight = 0;
    safetyMetrics.forEach(m => {
      totalSafetyWeight += m.weight;
      weightedSafetyTotal += (m.score ?? 0) * (m.weight / 100);
    });
    const hasSafetyData = totalSafetyWeight > 0;
    let normalizedSafetyScore = weightedSafetyTotal;
    if (hasSafetyData && totalSafetyWeight !== STANDARD_SAFETY_WEIGHT) {
      normalizedSafetyScore = (weightedSafetyTotal / totalSafetyWeight) * STANDARD_SAFETY_WEIGHT;
    }

    // Weighted quality score (Code.js lines 317-348)
    const qualityMetrics = [quality.cdfDpmo, quality.ced, quality.dcr, quality.dsb, quality.pod];
    let weightedQualityTotal = 0;
    let totalQualityWeight = 0;
    qualityMetrics.forEach(m => {
      totalQualityWeight += m.weight;
      weightedQualityTotal += (m.score ?? 0) * (m.weight / 100);
    });
    let normalizedQualityScore = weightedQualityTotal;
    if (totalQualityWeight > 0 && totalQualityWeight !== STANDARD_QUALITY_WEIGHT) {
      normalizedQualityScore = (weightedQualityTotal / totalQualityWeight) * STANDARD_QUALITY_WEIGHT;
    }

    const overallRaw = get(cols.overallScore);
    const overallVal = num(overallRaw);

    const standingRaw = get(standingIdx);

    return {
      _id: `${week}::${transporterId}::${idx}`,
      week,
      name,
      transporterId,
      standing: standingRaw === 'NA' || standingRaw === '' ? 'NA' : standingRaw,
      overallScore: overallVal ?? 0,
      packagesDelivered: num(get(cols.packagesDelivered)) ?? 0,
      safety,
      quality,
      normalizedSafetyScore,
      normalizedQualityScore,
      hasSafetyData,
    };
  });
}
