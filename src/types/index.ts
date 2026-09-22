export type PaymentStatus = 'जमा' | 'बाकी' | 'आंशिक';

export interface DonationEntry {
  id: string;
  entryNumber: string; // e.g. "SHIV-10001"
  devoteeName: string;
  mobile: string;
  address: string;
  shivlingCount: number;
  amountPerShivling: number; // Default 2100
  totalAmount: number; // shivlingCount * amountPerShivling
  paymentStatus: PaymentStatus;
  donationDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string; // ISO string or timestamp
  updatedAt?: string;
}

export interface DevoteeSummary {
  mobile: string;
  devoteeName: string;
  address: string;
  totalShivlings: number;
  totalAmount: number;
  donationCount: number;
  lastDonationDate: string;
  entries: DonationEntry[];
}

export interface AuditLog {
  id: string;
  entryNumber: string;
  donationId: string;
  originalData: Partial<DonationEntry>;
  updatedData: Partial<DonationEntry>;
  reason: string;
  correctedBy?: string;
  timestamp: string;
}

export interface DashboardStats {
  targetShivlings: number;
  registeredShivlings: number;
  remainingShivlings: number;
  totalDonationAmount: number;
  totalEntries: number;
  paidEntriesCount: number;
  pendingEntriesCount: number;
  partialEntriesCount: number;
}

export interface ImportPreviewRow {
  rowNumber: number;
  devoteeName: string;
  mobile: string;
  address: string;
  shivlingCount: number;
  amountPerShivling: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  donationDate: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}
