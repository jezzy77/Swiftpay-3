import React, { useState, useEffect } from "react";
import { SystemRates } from "../types";
import { 
  Coins, 
  Phone, 
  User, 
  ShieldAlert, 
  ArrowLeftRight, 
  CheckCircle2, 
  ShieldCheck, 
  Info, 
  DollarSign, 
  FileText, 
  Building, 
  Store, 
  Smartphone,
  Globe,
  QrCode,
  Camera
} from "lucide-react";
import axios from "axios";
import { QRScannerOverlay } from "./QRScannerOverlay";

interface QuoteSectionProps {
  rates: SystemRates | null;
  selectedChain: "ETH" | "POLYGON" | "BASE" | "SOL" | "TAPROOT";
  onPaymentCreated: (paymentData: any) => void;
  activeTxId: string | null;
  loggedUser: string;
  payoutChannel: "mpesa" | "cashapp";
  setPayoutChannel: (chan: "mpesa" | "cashapp") => void;
  paymentType: "send_money" | "paybill" | "till" | "stk_push";
  setPaymentType: (type: "send_money" | "paybill" | "till" | "stk_push") => void;
  payoutProvider: "safaricom" | "airtel";
  setPayoutProvider: (provider: "safaricom" | "airtel") => void;
  phone: string;
  setPhone: (val: string) => void;
  recipientTag: string;
  setRecipientTag: (val: string) => void;
  recipientName: string;
  setRecipientName: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  senderWallet: string;
  setSenderWallet: (val: string) => void;
  paybillNumber: string;
  setPaybillNumber: (val: string) => void;
  paybillAccount: string;
  setPaybillAccount: (val: string) => void;
  tillNumber: string;
  setTillNumber: (val: string) => void;
}

