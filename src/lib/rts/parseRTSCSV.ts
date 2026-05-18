import Papa from 'papaparse';
import type { RTSDataRow } from './types';
import { mapCsvHeaders, parseDate, normalizeRTSCode } from '../headerMap';

export function parseRTSCSV(csvText: string, fileName: string = 'rts.csv', week: string = 'Unknown'): RTSDataRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    worker: false,
    download: false,
  });

  if (result.errors.length > 0 || result.data.length === 0) return [];

  const headers = result.meta?.fields || [];
  const mapping = mapCsvHeaders(headers);

  if (Object.keys(mapping).length === 0) {
    throw new Error(`File "${fileName}" has no recognized RTS headers. Make sure the CSV contains columns like Delivery Associate, Tracking ID, Transporter ID, and RTS Code.`);
  }

  const RTS_REQUIRED = ['deliveryAssociate', 'trackingId', 'transporterId', 'rtsCode'];
  const missing = RTS_REQUIRED.filter(k => !(k in mapping));
  if (missing.length > 0) {
    throw new Error(`File "${fileName}" is missing required RTS columns: ${missing.join(', ')}. Found headers: ${headers.join(', ')}`);
  }

  return result.data.map((row, idx) => {
    const getValue = (key: string): string => {
      const colIdx = mapping[key];
      if (colIdx === undefined) return '';
      const val = row[headers[colIdx]];
      return val != null && typeof val === 'string' ? val : '';
    };

    return {
      _id: `${fileName}-${fileName.split('.').slice(0, -1).join('.')}-${idx}`,
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
      week,
    };
  });
}
