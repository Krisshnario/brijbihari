"use client";

import React, { useState, useEffect } from "react";
import { DevoteeSummary } from "@/types";
import { getDevoteesList } from "@/lib/db";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { GauMataLogo } from "./icons/GauMataLogo";
import { Users, Search, Phone, MapPin, ChevronDown, ChevronUp, FileText } from "lucide-react";

export const DevoteeDirectory: React.FC = () => {
  const [devotees, setDevotees] = useState<DevoteeSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchDevotees();
  }, []);

  const fetchDevotees = async () => {
    setIsLoading(true);
    try {
      const list = await getDevoteesList();
      setDevotees(list);
    } catch (err) {
      console.error("Fetch devotees error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = devotees.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.devoteeName.toLowerCase().includes(q) ||
      d.mobile.includes(q) ||
      d.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-[#7A1C1C]" />
          <div>
            <h2 className="text-xl font-bold text-[#7A1C1C] font-serif">दानदाता निर्देशिका (Devotees Directory)</h2>
            <p className="text-xs text-stone-500">कुल {devotees.length} दानदाता पंजीकृत हैं</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="दानदाता का नाम या मोबाइल खोजें..."
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D84315]"
          />
        </div>
      </div>

      {/* Devotees Grid / List */}
      {isLoading ? (
        <div className="p-12 text-center text-stone-500 bg-white rounded-xl">
          <div className="w-8 h-8 border-4 border-[#D84315] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold mt-2">दानदाता सूची लोड हो रही है...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-stone-200 text-stone-500">
          कोई दानदाता नहीं मिला।
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((devotee, idx) => {
            const isExpanded = expandedKey === `${devotee.mobile}-${devotee.devoteeName}`;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden hover:border-[#D4AF37]/50 transition"
              >
                {/* Main Bar */}
                <div
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#FFF9F0]"
                  onClick={() =>
                    setExpandedKey(isExpanded ? null : `${devotee.mobile}-${devotee.devoteeName}`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFF9F0] text-[#7A1C1C] rounded-full font-serif font-bold text-lg flex items-center justify-center border border-[#D4AF37]">
                      {devotee.devoteeName.charAt(0)}
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-900 text-base">{devotee.devoteeName}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {devotee.mobile}
                        </span>
                        {devotee.address !== "-" && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            {devotee.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Pills */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <div className="text-xs text-stone-500">कुल समर्पित शिवलिंग</div>
                      <div className="text-lg font-extrabold text-[#D84315] font-serif flex items-center justify-end gap-1">
                        <ShivlingIcon className="w-4 h-4 text-[#D84315]" />
                        <span>{devotee.totalShivlings} शिवलिंग</span>
                      </div>
                    </div>

                    <div className="text-right pl-3 border-l border-stone-200">
                      <div className="text-xs text-stone-500">कुल दान राशि</div>
                      <div className="text-lg font-extrabold text-emerald-800 font-serif">
                        ₹{devotee.totalAmount.toLocaleString('hi-IN')}
                      </div>
                    </div>

                    <div className="p-1 text-stone-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Timeline View */}
                {isExpanded && (
                  <div className="p-4 bg-[#FAF7F2] border-t border-stone-200 space-y-2">
                    <div className="text-xs font-bold text-[#7A1C1C] uppercase mb-2">
                      दान इतिहास ({devotee.donationCount} प्रविष्टियां):
                    </div>
                    <div className="space-y-1.5">
                      {devotee.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-white p-3 rounded-lg border border-stone-200 text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#7A1C1C] mr-2">{entry.entryNumber}</span>
                            <span className="text-stone-700">{entry.donationDate}</span>
                            {entry.notes && <span className="text-stone-500 ml-2 font-italic">({entry.notes})</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#D84315]">{entry.shivlingCount} शिवलिंग</span>
                            <span className="font-bold text-emerald-800">₹{entry.totalAmount.toLocaleString('hi-IN')}</span>
                            <span className="px-2 py-0.5 bg-stone-100 rounded text-[11px] font-bold">{entry.paymentStatus}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
