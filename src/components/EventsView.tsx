"use client";

import React, { useState, useEffect } from "react";
import { EventItem, EventCategory, EventStatus } from "@/types";
import { 
  getEvents, 
  addEvent, 
  updateEvent, 
  deleteEvent, 
  computeEventStatus 
} from "@/lib/db";
import { EventModal } from "./EventModal";
import { EventPrintModal } from "./EventPrintModal";
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  Sparkles, 
  Printer, 
  Share2, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarDays, 
  User, 
  Phone, 
  Layers, 
  ListFilter,
  Check,
  Copy
} from "lucide-react";
import { ShivlingIcon } from "./icons/ShivlingIcon";

interface Props {
  onRefreshStats?: () => void;
}

export const EventsView: React.FC<Props> = ({ onRefreshStats }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | EventStatus>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"timeline" | "cards" | "table">("timeline");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Load events
  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Save Event (Add or Edit)
  const handleSaveEvent = async (eventData: Omit<EventItem, "id" | "createdAt">, editId?: string) => {
    if (editId) {
      await updateEvent(editId, eventData);
    } else {
      await addEvent(eventData);
    }
    await loadEvents();
    if (onRefreshStats) onRefreshStats();
  };

  // Delete Event
  const handleDeleteEvent = async (id: string, title: string) => {
    if (window.confirm(`क्या आप निश्चित रूप से "${title}" कार्यक्रम को हटाना चाहते हैं?`)) {
      await deleteEvent(id);
      await loadEvents();
      if (onRefreshStats) onRefreshStats();
    }
  };

  // Helper date formatter
  const formatDateHindi = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("hi-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const getDayAndMonth = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      const day = d.getDate();
      const month = d.toLocaleDateString("hi-IN", { month: "short" });
      const weekday = d.toLocaleDateString("hi-IN", { weekday: "short" });
      return { day, month, weekday };
    } catch {
      return { day: "-", month: "-", weekday: "-" };
    }
  };

  const getDurationDays = (start: string, end: string) => {
    try {
      const s = new Date(start + "T00:00:00");
      const e = new Date(end + "T00:00:00");
      const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  const getDaysRemainingOrDayCount = (start: string, end: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");

    if (e < today) {
      return { label: "सम्पन्न", type: "past" as const };
    }
    if (s <= today && today <= e) {
      const dayNum = Math.ceil((today.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const total = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return { label: `आज सक्रिय (दिन ${dayNum}/${total})`, type: "ongoing" as const };
    }

    const diffDays = Math.ceil((s.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      return { label: "कल से शुरू", type: "upcoming" as const };
    }
    return { label: `${diffDays} दिन बाद`, type: "upcoming" as const };
  };

  // Filtered list
  const filteredEvents = events.filter((ev) => {
    const status = computeEventStatus(ev.startDate, ev.endDate, ev.statusOverride);
    if (statusFilter !== "ALL" && status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && ev.category !== categoryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchCity = ev.city?.toLowerCase().includes(q);
      const matchLoc = ev.location?.toLowerCase().includes(q);
      const matchOrg = ev.organizerName?.toLowerCase().includes(q);
      return matchTitle || matchCity || matchLoc || matchOrg;
    }
    return true;
  });

  // Event counts
  const ongoingCount = events.filter(e => computeEventStatus(e.startDate, e.endDate, e.statusOverride) === "चल रहा है").length;
  const upcomingCount = events.filter(e => computeEventStatus(e.startDate, e.endDate, e.statusOverride) === "आगामी").length;
  const completedCount = events.filter(e => computeEventStatus(e.startDate, e.endDate, e.statusOverride) === "सम्पन्न").length;

  // Active ongoing event for banner
  const activeOngoingEvent = events.find(e => computeEventStatus(e.startDate, e.endDate, e.statusOverride) === "चल रहा है");

  // WhatsApp share builder
  const handleShareWhatsApp = (singleEvent?: EventItem) => {
    let text = "";

    if (singleEvent) {
      const duration = getDurationDays(singleEvent.startDate, singleEvent.endDate);
      text = `🚩 *पूज्य गुरुजी का कार्यक्रम विवरण* 🚩\n*बृजविहारी गौ तीर्थ धाम*\n\n` +
        `⚜️ *${singleEvent.title}*\n` +
        `📅 *दिनांक:* ${formatDateHindi(singleEvent.startDate)} से ${formatDateHindi(singleEvent.endDate)} (${duration} दिवसीय)\n` +
        (singleEvent.timing ? `⏰ *समय:* ${singleEvent.timing}\n` : "") +
        `📍 *स्थान:* ${singleEvent.location}, ${singleEvent.city}\n` +
        (singleEvent.organizerName ? `👤 *यजमान/आयोजक:* ${singleEvent.organizerName} ${singleEvent.organizerPhone ? `(${singleEvent.organizerPhone})` : ""}\n` : "") +
        (singleEvent.description ? `📝 *विवरण:* ${singleEvent.description}\n` : "") +
        `\nजय श्री कृष्णा • जय गौ माता`;
    } else {
      text = `🚩 *पूज्य गुरुजी महाराज - आगामी कार्यक्रम समय-सारणी* 🚩\n*बृजविहारी गौ तीर्थ धाम*\n\n`;
      const activeList = events.filter(e => {
        const s = computeEventStatus(e.startDate, e.endDate, e.statusOverride);
        return s === "चल रहा है" || s === "आगामी";
      }).slice(0, 5);

      if (activeList.length === 0) {
        text += "वर्तमान में कोई आगामी कार्यक्रम प्रस्तावित नहीं है।\n";
      } else {
        activeList.forEach((e, idx) => {
          const duration = getDurationDays(e.startDate, e.endDate);
          const status = computeEventStatus(e.startDate, e.endDate, e.statusOverride);
          text += `${idx + 1}️⃣ *${e.title}* [${status}]\n` +
            `📅 दिनांक: ${formatDateHindi(e.startDate)} से ${formatDateHindi(e.endDate)} (${duration} दिवसीय)\n` +
            (e.timing ? `⏰ समय: ${e.timing}\n` : "") +
            `📍 स्थान: ${e.location}, ${e.city}\n` +
            (e.organizerName ? `👤 संपर्क: ${e.organizerName} ${e.organizerPhone ? `(${e.organizerPhone})` : ""}\n` : "") +
            `---------------------------\n`;
        });
      }
      text += `\nअधिक जानकारी हेतु संपर्क करें: बृजविहारी गौ तीर्थ धाम\nजय श्री कृष्णा • जय गौ माता`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#7A1C1C] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-[#D4AF37] animate-bounce text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>व्हाट्सएप संदेश कॉपी हो गया!</span>
        </div>
      )}

      {/* TOP HEADER & ACTION BANNER */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E65100]/10 text-[#D84315] text-xs font-bold mb-2 border border-[#D84315]/20">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>पूज्य गुरुजी की कार्यक्रम समय-सारणी</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#7A1C1C] tracking-tight">
              कार्यक्रम एवं उत्सव टाइमलाइन
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              कथा, अनुष्ठान, यज्ञ, गौ संवर्धन व उत्सवों की समय-सारणी (दिनांक से दिनांक तक) का सम्पूर्ण विवरण।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleShareWhatsApp()}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition flex items-center gap-1.5"
              title="व्हाट्सएप पर आगामी कार्यक्रम भेजें"
            >
              <Share2 className="w-4 h-4" />
              <span>व्हाट्सएप शेयर</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm rounded-lg border border-stone-300 transition flex items-center gap-1.5"
              title="गुरुजी के लिए कार्यक्रम शीट प्रिंट करें"
            >
              <Printer className="w-4 h-4 text-stone-700" />
              <span>प्रिंट समय-सारणी</span>
            </button>

            <button
              onClick={() => {
                setEventToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition flex items-center gap-1.5 border border-[#FFE082]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ नया कार्यक्रम जोड़ें</span>
            </button>
          </div>
        </div>

        {/* ACTIVE / ONGOING EVENT HIGHLIGHT BANNER */}
        {activeOngoingEvent && (
          <div className="mt-4 p-3.5 sm:p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-[#D84315] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#D84315] text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#D84315] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    वर्तमान में सक्रिय
                  </span>
                  <span className="text-xs font-semibold text-[#7A1C1C]">
                    {getDaysRemainingOrDayCount(activeOngoingEvent.startDate, activeOngoingEvent.endDate).label}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-0.5">
                  {activeOngoingEvent.title}
                </h3>
                <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#D84315]" />
                    <span className="font-semibold text-stone-800">
                      {formatDateHindi(activeOngoingEvent.startDate)} से {formatDateHindi(activeOngoingEvent.endDate)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D84315]" />
                    <span>{activeOngoingEvent.location}, {activeOngoingEvent.city}</span>
                  </span>
                  {activeOngoingEvent.timing && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D84315]" />
                      <span>{activeOngoingEvent.timing}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => {
                  setEventToEdit(activeOngoingEvent);
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg shadow-xs transition"
              >
                संशोधित करें
              </button>
              <button
                onClick={() => handleShareWhatsApp(activeOngoingEvent)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>शेयर</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* METRIC BADGES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter("ALL")}
          className={`p-3.5 rounded-xl border cursor-pointer transition ${
            statusFilter === "ALL" 
              ? "bg-[#FFF9F0] border-[#D4AF37] ring-1 ring-[#D4AF37]" 
              : "bg-white border-stone-200 hover:bg-stone-50"
          }`}
        >
          <div className="text-[11px] font-bold text-stone-500 uppercase">कुल कार्यक्रम</div>
          <div className="text-2xl font-extrabold text-stone-900 mt-0.5 number-clean">{events.length}</div>
          <div className="text-[11px] text-stone-500 mt-1">दर्ज समय-सारणी</div>
        </div>

        <div 
          onClick={() => setStatusFilter("चल रहा है")}
          className={`p-3.5 rounded-xl border cursor-pointer transition ${
            statusFilter === "चल रहा है" 
              ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400" 
              : "bg-white border-stone-200 hover:bg-emerald-50/50"
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>आज चल रहे</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-0.5 number-clean">{ongoingCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">सक्रिय आयोजन</div>
        </div>

        <div 
          onClick={() => setStatusFilter("आगामी")}
          className={`p-3.5 rounded-xl border cursor-pointer transition ${
            statusFilter === "आगामी" 
              ? "bg-amber-50 border-amber-400 ring-1 ring-amber-400" 
              : "bg-white border-stone-200 hover:bg-amber-50/50"
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase">आगामी कार्यक्रम</div>
          <div className="text-2xl font-extrabold text-amber-800 mt-0.5 number-clean">{upcomingCount}</div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">प्रस्तावित उत्सव</div>
        </div>

        <div 
          onClick={() => setStatusFilter("सम्पन्न")}
          className={`p-3.5 rounded-xl border cursor-pointer transition ${
            statusFilter === "सम्पन्न" 
              ? "bg-stone-100 border-stone-400 ring-1 ring-stone-400" 
              : "bg-white border-stone-200 hover:bg-stone-50"
          }`}
        >
          <div className="text-[11px] font-bold text-stone-500 uppercase">सम्पन्न आयोजन</div>
          <div className="text-2xl font-extrabold text-stone-700 mt-0.5 number-clean">{completedCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">इतिहास / संग्रह</div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="कार्यक्रम, नगर या आयोजक खोजें..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-[#D84315] focus:bg-white transition"
          />
        </div>

        {/* Filter Badges & View Switch */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded transition ${statusFilter === "ALL" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"}`}
            >
              सभी ({events.length})
            </button>
            <button
              onClick={() => setStatusFilter("चल रहा है")}
              className={`px-2.5 py-1 rounded transition ${statusFilter === "चल रहा है" ? "bg-emerald-600 text-white shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"}`}
            >
              सक्रिय ({ongoingCount})
            </button>
            <button
              onClick={() => setStatusFilter("आगामी")}
              className={`px-2.5 py-1 rounded transition ${statusFilter === "आगामी" ? "bg-[#D84315] text-white shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"}`}
            >
              आगामी ({upcomingCount})
            </button>
            <button
              onClick={() => setStatusFilter("सम्पन्न")}
              className={`px-2.5 py-1 rounded transition ${statusFilter === "सम्पन्न" ? "bg-stone-700 text-white shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"}`}
            >
              सम्पन्न ({completedCount})
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex bg-stone-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-2.5 py-1 rounded transition ${viewMode === "timeline" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500"}`}
              title="कालक्रम दृश्य"
            >
              टाइमलाइन
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 rounded transition ${viewMode === "cards" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500"}`}
              title="कार्ड दृश्य"
            >
              कार्ड
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded transition ${viewMode === "table" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500"}`}
              title="तालिका दृश्य"
            >
              तालिका
            </button>
          </div>
        </div>
      </div>

      {/* EVENTS CONTENT AREA */}
      {loading ? (
        <div className="p-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#D84315] border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm font-semibold">समय-सारणी लोड हो रही है...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <CalendarDays className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">कोई कार्यक्रम नहीं मिला</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            दिए गए फिल्टर या खोज के अनुसार कोई आयोजन दर्ज नहीं है। नया कार्यक्रम जोड़ने के लिए नीचे दिए गए बटन पर क्लिक करें।
          </p>
          <button
            onClick={() => {
              setEventToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-xs rounded-lg shadow transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ नया कार्यक्रम जोड़ें</span>
          </button>
        </div>
      ) : viewMode === "timeline" ? (
        /* TIMELINE VIEW */
        <div className="relative pl-6 sm:pl-10 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#D84315] before:via-[#D4AF37] before:to-stone-300">
          {filteredEvents.map((ev) => {
            const status = computeEventStatus(ev.startDate, ev.endDate, ev.statusOverride);
            const { day, month, weekday } = getDayAndMonth(ev.startDate);
            const duration = getDurationDays(ev.startDate, ev.endDate);
            const relativeStatus = getDaysRemainingOrDayCount(ev.startDate, ev.endDate);

            return (
              <div key={ev.id} className="relative group">
                
                {/* Timeline Bullet Node */}
                <div className={`absolute -left-6 sm:-left-10 top-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  status === "चल रहा है"
                    ? "bg-[#D84315] border-white ring-4 ring-orange-200 text-white scale-110 shadow-md"
                    : status === "आगामी"
                    ? "bg-amber-100 border-[#D4AF37] text-[#7A1C1C]"
                    : "bg-stone-200 border-stone-300 text-stone-600"
                }`}>
                  {status === "चल रहा है" ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Event Card in Timeline */}
                <div className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs hover:shadow-md ${
                  status === "चल रहा है"
                    ? "border-[#D84315] ring-1 ring-[#D84315]/30 bg-gradient-to-r from-white via-[#FFF9F0] to-white"
                    : ev.isSpecial
                    ? "border-[#D4AF37] bg-amber-50/20"
                    : "border-stone-200"
                }`}>
                  
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-stone-100 pb-3">
                    
                    {/* Date Block & Title */}
                    <div className="flex items-start gap-3.5">
                      {/* Bold Calendar Block */}
                      <div className="bg-[#7A1C1C] text-white rounded-xl p-2 text-center w-14 shrink-0 shadow-xs border border-[#D4AF37]">
                        <div className="text-[10px] uppercase font-bold text-[#FDE68A]">{month}</div>
                        <div className="text-xl font-extrabold number-clean leading-none my-0.5">{day}</div>
                        <div className="text-[9px] text-stone-200">{weekday}</div>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            status === "चल रहा है"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"
                              : status === "आगामी"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-stone-200 text-stone-700"
                          }`}>
                            {status === "चल रहा है" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>}
                            <span>{relativeStatus.label}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700">
                            {ev.category}
                          </span>

                          <span className="text-[11px] font-bold text-[#D84315] bg-[#FFF3E0] px-2 py-0.5 rounded-full number-clean">
                            {duration} दिवसीय
                          </span>

                          {ev.isSpecial && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Sparkles className="w-3 h-3 text-[#D84315]" />
                              <span>विशेष उत्सव</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1 leading-snug">
                          {ev.title}
                        </h3>

                        {/* Date Range string */}
                        <div className="text-xs font-semibold text-[#7A1C1C] mt-1 flex items-center gap-1.5 number-clean">
                          <Calendar className="w-3.5 h-3.5 text-[#D84315]" />
                          <span>
                            {formatDateHindi(ev.startDate)} से {formatDateHindi(ev.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end md:self-start shrink-0">
                      <button
                        onClick={() => handleShareWhatsApp(ev)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                        title="व्हाट्सएप पर भेजें"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setEventToEdit(ev);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                        title="संशोधन करें"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                        title="हटाएं"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Card Body Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 text-xs text-stone-700">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#D84315] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900">स्थान / नगर: </span>
                        <span>{ev.location}, <strong className="text-stone-800">{ev.city}</strong></span>
                      </div>
                    </div>

                    {ev.timing && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-[#D84315] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-900">दैनिक समय: </span>
                          <span>{ev.timing}</span>
                        </div>
                      </div>
                    )}

                    {(ev.organizerName || ev.organizerPhone) && (
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-900">यजमान / संपर्क: </span>
                          <span>{ev.organizerName || "-"} {ev.organizerPhone ? `(${ev.organizerPhone})` : ""}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {ev.description && (
                    <div className="mt-3 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                      <strong className="text-stone-800">दैनिक सारणी / विशेष विवरण: </strong>
                      <span>{ev.description}</span>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      ) : viewMode === "cards" ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((ev) => {
            const status = computeEventStatus(ev.startDate, ev.endDate, ev.statusOverride);
            const duration = getDurationDays(ev.startDate, ev.endDate);
            const relativeStatus = getDaysRemainingOrDayCount(ev.startDate, ev.endDate);

            return (
              <div
                key={ev.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  status === "चल रहा है"
                    ? "border-[#D84315] ring-1 ring-[#D84315]/30 bg-orange-50/20"
                    : "border-stone-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      status === "चल रहा है"
                        ? "bg-emerald-100 text-emerald-800"
                        : status === "आगामी"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-stone-200 text-stone-700"
                    }`}>
                      {relativeStatus.label}
                    </span>

                    <span className="text-[11px] font-bold text-[#D84315] bg-[#FFF3E0] px-2 py-0.5 rounded-full number-clean">
                      {duration} दिवसीय
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-stone-900 leading-snug">
                    {ev.title}
                  </h3>

                  <div className="mt-2.5 p-2.5 bg-[#FFF9F0] rounded-xl border border-[#D4AF37]/30 text-xs text-[#7A1C1C] space-y-1">
                    <div className="font-bold flex items-center gap-1.5 number-clean">
                      <Calendar className="w-3.5 h-3.5 text-[#D84315]" />
                      <span>{formatDateHindi(ev.startDate)} से {formatDateHindi(ev.endDate)}</span>
                    </div>
                    {ev.timing && (
                      <div className="text-stone-700 flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3 h-3 text-[#D84315]" />
                        <span>{ev.timing}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D84315] shrink-0 mt-0.5" />
                      <span>{ev.location}, <strong>{ev.city}</strong></span>
                    </div>
                    {ev.organizerName && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{ev.organizerName} {ev.organizerPhone ? `(${ev.organizerPhone})` : ""}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100">
                  <span className="text-[11px] font-semibold text-stone-500">
                    श्रेणी: {ev.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShareWhatsApp(ev)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                      title="व्हाट्सएप"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEventToEdit(ev);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                      title="संशोधन"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id, ev.title)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                      title="हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] text-stone-700 text-xs uppercase font-bold border-b border-stone-200">
                <th className="py-3 px-4">कार्यक्रम का नाम</th>
                <th className="py-3 px-4">श्रेणी</th>
                <th className="py-3 px-4">प्रारंभ दिनांक</th>
                <th className="py-3 px-4">समापन दिनांक</th>
                <th className="py-3 px-4">अवधि</th>
                <th className="py-3 px-4">स्थान / नगर</th>
                <th className="py-3 px-4">स्थिति</th>
                <th className="py-3 px-4 text-center">क्रिया</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredEvents.map((ev) => {
                const status = computeEventStatus(ev.startDate, ev.endDate, ev.statusOverride);
                const duration = getDurationDays(ev.startDate, ev.endDate);

                return (
                  <tr key={ev.id} className="hover:bg-[#FFF9F0] transition">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      <div>{ev.title}</div>
                      {ev.timing && <div className="text-[11px] text-stone-500 font-normal">{ev.timing}</div>}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-stone-700">
                      {ev.category}
                    </td>
                    <td className="py-3 px-4 text-xs number-clean text-stone-800">
                      {formatDateHindi(ev.startDate)}
                    </td>
                    <td className="py-3 px-4 text-xs number-clean text-stone-800">
                      {formatDateHindi(ev.endDate)}
                    </td>
                    <td className="py-3 px-4 text-xs number-clean font-bold text-[#D84315]">
                      {duration} दिन
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-700">
                      <div>{ev.location}</div>
                      <div className="text-stone-500 font-medium">{ev.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        status === "चल रहा है"
                          ? "bg-emerald-100 text-emerald-800"
                          : status === "आगामी"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-stone-200 text-stone-700"
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleShareWhatsApp(ev)}
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                          title="शेयर"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEventToEdit(ev);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 text-stone-700 hover:bg-stone-100 rounded"
                          title="संशोधन"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="हटाएं"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EVENT ADD / EDIT MODAL */}
      <EventModal
        isOpen={isAddModalOpen}
        eventToEdit={eventToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEvent}
      />

      {/* EVENT PRINT MODAL */}
      <EventPrintModal
        isOpen={isPrintModalOpen}
        events={events}
        onClose={() => setIsPrintModalOpen(false)}
      />

    </div>
  );
};
