import Papa from 'papaparse';
import type { RTSDataRow } from './types';
import { mapCsvHeaders, parseDate, normalizeRTSCode } from '../headerMap';

let rowCounter = 0;

export function resetRowCounter() {
  rowCounter = 0;
}

export function parseRTSCSV(csvText: string, fileName: string = 'rts.csv'): RTSDataRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    worker: false,
    download: false,
  });

  if (result.errors.length > 0 || result.data.length === 0) return [];

  const headers = result.meta?.fields || [];
  const mapping = mapCsvHeaders(headers);

  if (Object.keys(mapping).length === 0) return [];

  return result.data.map((row, idx) => {
    const getValue = (key: string): string => {
      const colIdx = mapping[key];
      if (colIdx === undefined) return '';
      const val = row[headers[colIdx]];
      return val != null && typeof val === 'string' ? val : '';
    };

    const globalIdx = rowCounter++;
    return {
      _id: `${fileName}-${idx}-${globalIdx}`,
      deliveryAssociate: getValue('deliveryAssociate'),
      trackingId: getValue('trackingId'),
      transporterId: getValue('transporterId'),
      impactDcr: getValue('impactDcr'),
      rtsCode: normalizeRTSCode(getValue('rtsCode')),
      additionalInformation: getValue('additionalInformation'),
      exemptionReason: getValue('exemptionReason'),
      plannedDeliveryDate: getValue('plannedDeliveryDate'),
      serviceArea: getValue('serviceArea'),
      normalizedDate: parseDate(getValue('plannedDeliveryDate')),
    };
  });
}
