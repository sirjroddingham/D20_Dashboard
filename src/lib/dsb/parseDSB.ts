import Papa from 'papaparse';
import type { DSBRow } from './types';

function bool(val: string): boolean {
  const trimmed = val.trim();
  return trimmed === '1' || trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'yes';
}

function nullStr(val: string): string | null {
  const trimmed = val.trim();
  return trimmed || null;
}

function findCol(headers: string[], exact: string): number {
  return headers.findIndex((h) => h.trim() === exact);
}

export function parseDSB(csvText: string): DSBRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    worker: false,
    download: false,
  });

  if (result.errors.length > 0 || result.data.length === 0) return [];

  const headers = result.meta?.fields || [];

  const daNameIdx = findCol(headers, 'Delivery Associate Name');
  const daIdx = findCol(headers, 'Delivery Associate');
  const impactsDsbIdx = findCol(headers, 'Impacts DSB');
  const deliveryTypeIdx = findCol(headers, 'Delivery Type');
  const simultaneousIdx = findCol(headers, 'Simultaneous Deliveries');
  const delivered50mIdx = findCol(headers, 'Delivered > 50 m');
  const incorrectAttendedIdx = findCol(headers, 'Incorrect Scan Usage - Attended Delivery');
  const incorrectUnattendedIdx = findCol(headers, 'Incorrect Scan Usage - Unattended Delivery');
  const noPodIdx = findCol(headers, 'No POD on Delivery');
  const scannedNotDeliveredIdx = findCol(headers, 'Scanned - Not Delivered - Not Returned');
  const trackingIdx = findCol(headers, 'Tracking ID');
  const pickupDateIdx = findCol(headers, 'Pickup Date');
  const deliveryAttemptIdx = findCol(headers, 'Delivery Attempt Date');
  const deliveryDateIdx = findCol(headers, 'Delivery Date');
  const concessionDateIdx = findCol(headers, 'Concession Date');
  const serviceAreaIdx = findCol(headers, 'Service Area');
  const dspIdx = findCol(headers, 'DSP');

  return result.data.map((row, idx) => {
    const getVal = (colIdx: number): string => {
      if (colIdx === -1) return '';
      return (row[headers[colIdx]] || '').trim();
    };

    const getBool = (colIdx: number): boolean => {
      if (colIdx === -1) return false;
      return bool(row[headers[colIdx]] || '0');
    };

    const simultaneousDeliveries = getBool(simultaneousIdx);
    const deliveredOver50m = getBool(delivered50mIdx);
    const incorrectScanAttended = getBool(incorrectAttendedIdx);
    const incorrectScanUnattended = getBool(incorrectUnattendedIdx);
    const noPodOnDelivery = getBool(noPodIdx);
    const scannedNotDeliveredNotReturned = getBool(scannedNotDeliveredIdx);

    const defectCategories: string[] = [];
    if (simultaneousDeliveries) defectCategories.push('simultaneousDeliveries');
    if (deliveredOver50m) defectCategories.push('deliveredOver50m');
    if (incorrectScanAttended) defectCategories.push('incorrectScanAttended');
    if (incorrectScanUnattended) defectCategories.push('incorrectScanUnattended');
    if (noPodOnDelivery) defectCategories.push('noPodOnDelivery');
    if (scannedNotDeliveredNotReturned) defectCategories.push('scannedNotDeliveredNotReturned');

    return {
      _id: `${getVal(daIdx)}::${getVal(trackingIdx)}::${idx}`,
      deliveryAssociateName: getVal(daNameIdx),
      deliveryAssociate: getVal(daIdx),
      trackingId: getVal(trackingIdx),
      impactsDsb: getBool(impactsDsbIdx),
      deliveryType: getVal(deliveryTypeIdx),
      simultaneousDeliveries,
      deliveredOver50m,
      incorrectScanAttended,
      incorrectScanUnattended,
      noPodOnDelivery,
      scannedNotDeliveredNotReturned,
      pickupDate: nullStr(getVal(pickupDateIdx)),
      deliveryAttemptDate: nullStr(getVal(deliveryAttemptIdx)),
      deliveryDate: nullStr(getVal(deliveryDateIdx)),
      concessionDate: nullStr(getVal(concessionDateIdx)),
      serviceArea: getVal(serviceAreaIdx),
      dsp: getVal(dspIdx),
      defectCategories,
    };
  });
}
