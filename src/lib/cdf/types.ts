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
  mishandledPackage: 'DA Mishandled Package',
  unprofessional: 'DA was Unprofessional',
  didNotFollowInstructions: 'DA did not follow my delivery instructions',
  deliveredToWrongAddress: 'Delivered to Wrong Address',
  neverReceivedDelivery: 'Never Received Delivery',
  receivedWrongItem: 'Received Wrong Item',
};
