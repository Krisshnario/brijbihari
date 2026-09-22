"use client";

import React from "react";
import { DashboardStats, DonationEntry } from "@/types";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { GauMataLogo } from "./icons/GauMataLogo";
import { 
  Plus, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight,
  FileText
} from "lucide-react";

interface Props {
  stats: DashboardStats;
  recentEntries: DonationEntry[];
  onOpenAddModal: () => void;
  onNavigate: (tab: string) => void;
  onSelectEntry: (entry: DonationEntry) => void;
}

export const DashboardView: React.FC<Props> = ({
  stats,
  recentEntries,
  onOpenAddModal,
  onNavigate,
  onSelectEntry
}) => {
  const percentComplete = Math.min(
    100,
    ((stats.registeredShivlings / stats.targetShivlings) * 100)
  ).toFixed(1);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Divine Welcome Banner & Main Action Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E65100]/10 text-[#D84315] text-xs font-bold mb-1.5">
              <span>जय श्री कृष्णा - जय गौ माता</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#7A1C1C] tracking-tight">
              51,000 शिवलिंग निर्माण महायज्ञ
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-0.5">
              बृजविहारी गौ तीर्थ धाम दान रजिस्टर | कुल संकल्प 51,000 शिवलिंग
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <button
              onClick={onOpenAddModal}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-sm rounded-lg shadow transition flex items-center justify-center gap-2 border border-[#FFE082]"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>+ नई प्रविष्टि जोड़ें</span>
            </button>
          </div>
        </div>

        {/* Progress Bar towards 51,000 target */}
        <div className="mt-4 pt-3 border-t border-stone-200">
          <div className="flex justify-between items-center text-xs font-semibold mb-1">
            <span className="text-stone-700 flex items-center gap-1">
              <ShivlingIcon className="w-4 h-4 text-[#D84315]" />
              <span>प्रगति: <strong className="number-clean text-stone-900">{stats.registeredShivlings.toLocaleString('en-IN')}</strong> / 51,000</span>
            </span>
            <span className="text-[#D84315] font-bold number-clean">{percentComplete}% पूर्ण</span>
          </div>
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
            <div
              className="h-full bg-[#D84315] rounded-full transition-all duration-700"
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 5 KEY STATISTIC CARDS - Ultra Clean Number Typography */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* 1. Target Shivlings */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase">कुल लक्ष्य</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 number-clean">51,000</h3>
            </div>
            <div className="p-2 bg-[#FFF9F0] text-[#D4AF37] rounded-lg border border-[#D4AF37]/30 shrink-0">
              <ShivlingIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1.5">शिवलिंग संकल्प</p>
        </div>

        {/* 2. Registered Shivlings */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#D84315] uppercase">पंजीकृत</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#D84315] mt-0.5 number-clean">
                {stats.registeredShivlings.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-[#FFF3E0] text-[#D84315] rounded-lg border border-[#FFCC80] shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-600 mt-1.5 font-medium">समर्पित संख्या</p>
        </div>

        {/* 3. Remaining */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase">शेष लक्ष्य</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-800 mt-0.5 number-clean">
                {stats.remainingShivlings.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-stone-100 text-stone-600 rounded-lg shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1.5">शेष निर्माण</p>
        </div>

        {/* 4. Total Donation Amount */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-emerald-700 uppercase">कुल दान राशि</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-0.5 number-clean">
                ₹{stats.totalDonationAmount.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-1.5 font-medium">प्राप्त दान राशि</p>
        </div>

        {/* 5. Total Entries */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 uppercase">कुल प्रविष्टियां</p>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 number-clean">
                {stats.totalEntries.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-stone-100 text-stone-700 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 mt-1.5">दान रसीदें</p>
        </div>

      </div>

      {/* PAYMENT STATUS BREAKDOWN */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="bg-emerald-50 p-2.5 sm:p-3.5 rounded-lg border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 hidden sm:block" />
            <div>
              <div className="text-[10px] sm:text-xs font-bold text-emerald-800">पूर्ण जमा</div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-900 number-clean">{stats.paidEntriesCount}</div>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded font-bold">जमा</span>
        </div>

        <div className="bg-amber-50 p-2.5 sm:p-3.5 rounded-lg border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600 hidden sm:block" />
            <div>
              <div className="text-[10px] sm:text-xs font-bold text-amber-800">आंशिक दान</div>
              <div className="text-base sm:text-lg font-extrabold text-amber-900 number-clean">{stats.partialEntriesCount}</div>
            </div>
          </div>
          <span className="text-[10px] bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded font-bold">आंशिक</span>
        </div>

        <div className="bg-red-50 p-2.5 sm:p-3.5 rounded-lg border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600 hidden sm:block" />
            <div>
              <div className="text-[10px] sm:text-xs font-bold text-red-800">बाकी दान</div>
              <div className="text-base sm:text-lg font-extrabold text-red-900 number-clean">{stats.pendingEntriesCount}</div>
            </div>
          </div>
          <span className="text-[10px] bg-red-200/80 text-red-800 px-2 py-0.5 rounded font-bold">बाकी</span>
        </div>
      </div>

      {/* RECENT DONATION ENTRIES - Mobile Responsive Card / Table View */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:px-5 border-b border-stone-200 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <ShivlingIcon className="w-4 h-4 text-[#D84315]" />
            <h3 className="text-base font-bold text-[#7A1C1C]">हाल की दान प्रविष्टियां</h3>
          </div>
          <button
            onClick={() => onNavigate("records")}
            className="text-xs font-bold text-[#D84315] hover:text-[#BF360C] flex items-center gap-1"
          >
            <span>सभी देखें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <div className="p-6 text-center text-stone-500">
            <p className="text-sm font-medium">अभी तक कोई रिकॉर्ड दर्ज नहीं किया गया है।</p>
            <button
              onClick={onOpenAddModal}
              className="mt-2 px-3 py-1.5 bg-[#D84315] text-white text-xs font-bold rounded hover:bg-[#BF360C] transition inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>प्रविष्टि जोड़ें</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {/* Mobile Card List View for ultra-mobile screens */}
            <div className="block sm:hidden divide-y divide-stone-100">
              {recentEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 hover:bg-[#FFF9F0] transition cursor-pointer flex items-center justify-between gap-2"
                  onClick={() => onSelectEntry(entry)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="number-clean font-bold text-[#7A1C1C] text-xs">{entry.entryNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        entry.paymentStatus === "जमा" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {entry.paymentStatus}
                      </span>
                    </div>
                    <div className="font-bold text-stone-900 text-sm mt-0.5">{entry.devoteeName}</div>
                    <div className="text-[11px] text-stone-500 number-clean">{entry.mobile || entry.address || "-"}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-[#D84315] text-sm number-clean">{entry.shivlingCount} शिवलिंग</div>
                    <div className="font-bold text-emerald-800 text-xs number-clean">₹{entry.totalAmount?.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / Tablet Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 text-xs uppercase font-semibold border-b border-stone-200">
                    <th className="py-2.5 px-4">एंट्री नंबर</th>
                    <th className="py-2.5 px-4">दानदाता का नाम</th>
                    <th className="py-2.5 px-4">मोबाइल</th>
                    <th className="py-2.5 px-4 text-center">शिवलिंग</th>
                    <th className="py-2.5 px-4 text-right">कुल राशि</th>
                    <th className="py-2.5 px-4 text-center">स्थिति</th>
                    <th className="py-2.5 px-4 text-center">दिनांक</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {recentEntries.slice(0, 5).map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#FFF9F0] transition cursor-pointer"
                      onClick={() => onSelectEntry(entry)}
                    >
                      <td className="py-3 px-4 number-clean font-bold text-[#7A1C1C] text-xs">
                        {entry.entryNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {entry.devoteeName}
                      </td>
                      <td className="py-3 px-4 text-stone-600 number-clean text-xs">
                        {entry.mobile || "-"}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#D84315] number-clean">
                        {entry.shivlingCount}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-800 number-clean">
                        ₹{entry.totalAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
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
                      <td className="py-3 px-4 text-center text-xs text-stone-600 number-clean">
                        {entry.donationDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
