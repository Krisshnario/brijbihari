import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { 
  DonationEntry, 
  DevoteeSummary, 
  AuditLog, 
  DashboardStats, 
  PaymentStatus,
  EventItem,
  EventStatus,
  AshramDaanEntry,
  AshramDaanPurpose,
  PaymentMode,
  AshramDaanStats
} from "@/types";

const TARGET_SHIVLINGS = 51000;
const LOCAL_STORAGE_KEY = "brijbihari_donations_v1";
const AUDIT_STORAGE_KEY = "brijbihari_audit_logs_v1";
const COUNTER_STORAGE_KEY = "brijbihari_counter_v1";
const EVENTS_STORAGE_KEY = "brijbihari_events_v1";
const ASHRAM_STORAGE_KEY = "brijbihari_ashram_daan_v1";
const ASHRAM_COUNTER_KEY = "brijbihari_ashram_counter_v1";



// Fast Timeout wrapper (800ms limit to prevent any network/permission hanging)
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 800, fallbackValue: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }).catch((err) => {
      clearTimeout(timer);
      console.warn("Firestore call skipped (permission or network):", err?.message || err);
      return fallbackValue;
    }),
    timeoutPromise,
  ]);
}

/**
 * Recursively remove `undefined` values from an object before writing to Firestore,
 * preserving Firestore FieldValues (such as serverTimestamp(), deleteField()) and Timestamps.
 * Firestore strictly forbids `undefined` anywhere in document payloads.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    if (typeof (data as any).toMillis === "function" || "_methodName" in (data as any)) {
      return data;
    }
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as T;
  }
  return data;
}

// Authentic realistic sample data for initial setup if empty
const INITIAL_SAMPLE_DONATIONS: DonationEntry[] = [
  {
    id: "shiv-10001",
    entryNumber: "SHIV-10001",
    devoteeName: "रमेश चंद्र शर्मा",
    mobile: "9826012345",
    address: "भोपाल, मध्य प्रदेश",
    shivlingCount: 11,
    amountPerShivling: 2100,
    totalAmount: 23100,
    paymentStatus: "जमा",
    donationDate: "2026-09-20",
    notes: "प्रथम नवरात्र संकल्प",
    createdAt: new Date("2026-09-20T10:30:00Z").toISOString(),
  },
  {
    id: "shiv-10002",
    entryNumber: "SHIV-10002",
    devoteeName: "भगवती देवी गुप्ता",
    mobile: "9425098765",
    address: "वृंदावन, उत्तर प्रदेश",
    shivlingCount: 21,
    amountPerShivling: 2100,
    totalAmount: 44100,
    paymentStatus: "जमा",
    donationDate: "2026-09-21",
    notes: "गौ सेवा एवं शिवलिंग निर्माण हेतु",
    createdAt: new Date("2026-09-21T11:15:00Z").toISOString(),
  },
  {
    id: "shiv-10003",
    entryNumber: "SHIV-10003",
    devoteeName: "अनिल कुमार यादव",
    mobile: "9893044556",
    address: "इंदौर, मध्य प्रदेश",
    shivlingCount: 5,
    amountPerShivling: 2100,
    totalAmount: 10500,
    paymentStatus: "आंशिक",
    donationDate: "2026-09-21",
    notes: "₹5000 जमा, शेष ₹5500 बाकी",
    createdAt: new Date("2026-09-21T14:20:00Z").toISOString(),
  },
  {
    id: "shiv-10004",
    entryNumber: "SHIV-10004",
    devoteeName: "राजेश भाई पटेल",
    mobile: "9712033445",
    address: "अहमदाबाद, गुजरात",
    shivlingCount: 51,
    amountPerShivling: 2100,
    totalAmount: 107100,
    paymentStatus: "जमा",
    donationDate: "2026-09-22",
    notes: "परिवार कल्याण हेतु विशेष दान",
    createdAt: new Date("2026-09-22T09:00:00Z").toISOString(),
  },
  {
    id: "shiv-10005",
    entryNumber: "SHIV-10005",
    devoteeName: "सुनीता रानी वर्मा",
    mobile: "9810066778",
    address: "जयपुर, राजस्थान",
    shivlingCount: 2,
    amountPerShivling: 2100,
    totalAmount: 4200,
    paymentStatus: "जमा",
    donationDate: "2026-09-22",
    notes: "ऑनलाइन हस्तांतरण",
    createdAt: new Date("2026-09-22T16:45:00Z").toISOString(),
  },
  {
    id: "shiv-10006",
    entryNumber: "SHIV-10006",
    devoteeName: "महेंद्र सिंह राठौर",
    mobile: "9982055667",
    address: "उज्जैन, मध्य प्रदेश",
    shivlingCount: 7,
    amountPerShivling: 2100,
    totalAmount: 14700,
    paymentStatus: "बाकी",
    donationDate: "2026-09-22",
    notes: "आगामी पूर्णमासी को भुगतान सम्भावित",
    createdAt: new Date("2026-09-22T17:10:00Z").toISOString(),
  }
];

// Helper: Local fallback store reader
function getLocalDonations(): DonationEntry[] {
  if (typeof window === "undefined") return INITIAL_SAMPLE_DONATIONS;
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_DONATIONS));
      localStorage.setItem(COUNTER_STORAGE_KEY, "10006");
      return INITIAL_SAMPLE_DONATIONS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_SAMPLE_DONATIONS;
  }
}

// Helper: Local fallback store writer
function setLocalDonations(donations: DonationEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(donations));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

// Helper: Local Audit Log reader
function getLocalAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(AUDIT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Helper: Local Audit Log writer
function addLocalAuditLog(log: AuditLog) {
  if (typeof window === "undefined") return;
  try {
    const logs = getLocalAuditLogs();
    logs.unshift(log);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Audit log error:", e);
  }
}

// Next Entry Number Generator (Fast 800ms limit)
export async function generateNextEntryNumber(): Promise<string> {
  const getNextFromLocal = () => {
    if (typeof window !== "undefined") {
      const current = parseInt(localStorage.getItem(COUNTER_STORAGE_KEY) || "10006", 10);
      const next = current + 1;
      localStorage.setItem(COUNTER_STORAGE_KEY, next.toString());
      return `SHIV-${next}`;
    }
    return `SHIV-10007`;
  };

  if (isFirebaseConfigured && db) {
    try {
      const fetchCounter = async () => {
        const counterRef = doc(db!, "meta", "counters");
        const snap = await getDoc(counterRef);
        let nextNum = 10001;
        if (snap.exists()) {
          nextNum = (snap.data().lastEntryNumber || 10000) + 1;
        }
        return `SHIV-${nextNum}`;
      };

      return await withTimeout(fetchCounter(), 800, getNextFromLocal());
    } catch {
      return getNextFromLocal();
    }
  }

  return getNextFromLocal();
}

// Check Duplicate Devotee Mobile (Fast 800ms limit)
export async function checkDuplicateMobile(mobile: string): Promise<DonationEntry[]> {
  if (!mobile || mobile.trim() === "") return [];
  const cleanMobile = mobile.trim();

  const getLocalDuplicates = () => {
    const all = getLocalDonations();
    return all.filter(d => d.mobile && d.mobile.trim() === cleanMobile);
  };

  if (isFirebaseConfigured && db) {
    try {
      const fetchFirestoreDupes = async () => {
        const q = query(collection(db!, "donations"), where("mobile", "==", cleanMobile));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationEntry));
      };

      return await withTimeout(fetchFirestoreDupes(), 800, getLocalDuplicates());
    } catch {
      return getLocalDuplicates();
    }
  }

  return getLocalDuplicates();
}

// Add New Donation Entry (OPTIMISTIC INSTANT LOCAL SAVE + SAFE BACKGROUND FIRESTORE SYNC)
export async function addDonationEntry(entryData: Omit<DonationEntry, "id" | "createdAt">): Promise<DonationEntry> {
  const createdAt = new Date().toISOString();
  const numOnly = parseInt(entryData.entryNumber.replace(/\D/g, ""), 10);

  // 1. ALWAYS Save locally first for INSTANT UI response (< 10ms)
  const all = getLocalDonations();
  const recordId = `record-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newRecord: DonationEntry = {
    ...entryData,
    id: recordId,
    createdAt,
  };

  all.unshift(newRecord);
  setLocalDonations(all);

  if (!isNaN(numOnly) && typeof window !== "undefined") {
    localStorage.setItem(COUNTER_STORAGE_KEY, numOnly.toString());
  }

  // 2. Sync to Firestore in background safely
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(db!, "donations", recordId);
        await setDoc(docRef, sanitizeForFirestore({
          ...newRecord,
          id: recordId,
          createdAt: serverTimestamp(),
        }));

        if (!isNaN(numOnly)) {
          await setDoc(doc(db!, "meta", "counters"), { lastEntryNumber: numOnly }, { merge: true });
        }
      } catch (err) {
        console.warn("Background Firestore sync notice:", err);
      }
    })();
  }

  return newRecord;
}

// Batch Import Multiple Entries
export async function importBatchDonations(entries: Omit<DonationEntry, "id" | "createdAt">[]): Promise<{ successCount: number; failedCount: number }> {
  if (entries.length === 0) return { successCount: 0, failedCount: 0 };

  const existing = getLocalDonations();
  const formatted: DonationEntry[] = entries.map((item, idx) => ({
    ...item,
    id: `import-${Date.now()}-${idx}`,
    createdAt: new Date().toISOString()
  }));

  setLocalDonations([...formatted, ...existing]);

  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const BATCH_SIZE = 400;
        for (let i = 0; i < formatted.length; i += BATCH_SIZE) {
          const chunk = formatted.slice(i, i + BATCH_SIZE);
          const batch = writeBatch(db!);

          chunk.forEach(item => {
            const docRef = doc(collection(db!, "donations"));
            batch.set(docRef, sanitizeForFirestore({
              ...item,
              id: docRef.id,
              createdAt: item.createdAt
            }));
          });

          await batch.commit();
        }
      } catch (e) {
        console.warn("Background batch sync notice:", e);
      }
    })();
  }

  return { successCount: formatted.length, failedCount: 0 };
}

// Request Correction on Existing Entry (Preserves Original Value + Audit Log)
export async function applyCorrection(
  donationId: string, 
  updatedData: Partial<DonationEntry>, 
  reason: string
): Promise<DonationEntry> {
  const timestamp = new Date().toISOString();

  // Local update first
  const all = getLocalDonations();
  const index = all.findIndex(d => d.id === donationId);
  if (index === -1) throw new Error("Record not found");

  const originalData = { ...all[index] };
  const merged: DonationEntry = {
    ...originalData,
    ...updatedData,
    updatedAt: timestamp
  };

  all[index] = merged;
  setLocalDonations(all);

  const auditRecord: AuditLog = {
    id: `audit-${Date.now()}`,
    donationId,
    entryNumber: originalData.entryNumber,
    originalData,
    updatedData,
    reason,
    timestamp
  };
  addLocalAuditLog(auditRecord);

  // Sync to Firestore in background
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(db!, "donations", donationId);
        await updateDoc(docRef, sanitizeForFirestore({
          ...updatedData,
          updatedAt: serverTimestamp()
        }));

        const auditRef = doc(collection(db!, "auditLogs"));
        await setDoc(auditRef, sanitizeForFirestore({
          ...auditRecord,
          id: auditRef.id,
          timestamp: serverTimestamp()
        }));
      } catch (e) {
        console.warn("Background correction sync notice:", e);
      }
    })();
  }

  return merged;
}

// Fetch Dashboard Aggregated Statistics (Fast 800ms limit)
export async function getDashboardStats(): Promise<DashboardStats> {
  let allEntries: DonationEntry[] = getLocalDonations();

  if (isFirebaseConfigured && db) {
    try {
      const fetchStatsFirestore = async () => {
        const snap = await getDocs(collection(db!, "donations"));
        if (!snap.empty) {
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationEntry));
        }
        return getLocalDonations();
      };

      allEntries = await withTimeout(fetchStatsFirestore(), 800, getLocalDonations());
    } catch {
      allEntries = getLocalDonations();
    }
  }

  let registeredShivlings = 0;
  let totalDonationAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let partialCount = 0;

  allEntries.forEach(entry => {
    const count = Number(entry.shivlingCount) || 0;
    const amount = Number(entry.totalAmount) || 0;
    registeredShivlings += count;
    totalDonationAmount += amount;

    if (entry.paymentStatus === "जमा") paidCount++;
    else if (entry.paymentStatus === "बाकी") pendingCount++;
    else if (entry.paymentStatus === "आंशिक") partialCount++;
  });

  const remainingShivlings = Math.max(0, TARGET_SHIVLINGS - registeredShivlings);

  return {
    targetShivlings: TARGET_SHIVLINGS,
    registeredShivlings,
    remainingShivlings,
    totalDonationAmount,
    totalEntries: allEntries.length,
    paidEntriesCount: paidCount,
    pendingEntriesCount: pendingCount,
    partialEntriesCount: partialCount
  };
}

// Fetch Paginated & Filtered Donation Records
export async function getDonationRecords(options?: {
  searchQuery?: string;
  paymentStatus?: PaymentStatus | 'ALL';
  sortBy?: 'dateDesc' | 'dateAsc' | 'amountDesc' | 'shivlingsDesc';
  page?: number;
  pageSize?: number;
}): Promise<{ data: DonationEntry[]; totalCount: number; totalPages: number }> {
  let allEntries: DonationEntry[] = getLocalDonations();

  if (isFirebaseConfigured && db) {
    try {
      const fetchRecordsFirestore = async () => {
        const snap = await getDocs(collection(db!, "donations"));
        if (!snap.empty) {
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationEntry));
        }
        return getLocalDonations();
      };

      allEntries = await withTimeout(fetchRecordsFirestore(), 800, getLocalDonations());
    } catch {
      allEntries = getLocalDonations();
    }
  }

  const queryStr = (options?.searchQuery || "").trim().toLowerCase();
  const statusFilter = options?.paymentStatus || "ALL";

  // Filter
  let filtered = allEntries.filter(entry => {
    if (statusFilter !== "ALL" && entry.paymentStatus !== statusFilter) {
      return false;
    }
    if (queryStr) {
      const nameMatch = entry.devoteeName?.toLowerCase().includes(queryStr);
      const mobileMatch = entry.mobile?.includes(queryStr);
      const entryNumMatch = entry.entryNumber?.toLowerCase().includes(queryStr);
      const addressMatch = entry.address?.toLowerCase().includes(queryStr);
      return nameMatch || mobileMatch || entryNumMatch || addressMatch;
    }
    return true;
  });

  // Sort
  const sortBy = options?.sortBy || "dateDesc";
  filtered.sort((a, b) => {
    if (sortBy === "dateDesc") {
      return new Date(b.createdAt || b.donationDate).getTime() - new Date(a.createdAt || a.donationDate).getTime();
    }
    if (sortBy === "dateAsc") {
      return new Date(a.createdAt || a.donationDate).getTime() - new Date(b.createdAt || b.donationDate).getTime();
    }
    if (sortBy === "amountDesc") {
      return (b.totalAmount || 0) - (a.totalAmount || 0);
    }
    if (sortBy === "shivlingsDesc") {
      return (b.shivlingCount || 0) - (a.shivlingCount || 0);
    }
    return 0;
  });

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 25;
  const startIndex = (page - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;

  return {
    data: paginated,
    totalCount: filtered.length,
    totalPages
  };
}

// Fetch Devotees Aggregated List
export async function getDevoteesList(): Promise<DevoteeSummary[]> {
  const { data: allEntries } = await getDonationRecords({ pageSize: 100000 });
  const devoteeMap = new Map<string, DevoteeSummary>();

  allEntries.forEach(entry => {
    const key = entry.mobile ? entry.mobile.trim() : `NAME-${entry.devoteeName.trim()}`;
    const existing = devoteeMap.get(key);

    if (existing) {
      existing.totalShivlings += Number(entry.shivlingCount) || 0;
      existing.totalAmount += Number(entry.totalAmount) || 0;
      existing.donationCount += 1;
      existing.entries.push(entry);
      if (new Date(entry.donationDate) > new Date(existing.lastDonationDate)) {
        existing.lastDonationDate = entry.donationDate;
      }
    } else {
      devoteeMap.set(key, {
        mobile: entry.mobile || "-",
        devoteeName: entry.devoteeName,
        address: entry.address || "-",
        totalShivlings: Number(entry.shivlingCount) || 0,
        totalAmount: Number(entry.totalAmount) || 0,
        donationCount: 1,
        lastDonationDate: entry.donationDate,
        entries: [entry]
      });
    }
  });

  return Array.from(devoteeMap.values()).sort((a, b) => b.totalShivlings - a.totalShivlings);
}

// Fetch Audit Logs
export async function getAuditLogs(): Promise<AuditLog[]> {
  if (isFirebaseConfigured && db) {
    try {
      const fetchAuditFirestore = async () => {
        const snap = await getDocs(query(collection(db!, "auditLogs"), orderBy("timestamp", "desc")));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as AuditLog));
      };
      return await withTimeout(fetchAuditFirestore(), 800, getLocalAuditLogs());
    } catch {
      return getLocalAuditLogs();
    }
  }
  return getLocalAuditLogs();
}

// -------------------------------------------------------------
// EVENTS / PROGRAM TIMELINE MODULE
// -------------------------------------------------------------

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number): Date {
  const res = new Date(base);
  res.setDate(res.getDate() + days);
  return res;
}

export function computeEventStatus(startDate: string, endDate: string, override?: EventStatus): EventStatus {
  if (override) return override;
  const today = formatYMD(new Date());
  if (endDate < today) return "सम्पन्न";
  if (startDate <= today && today <= endDate) return "चल रहा है";
  return "आगामी";
}

function generateInitialSampleEvents(): EventItem[] {
  const now = new Date();
  return [
    {
      id: "event-sample-1",
      title: "51,000 पार्थिव शिवलिंग निर्माण एवं महारुद्राभिषेक",
      category: "अनुष्ठान",
      startDate: formatYMD(addDays(now, -2)),
      endDate: formatYMD(addDays(now, 7)),
      timing: "प्रातः 8:00 से 12:00 एवं सायं 4:00 से 7:00 बजे",
      location: "बृजविहारी गौ तीर्थ धाम, मुख्य यज्ञशाला",
      city: "वृंदावन",
      organizerName: "बृजविहारी गौ सेवा न्यास",
      organizerPhone: "9826012345",
      description: "51,000 दिव्य पार्थिव शिवलिंगों का निर्माण, नित्य महारुद्राभिषेक एवं 108 विप्रवरों द्वारा वेद मंत्रोच्चार।",
      isSpecial: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "event-sample-2",
      title: "श्रीमद्भागवत कथा सप्ताह ज्ञान महायज्ञ",
      category: "कथा",
      startDate: formatYMD(addDays(now, 10)),
      endDate: formatYMD(addDays(now, 16)),
      timing: "दोपहर 2:30 से सायं 6:30 बजे",
      location: "कथा पांडाल, श्री राम मंदिर परिसर",
      city: "इंदौर",
      organizerName: "श्री राजेश भाई पटेल एवं परिवार",
      organizerPhone: "9712033445",
      description: "पूज्य गुरुजी के श्रीमुख से 7 दिवसीय संगीतमय श्रीमद्भागवत कथा। श्रीकृष्ण जन्मोत्सव एवं गोवर्धन पूजा विशेष उत्सव।",
      isSpecial: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "event-sample-3",
      title: "गोपाष्टमी महोत्सव एवं विशाल गौ पूजन भण्डारा",
      category: "उत्सव",
      startDate: formatYMD(addDays(now, 24)),
      endDate: formatYMD(addDays(now, 25)),
      timing: "प्रातः 9:00 बजे से निरंतर",
      location: "सुरभि गौशाला प्रांगण, बृजविहारी धाम",
      city: "वृंदावन",
      organizerName: "समस्त गौ भक्त मंडल",
      organizerPhone: "9425098765",
      description: "सैकड़ों देशी गौमाताओं का सविधि पूजन, छप्पन भोग, महाआरती एवं संतों-भक्तों का महाप्रसाद भण्डारा।",
      isSpecial: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "event-sample-4",
      title: "श्री राम कथा एवं विराट मानस सम्मेलन",
      category: "कथा",
      startDate: formatYMD(addDays(now, 40)),
      endDate: formatYMD(addDays(now, 48)),
      timing: "सायं 4:00 से रात्रि 8:00 बजे",
      location: "सिंहस्थ पांडाल, शिप्रा तट",
      city: "उज्जैन",
      organizerName: "महाकाल सेवा समिति",
      organizerPhone: "9893044556",
      description: "9 दिवसीय नवाह्न पारायण श्री राम कथा एवं दिव्य संकीर्तन।",
      isSpecial: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "event-sample-5",
      title: "श्री शिव महापुराण कथा एवं द्वादश ज्योतिर्लिंग अर्चन",
      category: "कथा",
      startDate: formatYMD(addDays(now, -25)),
      endDate: formatYMD(addDays(now, -18)),
      timing: "प्रातः 10:00 से दोपहर 2:00 बजे",
      location: "ओंकारेश्वर ज्योतिर्लिंग परिक्षेत्र",
      city: "ओंकारेश्वर",
      organizerName: "नर्मदा सेवा संघ",
      organizerPhone: "9982055667",
      description: "श्रावण मास विशेष शिव महापुराण कथा एवं नर्मदा तट पर महाआरती।",
      isSpecial: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

// Local storage reader for events
export function getLocalEvents(): EventItem[] {
  if (typeof window === "undefined") return generateInitialSampleEvents();
  try {
    const data = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!data) {
      const initial = generateInitialSampleEvents();
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch {
    return generateInitialSampleEvents();
  }
}

// Local storage writer for events
export function setLocalEvents(events: EventItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error("Local events storage error:", e);
  }
}

// Fetch all events (Local immediate + Firestore background sync)
export async function getEvents(): Promise<EventItem[]> {
  let allEvents = getLocalEvents();

  if (isFirebaseConfigured && db) {
    try {
      const fetchEventsFirestore = async () => {
        const snap = await getDocs(collection(db!, "events"));
        if (!snap.empty) {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventItem));
          // Save to local storage for offline speed
          setLocalEvents(list);
          return list;
        } else if (allEvents.length > 0) {
          // If Firestore is empty, seed existing local events to Firestore
          try {
            for (const ev of allEvents) {
              await setDoc(doc(db!, "events", ev.id), sanitizeForFirestore({
                ...ev,
                createdAt: ev.createdAt || serverTimestamp(),
              }), { merge: true });
            }
          } catch (syncErr) {
            console.warn("Initial events sync to Firestore notice:", syncErr);
          }
        }
        return getLocalEvents();
      };
      allEvents = await withTimeout(fetchEventsFirestore(), 1500, getLocalEvents());
    } catch {
      allEvents = getLocalEvents();
    }
  }

  // Sort events: Ongoing first, then upcoming ascending by startDate, then past descending
  return allEvents.sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
}

// Add a new event
export async function addEvent(eventData: Omit<EventItem, "id" | "createdAt">): Promise<EventItem> {
  const createdAt = new Date().toISOString();
  const all = getLocalEvents();
  const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  const newEvent: EventItem = {
    ...eventData,
    id: eventId,
    createdAt,
  };

  all.unshift(newEvent);
  setLocalEvents(all);

  // Firestore Sync - directly save to Firestore using matching eventId
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(db!, "events", eventId);
        await setDoc(docRef, sanitizeForFirestore({
          ...newEvent,
          id: eventId,
          createdAt: serverTimestamp(),
        }));
        console.log("Event successfully stored in Firestore:", eventId);
      } catch (err) {
        console.warn("Firestore event sync notice:", err);
      }
    })();
  }

  return newEvent;
}

// Update existing event
export async function updateEvent(eventId: string, updatedData: Partial<EventItem>): Promise<EventItem> {
  const timestamp = new Date().toISOString();
  const all = getLocalEvents();
  const index = all.findIndex(e => e.id === eventId);
  if (index === -1) throw new Error("Event not found");

  const merged: EventItem = {
    ...all[index],
    ...updatedData,
    updatedAt: timestamp,
  };

  all[index] = merged;
  setLocalEvents(all);

  // Firestore Sync - safely merge into Firestore
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(db!, "events", eventId);
        await setDoc(docRef, sanitizeForFirestore({
          ...merged,
          updatedAt: serverTimestamp(),
        }), { merge: true });
        console.log("Event successfully updated in Firestore:", eventId);
      } catch (e) {
        console.warn("Firestore event update notice:", e);
      }
    })();
  }

  return merged;
}

// Delete event
export async function deleteEvent(eventId: string): Promise<boolean> {
  const all = getLocalEvents();
  const filtered = all.filter(e => e.id !== eventId);
  setLocalEvents(filtered);

  // Firestore Sync - delete matching document in Firestore
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(db!, "events", eventId);
        await deleteDoc(docRef);
        console.log("Event successfully deleted from Firestore:", eventId);
      } catch (e) {
        console.warn("Firestore event delete notice:", e);
      }
    })();
  }

  return true;
}

// -------------------------------------------------------------
// ASHRAM DAAN / GENERAL DONATION MODULE
// -------------------------------------------------------------

const INITIAL_SAMPLE_ASHRAM_DAAN: AshramDaanEntry[] = [
  {
    id: "ash-10001",
    receiptNumber: "ASH-10001",
    donorName: "श्री श्याम सुंदर बिड़ला",
    mobile: "9826012345",
    address: "भोपाल, मध्य प्रदेश",
    city: "भोपाल",
    amount: 21000,
    purpose: "गौ सेवा",
    paymentMode: "ऑनलाइन / UPI",
    paymentStatus: "जमा",
    transactionId: "UPI/329482910382",
    daanDate: "2026-09-24",
    notes: "वार्षिक गौ ग्रास एवं हरा चारा सेवा",
    receivedBy: "कार्यालय",
    createdAt: new Date("2026-09-24T10:00:00Z").toISOString(),
  },
  {
    id: "ash-10002",
    receiptNumber: "ASH-10002",
    donorName: "श्रीमती कौशल्या देवी माहेश्वरी",
    mobile: "9425098765",
    address: "इंदौर, मध्य प्रदेश",
    city: "इंदौर",
    amount: 11000,
    purpose: "अन्नक्षेत्र / भण्डारा",
    paymentMode: "नकद (Cash)",
    paymentStatus: "जमा",
    daanDate: "2026-09-25",
    notes: "पूर्णमासी साधु-संत महाप्रसाद भण्डारा",
    receivedBy: "कार्यालय",
    createdAt: new Date("2026-09-25T11:30:00Z").toISOString(),
  },
  {
    id: "ash-10003",
    receiptNumber: "ASH-10003",
    donorName: "श्री मदन लाल जालान",
    mobile: "9893044556",
    address: "उज्जैन, मध्य प्रदेश",
    city: "उज्जैन",
    amount: 51000,
    purpose: "आश्रम निर्माण",
    paymentMode: "बैंक ट्रांसफर (NEFT)",
    paymentStatus: "जमा",
    transactionId: "NEFT/SBIN29384729",
    daanDate: "2026-09-26",
    notes: "मुख्य यज्ञशाला विस्तार निर्माण सहयोग",
    receivedBy: "कार्यालय",
    createdAt: new Date("2026-09-26T14:15:00Z").toISOString(),
  },
  {
    id: "ash-10004",
    receiptNumber: "ASH-10004",
    donorName: "श्री विजय कुमार सोनी",
    mobile: "9712033445",
    address: "अहमदाबाद, गुजरात",
    city: "अहमदाबाद",
    amount: 5100,
    purpose: "संत / अतिथि सेवा",
    paymentMode: "ऑनलाइन / UPI",
    paymentStatus: "जमा",
    transactionId: "UPI/329482910999",
    daanDate: "2026-09-27",
    notes: "आगंतुक संतों की सेवा व सत्कार",
    receivedBy: "कार्यालय",
    createdAt: new Date("2026-09-27T16:00:00Z").toISOString(),
  },
  {
    id: "ash-10005",
    receiptNumber: "ASH-10005",
    donorName: "गुप्त दानदाता",
    mobile: "9810066778",
    address: "वृंदावन, उत्तर प्रदेश",
    city: "वृंदावन",
    amount: 2100,
    purpose: "दीपदान / पूजा उत्सव",
    paymentMode: "नकद (Cash)",
    paymentStatus: "जमा",
    daanDate: "2026-09-28",
    notes: "कार्तिक मास संध्या दीपदान एवं महाआरती",
    receivedBy: "कार्यालय",
    createdAt: new Date("2026-09-28T17:45:00Z").toISOString(),
  }
];

export function getLocalAshramDonations(): AshramDaanEntry[] {
  if (typeof window === "undefined") return INITIAL_SAMPLE_ASHRAM_DAAN;
  try {
    const data = localStorage.getItem(ASHRAM_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(ASHRAM_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_ASHRAM_DAAN));
      localStorage.setItem(ASHRAM_COUNTER_KEY, "10005");
      return INITIAL_SAMPLE_ASHRAM_DAAN;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_SAMPLE_ASHRAM_DAAN;
  }
}

export function setLocalAshramDonations(donations: AshramDaanEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ASHRAM_STORAGE_KEY, JSON.stringify(donations));
  } catch (e) {
    console.error("Local ashram donations error:", e);
  }
}

export async function generateNextAshramReceiptNumber(): Promise<string> {
  const getNextFromLocal = () => {
    if (typeof window !== "undefined") {
      const current = parseInt(localStorage.getItem(ASHRAM_COUNTER_KEY) || "10005", 10);
      const next = current + 1;
      localStorage.setItem(ASHRAM_COUNTER_KEY, next.toString());
      return `ASH-${next}`;
    }
    return `ASH-10006`;
  };

  if (isFirebaseConfigured && db) {
    try {
      const fetchCounter = async () => {
        const counterRef = doc(db!, "meta", "counters");
        const snap = await getDoc(counterRef);
        let nextNum = 10001;
        if (snap.exists() && snap.data().lastAshramReceiptNumber) {
          nextNum = (snap.data().lastAshramReceiptNumber || 10000) + 1;
        } else {
          return getNextFromLocal();
        }
        return `ASH-${nextNum}`;
      };
      return await withTimeout(fetchCounter(), 800, getNextFromLocal());
    } catch {
      return getNextFromLocal();
    }
  }

  return getNextFromLocal();
}

export async function getAshramDonations(options?: {
  searchQuery?: string;
  purpose?: string;
  paymentMode?: string;
  paymentStatus?: string;
}): Promise<AshramDaanEntry[]> {
  let all = getLocalAshramDonations();

  if (isFirebaseConfigured && db) {
    try {
      const fetchFirestore = async () => {
        const snap = await getDocs(collection(db!, "ashramDonations"));
        if (!snap.empty) {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AshramDaanEntry));
          const firestoreIds = new Set(list.map(item => item.id));

          // Re-sync any local items that failed to sync earlier
          const unsynced = all.filter(localItem => !firestoreIds.has(localItem.id));
          if (unsynced.length > 0) {
            for (const item of unsynced) {
              try {
                await setDoc(doc(db!, "ashramDonations", item.id), sanitizeForFirestore({
                  ...item,
                  createdAt: item.createdAt || serverTimestamp(),
                }), { merge: true });
              } catch (syncNotice) {
                console.warn("Unsynced ashram donation sync notice:", syncNotice);
              }
            }
          }

          const combined = [...unsynced, ...list];
          setLocalAshramDonations(combined);
          return combined;
        } else if (all.length > 0) {
          // If Firestore is empty, attempt initial seed of local records
          try {
            for (const item of all) {
              await setDoc(doc(db!, "ashramDonations", item.id), sanitizeForFirestore({
                ...item,
                createdAt: item.createdAt || serverTimestamp(),
              }), { merge: true });
            }
          } catch {
            // will silently await until rules are published
          }
        }
        return getLocalAshramDonations();
      };
      all = await withTimeout(fetchFirestore(), 1500, getLocalAshramDonations());
    } catch {
      all = getLocalAshramDonations();
    }
  }

  const queryStr = (options?.searchQuery || "").trim().toLowerCase();
  const purposeFilter = options?.purpose || "ALL";
  const modeFilter = options?.paymentMode || "ALL";
  const statusFilter = options?.paymentStatus || "ALL";

  const filtered = all.filter(entry => {
    if (purposeFilter !== "ALL" && entry.purpose !== purposeFilter) return false;
    if (modeFilter !== "ALL" && entry.paymentMode !== modeFilter) return false;
    if (statusFilter !== "ALL" && entry.paymentStatus !== statusFilter) return false;
    if (queryStr) {
      const nameMatch = entry.donorName?.toLowerCase().includes(queryStr);
      const mobileMatch = entry.mobile?.includes(queryStr);
      const receiptMatch = entry.receiptNumber?.toLowerCase().includes(queryStr);
      const cityMatch = entry.city?.toLowerCase().includes(queryStr);
      const notesMatch = entry.notes?.toLowerCase().includes(queryStr);
      return nameMatch || mobileMatch || receiptMatch || cityMatch || notesMatch;
    }
    return true;
  });

  return filtered.sort((a, b) => new Date(b.daanDate || b.createdAt).getTime() - new Date(a.daanDate || a.createdAt).getTime());
}

export async function addAshramDonation(entryData: Omit<AshramDaanEntry, "id" | "createdAt">): Promise<AshramDaanEntry> {
  const createdAt = new Date().toISOString();
  const numOnly = parseInt(entryData.receiptNumber.replace(/\D/g, ""), 10);

  const all = getLocalAshramDonations();
  const id = `ashram-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newRecord: AshramDaanEntry = {
    ...entryData,
    id,
    createdAt,
  };

  all.unshift(newRecord);
  setLocalAshramDonations(all);

  if (!isNaN(numOnly) && typeof window !== "undefined") {
    localStorage.setItem(ASHRAM_COUNTER_KEY, numOnly.toString());
  }

  // Firestore Sync - store directly into Firestore with matching id
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(db!, "ashramDonations", id);
        await setDoc(docRef, sanitizeForFirestore({
          ...newRecord,
          id,
          createdAt: serverTimestamp(),
        }));
        if (!isNaN(numOnly)) {
          await setDoc(doc(db!, "meta", "counters"), { lastAshramReceiptNumber: numOnly }, { merge: true });
        }
        console.log("Ashram donation successfully stored in Firestore:", id);
      } catch (err) {
        console.warn("Firestore Ashram donation sync notice:", err);
      }
    })();
  }

  return newRecord;
}

export async function updateAshramDonation(id: string, updatedData: Partial<AshramDaanEntry>): Promise<AshramDaanEntry> {
  const timestamp = new Date().toISOString();
  const all = getLocalAshramDonations();
  const index = all.findIndex(d => d.id === id);
  if (index === -1) throw new Error("Ashram donation record not found");

  const merged: AshramDaanEntry = {
    ...all[index],
    ...updatedData,
    updatedAt: timestamp,
  };

  all[index] = merged;
  setLocalAshramDonations(all);

  // Firestore Sync - safely merge into Firestore
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(db!, "ashramDonations", id);
        await setDoc(docRef, sanitizeForFirestore({
          ...merged,
          updatedAt: serverTimestamp(),
        }), { merge: true });
        console.log("Ashram donation successfully updated in Firestore:", id);
      } catch (e) {
        console.warn("Firestore Ashram update notice:", e);
      }
    })();
  }

  return merged;
}

export async function deleteAshramDonation(id: string): Promise<boolean> {
  const all = getLocalAshramDonations();
  const filtered = all.filter(d => d.id !== id);
  setLocalAshramDonations(filtered);

  // Firestore Sync - delete matching document in Firestore
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(db!, "ashramDonations", id);
        await deleteDoc(docRef);
        console.log("Ashram donation successfully deleted from Firestore:", id);
      } catch (e) {
        console.warn("Firestore Ashram delete notice:", e);
      }
    })();
  }

  return true;
}

export async function getAshramDaanStats(): Promise<AshramDaanStats> {
  const all = await getAshramDonations();
  
  let totalAmount = 0;
  let gauSevaAmount = 0;
  let annakshetraAmount = 0;
  let constructionAmount = 0;
  let santSevaAmount = 0;
  let otherAmount = 0;
  let cashAmount = 0;
  let onlineAmount = 0;

  all.forEach(item => {
    const amt = Number(item.amount) || 0;
    totalAmount += amt;

    if (item.purpose === "गौ सेवा") gauSevaAmount += amt;
    else if (item.purpose === "अन्नक्षेत्र / भण्डारा") annakshetraAmount += amt;
    else if (item.purpose === "आश्रम निर्माण") constructionAmount += amt;
    else if (item.purpose === "संत / अतिथि सेवा") santSevaAmount += amt;
    else otherAmount += amt;

    if (item.paymentMode?.includes("नकद")) cashAmount += amt;
    else onlineAmount += amt;
  });

  return {
    totalAmount,
    totalReceipts: all.length,
    gauSevaAmount,
    annakshetraAmount,
    constructionAmount,
    santSevaAmount,
    otherAmount,
    cashAmount,
    onlineAmount,
  };
}


