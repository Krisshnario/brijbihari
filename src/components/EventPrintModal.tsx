"use client";

import React, { useState } from "react";
import { EventItem } from "@/types";
import { computeEventStatus } from "@/lib/db";
import { GauMataLogo } from "./icons/GauMataLogo";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { X, Printer, Calendar, MapPin, Clock, Phone, User } from "lucide-react";

interface Props {
  isOpen: boolean;
  events: EventItem[];
  onClose: () => void;
}

export const EventPrintModal: React.FC<Props> = ({ isOpen, events, onClose }) => {
  const [filterMode, setFilterMode] = useState<"upcoming" | "all">("upcoming");

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString("hi-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayedEvents = events.filter((ev) => {
    if (filterMode === "all") return true;
    const status = computeEventStatus(ev.startDate, ev.endDate, ev.statusOverride);
    return status === "चल रहा है" || status === "आगामी";
  });

  const handlePrint = () => {
    window.print();
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("hi-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const getDurationDays = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? `${diff} दिवसीय` : "";
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden my-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar - Hidden during print */}
        <div className="bg-[#7A1C1C] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#D4AF37] print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#FDE68A]" />
            <h3 className="font-bold text-sm sm:text-base">
              पूज्य गुरुजी की कार्यक्रम समय-सारणी (प्रिंट / PDF)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-black/20 p-1 rounded-lg text-xs flex gap-1">
              <button
                onClick={() => setFilterMode("upcoming")}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  filterMode === "upcoming" ? "bg-[#D84315] text-white font-bold" : "text-stone-300 hover:text-white"
                }`}
              >
                आगामी एवं सक्रिय
              </button>
              <button
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  filterMode === "all" ? "bg-[#D84315] text-white font-bold" : "text-stone-300 hover:text-white"
                }`}
              >
                सभी कार्यक्रम ({events.length})
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#C29D29] text-stone-950 font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट करें</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white print:p-0">
          
          {/* Official Letterhead */}
          <div className="border-b-2 border-[#D4AF37] pb-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-1 bg-[#FFF9F0] border border-[#D4AF37] rounded-full">
                <GauMataLogo className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#7A1C1C]">
                  बृजविहारी गौ तीर्थ धाम
                </h1>
                <p className="text-xs text-[#D84315] font-semibold flex items-center justify-center gap-1">
                  <ShivlingIcon className="w-3.5 h-3.5 text-[#D84315]" />
                  <span>51,000 पार्थिव शिवलिंग निर्माण महायज्ञ</span>
                </p>
              </div>
            </div>

            <div className="bg-[#FFF9F0] inline-block px-4 py-1 rounded-full border border-[#D4AF37]/50 text-[#7A1C1C] text-sm font-bold mt-1">
              🚩 पूज्य गुरुजी की आधिकारिक कार्यक्रम समय-सारणी 🚩
            </div>
            
            <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-center gap-4">
              <span>सारणी जारी दिनांक: <strong className="text-stone-800">{today}</strong></span>
              <span>•</span>
              <span>कुल कार्यक्रम: <strong className="text-stone-800">{displayedEvents.length}</strong></span>
            </div>
          </div>

          {/* Events Schedule List */}
          {displayedEvents.length === 0 ? (
            <div className="text-center py-10 text-stone-500 text-sm">
              कोई कार्यक्रम उपलब्ध नहीं है।
            </div>
          ) : (
            <div className="space-y-4">
              {displayedEvents.map((ev, idx) => {
                const status = computeEventStatus(ev.startDate, ev.endDate, ev.statusOverride);
                const duration = getDurationDays(ev.startDate, ev.endDate);

                return (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-stone-300 bg-stone-50/50 break-inside-avoid print:border-stone-400 print:bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-stone-200 pb-2.5 mb-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#7A1C1C] text-white flex items-center justify-center font-bold text-xs shrink-0 number-clean">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-stone-900 leading-tight">
                              {ev.title}
                            </h3>
                            {ev.isSpecial && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                                ★ मुख्य आयोजन
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-600 mt-0.5 flex items-center gap-2">
                            <span className="font-semibold text-[#D84315]">श्रेणी: {ev.category}</span>
                            {duration && <span>({duration})</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                          status === "चल रहा है"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : status === "आगामी"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-stone-200 text-stone-700"
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#D84315] shrink-0" />
                        <div>
                          <strong className="text-stone-900">दिनांक: </strong>
                          <span className="number-clean">
                            {formatDateDisplay(ev.startDate)} से {formatDateDisplay(ev.endDate)}
                          </span>
                        </div>
                      </div>

                      {ev.timing && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#D84315] shrink-0" />
                          <div>
                            <strong className="text-stone-900">दैनिक समय: </strong>
                            <span>{ev.timing}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#D84315] shrink-0" />
                        <div>
                          <strong className="text-stone-900">स्थान: </strong>
                          <span>{ev.location}, {ev.city}</span>
                        </div>
                      </div>

                      {(ev.organizerName || ev.organizerPhone) && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-stone-500 shrink-0" />
                          <div>
                            <strong className="text-stone-900">आयोजक: </strong>
                            <span>{ev.organizerName || "-"} {ev.organizerPhone ? `(${ev.organizerPhone})` : ""}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {ev.description && (
                      <div className="mt-2 text-xs text-stone-600 bg-white p-2 rounded border border-stone-200">
                        <strong>विवरण: </strong>{ev.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer for Print */}
          <div className="mt-8 pt-4 border-t border-stone-300 text-center text-xs text-stone-500">
            <p className="font-semibold text-stone-700">बृजविहारी गौ तीर्थ धाम | पूज्य गुरुजी महाराज सेवा कार्यालय</p>
            <p>जय श्री कृष्णा • जय गौ माता • हर हर महादेव</p>
          </div>

        </div>

      </div>
    </div>
  );
};
