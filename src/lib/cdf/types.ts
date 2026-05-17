export interface CDFRow {
  _id: string;
  week: string;
  deliveryAssociate: string;
  deliveryAssociateName: string;
  trackingId: string;
  deliveryDate: string | null;
  mishandledPackage: boolean;
  unprofessional: boolean;
  didNotFollowInstructions: boolean;
  deliveredToWrongAddress: boolean;
  neverReceivedDelivery: boolean;
  receivedWrongItem: boolean;
  feedbackDetails: string;
  defectCategories: string[];
}

export const CDF_DEFECT_COLUMNS = [
  'mishandledPackage',
  'unprofessional',
  'didNotFollowInstructions',
  'deliveredToWrongAddress',
  'neverReceivedDelivery',
  'receivedWrongItem',
] as const;

export type CDFDefectColumn = (typeof CDF_DEFECT_COLUMNS)[number];

export const CDF_DEFECT_LABELS: Record<CDFDefectColumn, string> = {
  mishandledPackage: 'Mishandled Package',
  unprofessional: 'Unprofessional',
  didNotFollowInstructions: 'Instructions',
  deliveredToWrongAddress: 'Wrong Address',
  neverReceivedDelivery: 'Never Received',
  receivedWrongItem: 'Wrong Item',
};
