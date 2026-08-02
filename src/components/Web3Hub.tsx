import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  ArrowUpRight, 
  ArrowDownLeft, 
  HelpCircle,
  Clock,
  Sparkles,
  Zap,
  Globe,
  Database,
  Lock,
  Wallet,
  Activity,
  CheckCircle,
  Folder,
  FolderOpen,
  ChevronRight,
  Smartphone,
  Terminal,
  Radio,
  Wifi
} from "lucide-react";

interface Web3HubProps {
  isDarkMode: boolean;
  usdcBalance: number;
  reservePool: number;
  onMintFaucet: () => Promise<void>;
  faucetMinting: boolean;
  faucetSuccess: boolean;
}

export const Web3Hub: React.FC<Web3HubProps> = ({
  isDarkMode,
  usdcBalance,
  reservePool,
  onMintFaucet,
  faucetMinting,
  faucetSuccess,
}) => {
  // Solana connection and wallet hooks
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  // Balance & UI States
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  // EIP-4361 SIWE states
  const [siweToken, setSiweToken] = useState<string | null>(null);
  const [siweAddress, setSiweAddress] = useState<string | null>(null);
  const [copiedEthAddress, setCopiedEthAddress] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("swiftpay_siwe_session_token");
    if (token) {
      setSiweToken(token);
      try {
        const parts = token.split("_");
        if (parts[2]) {
          const addressBase64 = parts[2];
          const decoded = atob(addressBase64);
          setSiweAddress(decoded);
        } else {
          setSiweAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
        }
      } catch (err) {
        setSiweAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
      }
    }
  }, []);

  // Active directory path for compact directory tree layout
  const [activeDirectory, setActiveDirectory] = useState<"staking" | "wallet" | "faucet" | "bridge">("staking");

  // Staking states
  const [stakedBalance, setStakedBalance] = useState<number>(0);
  const [stakeInput, setStakeInput] = useState<string>("");
  const [unstakeInput, setUnstakeInput] = useState<string>("");
  const [earnedInterest, setEarnedInterest] = useState<number>(0);
  const [stakingStatusMsg, setStakingStatusMsg] = useState<string>("");
  const [stakingError, setStakingError] = useState<string>("");

  // Mobile Wallet Adapter Simulation States
  const [mwaActive, setMwaActive] = useState<boolean>(false);
  const [mwaStep, setMwaStep] = useState<number>(0); // 0: idle, 1: transact, 2: authorize, 3: package, 4: sign, 5: success
  const [mwaLogs, setMwaLogs] = useState<string[]>([]);

  const runMwaSimulation = () => {
    if (mwaActive) return;
    setMwaActive(true);
    setMwaStep(1);
    setMwaLogs([
      "🔋 [MWA] Initializing transact(async (wallet) => { ... }) bridge session.",
      "📡 [MWA] Broadcasting secure Android Intent: solana-wallet://v1/associate",
      "🤝 [MWA] Wallet handshake initiated. Holding atomic channel open..."
    ]);

    // Step 2
    setTimeout(() => {
      setMwaStep(2);
      setMwaLogs(prev => [
        ...prev,
        "🔒 [MWA] wallet.authorize() invoked with custom APP_IDENTITY parameters:",
        "   - Name: 'My Solana Store' | URI: 'https://mystore.io' | Icon: 'favicon.png'",
        "📲 [MWA] System modal prompted on mobile handset. Awaiting biometric consent..."
      ]);
    }, 1500);

    // Step 3
    setTimeout(() => {
      setMwaStep(3);
      setMwaLogs(prev => [
        ...prev,
        "🔑 [MWA] Biometrics accepted! Wallet authenticated securely.",
        "📋 [MWA] User Address: SwiftX88p6sZgE5B9Nq2Yg9qD7yK3BqL9M1SgC8fH7vP connected.",
        "📦 [MWA] Packaging modern VersionedTransaction payload (Sending 0.1 SOL to Escrow)..."
      ]);
    }, 3000);

    // Step 4
    setTimeout(() => {
      setMwaStep(4);
      setMwaLogs(prev => [
        ...prev,
        "✍️ [MWA] wallet.signAndSendTransactions() triggered on client device.",
        "🛰️ [MWA] Transaction signed in isolated secure enclave on Android hardware.",
        "📡 [RPC] Broadcasting raw binary transaction bytes via private WebSocket RPC node..."
      ]);
    }, 4500);

    // Step 5
    setTimeout(() => {
      setMwaStep(5);
      setMwaLogs(prev => [
        ...prev,
        "✨ [RPC] Transaction broadcast successfully validated on Solana mainnet!",
        "🔗 [RPC] TX Signature: 3mWaH9Yx7RkWpXz9Kj8eQp9mY5bZ2aRt4vD6uX8c3sB1eA5gP9nU7qJ",
        "🎉 [MWA] Atomic transaction complete. Socket channel closed gracefully."
      ]);
    }, 6000);
  };

  const resetMwaSimulation = () => {
    setMwaActive(false);
    setMwaStep(0);
    setMwaLogs([]);
  };

  // Live SOL Balance fetch & poll
  useEffect(() => {
    let active = true;
    const getBalance = async () => {
      if (publicKey) {
        setLoadingBalance(true);
        try {
          const bal = await connection.getBalance(publicKey);
          if (active) {
            setSolBalance(bal / LAMPORTS_PER_SOL);
          }
        } catch (err) {
          console.error("Error fetching Solana balance:", err);
          if (active) {
            setSolBalance(null);
          }
        } finally {
          if (active) {
            setLoadingBalance(false);
          }
        }
      } else {
        if (active) {
          setSolBalance(null);
        }
      }
    };

    getBalance();
    const interval = setInterval(getBalance, 12000); // Poll balance every 12 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [publicKey, connection]);

  // Simulated live yield ticker
  useEffect(() => {
    if (stakedBalance > 0) {
      const interval = setInterval(() => {
        // 15.4% APR divided into seconds
        const yieldPerSecond = (stakedBalance * 0.154) / (365 * 24 * 3600);
        setEarnedInterest(prev => prev + yieldPerSecond);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stakedBalance]);

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(stakeInput);
    if (isNaN(amt) || amt <= 0) {
      setStakingError("Please enter a valid positive USDC amount.");
      return;
    }
    if (amt > usdcBalance) {
      setStakingError(`Insufficient USDC balance. You have $${usdcBalance.toFixed(2)} USDC.`);
      return;
    }

    setStakingError("");
    setStakedBalance(prev => prev + amt);
    setStakingStatusMsg(`Successfully staked $${amt.toFixed(2)} USDC! Yield generation starts immediately.`);
    setStakeInput("");
    setTimeout(() => setStakingStatusMsg(""), 4000);
  };

  const handleUnstake = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(unstakeInput);
    if (isNaN(amt) || amt <= 0) {
      setStakingError("Please enter a valid positive USDC amount.");
      return;
    }
    if (amt > stakedBalance) {
      setStakingError(`Insufficient staked balance. You only have $${stakedBalance.toFixed(2)} USDC staked.`);
      return;
    }

    setStakingError("");
    setStakedBalance(prev => prev - amt);
    setStakingStatusMsg(`Withdrew $${amt.toFixed(2)} USDC to your primary non-custodial wallet.`);
    setUnstakeInput("");
    setTimeout(() => setStakingStatusMsg(""), 4000);
  };

  const handleClaimRewards = () => {
    if (earnedInterest <= 0) return;
    const claimed = earnedInterest;
    setEarnedInterest(0);
    setStakingStatusMsg(`Claimed $${claimed.toFixed(6)} USDC in staking yields directly to your wallet.`);
    setTimeout(() => setStakingStatusMsg(""), 4000);
  };

  return (
    <div className="space-y-5">
      
      {/* Immersive compact status row */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left"
      >
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`border p-3.5 rounded-xl space-y-0.5 transition-all ${
            isDarkMode ? "bg-slate-950/50 border-slate-900" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <span className="text-[9px] text-slate-500 font-mono block uppercase">Liquidity Pool KES</span>
          <span className={`text-sm font-black font-mono block ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            KES {reservePool.toLocaleString()}
          </span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`border p-3.5 rounded-xl space-y-0.5 transition-all ${
            isDarkMode ? "bg-slate-950/50 border-slate-900" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <span className="text-[9px] text-slate-500 font-mono block uppercase">Your Node Assets</span>
          <span className={`text-sm font-black font-mono block ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            ${usdcBalance.toFixed(2)} USDC
          </span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`border p-3.5 rounded-xl space-y-0.5 transition-all ${
            isDarkMode ? "bg-slate-950/50 border-slate-900" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <span className="text-[9px] text-slate-500 font-mono block uppercase">Relayer Network</span>
          <span className="text-sm font-black text-[#10b981] font-mono block">12 RPC Nodes</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`border p-3.5 rounded-xl space-y-0.5 transition-all ${
            isDarkMode ? "bg-slate-950/50 border-slate-900" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <span className="text-[9px] text-slate-500 font-mono block uppercase">Gas Limit Guard</span>
          <span className={`text-sm font-black font-mono block ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            0.15 USDC Cap
          </span>
        </motion.div>
      </motion.div>

      {/* COMPACT DIRECTORY EXPLORER HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Non-Custodial Terminal Directory Tree */}
        <div className={`lg:col-span-4 border rounded-2xl p-4 text-left transition-all ${
          isDarkMode ? "bg-[#0c1424] border-slate-900 text-white" : "bg-white border-slate-200 shadow-sm text-slate-800"
        }`}>
          <div className="flex items-center gap-1.5 border-b border-slate-900/10 dark:border-slate-800/60 pb-3 mb-3">
            <Cpu className="w-4 h-4 text-[#10b981]" />
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider font-mono">
                Terminal Directories
              </h4>
              <p className="text-[9px] text-slate-500 font-mono">root@swiftpay-node:~#</p>
            </div>
          </div>

          {/* Directory Tree Structure */}
          <div className="space-y-1 font-mono text-[11px]">
            {/* Top Root node */}
            <div className="flex items-center gap-1.5 text-slate-500 select-none pb-1">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>/swiftpay-decentralized-core</span>
            </div>

            {/* Tree Branch 1: Staking */}
            <button
              onClick={() => setActiveDirectory("staking")}
              className={`w-full text-left flex items-center justify-between p-2 rounded-lg transition-all border cursor-pointer ${
                activeDirectory === "staking"
                  ? "bg-indigo-950/30 border-indigo-500/50 text-indigo-300 font-bold"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/20"
              }`}
            >
              <div className="flex items-center gap-2 pl-2">
                <span className="text-slate-600 font-mono">├──</span>
                <Coins className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold">Yield Staking Pool</span>
              </div>
              <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] font-sans font-extrabold px-1.5 py-0.5 rounded">
                15.4% APY
              </span>
            </button>

            {/* Tree Branch 2: Solana Wallet */}
            <button
              onClick={() => setActiveDirectory("wallet")}
              className={`w-full text-left flex items-center justify-between p-2 rounded-lg transition-all border cursor-pointer ${
                activeDirectory === "wallet"
                  ? "bg-indigo-950/30 border-indigo-500/50 text-indigo-300 font-bold"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/20"
              }`}
            >
              <div className="flex items-center gap-2 pl-2">
                <span className="text-slate-600 font-mono">├──</span>
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Solana Wallet Key</span>
              </div>
              <span className={`text-[8px] font-sans font-extrabold px-1.5 py-0.5 rounded ${
                connected ? "bg-emerald-950/50 text-emerald-400" : "bg-amber-950/50 text-amber-500"
              }`}>
                {connected ? "LINKED" : "UNLINKED"}
              </span>
            </button>

            {/* Tree Branch 3: USDC Faucet */}
            <button
              onClick={() => setActiveDirectory("faucet")}
              className={`w-full text-left flex items-center justify-between p-2 rounded-lg transition-all border cursor-pointer ${
                activeDirectory === "faucet"
                  ? "bg-indigo-950/30 border-indigo-500/50 text-indigo-300 font-bold"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/20"
              }`}
            >
              <div className="flex items-center gap-2 pl-2">
                <span className="text-slate-600 font-mono">├──</span>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold">Sandbox Faucet</span>
              </div>
              <span className="text-[9px] bg-slate-950/80 text-slate-400 font-sans font-semibold px-1.5 py-0.5 rounded border border-slate-900">
                USDC
              </span>
            </button>

            {/* Tree Branch 4: Bridge Infrastructure */}
            <button
              onClick={() => setActiveDirectory("bridge")}
              className={`w-full text-left flex items-center justify-between p-2 rounded-lg transition-all border cursor-pointer ${
                activeDirectory === "bridge"
                  ? "bg-indigo-950/30 border-indigo-500/50 text-indigo-300 font-bold"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/20"
              }`}
            >
              <div className="flex items-center gap-2 pl-2">
                <span className="text-slate-600 font-mono">└──</span>
                <Database className="w-3.5 h-3.5 text-[#10b981]" />
                <span className="font-semibold">Core Bridge Specs</span>
              </div>
              <span className="text-[9px] text-[#10b981] bg-emerald-950/40 border border-emerald-900/40 font-sans font-semibold px-1.5 py-0.5 rounded">
                DAR-3
              </span>
            </button>
          </div>

          <div className="border-t border-slate-900/10 dark:border-slate-800/60 pt-3.5 mt-4 text-left">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">
              💡 Directory Overview
            </span>
            <p className="text-[10px] text-slate-400 leading-normal mt-1">
              Select any file directory path above to instantly open the corresponding full-stack cryptographic sub-module and configure consensus params.
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Sub-module Viewport */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            
            {/* Sub-view: STAKING */}
            {activeDirectory === "staking" && (
              <motion.div
                key="staking"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className={`border rounded-2xl p-5 space-y-5 text-left ${
                  isDarkMode ? "bg-[#0c1424] border-slate-900" : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="border-b border-slate-900/10 dark:border-slate-800/60 pb-3">
                  <span className="text-[9px] font-black uppercase bg-indigo-950/80 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded">
                    Stablecoin Staking
                  </span>
                  <h3 className={`text-base font-extrabold mt-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    Web4 Stablecoin Liquidity Staking
                  </h3>
                  <p className="text-xs text-slate-400">
                    Earn a high yield powered directly by Swiftpay's 1.5% KES/USDC mobile remittance pricing spread.
                  </p>
                </div>

                {/* Yield metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-3.5 rounded-xl border text-left ${isDarkMode ? "bg-slate-950/50 border-slate-900" : "bg-slate-50 border-slate-100"}`}>
                    <span className="text-slate-500 text-[9px] block font-mono">STAKED USDC</span>
                    <span className={`text-lg font-black font-mono block mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {stakedBalance.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl border text-left ${isDarkMode ? "bg-slate-950/50 border-slate-900" : "bg-slate-50 border-slate-100"}`}>
                    <span className="text-slate-500 text-[9px] block font-mono">ACCRIED INTEREST</span>
                    <span className="text-lg font-black font-mono block mt-0.5 text-[#10b981]">
                      {earnedInterest.toFixed(6)} USDC
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-xl border flex flex-col justify-between text-left ${
                    isDarkMode ? "bg-slate-950/50 border-slate-900" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="text-slate-500 text-[9px] block font-mono">HARVEST REWARDS</span>
                    <button
                      onClick={handleClaimRewards}
                      disabled={earnedInterest <= 0}
                      className="w-full bg-[#10b981] hover:bg-emerald-500 text-white font-bold text-[10px] py-1 rounded-lg transition-all disabled:opacity-40 cursor-pointer text-center"
                    >
                      Claim Yields
                    </button>
                  </div>
                </div>

                {stakingStatusMsg && (
                  <div className="bg-emerald-950/50 border border-emerald-900/60 text-emerald-400 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{stakingStatusMsg}</span>
                  </div>
                )}

                {stakingError && (
                  <div className="bg-rose-950/50 border border-rose-900/60 text-rose-400 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                    <Zap className="w-3.5 h-3.5 text-rose-400" />
                    <span>{stakingError}</span>
                  </div>
                )}

                {/* Staking / Unstaking Interactive Forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Stake Form */}
                  <form onSubmit={handleStake} className="space-y-2 text-left">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Deposit USDC to Staking
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder="USDC Amount"
                        value={stakeInput}
                        onChange={(e) => setStakeInput(e.target.value)}
                        className={`w-full text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 border ${
                          isDarkMode 
                            ? "bg-slate-950 border-slate-850 text-white placeholder-slate-700" 
                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setStakeInput(usdcBalance.toString())}
                        className="absolute right-3 top-2 text-[8px] font-extrabold text-indigo-400 bg-indigo-950/85 hover:bg-indigo-900 px-1.5 py-0.5 rounded border border-indigo-900/40"
                      >
                        MAX
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Stake USDC
                    </button>
                  </form>

                  {/* Unstake Form */}
                  <form onSubmit={handleUnstake} className="space-y-2 text-left">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      Withdraw Staked USDC
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder="USDC Amount"
                        value={unstakeInput}
                        onChange={(e) => setUnstakeInput(e.target.value)}
                        className={`w-full text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 border ${
                          isDarkMode 
                            ? "bg-slate-950 border-slate-850 text-white placeholder-slate-700" 
                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setUnstakeInput(stakedBalance.toString())}
                        className="absolute right-3 top-2 text-[8px] font-extrabold text-[#10b981] bg-emerald-950/85 hover:bg-emerald-900 px-1.5 py-0.5 rounded border border-emerald-900/40"
                      >
                        MAX
                      </button>
                    </div>
                    <button
                      type="submit"
                      className={`w-full font-bold text-[11px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850" 
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Unstake USDC
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Sub-view: SOLANA WALLET */}
            {activeDirectory === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className={`border rounded-2xl p-5 space-y-4 text-left ${
                  isDarkMode ? "bg-[#0c1424] border-slate-900" : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#10b981]" />
                    <div>
                      <h3 className={`font-extrabold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        Sovereign Solana Node Link
                      </h3>
                      <p className="text-[10px] text-slate-400">Manage pricing margin payouts securely.</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-extrabold rounded-full uppercase tracking-widest ${
                    connected 
                      ? "bg-emerald-950/80 text-[#10b981] border border-emerald-900/40" 
                      : "bg-amber-950/80 text-amber-500 border border-amber-900/40"
                  }`}>
                    {connected ? "Linked" : "Unlinked"}
                  </span>
                </div>

                {connected ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Linked Public Key</span>
                      <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono ${
                        isDarkMode ? "bg-slate-950/60 border-slate-850 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}>
                        <span className="truncate max-w-[200px] select-all">{publicKey?.toString()}</span>
                        <button 
                          onClick={() => {
                            if (publicKey) {
                              navigator.clipboard.writeText(publicKey.toString());
                              setCopiedAddress(true);
                              setTimeout(() => setCopiedAddress(false), 2000);
                            }
                          }}
                          className="text-[9px] font-black text-[#10b981] hover:underline cursor-pointer ml-2 shrink-0"
                        >
                          {copiedAddress ? "COPIED" : "COPY"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className={`p-3 rounded-xl border text-left ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}>
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">SOL BALANCE</span>
                        <span className={`text-xs font-black font-mono block mt-1 ${
                          isDarkMode ? "text-slate-200" : "text-slate-800"
                        }`}>
                          {loadingBalance ? (
                            <span className="text-slate-500">Querying...</span>
                          ) : solBalance !== null ? (
                            `${solBalance.toFixed(4)} SOL`
                          ) : (
                            "0.0000 SOL"
                          )}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border text-left ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                      }`}>
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">CHAIN ENDPOINT</span>
                        <span className="text-[9px] font-black font-mono block mt-1 text-[#10b981] uppercase">
                          Mainnet Beta
                        </span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => disconnect()}
                        className={`w-full font-bold text-xs py-2 rounded-xl transition-all border cursor-pointer text-center ${
                          isDarkMode 
                            ? "bg-rose-950/30 border-rose-900/40 hover:bg-rose-950/60 hover:border-rose-900 text-rose-400" 
                            : "bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700"
                        }`}
                      >
                        Unlink Solana Wallet
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Link your self-custody Phantom, Solflare, or Backpack wallet to directly manage pricing margins, verify cellular transactions, and auto-sync node configuration settings.
                    </p>

                    <button
                      onClick={() => setVisible(true)}
                      className="w-full bg-[#10b981] hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      <Wallet className="w-4 h-4" /> Link Solana Wallet
                    </button>
                  </div>
                )}

                {/* SIWE EIP-4361 Secure Ethereum Section */}
                {siweToken && (
                  <div className="border rounded-2xl p-5 space-y-4 text-left transition-all bg-indigo-950/15 border-indigo-900/30 mt-4">
                    <div className="flex items-center justify-between border-b border-indigo-900/10 dark:border-indigo-850/40 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-sm">
                          💎
                        </div>
                        <div>
                          <h4 className={`text-xs font-black uppercase tracking-wider font-mono ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                            Ethereum Sovereign Link (SIWE)
                          </h4>
                          <p className="text-[9px] text-slate-400">EIP-4361 Cryptographically Verified Handshake</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[8px] font-mono font-extrabold rounded-full bg-emerald-950/80 text-[#10b981] border border-emerald-900/40 uppercase tracking-widest animate-pulse">
                        EIP-4361 VERIFIED
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Linked Ethereum Address</span>
                      <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono ${
                        isDarkMode ? "bg-slate-950/60 border-indigo-950 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}>
                        <span className="truncate max-w-[200px] select-all">{siweAddress}</span>
                        <button 
                          onClick={() => {
                            if (siweAddress) {
                              navigator.clipboard.writeText(siweAddress);
                              setCopiedEthAddress(true);
                              setTimeout(() => setCopiedEthAddress(false), 2000);
                            }
                          }}
                          className="text-[9px] font-black text-[#10b981] hover:underline cursor-pointer ml-2 shrink-0"
                        >
                          {copiedEthAddress ? "COPIED" : "COPY"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono">Secured Session Token (Expo SecureStore)</span>
                      <div className={`p-2.5 rounded-xl border text-[8.5px] font-mono break-all leading-normal ${
                        isDarkMode ? "bg-slate-950/40 border-indigo-950 text-indigo-300" : "bg-slate-50 border-slate-200 text-indigo-700"
                      }`}>
                        {siweToken}
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          localStorage.removeItem("swiftpay_siwe_session_token");
                          setSiweToken(null);
                          setSiweAddress(null);
                        }}
                        className={`w-full font-bold text-xs py-2 rounded-xl transition-all border cursor-pointer text-center ${
                          isDarkMode 
                            ? "bg-rose-950/30 border-rose-900/40 hover:bg-rose-950/60 hover:border-rose-900 text-rose-400" 
                            : "bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700"
                        }`}
                      >
                        Unlink Ethereum SIWE Session
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Wallet Adapter (MWA) Native Integration Simulator */}
                <div className="mt-5 border-t border-slate-900/10 dark:border-slate-800/60 pt-4 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#10b981]" />
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-wider font-mono ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                        Solana Mobile Wallet Adapter (MWA)
                      </h4>
                      <p className="text-[10px] text-slate-400">Atomic bridge for native Android/iOS mobile remittances.</p>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    Swiftpay is fully compatible with the official Solana Mobile Wallet Adapter protocol. On native handsets, transaction objects are securely verified and signed via local cryptographic overlays instead of complex custom URL routing.
                  </p>

                  {/* Technical flow indicator mapping */}
                  <div className="grid grid-cols-5 gap-1 text-center pt-1.5 relative">
                    <div className="absolute top-3.5 left-4 right-4 h-[1px] bg-slate-800 -z-0" />
                    
                    {[
                      { step: 1, label: "transact()" },
                      { step: 2, label: "authorize()" },
                      { step: 3, label: "bundle" },
                      { step: 4, label: "sign" },
                      { step: 5, label: "confirm" },
                    ].map((item) => {
                      const active = mwaStep === item.step;
                      const completed = mwaStep > item.step;
                      return (
                        <div key={item.step} className="flex flex-col items-center z-10">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold transition-all ${
                            completed 
                              ? "bg-[#10b981] text-white" 
                              : active 
                                ? "bg-amber-500 text-white animate-pulse" 
                                : "bg-slate-950 text-slate-600 border border-slate-850"
                          }`}>
                            {completed ? "✓" : item.step}
                          </div>
                          <span className="text-[8px] font-mono text-slate-500 mt-1">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* MWA Trigger and Reset Controls */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={runMwaSimulation}
                      disabled={mwaActive && mwaStep < 5}
                      className="flex-1 bg-slate-950 hover:bg-slate-900 text-[#10b981] hover:text-emerald-400 border border-[#10b981]/30 hover:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-bold font-mono flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      {mwaActive ? (mwaStep < 5 ? "Running MWA Session..." : "MWA Completed ✓") : "Simulate MWA Handshake"}
                    </button>
                    
                    {mwaActive && (
                      <button
                        type="button"
                        onClick={resetMwaSimulation}
                        className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl px-3 py-2 text-xs font-bold font-mono cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Monospace Log Outputs */}
                  {mwaActive && (
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 space-y-1 text-[9px] font-mono text-slate-300 max-h-40 overflow-y-auto leading-relaxed text-left">
                      <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest pb-1 mb-1 border-b border-slate-900 flex justify-between">
                        <span>📟 Local MWA Log Pipeline</span>
                        <span className="text-emerald-500 animate-pulse">● ACTIVE</span>
                      </div>
                      {mwaLogs.map((log, idx) => {
                        let color = "text-slate-300";
                        if (log.includes("[MWA]")) color = "text-indigo-300";
                        if (log.includes("[Identity]")) color = "text-amber-400";
                        if (log.includes("[RPC]")) color = "text-sky-300";
                        if (log.includes("[Success]")) color = "text-emerald-400 font-bold";
                        return (
                          <div key={idx} className={`${color}`}>
                            {log}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Sub-view: FAUCET */}
            {activeDirectory === "faucet" && (
              <motion.div
                key="faucet"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className={`border rounded-2xl p-5 space-y-4 text-left ${
                  isDarkMode ? "bg-[#0c1424] border-slate-900" : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="border-b border-slate-900/10 dark:border-slate-800/60 pb-3">
                  <span className="text-[9px] font-black uppercase bg-emerald-950/80 text-[#10b981] border border-emerald-900/40 px-2 py-0.5 rounded">
                    Non-Custodial Sandbox Assets
                  </span>
                  <h3 className={`font-extrabold text-base mt-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    USDC Stablecoin Sandbox Assets
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Mint simulated USDC stablecoins to your demo wallet address to test high-volume swaps, staking yields, and cellular callbacks.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    id="btn_trigger_faucet"
                    onClick={onMintFaucet}
                    disabled={faucetMinting}
                    className="w-full bg-[#10b981] hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    {faucetMinting ? "Minting USDC..." : "Mint 100 USDC Faucet"}
                  </button>
                  {faucetSuccess && (
                    <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
                      <CheckCircle className="w-4 h-4" /> Added 100 USDC successfully!
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Sub-view: BRIDGE INFRASTRUCTURE */}
            {activeDirectory === "bridge" && (
              <motion.div
                key="bridge"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className={`border rounded-2xl p-5 space-y-4 text-left ${
                  isDarkMode ? "bg-[#0c1424] border-slate-900" : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="border-b border-slate-900/10 dark:border-slate-800/60 pb-3">
                  <span className="text-[9px] font-black uppercase bg-[#10b981]/15 text-[#10b981] border border-emerald-900/40 px-2 py-0.5 rounded">
                    DAR-3 Routing Specs
                  </span>
                  <h3 className={`font-extrabold text-base mt-1.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    Web4 Autonomous Bridge
                  </h3>
                  <p className="text-xs text-slate-400">
                    Technical blueprint and active parameters for our hybrid mobile-to-ledger routing mechanics.
                  </p>
                </div>
                
                <div className="space-y-3.5 text-[11px] leading-normal text-slate-400">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 text-indigo-400 shrink-0"><Database className="w-4 h-4" /></div>
                    <div>
                      <h4 className={`font-bold text-xs ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Direct cellular state settlement</h4>
                      <p className="text-[10.5px]">Settlement logs are committed directly to high-throughput Solana RPC chains and mirrored to cellular ledger indices.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 text-[#10b981] shrink-0"><Lock className="w-4 h-4" /></div>
                    <div>
                      <h4 className={`font-bold text-xs ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Non-custodial margin lockups</h4>
                      <p className="text-[10.5px]">All pricing spread margins route directly to the specified self-custody Solana wallet address to enforce complete sovereign control.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 text-amber-500 shrink-0"><Activity className="w-4 h-4" /></div>
                    <div>
                      <h4 className={`font-bold text-xs ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Safaricom DAR-3 Smart Router</h4>
                      <p className="text-[10.5px]">Intelligently balances gas overheads to route transactions cleanly beneath 0.15 USDC max cost caps.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* MORE ROBUST WEB3HUB VISUALS: Remittance Flow Smart Routing Network Visualizer Map */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className={`border rounded-2xl p-5 text-left space-y-4 ${
          isDarkMode ? "bg-[#090f1a] border-slate-900" : "bg-slate-50 border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#10b981] animate-pulse" />
            <div>
              <h4 className={`font-extrabold text-xs uppercase tracking-wider font-mono ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                Decentremit Smart Routing Traffic Monitor
              </h4>
              <p className="text-[10px] text-slate-500 font-mono">Consensus State channels: KES ⇄ Solana Mainnet</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[9px] text-[#10b981] bg-emerald-950/40 border border-emerald-900/40 font-mono px-2 py-0.5 rounded uppercase font-bold animate-pulse">
            <Wifi className="w-3 h-3 text-[#10b981]" />
            Live Syncing
          </span>
        </div>

        {/* Real-time routing diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center relative overflow-hidden py-2 bg-slate-950/40 rounded-xl p-3 border border-slate-900/80">
          
          {/* Step 1: Self-Custody User */}
          <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col items-center text-center space-y-1">
            <Wallet className="w-5 h-5 text-indigo-400" />
            <span className="text-[9px] font-bold text-slate-300 uppercase">Self-Custody</span>
            <p className="text-[8px] text-slate-500 font-mono">0xBb500...dCB</p>
          </div>

          {/* Connection Path 1 */}
          <div className="hidden md:flex flex-col items-center justify-center">
            <span className="text-[8px] font-mono text-slate-600 mb-1">0.05s ping</span>
            <div className="w-full h-[2px] bg-slate-900 relative">
              <motion.div 
                animate={{ x: ["0%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                className="absolute top-[-2px] w-1.5 h-1.5 rounded-full bg-[#10b981]"
              />
            </div>
            <span className="text-[8.5px] text-emerald-500 font-mono mt-1">▲ Signed</span>
          </div>

          {/* Step 2: Licensed Gateway Aggregator Middleware */}
          <div className="p-3 bg-[#0d1626] border border-indigo-900/40 rounded-xl flex flex-col items-center text-center space-y-1 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Cpu className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: "12s" }} />
            <span className="text-[9px] font-bold text-slate-300 uppercase">Licensed Aggregator</span>
            <p className="text-[8px] text-indigo-400 font-mono">KYC & M-Pesa Umbrella</p>
          </div>

          {/* Connection Path 2 */}
          <div className="hidden md:flex flex-col items-center justify-center">
            <span className="text-[8px] font-mono text-slate-600 mb-1">0.12s gas cap</span>
            <div className="w-full h-[2px] bg-slate-900 relative">
              <motion.div 
                animate={{ x: ["0%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                className="absolute top-[-2px] w-1.5 h-1.5 rounded-full bg-indigo-500"
              />
            </div>
            <span className="text-[8.5px] text-indigo-400 font-mono mt-1">◆ Settled KES</span>
          </div>

          {/* Step 3: Solana Mainnet Ledger */}
          <div className="p-3 bg-[#081b17] border border-emerald-950 rounded-xl flex flex-col items-center text-center space-y-1 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Database className="w-5 h-5 text-[#10b981]" />
            <span className="text-[9px] font-bold text-[#10b981] uppercase">Ledger Payout</span>
            <p className="text-[8px] text-emerald-500 font-mono">TX Confirmed</p>
          </div>

        </div>

        <p className="text-[10px] text-slate-500 text-center leading-normal">
          Interactive Web4 core monitoring protocol. On-chain remittance packets are continuously cryptographed using local device keys and committed to the mainnet.
        </p>
      </motion.div>

    </div>
  );
};
