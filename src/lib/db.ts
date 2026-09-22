import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { DonationEntry, DevoteeSummary, AuditLog, DashboardStats, PaymentStatus } from "@/types";

const TARGET_SHIVLINGS = 51000;
const LOCAL_STORAGE_KEY = "brijbihari_donations_v1";
const AUDIT_STORAGE_KEY = "brijbihari_audit_logs_v1";
const COUNTER_STORAGE_KEY = "brijbihari_counter_v1";

// Helper: Timeout race wrapper to prevent network hanging
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2000, fallbackValue: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]).catch(() => fallbackValue);
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

// Next Entry Number Generator (Fast with 1.5s timeout)
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

      return await withTimeout(fetchCounter(), 1500, getNextFromLocal());
    } catch {
      return getNextFromLocal();
    }
  }

  return getNextFromLocal();
}

// Check Duplicate Devotee Mobile (Fast 1.5s timeout, non-blocking)
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

      return await withTimeout(fetchFirestoreDupes(), 1500, getLocalDuplicates());
    } catch {
      return getLocalDuplicates();
    }
  }

  return getLocalDuplicates();
}

// Add New Donation Entry (OPTIMISTIC INSTANT LOCAL SAVE + BACKGROUND FIRESTORE SYNC)
export async function addDonationEntry(entryData: Omit<DonationEntry, "id" | "createdAt">): Promise<DonationEntry> {
  const createdAt = new Date().toISOString();
  const numOnly = parseInt(entryData.entryNumber.replace(/\D/g, ""), 10);

  // 1. ALWAYS Save locally first for INSTANT UI response (< 50ms)
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

  // 2. Sync to Firestore in background without blocking Pandit Ji
  if (isFirebaseConfigured && db) {
    (async () => {
      try {
        const docRef = doc(collection(db!, "donations"));
        await setDoc(docRef, {
          ...newRecord,
          id: docRef.id,
          createdAt: serverTimestamp(),
        });

        if (!isNaN(numOnly)) {
          await setDoc(doc(db!, "meta", "counters"), { lastEntryNumber: numOnly }, { merge: true });
        }
      } catch (err) {
        console.warn("Background Firestore sync notice (saved locally):", err);
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
            batch.set(docRef, {
              ...item,
              id: docRef.id,
              createdAt: item.createdAt
            });
          });

          await batch.commit();
        }
      } catch (e) {
        console.warn("Background batch sync:", e);
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
        await updateDoc(docRef, {
          ...updatedData,
          updatedAt: serverTimestamp()
        });

        const auditRef = doc(collection(db!, "auditLogs"));
        await setDoc(auditRef, {
          ...auditRecord,
          id: auditRef.id,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.warn("Background correction sync:", e);
      }
    })();
  }

  return merged;
}

// Fetch Dashboard Aggregated Statistics (Fast 2s timeout)
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

      allEntries = await withTimeout(fetchStatsFirestore(), 2000, getLocalDonations());
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

      allEntries = await withTimeout(fetchRecordsFirestore(), 2000, getLocalDonations());
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
      return await withTimeout(fetchAuditFirestore(), 2000, getLocalAuditLogs());
    } catch {
      return getLocalAuditLogs();
    }
  }
  return getLocalAuditLogs();
}
