"use client";

import React, { useState, useEffect } from "react";
import { AuditLog } from "@/types";
import { getAuditLogs } from "@/lib/db";
import { History, ShieldCheck, Clock, FileText, ArrowRight } from "lucide-react";

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-[#7A1C1C]" />
          <div>
            <h2 className="text-xl font-bold text-[#7A1C1C] font-serif">संशोधन ऑडिट लॉग (Audit Logs & Correction History)</h2>
            <p className="text-xs text-stone-500">स्थायी सुरक्षा रिकॉर्ड | मूल डेटा का संपूर्ण इतिहास</p>
          </div>
        </div>

        <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold flex items-center gap-1 border border-emerald-300">
          <ShieldCheck className="w-4 h-4" />
          <span>अपरिवर्तनीय लॉग्स Active</span>
        </span>
      </div>

      {/* Logs Table / Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-stone-500 bg-white rounded-xl">
          <div className="w-8 h-8 border-4 border-[#D84315] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold mt-2">ऑडिट लॉग्स लोड हो रहे हैं...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-stone-200 space-y-2">
          <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-stone-800">अभी तक कोई संशोधन दर्ज नहीं हुआ है।</h3>
          <p className="text-xs text-stone-500">सभी मूल दान रिकॉर्ड अपनी प्राथमिक स्थिति में सुरक्षित हैं।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#7A1C1C] bg-[#FFF9F0] px-2.5 py-1 rounded border border-[#D4AF37]/40 text-xs">
                    Entry #{log.entryNumber}
                  </span>
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.timestamp).toLocaleString("hi-IN")}
                  </span>
                </div>

                <div className="text-xs bg-amber-100 text-amber-900 px-2.5 py-1 rounded font-bold">
                  कारण: {log.reason}
                </div>
              </div>

              {/* Diff View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Original Values */}
                <div className="bg-red-50/60 p-3 rounded-lg border border-red-200 space-y-1">
                  <div className="font-bold text-red-800 uppercase border-b border-red-200 pb-1">
                    मूल मान (Original Record)
                  </div>
                  <div><strong className="text-stone-700">दानदाता:</strong> {log.originalData.devoteeName}</div>
                  <div><strong className="text-stone-700">मोबाइल:</strong> {log.originalData.mobile || "-"}</div>
                  <div><strong className="text-stone-700">शिवलिंग:</strong> {log.originalData.shivlingCount}</div>
                  <div><strong className="text-stone-700">कुल राशि:</strong> ₹{log.originalData.totalAmount?.toLocaleString('hi-IN')}</div>
                  <div><strong className="text-stone-700">भुगतान स्थिति:</strong> {log.originalData.paymentStatus}</div>
                </div>

                {/* Corrected Values */}
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-800 uppercase border-b border-emerald-200 pb-1">
                    संशोधित मान (Corrected Record)
                  </div>
                  <div><strong className="text-stone-700">दानदाता:</strong> {log.updatedData.devoteeName || log.originalData.devoteeName}</div>
                  <div><strong className="text-stone-700">मोबाइल:</strong> {log.updatedData.mobile ?? log.originalData.mobile}</div>
                  <div><strong className="text-stone-700">शिवलिंग:</strong> {log.updatedData.shivlingCount ?? log.originalData.shivlingCount}</div>
                  <div><strong className="text-stone-700">कुल राशि:</strong> ₹{(log.updatedData.totalAmount ?? log.originalData.totalAmount)?.toLocaleString('hi-IN')}</div>
                  <div><strong className="text-stone-700">भुगतान स्थिति:</strong> {log.updatedData.paymentStatus ?? log.originalData.paymentStatus}</div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
