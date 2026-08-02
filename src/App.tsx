import React, { useState, useEffect } from "react";
import axios from "axios";
import { NetworkStatus } from "./components/NetworkStatus";
import { QuoteSection } from "./components/QuoteSection";
import { SimulationControls } from "./components/SimulationControls";
import { TransactionHistory } from "./components/TransactionHistory";
import { Splash } from "./components/Splash";
import { Onboarding } from "./components/Onboarding";
import { Login } from "./components/Login";
import { SupportHub } from "./components/SupportHub";
import { Web3Hub } from "./components/Web3Hub";
import { GoogleDriveBackup } from "./components/GoogleDriveBackup";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { OwnerControlPanel } from "./components/OwnerControlPanel";
import { SystemRates, Transaction } from "./types";
import {
  Coins,
  ShieldCheck,
  Activity,
  HelpCircle,
  TrendingUp,
  Wifi,
  Globe,
  ShieldAlert,
  ArrowUpRight,
  Database,
  RefreshCw,
  LogOut,
  User,
  History,
  Network,
  Home,
  MessageSquare,
  Sparkles,
  DollarSign,
  PlusCircle,
  ArrowRight,
  CheckCircle,
  Smartphone,
  BookOpen,
  Settings,
  Sun,
  Moon,
  Building,
  Store,
  X,
  Heart,
  Wallet,
  QrCode,
  ScanLine,
  Fingerprint,
  ChevronDown,
  Mail
} from "lucide-react";

