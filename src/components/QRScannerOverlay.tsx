import React, { useState, useEffect } from "react";
import { 
  X, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  CornerDownRight, 
  ShieldCheck, 
  HelpCircle,
  Building,
  Store,
  FileText,
  DollarSign,
  Scan,
  Zap,
  Info
} from "lucide-react";

interface QRScanTarget {
  id: string;
  merchantName: string;
  paymentType: "paybill" | "till";
  paybillNumber?: string;
  paybillAccount?: string;
  tillNumber?: string;
  amountKES: number;
  description: string;
}

interface QRScannerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: {
    paymentType: "paybill" | "till";
    paybillNumber: string;
    paybillAccount: string;
    tillNumber: string;
    amount: string;
    recipientName: string;
  }) => void;
}

const PRESET_BILLS: QRScanTarget[] = [
  {
    id: "kplc",
    merchantName: "Kenya Power & Lighting (KPLC)",
    paymentType: "paybill",
    paybillNumber: "222222",
    paybillAccount: "KPLC-88102",
    amountKES: 2500,
    description: "Postpaid electricity bill statement for June 2026",
  },
  {
    id: "naivas",
    merchantName: "Naivas Supermarket (Lavington)",
    paymentType: "till",
    tillNumber: "543210",
    amountKES: 1250,
    description: "Point-of-Sale check-out invoice receipt",
  },
  {
    id: "zuku",
    merchantName: "Zuku Fiber High-Speed Internet",
    paymentType: "paybill",
    paybillNumber: "333333",
    paybillAccount: "ZUKU-FIBER-88",
    amountKES: 4999,
    description: "Premium triple-play home broadband invoice",
  },
  {
    id: "saf_home",
    merchantName: "Safaricom Home Fibre",
    paymentType: "paybill",
    paybillNumber: "150150",
    paybillAccount: "SAF-HOME-991",
    amountKES: 2900,
    description: "High-speed residential internet package",
  },
];

// Stylized vector representation of a QR Code
const StylizedQR: React.FC<{ isDark?: boolean; active?: boolean }> = ({ isDark = false, active = false }) => (
  <div className={`w-14 h-14 border p-1 rounded-lg flex flex-col justify-between transition-all ${
    active 
      ? "bg-emerald-950 border-emerald-500 text-emerald-400 scale-105" 
      : isDark 
        ? "bg-slate-900 border-slate-700 text-slate-400" 
        : "bg-white border-gray-200 text-gray-700"
  }`}>
    <div className="flex justify-between">
      {/* Top Left Marker */}
      <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
      </div>
      {/* Top Right Marker */}
      <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
      </div>
    </div>
    
    {/* Micro QR Pixel Lines */}
    <div className="flex flex-col gap-0.5 my-1 px-0.5">
      <div className="flex gap-0.5">
        <div className="w-1 h-1 bg-current opacity-70"></div>
        <div className="w-1 h-1 bg-current opacity-40"></div>
        <div className="w-2 h-1 bg-current opacity-80"></div>
        <div className="w-1 h-1 bg-current opacity-30"></div>
      </div>
      <div className="flex gap-0.5 justify-between">
        <div className="w-1 h-1 bg-current opacity-20"></div>
        <div className="w-1.5 h-1 bg-current opacity-70"></div>
        <div className="w-1 h-1 bg-current opacity-60"></div>
      </div>
    </div>

    <div className="flex justify-between items-end">
      {/* Bottom Left Marker */}
      <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
      </div>
      {/* Decorative center grid */}
      <div className="w-3 h-3 bg-current opacity-90 rounded-xs"></div>
    </div>
  </div>
);

