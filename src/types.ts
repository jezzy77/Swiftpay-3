export interface KYCDetails {
  fullName: string;
  idNumber: string;
  email: string;
  sourceOfFunds: string;
}

export interface Transaction {
  id: string;
  recipientPhone: string;
  recipientName: string;
  amountKES: number;
  amountUSDC: number;
  exchangeRate: number;
  effectiveRate: number;
  chain: "ETH" | "POLYGON" | "BASE" | "SOL" | "TAPROOT";
  depositAddress: string;
  status: "initiated" | "awaiting_deposit" | "confirming_blockchain" | "swapping_to_kes" | "stk_push_sent" | "completed" | "failed" | "refunded" | "manual_review";
  kycRequired: boolean;
  kycSubmitted: boolean;
  kycDetails?: KYCDetails;
  senderWallet: string;
  createdAt: string;
  updatedAt: string;
  isSimulated: boolean;
  errorMessage?: string;
  refundAddress?: string;
  refundTxId?: string;
  payoutChannel?: "mpesa";
  recipientTag?: string;
  profitKES?: number;
  profitUSD?: number;
  otpVerified?: boolean;
  payoutProvider?: "safaricom" | "airtel";
  paymentType?: "send_money" | "paybill" | "till" | "stk_push";
  paybillNumber?: string;
  paybillAccount?: string;
  tillNumber?: string;
}

export interface ChainInfo {
  name: string;
  feeUSDC: number;
  speedSec: number;
  status: "optimal" | "congested";
  warning: string | null;
}

export interface SystemRates {
  baseRate: number;
  bufferPercentage: number;
  effectiveRate: number;
  effectiveRateOnramp: number;
  mpesaFee: number;
  chains: Record<"ETH" | "POLYGON" | "BASE" | "SOL" | "TAPROOT", ChainInfo>;
  spreadMode?: "max_profit" | "optimum" | "aggressive_volume" | "custom";
  showZeroFeesToUsers?: boolean;
  marginPercent?: number;
}

export interface AppSettings {
  selfCustodySolAddress: string;
  ownerEvmAddress?: string;
  ownerMpesaPhone?: string;
  ownerUsername?: string;
  ownerPassword?: string;
  spreadMode: "max_profit" | "optimum" | "aggressive_volume" | "custom";
  customSpreadPercent: number;
  showZeroFeesToUsers: boolean;
  aiSpreadOptimizerActive?: boolean;
}

export interface OwnerAIOptimizeResponse {
  recommendedSpreadPercent: number;
  recommendedMode: "max_profit" | "optimum" | "aggressive_volume" | "custom";
  rationale: string;
  forecastDailyProfitUSD: number;
  forecastDailyVolumeUSD: number;
  aiStrategyAdvice: string;
}
