import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  MessageSquare, 
  Send, 
  Coins, 
  Copy, 
  Check, 
  HelpCircle, 
  Sparkles, 
  Heart, 
  Smartphone, 
  ShieldCheck, 
  ArrowRight,
  User,
  Bot
} from "lucide-react";

interface SupportHubProps {
  isDarkMode: boolean;
  loggedUser: string;
}

interface Message {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export const SupportHub: React.FC<SupportHubProps> = ({ isDarkMode, loggedUser }) => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Jambo! I am the Swiftpay AI Support assistant. How can I help you with your stablecoin swaps, Airtel/M-Pesa API questions, or crypto donations today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Donation state
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Suggested prompts
  const suggestedPrompts = [
    "How does the auto-refund rule protect me?",
    "Can I swap to Airtel Money without a passkey?",
    "How does Swiftpay route profits to Solana wallets?",
    "What are the transaction limits?"
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      // Map current message history for context
      const chatHistory = messages.map(m => ({
        role: m.role === "model" ? "model" : "user",
        content: m.content
      }));

      const res = await axios.post("/api/support/chat", {
        message: text,
        history: chatHistory
      });

      const botMsg: Message = {
        role: "model",
        content: res.data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        role: "model",
        content: "I apologize, but I am having trouble connecting to the Swiftpay billing network nodes. Please retry your question or write a local support ticket.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (address: string, chain: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(chain);
    setTimeout(() => setCopiedAddress(null), 2500);
  };

  const faqs = [
    {
      q: "How does the dynamic spread margin work?",
      a: "Swiftpay queries real-time USDC/KES mid-market oracle rates and embeds a silent volatility protection spread of 1.0% to 2.5% into the quote. If blockchain congestion is high, this automatically expands to 3.0% to guarantee instant settlement without pricing risk."
    },
    {
      q: "What is the 5-minute automatic refund rule?",
      a: "If your USDC transaction is detected on-chain but Safaricom or Airtel's cellular API fails to respond or complete within 5 minutes, our smart-contract safety lock immediately voids the swap and broadcasts a complete refund of your USDC back to your sender wallet address."
    },
    {
      q: "Do I need an Airtel Money API developer passkey?",
      a: "No! Swiftpay has pre-integrated safaricom and airtel mobile operator gateways. You don't need any complex passkeys or cellular API profiles to swap stablecoins directly into your Airtel or Safaricom phone lines."
    },
    {
      q: "What are the transaction limits?",
      a: "Swiftpay operates with no transaction tiers and no daily limits. You can transact as much as you want with unlimited freedom."
    }
  ];

  // Dynamic styling variables
  const cardBg = isDarkMode ? "bg-[#0c1424] border-slate-900" : "bg-white border-slate-200 shadow-sm";
  const subCardBg = isDarkMode ? "bg-slate-950 border-slate-900" : "bg-slate-100 border-slate-200";
  const textTitle = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-600";
  const borderClass = isDarkMode ? "border-slate-900" : "border-slate-200";
  const chatBubbleUser = "bg-[#10b981] text-white";
  const chatBubbleBot = isDarkMode ? "bg-slate-900 text-slate-100 border border-slate-800" : "bg-slate-200/80 text-slate-900 border border-slate-300/30";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Hero Block */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${cardBg} relative overflow-hidden`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="max-w-xl space-y-2 relative z-10">
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#10b981] bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-900/40 inline-block">
            Support Hub
          </span>
          <h2 className={`text-2xl font-black tracking-tight ${textTitle}`}>
            Swiftpay Live Assistant & Donations
          </h2>
          <p className={`text-xs ${textMuted} leading-relaxed`}>
            Ask our AI terminal about transaction routing, view instant Airtel/Safaricom API answers, or make voluntary cryptocurrency donations.
          </p>
        </div>
      </div>

      {/* Main Grid: Left is Chatbot, Right is Crypto Donations & FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: AI Chatbot (8/12 on large screens) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className={`border ${cardBg} rounded-3xl flex flex-col h-[580px] overflow-hidden`}>
            
            {/* Chat Header */}
            <div className={`p-4 border-b ${borderClass} flex items-center justify-between bg-slate-950/20`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className={`text-xs font-extrabold tracking-wide uppercase ${textTitle}`}>
                    Swiftpay AI Agent
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">Node Coprocessor Online</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Model: Gemini 3.5</span>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "user" && (
                    <div className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0 text-[10px] font-bold">
                      SP
                    </div>
                  )}
                  
                  <div className="space-y-1 max-w-[80%]">
                    <div className={`rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${msg.role === "user" ? chatBubbleUser : msg.role === "model" ? chatBubbleBot : ""}`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-500 block px-1.5 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold uppercase">
                      {loggedUser.slice(0, 2)}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    SP
                  </div>
                  <div className="space-y-1 max-w-[80%]">
                    <div className={`rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${chatBubbleBot} flex items-center gap-1.5`}>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-slate-400 ml-1">Agent is processing swap request...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts Grid */}
            <div className={`p-3 border-t ${borderClass} bg-slate-950/10`}>
              <div className="flex items-center gap-1.5 mb-2 px-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Terminal Prompts</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className={`text-[10px] font-medium py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                      isDarkMode 
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-emerald-500/40 hover:text-slate-950"
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }} 
              className={`p-3.5 border-t ${borderClass} flex gap-2 bg-slate-950/30`}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your support request or question..."
                className={`flex-1 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 ${
                  isDarkMode 
                    ? "bg-slate-950 border border-slate-850 text-white placeholder-slate-600"
                    : "bg-white border border-slate-200 text-slate-950 placeholder-slate-400"
                }`}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="bg-[#10b981] hover:bg-emerald-500 text-white p-3 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>

        {/* RIGHT COLUMN: Crypto Donations & FAQs (5/12 on large screens) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Crypto-Only Donation section */}
          <div className={`p-6 border ${cardBg} rounded-3xl space-y-4 relative overflow-hidden`}>
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-800">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className={`text-sm font-extrabold uppercase tracking-wider ${textTitle}`}>
                  Crypto P2P Donations
                </h3>
              </div>
              <span className="text-[9px] font-bold bg-rose-950/60 text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-900/30">
                Crypto Only
              </span>
            </div>

            <p className={`text-xs leading-relaxed ${textMuted}`}>
              Swiftpay is self-funded, charging only low spreads to cover cloud servers. To support our regional network growth, send voluntary contributions solely via blockchain:
            </p>

            <div className="space-y-3 pt-1">
              
              {/* USDc Multi-Chain Card */}
              <div className={`p-3.5 rounded-2xl border ${subCardBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    USDC Wallet Address
                  </span>
                  <button
                    onClick={() => handleCopy("0xBb50020c9074024C839E75e13eC38491180b2dCB", "USDC")}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedAddress === "USDC" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Addr
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/40 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-400 break-all select-all">
                  0xBb50020c9074024C839E75e13eC38491180b2dCB
                </div>
              </div>

              {/* Bitcoin Card */}
              <div className={`p-3.5 rounded-2xl border ${subCardBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Bitcoin Network (BTC)
                  </span>
                  <button
                    onClick={() => handleCopy("bc1qrqkexhxqg72s7tcquqwj24yy7xuzf4dl3lj3nj", "BTC")}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedAddress === "BTC" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Addr
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/40 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-400 break-all select-all">
                  bc1qrqkexhxqg72s7tcquqwj24yy7xuzf4dl3lj3nj
                </div>
              </div>

              {/* Polygon Card */}
              <div className={`p-3.5 rounded-2xl border ${subCardBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    Polygon Network (MATIC)
                  </span>
                  <button
                    onClick={() => handleCopy("0x3cF0A1f3Db1913670E046b506cbE84438E54a047", "POLYGON")}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedAddress === "POLYGON" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Addr
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/40 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-400 break-all select-all">
                  0x3cF0A1f3Db1913670E046b506cbE84438E54a047
                </div>
              </div>

              {/* Ethereum Card */}
              <div className={`p-3.5 rounded-2xl border ${subCardBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Ethereum Network (ETH)
                  </span>
                  <button
                    onClick={() => handleCopy("0x3cF0A1f3Db1913670E046b506cbE84438E54a047", "ETHEREUM")}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedAddress === "ETHEREUM" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Addr
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/40 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-400 break-all select-all">
                  0x3cF0A1f3Db1913670E046b506cbE84438E54a047
                </div>
              </div>

              {/* Monero Card */}
              <div className={`p-3.5 rounded-2xl border ${subCardBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    Monero Network (XMR)
                  </span>
                  <button
                    onClick={() => handleCopy("4BCC3pLcYDaHDWgARJxbys27Gj5r8Q5WJ75MLuHyEenGBdMxtGNPhnkWY4kKjGyes36Mrp8tusQPFc6LkqyULzxi9FfQrW4", "MONERO")}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedAddress === "MONERO" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Addr
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-black/40 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-400 break-all select-all">
                  4BCC3pLcYDaHDWgARJxbys27Gj5r8Q5WJ75MLuHyEenGBdMxtGNPhnkWY4kKjGyes36Mrp8tusQPFc6LkqyULzxi9FfQrW4
                </div>
              </div>

            </div>

            <p className="text-[10px] text-slate-500 text-center italic">
              "No fiat, credit card, or CBK payment lines processed for contributions."
            </p>
          </div>

          {/* Quick FAQ Selection Accordion */}
          <div className={`p-6 border ${cardBg} rounded-3xl space-y-4`}>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-900/40">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              <h3 className={`text-sm font-extrabold uppercase tracking-wider ${textTitle}`}>
                Frequently Asked FAQs
              </h3>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={`border ${borderClass} rounded-xl overflow-hidden`}>
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className={`w-full text-left px-4 py-3 text-xs font-bold flex justify-between items-center transition-colors cursor-pointer ${
                        isOpen ? "bg-[#10b981]/10 text-emerald-400" : isDarkMode ? "hover:bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      <span>{faq.q}</span>
                      <span className="text-sm font-mono">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className={`px-4 py-3 text-xs leading-relaxed ${textMuted} bg-slate-950/10 border-t ${borderClass}`}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
