# 🇰🇪 Swiftpay — Non-Custodial Stablecoin Settlement Gateway

[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/styling-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/backend-Express%20Node.js-lightgrey.svg)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/auth-Firebase%20%2B%20Google%20OAuth-yellow.svg)](https://firebase.google.com/)

**Swiftpay** is a sovereign, non-custodial stablecoin-to-mobile-money settlement gateway operating in Kenya. It enables users to securely, frictionlessly, and instantly swap blockchain stablecoins (such as **USDC**) directly into mobile money balances (Safaricom **M-Pesa** & **Airtel Money**) with zero-knowledge, unlimited volume capabilities, and direct cellular network integrations.

---

## 🌌 Core Features

### 1. Multi-Chain Web3 Logins
- **Passkey Biometric Keyrings**: Passwordless biometrics utilizing WebAuthn / Passkeys (`@simplewebauthn`) for cryptographically locked identity nodes.
- **Ethereum SIWE**: Sign-In with Ethereum standard login using `viem` & `siwe` signatures.
- **Solana Adapter Context**: Connect native Solana wallets (Phantom, Solflare) using standard Solana Wallet Adapter tools.

### 2. Multi-Chain USDC Pipeline
- Supported networks: **Solana**, **Base**, **Ethereum**, and **Polygon**.
- **Live Rates Matrix**: Up-to-the-second currency conversions reflecting global USD/KES changes, liquified spreads, and transparent gas buffering.
- **Auto-Sensing Wallets**: Detects active connected sovereign address nodes, eliminating manual address input mistakes.

### 3. Google Drive Cloud Sync & Ledger Backup
- **Sovereign Authorization**: Links seamlessly to personal Google Cloud Storage using Google Auth (Firebase Client SDK + Popup).
- **Automated Directory Sync**: Automatically provisions and manages a custom `"Swiftpay Receipts"` folder at the root of the user's personal Google Drive.
- **Ledger Backups**: Exports the local transaction database into formatted JSON files and securely uploads them.
- **One-Click Restore**: Pulls historical transaction archives from Drive and merges them back into the live local database instantly.
- **Cloud Document Printer**: Compiles fully detailed transaction statements (via `jsPDF`) and uploads the PDF copies directly to the user's synced Drive directory.

### 4. Robust Simulation Suite
- Real-time blockchain deposit listeners.
- Interactive M-Pesa STK Push response and callback emulation.
- Auto-refund execution rules for faulty deposits.
- Active admin validation control panels.

### 5. Gemini AI Assistance
- Smart support helper powered by the **Google Gemini Pro model** via `@google/genai` SDK.
- Expert context on mobile money APIs, transactional rules, and cellular gateway routing.

---

## 🛠️ Technology Stack

| Layer | Technology / Library |
|---|---|
| **Frontend Framework** | React 19, Vite, TypeScript |
| **Styling & Layout** | Tailwind CSS v4, Motion (animations), Lucide Icons |
| **Backend Framework** | Node.js, Express (custom hybrid dev-server) |
| **API Client** | Axios |
| **Database Sync** | Local ledger state + Firebase SDK Client + Google Drive REST API |
| **Web3 Core** | Solana Web3 SDK, Solana Wallet Adapter, SIWE, Viem, Tweetnacl |
| **Payment Integration** | Circle Fin SDK, Safaricom Daraja API specs |
| **Doc Compiler** | jsPDF (Dynamic PDF Statement compiler) |
| **AI Integration** | Google GenAI SDK (`@google/genai`) |

---

## 🚀 Setup and Installation

### 1. Clone & Install Dependencies
First, install all node modules required by the package manager:
```bash
npm install
```

### 2. Environment Variables Configuration
Create a `.env` file in your root folder based on the provided `.env.example`:
```env
# Google Gemini API Config
GEMINI_API_KEY="your_google_gemini_api_key"

# App Location Links
APP_URL="http://localhost:3000"

# Daraja Safaricom credentials (Optional for live production)
MPESA_CONSUMER_KEY=""
MPESA_CONSUMER_SECRET=""
MPESA_PASSKEY=""
MPESA_SHORTCODE=""
MPESA_CALLBACK_URL=""
```

### 3. Launch Development Server
Boot the custom Express + Vite unified server:
```bash
npm run dev
```
The server binds to port **3000** at `http://localhost:3000`.

### 4. Compile and Run Production
Bundle static assets and compile backend typescript:
```bash
npm run build
npm start
```

---

## 📑 System Operations Flow

```
   [Sovereign Wallet / Passkey]
                │
                ▼
      [Select Pipeline Chain]
 (Solana, Base, Ethereum, Polygon)
                │
                ▼
  [Input Mobile Line Details]
(KES Amount, Safaricom / Airtel Provider)
                │
                ▼
     [Auto-Sensed SWAP Node]
 (AML Scan -> Initiate USDC deposit)
                │
                ▼
     [Real-Time M-Pesa Payout]
 (Trigger STK / Callback Simulation)
                │
                ▼
 [Cloud Sync / Drive Statement Backup]
   ("Swiftpay Receipts" Folder Synced)
```

---

## 🛡️ Security & Zero-Knowledge Architecture
1. **In-Memory Access Tokens**: Google Drive OAuth authorization tokens are processed strictly in-memory. They are never written, cached, or transmitted to any third-party servers.
2. **Sovereign Data Storage**: Local transaction records are compiled client-side and saved exclusively under the user's private Google Cloud space inside the dedicated `"Swiftpay Receipts"` workspace folder.
3. **Non-Custodial Escrow**: Transaction routing operates directly between user addresses and Safaricom/Airtel API endpoints via secure, authenticated cellular nodes.
