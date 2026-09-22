"use client";

import React from "react";
import { GauMataLogo } from "./icons/GauMataLogo";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { Plus, Download, Calendar } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";

interface Props {
  onOpenAddModal: () => void;
  onNavigate: (tab: string) => void;
  activeTab: string;
}

export const Header: React.FC<Props> = ({ onOpenAddModal, onNavigate, activeTab }) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("hi-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="bg-[#7A1C1C] text-white shadow-md border-b-2 border-[#D4AF37] sticky top-0 z-40">
      {/* Top Gold Border Accent */}
      <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] w-full"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & Dham Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer min-w-0" 
            onClick={() => onNavigate("dashboard")}
          >
            <div className="bg-white p-1 rounded-full border border-[#D4AF37] shrink-0 shadow-sm">
              <GauMataLogo className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>
            
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate leading-tight">
                बृजविहारी गौ तीर्थ धाम
              </h1>
              <p className="text-[11px] sm:text-xs text-[#FDE68A] font-medium flex items-center gap-1 truncate">
                <ShivlingIcon className="w-3.5 h-3.5 shrink-0 text-[#FDE68A]" />
                <span className="font-semibold">51,000 शिवलिंग निर्माण</span>
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Today's Date Badge */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-[#FFF9F0] bg-black/20 px-2.5 py-1.5 rounded border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span className="number-clean">{formattedDate}</span>
            </div>

            {/* Quick Export (Desktop) */}
            <button
              onClick={() => onNavigate("export")}
              className={`hidden md:flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition border ${
                activeTab === "export"
                  ? "bg-[#D4AF37] text-stone-900 border-[#FFF3B0]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>एक्सपोर्ट</span>
            </button>

            {/* PRIMARY ACTION BUTTON - Ultra mobile friendly */}
            <button
              onClick={onOpenAddModal}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-[#D84315] hover:bg-[#BF360C] active:bg-[#A72D07] text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition flex items-center gap-1.5 border border-[#FFE082]"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>+ नई एंट्री</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
