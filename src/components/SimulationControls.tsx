import React, { useState, useEffect } from "react";
import { Transaction } from "../types";
import { 
  Play, 
  Smartphone, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Loader2,
  QrCode,
  Sparkles,
  ExternalLink,
  Building
} from "lucide-react";
import axios from "axios";

interface SimulationControlsProps {
  activeTx: Transaction | null;
  onRefreshActiveTx: () => void;
  onClearActiveTx: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  activeTx,
  onRefreshActiveTx,
  onClearActiveTx,
}) => {
  const [loading, setLoading] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [phoneNotifShow, setPhoneNotifShow] = useState(false);
  const [autoSimulate, setAutoSimulate] = useState(() => {
    const saved = localStorage.getItem("auto_simulate");
    return saved === null ? true : saved === "true";
  });

  if (!activeTx) {
    return (
      <div id="simulation_no_tx" className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center text-gray-500">
        <Sparkles className="w-8 h-8 mx-auto text-emerald-500/60 mb-3 animate-pulse" />
        <h4 className="font-semibold text-gray-800 text-sm mb-1">Interactive Conversion Sandbox</h4>
        <p className="text-xs max-w-sm mx-auto">
          No active swap. Initiate a new transaction on the left to activate the real-time blockchain and Safaricom M-Pesa simulator console!
        </p>
      </div>
    );
  }

  // Determine current timeline status
  const currentStep = () => {
    if (activeTx.paymentType === "stk_push") {
      switch (activeTx.status) {
        case "stk_push_sent": return 2;
        case "confirming_blockchain": return 4;
        case "completed": return 5;
        case "failed": return 5;
        default: return 2;
      }
    }
    switch (activeTx.status) {
      case "awaiting_deposit": return 1;
      case "confirming_blockchain": return 2;
      case "swapping_to_kes": return 3;
      case "stk_push_sent": return 4;
      case "completed": return 5;
      case "failed": return 5;
      case "refunded": return 5;
      default: return 1;
    }
  };

  // 1. Simulate USDC deposit
  const handleSimulateDeposit = async () => {
    setLoading(true);
    try {
      await axios.post("/api/simulate/deposit", { paymentId: activeTx.id });
      // Poll/refresh transaction status
      let attempts = 0;
      const interval = setInterval(async () => {
        onRefreshActiveTx();
        attempts++;
        if (attempts >= 4) {
          clearInterval(interval);
        }
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Simulate Safaricom STK Callback Approve/Decline
  const handleSimulateSTKResult = async (success: boolean) => {
    setLoading(true);
    try {
      await axios.post("/api/simulate/mpesa-callback", { 
        paymentId: activeTx.id, 
        success 
      });
      onRefreshActiveTx();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2b. Simulate Licensed Aggregator Cash-In Webhook Trigger (Deposit Flow)
  const handleSimulateAggregatorWebhook = async () => {
    setLoading(true);
    try {
      await axios.post("/api/webhooks/aggregator", {
        txId: activeTx.id,
        event: "charge.completed",
        status: "SUCCESS_PROCESSED"
      });
      setTimeout(() => onRefreshActiveTx(), 1000);
    } catch (err) {
      console.error("Aggregator webhook simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2c. Simulate Licensed Aggregator B2C Payout (Withdrawal Flow)
  const handleSimulateAggregatorB2C = async () => {
    setLoading(true);
    try {
      await axios.post("/api/aggregator/b2c-withdraw", {
        amountUSDC: activeTx.amountUSDC,
        recipientPhone: activeTx.recipientPhone,
        recipientName: activeTx.recipientName,
        userWallet: activeTx.senderWallet,
        chain: activeTx.chain,
        payoutProvider: activeTx.payoutProvider
      });
      setTimeout(() => onRefreshActiveTx(), 1200);
    } catch (err) {
      console.error("Aggregator B2C payout error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-Pilot Simulation loop
  useEffect(() => {
    if (!autoSimulate || !activeTx) return;

    if (activeTx.status === "awaiting_deposit") {
      const timer = setTimeout(() => {
        handleSimulateDeposit();
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (activeTx.status === "stk_push_sent") {
      const timer = setTimeout(() => {
        handleSimulateSTKResult(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeTx?.status, autoSimulate]);

  // 3. Simulate Blockchain hang timeout & Refund
  const handleSimulateRefund = async () => {
    setLoading(true);
    try {
      await axios.post("/api/simulate/refund", { paymentId: activeTx.id });
      onRefreshActiveTx();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // QR Flowcode link
  const ethUri = `ethereum:${activeTx.depositAddress}?amount=${activeTx.amountUSDC}&token=USDC`;

  return (
    <div id="sim_card_wrapper" className="space-y-6">
      {/* 1. Sandbox Panel Title */}
      <div className="bg-gray-900 text-white rounded-xl p-5 border border-gray-800 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/60">
            Real-time Sandbox
          </span>
          <button
            onClick={onClearActiveTx}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            Reset Flow
          </button>
        </div>
        <h3 className="font-bold text-sm">Swiftpay Cross-Border Pipeline</h3>
        <p className="text-xs text-gray-400 mt-1">
          Monitor under-the-hood Circle deposit detection and Safaricom Daraja STK hooks.
        </p>

        {/* Auto-Pilot Toggle */}
        <div className="flex items-center gap-2 mt-4 bg-gray-800/40 p-2.5 rounded-lg border border-gray-800">
          <input
            type="checkbox"
            id="checkbox_auto_sim"
            checked={autoSimulate}
            onChange={(e) => {
              setAutoSimulate(e.target.checked);
              localStorage.setItem("auto_simulate", e.target.checked ? "true" : "false");
            }}
            className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500 cursor-pointer"
          />
          <label htmlFor="checkbox_auto_sim" className="text-xs font-medium text-gray-300 select-none cursor-pointer flex-1">
            ⚡ Auto-Pilot Simulation (Instant Settlement)
          </label>
        </div>

        {/* State Steps Timeline */}
        <div className="mt-5 grid grid-cols-5 gap-1 text-center relative pt-2">
          {/* Progress lines */}
          <div className="absolute top-4 left-5 right-5 h-[2px] bg-gray-800 -z-0">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${((currentStep() - 1) / 4) * 100}%` }}
            />
          </div>

          {(activeTx.paymentType === "stk_push"
            ? [
                { step: 1, label: "Trigger" },
                { step: 2, label: "STK Push" },
                { step: 3, label: "KES Clear" },
                { step: 4, label: "USDC Send" },
                { step: 5, label: "Settle" },
              ]
            : [
                { step: 1, label: "Invoice" },
                { step: 2, label: "Block" },
                { step: 3, label: "FX Swap" },
                { step: 4, label: "STK Push" },
                { step: 5, label: "Settle" },
              ]
          ).map((item) => {
            const stepNum = item.step;
            const isCompleted = currentStep() > stepNum || activeTx.status === "completed" && stepNum === 5;
            const isActive = currentStep() === stepNum;
            return (
              <div key={item.step} className="flex flex-col items-center z-10">
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted 
                      ? "bg-emerald-500 text-white" 
                      : isActive 
                        ? "bg-amber-500 text-white animate-pulse" 
                        : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {isCompleted ? "✓" : stepNum}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Invoice QR Code (Flowcode / QR Display) */}
      {activeTx.status === "awaiting_deposit" && (
        <div id="deposit_invoice_card" className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-500" />
                USDC Escrow Invoice
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Scan flowcode with your Web3 mobile wallet</p>
            </div>
            <span className="font-mono text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
              {activeTx.chain} USDC
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 justify-center py-2 bg-gray-50/50 rounded-lg p-3">
            {/* High-fidelity SVG QR Generator */}
            <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-sm shrink-0 flex flex-col items-center">
              <svg className="w-32 h-32 text-gray-800" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#fff" />
                {/* Simulated high-fidelity outer QR anchors */}
                <rect x="5" y="5" width="20" height="20" fill="currentColor" />
                <rect x="8" y="8" width="14" height="14" fill="#fff" />
                <rect x="11" y="11" width="8" height="8" fill="currentColor" />

                <rect x="75" y="5" width="20" height="20" fill="currentColor" />
                <rect x="78" y="8" width="14" height="14" fill="#fff" />
                <rect x="81" y="11" width="8" height="8" fill="currentColor" />

                <rect x="5" y="75" width="20" height="20" fill="currentColor" />
                <rect x="8" y="78" width="14" height="14" fill="#fff" />
                <rect x="11" y="81" width="8" height="8" fill="currentColor" />

                {/* Micro dots */}
                <rect x="35" y="10" width="4" height="4" fill="currentColor" />
                <rect x="45" y="15" width="8" height="4" fill="currentColor" />
                <rect x="60" y="8" width="4" height="8" fill="currentColor" />
                <rect x="15" y="35" width="4" height="8" fill="currentColor" />
                <rect x="10" y="50" width="8" height="4" fill="currentColor" />
                <rect x="40" y="40" width="12" height="12" fill="currentColor" />
                <rect x="44" y="44" width="4" height="4" fill="#fff" />
                <rect x="65" y="45" width="10" height="4" fill="currentColor" />
                <rect x="35" y="65" width="8" height="4" fill="currentColor" />
                <rect x="55" y="70" width="4" height="10" fill="currentColor" />
                <rect x="45" y="85" width="10" height="4" fill="currentColor" />
                <rect x="80" y="40" width="4" height="10" fill="currentColor" />
                <rect x="85" y="60" width="8" height="8" fill="currentColor" />
                <rect x="70" y="80" width="10" height="4" fill="currentColor" />
              </svg>
              <span className="text-[10px] text-gray-400 mt-2 font-mono">Invoice QR (Flowcode)</span>
            </div>

            <div className="space-y-3 w-full text-xs">
              <div>
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Circle Deposit Address</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded truncate select-all">
                    {activeTx.depositAddress}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Exact USDC Amount</span>
                  <span className="font-mono font-bold text-gray-900">{activeTx.amountUSDC.toFixed(4)} USDC</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Network Rail</span>
                  <span className="font-mono text-gray-800 font-bold">{activeTx.chain}</span>
                </div>
              </div>

              {/* Deposit Trigger */}
              <button
                type="button"
                id="btn_sim_deposit"
                onClick={handleSimulateDeposit}
                disabled={loading}
                className="w-full bg-emerald-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Simulate Crypto Deposit Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Under-the-Hood System Log Status / Processing Steps */}
      {activeTx.status !== "awaiting_deposit" && activeTx.status !== "completed" && activeTx.status !== "failed" && activeTx.status !== "refunded" && (
        <div id="processing_log_panel" className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
            Active Transfer Pipeline
          </h4>

          <div className="space-y-3 text-xs">
            {activeTx.paymentType === "stk_push" ? (
              <>
                {/* Step 1: STK Push Status */}
                <div className={`flex items-start gap-2.5 p-2 rounded ${activeTx.status === "stk_push_sent" ? "bg-amber-50 text-amber-900 border border-amber-100" : "text-gray-500"}`}>
                  {activeTx.status === "stk_push_sent" ? (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">Safaricom/Airtel STK Push Authorization</p>
                    <p className="text-[11px] opacity-80">STK push prompt sent to {activeTx.recipientPhone}. Enter your PIN on the virtual handset to approve KES payment to the conversion till.</p>
                  </div>
                </div>

                {/* Step 2: USDC On-chain Dispatch */}
                <div className={`flex items-start gap-2.5 p-2 rounded ${activeTx.status === "confirming_blockchain" ? "bg-amber-50 text-amber-900 border border-amber-100" : activeTx.status === "completed" ? "text-gray-500" : "text-gray-300"}`}>
                  {activeTx.status === "confirming_blockchain" ? (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin mt-0.5 shrink-0" />
                  ) : activeTx.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">Sovereign Stablecoin Dispatch</p>
                    <p className="text-[11px] opacity-80">STK Push successful! Processing FX swap and dispatching {activeTx.amountUSDC.toFixed(4)} USDC on-chain to your destination wallet ({activeTx.senderWallet.slice(0, 6)}...{activeTx.senderWallet.slice(-4)}) on {activeTx.chain}.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Step: Confirm Blockchain */}
                <div className={`flex items-start gap-2.5 p-2 rounded ${activeTx.status === "confirming_blockchain" ? "bg-amber-50 text-amber-900 border border-amber-100" : "text-gray-500"}`}>
                  {activeTx.status === "confirming_blockchain" ? (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">Blockchain Finality Validation</p>
                    <p className="text-[11px] opacity-80">Circle webhook confirmed USDC deposit on {activeTx.chain}. Awaiting consensus validation.</p>
                  </div>
                </div>

                {/* Step: Swap Liquidity */}
                <div className={`flex items-start gap-2.5 p-2 rounded ${activeTx.status === "swapping_to_kes" ? "bg-amber-50 text-amber-900 border border-amber-100" : currentStep() > 3 ? "text-gray-500" : "text-gray-300"}`}>
                  {activeTx.status === "swapping_to_kes" ? (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin mt-0.5 shrink-0" />
                  ) : currentStep() > 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                  )}
                  <div>
                    {activeTx.payoutChannel === "cashapp" ? (
                      <>
                        <p className="font-semibold">Stablecoin USD Liquidity Routing</p>
                        <p className="text-[11px] opacity-80">Routing {activeTx.amountUSDC.toFixed(2)} USDC into CashApp clearing gateway reserves (minus 1.5% profit shield).</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">Stablecoin FX Converter</p>
                        <p className="text-[11px] opacity-80">Swapping {activeTx.amountUSDC.toFixed(2)} USDC to local KES Liquidity reserves (Settle Rate: {activeTx.effectiveRate}).</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Step: Safaricom STK Push / CashApp Dispatch */}
                <div className={`flex items-start gap-2.5 p-2 rounded ${activeTx.status === "stk_push_sent" ? "bg-emerald-50 text-emerald-900 border border-emerald-100" : "text-gray-300"}`}>
                  {activeTx.status === "stk_push_sent" ? (
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin mt-0.5 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                  )}
                  <div>
                    {activeTx.payoutChannel === "cashapp" ? (
                      <>
                        <p className="font-semibold">CashApp API Dispatcher</p>
                        <p className="text-[11px] opacity-80">Broadcasting payout notification payload to Cashtag {activeTx.recipientTag}. Awaiting final mobile receiver confirmation.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">Safaricom Daraja STK Dispatcher</p>
                        <p className="text-[11px] opacity-80">Triggering STK push to recipient Safaricom device at {activeTx.recipientPhone}. Awaiting handset PIN entry.</p>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Virtual Mobile Phone Frame (Safaricom M-Pesa STK Screen / Airtel simulation) */}
      {activeTx.status === "stk_push_sent" && (() => {
        const isAirtel = activeTx.payoutProvider === "airtel";
        const textBrand = isAirtel ? "Airtel Money" : "M-Pesa";
        const providerName = isAirtel ? "AIRTEL 5G" : "SAFARICOM 5G";
        const colorText = isAirtel ? "text-rose-400" : "text-emerald-400";
        const colorBg = isAirtel ? "bg-rose-950" : "bg-emerald-950";
        const colorBorder = isAirtel ? "border-rose-800" : "border-emerald-800";
        const colorBtn = isAirtel ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500";

        let promptDesc = "";
        if (activeTx.paymentType === "paybill") {
          promptDesc = `Pay Bill to ${textBrand} Business ${activeTx.paybillNumber || "222222"} (Account: ${activeTx.paybillAccount || "Swiftpay"}) KES ${activeTx.amountKES.toLocaleString()}.`;
        } else if (activeTx.paymentType === "till") {
          promptDesc = `Buy Goods to Merchant Till ${activeTx.tillNumber || "543210"} KES ${activeTx.amountKES.toLocaleString()}.`;
        } else if (activeTx.paymentType === "stk_push") {
          promptDesc = `Instant Swap Prompt from Swiftpay Liquid Pool for KES ${activeTx.amountKES.toLocaleString()}.`;
        } else {
          promptDesc = `Transfer to ${textBrand} Number ${activeTx.recipientPhone} KES ${activeTx.amountKES.toLocaleString()}.`;
        }

        return (
          <div id="mpesa_handset_emulator" className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border-4 border-slate-700 relative max-w-sm mx-auto overflow-hidden animate-pulseSlow">
            {/* Mobile Status Bar */}
            <div className="flex justify-between items-center text-[10px] text-gray-500 mb-6 font-mono">
              <span>{providerName}</span>
              <div className="flex gap-1.5">
                <span>9:41 AM</span>
                <span>85% 🔋</span>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className={`w-12 h-12 rounded-full ${colorBg} ${colorText} flex items-center justify-center mx-auto border ${colorBorder}`}>
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm">Virtual {textBrand} Handset Prompt</h5>
                <p className="text-[11px] text-gray-400 mt-1">An instant push prompt has been broadcasted to {activeTx.recipientPhone}.</p>
              </div>

              {/* STK Popup Screen */}
              <div className="bg-slate-800 rounded-xl p-4 text-left border border-slate-700 shadow-inner my-3">
                <div className={`flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-700 ${colorText} text-xs font-bold font-mono`}>
                  <span>SIM toolkit</span>
                </div>
                <p className="text-xs text-gray-200 leading-normal mb-3">
                  {promptDesc} Enter {textBrand} PIN:
                </p>

                <input
                  type="password"
                  id="input_sim_pin"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-600 rounded px-2.5 py-1.5 text-center tracking-[0.5em] font-mono text-sm focus:outline-none focus:border-slate-500 text-white"
                />

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold text-center">
                  <button
                    type="button"
                    id="btn_sim_stk_cancel"
                    onClick={() => handleSimulateSTKResult(false)}
                    className="bg-slate-700 hover:bg-slate-600 text-gray-300 py-2 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="btn_sim_stk_approve"
                    onClick={() => handleSimulateSTKResult(true)}
                    disabled={pinInput.length < 4}
                    className={`${colorBtn} text-white py-2 rounded-lg disabled:opacity-40 cursor-pointer`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. Terminal State Displays (Completed, Failed, Refunded) */}
      {(activeTx.status === "completed" || activeTx.status === "failed" || activeTx.status === "refunded") && (
        <div 
          id="simulation_terminal_state" 
          className={`border rounded-xl p-5 text-center shadow-sm ${
            activeTx.status === "completed" 
              ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" 
              : activeTx.status === "refunded"
                ? "bg-amber-50/50 border-amber-100 text-amber-900"
                : "bg-red-50/50 border-red-100 text-red-900"
          }`}
        >
          <div className="mb-3">
            {activeTx.status === "completed" && (
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
            )}
            {activeTx.status === "refunded" && (
              <Clock className="w-10 h-10 mx-auto text-amber-600 animate-pulse" />
            )}
            {activeTx.status === "failed" && (
              <XCircle className="w-10 h-10 mx-auto text-red-600" />
            )}
          </div>

          <h4 className="font-bold text-sm">
            {activeTx.status === "completed" && "Conversion Completed Successfully"}
            {activeTx.status === "refunded" && "Transaction Safe Refunded"}
            {activeTx.status === "failed" && "Transaction Failed"}
          </h4>
          
          <p className="text-xs mt-1 text-gray-600 max-w-sm mx-auto leading-relaxed">
            {activeTx.status === "completed" && (
              activeTx.paymentType === "stk_push"
                ? `You successfully swapped KES to Crypto. Your linked wallet ${activeTx.senderWallet.slice(0, 8)}... has been funded with ${activeTx.amountUSDC.toFixed(4)} USDC via on-chain delivery.`
                : `Recipient received ${activeTx.amountKES.toLocaleString()} KES. SMS Receipt notification broadcast completed by Safaricom.`
            )}
            {activeTx.status === "refunded" && `The block was reversed. A refund of ${activeTx.amountUSDC.toFixed(4)} USDC has been safely re-routed back to your wallet (${activeTx.senderWallet.slice(0, 6)}...${activeTx.senderWallet.slice(-4)}) on ${activeTx.chain}.`}
            {activeTx.status === "failed" && `Failed: ${activeTx.errorMessage || "The transaction did not complete."}`}
          </p>

          <div className="bg-white border border-gray-100 rounded-lg p-3 my-3 text-left text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction ID:</span>
              <span className="text-gray-700 font-bold">{activeTx.id.slice(0, 12)}...</span>
            </div>
            {activeTx.refundTxId && (
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold text-amber-800">Refund Hash:</span>
                <span className="text-amber-800 font-bold">{activeTx.refundTxId.slice(0, 14)}...</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Timestamp:</span>
              <span className="text-gray-700">{new Date(activeTx.updatedAt).toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onClearActiveTx}
            className="text-xs bg-gray-800 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Create New Swap
          </button>
        </div>
      )}

      {/* Licensed Aggregator Sandbox Direct Controls Card */}
      <div id="sim_aggregator_actions_card" className="bg-indigo-950/40 border border-indigo-900/60 rounded-xl p-4 text-xs text-indigo-200 space-y-3">
        <div className="flex items-center justify-between border-b border-indigo-900/80 pb-2">
          <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
            <Building className="w-4 h-4 text-indigo-400" />
            Licensed Gateway Aggregator Middleware Test Suite
          </span>
          <span className="text-[9px] bg-indigo-900/80 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded uppercase">
            Flutterwave / B2B Sandbox
          </span>
        </div>
        <p className="text-[11px] text-indigo-300/80 leading-relaxed">
          Directly test the Third-Party Licensed Aggregator endpoints. The aggregator handles regulatory KYC/AML and M-Pesa trust accounts, while the app executes automated L2 smart contract liquidity swaps.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            id="btn_sim_agg_webhook"
            onClick={handleSimulateAggregatorWebhook}
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current text-emerald-200" />
            Simulate Aggregator Cash-In Webhook
          </button>

          <button
            type="button"
            id="btn_sim_agg_b2c"
            onClick={handleSimulateAggregatorB2C}
            disabled={loading}
            className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2 px-3 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current text-indigo-200" />
            Simulate Aggregator Cash-Out B2C Payout
          </button>
        </div>
      </div>

      {/* 6. Five-Minute Hang / Auto Refund Simulation Action Button */}
      {activeTx.status === "awaiting_deposit" && (
        <div id="refund_simulator_trigger" className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div>
              <p className="font-semibold">Automatic Timeout Shield (Error Rule 5)</p>
              <p className="opacity-80 mt-0.5">
                If the USDC deposit hangs, is stuck, or the network stalls &gt;5 minutes, Swiftpay automatically triggers an instant on-chain refund to the sender's address.
              </p>
            </div>
            <button
              type="button"
              id="btn_sim_timeout"
              onClick={handleSimulateRefund}
              disabled={loading}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-1.5 px-3 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              Simulate 5-Minute Timeout & Trigger Refund Flow
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
