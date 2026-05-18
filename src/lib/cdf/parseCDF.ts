import Papa from 'papaparse';
import type { CDFRow } from './types';

function bool(val: string): boolean {
  const trimmed = val.trim();
  return trimmed === '1' || trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'yes';
}

function findCol(headers: string[], exact: string): number {
  return headers.findIndex((h) => h.trim() === exact);
}

export function parseCDF(csvText: string, week: string = 'Unknown'): CDFRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    worker: false,
    download: false,
  });

  if (result.errors.length > 0 || result.data.length === 0) return [];

  const headers = result.meta?.fields || [];

  const daIdx = findCol(headers, 'Delivery Associate');
  const daNameIdx = findCol(headers, 'Delivery Associate Name');
  const trackingIdx = findCol(headers, 'Tracking ID');
  const dateIdx = findCol(headers, 'Delivery Date');
  const feedbackIdx = findCol(headers, 'Feedback Details');
  const mishandledIdx = findCol(headers, 'DA Mishandled Package');
  const unprofessionalIdx = findCol(headers, 'DA was Unprofessional');
  const instructionsIdx = findCol(headers, 'DA did not follow my delivery instructions');
  const wrongAddressIdx = findCol(headers, 'Delivered to Wrong Address');
  const neverReceivedIdx = findCol(headers, 'Never Received Delivery');
  const wrongItemIdx = findCol(headers, 'Received Wrong Item');

  return result.data.map((row, idx) => {
    const da = daIdx >= 0 ? (row[headers[daIdx]] || '').trim() : '';
    const daName = daNameIdx >= 0 ? (row[headers[daNameIdx]] || '').trim() : '';
    const trackingId = trackingIdx >= 0 ? (row[headers[trackingIdx]] || '').trim() : '';
    const deliveryDate = dateIdx >= 0 ? (row[headers[dateIdx]] || '').trim() || null : null;
    const feedbackDetails = feedbackIdx >= 0 ? (row[headers[feedbackIdx]] || '').trim() : '';

    const mishandledPackage = mishandledIdx >= 0 ? bool(row[headers[mishandledIdx]] || '0') : false;
    const unprofessional = unprofessionalIdx >= 0 ? bool(row[headers[unprofessionalIdx]] || '0') : false;
    const didNotFollowInstructions = instructionsIdx >= 0 ? bool(row[headers[instructionsIdx]] || '0') : false;
    const deliveredToWrongAddress = wrongAddressIdx >= 0 ? bool(row[headers[wrongAddressIdx]] || '0') : false;
    const neverReceivedDelivery = neverReceivedIdx >= 0 ? bool(row[headers[neverReceivedIdx]] || '0') : false;
    const receivedWrongItem = wrongItemIdx >= 0 ? bool(row[headers[wrongItemIdx]] || '0') : false;

    const defectCategories: string[] = [];
    if (mishandledPackage) defectCategories.push('mishandledPackage');
    if (unprofessional) defectCategories.push('unprofessional');
    if (didNotFollowInstructions) defectCategories.push('didNotFollowInstructions');
    if (deliveredToWrongAddress) defectCategories.push('deliveredToWrongAddress');
    if (neverReceivedDelivery) defectCategories.push('neverReceivedDelivery');
    if (receivedWrongItem) defectCategories.push('receivedWrongItem');

    return {
      _id: `${da}::${trackingId}::${idx}`,
      week,
      deliveryAssociate: da,
      deliveryAssociateName: daName,
      trackingId,
      deliveryDate,
      mishandledPackage,
      unprofessional,
      didNotFollowInstructions,
      deliveredToWrongAddress,
      neverReceivedDelivery,
      receivedWrongItem,
      feedbackDetails,
      defectCategories,
      impactsDsb: false,
    };
  });
}