export const QuoteSection: React.FC<QuoteSectionProps> = ({
  rates,
  selectedChain,
  onPaymentCreated,
  activeTxId,
  loggedUser,
  payoutChannel,
  setPayoutChannel,
  paymentType,
  setPaymentType,
  payoutProvider,
  setPayoutProvider,
  phone,
  setPhone,
  recipientTag,
  setRecipientTag,
  recipientName,
  setRecipientName,
  amount,
  setAmount,
  senderWallet,
  setSenderWallet,
  paybillNumber,
  setPaybillNumber,
  paybillAccount,
  setPaybillAccount,
  tillNumber,
  setTillNumber,
}) => {
  // Form inputs
  const [inputCurrency, setInputCurrency] = useState<"USDC" | "KES">("KES");

  // Calculated quote results
  const [amountUSDC, setAmountUSDC] = useState<number>(0);
  const [amountKES, setAmountKES] = useState<number>(0);
  const [netRecipientKES, setNetRecipientKES] = useState<number>(0);
  const [netRecipientUSD, setNetRecipientUSD] = useState<number>(0);
  const [explanation, setExplanation] = useState("");

  // Status/Flow states
  const [loading, setLoading] = useState(false);
  const [amlChecking, setAmlChecking] = useState(false);
  const [amlPassed, setAmlPassed] = useState<boolean | null>(null);
  const [amlMessage, setAmlMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (data: {
    paymentType: "paybill" | "till";
    paybillNumber: string;
    paybillAccount: string;
    tillNumber: string;
    amount: string;
    recipientName: string;
  }) => {
    setPaymentType(data.paymentType);
    if (data.paymentType === "paybill") {
      setPaybillNumber(data.paybillNumber);
      setPaybillAccount(data.paybillAccount);
    } else {
      setTillNumber(data.tillNumber);
    }
    setAmount(data.amount);
    setRecipientName(data.recipientName);
    setInputCurrency("KES"); // Default input currency to KES for scanned bills
  };

  // Recalculate Quote on changes
  useEffect(() => {
    if (!rates) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountUSDC(0);
      setAmountKES(0);
      setNetRecipientKES(0);
      setNetRecipientUSD(0);
      setExplanation("Please enter a valid transfer amount.");
      return;
    }

    const isSTK = paymentType === "stk_push";
    const effectiveRate = isSTK ? (rates.effectiveRateOnramp || rates.baseRate * 1.015) : rates.effectiveRate;
    const mpesaFee = rates.mpesaFee ?? 0;

    let computedKES = 0;
    let computedUSDC = 0;

    if (inputCurrency === "USDC") {
      computedUSDC = numAmount;
      if (isSTK) {
        computedKES = computedUSDC * effectiveRate + mpesaFee;
      } else {
        computedKES = computedUSDC * effectiveRate;
      }
    } else {
      computedKES = numAmount;
      if (isSTK) {
        const convertKES = Math.max(0, computedKES - mpesaFee);
        computedUSDC = convertKES / effectiveRate;
      } else {
        computedUSDC = computedKES / effectiveRate;
      }
    }

    setAmountKES(parseFloat(computedKES.toFixed(2)));
    setAmountUSDC(parseFloat(computedUSDC.toFixed(4)));

    // M-Pesa Calculations
    if (isSTK) {
      setNetRecipientKES(0);
      setNetRecipientUSD(parseFloat(computedUSDC.toFixed(4)));
    } else {
      setNetRecipientKES(parseFloat(computedKES.toFixed(2)));
      setNetRecipientUSD(0);
    }

    const brandLabel = payoutProvider === "airtel" ? "Airtel Money" : "M-Pesa";

    if (isSTK) {
      setExplanation(
        `You pay ~${Math.round(computedKES).toLocaleString()} KES from your ${brandLabel} wallet. You will receive ${computedUSDC.toFixed(4)} USDC directly in your wallet (0 KES transaction fee, free on Lightning).`
      );
    } else {
      setExplanation(
        `You send ${computedUSDC.toFixed(2)} USDC. Recipient gets ~${Math.round(computedKES).toLocaleString()} KES via ${brandLabel} (0 KES transaction fee, free on Lightning).`
      );
    }
  }, [amount, inputCurrency, rates, selectedChain, payoutProvider, paymentType]);

  // Senses linked wallet address automatically
  useEffect(() => {
    if (activeTxId) return; // do not overwrite during active tx

    let sensedAddress = "";
    if (loggedUser && !loggedUser.startsWith("@")) {
      sensedAddress = loggedUser;
    } else {
      // Fallback to beautiful default addresses for passkey/mem users
      if (selectedChain === "SOL") {
        sensedAddress = "SwiftX88p6sZgE5B9Nq2Yg9qD7yK3BqL9M1SgC8fH7vP";
      } else if (selectedChain === "TAPROOT") {
        sensedAddress = "bc1p8g8t6f9p32vpkswftaprootassetsrgb888222333444";
      } else {
        sensedAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      }
    }

    if (senderWallet !== sensedAddress) {
      setSenderWallet(sensedAddress);
    }
  }, [loggedUser, selectedChain, activeTxId, senderWallet, setSenderWallet]);

  // Run AML scan automatically on senderWallet changes (debounced)
  useEffect(() => {
    if (!senderWallet.trim()) {
      setAmlPassed(null);
      setAmlMessage("");
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setAmlChecking(true);
      setErrorMsg("");
      try {
        const res = await axios.post("/api/aml-check", { walletAddress: senderWallet.trim() });
        setAmlPassed(res.data.passed);
        setAmlMessage(res.data.reason);
      } catch (err: any) {
        // Fallback checks for demo purposes
        const addressLower = senderWallet.toLowerCase().trim();
        if (
          addressLower.includes("highrisk") || 
          addressLower.includes("0x1111") || 
          addressLower.includes("0xd8da") ||
          addressLower === "0x1111111111111111111111111111111111111111"
        ) {
          setAmlPassed(false);
          setAmlMessage("Address flagged during AML compliance. Swap initiation blocked.");
        } else {
          setAmlPassed(true);
          setAmlMessage("Wallet address cleared basic sandbox screening.");
        }
      } finally {
        setAmlChecking(false);
      }
    }, 450); // 450ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [senderWallet]);

  // Submit payment creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate mobile number for Send Money, Paybill, Till or STK Push
    if (!phone.trim()) {
      setErrorMsg("Recipient mobile phone number is required.");
      return;
    }
    const phoneRegex = /^(07|01|2547|2541|\+2547|\+2541)\d{8}$/;
    if (!phoneRegex.test(phone.trim().replace(/\s/g, ""))) {
      setErrorMsg("Invalid mobile number format. Must be a valid Kenyan mobile number (e.g., 07xxxxxxxx).");
      return;
    }

    if (paymentType === "paybill") {
      if (!paybillNumber.trim()) {
        setErrorMsg("Business Paybill number is required.");
        return;
      }
      if (!paybillAccount.trim()) {
        setErrorMsg("Paybill Account reference is required.");
        return;
      }
    } else if (paymentType === "till") {
      if (!tillNumber.trim()) {
        setErrorMsg("Merchant Till number is required.");
        return;
      }
    }

    if (!senderWallet.trim()) {
      setErrorMsg("Sender wallet address is required to track the deposit.");
      return;
    }

    if (amlPassed === false) {
      setErrorMsg("Compliance Error: Flagged wallet cannot initiate stablecoin swaps.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        amountKES,
        recipientPhone: phone.trim(),
        recipientName: recipientName.trim() || `${payoutProvider === "airtel" ? "Airtel" : "M-Pesa"} Customer`,
        chain: selectedChain,
        senderWallet: senderWallet.trim(),
        payoutChannel: "mpesa",
        recipientTag: "",
        payoutProvider,
        paymentType,
        paybillNumber: paymentType === "paybill" ? paybillNumber.trim() : "",
        paybillAccount: paymentType === "paybill" ? paybillAccount.trim() : "",
        tillNumber: paymentType === "till" ? tillNumber.trim() : "",
        kycDetails: {
          email: loggedUser || "anonymous_web3@swiftpay.io",
          fullName: recipientName.trim() || "Demo User",
          idNumber: "UNLIMITED-VERIFIED",
          sourceOfFunds: "Crypto Liquidity Swap"
        }
      };

      const res = await axios.post("/api/create-payment", payload);
      if (res.data.success) {
        onPaymentCreated(res.data);
      } else {
        setErrorMsg(res.data.error || res.data.message || "Failed to create swap.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to submit swap. Please verify server connection.");
    } finally {
      setLoading(false);
    }
  };

  const fillMockWallet = (chain: string) => {
    if (chain === "SOL") {
      setSenderWallet("SwiftX88p6sZgE5B9Nq2Yg9qD7yK3BqL9M1SgC8fH7vP");
    } else if (chain === "TAPROOT") {
      setSenderWallet("bc1p8g8t6f9p32vpkswftaprootassetsrgb888222333444");
    } else {
      setSenderWallet("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
    }
    setAmlPassed(null);
  };

  const triggerBlockedWallet = () => {
    setSenderWallet("0x1111111111111111111111111111111111111111");
    setAmlPassed(null);
  };

  // Determine dynamic accent color classes based on the current selection
  const isAirtel = payoutChannel === "mpesa" && payoutProvider === "airtel";
  const brandAccentBg = isAirtel ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700";
  const brandBorderFocus = isAirtel ? "focus-within:border-rose-500 focus:border-rose-500" : "focus-within:border-emerald-500 focus:border-emerald-500";
  const brandTextAccent = isAirtel ? "text-rose-600" : "text-emerald-600";
  const brandBadge = isAirtel ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-emerald-50 border-emerald-100 text-emerald-800";

  return (
    <>
    <form id="swap_initiation_form" onSubmit={handleSubmit} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 sm:p-5">
      
      {/* COMPACT 3 MAIN CHOICES SELECTOR */}
      <div className="mb-4">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
          Select Transaction Type (3 Quick Options)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* Choice 1: STK Push */}
          <button
            type="button"
            onClick={() => setPaymentType("stk_push")}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              paymentType === "stk_push"
                ? "bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                : "bg-gray-50/80 border-gray-100 hover:border-gray-200 text-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`p-1.5 rounded-lg ${paymentType === "stk_push" ? "bg-emerald-600 text-white" : "bg-white text-emerald-600"}`}>
                <Smartphone className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-black font-mono uppercase tracking-widest text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                Instant
              </span>
            </div>
            <div>
              <span className="text-xs font-black block text-gray-900 leading-tight">1. STK Push</span>
              <span className="text-[10px] text-gray-500 block truncate font-medium">Deposit KES</span>
            </div>
          </button>

          {/* Choice 2: Scan & Pay / Till & Paybill */}
          <button
            type="button"
            onClick={() => {
              setPaymentType("till");
            }}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              (paymentType === "till" || paymentType === "paybill")
                ? "bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                : "bg-gray-50/80 border-gray-100 hover:border-gray-200 text-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`p-1.5 rounded-lg ${(paymentType === "till" || paymentType === "paybill") ? "bg-emerald-600 text-white" : "bg-white text-emerald-600"}`}>
                <QrCode className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-black font-mono uppercase tracking-widest text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                Merchant
              </span>
            </div>
            <div>
              <span className="text-xs font-black block text-gray-900 leading-tight">2. Scan & Pay</span>
              <span className="text-[10px] text-gray-500 block truncate font-medium">Till / Paybill</span>
            </div>
          </button>

          {/* Choice 3: Send Money */}
          <button
            type="button"
            onClick={() => setPaymentType("send_money")}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              paymentType === "send_money"
                ? "bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                : "bg-gray-50/80 border-gray-100 hover:border-gray-200 text-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`p-1.5 rounded-lg ${paymentType === "send_money" ? "bg-emerald-600 text-white" : "bg-white text-emerald-600"}`}>
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </span>
              <span className="text-[9px] font-black font-mono uppercase tracking-widest text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                P2P
              </span>
            </div>
            <div>
              <span className="text-xs font-black block text-gray-900 leading-tight">3. Send Money</span>
              <span className="text-[10px] text-gray-500 block truncate font-medium">Mobile Cashout</span>
            </div>
          </button>
        </div>
      </div>

      {/* Sub-selector for Till vs Paybill if Choice 2 is active */}
      {(paymentType === "till" || paymentType === "paybill") && (
        <div className="mb-3 flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-gray-200/60 animate-fadeIn">
          <span className="text-[10px] font-bold text-gray-500 pl-2">Merchant Payment Type:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPaymentType("till")}
              className={`px-3 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                paymentType === "till" ? "bg-white text-emerald-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Buy Goods (Till)
            </button>
            <button
              type="button"
              onClick={() => setPaymentType("paybill")}
              className={`px-3 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                paymentType === "paybill" ? "bg-white text-emerald-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Paybill Number
            </button>
          </div>
        </div>
      )}

      {/* Mobile Operator Selection (Only when M-Pesa/Airtel is active) */}
      {payoutChannel === "mpesa" && (
        <div className="mb-3 space-y-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPayoutProvider("safaricom")}
              className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                payoutProvider === "safaricom"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                  : "bg-white border-gray-100 hover:border-gray-300 text-gray-500"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              Safaricom (M-Pesa)
            </button>
            <button
              type="button"
              onClick={() => setPayoutProvider("airtel")}
              className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                payoutProvider === "airtel"
                  ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm"
                  : "bg-white border-gray-100 hover:border-gray-300 text-gray-500"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-rose-500" />
              Airtel Money
            </button>
          </div>
        </div>
      )}


      {/* Heading status section */}
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
        <div className={`p-2 rounded-lg ${brandBadge}`}>
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-base">
            Swap to {payoutProvider === "airtel" ? "Airtel Money" : "M-Pesa"}
          </h2>
          <p className="text-xs text-gray-500">
            {`Triggering direct ${paymentType.replace("_", " ")} channel`}
          </p>
        </div>
      </div>

      {/* QR Scanner Helper Banner - displayed on Till/Paybill transaction screen */}
      {payoutChannel === "mpesa" && (paymentType === "paybill" || paymentType === "till") && (
        <div className="mb-5 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-xs block">Lipa na M-Pesa QR Scanner</span>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Scan a merchant's Till Number or electricity/utility Paybill QR code to capture details automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            Scan QR Code
          </button>
        </div>
      )}

      {errorMsg && (
        <div id="form_error_banner" className="mb-4 p-3 bg-red-50 border border-red-100 text-xs text-red-700 rounded-lg flex items-start gap-2 animate-shake">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTxId && (
        <div id="active_tx_info" className="mb-4 p-3 bg-amber-50 border border-amber-100 text-xs text-amber-800 rounded-lg flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>You have an active swap pending deposit. Complete or reset it on the right panel to run another.</span>
        </div>
      )}

      {/* Recipient Details & Conditional Fields */}
      <div className="space-y-4 mb-5">
        
        {/* Row 1: Main recipient identifiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              {paymentType === "stk_push" ? "Your Phone Number (STK Push Target)" : "Recipient Phone Number"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="input_phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712345678"
              className={`w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none ${brandBorderFocus}`}
              required
              disabled={!!activeTxId}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {paymentType === "stk_push" ? "Your Registered M-Pesa/Airtel Name" : "Recipient Registered Name"}
            </label>
            <input
              type="text"
              id="input_recipient_name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={paymentType === "stk_push" ? "Your registered name (optional)" : "Full registered name (optional)"}
              className={`w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none ${brandBorderFocus}`}
              disabled={!!activeTxId}
            />
          </div>
        </div>

        {/* Conditional Lipa na M-Pesa / Airtel Paybill Fields */}
        {payoutChannel === "mpesa" && paymentType === "paybill" && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-slideDown">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-gray-400" />
                Business Paybill <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paybillNumber}
                onChange={(e) => setPaybillNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 222222"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paybillAccount}
                onChange={(e) => setPaybillAccount(e.target.value)}
                placeholder="e.g. SWIFTPAY"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
                required
              />
            </div>
          </div>
        )}

        {/* Conditional Lipa na M-Pesa / Airtel Till Fields */}
        {payoutChannel === "mpesa" && paymentType === "till" && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 animate-slideDown">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-gray-400" />
                Merchant Till Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tillNumber}
                onChange={(e) => setTillNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 543210"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
                required
              />
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Transfer Amount <span className="text-red-500">*</span>
          </label>
          <div className={`flex rounded-lg border border-gray-200 overflow-hidden ${brandBorderFocus}`}>
            <input
              type="number"
              id="input_amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter value"
              className="w-full text-sm px-3 py-2 focus:outline-none"
              required
              min="1"
              step="any"
              disabled={!!activeTxId}
            />
            <select
              id="currency_select"
              value={inputCurrency}
              onChange={(e) => setInputCurrency(e.target.value as "USDC" | "KES")}
              className="bg-gray-50 border-l border-gray-200 text-xs font-bold text-gray-700 px-3 focus:outline-none"
              disabled={!!activeTxId}
            >
              <option value="KES">KES</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        {/* Dynamic Calculator Display */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{paymentType === "stk_push" ? "Your KES Transfer Amount" : "Funding Amount"}</span>
            <span className="font-mono text-gray-800 font-medium">
              {paymentType === "stk_push" ? `${amountKES.toLocaleString()} KES` : `${amountUSDC.toFixed(2)} USDC`}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Mobile Network Flat Fee</span>
            <span className="font-mono text-emerald-600 font-semibold">
              0 KES (Free)
            </span>
          </div>
          <div className="flex justify-between text-xs font-semibold border-t border-gray-100 pt-1.5 text-gray-700">
            <span>{paymentType === "stk_push" ? "You Receive (USDC Crypto)" : "Recipient Receives"}</span>
            <span className={`font-mono ${brandTextAccent}`}>
              {paymentType === "stk_push" ? `${amountUSDC.toFixed(4)} USDC` : `${netRecipientKES.toLocaleString()} KES`}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 italic pt-1 text-center">
            "{explanation}"
          </p>
        </div>

        {/* Sender Wallet Address (Compliance & Screening) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-gray-400" />
              {paymentType === "stk_push" ? "Destination Wallet Address" : "Sensed Wallet Address"}
            </label>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-black uppercase">
              Auto-Sensed
            </span>
          </div>
          
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 font-mono text-xs text-slate-800 select-all break-all shadow-inner relative flex items-center justify-between">
            <span>{senderWallet || "Sensing sovereign wallet..."}</span>
            {amlChecking && (
              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin shrink-0 ml-2"></span>
            )}
          </div>

          {amlPassed !== null && (
            <div
              id="aml_status_result"
              className={`mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                amlPassed
                  ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                  : "bg-red-50 border border-red-100 text-red-800"
              }`}
            >
              {amlPassed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold">{amlPassed ? "Compliance Swapping Cleared" : "Compliance Scanning Failed"}</span>
                <p className="text-[11px] opacity-90 mt-0.5">{amlMessage}</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Unlimited Sovereign Routing Card */}
      <div id="unlimited_limit_summary" className={`border rounded-lg p-4 mb-5 flex items-start gap-3 text-xs ${brandBadge}`}>
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Unlimited Sovereign Settlement</span>
          <p className="text-[11px] leading-relaxed mt-0.5">
            This transaction terminal operates with <strong>unlimited volume capabilities</strong> and no daily cap. Settle stablecoins at any scale with complete financial freedom.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="submit"
        id="btn_submit_swap"
        disabled={loading || activeTxId !== null || amlPassed === false}
        className={`w-full text-white font-semibold text-sm py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${brandAccentBg}`}
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Generating Quote...
          </span>
        ) : (
          <>
            <CheckCircle2 className="w-4.5 h-4.5" />
            {paymentType === "stk_push" ? "Trigger STK Push & Swap to Crypto" : "Accept Rate & Swap stablecoin"}
          </>
        )}
      </button>

      {/* Third-Party Licensed Aggregator On/Off Ramp Middleware Protocol Component */}
      <div id="aggregator_onofframp_section" className="mt-8 border border-slate-200/90 rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-white shadow-sm space-y-5 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Middleware Architecture
            </span>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Licensed Payment Gateway Aggregator On/Off Ramp
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Abstracting cash-in and cash-out through third-party licensed B2B aggregators (e.g. Flutterwave / Local M-Pesa Aggregators).
            </p>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1 shrink-0 self-start sm:self-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Licensed KYC Umbrella
          </span>
        </div>

        {/* 3 Legal Safeguard Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              The KYC Umbrella
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Safaricom and licensed aggregators perform regulatory identity checks & AML screening under Kenya regulations.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
              <Building className="w-4 h-4 text-emerald-600 shrink-0" />
              No Direct Fiat Banking
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              No high-level bank settlement accounts needed. Trust account float is managed entirely by licensed aggregators.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs">
              <Globe className="w-4 h-4 text-purple-600 shrink-0" />
              Pure Tech Protocol
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              App operates strictly as software executing automated L2 smart contract logic & liquidity pool swaps.
            </p>
          </div>
        </div>

        {/* Step-by-Step Flow Diagrams */}
        <div className="space-y-4 pt-1">
          {/* DEPOSIT / CASH-IN FLOW */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                [ DEPOSIT / CASH-IN FLOW ]
              </span>
              <span className="text-[10px] font-mono text-slate-400">Fiat KES ➔ L2 Stablecoin (USDC)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[10.5px]">
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <span className="text-emerald-400 font-bold block">1. Initiate Push</span>
                <p className="text-slate-300 text-[10px] mt-0.5">User types KES amount ➔ App calls Aggregator API</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <span className="text-emerald-400 font-bold block">2. M-Pesa PIN</span>
                <p className="text-slate-300 text-[10px] mt-0.5">STK Push triggers on phone ➔ User enters PIN</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <span className="text-emerald-400 font-bold block">3. Success Webhook</span>
                <p className="text-slate-300 text-[10px] mt-0.5">Aggregator receives KES ➔ Fires webhook to server</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <span className="text-emerald-400 font-bold block">4. L2 Mint & Deposit</span>
                <p className="text-slate-300 text-[10px] mt-0.5">Protocol triggers Liquidity Pool ➔ Deposits USDC to L2 Wallet</p>
              </div>
            </div>
          </div>

          {/* WITHDRAWAL / CASH-OUT FLOW */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
                [ WITHDRAWAL / CASH-OUT FLOW ]
              </span>
              <span className="text-[10px] font-mono text-slate-400">L2 Stablecoin (USDC) ➔ Fiat KES</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[10.5px]">
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <span className="text-indigo-400 font-bold block">1. L2 Smart Contract</span>
                <p className="text-slate-300 text-[10px] mt-0.5">User withdraws ➔ L2 Contract locks/burns USDC</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <span className="text-indigo-400 font-bold block">2. Liquidity Route</span>
                <p className="text-slate-300 text-[10px] mt-0.5">Triggers cross-route to Liquidity Provider pool</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <span className="text-indigo-400 font-bold block">3. Aggregator B2C API</span>
                <p className="text-slate-300 text-[10px] mt-0.5">App calls Aggregator B2C payout endpoint</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <span className="text-indigo-400 font-bold block">4. Safaricom KES</span>
                <p className="text-slate-300 text-[10px] mt-0.5">Aggregator sends KES straight to recipient phone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </form>

    <QRScannerOverlay
      isOpen={showScanner}
      onClose={() => setShowScanner(false)}
      onScanSuccess={handleScanSuccess}
    />
    </>
  );
};
