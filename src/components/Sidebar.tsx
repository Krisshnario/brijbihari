"use client";

import React from "react";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  UploadCloud, 
  Download, 
  History, 
  PlusCircle,
  CalendarDays,
  HeartHandshake
} from "lucide-react";

interface Props {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenAddModal: () => void;
  totalEntriesCount?: number;
  upcomingEventsCount?: number;
  ashramDaanCount?: number;
}

export const Sidebar: React.FC<Props> = ({ 
  activeTab, 
  onNavigate, 
  onOpenAddModal,
  totalEntriesCount = 0,
  upcomingEventsCount = 0,
  ashramDaanCount = 0
}) => {
  const navItems = [
    {
      id: "dashboard",
      label: "डैशबोर्ड",
      desktopLabel: "मुख्य डैशबोर्ड",
      sublabel: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "events",
      label: "कार्यक्रम",
      desktopLabel: "कार्यक्रम टाइमलाइन",
      sublabel: "Events Schedule",
      icon: CalendarDays,
      badge: upcomingEventsCount > 0 ? upcomingEventsCount.toString() : undefined,
    },
    {
      id: "ashramDaan",
      label: "आश्रम दान",
      desktopLabel: "आश्रम सेवा दान",
      sublabel: "Ashram Donations",
      icon: HeartHandshake,
      badge: ashramDaanCount > 0 ? ashramDaanCount.toString() : undefined,
    },
    {
      id: "records",
      label: "शिवलिंग दान",
      desktopLabel: "शिवलिंग दान रिकॉर्ड",
      sublabel: "51,000 Shivlings",
      icon: FileSpreadsheet,
      badge: totalEntriesCount > 0 ? totalEntriesCount.toString() : undefined,
    },
    {
      id: "devotees",
      label: "दानदाता",
      desktopLabel: "दानदाता सूची",
      sublabel: "Devotees",
      icon: Users,
    },

    {
      id: "import",
      label: "इम्पोर्ट",
      desktopLabel: "एक्सेल इम्पोर्ट",
      sublabel: "Excel Import",
      icon: UploadCloud,
    },
    {
      id: "export",
      label: "एक्सपोर्ट",
      desktopLabel: "डाटा एक्सपोर्ट",
      sublabel: "Export",
      icon: Download,
    },
    {
      id: "audit",
      label: "संशोधन",
      desktopLabel: "संशोधन रिकॉर्ड",
      sublabel: "Audit Logs",
      icon: History,
    },
  ];

  return (
    <aside className="w-full md:w-60 bg-white md:bg-[#FAF7F2] border-b md:border-b-0 md:border-r border-stone-200 flex-shrink-0">
      <div className="p-2 md:p-4 space-y-3 md:sticky md:top-16">
        
        {/* Desktop Quick Add Button */}
        <div className="hidden md:block">
          <button
            onClick={onOpenAddModal}
            className="w-full py-2.5 px-4 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 border border-[#FFCC80]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ नई दान प्रविष्टि</span>
          </button>
        </div>

        {/* Mobile First Horizontal Scrollable Navigation Tabs */}
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-shrink-0 md:flex-shrink flex items-center justify-between px-3 py-2 sm:p-2.5 rounded-lg text-left transition ${
                  isActive
                    ? "bg-[#FFF9F0] text-[#7A1C1C] font-bold border border-[#D4AF37]/60 shadow-xs md:border-l-4 md:border-l-[#D84315]"
                    : "text-stone-700 hover:bg-stone-100 font-medium border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      isActive ? "text-[#D84315]" : "text-stone-500"
                    }`}
                  />
                  <div>
                    <div className="text-xs sm:text-sm leading-tight md:hidden">{item.label}</div>
                    <div className="text-xs sm:text-sm leading-tight hidden md:block">{item.desktopLabel}</div>
                    <div className="text-[10px] text-stone-500 hidden md:block">{item.sublabel}</div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold number-clean ${
                      isActive
                        ? "bg-[#D84315] text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Target Box */}
        <div className="hidden md:block mt-4 bg-[#FFF9F0] p-3 rounded-lg border border-[#D4AF37]/40 text-center">
          <div className="text-xs font-semibold text-[#7A1C1C] uppercase tracking-wide">संकल्प लक्ष्य</div>
          <div className="text-xl font-bold text-[#D84315] number-clean mt-0.5">51,000 शिवलिंग</div>
          <div className="text-[11px] text-stone-600 mt-0.5">बृजविहारी गौ तीर्थ धाम</div>
        </div>

      </div>
    </aside>
  );
};
