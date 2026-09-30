"use client";

import React, { useState } from "react";
import { AshramDaanEntry } from "@/types";
import { GauMataLogo } from "./icons/GauMataLogo";
import { X, Printer, Share2, Check } from "lucide-react";

interface Props {
  entry: AshramDaanEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

// Convert amount to Hindi words
function numberToHindiWords(num: number): string {
  if (!num || isNaN(num)) return "";
  
  const ones = ["", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ", "दस",
    "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस",
    "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस", "तीस",
    "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस", "चालीस",
    "इकतालीस", "बयालीस", "तैंतालीस", "चवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास", "पचास",
    "इक्यावन", "बावन", "तिरेपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ", "साठ",
    "इकसठ", "बासठ", "तिरेसठ", "चौंसठ", "पैंसठ", "छियासठ", "सरसठ", "अड़सठ", "उनहत्तर", "सत्तर",
    "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उन्नासी", "अस्सी",
    "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी", "नब्बे",
    "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पंचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे"
  ];

  if (num === 100000) return "एक लाख रुपये मात्र";
  if (num > 100000) {
    const lakh = Math.floor(num / 100000);
    const rem = num % 100000;
    return `${ones[lakh] || lakh} लाख ${numberToHindiWords(rem)}`;
  }
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    const thStr = ones[thousands] || thousands.toString();
    const remStr = remainder > 0 ? ` ${numberToHindiWords(remainder)}` : " रुपये मात्र";
    return `${thStr} हजार${remStr.replace(" रुपये मात्र", "")} रुपये मात्र`;
  }
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const hStr = ones[hundreds] || hundreds.toString();
    const remStr = remainder > 0 ? ` ${ones[remainder]}` : "";
    return `${hStr} सौ${remStr} रुपये मात्र`;
  }
  return `${ones[num] || num} रुपये मात्र`;
}