export default function App() {
  const { publicKey: solPublicKey, disconnect: disconnectSolWallet, connected: isSolWalletConnected } = useWallet();
  const { setVisible: setSolWalletModalVisible } = useWalletModal();

  // Navigation & Screen control states
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"history" | "web3" | "home" | "support" | "profile">("home");
  const [profileSubTab, setProfileSubTab] = useState<"limits" | "security">("limits");
  const [selectedSpecFile, setSelectedSpecFile] = useState<"rn" | "server" | "config">("rn");
  const [sandboxUsername, setSandboxUsername] = useState("anon_user_9f83a21c");
  const [sandboxOptions, setSandboxOptions] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  
  // Home dynamic view switcher
  const [homeView, setHomeView] = useState<"dashboard" | "stk_push_swap" | "p2p_billing">("dashboard");

  // Controlled QuoteSection states for granular M-Pesa / Airtel home selections
  const [payoutChannel, setPayoutChannel] = useState<"mpesa" | "cashapp">("mpesa");
  const [paymentType, setPaymentType] = useState<"send_money" | "paybill" | "till" | "stk_push">("send_money");
  const [payoutProvider, setPayoutProvider] = useState<"safaricom" | "airtel">("safaricom");

  // Lifted form inputs for QuoteSection pre-filling
  const [phone, setPhone] = useState("");
  const [recipientTag, setRecipientTag] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("1000");
  const [senderWallet, setSenderWallet] = useState("");
  const [paybillNumber, setPaybillNumber] = useState("222222");
  const [paybillAccount, setPaybillAccount] = useState("SWIFTPAY");
  const [tillNumber, setTillNumber] = useState("543210");

  // Theme & Modals
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selfCustodySolAddress, setSelfCustodySolAddress] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Core application states
  const [rates, setRates] = useState<SystemRates | null>(null);
  const [selectedChain, setSelectedChain] = useState<"ETH" | "POLYGON" | "BASE" | "SOL" | "TAPROOT">("POLYGON");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  // Web3 Hub & Wallet simulated balances
  const [usdcBalance, setUsdcBalance] = useState<number>(2450.0);
  const [reservePool, setReservePool] = useState<number>(854000);
  const [faucetMinting, setFaucetMinting] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);

  // Support section ticket state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // P2P billing generator state
  const [p2pPhone, setP2pPhone] = useState("");
  const [p2pAmount, setP2pAmount] = useState("10");
  const [generatedLink, setGeneratedLink] = useState("");

  // Interactive Header & Web3 Stats states
  const [showHeaderStats, setShowHeaderStats] = useState(false);
  const [blockHeight, setBlockHeight] = useState(291481209);
  const [simLatency, setSimLatency] = useState(42);

  // Profile Settings Edit States & Local persistence handlers
  const [editUserTag, setEditUserTag] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWalletAddress, setEditWalletAddress] = useState("");
  const [editPin, setEditPin] = useState("");
  const [profileSettingsSuccess, setProfileSettingsSuccess] = useState("");
  const [copiedDonationAddr, setCopiedDonationAddr] = useState<string | null>(null);

  useEffect(() => {
    if (loggedUser) {
      setEditUserTag(loggedUser.startsWith("@") ? loggedUser.slice(1) : loggedUser);
      if (!loggedUser.startsWith("@")) {
        setEditWalletAddress(loggedUser);
      }
      
      // Load stored profile email if available
      const stored = localStorage.getItem("swiftpay_local_profiles_v2");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as any[];
          const isPasskey = loggedUser.startsWith("@");
          const activeLabel = isPasskey ? loggedUser.slice(1) : loggedUser;
          const found = parsed.find(p => p.label === activeLabel || p.address === activeLabel || p.id === activeLabel);
          if (found) {
            if (found.email) setEditEmail(found.email);
            if (found.address) setEditWalletAddress(found.address);
          }
        } catch (e) {
          console.error("Error reading saved email", e);
        }
      }
    }
  }, [loggedUser]);

  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserTag.trim()) return;

    const stored = localStorage.getItem("swiftpay_local_profiles_v2");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as any[];
        const isPasskey = loggedUser.startsWith("@");
        const activeLabel = isPasskey ? loggedUser.slice(1) : loggedUser;
        
        const updated = parsed.map(prof => {
          if (isPasskey && prof.type === "passkey" && prof.label === activeLabel) {
            return {
              ...prof,
              label: editUserTag.trim(),
              id: `pk_${editUserTag.trim()}`,
              email: editEmail.trim(),
              address: editWalletAddress.trim() || prof.address,
              passkeyValue: editPin.trim() || prof.passkeyValue
            };
          }
          if (!isPasskey && prof.type === "crypto" && (prof.address === activeLabel || prof.id === activeLabel)) {
            const newAddress = editWalletAddress.trim() || prof.address;
            return {
              ...prof,
              label: editUserTag.trim(),
              address: newAddress,
              id: newAddress,
              email: editEmail.trim(),
              passkeyValue: editPin.trim() || prof.passkeyValue
            };
          }
          return prof;
        });
        
        localStorage.setItem("swiftpay_local_profiles_v2", JSON.stringify(updated));
        
        if (!isPasskey) {
          const finalAddr = editWalletAddress.trim() || loggedUser;
          setLoggedUser(finalAddr);
          setSenderWallet(finalAddr);
        } else {
          setLoggedUser(`@${editUserTag.trim()}`);
        }
        
        setProfileSettingsSuccess("Profile settings saved successfully!");
        setEditPin("");
        setTimeout(() => setProfileSettingsSuccess(""), 3000);
      } catch (err) {
        console.error("Failed to update profile local storage settings", err);
      }
    } else {
      // No saved profiles array, just update active username in state
      const isPasskey = loggedUser.startsWith("@");
      setLoggedUser(isPasskey ? `@${editUserTag.trim()}` : editUserTag.trim());
      setProfileSettingsSuccess("User tag updated in memory!");
      setEditPin("");
      setTimeout(() => setProfileSettingsSuccess(""), 3000);
    }
  };


  // Fetch rates and transactions from server
  const fetchRates = async () => {
    try {
      const res = await axios.get("/api/rates");
      setRates(res.data);
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/transactions");
      const data = Array.isArray(res.data) ? res.data : [];
      setTransactions(data);
      
      // If there is an active transaction, update its state from the list
      if (activeTx) {
        const updated = data.find((t: Transaction) => t.id === activeTx.id);
        if (updated) {
          setActiveTx(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const handleRestoreTransactions = async (restoredTxs: Transaction[]) => {
    try {
      const res = await axios.post("/api/transactions/restore", { restoredTransactions: restoredTxs });
      if (res.data && res.data.success && Array.isArray(res.data.transactions)) {
        setTransactions(res.data.transactions);
        return true;
      }
    } catch (err) {
      console.error("Failed to post restored transactions:", err);
    }
    return false;
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get("/api/settings");
      if (res.data && res.data.selfCustodySolAddress) {
        setSelfCustodySolAddress(res.data.selfCustodySolAddress);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const handleSaveSettings = async (address: string) => {
    setSettingsSaving(true);
    try {
      await axios.post("/api/settings", { selfCustodySolAddress: address });
      setSelfCustodySolAddress(address);
      if (loggedUser && !loggedUser.startsWith("@")) {
        setLoggedUser(address);
        setSenderWallet(address);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await Promise.all([fetchRates(), fetchTransactions(), fetchSettings()]);
      setLoading(false);
    };
    initLoad();
  }, []);

  // Auto-sync self-custody Solana wallet address with settings was removed to respect manual-only linking policy.

  // Real-time block height ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight((h) => h + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Poll transactions in-flight (every 2 seconds) to reflect background state shifts
  useEffect(() => {
    let interval: any;
    const isTxInFlight = activeTx && !["completed", "failed", "refunded"].includes(activeTx.status);
    
    if (isTxInFlight) {
      interval = setInterval(() => {
        fetchTransactions();
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTx]);

  // Handle payment created by QuoteSection
  const handlePaymentCreated = (paymentData: any) => {
    setActiveTx(paymentData.transaction);
    fetchTransactions();
  };

  // Select transaction from history to view in simulator
  const handleSelectTx = (tx: Transaction) => {
    setActiveTx(tx);
    // Switch to home tab and open STK swap workspace automatically to view simulation
    setActiveTab("home");
    setHomeView("stk_push_swap");
  };

  // Reset or clear active transaction screen
  const handleClearActiveTx = () => {
    setActiveTx(null);
  };

  // Handle custom logins
  const handleLoginSuccess = (emailOrWallet: string) => {
    setLoggedUser(emailOrWallet);
    setIsLoggedIn(true);
  };

  // Handle standard logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedUser("");
    setActiveTab("home");
    setHomeView("dashboard");
  };

  // Mock USDC Faucet trigger
  const triggerUsdcFaucet = () => {
    setFaucetMinting(true);
    setTimeout(() => {
      setUsdcBalance((prev) => prev + 100);
      setFaucetMinting(false);
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 3000);
    }, 1500);
  };

  // Submit mock support ticket
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketSubject("");
      setTicketMessage("");
    }, 4000);
  };

  // Generate P2P billing code link
  const handleGenerateP2pLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p2pPhone || !p2pAmount) return;
    const link = `https://swiftpay.io/pay/${p2pPhone.replace(/\+/g, "")}?amount=${p2pAmount}&guard=1&rail=${selectedChain}`;
    setGeneratedLink(link);
  };



  // Splash Screen State
  if (isSplashActive) {
    return <Splash onComplete={() => { setIsSplashActive(false); setIsOnboardingActive(true); }} />;
  }

  // Onboarding Screen State
  if (isOnboardingActive) {
    return <Onboarding onComplete={() => { setIsOnboardingActive(false); }} />;
  }

  // Login Screen State
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen font-sans antialiased pb-24 transition-colors duration-300 ${
      isDarkMode 
        ? "bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white" 
        : "bg-slate-50 text-slate-900 selection:bg-rose-500 selection:text-white"
    }`}>
      {/* 1. Compact, Asymmetric, and Interactive Top Bar Header Layout */}
      <header id="app_header" className={`sticky top-0 z-30 transition-all duration-300 border-b shadow-[0_4px_12px_rgba(16,185,129,0.04)] ${
        isDarkMode 
          ? "bg-[#090f1d] border-[#10b981]/25 text-white" 
          : "bg-white border-slate-200 text-slate-900"
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          
          {/* Left Brand Area (Asymmetric design & leads back to home) */}
          <div className="flex items-center gap-2">
            <div 
              id="brand_logo_header"
              onClick={() => {
                setActiveTab("home");
                setHomeView("dashboard");
              }}
              className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-all"
            >
              <div className="w-7 h-7 rounded-tl-[12px] rounded-br-[12px] rounded-tr-[4px] bg-[#10b981] text-white flex items-center justify-center font-black text-base shadow-[2px_2px_0px_rgba(16,185,129,0.25)] hover:rotate-6 transition-transform">
                $
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h1 className={`text-sm font-black tracking-tighter uppercase ${isDarkMode ? "text-white" : "text-slate-950"}`}>Swiftpay</h1>
                </div>
                <p className="text-[8px] text-slate-500 hidden sm:block leading-tight">Stablecoin Settlement Node</p>
              </div>
            </div>
          </div>

          {/* Right Compact Menu Cluster (Asymmetric padding and button corners) */}
          <div className="flex items-center gap-1.5">
            
            {/* Wallet Link */}
            <button
              id="btn_solana_wallet_header"
              onClick={() => {
                if (isSolWalletConnected) {
                  disconnectSolWallet();
                } else {
                  setSolWalletModalVisible(true);
                }
              }}
              title={isSolWalletConnected ? "Disconnect Solana Wallet" : "Link Solana Wallet"}
              className={`flex items-center gap-1 px-2 py-1 rounded-tr-[10px] rounded-bl-[10px] rounded-tl-[3px] rounded-br-[3px] border text-[11px] font-semibold transition-all cursor-pointer shadow-[2px_2px_0px_rgba(16,185,129,0.1)] active:scale-95 ${
                isSolWalletConnected
                  ? "bg-emerald-950/35 border-emerald-900 text-emerald-400"
                  : isDarkMode
                    ? "bg-slate-900/85 border-slate-800 text-slate-300 hover:bg-slate-800"
                    : "bg-slate-150 border-slate-300 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Wallet className="w-3 h-3 text-[#10b981]" />
              <span className="text-[10px]">
                {isSolWalletConnected 
                  ? `${solPublicKey?.toString().slice(0, 3)}...${solPublicKey?.toString().slice(-3)}`
                  : "Wallet"
                }
              </span>
            </button>
            
            {/* Theme Toggle */}
            <button
              id="btn_theme_toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
              className={`p-1 rounded-tl-[8px] rounded-br-[8px] rounded-tr-[3px] rounded-bl-[3px] border transition-all cursor-pointer active:scale-95 ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800" 
                  : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Developer Settings */}
            <button
              id="btn_settings_toggle"
              onClick={() => setShowSettingsModal(true)}
              title="Sovereign settings"
              className={`p-1 rounded-tr-[8px] rounded-bl-[8px] rounded-tl-[3px] rounded-br-[3px] border transition-all cursor-pointer active:scale-95 ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                  : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Compact Logout */}
            <button
              id="btn_logout_header"
              onClick={handleLogout}
              title="Sign Out Node"
              className={`p-1 rounded-tr-[8px] rounded-bl-[8px] rounded-tl-[3px] rounded-br-[3px] border transition-all cursor-pointer hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-300 text-slate-600"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Tabbed Workspaces */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        
        {/* Tab content Router */}
        {activeTab === "home" && (
          <div className="space-y-6">
            
            {/* Dynamic Home sub-views */}
            {homeView === "dashboard" && (
              <div className="space-y-6">

                {/* Compact Horizontal Options Menu - 4 Options in 1 Compact Box */}
                <div className={`border rounded-[24px] p-4 sm:p-5 ${isDarkMode ? "bg-[#0c1424] border-slate-900" : "bg-white border-slate-200"} shadow-lg`}>
                  <div className="flex items-center justify-between mb-3.5 px-1.5">
                    <h3 className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-emerald-950"}`}>
                      Select Swapping Channel
                    </h3>
                    <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/30 uppercase font-bold tracking-wide">
                      ⚡ 1% Volatility Shield Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* OPTION 1: Send Money (Safaricom & Airtel) */}
                    <div 
                      id="card_option_send_money"
                      onClick={() => {
                        setPayoutChannel("mpesa");
                        setPaymentType("send_money");
                        setHomeView("stk_push_swap");
                        if (loggedUser && !loggedUser.startsWith("@")) {
                          setSenderWallet(loggedUser);
                        }
                      }}
                      className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden h-full min-h-[140px] ${
                        isDarkMode 
                          ? "bg-slate-950/40 hover:bg-slate-950 border-slate-900 hover:border-emerald-500/40 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)]" 
                          : "bg-slate-50/70 hover:bg-slate-50 border-slate-100 hover:border-emerald-500 text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                      }`}
                    >
                      {/* Top Row: Icon and Badge */}
                      <div className="flex items-center justify-between mb-4 w-full">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                          isDarkMode
                            ? "bg-emerald-950/60 border border-emerald-900/30 text-[#10b981]"
                            : "bg-emerald-50 border border-emerald-100 text-emerald-600"
                        }`}>
                          <User className="w-5 h-5" />
                        </div>
                        <span className={`text-[8px] font-black tracking-widest px-2.5 py-1 rounded-md uppercase font-mono shrink-0 ${
                          isDarkMode
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                            : "bg-emerald-100 text-emerald-700 font-bold"
                        }`}>
                          KES Payout
                        </span>
                      </div>

                      {/* Content */}
                      <div className="text-left space-y-1">
                        <h4 className={`font-black text-sm tracking-tight transition-colors duration-200 ${
                          isDarkMode ? "text-white group-hover:text-emerald-400" : "text-slate-900 group-hover:text-emerald-600"
                        }`}>
                          1. Send Money
                        </h4>
                        <p className={`text-[11px] leading-relaxed font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Direct stablecoin transfer to Safaricom or Airtel mobile lines.
                        </p>
                      </div>
                    </div>

                    {/* OPTION 2: STK Push (Safaricom & Airtel) */}
                    <div 
                      id="card_option_stk_push"
                      onClick={() => {
                        setPayoutChannel("mpesa");
                        setPaymentType("stk_push");
                        setHomeView("stk_push_swap");
                        if (loggedUser && !loggedUser.startsWith("@")) {
                          setSenderWallet(loggedUser);
                        }
                      }}
                      className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden h-full min-h-[140px] ${
                        isDarkMode 
                          ? "bg-slate-950/40 hover:bg-slate-950 border-slate-900 hover:border-indigo-500/40 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)]" 
                          : "bg-slate-50/70 hover:bg-slate-50 border-slate-100 hover:border-indigo-500 text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                      }`}
                    >
                      {/* Top Row: Icon and Badge */}
                      <div className="flex items-center justify-between mb-4 w-full">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                          isDarkMode
                            ? "bg-indigo-950/60 border border-indigo-900/30 text-indigo-400"
                            : "bg-indigo-50 border border-indigo-100 text-indigo-600"
                        }`}>
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <span className={`text-[8px] font-black tracking-widest px-2.5 py-1 rounded-md uppercase font-mono shrink-0 ${
                          isDarkMode
                            ? "bg-indigo-950 text-indigo-400 border border-indigo-900/40"
                            : "bg-indigo-100 text-indigo-700 font-bold"
                        }`}>
                          SIM PUSH
                        </span>
                      </div>

                      {/* Content */}
                      <div className="text-left space-y-1">
                        <h4 className={`font-black text-sm tracking-tight transition-colors duration-200 ${
                          isDarkMode ? "text-white group-hover:text-indigo-400" : "text-slate-900 group-hover:text-indigo-600"
                        }`}>
                          2. STK Push
                        </h4>
                        <p className={`text-[11px] leading-relaxed font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Settle stablecoins via direct SIM toolkit triggering.
                        </p>
                      </div>
                    </div>

                    {/* OPTION 3: Lipa na M-Pesa / Airtel */}
                    <div 
                      id="card_option_lipa_merchant"
                      onClick={() => {
                        setPayoutChannel("mpesa");
                        setPaymentType("paybill");
                        setHomeView("stk_push_swap");
                        if (loggedUser && !loggedUser.startsWith("@")) {
                          setSenderWallet(loggedUser);
                        }
                      }}
                      className={`flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden h-full min-h-[140px] ${
                        isDarkMode 
                          ? "bg-slate-950/40 hover:bg-slate-950 border-slate-900 hover:border-amber-500/40 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)]" 
                          : "bg-slate-50/70 hover:bg-slate-50 border-slate-100 hover:border-amber-500 text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                      }`}
                    >
                      {/* Top Row: Icon and Badge */}
                      <div className="flex items-center justify-between mb-4 w-full">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                          isDarkMode
                            ? "bg-amber-950/60 border border-amber-900/30 text-amber-400"
                            : "bg-amber-50 border border-amber-100 text-amber-600"
                        }`}>
                          <Store className="w-5 h-5" />
                        </div>
                        <span className={`text-[8px] font-black tracking-widest px-2.5 py-1 rounded-md uppercase font-mono shrink-0 ${
                          isDarkMode
                            ? "bg-amber-950 text-amber-400 border border-amber-900/40"
                            : "bg-amber-100 text-amber-700 font-bold"
                        }`}>
                          MERCHANT
                        </span>
                      </div>

                      {/* Content */}
                      <div className="text-left space-y-1">
                        <h4 className={`font-black text-sm tracking-tight transition-colors duration-200 ${
                          isDarkMode ? "text-white group-hover:text-amber-400" : "text-slate-900 group-hover:text-amber-600"
                        }`}>
                          3. Lipa na M-Pesa
                        </h4>
                        <p className={`text-[11px] leading-relaxed font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          Pay store Tills, corporate Service Paybills & utility bills.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STK Push Swaps Active Panel */}
            {homeView === "stk_push_swap" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    id="btn_back_to_dashboard"
                    onClick={() => setHomeView("dashboard")}
                    className="text-xs text-[#10b981] hover:underline flex items-center gap-1.5 cursor-pointer font-bold"
                  >
                    ← Back to Option Dashboard
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT WIDGETS: Rates + Quote section */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="rounded-2xl text-slate-800">
                      <QuoteSection 
                        rates={rates}
                        selectedChain={selectedChain}
                        onPaymentCreated={handlePaymentCreated}
                        activeTxId={activeTx ? activeTx.id : null}
                        loggedUser={loggedUser}
                        payoutChannel={payoutChannel}
                        setPayoutChannel={setPayoutChannel}
                        paymentType={paymentType}
                        setPaymentType={setPaymentType}
                        payoutProvider={payoutProvider}
                        setPayoutProvider={setPayoutProvider}
                        phone={phone}
                        setPhone={setPhone}
                        recipientTag={recipientTag}
                        setRecipientTag={setRecipientTag}
                        recipientName={recipientName}
                        setRecipientName={setRecipientName}
                        amount={amount}
                        setAmount={setAmount}
                        senderWallet={senderWallet}
                        setSenderWallet={setSenderWallet}
                        paybillNumber={paybillNumber}
                        setPaybillNumber={setPaybillNumber}
                        paybillAccount={paybillAccount}
                        setPaybillAccount={setPaybillAccount}
                        tillNumber={tillNumber}
                        setTillNumber={setTillNumber}
                      />
                    </div>
                  </div>

                  {/* RIGHT WIDGETS: Active Simulator Handset Controls */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className={`border rounded-2xl p-5 shadow-sm ${isDarkMode ? "bg-[#0c1424] border-slate-900" : "bg-white border-slate-200"}`}>
                      <SimulationControls 
                        activeTx={activeTx}
                        onRefreshActiveTx={fetchTransactions}
                        onClearActiveTx={handleClearActiveTx}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* P2P Invoice Billing Generator Sub-view */}
            {homeView === "p2p_billing" && (
              <div className="max-w-2xl mx-auto bg-[#0c1424] border border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setHomeView("dashboard")}
                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    ← Back to Options
                  </button>
                  <span className="text-[10px] font-bold bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded">Invoice Tool</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Generate Decentralized KES Invoices</h3>
                  <p className="text-xs text-slate-400">
                    Create secure stablecoin requests. When your payer pays the on-chain request, Swiftpay will instantly trigger local M-Pesa routing to your handset.
                  </p>
                </div>

                <form onSubmit={handleGenerateP2pLink} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Your Mobile Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0712345678"
                        value={p2pPhone}
                        onChange={(e) => setP2pPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Invoiced Amount (USDC)
                      </label>
                      <input
                        type="number"
                        placeholder="10"
                        value={p2pAmount}
                        onChange={(e) => setP2pAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all"
                  >
                    Generate non-custodial Billing Link
                  </button>
                </form>

                {generatedLink && (
                  <div className="bg-slate-950 rounded-2xl p-5 border border-slate-850 space-y-3">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Generated Pay Link</p>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-850 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-300 truncate select-all mr-4">{generatedLink}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedLink)}
                        className="text-[10px] text-[#10b981] hover:underline shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Share this invoice link with anyone. Once they approve on-chain, KES settlements route straight into your mobile wallet.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex justify-start">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setHomeView("dashboard");
                }}
                className={`text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-colors ${
                  isDarkMode ? "text-[#10b981] hover:text-emerald-400" : "text-black hover:text-slate-700"
                }`}
              >
                ← Back to Home Dashboard
              </button>
            </div>
            <div className={`border rounded-3xl p-6 shadow-sm ${
              isDarkMode ? "bg-[#0c1424] border-slate-900" : "bg-white border-slate-200"
            }`}>
              <div className={`flex justify-between items-center pb-4 mb-6 border-b ${
                isDarkMode ? "border-slate-900" : "border-slate-100"
              }`}>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Consolidated Node Ledger</h3>
                  <p className="text-xs text-slate-400">Complete log of stablecoin incoming invoices and Daraja M-Pesa push triggers</p>
                </div>
                <button
                  onClick={fetchTransactions}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border-slate-850" 
                      : "bg-white hover:bg-slate-50 text-slate-600 hover:text-[#10b981] border-slate-200"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <TransactionHistory
                transactions={transactions}
                onRefresh={fetchTransactions}
                onSelectTx={handleSelectTx}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* Web3 Hub Tab */}
        {activeTab === "web3" && (
          <div className="space-y-4">
            <div className="flex justify-start">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setHomeView("dashboard");
                }}
                className={`text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-colors ${
                  isDarkMode ? "text-[#10b981] hover:text-emerald-400" : "text-black hover:text-slate-700"
                }`}
              >
                ← Back to Home Dashboard
              </button>
            </div>
            <Web3Hub 
              isDarkMode={isDarkMode}
              usdcBalance={usdcBalance}
              reservePool={reservePool}
              onMintFaucet={triggerUsdcFaucet}
              faucetMinting={faucetMinting}
              faucetSuccess={faucetSuccess}
            />
          </div>
        )}

        {/* Support Tab */}
        {activeTab === "support" && (
          <div className="space-y-4">
            <div className="flex justify-start">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setHomeView("dashboard");
                }}
                className={`text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-colors ${
                  isDarkMode ? "text-[#10b981] hover:text-emerald-400" : "text-black hover:text-slate-700"
                }`}
              >
                ← Back to Home Dashboard
              </button>
            </div>
            <SupportHub isDarkMode={isDarkMode} loggedUser={loggedUser} />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className={`max-w-3xl mx-auto rounded-3xl p-6 sm:p-8 space-y-8 transition-colors duration-300 border ${
            isDarkMode ? "bg-[#0c1424] border-slate-900 text-white" : "bg-white border-black border-2 text-black"
          }`}>
            <div className="flex justify-start">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setHomeView("dashboard");
                }}
                className={`text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-colors ${
                  isDarkMode ? "text-[#10b981] hover:text-emerald-400" : "text-black hover:text-slate-700"
                }`}
              >
                ← Back to Home Dashboard
              </button>
            </div>
            
            {/* Header / Identity */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
              isDarkMode ? "border-slate-900" : "border-black"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl uppercase ${
                  isDarkMode ? "bg-[#10b981] text-white" : "bg-black text-white"
                }`}>
                  {loggedUser ? (loggedUser.startsWith("@") ? loggedUser.slice(1, 2) : loggedUser.slice(0, 1)) : "A"}
                </div>
                <div className="text-left">
                  <h3 className={`text-xl font-extrabold ${isDarkMode ? "text-white" : "text-black"}`}>
                    {loggedUser || "anonymous"}
                  </h3>
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Non-Custodial Sovereign Account
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                      Live Sovereign Node
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* OWNER CONTROL PANEL (PROTECTED ACCESS) */}
            <OwnerControlPanel 
              isDarkMode={isDarkMode} 
              solPublicKey={solPublicKey ? solPublicKey.toString() : null} 
            />

            {/* SECTION 1: ACCOUNT SETTINGS */}
            <div className="space-y-4">
              <div className="text-left space-y-1">
                <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#10b981]" />
                  Sovereign Identity Settings
                </h4>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Modify your user tag handle and secure digit authentication PIN locally.
                </p>
              </div>

              {profileSettingsSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs text-center flex items-center justify-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4" />
                  <span>{profileSettingsSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfileSettings} className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name/Tag Edit field */}
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                      User Identifier (Tag / Username)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. My Ledger, RemitAgent"
                      value={editUserTag}
                      onChange={(e) => setEditUserTag(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#10b981] ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-900 text-white placeholder-slate-700" 
                          : "bg-white border-black text-black placeholder-slate-400 font-bold"
                      }`}
                    />
                  </div>

                  {/* Email Attached (Optional) field */}
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                      Email Attached (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. user@domain.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#10b981] ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-900 text-white placeholder-slate-700" 
                          : "bg-white border-black text-black placeholder-slate-400 font-bold"
                      }`}
                    />
                  </div>

                  {/* Pin Code field */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                      Change Authentication PIN (Pincode - Digits Only)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Enter new 4 or 6 digit PIN code"
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value.replace(/[^0-9]/g, ""))}
                      className={`w-full border rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#10b981] ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-900 text-white placeholder-slate-700" 
                          : "bg-white border-black text-black placeholder-slate-400 font-bold"
                      }`}
                    />
                  </div>


                  {/* Manual Crypto Wallet Link field (Available for all users) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                        Manual Sovereign Crypto Wallet Link (Solana / EVM Address)
                      </label>
                      {solPublicKey && (
                        <button
                          type="button"
                          onClick={() => setEditWalletAddress(solPublicKey.toString())}
                          className="text-[9px] text-[#10b981] font-bold hover:underline cursor-pointer"
                        >
                          [Fill Connected SOL: {solPublicKey.toString().slice(0, 6)}...]
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Enter or paste your Solana public key or EVM 0x address"
                      value={editWalletAddress}
                      onChange={(e) => setEditWalletAddress(e.target.value.trim())}
                      className={`w-full border rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#10b981] ${
                        isDarkMode 
                          ? "bg-slate-950 border-slate-900 text-white placeholder-slate-700" 
                          : "bg-white border-black text-black placeholder-slate-400 font-bold"
                      }`}
                    />
                    <p className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                      Link your self-custody wallet address to receive automatic on-chain invoice payouts & stablecoin settlements.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full sm:w-auto px-6 py-3 font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer ${
                    isDarkMode
                      ? "bg-[#10b981] hover:bg-emerald-500 text-white"
                      : "bg-black hover:bg-slate-900 text-white border-2 border-black"
                  }`}
                >
                  Save Profile Settings
                </button>
              </form>
            </div>

            {/* SECTION 2: CRYPTO DONATIONS */}
            <div className="space-y-4 pt-4 animate-fadeIn">
              <div className="text-left space-y-1">
                <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Sovereign Crypto Support
                </h4>
                <p className={`text-xs leading-normal ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Swiftpay is completely self-funded, charging only micro-spreads to cover decentralized nodes. To support our regional network and infrastructure expansion, send voluntary contributions solely via blockchain:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { name: "USDC (Multi-Chain)", symbol: "USDC", addr: "0xBb50020c9074024C839E75e13eC38491180b2dCB", color: "bg-blue-500" },
                  { name: "Bitcoin Network", symbol: "BTC", addr: "bc1qrqkexhxqg72s7tcquqwj24yy7xuzf4dl3lj3nj", color: "bg-amber-500" },
                  { name: "Polygon Network", symbol: "MATIC", addr: "0x3cF0A1f3Db1913670E046b506cbE84438E54a047", color: "bg-purple-500" },
                  { name: "Ethereum Network", symbol: "ETH", addr: "0x3cF0A1f3Db1913670E046b506cbE84438E54a047", color: "bg-indigo-500" },
                  { name: "Monero Network", symbol: "XMR", addr: "4BCC3pLcYDaHDWgARJxbys27Gj5r8Q5WJ75MLuHyEenGBdMxtGNPhnkWY4kKjGyes36Mrp8tusQPFc6LkqyULzxi9FfQrW4", color: "bg-amber-600" }
                ].map((item) => (
                  <div
                    key={item.symbol}
                    className={`p-4 rounded-2xl border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isDarkMode 
                        ? "bg-slate-950 border-slate-900 hover:border-slate-800" 
                        : "bg-slate-50 border-black hover:bg-slate-100"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className={`text-xs font-extrabold ${isDarkMode ? "text-slate-200" : "text-black"}`}>
                          {item.name} ({item.symbol})
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-xl font-mono text-[10px] break-all select-all leading-relaxed border ${
                        isDarkMode ? "bg-slate-900 border-slate-850 text-slate-300" : "bg-white border-black text-black font-bold"
                      }`}>
                        {item.addr}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.addr);
                        setCopiedDonationAddr(item.symbol);
                        setTimeout(() => setCopiedDonationAddr(null), 2500);
                      }}
                      className={`py-2 px-3.5 rounded-xl font-mono text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 min-w-[100px] border ${
                        copiedDonationAddr === item.symbol
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-600"
                          : isDarkMode 
                            ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" 
                            : "bg-white border-black text-black hover:bg-black hover:text-white font-bold"
                      }`}
                    >
                      {copiedDonationAddr === item.symbol ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <span>Copy Addr</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2.5: GOOGLE DRIVE CLOUD SYNC */}
            <GoogleDriveBackup 
              transactions={transactions}
              onRestoreTransactions={handleRestoreTransactions}
              isDarkMode={isDarkMode}
            />

            {/* SECTION 3: PURGE SESSION */}
            <div className={`pt-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDarkMode ? "border-slate-900" : "border-black"
            }`}>
              <div className="text-left">
                <h5 className={`font-extrabold text-xs ${isDarkMode ? "text-slate-300" : "text-black"}`}>Purge Session Data</h5>
                <p className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                  Log out of this non-custodial terminal and erase local active cached keys.
                </p>
              </div>
              <button
                id="btn_logout_profile"
                onClick={handleLogout}
                className={`font-bold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer ${
                  isDarkMode 
                    ? "bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50" 
                    : "bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-400"
                }`}
              >
                Sign Out Node
              </button>
            </div>

          </div>
        )}

      </main>

      {/* 3. Bottom Navigation Bar exactly like Screenshot 4 */}
      <nav
        id="bottom_nav_bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c1424]/95 backdrop-blur-md border-t border-slate-900 py-2 shadow-2xl"
      >
        <div className="max-w-md mx-auto px-6 flex items-center justify-between">
          
          {/* History Tab Button */}
          <button
            id="nav_history"
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "history"
                ? "text-[#10b981]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wide uppercase">History</span>
          </button>

          {/* Web3 Hub Tab Button */}
          <button
            id="nav_web3"
            onClick={() => setActiveTab("web3")}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "web3"
                ? "text-[#10b981]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Network className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wide uppercase">Web3 Hub</span>
          </button>

          {/* Home Tab Button (Prominent Center Option) */}
          <button
            id="nav_home"
            onClick={() => {
              setActiveTab("home");
              setHomeView("dashboard");
            }}
            className={`flex flex-col items-center justify-center -mt-6 w-14 h-14 rounded-full bg-[#10b981] text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              activeTab === "home"
                ? "ring-4 ring-slate-950"
                : "opacity-90"
            }`}
          >
            <Home className="w-6 h-6" />
          </button>

          {/* Support Tab Button */}
          <button
            id="nav_support"
            onClick={() => setActiveTab("support")}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "support"
                ? "text-[#10b981]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wide uppercase">Support</span>
          </button>

          {/* Profile Tab Button */}
          <button
            id="nav_profile"
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "profile"
                ? "text-[#10b981]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wide uppercase">Profile</span>
          </button>

        </div>
      </nav>

      {/* 4. Settings & Owner Control Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 border relative space-y-5 shadow-2xl ${
            isDarkMode ? "bg-[#0c1424] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-800/40 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-[#10b981]" />
              <h3 className="text-base font-extrabold">Terminal & Owner Control Panel</h3>
            </div>
            
            <OwnerControlPanel 
              isDarkMode={isDarkMode} 
              solPublicKey={solPublicKey ? solPublicKey.toString() : null}
              onClose={() => setShowSettingsModal(false)}
            />
          </div>
        </div>
      )}




    </div>
  );
}
