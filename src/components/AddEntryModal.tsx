"use client";

import React, { useState, useEffect } from "react";
import { DonationEntry, PaymentStatus } from "@/types";
import { generateNextEntryNumber, checkDuplicateMobile, addDonationEntry } from "@/lib/db";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { GauMataLogo } from "./icons/GauMataLogo";
import { 
  X, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Printer, 
  Plus, 
  IndianRupee,
  Phone,
  User,
  MapPin,
  Calendar,
  FileText
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEntryAdded: (entry: DonationEntry) => void;
  onPrintReceiptRequested?: (entry: DonationEntry) => void;
}

export const AddEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onEntryAdded,
  onPrintReceiptRequested
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [entryNumber, setEntryNumber] = useState<string>("लोड हो रहा है...");
  const [devoteeName, setDevoteeName] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [shivlingCount, setShivlingCount] = useState<number>(1);
  const [amountPerShivling, setAmountPerShivling] = useState<number>(2100);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("जमा");
  const [donationDate, setDonationDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [duplicateEntries, setDuplicateEntries] = useState<DonationEntry[]>([]);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState<boolean>(false);

  // Success Confirmation State
  const [successEntry, setSuccessEntry] = useState<DonationEntry | null>(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchNextNumber();
    }
  }, [isOpen]);

  const fetchNextNumber = async () => {
    try {
      const num = await generateNextEntryNumber();
      setEntryNumber(num);
    } catch {
      setEntryNumber("SHIV-10001");
    }
  };

  const resetForm = () => {
    setDevoteeName("");
    setMobile("");
    setAddress("");
    setShivlingCount(1);
    setAmountPerShivling(2100);
    setPaymentStatus("जमा");
    setDonationDate(todayStr);
    setNotes("");
    setErrorMessage("");
    setDuplicateEntries([]);
    setSuccessEntry(null);
  };

  const handleMobileChange = async (val: string) => {
    setMobile(val);
    if (val.trim().length >= 10) {
      setIsDuplicateChecking(true);
      const matches = await checkDuplicateMobile(val.trim());
      setDuplicateEntries(matches);
      setIsDuplicateChecking(false);
    } else {
      setDuplicateEntries([]);
    }
  };

  const totalAmount = (Number(shivlingCount) || 0) * (Number(amountPerShivling) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!devoteeName.trim()) {
      setErrorMessage("कृपया दानदाता का नाम दर्ज करें।");
      return;
    }

    if (!shivlingCount || shivlingCount <= 0) {
      setErrorMessage("कृपया शिवलिंग की वैध संख्या दर्ज करें।");
      return;
    }

    if (amountPerShivling < 0) {
      setErrorMessage("कृपया वैध प्रति शिवलिंग राशि दर्ज करें।");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await addDonationEntry({
        entryNumber,
        devoteeName: devoteeName.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        shivlingCount: Number(shivlingCount),
        amountPerShivling: Number(amountPerShivling),
        totalAmount,
        paymentStatus,
        donationDate,
        notes: notes.trim(),
      });

      setIsSubmitting(false);
      setSuccessEntry(created);
      onEntryAdded(created);
    } catch (err) {
      console.error("Save error:", err);
      setIsSubmitting(false);
      setErrorMessage("रिकॉर्ड सेव नहीं हो पाया। कृपया दोबारा प्रयास करें।");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border-t-2 sm:border-2 border-[#D4AF37] overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#7A1C1C] text-white p-3.5 sm:px-6 flex items-center justify-between border-b border-[#D4AF37] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-0.5 rounded-full border border-[#D4AF37] shrink-0">
              <GauMataLogo className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">नई दान प्रविष्टि (Add Entry)</h3>
              <p className="text-[10px] sm:text-xs text-[#FDE68A]">बृजविहारी गौ तीर्थ धाम</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUCCESS CONFIRMATION MODAL STATE */}
        {successEntry ? (
          <div className="p-5 sm:p-8 text-center space-y-4 bg-[#FFF9F0] overflow-y-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-400">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">प्रविष्टि दर्ज</span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#7A1C1C] number-clean mt-0.5">
                Entry #{successEntry.entryNumber} successfully added.
              </h3>
              <p className="text-stone-700 text-xs sm:text-sm mt-1.5">
                दानदाता <span className="font-bold text-stone-900">{successEntry.devoteeName}</span> जी की रसीद <span className="number-clean font-bold text-[#D84315]">{successEntry.entryNumber}</span> दर्ज हो गई है।
              </p>
            </div>

            {/* Entry Summary Pill */}
            <div className="bg-white p-3.5 rounded-xl border border-stone-200 text-left space-y-1.5 text-xs sm:text-sm max-w-md mx-auto">
              <div className="flex justify-between border-b pb-1">
                <span className="text-stone-600">शिवलिंग संख्या:</span>
                <span className="font-bold text-[#D84315] number-clean">{successEntry.shivlingCount} शिवलिंग</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-stone-600">कुल दान राशि:</span>
                <span className="font-bold text-emerald-800 number-clean">₹{successEntry.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">भुगतान स्थिति:</span>
                <span className="font-bold text-stone-900">{successEntry.paymentStatus}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {onPrintReceiptRequested && (
                <button
                  onClick={() => {
                    onPrintReceiptRequested(successEntry);
                    onClose();
                  }}
                  className="px-4 py-2 bg-[#7A1C1C] text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-[#FDE68A]" />
                  <span>रसीद प्रिंट</span>
                </button>
              )}

              <button
                onClick={() => {
                  resetForm();
                  fetchNextNumber();
                }}
                className="px-4 py-2 bg-[#D84315] text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ एक और जोड़ें</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-stone-200 text-stone-800 font-semibold text-xs rounded-lg"
              >
                बंद करें
              </button>
            </div>
          </div>
        ) : (
          /* REGULAR ENTRY FORM */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
            
            {errorMessage && (
              <div className="p-3 bg-red-50 border-l-4 border-red-600 text-red-800 text-xs rounded flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* DUPLICATE MOBILE WARNING BANNER */}
            {duplicateEntries.length > 0 && (
              <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>यह मोबाइल नंबर पहले से दर्ज है। ({duplicateEntries.length} पूर्व प्रविष्टियां)</span>
                </div>
                <p className="text-[11px] text-amber-800 font-medium">
                  एक दानदाता बार-बार दान कर सकते हैं। आप बेझिझक प्रविष्टि जारी रखें।
                </p>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. Entry Number */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  1. प्रविष्टि संख्या (Auto)
                </label>
                <input
                  type="text"
                  value={entryNumber}
                  readOnly
                  className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-lg text-stone-800 number-clean font-bold text-xs cursor-not-allowed"
                />
              </div>

              {/* 9. Donation Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D84315]" />
                  <span>9. दान तिथि (Date) *</span>
                </label>
                <input
                  type="date"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs number-clean focus:ring-1 focus:ring-[#D84315]"
                  required
                />
              </div>

              {/* 2. Devotee Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-900 uppercase mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#D84315]" />
                  <span>2. दानदाता का पूरा नाम (Devotee Name) *</span>
                </label>
                <input
                  type="text"
                  value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)}
                  placeholder="उदा. श्री राजेश कुमार शर्मा"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-semibold focus:ring-1 focus:ring-[#D84315]"
                  required
                  autoFocus
                />
              </div>

              {/* 3. Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span>3. मोबाइल नंबर (Mobile)</span>
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="98xxxxxxxx"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs number-clean focus:ring-1 focus:ring-[#D84315]"
                />
              </div>

              {/* 4. Address */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  <span>4. पता (Address/City)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="शहर / गांव का नाम"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-[#D84315]"
                />
              </div>

              {/* 5. Number of Shivlings */}
              <div className="bg-[#FFF9F0] p-2.5 rounded-lg border border-[#D4AF37]/40">
                <label className="block text-xs font-bold text-[#7A1C1C] uppercase mb-1 flex items-center gap-1">
                  <ShivlingIcon className="w-3.5 h-3.5 text-[#D84315]" />
                  <span>5. शिवलिंग संख्या *</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={shivlingCount}
                  onChange={(e) => setShivlingCount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 border border-[#D4AF37] rounded-lg text-base font-bold text-[#D84315] bg-white number-clean"
                  required
                />
              </div>

              {/* 6. Amount Per Shivling */}
              <div className="bg-[#FFF9F0] p-2.5 rounded-lg border border-[#D4AF37]/40">
                <label className="block text-xs font-bold text-[#7A1C1C] uppercase mb-1 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                  <span>6. प्रति शिवलिंग राशि (₹)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountPerShivling}
                  onChange={(e) => setAmountPerShivling(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 border border-[#D4AF37] rounded-lg text-base font-bold text-stone-900 bg-white number-clean"
                />
              </div>

              {/* 7. Total Amount */}
              <div className="sm:col-span-2 bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-800">
                    7. कुल दान राशि (Calculated):
                  </span>
                  <div className="text-[11px] text-emerald-700 font-medium number-clean">
                    {shivlingCount} × ₹{amountPerShivling.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-900 number-clean">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* 8. Payment Status */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                  8. भुगतान स्थिति *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("जमा")}
                    className={`py-2 px-2 rounded-lg font-bold text-xs border transition ${
                      paymentStatus === "जमा"
                        ? "bg-emerald-600 text-white border-emerald-700"
                        : "bg-stone-50 text-stone-700 border-stone-300"
                    }`}
                  >
                    जमा (Paid)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus("बाकी")}
                    className={`py-2 px-2 rounded-lg font-bold text-xs border transition ${
                      paymentStatus === "बाकी"
                        ? "bg-red-600 text-white border-red-700"
                        : "bg-stone-50 text-stone-700 border-stone-300"
                    }`}
                  >
                    बाकी (Pending)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus("आंशिक")}
                    className={`py-2 px-2 rounded-lg font-bold text-xs border transition ${
                      paymentStatus === "आंशिक"
                        ? "bg-amber-500 text-white border-amber-600"
                        : "bg-stone-50 text-stone-700 border-stone-300"
                    }`}
                  >
                    आंशिक (Partial)
                  </button>
                </div>
              </div>

              {/* 10. Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>10. विशेष टिप्पणी / नोट्स (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="उदा. बैंक स्थानांतरण, चेक नंबर या विशेष टिप्पणी..."
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-stone-200 text-stone-800 font-semibold text-xs rounded-lg"
              >
                रद्द करें
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#D84315] hover:bg-[#BF360C] text-white font-bold text-xs sm:text-sm rounded-lg shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "सेव..." : "सेव करें (Save Entry)"}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
