import React from "react";
import { SystemRates } from "../types";
import { Activity, ShieldCheck, Coins, AlertTriangle } from "lucide-react";

interface NetworkStatusProps {
  rates: SystemRates | null;
  selectedChain: "ETH" | "POLYGON" | "BASE" | "SOL" | "TAPROOT";
  onSelectChain: (chain: "ETH" | "POLYGON" | "BASE" | "SOL" | "TAPROOT") => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  rates,
  selectedChain,
  onSelectChain,
}) => {
  if (!rates) {
    return (
      <div id="rates_loading" className="animate-pulse bg-gray-50 border border-gray-100 rounded-xl p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const chainsArray = Object.entries(rates.chains) as [
    "ETH" | "POLYGON" | "BASE" | "SOL" | "TAPROOT",
    any
  ][];

  return (
    <div id="network_status_card" className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Active Conversion Channels
        </h3>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> P2P Network Active
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {chainsArray.map(([key, info]) => {
          const isSelected = selectedChain === key;
          const isCongested = info.status === "congested";
          return (
            <button
              key={key}
              id={`chain_select_${key}`}
              onClick={() => onSelectChain(key)}
              className={`flex flex-col items-start p-3 rounded-lg text-left transition-all relative border ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20"
                  : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-gray-900">{key}</span>
                {isCongested && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
                {!isCongested && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-xs text-gray-500">{info.name}</span>
              <span className="text-xs font-semibold text-gray-700 mt-2">
                Gas: {info.feeUSDC} USDC
              </span>
              <span className="text-[10px] text-gray-400">~{info.speedSec}s settling</span>
            </button>
          );
        })}
      </div>

      {rates.chains[selectedChain].warning && (
        <div id="chain_warning_banner" className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 mb-4 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Network Channel Details ({selectedChain})</p>
            <p className="mt-0.5">{rates.chains[selectedChain].warning}</p>
          </div>
        </div>
      )}

      {selectedChain === "TAPROOT" && (
        <div id="taproot_non_custodial_info" className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 mb-4 animate-fadeIn space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            Sovereign Peer-to-Peer Protocol (RGB / Taproot Assets)
          </div>
          <p className="text-[11px] leading-relaxed">
            By utilizing Bitcoin Layer-2 smart channels (Taproot Assets & RGB), this terminal operates in a <strong>fully non-custodial, client-side validated state</strong>. 
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-0.5">No Intermediate Escrows</span>
              Coins remain locked in single-use seals on the Bitcoin UTXO set. No third-party or liquidity pool custody.
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-0.5">P2P Client Validation</span>
              Transfers are completed via direct off-chain proof swaps. Totally immune to regulatory custodian pool freezes.
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-50 pt-3 mt-1 grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-gray-400 block">DeFi Base Exchange Rate</span>
          <span className="font-mono text-sm font-semibold text-gray-800">
            1 USDC = {rates.baseRate} KES
          </span>
        </div>
        <div>
          <span className="text-gray-400 block">Settle Rate (1% Volatility Guard)</span>
          <span className="font-mono text-sm font-semibold text-emerald-600">
            1 USDC = {rates.effectiveRate} KES
          </span>
        </div>
      </div>
    </div>
  );
};
