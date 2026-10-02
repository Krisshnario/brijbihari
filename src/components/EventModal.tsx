"use client";

import React, { useState, useEffect } from "react";
import { EventItem, EventCategory, EventStatus } from "@/types";
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  Sparkles, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { ShivlingIcon } from "./icons/ShivlingIcon";

interface Props {
  isOpen: boolean;
  eventToEdit?: EventItem | null;
  onClose: () => void;
  onSave: (event: Omit<EventItem, "id" | "createdAt">, editId?: string) => Promise<void>;
}

const CATEGORIES: EventCategory[] = ['कथा', 'अनुष्ठान', 'उत्सव', 'भण्डारा', 'यात्रा', 'बैठक', 'अन्य'];

const QUICK_TITLES = [
  "श्रीमद्भागवत कथा सप्ताह ज्ञान महायज्ञ",
  "51,000 पार्थिव शिवलिंग निर्माण अनुष्ठान",
  "श्री राम कथा अमृत महोत्सव",
  "श्री शिव महापुराण कथा",
  "गोपाष्टमी महोत्सव एवं गौ पूजन भण्डारा",
  "कार्तिक पूर्णिमा दीपदान एवं छप्पन भोग",
  "श्री हनुमान जन्मोत्सव एवं सुंदरकांड पाठ",
  "विशाल संत समागम एवं धर्म सभा"
];

