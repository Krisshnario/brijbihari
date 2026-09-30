"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { AshramDaanEntry, AshramDaanStats, AshramDaanPurpose, PaymentStatus, PaymentMode } from "@/types";
import { 
  getAshramDonations, 
  addAshramDonation, 
  updateAshramDonation, 
  deleteAshramDonation,
  getAshramDaanStats 
} from "@/lib/db";
import { AshramDaanModal } from "./AshramDaanModal";
import { AshramReceiptModal } from "./AshramReceiptModal";
import { 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Share2, 
  Edit3, 
  Trash2, 
  IndianRupee, 
  HeartHandshake, 
  Landmark, 
  Sparkles, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle2,
  Clock,
  Filter
} from "lucide-react";
import { GauMataLogo } from "./icons/GauMataLogo";

interface Props {
  onRefreshGlobalStats?: () => void;
}

const PURPOSES: { id: string; label: string; icon: string }[] = [
  { id: "ALL", label: "सभी प्रयोजन", icon: "🌐" },
  { id: "गौ सेवा", label: "गौ सेवा", icon: "🐄" },
  { id: "अन्नक्षेत्र / भण्डारा", label: "अन्नक्षेत्र / भण्डारा", icon: "🍲" },
  { id: "आश्रम निर्माण", label: "आश्रम निर्माण", icon: "🏛️" },
  { id: "संत / अतिथि सेवा", label: "संत सेवा", icon: "🧘" },
  { id: "दीपदान / पूजा उत्सव", label: "दीपदान / पूजा", icon: "🪔" },
  { id: "सामान्य दान", label: "सामान्य दान", icon: "🚩" },
];