export const QRScannerOverlay: React.FC<QRScannerOverlayProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<QRScanTarget | null>(null);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "success">("idle");
  const [scanProgress, setScanProgress] = useState(0);

  // Clean up states when modal is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setSelectedTarget(null);
      setScanState("idle");
      setScanProgress(0);
    }
  }, [isOpen]);

  // Handle Scan Simulation progression
  useEffect(() => {
    let interval: any;
    if (scanState === "scanning") {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setScanState("success");
            return 100;
          }
          return prev + 10;
        });
      }, 120);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanState]);

  if (!isOpen) return null;

  const handleSelectTarget = (target: QRScanTarget) => {
    if (scanState === "scanning") return;
    setSelectedTarget(target);
    setScanProgress(0);
    setScanState("scanning");
  };

  const handleApply = () => {
    if (!selectedTarget) return;
    onScanSuccess({
      paymentType: selectedTarget.paymentType,
      paybillNumber: selectedTarget.paybillNumber || "",
      paybillAccount: selectedTarget.paybillAccount || "",
      tillNumber: selectedTarget.tillNumber || "",
      amount: selectedTarget.amountKES.toString(),
      recipientName: selectedTarget.merchantName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-white overflow-y-auto">
      {/* Keyframe styles for laser line and pulse effects */}
      <style>{`
        @keyframes scan-laser {
          0%, 100% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
        }
        .laser-line {
          animation: scan-laser 2.5s infinite linear;
        }
        @keyframes subtle-glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, -2px); }
          80% { transform: translate(1px, 2px); }
        }
        .cam-feed {
          background-image: radial-gradient(circle at center, rgba(16,185,129,0.05) 0%, rgba(15,23,42,0.95) 100%), 
                            repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px);
        }
      `}</style>

      {/* Header Container */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 pb-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
            <Scan className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-wide uppercase flex items-center gap-1.5">
              SwiftScan <span className="text-emerald-400 text-xs font-medium lowercase px-2 py-0.5 rounded-full bg-emerald-500/10">Lipa na M-Pesa QR</span>
            </h2>
            <p className="text-[11px] text-slate-400">Scan digital bill receipts or checkout codes to bypass form entry.</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center my-auto">
        
        {/* LEFT COLUMN: The Viewfinder & Scan Status */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          <div className="relative w-64 h-64 md:w-72 md:h-72 border border-slate-800 rounded-3xl p-3 bg-slate-900/40 shadow-2xl overflow-hidden flex items-center justify-center">
            
            {/* Viewfinder Cam Feed Backdrop */}
            <div className="absolute inset-0 cam-feed rounded-3xl" />

            {/* Scanning Corner Brackets */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>

            {/* Interactive Grid overlay */}
            <div className="absolute inset-4 border border-emerald-500/10 rounded-2xl flex flex-col justify-between p-4 pointer-events-none">
              <div className="flex justify-between text-[9px] text-emerald-500/30 font-mono">
                <span>[W-300px]</span>
                <span>[H-300px]</span>
              </div>
              <div className="flex justify-between text-[9px] text-emerald-500/30 font-mono">
                <span>ISO 800</span>
                <span>F/2.8</span>
              </div>
            </div>

            {/* Glowing Laser Scan Beam */}
            {scanState === "scanning" && (
              <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] laser-line pointer-events-none" />
            )}

            {/* Viewfinder Core UI based on state */}
            {scanState === "idle" && (
              <div className="relative z-10 flex flex-col items-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-slate-950/60 border border-slate-800 flex items-center justify-center mb-3">
                  <QrCode className="w-8 h-8 text-slate-400 animate-pulse" />
                </div>
                <span className="text-xs font-bold tracking-wide uppercase text-slate-300">Awaiting Invoice Scan</span>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
                  Click one of the mock digital bills on the right to simulate pointing your camera.
                </p>
              </div>
            )}

            {scanState === "scanning" && (
              <div className="relative z-10 flex flex-col items-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mb-3">
                  <span className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                </div>
                <span className="text-xs font-black tracking-widest uppercase text-emerald-400">Decoding QR Code</span>
                <span className="text-[10px] font-mono mt-1 text-slate-400">{scanProgress}% Captured</span>
              </div>
            )}

            {scanState === "success" && selectedTarget && (
              <div className="relative z-10 flex flex-col items-center text-center px-4 animate-scaleUp">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <span className="text-xs font-black tracking-widest uppercase text-emerald-400">Scan Complete</span>
                <p className="text-[11px] font-bold text-white mt-1.5 truncate max-w-[200px]">{selectedTarget.merchantName}</p>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded mt-1.5">
                  Ksh {selectedTarget.amountKES.toLocaleString()}
                </span>
              </div>
            )}

          </div>

          {/* Quick Stats banner */}
          <div className="mt-4 flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full text-[10px] text-slate-400 font-mono">
            <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Format: Safaricom Lipa-na-Mpesa Standard v2</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Target Selector & Decoded Bill View */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {scanState !== "success" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Select Mock Invoice to Scan
                </h3>
                <span className="text-[10px] text-slate-500">Click to run virtual camera alignment</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PRESET_BILLS.map((bill) => {
                  const isActive = selectedTarget?.id === bill.id;
                  return (
                    <button
                      key={bill.id}
                      type="button"
                      onClick={() => handleSelectTarget(bill)}
                      disabled={scanState === "scanning"}
                      className={`p-3.5 text-left rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3 bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700 ${
                        isActive ? "ring-2 ring-emerald-500 bg-slate-900 border-transparent shadow-lg" : ""
                      }`}
                    >
                      <div className="shrink-0">
                        <StylizedQR isDark active={isActive} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-white block truncate">{bill.merchantName}</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 ${
                            bill.paymentType === "paybill" 
                              ? "bg-blue-950 border border-blue-800/50 text-blue-400" 
                              : "bg-amber-950 border border-amber-800/50 text-amber-400"
                          }`}>
                            {bill.paymentType}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{bill.description}</p>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-2 font-mono">
                          <span>Amount:</span>
                          <span>Ksh {bill.amountKES.toLocaleString()}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl text-[10.5px] text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>What this simulates:</strong> Live web applications cannot easily query low-level Safaricom STK callbacks directly from client browsers. SwiftPay sovereign applet utilizes an interactive hardware-free QR capture loop to parse localized "Paybill" and "Till" invoice payloads, routing them instantly through the USDC cross-border settlement API.
                </span>
              </div>
            </div>
          ) : (
            selectedTarget && (
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-5 space-y-4 animate-fadeIn shadow-[0_10px_30px_rgba(16,185,129,0.04)]">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">Decoded Invoice Metadata</h3>
                    <p className="text-[10px] text-slate-400">Synthesizing payment routing instructions for STK Push.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">PAYMENT CHANNEL</span>
                    <div className="flex items-center gap-1.5">
                      {selectedTarget.paymentType === "paybill" ? (
                        <>
                          <Building className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-black text-white uppercase">Business Paybill</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-black text-white uppercase">Merchant Till</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">BILL AMOUNT</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-black text-emerald-400">Ksh {selectedTarget.amountKES.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                      {selectedTarget.paymentType === "paybill" ? "PAYBILL NUMBER" : "TILL NUMBER"}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-white">
                        {selectedTarget.paymentType === "paybill" ? selectedTarget.paybillNumber : selectedTarget.tillNumber}
                      </span>
                    </div>
                  </div>

                  {selectedTarget.paymentType === "paybill" && (
                    <div className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">ACCOUNT NUMBER</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-white">{selectedTarget.paybillAccount}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black text-slate-300 block uppercase">Sovereign Validation Verified</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      This bill resolves to a legitimate Safaricom mobile-payout cellular destination, securing correct funds routing.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScanState("idle");
                      setSelectedTarget(null);
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[10.5px] tracking-wider uppercase rounded-xl transition-all cursor-pointer border border-slate-700/60"
                  >
                    Rescan Invoice
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10.5px] tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Apply Bill Details ({selectedTarget.paymentType === "paybill" ? "Paybill" : "Till"})
                  </button>
                </div>
              </div>
            )
          )}

        </div>

      </div>
    </div>
  );
};
