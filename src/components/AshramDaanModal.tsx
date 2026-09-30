"use client";

import React, { useState, useEffect } from "react";
import { AshramDaanEntry, AshramDaanPurpose, PaymentMode, PaymentStatus } from "@/types";
import { generateNextAshramReceiptNumber } from "@/lib/db";
import { 
  X, 
  IndianRupee, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  FileText, 
  Check, 
  AlertCircle,
  Sparkles
} from "lucide-react";
import { GauMataLogo } from "./icons/GauMataLogo";

interface Props {
  isOpen: boolean;
  entryToEdit?: AshramDaanEntry | null;
  onClose: () => void;
  onSave: (entry: Omit<AshramDaanEntry, "id" | "createdAt">, editId?: string) => Promise<AshramDaanEntry>;
  onPrintReceiptRequested?: (entry: AshramDaanEntry) => void;
}

const PURPOSES: { id: AshramDaanPurpose; label: string; icon: string }[] = [
  { id: "गौ सेवा", label: "गौ सेवा (हरा चारा / दवा)", icon: "🐄" },
  { id: "अन्नक्षेत्र / भण्डारा", label: "अन्नक्षेत्र / संत भण्डारा", icon: "🍲" },
  { id: "आश्रम निर्माण", label: "आश्रम निर्माण / विकास", icon: "🏛️" },
  { id: "संत / अतिथि सेवा", label: "संत व अतिथि सेवा", icon: "🧘" },
  { id: "दीपदान / पूजा उत्सव", label: "दीपदान व पूजा उत्सव", icon: "🪔" },
  { id: "सामान्य दान", label: "सामान्य आश्रम दान", icon: "🚩" },
  { id: "अन्य", label: "अन्य विशेष सेवा", icon: "✨" },
];

const QUICK_AMOUNTS = [501, 1100, 2100, 5100, 11000, 21000, 51000, 100000];

const PAYMENT_MODES: PaymentMode[] = [
  "नकद (Cash)",
  "ऑनलाइन / UPI",
  "बैंक ट्रांसफर (NEFT)",
  "चेक (Cheque)",
];

const SANKALP_SUGGESTIONS = [
  "वार्षिक गौ ग्रास एवं हरा चारा सेवा",
  "जन्मदिन के उपलक्ष्य में विशेष दान",
  "पूज्य माता-पिता की स्मृति में भण्डारा",
  "यज्ञशाला निर्माण हेतु सहयोग",
  "विवाह वर्षगांठ पर संत सेवा",
  "परिवार कल्याण व सुख-समृद्धि हेतु"
];

