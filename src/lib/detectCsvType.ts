export type CsvFileType = 'rts' | 'scorecard' | 'cdf' | 'dsb' | 'unknown';

export function detectCsvType(headers: string[]): CsvFileType {
  const normalized = headers.map(h => h.trim());

  // RTS: "DA Selected RTS Code" or "RTS Code"
  if (
    normalized.some(
      (h) =>
        h === 'DA Selected RTS Code' ||
        h === 'RTS Code' ||
        h === 'DA Selected RTS Code ' ||
        h === 'RTS Code '
    )
  ) {
    return 'rts';
  }

  // Scorecard: "Overall Score" AND "Week" AND "Transporter ID"
  if (
    normalized.includes('Overall Score') &&
    normalized.includes('Week') &&
    normalized.includes('Transporter ID')
  ) {
    return 'scorecard';
  }

  // CDF: "Feedback Details" AND "DA Mishandled Package"
  if (
    normalized.includes('Feedback Details') &&
    normalized.includes('DA Mishandled Package')
  ) {
    return 'cdf';
  }

  // DSB: "Impacts DSB" AND "Concession Date"
  if (
    normalized.includes('Impacts DSB') &&
    normalized.includes('Concession Date')
  ) {
    return 'dsb';
  }

  return 'unknown';
}
