"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { getDonationRecords } from "@/lib/db";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { Download, FileSpreadsheet, CheckCircle, Filter } from "lucide-react";
import { PaymentStatus } from "@/types";

export const ExportUtility: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedCount, setExportedCount] = useState<number | null>(null);

  const handleExport = async (format: "xlsx" | "csv") => {
    setIsExporting(true);
    setExportedCount(null);

    try {
      const res = await getDonationRecords({
        pageSize: 100000, // Fetch all for export
        paymentStatus: statusFilter
      });

      const formattedData = res.data.map((item, idx) => ({
        "क्र. सं. (S.No)": idx + 1,
        "रसीद नंबर (Entry No)": item.entryNumber,
        "दानदाता का नाम (Devotee Name)": item.devoteeName,
        "मोबाइल नंबर (Mobile)": item.mobile || "-",
        "पता / स्थान (Address)": item.address || "-",
        "शिवलिंग संख्या (Shivling Count)": item.shivlingCount,
        "प्रति शिवलिंग राशि (Rate)": item.amountPerShivling,
        "कुल दान राशि (Total Amount)": item.totalAmount,
        "भुगतान स्थिति (Status)": item.paymentStatus,
        "दान तिथि (Date)": item.donationDate,
        "विशेष नोट्स (Notes)": item.notes || "-",
        "प्रविष्टि समय (Created At)": item.createdAt ? new Date(item.createdAt).toLocaleString("hi-IN") : "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DonationRecords");

      const fileName = `Brijbihari_Shivling_Donations_${new Date().toISOString().split("T")[0]}.${format}`;
      XLSX.writeFile(workbook, fileName);

      setExportedCount(res.data.length);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="w-6 h-6 text-[#7A1C1C]" />
          <div>
            <h2 className="text-xl font-bold text-[#7A1C1C] font-serif">डाटा एक्सपोर्ट (Export Donation Data)</h2>
            <p className="text-xs text-stone-500">सभी या फ़िल्टर किए गए दान रिकॉर्ड Excel/CSV में डाउनलोड करें</p>
          </div>
        </div>
      </div>

      {/* Main Export Card */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
        
        {/* Filter Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-700 uppercase flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#D84315]" />
            <span>1. एक्सपोर्ट हेतु भुगतान स्थिति फ़िल्टर चुनें:</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "जमा", "बाकी", "आंशिक"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                  statusFilter === st
                    ? "bg-[#D84315] text-white border-[#D84315] shadow-sm"
                    : "bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100"
                }`}
              >
                {st === "ALL" ? "सभी रिकॉर्ड (All Records)" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Success message */}
        {exportedCount !== null && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>सफलतापूर्वक {exportedCount} रिकॉर्ड्स एक्सपोर्ट फ़ाइल में डाउनलोड हो चुके हैं!</span>
          </div>
        )}

        {/* Download Buttons */}
        <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleExport("xlsx")}
            disabled={isExporting}
            className="p-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow hover:shadow-md transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-6 h-6 text-[#FDE68A]" />
            <div className="text-left">
              <div className="text-sm">Excel Workbook (.xlsx) में डाउनलोड करें</div>
              <div className="text-[11px] font-normal text-emerald-200">माइक्रोसॉफ्ट एक्सेल हेतु अनुशंसित</div>
            </div>
          </button>

          <button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="p-4 bg-stone-800 hover:bg-black text-white font-bold rounded-xl shadow hover:shadow-md transition flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Download className="w-6 h-6 text-stone-300" />
            <div className="text-left">
              <div className="text-sm">CSV फ़ाइल (.csv) में डाउनलोड करें</div>
              <div className="text-[11px] font-normal text-stone-400">यूनिवर्सल डेटा ट्रांसफर हेतु</div>
            </div>
          </button>
        </div>

      </div>

    </div>
  );
};
