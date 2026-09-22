"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { ImportPreviewRow, PaymentStatus } from "@/types";
import { importBatchDonations } from "@/lib/db";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { GauMataLogo } from "./icons/GauMataLogo";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Download } from "lucide-react";

export const ExcelImportView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ successCount: number; failedCount: number } | null>(null);

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        "दानदाता का नाम (Name)": "सुरेश कुमार शर्मा",
        "मोबाइल (Mobile)": "9826011223",
        "पता (Address)": "भोपाल, मध्य प्रदेश",
        "शिवलिंग संख्या (Shivlings)": 5,
        "प्रति शिवलिंग राशि (Rate)": 2100,
        "भुगतान स्थिति (Status)": "जमा",
        "दान तिथि (YYYY-MM-DD)": "2026-09-22",
        "नोट्स (Notes)": "ऐतिहासिक दान"
      },
      {
        "दानदाता का नाम (Name)": "मंजू देवी",
        "मोबाइल (Mobile)": "9425033445",
        "पता (Address)": "वृंदावन",
        "शिवलिंग संख्या (Shivlings)": 11,
        "प्रति शिवलिंग राशि (Rate)": 2100,
        "भुगतान स्थिति (Status)": "जमा",
        "दान तिथि (YYYY-MM-DD)": "2026-09-23",
        "नोट्स (Notes)": "संकल्प"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DonationSample");
    XLSX.writeFile(workbook, "Brijbihari_Shivling_Import_Sample.xlsx");
  };

  // Process uploaded Excel / CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const parsedRows: ImportPreviewRow[] = rawJson.map((row, index) => {
          const errors: string[] = [];
          
          // Map flexible keys
          const name = String(
            row["दानदाता का नाम (Name)"] || row["Name"] || row["devoteeName"] || row["दानदाता नाम"] || row["नाम"] || ""
          ).trim();

          const mobile = String(
            row["मोबाइल (Mobile)"] || row["Mobile"] || row["mobile"] || row["मोबाइल"] || ""
          ).trim();

          const address = String(
            row["पता (Address)"] || row["Address"] || row["address"] || row["पता"] || ""
          ).trim();

          const countRaw = row["शिवलिंग संख्या (Shivlings)"] ?? row["Shivlings"] ?? row["shivlingCount"] ?? row["शिवलिंग"] ?? 1;
          const shivlingCount = parseInt(countRaw, 10) || 1;

          const rateRaw = row["प्रति शिवलिंग राशि (Rate)"] ?? row["Rate"] ?? row["amountPerShivling"] ?? 2100;
          const amountPerShivling = parseInt(rateRaw, 10) || 2100;

          let statusRaw = String(
            row["भुगतान स्थिति (Status)"] || row["Status"] || row["paymentStatus"] || row["स्थिति"] || "जमा"
          ).trim();

          let paymentStatus: PaymentStatus = "जमा";
          if (statusRaw.includes("बाकी") || statusRaw.toLowerCase().includes("pending")) paymentStatus = "बाकी";
          else if (statusRaw.includes("आंशिक") || statusRaw.toLowerCase().includes("partial")) paymentStatus = "आंशिक";

          const dateRaw = row["दान तिथि (YYYY-MM-DD)"] || row["Date"] || row["donationDate"] || row["दिनांक"] || new Date().toISOString().split("T")[0];
          const donationDate = typeof dateRaw === "object" && dateRaw instanceof Date
            ? dateRaw.toISOString().split("T")[0]
            : String(dateRaw).substring(0, 10);

          const notes = String(row["नोट्स (Notes)"] || row["Notes"] || row["notes"] || row["टिप्पणी"] || "").trim();

          if (!name) errors.push("दानदाता नाम खाली है");
          if (shivlingCount <= 0) errors.push("शिवलिंग संख्या अमान्य है");

          return {
            rowNumber: index + 2, // Excel 1-indexed headers
            devoteeName: name,
            mobile,
            address,
            shivlingCount,
            amountPerShivling,
            totalAmount: shivlingCount * amountPerShivling,
            paymentStatus,
            donationDate,
            notes,
            isValid: errors.length === 0,
            errors
          };
        });

        setPreviewRows(parsedRows);
      } catch (err) {
        console.error("Excel parse error:", err);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  // Perform final import into database
  const handleConfirmImport = async () => {
    const validRows = previewRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    try {
      const formattedEntries = validRows.map((r, idx) => ({
        entryNumber: `SHIV-${10007 + idx}`,
        devoteeName: r.devoteeName,
        mobile: r.mobile,
        address: r.address,
        shivlingCount: r.shivlingCount,
        amountPerShivling: r.amountPerShivling,
        totalAmount: r.totalAmount,
        paymentStatus: r.paymentStatus,
        donationDate: r.donationDate,
        notes: r.notes
      }));

      const res = await importBatchDonations(formattedEntries);
      setImportResult(res);
      setPreviewRows([]);
      setFile(null);
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.length - validCount;

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-[#D84315]" />
          <div>
            <h2 className="text-xl font-bold text-[#7A1C1C] font-serif">एक्सेल / CSV इम्पोर्ट (Excel Bulk Import)</h2>
            <p className="text-xs text-stone-500">पुराने 51,000 Excel डेटा को डेटाबेस में लोड करें</p>
          </div>
        </div>

        <button
          onClick={handleDownloadSample}
          className="px-3.5 py-2 bg-[#FFF9F0] text-[#7A1C1C] font-bold text-xs rounded-lg border border-[#D4AF37] hover:bg-[#FDF2E9] transition flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-[#D84315]" />
          <span>नमूना Excel फ़ाइल डाउनलोड करें</span>
        </button>
      </div>

      {/* SUCCESS RESULT BANNER */}
      {importResult && (
        <div className="bg-emerald-50 p-6 rounded-xl border-2 border-emerald-400 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-xl font-extrabold text-emerald-900 font-serif">
            {importResult.successCount} दान प्रविष्टियां सफलतापूर्वक इम्पोर्ट की गईं!
          </h3>
          <p className="text-xs text-emerald-800">
            सभी प्रविष्टियां रिकॉर्ड डेटाबेस में सुरक्षित रूप से दर्ज हो चुकी हैं।
          </p>
        </div>
      )}

      {/* FILE UPLOAD DROPZONE */}
      {previewRows.length === 0 && (
        <div className="bg-white p-8 rounded-xl border-2 border-dashed border-[#D4AF37]/60 text-center space-y-4 hover:border-[#D84315] transition">
          <div className="w-16 h-16 bg-[#FFF9F0] text-[#D84315] rounded-full flex items-center justify-center mx-auto border border-[#D4AF37]">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-stone-900">अपनी Excel या CSV फ़ाइल चुनें</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              सपोर्टेड फॉर्मेट: .xlsx, .xls, .csv | 51,000 तक रिकॉर्ड सुरक्षित इम्पोर्ट करें
            </p>
          </div>

          <div>
            <label className="px-6 py-3 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-sm rounded-lg shadow-md cursor-pointer inline-flex items-center gap-2">
              <UploadCloud className="w-5 h-5" />
              <span>फ़ाइल अपलोड करें (Upload Excel)</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* PREVIEW MATRIX & CONFIRMATION */}
      {previewRows.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
            <div>
              <h3 className="font-bold text-[#7A1C1C] text-lg font-serif">पूर्वावलोकन matrix (Import Preview)</h3>
              <p className="text-xs text-stone-600">
                कुल पंक्तियां: <strong>{previewRows.length}</strong> | मान्य पंक्तियां: <strong className="text-emerald-700">{validCount}</strong> | अमान्य: <strong className="text-red-700">{invalidCount}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPreviewRows([]); setFile(null); }}
                className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg"
              >
                रद्द करें
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={isImporting || validCount === 0}
                className="px-5 py-2 bg-[#D84315] hover:bg-[#BF360C] text-white text-xs font-extrabold rounded-lg shadow flex items-center gap-1.5 disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isImporting ? "इम्पोर्ट हो रहा है..." : `${validCount} वैध रिकॉर्ड्स डेटाबेस में इम्पोर्ट करें`}</span>
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] text-stone-700 uppercase font-bold border-b">
                  <th className="py-2.5 px-3">पंक्ति #</th>
                  <th className="py-2.5 px-3">दानदाता नाम</th>
                  <th className="py-2.5 px-3">मोबाइल</th>
                  <th className="py-2.5 px-3">पता</th>
                  <th className="py-2.5 px-3 text-center">शिवलिंग</th>
                  <th className="py-2.5 px-3 text-right">कुल राशि</th>
                  <th className="py-2.5 px-3 text-center">स्थिति</th>
                  <th className="py-2.5 px-3 text-center">वैधता</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {previewRows.map((r, idx) => (
                  <tr key={idx} className={r.isValid ? "hover:bg-stone-50" : "bg-red-50/70"}>
                    <td className="py-2 px-3 font-mono font-semibold">{r.rowNumber}</td>
                    <td className="py-2 px-3 font-bold text-stone-900">{r.devoteeName || "-"}</td>
                    <td className="py-2 px-3 font-mono">{r.mobile || "-"}</td>
                    <td className="py-2 px-3">{r.address || "-"}</td>
                    <td className="py-2 px-3 text-center font-bold text-[#D84315]">{r.shivlingCount}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-800">₹{r.totalAmount.toLocaleString('hi-IN')}</td>
                    <td className="py-2 px-3 text-center font-semibold">{r.paymentStatus}</td>
                    <td className="py-2 px-3 text-center">
                      {r.isValid ? (
                        <span className="text-emerald-700 font-bold">✓ ठीक है</span>
                      ) : (
                        <span className="text-red-700 font-bold" title={r.errors.join(", ")}>
                          ❌ {r.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
