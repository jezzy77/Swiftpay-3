import React, { useState, useEffect } from "react";
import {
  Lock,
  Shield,
  KeyRound,
  Sliders,
  Sparkles,
  TrendingUp,
  DollarSign,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Building,
  Globe,
  Bot,
  Send,
  Zap,
  Info,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import axios from "axios";
import { AppSettings, OwnerAIOptimizeResponse } from "../types";

interface OwnerControlPanelProps {
  onClose?: () => void;
  isDarkMode?: boolean;
  solPublicKey?: string | null;
}

export const OwnerControlPanel: React.FC<OwnerControlPanelProps> = ({
  onClose,
  isDarkMode = true,
  solPublicKey
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    selfCustodySolAddress: "SwiftX88p6sZgE5B9Nq2Yg9qD7yK3BqL9M1SgC8fH7vP",
    ownerEvmAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    ownerMpesaPhone: "+254712345678",
    spreadMode: "optimum",
    customSpreadPercent: 2.5,
    showZeroFeesToUsers: true,
    ownerUsername: "admin"
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // PIN / Password Confirmation Modal State
  const [showPinConfirmModal, setShowPinConfirmModal] = useState(false);
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [confirmPinError, setConfirmPinError] = useState("");
  const [pendingUpdates, setPendingUpdates] = useState<Partial<AppSettings> | null>(null);

  // AI Optimizer State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<OwnerAIOptimizeResponse | null>(null);

  // Owner Security Change Credentials State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [securityMsg, setSecurityMsg] = useState("");

  // Check if owner session exists in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("swiftpay_owner_token");
    if (savedToken) {
      setIsAuthenticated(true);
      fetchOwnerSettings();
    }
  }, []);

  const fetchOwnerSettings = async () => {
    try {
      const res = await axios.get("/api/settings");
      if (res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await axios.post("/api/owner/login", { username, password });
      if (res.data && res.data.success) {
        localStorage.setItem("swiftpay_owner_token", res.data.token);
        setIsAuthenticated(true);
        if (res.data.settings) {
          setSettings((prev) => ({ ...prev, ...res.data.settings }));
        }
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.error || "Authentication failed. Invalid username or password.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("swiftpay_owner_token");
    setIsAuthenticated(false);
    setPassword("");
  };

  // Open PIN / Password confirmation modal prior to saving
  const requestPinToSave = (partialUpdates: Partial<AppSettings>) => {
    setPendingUpdates(partialUpdates);
    setConfirmPinInput(password || ""); // pre-fill if available from session
    setConfirmPinError("");
    setShowPinConfirmModal(true);
  };

  const executeConfirmedSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!confirmPinInput) {
      setConfirmPinError("Owner Password or PIN is required.");
      return;
    }

    setSavingSettings(true);
    setConfirmPinError("");
    setSaveSuccessMsg("");

    try {
      const updatedData = { 
        ...settings, 
        ...(pendingUpdates || {}),
        confirmPasswordOrPin: confirmPinInput 
      };

      const res = await axios.post("/api/owner/settings", updatedData);
      if (res.data && res.data.settings) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
        setSaveSuccessMsg("Authorized! Changes saved to Sovereign Control Panel.");
        setShowPinConfirmModal(false);
        setPendingUpdates(null);
        setTimeout(() => setSaveSuccessMsg(""), 3500);
      }
    } catch (err: any) {
      console.error("Error updating owner settings:", err);
      setConfirmPinError(err.response?.data?.error || "Incorrect Password or PIN. Authorization failed.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRunAiOptimizer = async (customPrompt?: string) => {
    setAiLoading(true);
    try {
      const res = await axios.post("/api/owner/ai-optimize", {
        prompt: customPrompt || aiPrompt || "Analyze current market volume and recommend optimal spread for max profit with 0% explicit user fees.",
        customSpreadPercent: settings.customSpreadPercent
      });
      if (res.data) {
        setAiResponse(res.data);
      }
    } catch (err) {
      console.error("AI Optimization error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiSpread = (recommendedPercent: number, mode?: "max_profit" | "optimum" | "aggressive_volume" | "custom") => {
    requestPinToSave({
      spreadMode: mode || "custom",
      customSpreadPercent: recommendedPercent
    });
  };

  const handleUpdateOwnerSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername && !newPassword) return;
    setSecurityMsg("");

    try {
      await axios.post("/api/owner/settings", {
        ownerUsername: newUsername || undefined,
        ownerPassword: newPassword || undefined
      });
      setSecurityMsg("Owner login credentials updated successfully!");
      setNewUsername("");
      setNewPassword("");
      setTimeout(() => setSecurityMsg(""), 3500);
    } catch (err) {
      console.error("Failed to update credentials:", err);
    }
  };

  // Derived Calculations
  const midMarketRate = 130.5;
  const currentSpread = settings.spreadMode === "max_profit" 
    ? 4.5 
    : settings.spreadMode === "optimum" 
    ? 2.5 
    : settings.spreadMode === "aggressive_volume" 
    ? 1.2 
    : settings.customSpreadPercent || 2.5;

  const effectiveRate = midMarketRate * (1 - currentSpread / 100);
  const profitPerThousandUSD = currentSpread * 10.0; // $1,000 * spread%
  const profitPerThousandKES = profitPerThousandUSD * midMarketRate;

  return (
    <div className={`rounded-3xl border p-6 space-y-6 shadow-2xl transition-all ${
      isDarkMode 
        ? "bg-[#091121] border-slate-800 text-slate-100" 
        : "bg-white border-slate-200 text-slate-800"
    }`}>
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-wide">Owner Control Panel</h2>
              <span className="text-[9px] font-bold tracking-widest uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full">
                👑 Protocol Owner
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage profit spreads, linked payout wallets & AI yield optimization.
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={handleLogout}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700/60 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            Lock Control Panel
          </button>
        )}
      </div>

      {/* LOGIN GATE IF NOT AUTHENTICATED */}
      {!isAuthenticated ? (
        <form onSubmit={handleLogin} className="space-y-4 py-2 max-w-md mx-auto text-left">
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Shield className="w-4 h-4 shrink-0" />
              Restricted Owner Access Door
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Only the protocol owner can access profit spread controls and payout wallet settings. Default login: <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-amber-300">admin</code> / <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-amber-300">admin123</code>
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Owner Username
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter owner username"
                required
                className={`w-full text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 border ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Owner Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter owner password"
                required
                className={`w-full text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 border ${
                  isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            {authLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-slate-950" />
                Authenticate & Unlock Control Panel
              </>
            )}
          </button>
        </form>
      ) : (
        /* AUTHENTICATED OWNER CONTROL PANEL UI */
        <div className="space-y-6 text-left">
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-fadeIn">
              <span className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                {saveSuccessMsg}
              </span>
            </div>
          )}

          {/* CARD 1: LINKED PAYOUT WALLETS (Where Profits Flow) */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                  1. Manually Linked Profit Collection Wallets
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-md">
                Direct Revenue Routing
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              All captured conversion spreads and fee margins automatically accumulate and flow directly to your linked wallet addresses below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Solana Wallet Address (SOL / SPL USDC)
                </label>
                <input
                  type="text"
                  value={settings.selfCustodySolAddress}
                  onChange={(e) => setSettings({ ...settings, selfCustodySolAddress: e.target.value })}
                  placeholder="Enter SOL address (e.g. SwiftX88...)"
                  className="w-full text-xs font-mono rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                {solPublicKey && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, selfCustodySolAddress: solPublicKey })}
                    className="text-[9.5px] text-emerald-400 hover:underline uppercase font-bold tracking-wide"
                  >
                    [Fill Connected SOL Wallet: {solPublicKey.slice(0, 8)}...]
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  EVM Wallet Address (Polygon / Base USDC)
                </label>
                <input
                  type="text"
                  value={settings.ownerEvmAddress || ""}
                  onChange={(e) => setSettings({ ...settings, ownerEvmAddress: e.target.value })}
                  placeholder="Enter EVM 0x address"
                  className="w-full text-xs font-mono rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => requestPinToSave({})}
              disabled={savingSettings}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Commit & Link Profit Wallets (Password/PIN Required)
            </button>
          </div>

          {/* CARD 2: SPREAD MANAGEMENT & SLIDER FOR MAXIMUM PROFIT */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                  2. Spread Management & Revenue Model
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full inline-block self-start sm:self-center">
                User Explicit Fee: KES 0.00 (0%)
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Configure your silent FX conversion margin. End users see <strong>Zero Explicit Service Fees</strong>, while the profit spread is seamlessly built into the effective rate.
            </p>

            {/* PRESETS BUTTONS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, spreadMode: "max_profit", customSpreadPercent: 4.5 });
                  requestPinToSave({ spreadMode: "max_profit", customSpreadPercent: 4.5 });
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.spreadMode === "max_profit"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider">🚀 Max Profit</div>
                <div className="text-sm font-black text-white mt-0.5">4.5% Spread</div>
                <div className="text-[9px] text-amber-400/80 mt-1">High yield per transaction</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, spreadMode: "optimum", customSpreadPercent: 2.5 });
                  requestPinToSave({ spreadMode: "optimum", customSpreadPercent: 2.5 });
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.spreadMode === "optimum"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider">⚖️ Optimum</div>
                <div className="text-sm font-black text-white mt-0.5">2.5% Spread</div>
                <div className="text-[9px] text-emerald-400/80 mt-1">Balanced yield & volume</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, spreadMode: "aggressive_volume", customSpreadPercent: 1.2 });
                  requestPinToSave({ spreadMode: "aggressive_volume", customSpreadPercent: 1.2 });
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.spreadMode === "aggressive_volume"
                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider">⚡ Max Volume</div>
                <div className="text-sm font-black text-white mt-0.5">1.2% Spread</div>
                <div className="text-[9px] text-indigo-400/80 mt-1">Market share capture</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, spreadMode: "custom" });
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.spreadMode === "custom"
                    ? "bg-purple-500/20 border-purple-500 text-purple-300 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider">🎛️ Custom Slider</div>
                <div className="text-sm font-black text-white mt-0.5">{currentSpread.toFixed(1)}% Spread</div>
                <div className="text-[9px] text-purple-400/80 mt-1">Manual fine-tuning</div>
              </button>
            </div>

            {/* INTERACTIVE RANGE SLIDER */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Custom Spread Slider
                </span>
                <span className="text-sm font-black font-mono text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-lg">
                  {currentSpread.toFixed(1)}% Profit Margin
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.1"
                value={currentSpread}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSettings({ ...settings, spreadMode: "custom", customSpreadPercent: val });
                }}
                onMouseUp={() => requestPinToSave({ spreadMode: "custom", customSpreadPercent: currentSpread })}
                onTouchEnd={() => requestPinToSave({ spreadMode: "custom", customSpreadPercent: currentSpread })}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0.5% (Low)</span>
                <span>2.5% (Optimum)</span>
                <span>5.0% (High Profit)</span>
                <span>10.0% (Max Limit)</span>
              </div>
            </div>

            {/* REVENUE PREVIEW CARD */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-emerald-950/30 border border-amber-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Mid-Market USD/KES</span>
                <span className="text-sm font-bold text-white font-mono">1 USD = {midMarketRate.toFixed(2)} KES</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Effective User Rate</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">1 USD = {effectiveRate.toFixed(2)} KES</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Owner Net Profit / $1k Vol</span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  ${profitPerThousandUSD.toFixed(2)} <span className="text-[10px] text-slate-400">({profitPerThousandKES.toFixed(0)} KES)</span>
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: AI SPREAD & YIELD OPTIMIZER (GEMINI AI) */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                  3. AI Spread & Yield Optimizer (Gemini Engine)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Bot className="w-3 h-3" />
                Live Market Analytics
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Let the AI analyze live M-Pesa transaction velocity, exchange rate volatility, and gas congestion to automatically recommend the highest-yielding spread model.
            </p>

            <button
              type="button"
              onClick={() => handleRunAiOptimizer()}
              disabled={aiLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing M-Pesa Liquidity & Market Volatility...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  Run One-Click AI Spread Optimization
                </>
              )}
            </button>

            {aiResponse && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-900/60 space-y-3 text-xs animate-fadeIn">
                <div className="flex items-center justify-between border-b border-purple-900/80 pb-2">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    AI Recommendation Output
                  </span>
                  <span className="text-sm font-black font-mono text-purple-200 bg-purple-900/80 px-2.5 py-0.5 rounded">
                    {aiResponse.recommendedSpreadPercent}% Spread
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  {aiResponse.rationale}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Forecast Daily Revenue</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">${aiResponse.forecastDailyProfitUSD} USD</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Forecast Daily Volume</span>
                    <span className="text-sm font-bold text-indigo-300 font-mono">${aiResponse.forecastDailyVolumeUSD} USD</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 text-[11px] text-slate-300 border border-slate-800/80 italic">
                  "{aiResponse.aiStrategyAdvice}"
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyAiSpread(aiResponse.recommendedSpreadPercent, aiResponse.recommendedMode)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply AI Recommended {aiResponse.recommendedSpreadPercent}% Spread Now
                </button>
              </div>
            )}

            {/* AI STRATEGY PROMPT CHAT */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Ask AI Spread & Strategy Advisor
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. How do I optimize yield during Kenya evening M-Pesa peak hours?"
                  className="flex-1 text-xs rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleRunAiOptimizer(aiPrompt)}
                  disabled={aiLoading || !aiPrompt}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ask
                </button>
              </div>
            </div>
          </div>

          {/* CARD 4: NON-CUSTODIAL LEGAL COMPLIANCE FRAMEWORK */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                  4. Non-Custodial Legal & Regulatory Shield
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-md">
                Legal in Kenya & Globally
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 block text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% Non-Custodial
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Users retain sole private key control. The protocol never holds or freezes user crypto assets.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-400 block text-xs flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  Kenyan Aggregator Umbrella
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Fiat KES float is handled entirely by licensed payment gateways. Regulatory KYC/AML is managed at gateway entry.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 block text-xs flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Software Middleware
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Operates purely as peer-to-peer software middleware routing automated smart contract swap logic.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 5: UPDATE OWNER SECURITY CREDENTIALS */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                5. Owner Account Security Settings
              </h3>
            </div>

            {securityMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                {securityMsg}
              </div>
            )}

            <form onSubmit={handleUpdateOwnerSecurity} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  New Owner Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="w-full text-xs rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  New Owner Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full text-xs rounded-xl px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
                >
                  Update Owner Security Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OWNER PASSWORD / PIN AUTHORIZATION MODAL */}
      {showPinConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-amber-500/50 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Owner Security Authorization</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your Owner Password or PIN code to authorize and save changes to the Sovereign Protocol configuration.
            </p>

            {confirmPinError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{confirmPinError}</span>
              </div>
            )}

            <form onSubmit={executeConfirmedSave} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Password / PIN Code
                </label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Enter owner password or PIN"
                  autoFocus
                  required
                  className="w-full text-xs rounded-xl px-4 py-3 bg-slate-900 border border-slate-800 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinConfirmModal(false)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
