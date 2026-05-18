export interface DSBRow {
  _id: string;
  deliveryAssociateName: string;
  deliveryAssociate: string;
  trackingId: string;
  impactsDsb: boolean;
  deliveryType: string;
  simultaneousDeliveries: boolean;
  deliveredOver50m: boolean;
  incorrectScanAttended: boolean;
  incorrectScanUnattended: boolean;
  noPodOnDelivery: boolean;
  scannedNotDeliveredNotReturned: boolean;
  pickupDate: string | null;
  deliveryAttemptDate: string | null;
  deliveryDate: string | null;
  concessionDate: string | null;
  serviceArea: string;
  dsp: string;
  defectCategories: string[];
}

export const DSB_DEFECT_COLUMNS = [
  'simultaneousDeliveries',
  'deliveredOver50m',
  'incorrectScanAttended',
  'incorrectScanUnattended',
  'noPodOnDelivery',
  'scannedNotDeliveredNotReturned',
  'other',
] as const;

export type DSBDefectColumn = (typeof DSB_DEFECT_COLUMNS)[number];

export const DSB_DEFECT_LABELS: Record<DSBDefectColumn, string> = {
  simultaneousDeliveries: 'Simultaneous Deliveries',
  deliveredOver50m: 'Delivered > 50 m',
  incorrectScanAttended: 'Incorrect Scan (Attended)',
  incorrectScanUnattended: 'Incorrect Scan (Unattended)',
  noPodOnDelivery: 'No POD on Delivery',
  scannedNotDeliveredNotReturned: 'Scanned - Not Delivered - Not Returned',
  other: 'Other / Uncategorized',
};
