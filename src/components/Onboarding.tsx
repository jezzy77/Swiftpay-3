import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, HelpCircle, Shield, Phone, Sparkles } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Welcome to Swiftpay Pay! 💸",
    description:
      "Swiftpay operates as an automated non-custodial terminal matching Safaricom M-Pesa & Airtel Money with global stablecoins (USDT, USDC). Swap cash immediately on Arbitrum, Polygon, or Base without centralized blocks.",
    icon: (
      <div className="w-20 h-20 rounded-3xl bg-[#0c1424] border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] text-[#10b981] text-4xl font-extrabold">
        $
      </div>
    ),
  },
  {
    title: "Volatility-Proof Routing 🛡️",
    description:
      "Every conversion is secured by a dynamic 1% liquidity slippage buffer. This prevents unpredictable rate swings from degrading your payout, ensuring you receive the exact KES expected.",
    icon: (
      <div className="w-20 h-20 rounded-3xl bg-[#0c1424] border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] text-[#10b981]">
        <Shield className="w-10 h-10" />
      </div>
    ),
  },
  {
    title: "Safe Daraja Handshake 📲",
    description:
      "Once you send USDC to the secure invoice contract address, our system detects the incoming blockchain deposit within seconds and dispatches an automated STK Push PIN prompt to your mobile.",
    icon: (
      <div className="w-20 h-20 rounded-3xl bg-[#0c1424] border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] text-[#10b981]">
        <Phone className="w-10 h-10" />
      </div>
    ),
  },
  {
    title: "Instant Refund Shield 🔒",
    description:
      "We believe in zero locked funds. If the local cellular networks stall or a blockchain delay occurs exceeding 5 minutes, Swiftpay triggers an automatic on-chain refund directly back to your address.",
    icon: (
      <div className="w-20 h-20 rounded-3xl bg-[#0c1424] border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] text-[#10b981]">
        <Sparkles className="w-10 h-10" />
      </div>
    ),
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleNext = () => {
    if (currentIdx < slides.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      id="onboarding_container"
      className="fixed inset-0 z-50 bg-[#070b13] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-black pointer-events-none" />

      {/* Slide Card Container exactly matching Screenshot 2 */}
      <div
        id="onboarding_modal_card"
        className="w-full max-w-md bg-[#0c1424] border border-slate-800 rounded-[32px] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.6)] relative z-10 flex flex-col items-center text-center overflow-hidden"
      >
        {/* Header decoration */}
        <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-900/60 text-[10px] font-bold text-emerald-400 px-3 py-1 rounded-full mb-8">
          OVERVIEW • STEP {currentIdx + 1} OF {slides.length}
        </div>

        {/* Dynamic Graphic with Slider Animation */}
        <div className="h-28 flex items-center justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {slides[currentIdx].icon}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content Section */}
        <div className="space-y-4 min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {slides[currentIdx].title}
              </h3>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed font-normal">
                {slides[currentIdx].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 my-8">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIdx ? "w-8 bg-[#10b981]" : "w-2.5 bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Button Controls exactly styled like Screenshot 2 */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            id="onboarding_skip_button"
            onClick={onComplete}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-bold text-sm tracking-wide transition-colors border border-slate-800"
          >
            SKIP
          </button>
          <button
            id="onboarding_next_button"
            onClick={handleNext}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#10b981] hover:bg-emerald-500 text-white font-bold text-sm tracking-wide transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
          >
            {currentIdx === slides.length - 1 ? "FINISH" : "NEXT"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
