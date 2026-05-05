export interface RTSDataRow {
  _id: string;
  deliveryAssociate: string;
  trackingId: string;
  transporterId: string;
  impactDcr: string;
  rtsCode: string;
  additionalInformation: string;
  exemptionReason: string;
  plannedDeliveryDate: string;
  serviceArea: string;
  normalizedDate: Date | null;
}

export interface DashboardFilters {
  dateRange: [Date | null, Date | null] | null;
  employee: string;
  search: string;
  rtsCodes: string[];
  impactDcr: string;
}
