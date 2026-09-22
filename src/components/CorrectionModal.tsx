"use client";

import React, { useState } from "react";
import { DonationEntry, PaymentStatus } from "@/types";
import { applyCorrection } from "@/lib/db";
import { GauMataLogo } from "./icons/GauMataLogo";
import { X, ShieldAlert, CheckCircle, Save, History } from "lucide-react";

interface Props {
  entry: DonationEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onCorrectionComplete: (updated: DonationEntry) => void;
}

export const CorrectionModal: React.FC<Props> = ({
  entry,
  isOpen,
  onClose,
  onCorrectionComplete
}) => {
  if (!isOpen || !entry) return null;

  const [devoteeName, setDevoteeName] = useState<string>(entry.devoteeName);
  const [mobile, setMobile] = useState<string>(entry.mobile || "");
  const [address, setAddress] = useState<string>(entry.address || "");
  const [shivlingCount, setShivlingCount] = useState<number>(entry.shivlingCount);
  const [amountPerShivling, setAmountPerShivling] = useState<number>(entry.amountPerShivling || 2100);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(entry.paymentStatus);
  const [reason, setReason] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const totalAmount = (Number(shivlingCount) || 0) * (Number(amountPerShivling) || 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!reason.trim()) {
      setErrorMessage("कृपया संशोधन का कारण (Reason for correction) दर्ज करना आवश्यक है।");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await applyCorrection(
        entry.id,
        {
          devoteeName: devoteeName.trim(),
          mobile: mobile.trim(),
          address: address.trim(),
          shivlingCount: Number(shivlingCount),
          amountPerShivling: Number(amountPerShivling),
          totalAmount,
          paymentStatus
        },
        reason.trim()
      );

      setIsSubmitting(false);
      onCorrectionComplete(updated);
      onClose();
    } catch (err) {
      console.error("Correction error:", err);
      setIsSubmitting(false);
      setErrorMessage("संशोधन सेव नहीं हो सका। कृपया दोबारा प्रयास करें।");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A1C1C] via-[#8C2323] to-[#7A1C1C] text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GauMataLogo className="w-7 h-7" />
            <div>
              <h3 className="text-lg font-bold font-serif">संशोधन अनुरोध (Correction Request)</h3>
              <p className="text-xs text-[#FDE68A]">रसीद #{entry.entryNumber} - मूल रिकॉर्ड सुरक्षित रहेगा</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Note */}
        <div className="bg-amber-50 p-3.5 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">डेटा सुरक्षा नियम (Data Safety):</span>
            <p className="text-amber-800 mt-0.5">
              मूल प्रविष्टि हटाई नहीं जाएगी। आपके द्वारा किया गया संशोधन और कारण ऑडिट लॉग (Audit Log) में स्थायी रूप से रिकॉर्ड किया जाएगा।
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded border border-red-200">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Devotee Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                दानदाता का नाम
              </label>
              <input
                type="text"
                value={devoteeName}
                onChange={(e) => setDevoteeName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-semibold"
                required
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                मोबाइल नंबर
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                पता / स्थान
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            {/* Shivling Count */}
            <div>
              <label className="block text-xs font-bold text-[#7A1C1C] uppercase mb-1">
                शिवलिंग संख्या
              </label>
              <input
                type="number"
                min="1"
                value={shivlingCount}
                onChange={(e) => setShivlingCount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-[#D4AF37] rounded-lg text-sm font-bold text-[#D84315]"
                required
              />
            </div>

            {/* Amount Per Shivling */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                प्रति शिवलिंग राशि (₹)
              </label>
              <input
                type="number"
                value={amountPerShivling}
                onChange={(e) => setAmountPerShivling(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold"
              />
            </div>

            {/* Payment Status */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                भुगतान स्थिति
              </label>
              <div className="flex items-center gap-2">
                {(["जमा", "बाकी", "आंशिक"] as PaymentStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPaymentStatus(st)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      paymentStatus === st
                        ? "bg-[#D84315] text-white border-[#D84315]"
                        : "bg-stone-50 text-stone-700 border-stone-300"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Amount Display */}
            <div className="sm:col-span-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-800">संशोधित कुल राशि:</span>
              <span className="font-extrabold text-emerald-900 text-lg">₹{totalAmount.toLocaleString('hi-IN')}</span>
            </div>

            {/* Reason for Correction (MANDATORY) */}
            <div className="sm:col-span-2 bg-[#FFF9F0] p-3 rounded-lg border border-[#D4AF37]/50">
              <label className="block text-xs font-bold text-[#7A1C1C] uppercase mb-1">
                संशोधन का कारण (Reason for Correction) *
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="उदा. नाम की वर्तनी में सुधार, राशि संशोधन या रसीद सुधार..."
                className="w-full px-3 py-2 border border-[#D4AF37] rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#D84315]"
                required
              />
            </div>

          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 text-stone-700 text-xs font-bold rounded-lg"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#D84315] hover:bg-[#BF360C] text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "संशोधित हो रहा है..." : "संशोधन सुरक्षित करें"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