export const AshramDaanView: React.FC<Props> = ({ onRefreshGlobalStats }) => {
  const [entries, setEntries] = useState<AshramDaanEntry[]>([]);
  const [stats, setStats] = useState<AshramDaanStats>({
    totalAmount: 0,
    totalReceipts: 0,
    gauSevaAmount: 0,
    annakshetraAmount: 0,
    constructionAmount: 0,
    santSevaAmount: 0,
    otherAmount: 0,
    cashAmount: 0,
    onlineAmount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("ALL");
  const [selectedMode, setSelectedMode] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<AshramDaanEntry | null>(null);
  const [receiptEntry, setReceiptEntry] = useState<AshramDaanEntry | null>(null);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [list, s] = await Promise.all([
        getAshramDonations(),
        getAshramDaanStats()
      ]);
      setEntries(list);
      setStats(s);
    } catch (err) {
      console.error("Failed to load Ashram Daan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveEntry = async (
    entryData: Omit<AshramDaanEntry, "id" | "createdAt">,
    editId?: string
  ): Promise<AshramDaanEntry> => {
    let saved: AshramDaanEntry;
    if (editId) {
      saved = await updateAshramDonation(editId, entryData);
    } else {
      saved = await addAshramDonation(entryData);
    }
    await loadData();
    if (onRefreshGlobalStats) onRefreshGlobalStats();
    return saved;
  };

  const handleDelete = async (id: string, name: string, receiptNo: string) => {
    if (window.confirm(`क्या आप रसीद संख्या "${receiptNo}" (${name}) को निश्चित रूप से हटाना चाहते हैं?`)) {
      await deleteAshramDonation(id);
      await loadData();
      if (onRefreshGlobalStats) onRefreshGlobalStats();
    }
  };

  // Export to Excel
  const handleExport = () => {
    if (entries.length === 0) return;
    const formatted = entries.map((item, idx) => ({
      "क्र. सं. (S.No)": idx + 1,
      "रसीद संख्या (Receipt No)": item.receiptNumber,
      "दानदाता का नाम (Donor Name)": item.donorName,
      "मोबाइल (Mobile)": item.mobile || "-",
      "पता (Address)": item.address || "-",
      "नगर (City)": item.city || "-",
      "दान राशि (Amount ₹)": item.amount,
      "सेवा प्रयोजन (Purpose)": item.purpose,
      "भुगतान माध्यम (Mode)": item.paymentMode,
      "स्थिति (Status)": item.paymentStatus,
      "संदर्भ / यूटीआर (Ref No)": item.transactionId || "-",
      "दान तिथि (Date)": item.daanDate,
      "संकल्प / टिप्पणी (Notes)": item.notes || "-",
      "प्राप्तकर्ता (Received By)": item.receivedBy || "कार्यालय"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AshramDaan");
    const fileName = `Brijbihari_Ashram_Daan_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Filtered List
  const filteredEntries = entries.filter((item) => {
    if (selectedPurpose !== "ALL" && item.purpose !== selectedPurpose) return false;
    if (selectedMode !== "ALL" && item.paymentMode !== selectedMode) return false;
    if (selectedStatus !== "ALL" && item.paymentStatus !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.donorName?.toLowerCase().includes(q);
      const matchMobile = item.mobile?.includes(q);
      const matchReceipt = item.receiptNumber?.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      return matchName || matchMobile || matchReceipt || matchCity || matchNotes;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* TOP HEADER & ACTION BANNER */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E65100]/10 text-[#D84315] text-xs font-bold mb-2 border border-[#D84315]/20">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>बृजविहारी गौ तीर्थ धाम - सामान्य व सेवा दान</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#7A1C1C] tracking-tight">
              आश्रम सेवा दान रजिस्टर
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              गौ सेवा, अन्नक्षेत्र (भण्डारा), आश्रम निर्माण, संत सेवा एवं सामान्य आश्रम दान का संपूर्ण डिजिटल विवरण।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              disabled={entries.length === 0}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm rounded-lg border border-stone-300 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-stone-700" />
              <span>एक्सेल एक्सपोर्ट</span>
            </button>

            <button
              onClick={() => {
                setEntryToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition flex items-center gap-1.5 border border-[#FFE082]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ नया आश्रम दान दर्ज करें</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 KEY STATISTIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* 1. Total Ashram Daan Amount */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 uppercase">कुल आश्रम दान</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-800 mt-0.5 number-clean">
                ₹{stats.totalAmount.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-600 mt-1.5 font-medium">समर्पित कुल राशि</p>
        </div>

        {/* 2. Gau Seva Amount */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#D84315] uppercase">गौ सेवा दान</p>
              <h3 className="text-xl sm:text-2xl font-bold text-[#D84315] mt-0.5 number-clean">
                ₹{stats.gauSevaAmount.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-[#FFF3E0] text-[#D84315] rounded-lg border border-[#FFCC80] shrink-0">
              <span className="text-lg">🐄</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-600 mt-1.5 font-medium">चारा व चिकित्सा सेवा</p>
        </div>

        {/* 3. Annakshetra Amount */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase">अन्नक्षेत्र भण्डारा</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 number-clean">
                ₹{stats.annakshetraAmount.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-stone-100 text-stone-700 rounded-lg shrink-0">
              <span className="text-lg">🍲</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1.5">साधु-संत महाप्रसाद</p>
        </div>

        {/* 4. Construction Amount */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase">आश्रम निर्माण</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 number-clean">
                ₹{stats.constructionAmount.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-stone-100 text-stone-700 rounded-lg shrink-0">
              <Landmark className="w-5 h-5 text-stone-600" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1.5">धाम विकास सेवा</p>
        </div>

        {/* 5. Total Receipts Count */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase">कुल रसीदें</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 number-clean">
                {stats.totalReceipts}
              </h3>
            </div>
            <div className="p-2 bg-[#FFF9F0] text-[#D4AF37] rounded-lg border border-[#D4AF37]/30 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1.5">पंजीकृत दानदाता</p>
        </div>

      </div>

      {/* QUICK PURPOSE PILLS FILTER */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {PURPOSES.map((p) => {
          const isSelected = selectedPurpose === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPurpose(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-[#7A1C1C] text-white border-[#7A1C1C] shadow-xs"
                  : "bg-white text-stone-700 hover:bg-stone-50 border-stone-200"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH & FILTERS TOOLBAR */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="नाम, रसीद सं., मोबाइल या शहर खोजें..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#D84315] focus:bg-white transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Payment Mode */}
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#D84315]"
          >
            <option value="ALL">सभी माध्यम (All Modes)</option>
            <option value="ऑनलाइन / UPI">ऑनलाइन / UPI</option>
            <option value="नकद (Cash)">नकद (Cash)</option>
            <option value="बैंक ट्रांसफर (NEFT)">बैंक ट्रांसफर (NEFT)</option>
            <option value="चेक (Cheque)">चेक (Cheque)</option>
          </select>

          {/* Payment Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#D84315]"
          >
            <option value="ALL">सभी स्थिति (All Status)</option>
            <option value="जमा">जमा (Paid)</option>
            <option value="बाकी">बाकी (Pending)</option>
            <option value="आंशिक">आंशिक (Partial)</option>
          </select>

          <span className="text-xs font-bold text-stone-500 px-1 number-clean">
            कुल: {filteredEntries.length}
          </span>
        </div>
      </div>

      {/* RECORDS CONTENT AREA */}
      {loading ? (
        <div className="p-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#D84315] border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm font-semibold">आश्रम दान रिकॉर्ड लोड हो रहे हैं...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <HeartHandshake className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">कोई आश्रम दान रिकॉर्ड नहीं मिला</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            दिए गए फिल्टर या खोज के अनुसार कोई रिकॉर्ड उपलब्ध नहीं है। नया दान दर्ज करने के लिए नीचे दिए गए बटन पर क्लिक करें।
          </p>
          <button
            onClick={() => {
              setEntryToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-xs rounded-lg shadow transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ नया दान दर्ज करें</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          
          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-stone-100">
            {filteredEntries.map((item) => (
              <div
                key={item.id}
                className="p-3.5 hover:bg-[#FFF9F0] transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#7A1C1C] text-xs bg-stone-100 px-2 py-0.5 rounded">
                      {item.receiptNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF3E0] text-[#D84315]">
                      {item.purpose}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-800 number-clean">
                      ₹{item.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{item.donorName}</h4>
                  <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                    {item.mobile && <span className="number-clean">📞 {item.mobile}</span>}
                    {item.city && <span>📍 {item.city}</span>}
                  </div>
                  {item.notes && (
                    <div className="text-[11px] text-stone-600 bg-stone-50 p-1.5 rounded mt-1 italic">
                      "{item.notes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs text-stone-500">
                  <span className="number-clean">{item.daanDate} • {item.paymentMode}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setReceiptEntry(item)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-[#7A1C1C] font-semibold rounded text-xs"
                      title="रसीद प्रिंट"
                    >
                      रसीद
                    </button>
                    <button
                      onClick={() => {
                        setEntryToEdit(item);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded"
                      title="संशोधन"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.donorName, item.receiptNumber)}
                      className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                      title="हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] text-stone-700 text-xs uppercase font-bold border-b border-stone-200">
                  <th className="py-3 px-4">रसीद सं.</th>
                  <th className="py-3 px-4">दानदाता का नाम</th>
                  <th className="py-3 px-4">मोबाइल</th>
                  <th className="py-3 px-4">स्थान / नगर</th>
                  <th className="py-3 px-4">सेवा प्रयोजन</th>
                  <th className="py-3 px-4 text-right">दान राशि</th>
                  <th className="py-3 px-4">माध्यम</th>
                  <th className="py-3 px-4 text-center">स्थिति</th>
                  <th className="py-3 px-4 text-center">दिनांक</th>
                  <th className="py-3 px-4 text-center">क्रियाएँ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FFF9F0] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#7A1C1C] text-xs">
                      {item.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      <div>{item.donorName}</div>
                      {item.notes && (
                        <div className="text-[11px] text-stone-500 font-normal italic truncate max-w-xs">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-600 font-mono number-clean">
                      {item.mobile || "-"}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-700">
                      {item.city || item.address || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-[#FFF9F0] text-[#7A1C1C] border border-[#D4AF37]/30">
                        {item.purpose}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-800 number-clean text-base">
                      ₹{item.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-600">
                      <div>{item.paymentMode}</div>
                      {item.transactionId && (
                        <div className="text-[10px] text-stone-400 font-mono">{item.transactionId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        item.paymentStatus === "जमा"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.paymentStatus === "बाकी"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-stone-600 number-clean">
                      {item.daanDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setReceiptEntry(item)}
                          className="p-1.5 bg-[#FFF9F0] hover:bg-[#FFE0B2] text-[#7A1C1C] rounded border border-[#D4AF37]/30 transition"
                          title="रसीद देखें व प्रिंट करें"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEntryToEdit(item);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition"
                          title="संशोधन करें"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.donorName, item.receiptNumber)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition"
                          title="हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AshramDaanModal
        isOpen={isAddModalOpen}
        entryToEdit={entryToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setEntryToEdit(null);
        }}
        onSave={handleSaveEntry}
        onPrintReceiptRequested={(entry) => setReceiptEntry(entry)}
      />

      {/* RECEIPT PRINT MODAL */}
      <AshramReceiptModal
        isOpen={Boolean(receiptEntry)}
        entry={receiptEntry}
        onClose={() => setReceiptEntry(null)}
      />

    </div>
  );
};