export const EventModal: React.FC<Props> = ({
  isOpen,
  eventToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("कथा");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timing, setTiming] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [isSpecial, setIsSpecial] = useState(false);
  const [statusOverride, setStatusOverride] = useState<EventStatus | "">("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates to today / tomorrow when opening
  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setTitle(eventToEdit.title || "");
        setCategory(eventToEdit.category || "कथा");
        setStartDate(eventToEdit.startDate || "");
        setEndDate(eventToEdit.endDate || "");
        setTiming(eventToEdit.timing || "");
        setLocation(eventToEdit.location || "");
        setCity(eventToEdit.city || "");
        setOrganizerName(eventToEdit.organizerName || "");
        setOrganizerPhone(eventToEdit.organizerPhone || "");
        setDescription(eventToEdit.description || "");
        setIsSpecial(Boolean(eventToEdit.isSpecial));
        setStatusOverride(eventToEdit.statusOverride || "");
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 6);
        const nextWeekStr = nextWeek.toISOString().split("T")[0];

        setTitle("");
        setCategory("कथा");
        setStartDate(todayStr);
        setEndDate(nextWeekStr);
        setTiming("दोपहर 2:30 से सायं 6:30 बजे");
        setLocation("बृजविहारी गौ तीर्थ धाम");
        setCity("वृंदावन");
        setOrganizerName("");
        setOrganizerPhone("");
        setDescription("");
        setIsSpecial(false);
        setStatusOverride("");
      }
      setError(null);
    }
  }, [isOpen, eventToEdit]);

  if (!isOpen) return null;

  // Calculate day count
  const calculateDays = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : null;
  };

  const totalDays = calculateDays();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("कृपया कार्यक्रम का नाम दर्ज करें");
      return;
    }
    if (!startDate) {
      setError("कृपया प्रारंभ दिनांक चुनें");
      return;
    }
    if (!endDate) {
      setError("कृपया समापन दिनांक चुनें");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("समापन दिनांक प्रारंभ दिनांक से पूर्व की नहीं हो सकती");
      return;
    }
    if (!location.trim()) {
      setError("कृपया स्थान / आयोजन स्थल दर्ज करें");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(
        {
          title: title.trim(),
          category,
          startDate,
          endDate,
          timing: timing.trim(),
          location: location.trim(),
          city: city.trim() || "वृंदावन",
          organizerName: organizerName.trim(),
          organizerPhone: organizerPhone.trim(),
          description: description.trim(),
          isSpecial,
          ...(statusOverride ? { statusOverride: statusOverride as EventStatus } : {}),
        },
        eventToEdit?.id
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || "कार्यक्रम सुरक्षित करने में त्रुटि हुई।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#7A1C1C] via-[#8E2323] to-[#7A1C1C] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg border border-white/20">
              <Calendar className="w-5 h-5 text-[#FDE68A]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {eventToEdit ? "कार्यक्रम विवरण संशोधित करें" : "नया कार्यक्रम / उत्सव जोड़ें"}
              </h2>
              <p className="text-xs text-[#FDE68A]/90">
                पूज्य गुरुजी की कार्यक्रम समय-सारणी में प्रविष्टि
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Title Suggestions */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span>कार्यक्रम का नाम / शीर्षक *</span>
              <span className="text-[11px] text-[#D84315] font-normal flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                सुझाव क्लिक करें
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="उदा. श्रीमद्भागवत कथा सप्ताह ज्ञान महायज्ञ"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
              required
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_TITLES.slice(0, 4).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 hover:bg-[#FFF9F0] text-stone-700 hover:text-[#7A1C1C] border border-stone-200 transition"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Special Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                कार्यक्रम की श्रेणी (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-2 sm:pt-6">
              <label className="relative flex items-center gap-2 cursor-pointer select-none bg-amber-50/70 hover:bg-amber-50 p-2.5 rounded-lg border border-amber-200 w-full transition">
                <input
                  type="checkbox"
                  checked={isSpecial}
                  onChange={(e) => setIsSpecial(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D84315] focus:ring-[#D84315]"
                />
                <span className="text-xs font-bold text-[#7A1C1C] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D84315]" />
                  <span>मुख्य / विशेष आयोजन (हाइलाइट करें)</span>
                </span>
              </label>
            </div>
          </div>

          {/* Date Range: Start to End */}
          <div className="bg-[#FFF9F0] p-4 rounded-xl border border-[#D4AF37]/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A1C1C] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#D84315]" />
                <span>समय-सीमा (दिनांक से दिनांक तक) *</span>
              </span>
              {totalDays !== null && (
                <span className="text-xs font-bold px-2.5 py-0.5 bg-[#D84315] text-white rounded-full number-clean">
                  {totalDays} दिवसीय कार्यक्रम
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  प्रारंभ दिनांक (Start Date) *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] number-clean transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  समापन दिनांक (End Date) *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] number-clean transition"
                  required
                />
              </div>
            </div>

            {/* Daily Timing */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#D84315]" />
                <span>दैनिक समय (Daily Timing)</span>
              </label>
              <input
                type="text"
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                placeholder="उदा. दोपहर 2:30 से सायं 6:30 बजे / प्रातः 8:00 से 12:00 बजे"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] transition"
              />
            </div>
          </div>

          {/* Location & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#D84315]" />
                <span>स्थान / आयोजन स्थल *</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="उदा. बृजविहारी गौ तीर्थ धाम, मुख्य पांडाल"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                नगर / शहर (City)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="उदा. वृंदावन, इंदौर, उज्जैन"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Organizer / Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>मुख्य यजमान / आयोजक का नाम</span>
              </label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="उदा. श्री रमेश जी अग्रवाल / समस्त गौ भक्त"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>आयोजक मोबाइल नंबर</span>
              </label>
              <input
                type="tel"
                value={organizerPhone}
                onChange={(e) => setOrganizerPhone(e.target.value)}
                placeholder="उदा. 9826012345"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white number-clean transition"
              />
            </div>
          </div>

          {/* Description & Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>कार्यक्रम विवरण / विशेष निर्देश / दैनिक सारणी</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="उदा. नित्य हवन, महाआरती, पूज्य गुरुजी का आशीर्वचन एवं भण्डारा व्यवस्था..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition resize-none"
            />
          </div>

          {/* Status Override Option */}
          <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-100 p-2.5 rounded-lg border border-stone-200">
            <span className="font-semibold">स्थिति (Status):</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={statusOverride === ""}
                  onChange={() => setStatusOverride("")}
                />
                <span>स्वतः (दिनांक अनुसार)</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={statusOverride === "चल रहा है"}
                  onChange={() => setStatusOverride("चल रहा है")}
                />
                <span>चल रहा है</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={statusOverride === "आगामी"}
                  onChange={() => setStatusOverride("आगामी")}
                />
                <span>आगामी</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={statusOverride === "सम्पन्न"}
                  onChange={() => setStatusOverride("सम्पन्न")}
                />
                <span>सम्पन्न</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 font-semibold text-sm rounded-lg hover:bg-stone-100 transition"
              disabled={isSubmitting}
            >
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-sm rounded-lg shadow-md transition flex items-center gap-1.5 border border-[#FFCC80] disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? "सुरक्षित हो रहा है..." : eventToEdit ? "बदलाव सुरक्षित करें" : "कार्यक्रम सुरक्षित करें"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
