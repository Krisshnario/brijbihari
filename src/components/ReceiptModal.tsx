"use client";

import React from "react";
import { DonationEntry } from "@/types";
import { GauMataLogo } from "./icons/GauMataLogo";
import { ShivlingIcon } from "./icons/ShivlingIcon";
import { X, Printer } from "lucide-react";

interface Props {
  entry: DonationEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ entry, isOpen, onClose }) => {
  if (!isOpen || !entry) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-auto print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Action Header (Hidden in Print) */}
        <div className="bg-[#7A1C1C] text-white p-3 px-5 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-[#FDE68A]">दान रसीद का पूर्वावलोकन (Receipt Voucher)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#D84315] hover:bg-[#BF360C] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट करें (Print Receipt)</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER CONTAINER */}
        <div className="p-6 sm:p-8 space-y-6 bg-[#FAF7F2] relative border-4 border-double border-[#D4AF37]/60 m-2 rounded-xl">
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-2 left-2 text-[#D4AF37] font-serif text-xs">❖</div>
          <div className="absolute top-2 right-2 text-[#D4AF37] font-serif text-xs">❖</div>
          <div className="absolute bottom-2 left-2 text-[#D4AF37] font-serif text-xs">❖</div>
          <div className="absolute bottom-2 right-2 text-[#D4AF37] font-serif text-xs">❖</div>

          {/* Temple Receipt Header */}
          <div className="text-center space-y-2 border-b-2 border-[#D4AF37]/50 pb-4">
            <div className="flex justify-center mb-1">
              <div className="p-1.5 bg-white rounded-full border-2 border-[#D4AF37]">
                <GauMataLogo className="w-14 h-14" />
              </div>
            </div>

            <div className="text-xs font-bold uppercase tracking-widest text-[#D84315]">
              ॥ श्री गोपालाच्युताभ्यां नमः ॥
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#7A1C1C] font-serif">
              बृजविहारी गौ तीर्थ धाम
            </h1>
            <p className="text-xs text-stone-600 font-semibold">
              51,000 शिवलिंग निर्माण महायज्ञ संकल्प | दान रसीद
            </p>
            
            <div className="inline-block bg-[#7A1C1C] text-[#FFF9F0] text-xs font-mono font-bold px-3 py-1 rounded-full border border-[#D4AF37] mt-1">
              रसीद संख्या (Receipt No): {entry.entryNumber}
            </div>
          </div>

          {/* Receipt Body Matrix */}
          <div className="space-y-3 text-sm">
            
            <div className="flex justify-between border-b border-stone-300 pb-2">
              <span className="text-stone-600 font-medium">दानदाता का नाम:</span>
              <span className="font-bold text-stone-900 text-base">{entry.devoteeName}</span>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-2">
              <span className="text-stone-600 font-medium">संपर्क (मोबाइल):</span>
              <span className="font-mono font-bold text-stone-800">{entry.mobile || "दर्ज नहीं"}</span>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-2">
              <span className="text-stone-600 font-medium">पता / स्थान:</span>
              <span className="font-semibold text-stone-800">{entry.address || "दर्ज नहीं"}</span>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-2">
              <span className="text-stone-600 font-medium">समर्पित शिवलिंग संख्या:</span>
              <span className="font-bold text-[#D84315] text-base flex items-center gap-1">
                <ShivlingIcon className="w-4 h-4 text-[#D84315]" />
                <span>{entry.shivlingCount} शिवलिंग</span>
              </span>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-2">
              <span className="text-stone-600 font-medium">प्रति शिवलिंग दान दर:</span>
              <span className="font-mono text-stone-800">₹{entry.amountPerShivling?.toLocaleString('hi-IN')}</span>
            </div>

            {/* Total Highlight */}
            <div className="bg-[#FFF9F0] p-3 rounded-lg border-2 border-[#D4AF37] flex justify-between items-center my-3">
              <div>
                <span className="text-xs font-bold uppercase text-[#7A1C1C]">कुल दान राशि:</span>
                <div className="text-[11px] text-stone-500 font-semibold">भुगतान स्थिति: {entry.paymentStatus}</div>
              </div>
              <div className="text-2xl font-extrabold text-[#7A1C1C] font-serif">
                ₹{entry.totalAmount?.toLocaleString('hi-IN')}
              </div>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-2">
              <span className="text-stone-600 font-medium">दान तिथि:</span>
              <span className="font-semibold text-stone-800">{entry.donationDate}</span>
            </div>

            {entry.notes && (
              <div className="text-xs text-stone-600">
                <span className="font-bold">विशेष टिप्पणी:</span> {entry.notes}
              </div>
            )}
          </div>

          {/* Footer Seals & Blessings */}
          <div className="pt-6 border-t-2 border-[#D4AF37]/50 flex justify-between items-end text-xs text-stone-600">
            <div className="space-y-1">
              <p className="font-serif italic text-stone-700">"भगवान शिव एवं गौ माता आपका कल्याण करें।"</p>
              <p className="text-[10px] text-stone-400">जारीकर्ता: बृजविहारी गौ तीर्थ धाम प्रबंधन</p>
            </div>

            <div className="text-center space-y-8">
              <div className="border-b border-dashed border-stone-400 w-32"></div>
              <div className="font-bold text-stone-800">अधिकृत हस्ताक्षर / मुद्रा</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
