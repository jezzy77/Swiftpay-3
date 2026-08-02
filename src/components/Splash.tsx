import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 18) + 8;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      id="splash_container"
      className="fixed inset-0 z-50 bg-[#070b13] flex flex-col items-center justify-between py-12 px-6 select-none overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-black pointer-events-none" />

      {/* Top Header Badge */}
      <div className="z-10 flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-1.5 rounded-full text-emerald-400 font-mono text-[10px] tracking-widest uppercase">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>Swiftpay Sovereign Protocol v2.0</span>
      </div>

      {/* 3D Flipping Swift Coin Section */}
      <div className="flex flex-col items-center justify-center relative my-auto z-10 space-y-6">
        
        {/* Concentric pulsing aura rings */}
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-56 h-56 rounded-full border border-emerald-500/30"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute w-48 h-48 rounded-full border border-amber-500/30"
          />

          {/* 3D FLIPPING SWIFT COIN CONTAINER */}
          <motion.div
            animate={{
              rotateY: [0, 360, 720, 1080],
              scale: [1, 1.06, 1]
            }}
            transition={{
              rotateY: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            }}
            style={{ transformStyle: "preserve-3d", perspective: 1000 }}
            className="w-40 h-40 rounded-full border-4 border-amber-400/90 shadow-[0_0_50px_rgba(245,158,11,0.4)] bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center relative cursor-pointer group"
            onClick={onComplete}
          >
            {/* Inner Metallic Coin Ring */}
            <div className="w-32 h-32 rounded-full border-2 border-amber-900/40 bg-gradient-to-b from-[#0e1a2e] to-[#08111e] flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-300/20 to-transparent animate-pulse" />
              
              {/* Swift Emblem Insignia */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-200/50 z-10">
                <span className="text-white text-4xl font-black tracking-tight drop-shadow-md">$</span>
              </div>

              <span className="text-[9px] font-black tracking-[0.2em] text-amber-300 uppercase mt-2 font-mono">
                SWIFT COIN
              </span>
            </div>
          </motion.div>
        </div>

        {/* Status Typography */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl font-black text-white tracking-[0.25em] uppercase">
            Swiftpay
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
            Decentralized Cross-Border Remittance & Instant Settlement Node
          </p>
          
          <div className="flex items-center gap-2 font-mono text-xs tracking-[0.15em] text-slate-400 pt-2">
            <span>FLIPPING COIN NODE...</span>
            <span className="text-emerald-400 font-bold font-mono">
              {Math.min(progress, 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Action to proceed straight to Sign In / Sign Up */}
      <div className="z-10 w-full max-w-xs space-y-3">
        <button
          id="btn_skip_splash"
          onClick={onComplete}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Proceed to Sign In / Sign Up</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    </div>
  );
};