export const AshramReceiptModal: React.FC<Props> = ({ entry, isOpen, onClose }) => {
  const [copiedToast, setCopiedToast] = useState(false);

  if (!isOpen || !entry) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `🚩 *बृजविहारी गौ तीर्थ धाम - आश्रम दान रसीद* 🚩\n\n` +
      `आदरणीय *${entry.donorName}* जी,\n` +
      `बृजविहारी गौ तीर्थ धाम में आपके द्वारा समर्पित दान राशि सप्रेम प्राप्त हुई। पूज्य गुरुजी एवं धाम परिवार की ओर से आपका कोटिशः धन्यवाद एवं हार्दिक साधुवाद।\n\n` +
      `🧾 *रसीद क्र.:* ${entry.receiptNumber}\n` +
      `📅 *दिनांक:* ${entry.daanDate}\n` +
      `💰 *दान राशि:* ₹${entry.amount.toLocaleString('en-IN')} (${numberToHindiWords(entry.amount)})\n` +
      `🌺 *सेवा प्रयोजन:* ${entry.purpose}\n` +
      `💳 *भुगतान माध्यम:* ${entry.paymentMode} (${entry.paymentStatus})\n` +
      (entry.transactionId ? `🔢 *संदर्भ क्र.:* ${entry.transactionId}\n` : "") +
      (entry.notes ? `📝 *संकल्प:* ${entry.notes}\n` : "") +
      `\n॥ गौमाता आपका एवं आपके परिवार का सदैव कल्याण करें ॥\n` +
      `जय श्री कृष्णा • जय गौ माता`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }

    const encoded = encodeURIComponent(text);
    const targetUrl = entry.mobile
      ? `https://api.whatsapp.com/send?phone=91${entry.mobile.replace(/\D/g, "")}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(targetUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden my-auto print:border-none print:shadow-none print:w-full print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action Header - Hidden during Print */}
        <div className="bg-[#7A1C1C] text-white p-3 px-5 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-[#FDE68A]">आश्रम दान रसीद (Donation Receipt Voucher)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedToast ? "कॉपी हो गया!" : "व्हाट्सएप शेयर"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#D84315] hover:bg-[#BF360C] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट करें (Print)</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER CONTAINER */}
        <div className="p-6 sm:p-8 space-y-5 bg-[#FAF7F2] relative border-4 border-double border-[#D4AF37]/60 m-2 rounded-xl">
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-2 left-2 text-[#D4AF37] font-serif text-xs">❖</div>
          <div className="absolute top-2 right-2 text-[#D4AF37] font-serif text-xs">❖</div>
          <div className="absolute bottom-2 left-2 text-[#D4AF37] font-serif text-xs">❖</div>
          <div className="absolute bottom-2 right-2 text-[#D4AF37] font-serif text-xs">❖</div>

          {/* Temple Receipt Header */}
          <div className="text-center space-y-1.5 border-b-2 border-[#D4AF37]/50 pb-3">
            <div className="flex justify-center mb-1">
              <div className="p-1 bg-white rounded-full border-2 border-[#D4AF37]">
                <GauMataLogo className="w-12 h-12" />
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-widest text-[#D84315]">
              ॥ श्री सुरभ्यै नमः ॥ श्री गोपालाच्युताभ्यां नमः ॥
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#7A1C1C]">
              बृजविहारी गौ तीर्थ धाम
            </h1>
            <p className="text-xs text-stone-600 font-semibold">
              गौ सेवा • अन्नक्षेत्र • आश्रम निर्माण • संत सेवा अधिकृत दान रसीद
            </p>
            
            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="bg-[#7A1C1C] text-[#FFF9F0] text-xs font-mono font-bold px-3 py-0.5 rounded-full border border-[#D4AF37]">
                रसीद सं. : {entry.receiptNumber}
              </span>
              <span className="bg-white text-stone-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-stone-300 number-clean">
                दिनांक: {entry.daanDate}
              </span>
            </div>
          </div>

          {/* Receipt Body Matrix */}
          <div className="space-y-2.5 text-xs sm:text-sm">
            
            <div className="flex justify-between border-b border-stone-300 pb-1.5">
              <span className="text-stone-600 font-medium">दानदाता का नाम:</span>
              <span className="font-bold text-stone-900 text-base">{entry.donorName}</span>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-1.5">
              <span className="text-stone-600 font-medium">संपर्क (मोबाइल):</span>
              <span className="font-mono font-bold text-stone-800 number-clean">{entry.mobile || "दर्ज नहीं"}</span>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-1.5">
              <span className="text-stone-600 font-medium">पता / नगर:</span>
              <span className="font-semibold text-stone-800">
                {entry.address ? `${entry.address}, ` : ""}{entry.city || "दर्ज नहीं"}
              </span>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-1.5">
              <span className="text-stone-600 font-medium">दान का प्रयोजन / सेवा:</span>
              <span className="font-bold text-[#7A1C1C] text-sm bg-[#FFF9F0] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                {entry.purpose}
              </span>
            </div>

            <div className="flex justify-between border-b border-stone-300 pb-1.5">
              <span className="text-stone-600 font-medium">भुगतान माध्यम व स्थिति:</span>
              <span className="font-semibold text-stone-800">
                {entry.paymentMode} ({entry.paymentStatus})
                {entry.transactionId ? ` • सं: ${entry.transactionId}` : ""}
              </span>
            </div>

            {entry.notes && (
              <div className="flex justify-between border-b border-stone-300 pb-1.5">
                <span className="text-stone-600 font-medium">विशेष संकल्प / टिप्पणी:</span>
                <span className="font-medium text-stone-800 text-right max-w-[65%]">{entry.notes}</span>
              </div>
            )}

            {/* Total Amount Box */}
            <div className="bg-[#FFF9F0] p-3.5 rounded-xl border-2 border-[#D4AF37] flex items-center justify-between mt-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#7A1C1C] block">प्राप्त कुल दान राशि</span>
                <span className="text-xs text-stone-700 italic">
                  ({numberToHindiWords(entry.amount)})
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#D84315] font-mono number-clean">
                ₹{entry.amount?.toLocaleString('en-IN')}
              </div>
            </div>

          </div>

          {/* Shloka Blessing */}
          <div className="text-center pt-2 text-[11px] text-stone-600 border-t border-stone-300/80">
            <p className="font-serif italic text-[#7A1C1C]">
              ॥ धेनुं ये पालयन्तीह सत्कारैश्च दिने दिने । तेषां गृहे सदा लक्ष्मीः स्थिरा भवति सर्वदा ॥
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              गौ माता एवं भगवान श्री कृष्ण की कृपा आप और आपके सम्पूर्ण परिवार पर सदैव बनी रहे।
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="flex justify-between items-end pt-4 text-xs text-stone-600">
            <div>
              <div className="text-stone-400 font-mono text-[10px]">
                प्रविष्टि: {new Date(entry.createdAt).toLocaleDateString("hi-IN")}
              </div>
              <div className="text-stone-700 font-semibold text-[11px]">
                अधिकृत कार्यालय: बृजविहारी गौ तीर्थ धाम
              </div>
            </div>
            
            <div className="text-center">
              <div className="h-8 border-b border-stone-400 w-28 mx-auto mb-1"></div>
              <span className="font-bold text-stone-800 text-[11px]">हस्ताक्षर / व्यवस्थापक</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
