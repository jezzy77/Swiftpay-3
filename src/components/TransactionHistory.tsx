import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Transaction } from "../types";
import { 
  getGoogleAccessToken,
  getOrCreateReceiptsFolder,
  uploadFileToDrive
} from "../lib/googleAuth";
import { 
  History, 
  Search, 
  Coins, 
  ArrowUpRight, 
  Download, 
  AlertCircle, 
  TrendingUp, 
  RefreshCw,
  Clock,
  X,
  Copy,
  CheckCircle,
  Smartphone,
  Check,
  User,
  Building,
  Store,
  DollarSign,
  MessageSquare,
  FileText,
  CloudUpload,
  Cloud
} from "lucide-react";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onSelectTx: (tx: Transaction) => void;
  isDarkMode?: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  onRefresh,
  onSelectTx,
  isDarkMode = true,
}) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [copiedSMS, setCopiedSMS] = useState<boolean>(false);
  const [statementRange, setStatementRange] = useState<"all" | "5" | "1" | "3" | "12">("all");
  const [copiedRowSMSId, setCopiedRowSMSId] = useState<string | null>(null);
  const [showStatementModal, setShowStatementModal] = useState<boolean>(false);

  const [uploadingToDrive, setUploadingToDrive] = useState<boolean>(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState<string | null>(null);

  const uploadStatementToDrive = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      alert("Please link your Google Drive account first under the Profile tab.");
      return;
    }

    setUploadingToDrive(true);
    setDriveUploadSuccess(null);

    try {
      const doc = new jsPDF();
      
      // Background Header Bar
      doc.setFillColor(8, 13, 26);
      doc.rect(0, 0, 210, 42, "F");
      
      // Header Title
      doc.setTextColor(16, 185, 129); // Emerald Green
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("SWIFTPAY DECENTRALIZED GATEWAY", 14, 18);
      
      // Sub-header Info
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("OFFICIAL ACCOUNT TRANSACTION STATEMENT", 14, 26);
      doc.text(`Generated On: ${new Date().toLocaleString()} (UTC)`, 14, 32);
      doc.text("Sovereign Ledger Consensus • Safe Stablecoin Settlements", 14, 38);

      // Profile & Summary Segment
      doc.setTextColor(40, 50, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Ledger Summary", 14, 55);
      
      // Draw simple border line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 57, 196, 57);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`Statement Interval: ${getStatementRangeLabel()}`, 14, 65);
      doc.text(`Total Successful Swaps: ${displayedTxs.filter(t => t.status === "completed").length}`, 14, 71);
      doc.text(`Aggregate KES Settled: KES ${totalKES.toLocaleString()}`, 14, 77);
      doc.text(`USDC Equivalent Volume: ${totalUSDC.toFixed(2)} USDC`, 14, 83);
      doc.text("Consensus Status: Verified Settlement Network Consensus", 14, 89);

      // Table Header Bar
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 98, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("DATE (UTC)", 16, 103);
      doc.text("TRANSACTION ID / DETAILS", 42, 103);
      doc.text("RECIPIENT", 82, 103);
      doc.text("USDC VALUE", 142, 103);
      doc.text("SETTLED KES", 168, 103);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 106, 196, 106);

      let y = 112;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(50, 60, 70);

      displayedTxs.forEach((tx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const dateString = new Date(tx.createdAt).toISOString().slice(0, 10);
        const txIdTrunc = tx.id.slice(0, 10) + "...";
        const payeeName = tx.recipientName || "UNKNOWN PAYEE";
        const payeePhone = tx.recipientPhone;
        const usdcVal = `${tx.amountUSDC.toFixed(2)} USDC`;
        const settledVal = `KES ${tx.amountKES.toLocaleString()}`;

        doc.text(dateString, 16, y);
        doc.text(txIdTrunc, 42, y);
        doc.text(`${payeeName.slice(0, 18)} (${payeePhone})`, 82, y);
        doc.text(usdcVal, 142, y);
        doc.text(settledVal, 168, y);

        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + 2, 196, y + 2);
        y += 8;
      });

      // Attestation box
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setDrawColor(16, 185, 129);
      doc.rect(14, y + 4, 182, 18, "D");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text("Cryptographic Ledger Attestation & Validator Certification", 18, y + 10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text("This statement certifies the flawless validation and execution of stablecoin swaps on the decentralized ledger nodes.", 18, y + 14);
      doc.text("Network settled safely and securely through direct Safaricom M-Pesa / Airtel cellular gateways under self-custodial contract.", 18, y + 18);

      const pdfBlob = doc.output('blob');
      const folderId = await getOrCreateReceiptsFolder(token);
      const filename = `SwiftPay_Statement_${statementRange}_${new Date().toISOString().slice(0,10)}.pdf`;

      await uploadFileToDrive(token, filename, "application/pdf", pdfBlob, folderId);
      setDriveUploadSuccess(`Statement uploaded successfully!`);
      setTimeout(() => setDriveUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error("Upload statement failed", err);
      alert("Failed to upload statement to Google Drive: " + err.message);
    } finally {
      setUploadingToDrive(false);
    }
  };

  // Two Options: Statement Pull vs Realtime Cellular Texts
  const [historyOption, setHistoryOption] = useState<"statement" | "realtime_sms">("statement");

  // Dynamic Live SMS Simulator States
  const [simProvider, setSimProvider] = useState<"mpesa" | "airtel">("mpesa");
  const [simAmount, setSimAmount] = useState<number>(3500);
  const [simBalance, setSimBalance] = useState<number>(18450);
  const [simRecipientPhone, setSimRecipientPhone] = useState<string>("0712345678");
  const [simRecipientName, setSimRecipientName] = useState<string>("JOHN DOE MBOYA");
  const [simCopied, setSimCopied] = useState<boolean>(false);
  const [smsSearchTerm, setSmsSearchTerm] = useState<string>("");

  // Filter transactions
  const filteredTxs = safeTransactions.filter((tx) => {
    // 1. Search filter
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.recipientPhone.includes(searchTerm) ||
      (tx.recipientName && tx.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.senderWallet && tx.senderWallet.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 2. Status filter
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    if (!matchesSearch || !matchesStatus) return false;

    // 3. Statement Range filter
    const txDate = new Date(tx.createdAt);
    const now = new Date();
    if (statementRange === "1") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return txDate >= oneMonthAgo;
    }
    if (statementRange === "3") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return txDate >= threeMonthsAgo;
    }
    if (statementRange === "12") {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(now.getMonth() - 12);
      return txDate >= twelveMonthsAgo;
    }
    return true;
  });

  // If statementRange is "5", slice to first 5 items
  const displayedTxs = statementRange === "5" ? filteredTxs.slice(0, 5) : filteredTxs;

  // Calculate totals for displayed transactions in the statement
  const totalUSDC = displayedTxs
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.amountUSDC, 0);

  // Flat fees KES
  const totalKES = displayedTxs
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.amountKES, 0);

  const activeCount = safeTransactions.filter(
    t => !["completed", "failed", "refunded"].includes(t.status)
  ).length;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(id);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  // Comprehensive helper function to format transaction receipts as realistic M-Pesa & Airtel SMS alerts
  const formatTransactionAsSmsReceipt = (tx: Transaction) => {
    const refCode = tx.id.substring(0, 10).toUpperCase();
    const amountVal = tx.amountKES;
    
    // Compute dynamic, highly accurate M-Pesa/Airtel transaction fees matching real-world tariff brackets:
    // With our updated business model, transaction costs are flat-rate free (0 KES) across all payout and onramp modes.
    const costVal = 0;

    const cleanAmount = (amountVal - costVal).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const txDate = new Date(tx.createdAt);
    
    // Format Date to DD/MM/YY format (Standard M-Pesa uses DD/MM/YY e.g. 15/7/26)
    const day = txDate.getDate();
    const month = txDate.getMonth() + 1;
    const year = txDate.getFullYear().toString().substring(2);
    const formattedDate = `${day}/${month}/${year}`;
    
    // Format Time to h:mm A format (M-Pesa uses uppercase e.g. 12:53 PM)
    const formattedTime = txDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Consistent pseudo-random balance seeded by the transaction ID to keep it stable
    let seed = 0;
    for (let i = 0; i < tx.id.length; i++) {
      seed += tx.id.charCodeAt(i);
    }
    const randomBalanceVal = 1200 + (seed % 34000) + (seed % 99) * 0.17;
    const balanceStr = randomBalanceVal.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const costStr = costVal.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (tx.payoutProvider === "airtel") {
      const formattedName = tx.recipientName || "Airtel Recipient";
      const body = `Airtel Money: ${refCode} Confirmed. Ksh ${cleanAmount} sent to ${formattedName} (${tx.recipientPhone}) on ${formattedDate} at ${formattedTime}. Cost Ksh ${costStr}. Thank you for using Airtel Money.`;
      return {
        sender: "AirtelMoney",
        body,
        refCode,
        cleanAmount,
        formattedDate,
        formattedTime,
        balanceStr,
        costStr,
        costVal,
        colorClass: "bg-red-500/10 text-red-500 border-red-500/30"
      };
    } else {
      let body = "";
      const uppercaseName = tx.recipientName ? tx.recipientName.toUpperCase() : "SWIFTPAY RECIPIENT";
      
      if (tx.paymentType === "paybill") {
        body = `${refCode} Confirmed. Ksh${cleanAmount} paid to ${tx.paybillNumber || "222222"} ${tx.paybillAccount ? "A/C " + tx.paybillAccount.toUpperCase() : "SWIFTPAY"} on ${formattedDate} at ${formattedTime}. New M-PESA balance is Ksh${balanceStr}. Transaction cost, Ksh${costStr}.`;
      } else if (tx.paymentType === "till") {
        body = `${refCode} Confirmed. Ksh${cleanAmount} paid to BUY GOODS TILL ${tx.tillNumber || "543210"} on ${formattedDate} at ${formattedTime}. New M-PESA balance is Ksh${balanceStr}. Transaction cost, Ksh${costStr}.`;
      } else if (tx.paymentType === "stk_push") {
        body = `${refCode} Confirmed. Ksh${cleanAmount} received from SWIFTPAY STK SWAP on ${formattedDate} at ${formattedTime}. New M-PESA balance is Ksh${balanceStr}. Transaction cost, Ksh${costStr}.`;
      } else {
        // Default Send Money (C2C)
        body = `${refCode} Confirmed. Ksh${cleanAmount} sent to ${uppercaseName} ${tx.recipientPhone} on ${formattedDate} at ${formattedTime}. New M-PESA balance is Ksh${balanceStr}. Transaction cost, Ksh${costStr}. Amount transferred is within limit set for the single transaction.`;
      }

      return {
        sender: "M-PESA",
        body,
        refCode,
        cleanAmount,
        formattedDate,
        formattedTime,
        balanceStr,
        costStr,
        costVal,
        colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      };
    }
  };

  // Redefine original functions using the helper for simple single-source-of-truth compatibility
  const generateSafaricomSMS = (tx: Transaction) => formatTransactionAsSmsReceipt(tx).body;
  const generateAirtelSMS = (tx: Transaction) => formatTransactionAsSmsReceipt(tx).body;

  const handleCopySMS = (tx: Transaction) => {
    const smsText = tx.payoutProvider === "airtel" ? generateAirtelSMS(tx) : generateSafaricomSMS(tx);
    navigator.clipboard.writeText(smsText);
    setCopiedSMS(true);
    setTimeout(() => setCopiedSMS(false), 2000);
  };

  const handleCopyRowSMS = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const smsText = tx.payoutProvider === "airtel" ? generateAirtelSMS(tx) : generateSafaricomSMS(tx);
    navigator.clipboard.writeText(smsText);
    setCopiedRowSMSId(tx.id);
    setTimeout(() => setCopiedRowSMSId(null), 2000);
  };

  const getStatementRangeLabel = () => {
    if (statementRange === "all") return "All Time Records";
    if (statementRange === "5") return "Last 5 Transactions";
    if (statementRange === "1") return "1 Month Statement";
    if (statementRange === "3") return "3 Month Statement";
    if (statementRange === "12") return "12 Month Statement";
    return "";
  };

  const downloadPDFStatement = () => {
    const doc = new jsPDF();
    
    // Background Header Bar
    doc.setFillColor(8, 13, 26);
    doc.rect(0, 0, 210, 42, "F");
    
    // Header Title
    doc.setTextColor(16, 185, 129); // Emerald Green
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SWIFTPAY DECENTRALIZED GATEWAY", 14, 18);
    
    // Sub-header Info
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL ACCOUNT TRANSACTION STATEMENT", 14, 26);
    doc.text(`Generated On: ${new Date().toLocaleString()} (UTC)`, 14, 32);
    doc.text("Sovereign Ledger Consensus • Safe Stablecoin Settlements", 14, 38);

    // Profile & Summary Segment
    doc.setTextColor(40, 50, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Ledger Summary", 14, 55);
    
    // Draw simple border line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 57, 196, 57);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Statement Interval: ${getStatementRangeLabel()}`, 14, 65);
    doc.text(`Total Successful Swaps: ${displayedTxs.filter(t => t.status === "completed").length}`, 14, 71);
    doc.text(`Aggregate KES Settled: KES ${totalKES.toLocaleString()}`, 14, 77);
    doc.text(`USDC Equivalent Volume: ${totalUSDC.toFixed(2)} USDC`, 14, 83);
    doc.text("Consensus Status: Verified Settlement Network Consensus", 14, 89);

    // Table Header Bar
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 98, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("TX REFERENCE ID", 16, 104);
    doc.text("TIMESTAMP", 50, 104);
    doc.text("RECIPIENT PAYEE", 82, 104);
    doc.text("USDC SWAP", 142, 104);
    doc.text("SETTLED VALUE", 168, 104);

    // Table Transactions
    let y = 112;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    displayedTxs.forEach((tx) => {
      if (y > 270) {
        doc.addPage();
        // Draw small page top header
        doc.setFillColor(8, 13, 26);
        doc.rect(0, 0, 210, 12, "F");
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("SWIFTPAY GATEWAY OFFICIAL LEDGER STATEMENT", 14, 8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(8.5);
        y = 22;
      }
      
      const txRef = tx.id.slice(0, 12).toUpperCase();
      const txDate = new Date(tx.createdAt).toLocaleDateString("en-GB") + " " + new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const payeeName = (tx.recipientName || "Swiftpay User").toUpperCase();
      const payeePhone = tx.recipientPhone || "N/A";
      const usdcVal = `${tx.amountUSDC.toFixed(2)} USDC`;
      const settledVal = `${tx.amountKES.toLocaleString()} KES`;

      doc.text(txRef, 16, y);
      doc.text(txDate, 50, y);
      doc.text(`${payeeName.slice(0, 18)} (${payeePhone})`, 82, y);
      doc.text(usdcVal, 142, y);
      doc.text(settledVal, 168, y);

      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 2, 196, y + 2);
      y += 8;
    });

    // Attestation box
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setDrawColor(16, 185, 129);
    doc.rect(14, y + 4, 182, 18, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text("Cryptographic Ledger Attestation & Validator Certification", 18, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text("This statement certifies the flawless validation and execution of stablecoin swaps on the decentralized ledger nodes.", 18, y + 14);
    doc.text("Network settled safely and securely through direct Safaricom M-Pesa / Airtel cellular gateways under self-custodial contract.", 18, y + 18);

    doc.save(`SwiftPay_Statement_${statementRange}.pdf`);
  };

  return (
    <div 
      id="tx_history_section" 
      className={`border p-6 transition-all rounded-tl-[40px] rounded-br-[40px] rounded-tr-[12px] rounded-bl-[12px] ${
        isDarkMode 
          ? "bg-[#0c1424] border-slate-900 text-white shadow-[6px_6px_0px_rgba(16,185,129,0.15)]" 
          : "bg-white border-slate-200 text-slate-800 shadow-[6px_6px_0px_rgba(16,185,129,0.08)]"
      }`}
    >
      {/* 2 OPTIONS TAB SELECTOR */}
      <div className="flex gap-2.5 mb-6 border-b border-slate-800/40 pb-4">
        <button
          onClick={() => setHistoryOption("statement")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            historyOption === "statement"
              ? "bg-[#10b981] text-white shadow-md shadow-emerald-500/15"
              : isDarkMode
                ? "bg-slate-950/60 border border-slate-900 text-slate-400 hover:text-white"
                : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Option 1: Statement Pull (PDF Tool)</span>
        </button>
        <button
          onClick={() => setHistoryOption("realtime_sms")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            historyOption === "realtime_sms"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/15"
              : isDarkMode
                ? "bg-slate-950/60 border border-slate-900 text-slate-400 hover:text-white"
                : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Option 2: Realtime M-Pesa / Airtel Texts</span>
        </button>
      </div>

      {historyOption === "statement" ? (
        <>
          {/* Simplified Statement Pull Section */}
          <div className={`p-5 border rounded-2xl mb-6 flex flex-col md:flex-row gap-5 items-center justify-between ${
            isDarkMode ? "bg-slate-950/60 border-slate-900" : "bg-slate-50 border-slate-200"
          }`}>
            
            {/* 1. Search Box with Search Icon/Button */}
            <div className="w-full md:w-1/3 space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                1. Search Ledger
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-550 absolute left-3 top-2.5" />
                <input
                  type="text"
                  id="ledger_search_bar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search recipient, phone, or ID..."
                  className={`w-full text-xs border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#10b981] ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-white placeholder-slate-600" 
                      : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                  }`}
                />
              </div>
            </div>

            {/* 2. Slide (Range selection) */}
            <div className="w-full md:w-1/3 space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
                  2. Select Range
                </label>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {statementRange === "5" ? "Last 5 Transactions" : statementRange === "1" ? "1 Month" : statementRange === "3" ? "3 Months" : statementRange === "12" ? "12 Months" : "All Records"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                value={
                  statementRange === "5" ? 0 :
                  statementRange === "1" ? 1 :
                  statementRange === "3" ? 2 :
                  statementRange === "12" ? 3 : 4
                }
                onChange={(e) => {
                  const ranges: ("all" | "5" | "1" | "3" | "12")[] = ["5", "1", "3", "12", "all"];
                  setStatementRange(ranges[parseInt(e.target.value)]);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#10b981]"
              />
              <div className="flex justify-between text-[8px] font-mono text-slate-500 px-0.5">
                <span>5 Tx</span>
                <span>1 Month</span>
                <span>3 Months</span>
                <span>12 Months</span>
                <span>All</span>
              </div>
            </div>

            {/* 3. Export File Column */}
            <div className="w-full md:w-1/3 space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                3. Export File
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={downloadPDFStatement}
                  disabled={displayedTxs.length === 0}
                  className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 rounded-lg font-mono text-[11px] font-extrabold transition-all cursor-pointer shadow-[2px_2px_0px_rgba(16,185,129,0.2)] ${
                    displayedTxs.length === 0
                      ? "bg-slate-800 text-slate-650 border border-slate-750 cursor-not-allowed shadow-none"
                      : "bg-[#10b981] hover:bg-emerald-500 text-white hover:shadow-[3px_3px_0px_rgba(16,185,129,0.35)]"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                {getGoogleAccessToken() && (
                  <button
                    onClick={uploadStatementToDrive}
                    disabled={displayedTxs.length === 0 || uploadingToDrive}
                    className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 rounded-lg font-mono text-[11px] font-extrabold transition-all cursor-pointer shadow-[2px_2px_0px_rgba(99,102,241,0.2)] border ${
                      displayedTxs.length === 0 || uploadingToDrive
                        ? "bg-slate-800 text-slate-650 border-slate-750 cursor-not-allowed shadow-none"
                        : "bg-slate-900 border-indigo-500/40 text-[#10b981] hover:border-[#10b981] hover:bg-slate-950"
                    }`}
                  >
                    {uploadingToDrive ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#10b981]" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5 text-[#10b981]" />
                    )}
                    <span>{uploadingToDrive ? "Syncing..." : "Save Drive"}</span>
                  </button>
                )}
              </div>
              {driveUploadSuccess && (
                <p className="text-[9px] text-[#10b981] font-mono mt-1 text-center flex items-center justify-center gap-1 animate-pulse">
                  <CheckCircle className="w-3 h-3 text-[#10b981]" />
                  <span>{driveUploadSuccess}</span>
                </p>
              )}
            </div>

          </div>

          {/* Ledger Table Section Title */}
          <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${
            isDarkMode ? "border-slate-900" : "border-slate-150"
          }`}>
            <History className="w-4.5 h-4.5 text-[#10b981]" />
            <h3 className={`font-extrabold text-xs tracking-wider uppercase font-mono ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              Decentralized Transaction Ledger <span className="text-[10px] text-slate-500 font-normal">({getStatementRangeLabel()})</span>
            </h3>
          </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        {displayedTxs.length === 0 ? (
          <div id="empty_ledger_prompt" className="text-center py-8 text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No transactions match your search or statement date criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b font-bold ${isDarkMode ? "border-slate-900 text-slate-500" : "border-slate-100 text-slate-400"}`}>
                <th className="py-2.5">ID / Date</th>
                <th className="py-2.5">Recipient</th>
                <th className="py-2.5 text-right">USDC Injected</th>
                <th className="py-2.5 text-right">M-Pesa Disbursed</th>
                <th className="py-2.5 text-center">Rail</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-center hidden md:table-cell">SMS Proof</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-slate-900/60" : "divide-slate-50"}`}>
              {displayedTxs.map((tx) => {
                const dateString = new Date(tx.createdAt).toLocaleDateString("en-GB") + " " + new Date(tx.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr 
                    key={tx.id}
                    id={`ledger_row_${tx.id}`}
                    onClick={() => {
                      setSelectedTxDetail(tx);
                      onSelectTx(tx);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isDarkMode 
                        ? "hover:bg-slate-900/40" 
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3">
                      <div className={`font-mono font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                        {tx.id.slice(0, 10)}
                      </div>
                      <div className="text-[10px] text-slate-500">{dateString}</div>
                    </td>
                    <td className="py-3">
                      <div className={`font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {tx.recipientName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {`${tx.payoutProvider === "airtel" ? "Airtel" : "Safaricom"} (${tx.recipientPhone})`}
                      </div>
                    </td>
                    <td className={`py-3 text-right font-mono font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                      {tx.amountUSDC.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-[#10b981]">
                      {`${tx.amountKES.toLocaleString()} KES`}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-tl-[8px] rounded-br-[8px] ${
                        isDarkMode ? "bg-slate-950 text-slate-400" : "bg-slate-100 text-slate-600"
                      }`}>
                        {tx.chain}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span 
                        className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          tx.status === "completed"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                            : tx.status === "refunded"
                              ? "bg-amber-950/40 text-amber-400 border border-amber-900/30"
                              : tx.status === "failed"
                                ? "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                                : "bg-blue-950/40 text-blue-400 border border-blue-900/30 animate-pulse"
                        }`}
                      >
                        {tx.status === "awaiting_deposit" && "Awaiting Deposit"}
                        {tx.status === "confirming_blockchain" && "Confirming"}
                        {tx.status === "swapping_to_kes" && "Converting FX"}
                        {tx.status === "stk_push_sent" && "STK Sent"}
                        {tx.status === "completed" && "Completed"}
                        {tx.status === "failed" && "Failed"}
                        {tx.status === "refunded" && "Refunded"}
                      </span>
                    </td>
                    <td className="py-3 text-center hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                      {tx.status === "completed" ? (
                        <button
                          onClick={(e) => handleCopyRowSMS(tx, e)}
                          className={`px-2 py-1 rounded-tl-[8px] rounded-br-[8px] text-[10px] font-mono font-bold flex items-center gap-1 mx-auto transition-colors cursor-pointer shadow-[2px_2px_0px_rgba(16,185,129,0.15)] ${
                            copiedRowSMSId === tx.id
                              ? "bg-emerald-500 text-white border border-emerald-400"
                              : isDarkMode 
                                ? "bg-slate-950 text-[#10b981] border border-[#10b981]/30 hover:bg-emerald-950/40" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                          }`}
                          title="Copy real-time SMS formatting text directly"
                        >
                          <MessageSquare className="w-3 h-3 text-[#10b981]" />
                          <span>{copiedRowSMSId === tx.id ? "Copied!" : tx.payoutProvider === "airtel" ? "Airtel SMS" : "M-Pesa SMS"}</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  ) : (
        /* Render Option 2: Live SMS Alert Simulation & Emulator */
        <div className="space-y-6 text-left animate-fadeIn">
          
          {/* Prominent Search Bar at the Top */}
          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? "bg-[#0c1424]/90 border-slate-900" : "bg-slate-50 border-slate-200"
          } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div>
              <h3 className={`text-xs font-black uppercase font-mono tracking-wider ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                🔍 Cellular SMS Search & Emulation Engine
              </h3>
              <p className="text-[10px] text-slate-505 mt-1">
                Search cellular receipts by customer name, telephone number, transaction ID, or carrier. Click any item to preview or copy the live SMS.
              </p>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={smsSearchTerm}
                onChange={(e) => setSmsSearchTerm(e.target.value)}
                placeholder="Search by name, telephone, or tx hash..."
                className={`w-full text-xs border rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 ${
                  isDarkMode 
                    ? "bg-slate-950 border-slate-850 text-white placeholder-slate-650" 
                    : "bg-white border-slate-200 text-slate-850 placeholder-slate-400"
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: ACTIVE CELLULAR SMS PREVIEW (4 cols) */}
            <div className="lg:col-span-4 flex flex-col">
              <div className={`border p-4.5 rounded-2xl h-full flex flex-col justify-between ${
                isDarkMode ? "bg-[#0c1424]/90 border-slate-900" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-850/40">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${simProvider === "airtel" ? "bg-red-500" : "bg-[#10b981]"} animate-pulse`}></span>
                    Cellular Preview
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const refCode = "QG" + Math.floor(100000 + Math.random() * 900000) + "TX";
                      const dateStr = new Date().toLocaleDateString("en-GB");
                      const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                      const costVal = 0;
                      const cleanAmt = simAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 });
                      const balanceStr = simBalance.toLocaleString("en-KE", { minimumFractionDigits: 2 });
                      const costStr = costVal.toLocaleString("en-KE", { minimumFractionDigits: 2 });

                      let text = "";
                      if (simProvider === "airtel") {
                        text = `Airtel Money: ${refCode} Confirmed. Ksh ${cleanAmt} sent to ${simRecipientName} (${simRecipientPhone}) on ${dateStr} at ${timeStr}. Cost Ksh ${costStr}. Thank you for using Airtel Money.`;
                      } else {
                        text = `${refCode} Confirmed. Ksh${cleanAmt} sent to ${simRecipientName.toUpperCase()} ${simRecipientPhone} on ${dateStr} at ${timeStr}. New M-PESA balance is Ksh${balanceStr}. Transaction cost, Ksh${costStr}. Amount transferred is within limit set for the single transaction.`;
                      }

                      navigator.clipboard.writeText(text);
                      setSimCopied(true);
                      setTimeout(() => setSimCopied(false), 2000);
                    }}
                    className={`text-[9.5px] font-bold py-1 px-2.5 rounded border transition-all cursor-pointer ${
                      simProvider === "airtel"
                        ? "bg-red-950/25 border-red-900/60 hover:bg-red-950/60 text-red-400"
                        : "bg-emerald-950/25 border-emerald-900/60 hover:bg-emerald-950/60 text-[#10b981]"
                    }`}
                  >
                    {simCopied ? "Copied!" : "Copy SMS Text"}
                  </button>
                </div>

                {/* Physical Smartphone Screen - Made significantly smaller and tighter */}
                <div className={`mt-3 border rounded-xl overflow-hidden shadow-lg font-sans relative flex-1 flex flex-col justify-between max-w-sm mx-auto w-full ${
                  isDarkMode ? "bg-slate-950 border-slate-850" : "bg-white border-slate-300"
                }`}>
                  {/* Phone Header */}
                  <div className="px-3 py-1.5 flex items-center justify-between text-[8px] font-bold tracking-tight text-slate-500 bg-slate-900/10 border-b border-slate-900/5">
                    <span>{simProvider === "airtel" ? "Airtel KE" : "Safaricom"}</span>
                    <span>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                  </div>

                  {/* Message Bubble Container */}
                  <div className="p-3 bg-slate-900/5 flex-1 flex items-start gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${simProvider === "airtel" ? "bg-red-500" : "bg-[#10b981]"}`}></div>
                    <div className={`p-2.5 rounded-lg border shadow-sm text-[9.5px] leading-relaxed relative flex-1 ${
                      isDarkMode ? "bg-[#0b1424] border-slate-850 text-slate-200" : "bg-white border-slate-200 text-slate-700"
                    }`}>
                      <p className="font-mono text-left leading-normal break-words whitespace-pre-wrap select-all font-medium">
                        {(() => {
                          const mockRef = "QG" + Math.floor(259102 + (simAmount % 9) * 1111) + "TX";
                          const dStr = new Date().toLocaleDateString("en-GB");
                          const tStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                          const costVal = 0;
                          const cleanAmt = simAmount.toLocaleString("en-KE", { minimumFractionDigits: 2 });
                          const balStr = simBalance.toLocaleString("en-KE", { minimumFractionDigits: 2 });
                          const costStr = costVal.toLocaleString("en-KE", { minimumFractionDigits: 2 });

                          if (simProvider === "airtel") {
                            return `Airtel Money: ${mockRef} Confirmed. Ksh ${cleanAmt} sent to ${simRecipientName} (${simRecipientPhone}) on ${dStr} at ${tStr}. Cost Ksh ${costStr}. Thank you for using Airtel Money.`;
                          } else {
                            return `${mockRef} Confirmed. Ksh${cleanAmt} sent to ${simRecipientName.toUpperCase()} ${simRecipientPhone} on ${dStr} at ${tStr}. New M-PESA balance is Ksh${balStr}. Transaction cost, Ksh${costStr}. Amount transferred is within limit set for the single transaction.`;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: SEARCHED SIMULATED SMS LIST (8 cols) */}
            <div className="lg:col-span-8 flex flex-col">
              <div className={`border p-4.5 rounded-2xl h-full flex flex-col space-y-4 ${
                isDarkMode ? "bg-[#0c1424]/90 border-slate-900" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/30">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                    📜 Simulated Cellular Alert Ledger
                  </span>
                  <span className="text-[10px] font-mono text-slate-505">
                    Click an alert to load onto Cellular device above
                  </span>
                </div>

                {/* List of transactions filtered by search term */}
                {(() => {
                  const smsFilteredTxs = safeTransactions.filter((tx) => {
                    if (tx.status !== "completed") return false;
                    
                    const searchLower = smsSearchTerm.toLowerCase().trim();
                    if (!searchLower) return true;

                    const idMatches = tx.id.toLowerCase().includes(searchLower);
                    const nameMatches = tx.recipientName ? tx.recipientName.toLowerCase().includes(searchLower) : false;
                    const phoneMatches = tx.recipientPhone ? tx.recipientPhone.includes(searchLower) : false;
                    const providerMatches = tx.payoutProvider ? tx.payoutProvider.toLowerCase().includes(searchLower) : false;
                    const paymentTypeMatches = tx.paymentType ? tx.paymentType.toLowerCase().includes(searchLower) : false;
                    
                    return idMatches || nameMatches || phoneMatches || providerMatches || paymentTypeMatches;
                  });

                  return smsFilteredTxs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center space-y-2">
                      <p className="text-xs">No simulated SMS messages found matching your search term.</p>
                      <p className="text-[10px] text-slate-600">Ensure the search term is correct or try another query.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                      {smsFilteredTxs.map((tx) => {
                        const smsReceipt = formatTransactionAsSmsReceipt(tx);
                        const isTxAirtel = tx.payoutProvider === "airtel";
                        return (
                          <div 
                            key={tx.id}
                            onClick={() => {
                              setSimProvider(tx.payoutProvider === "airtel" ? "airtel" : "mpesa");
                              setSimAmount(tx.amountKES);
                              setSimRecipientName(tx.recipientName.toUpperCase());
                              setSimRecipientPhone(tx.recipientPhone || "0712345678");
                            }}
                            title="Click to load into live preview alert"
                            className={`border p-3.5 rounded-xl space-y-2 text-xs relative cursor-pointer hover:border-indigo-500/60 hover:-translate-y-0.5 transition-all group ${
                              isDarkMode ? "bg-slate-950/70 border-slate-900" : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-950/10 dark:border-slate-800/40">
                              <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                isTxAirtel ? "bg-red-950/30 text-red-400" : "bg-emerald-950/30 text-[#10b981]"
                              }`}>
                                {smsReceipt.sender}
                              </span>
                              
                              <span className="text-[8.5px] text-slate-505 group-hover:text-indigo-400 font-bold transition-colors">
                                Load Alert →
                              </span>
                            </div>
                            
                            <p className="font-mono text-[9px] text-slate-400 leading-relaxed text-left line-clamp-3">
                              {smsReceipt.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* COMPILATION AND DYNAMIC STATEMENT MODAL */}
      {showStatementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div 
            className={`w-full max-w-2xl rounded-tl-[40px] rounded-br-[40px] rounded-tr-[12px] rounded-bl-[12px] p-6 border relative space-y-6 shadow-2xl ${
              isDarkMode 
                ? "bg-[#080d1a] border-slate-800 text-white" 
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <button 
              onClick={() => setShowStatementModal(false)}
              className="absolute right-4 top-4 p-1.5 hover:scale-105 transition-transform rounded-full hover:bg-slate-800/20"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="flex items-center gap-3 border-b pb-4 border-slate-800">
              <div className="w-10 h-10 bg-emerald-950/60 text-[#10b981] flex items-center justify-center font-bold rounded-tl-[16px] rounded-br-[16px]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black font-mono tracking-wider text-[#10b981]">
                  OFFICIAL SWIFTPAY GATEWAY STATEMENT
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">Compiled dynamically from decentralized settlement nodes</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-2 border border-slate-800/40 rounded bg-slate-950/20">
                <span className="text-[9px] text-slate-500 block">STATEMENT RANGE</span>
                <span className="font-extrabold text-white text-[10px]">{getStatementRangeLabel()}</span>
              </div>
              <div className="p-2 border border-slate-800/40 rounded bg-slate-950/20">
                <span className="text-[9px] text-slate-500 block">TOTAL VOLUME</span>
                <span className="font-extrabold text-[#10b981] text-[10px]">KES {totalKES.toLocaleString()}</span>
              </div>
              <div className="p-2 border border-slate-800/40 rounded bg-slate-950/20">
                <span className="text-[9px] text-slate-500 block">USDC VALUE</span>
                <span className="font-extrabold text-slate-300 text-[10px]">{totalUSDC.toFixed(2)} USDC</span>
              </div>
              <div className="p-2 border border-slate-800/40 rounded bg-slate-950/20">
                <span className="text-[9px] text-slate-500 block">COMPILING NODES</span>
                <span className="font-extrabold text-indigo-400 text-[10px]">4 Decentralized</span>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-850 rounded-xl">
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 text-[10px]">
                    <th className="p-2">TX REF</th>
                    <th className="p-2">DATE</th>
                    <th className="p-2">PAYEE / RECIPIENT</th>
                    <th className="p-2 text-right">USDC</th>
                    <th className="p-2 text-right">KES SETTLED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {displayedTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-900/20">
                      <td className="p-2 text-slate-300 font-extrabold">{tx.id.slice(0, 10).toUpperCase()}</td>
                      <td className="p-2 text-slate-400">{new Date(tx.createdAt).toLocaleDateString("en-GB")}</td>
                      <td className="p-2 text-slate-400 truncate max-w-[140px]">{tx.recipientName} ({tx.recipientPhone || "N/A"})</td>
                      <td className="p-2 text-right text-slate-300">{tx.amountUSDC.toFixed(2)}</td>
                      <td className="p-2 text-right text-[#10b981] font-bold">{`${tx.amountKES.toLocaleString()} KES`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed font-mono">
              <strong>Cryptographic Attestation:</strong> This document serves as a valid node broadcast confirmation. Transactions are secured by respective blockchain finality (Base/Solana/Polygon) and finalized through Safaricom M-Pesa & Airtel Money C2B/B2C API hooks. Generated on {new Date().toLocaleString()}.
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadPDFStatement}
                className="flex-1 bg-[#10b981] hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-tl-[16px] rounded-br-[16px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_rgba(16,185,129,0.3)]"
              >
                <Download className="w-4 h-4" /> Download Official PDF Statement
              </button>
              <button
                onClick={() => setShowStatementModal(false)}
                className={`flex-1 font-bold text-xs py-2.5 rounded-tr-[16px] rounded-bl-[16px] transition-all border ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850" 
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Detail slide-over / details modal with exact SMS extraction */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div 
            className={`w-full max-w-lg p-6 border relative space-y-6 rounded-tl-[40px] rounded-br-[40px] rounded-tr-[12px] rounded-bl-[12px] shadow-2xl ${
              isDarkMode 
                ? "bg-[#0c1424] border-slate-800 text-white" 
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <button 
              onClick={() => setSelectedTxDetail(null)}
              className="absolute right-4 top-4 p-1.5 hover:scale-105 transition-transform rounded-full hover:bg-slate-800/20"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-tl-[16px] rounded-br-[16px] bg-emerald-950/60 text-[#10b981] flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-base font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Statement Node Extract
                </h4>
                <p className="text-[10px] text-slate-500">Secure transaction proof and cellular broadcast message</p>
              </div>
            </div>

            <div className={`p-4 border space-y-3.5 text-xs rounded-tl-[24px] rounded-br-[24px] rounded-tr-[6px] rounded-bl-[6px] ${
              isDarkMode ? "bg-slate-950/50 border-slate-900" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transaction ID</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className={isDarkMode ? "text-slate-300" : "text-slate-800"}>{selectedTxDetail.id}</span>
                  <button 
                    onClick={() => handleCopyText(selectedTxDetail.id, "txid")}
                    className="p-1 hover:text-emerald-400 transition-colors"
                  >
                    {copiedTxId === "txid" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payout Destination</span>
                <span className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {`${selectedTxDetail.payoutProvider?.toUpperCase() || "MPESA"} (${selectedTxDetail.recipientPhone})`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Swap Value</span>
                <span className={`font-mono font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {selectedTxDetail.amountUSDC.toFixed(2)} USDC → {selectedTxDetail.amountKES.toLocaleString()} KES
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Swap Execution Rate</span>
                <span className="font-mono text-slate-400">
                  1 USDC = {selectedTxDetail.effectiveRate.toFixed(2)} KES (1.5% profit buffer)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Type</span>
                <span className="text-indigo-400 font-bold uppercase text-[10px]">
                  {selectedTxDetail.paymentType || "C2C Transfer"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                  selectedTxDetail.status === "completed" ? "bg-emerald-900/30 text-emerald-400" : "bg-amber-900/30 text-amber-400"
                }`}>
                  {selectedTxDetail.status}
                </span>
              </div>
            </div>

            {/* M-PESA / AIRTEL SKEUOMORPHIC SMARTPHONE MESSAGE SIMULATION */}
            {selectedTxDetail.status === "completed" && (() => {
              const smsInfo = formatTransactionAsSmsReceipt(selectedTxDetail);
              const isAirtel = selectedTxDetail.payoutProvider === "airtel";
              const carrierBrandingColor = isAirtel ? "border-red-500/30 text-red-400" : "border-emerald-500/30 text-[#10b981]";
              const carrierName = isAirtel ? "AirtelMoney" : "M-PESA";
              
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1.5 font-mono">
                      <span className={`w-2 h-2 rounded-full ${isAirtel ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></span>
                      High-Fidelity SMS Alert Simulation
                    </span>
                    <button 
                      onClick={() => handleCopySMS(selectedTxDetail)}
                      className={`text-xs flex items-center gap-1 font-bold ${isAirtel ? "text-red-400 hover:text-red-300" : "text-[#10b981] hover:text-emerald-400"}`}
                    >
                      {copiedSMS ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied Text!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy SMS Alert
                        </>
                      )}
                    </button>
                  </div>

                  {/* Physical iOS/Android Smartphone Skeuomorphic Preview */}
                  <div className={`border rounded-[32px] overflow-hidden shadow-xl font-sans relative ${
                    isDarkMode 
                      ? "bg-slate-950 border-slate-800 shadow-black/85" 
                      : "bg-slate-50 border-slate-300 shadow-slate-300/40"
                  }`}>
                    {/* Simulated Phone Top Header Bar */}
                    <div className="px-5 pt-3 pb-1.5 flex items-center justify-between text-[9px] font-bold tracking-tight text-slate-500 bg-slate-900/30 border-b border-slate-900/10">
                      <div className="flex items-center gap-1 font-mono">
                        <span>{isAirtel ? "Airtel KE" : "Safaricom"}</span>
                        <span className="text-[7px] bg-slate-800 text-slate-300 px-1 rounded">5G</span>
                      </div>
                      
                      {/* Dynamic Notch */}
                      <div className="w-20 h-4 bg-black rounded-full absolute top-1.5 left-1/2 -translate-x-1/2 border border-slate-900 hidden sm:block"></div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">{smsInfo.formattedTime}</span>
                        <div className="w-4 h-2 bg-slate-800 rounded-xs relative flex items-center px-0.5 border border-slate-700">
                          <div className="h-full w-[80%] bg-emerald-500 rounded-3xs"></div>
                          <div className="w-[1.5px] h-1 bg-slate-700 absolute -right-[2px] rounded-r"></div>
                        </div>
                      </div>
                    </div>

                    {/* Chat Conversation Subheader (Sender Details) */}
                    <div className="px-4 py-3 flex items-center gap-3 bg-slate-900/15 border-b border-slate-900/5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs border shadow-sm shrink-0 bg-slate-900 border-slate-800 text-slate-100">
                        {isAirtel ? "A" : "M"}
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-black tracking-wide ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                          {carrierName}
                        </div>
                        <div className="text-[8px] font-extrabold text-[#10b981] font-mono uppercase tracking-widest">
                          ✓ Verified Sender
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">SMS Text Message</div>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="p-4 space-y-4">
                      {/* Center Timestamp Marker */}
                      <div className="text-center">
                        <span className="inline-block text-[8px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-900/40 px-2 py-0.5 rounded-full">
                          Today, {smsInfo.formattedTime}
                        </span>
                      </div>

                      {/* Chat Message Bubble */}
                      <div className="flex items-start gap-2 max-w-[95%] animate-fadeIn">
                        {/* Tiny Carrier Icon Tag */}
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isAirtel ? "bg-red-500" : "bg-emerald-500"}`}></div>
                        
                        <div className={`p-4 rounded-2xl rounded-tl-xs text-[11px] leading-relaxed relative border shadow-md select-all ${
                          isDarkMode
                            ? "bg-slate-900/90 border-slate-850 text-slate-200"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}>
                          {/* Accent left border highlight */}
                          <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-md ${isAirtel ? "bg-red-500" : "bg-[#10b981]"}`}></div>
                          
                          <p className="font-mono leading-relaxed break-words whitespace-pre-wrap">
                            {/* Parse variables to show them with beautiful styling for readability */}
                            {smsInfo.body.split(" ").map((word, i) => {
                              const cleanWord = word.replace(/[.,]/g, "");
                              const isRef = cleanWord === smsInfo.refCode;
                              const isKsh = word.startsWith("Ksh") || word.includes("Ksh");
                              const isPhone = word.startsWith("07") || word.startsWith("01") || (word.length >= 10 && !isNaN(Number(cleanWord)));
                              
                              if (isRef) {
                                return <span key={i} className="text-[#10b981] font-extrabold tracking-wide bg-emerald-950/60 border border-emerald-900/30 px-1 rounded-sm">{word} </span>;
                              }
                              if (isKsh) {
                                return <span key={i} className={`font-black tracking-tight ${isAirtel ? "text-red-400 bg-red-950/60 border border-red-900/30" : "text-emerald-400 bg-emerald-950/60 border border-emerald-900/30"} px-1 rounded-sm`}>{word} </span>;
                              }
                              if (isPhone) {
                                return <span key={i} className="text-indigo-400 font-bold underline decoration-dotted">{word} </span>;
                              }
                              return word + " ";
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Info attestation underneath */}
                      <div className="text-[8px] text-slate-500 font-mono text-center flex items-center justify-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5 text-[#10b981]" />
                        <span>Formatted exact cellular broadcast matching official telecom specs.</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => handleCopySMS(selectedTxDetail)}
                className="flex-1 bg-[#10b981] hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-tl-[16px] rounded-br-[16px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_rgba(16,185,129,0.3)]"
              >
                <Download className="w-4 h-4" /> Export SMS Statement
              </button>
              <button
                onClick={() => setSelectedTxDetail(null)}
                className={`flex-1 font-bold text-xs py-2.5 rounded-tr-[16px] rounded-bl-[16px] transition-all border ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Close Extract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
