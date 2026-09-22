"use client";

import React, { useState, useEffect } from "react";
import { DonationEntry, PaymentStatus } from "@/types";
import { getDonationRecords } from "@/lib/db";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { GauMataLogo } from "./icons/GauMataLogo";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit3, 
  Printer, 
  FileSpreadsheet, 
  X,
  Plus
} from "lucide-react";

interface Props {
  onSelectEntryForCorrection: (entry: DonationEntry) => void;
  onPrintReceipt: (entry: DonationEntry) => void;
  onOpenAddModal: () => void;
  refreshTrigger?: number;
}

export const RecordsTable: React.FC<Props> = ({
  onSelectEntryForCorrection,
  onPrintReceipt,
  onOpenAddModal,
  refreshTrigger = 0
}) => {
  const [entries, setEntries] = useState<DonationEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc" | "amountDesc" | "shivlingsDesc">("dateDesc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedEntry, setSelectedEntry] = useState<DonationEntry | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await getDonationRecords({
        searchQuery,
        paymentStatus: statusFilter,
        sortBy,
        page: currentPage,
        pageSize
      });
      setEntries(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Fetch records error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [searchQuery, statusFilter, sortBy, currentPage, pageSize, refreshTrigger]);

  return (
    <div className="space-y-3 sm:space-y-4">
      
      {/* Search & Filter Header Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
          
          <div className="flex items-center gap-2">
            <ShivlingIcon className="w-5 h-5 text-[#D84315]" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#7A1C1C]">दानदाता रिकॉर्ड (Donation Register)</h2>
              <p className="text-[11px] sm:text-xs text-stone-500">कुल <strong className="number-clean">{totalCount.toLocaleString('en-IN')}</strong> प्रविष्टियां</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="नाम, मोबाइल, रसीद खोजें..."
                className="w-full pl-8 pr-7 py-1.5 border border-stone-300 rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-[#D84315]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-stone-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
              {(["ALL", "जमा", "बाकी", "आंशिक"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                  className={`px-2 py-1 rounded font-bold transition text-[11px] ${
                    statusFilter === st
                      ? "bg-white text-[#7A1C1C] shadow-xs"
                      : "text-stone-600"
                  }`}
                >
                  {st === "ALL" ? "सभी" : st}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-stone-500 space-y-2">
            <div className="w-6 h-6 border-3 border-[#D84315] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">रिकॉर्ड लोड हो रहे हैं...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-stone-300 mx-auto" />
            <div className="text-stone-700 font-bold text-sm">
              अभी तक कोई रिकॉर्ड दर्ज नहीं किया गया है।
            </div>
            <button
              onClick={onOpenAddModal}
              className="mt-1 px-3 py-1.5 bg-[#D84315] text-white font-bold text-xs rounded hover:bg-[#BF360C] transition inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>नई प्रविष्टि जोड़ें</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Mobile View: Clean Card Layout */}
            <div className="block sm:hidden divide-y divide-stone-100">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 hover:bg-[#FFF9F0] transition cursor-pointer space-y-1.5"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="number-clean font-bold text-[#7A1C1C]">{entry.entryNumber}</span>
                    <span className="text-stone-500 number-clean text-[11px]">{entry.donationDate}</span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-stone-900 text-sm">{entry.devoteeName}</div>
                      <div className="text-[11px] text-stone-500 number-clean">{entry.mobile || entry.address || "-"}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-[#D84315] text-sm number-clean">{entry.shivlingCount} शिवलिंग</div>
                      <div className="font-bold text-emerald-800 text-xs number-clean">₹{entry.totalAmount?.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-stone-100 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      entry.paymentStatus === "जमा" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {entry.paymentStatus}
                    </span>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="text-stone-600 hover:text-[#7A1C1C] font-semibold"
                      >
                        विवरण
                      </button>
                      <button
                        onClick={() => onPrintReceipt(entry)}
                        className="text-emerald-700 font-semibold"
                      >
                        रसीद
                      </button>
                      <button
                        onClick={() => onSelectEntryForCorrection(entry)}
                        className="text-[#D84315] font-semibold"
                      >
                        संशोधन
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / Tablet View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] text-stone-700 uppercase font-bold border-b border-stone-200 text-xs">
                    <th className="py-3 px-3.5">Entry No.</th>
                    <th className="py-3 px-3.5">दानदाता नाम</th>
                    <th className="py-3 px-3.5">मोबाइल</th>
                    <th className="py-3 px-3.5">पता</th>
                    <th className="py-3 px-3.5 text-center">शिवलिंग</th>
                    <th className="py-3 px-3.5 text-right">कुल दान राशि</th>
                    <th className="py-3 px-3.5 text-center">स्थिति</th>
                    <th className="py-3 px-3.5 text-center">दिनांक</th>
                    <th className="py-3 px-3.5 text-center">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#FFF9F0] transition cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <td className="py-3 px-3.5 number-clean font-bold text-[#7A1C1C]">
                        {entry.entryNumber}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-stone-900">
                        {entry.devoteeName}
                      </td>
                      <td className="py-3 px-3.5 text-stone-600 number-clean">
                        {entry.mobile || "-"}
                      </td>
                      <td className="py-3 px-3.5 text-stone-600 text-xs">
                        {entry.address || "-"}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-[#D84315] number-clean">
                        {entry.shivlingCount}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-emerald-800 number-clean">
                        ₹{entry.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            entry.paymentStatus === "जमा"
                              ? "bg-emerald-100 text-emerald-800"
                              : entry.paymentStatus === "बाकी"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {entry.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center text-xs text-stone-600 number-clean">
                        {entry.donationDate}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedEntry(entry)}
                            className="p-1 text-stone-600 hover:text-[#7A1C1C]"
                            title="विवरण देखें"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintReceipt(entry)}
                            className="p-1 text-emerald-700 hover:text-emerald-900"
                            title="रसीद प्रिंट"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectEntryForCorrection(entry)}
                            className="p-1 text-[#D84315] hover:text-[#BF360C]"
                            title="संशोधन"
                          >
                            <Edit3 className="w-4 h-4" />
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

        {/* Pagination Control */}
        <div className="p-3 sm:px-5 border-t border-stone-200 bg-[#FAF7F2] flex items-center justify-between text-xs">
          <div className="text-stone-600 number-clean">
            कुल {totalCount.toLocaleString('en-IN')} (पेज {currentPage} / {totalPages})
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white border border-stone-300 rounded font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline" />
            </button>

            <span className="number-clean font-bold px-1">{currentPage}</span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 bg-white border border-stone-300 rounded font-semibold disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5 inline" />
            </button>
          </div>
        </div>

      </div>

      {/* RECORD DETAILS MODAL */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden">
            <div className="bg-[#7A1C1C] text-white p-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GauMataLogo className="w-6 h-6" />
                <h3 className="font-bold text-sm">रसीद #{selectedEntry.entryNumber}</h3>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 text-xs sm:text-sm bg-[#FFF9F0]/40">
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-stone-500">दानदाता:</span>
                  <span className="font-bold text-stone-900">{selectedEntry.devoteeName}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-stone-500">मोबाइल:</span>
                  <span className="font-bold number-clean">{selectedEntry.mobile || "दर्ज नहीं"}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-stone-500">शिवलिंग:</span>
                  <span className="font-bold text-[#D84315] number-clean">{selectedEntry.shivlingCount}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-stone-500">दर per शिवलिंग:</span>
                  <span className="font-bold number-clean">₹{selectedEntry.amountPerShivling?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 bg-emerald-50 p-1.5 rounded">
                  <span className="font-bold text-emerald-900">कुल दान राशि:</span>
                  <span className="font-extrabold text-emerald-900 number-clean text-base">₹{selectedEntry.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">स्थिति:</span>
                  <span className="font-bold">{selectedEntry.paymentStatus}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    const e = selectedEntry;
                    setSelectedEntry(null);
                    onPrintReceipt(e);
                  }}
                  className="px-3 py-1.5 bg-stone-800 text-white text-xs font-bold rounded flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>रसीद</span>
                </button>

                <button
                  onClick={() => {
                    const e = selectedEntry;
                    setSelectedEntry(null);
                    onSelectEntryForCorrection(e);
                  }}
                  className="px-3 py-1.5 bg-[#D84315] text-white text-xs font-bold rounded flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>संशोधन</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
