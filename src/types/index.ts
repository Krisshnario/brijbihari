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

export type EventCategory = 'कथा' | 'अनुष्ठान' | 'उत्सव' | 'भण्डारा' | 'यात्रा' | 'बैठक' | 'अन्य';
export type EventStatus = 'चल रहा है' | 'आगामी' | 'सम्पन्न';

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  timing?: string;   // e.g. "दोपहर 2:00 से सायं 6:00 बजे"
  location: string;  // e.g. "बृजविहारी गौ तीर्थ धाम, मुख्य पांडाल"
  city: string;      // e.g. "वृंदावन"
  organizerName?: string;
  organizerPhone?: string;
  description?: string;
  isSpecial?: boolean;
  statusOverride?: EventStatus; // Optional manual override
  createdAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// ASHRAM DAAN / GENERAL DONATION TYPES
// -------------------------------------------------------------

export type AshramDaanPurpose = 
  | 'गौ सेवा'
  | 'अन्नक्षेत्र / भण्डारा'
  | 'आश्रम निर्माण'
  | 'संत / अतिथि सेवा'
  | 'दीपदान / पूजा उत्सव'
  | 'सामान्य दान'
  | 'अन्य';

export type PaymentMode = 
  | 'नकद (Cash)' 
  | 'ऑनलाइन / UPI' 
  | 'बैंक ट्रांसफर (NEFT)' 
  | 'चेक (Cheque)';

export interface AshramDaanEntry {
  id: string;
  receiptNumber: string; // e.g. "ASH-10001"
  donorName: string;
  mobile: string;
  address?: string;
  city?: string;
  amount: number;
  purpose: AshramDaanPurpose;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  transactionId?: string; // UPI ref / cheque number
  daanDate: string; // YYYY-MM-DD
  notes?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AshramDaanStats {
  totalAmount: number;
  totalReceipts: number;
  gauSevaAmount: number;
  annakshetraAmount: number;
  constructionAmount: number;
  santSevaAmount: number;
  otherAmount: number;
  cashAmount: number;
  onlineAmount: number;
}