export const AshramDaanModal: React.FC<Props> = ({
  isOpen,
  entryToEdit,
  onClose,
  onSave,
  onPrintReceiptRequested,
}) => {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [donorName, setDonorName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [purpose, setPurpose] = useState<AshramDaanPurpose>("गौ सेवा");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("ऑनलाइन / UPI");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("जमा");
  const [transactionId, setTransactionId] = useState("");
  const [daanDate, setDaanDate] = useState("");
  const [notes, setNotes] = useState("");
  const [receivedBy, setReceivedBy] = useState("कार्यालय");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (entryToEdit) {
        setReceiptNumber(entryToEdit.receiptNumber || "");
        setDonorName(entryToEdit.donorName || "");
        setMobile(entryToEdit.mobile || "");
        setAddress(entryToEdit.address || "");
        setCity(entryToEdit.city || "");
        setAmount(entryToEdit.amount || "");
        setPurpose(entryToEdit.purpose || "गौ सेवा");
        setPaymentMode(entryToEdit.paymentMode || "ऑनलाइन / UPI");
        setPaymentStatus(entryToEdit.paymentStatus || "जमा");
        setTransactionId(entryToEdit.transactionId || "");
        setDaanDate(entryToEdit.daanDate || new Date().toISOString().split("T")[0]);
        setNotes(entryToEdit.notes || "");
        setReceivedBy(entryToEdit.receivedBy || "कार्यालय");
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        setDonorName("");
        setMobile("");
        setAddress("");
        setCity("");
        setAmount(2100);
        setPurpose("गौ सेवा");
        setPaymentMode("ऑनलाइन / UPI");
        setPaymentStatus("जमा");
        setTransactionId("");
        setDaanDate(todayStr);
        setNotes("");
        setReceivedBy("कार्यालय");

        generateNextAshramReceiptNumber().then((rNum) => {
          setReceiptNumber(rNum);
        });
      }
      setError(null);
    }
  }, [isOpen, entryToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, shouldPrint: boolean = false) => {
    e.preventDefault();
    setError(null);

    if (!donorName.trim()) {
      setError("कृपया दानदाता का नाम दर्ज करें");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("कृपया वैध दान राशि दर्ज करें");
      return;
    }
    if (!daanDate) {
      setError("कृपया दान तिथि चुनें");
      return;
    }

    try {
      setIsSubmitting(true);
      const savedEntry = await onSave(
        {
          receiptNumber: receiptNumber || "ASH-10001",
          donorName: donorName.trim(),
          mobile: mobile.trim(),
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          amount: Number(amount),
          purpose,
          paymentMode,
          paymentStatus,
          transactionId: transactionId.trim() || undefined,
          daanDate,
          notes: notes.trim() || undefined,
          receivedBy: receivedBy.trim() || "कार्यालय",
        },
        entryToEdit?.id
      );

      if (shouldPrint && onPrintReceiptRequested) {
        onPrintReceiptRequested(savedEntry);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "आश्रम दान प्रविष्टि सुरक्षित करने में त्रुटि हुई।");
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
            <div className="p-1.5 bg-white rounded-full border border-[#D4AF37] shrink-0">
              <GauMataLogo className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {entryToEdit ? "आश्रम दान रिकॉर्ड संशोधित करें" : "नया आश्रम दान दर्ज करें"}
              </h2>
              <p className="text-xs text-[#FDE68A]/90">
                बृजविहारी गौ तीर्थ धाम - सामान्य एवं सेवा दान रजिस्टर
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
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Bar: Receipt Number & Date */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFF9F0] p-3 rounded-xl border border-[#D4AF37]/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700">रसीद संख्या:</span>
              <span className="font-mono font-bold text-[#7A1C1C] bg-white px-2.5 py-1 rounded border border-stone-200 text-sm">
                {receiptNumber || "ASH-10001"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D84315]" />
              <label className="text-xs font-bold text-stone-700">दान तिथि:</label>
              <input
                type="date"
                value={daanDate}
                onChange={(e) => setDaanDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-stone-300 rounded text-xs text-stone-900 font-semibold number-clean focus:outline-none focus:border-[#D84315]"
                required
              />
            </div>
          </div>

          {/* Daan Purpose Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              दान का प्रयोजन / सेवा प्रकार (Purpose of Daan) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PURPOSES.map((p) => {
                const isSelected = purpose === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPurpose(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      isSelected
                        ? "bg-[#7A1C1C] text-white border-[#D4AF37] shadow-xs"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200"
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-xs font-bold leading-tight">{p.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Donation Amount */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#7A1C1C] flex items-center gap-1">
                <IndianRupee className="w-4 h-4 text-[#D84315]" />
                <span>दान राशि (Donation Amount ₹) *</span>
              </label>
              {amount && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded number-clean">
                  ₹{Number(amount).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-lg">₹</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="उदा. 2100"
                className="w-full pl-8 pr-3 py-2.5 bg-white border border-stone-300 rounded-lg text-lg font-bold text-stone-900 number-clean focus:outline-none focus:border-[#D84315]"
                required
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`text-xs px-2.5 py-1 rounded-full font-bold number-clean transition border ${
                    amount === amt
                      ? "bg-[#D84315] text-white border-[#D84315]"
                      : "bg-white text-stone-700 hover:bg-stone-100 border-stone-300"
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Donor Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>दानदाता का नाम (Donor Name) *</span>
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="उदा. श्री रमेश जी शर्मा"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>मोबाइल नंबर (Mobile Number)</span>
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="उदा. 9826012345"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white number-clean transition"
              />
            </div>
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                <span>पता / स्थान (Address)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="उदा. एम.जी. रोड, नियर श्री कृष्ण मंदिर"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
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
                placeholder="उदा. इंदौर, भोपाल, वृंदावन"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Payment Mode & Status & Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                <span>भुगतान माध्यम</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:border-[#D84315]"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                भुगतान स्थिति (Status)
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:border-[#D84315]"
              >
                <option value="जमा">जमा (Paid / Received)</option>
                <option value="बाकी">बाकी (Pending)</option>
                <option value="आंशिक">आंशिक (Partial)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                यूटीआर / चेक / संदर्भ क्र.
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="उदा. UPI/42918491"
                className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 font-mono focus:outline-none focus:border-[#D84315]"
              />
            </div>
          </div>

          {/* Notes / Sankalp */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-stone-500" />
                <span>विशेष संकल्प / दान टिप्पणी (Notes)</span>
              </span>
              <span className="text-[11px] text-[#D84315] font-normal flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> सुझाव चुनें
              </span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="उदा. पूज्य माता-पिता की स्मृति में गौ सेवा / भण्डारा संकल्प"
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D84315] focus:bg-white transition"
            />
            {/* Quick Sankalp Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {SANKALP_SUGGESTIONS.slice(0, 3).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNotes(s)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 hover:bg-[#FFF9F0] text-stone-700 border border-stone-200 transition"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 font-semibold text-xs rounded-lg hover:bg-stone-100 transition"
              disabled={isSubmitting}
            >
              रद्द करें
            </button>

            <div className="flex items-center gap-2">
              {onPrintReceiptRequested && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg border border-stone-300 transition disabled:opacity-50"
                >
                  सुरक्षित करें व रसीद बनाएं
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5 border border-[#FFCC80] disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? "सुरक्षित हो रहा है..." : entryToEdit ? "बदलाव सुरक्षित करें" : "दान सुरक्षित करें"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
