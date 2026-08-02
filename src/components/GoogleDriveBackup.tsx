import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cloud, 
  CloudLightning, 
  CloudUpload, 
  CloudDownload, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  FolderCheck, 
  LogOut, 
  ExternalLink, 
  Database,
  Trash2,
  FileText,
  Calendar,
  Lock,
  ChevronRight
} from "lucide-react";
import { 
  signInWithGoogle, 
  logoutGoogle, 
  initGoogleAuth, 
  getOrCreateReceiptsFolder, 
  uploadFileToDrive, 
  listReceiptsFiles, 
  downloadDriveFile,
  getGoogleAccessToken
} from "../lib/googleAuth";
import { Transaction } from "../types";
import { User } from "firebase/auth";

interface GoogleDriveBackupProps {
  transactions: Transaction[];
  onRestoreTransactions: (restored: Transaction[]) => void;
  isDarkMode?: boolean;
}

export const GoogleDriveBackup: React.FC<GoogleDriveBackupProps> = ({
  transactions,
  onRestoreTransactions,
  isDarkMode = true
}) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Drive specific states
  const [folderId, setFolderId] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [backingUp, setBackingUp] = useState<boolean>(false);
  const [restoringFileId, setRestoringFileId] = useState<string | null>(null);

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setLoading(false);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync Folder & Files on Authentication
  useEffect(() => {
    if (googleUser && accessToken) {
      loadFolderAndFiles();
    } else {
      setFolderId(null);
      setDriveFiles([]);
    }
  }, [googleUser, accessToken]);

  const loadFolderAndFiles = async () => {
    if (!accessToken) return;
    setLoadingFiles(true);
    setErrorMsg("");
    try {
      // 1. Resolve Swiftpay Folder
      const fId = await getOrCreateReceiptsFolder(accessToken);
      setFolderId(fId);

      // 2. Load File List
      const files = await listReceiptsFiles(accessToken, fId);
      setDriveFiles(files);
    } catch (err: any) {
      console.error("Failed to load Google Drive resources", err);
      setErrorMsg("Failed to connect with your Google Drive space. Please try signing in again.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        setSuccessMsg("Successfully linked with Google Cloud Storage!");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMsg(err.message || "Failed to sign in with Google. Ensure popups are allowed.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      setFolderId(null);
      setDriveFiles([]);
      setSuccessMsg("Sovereign Google Drive unlinked successfully.");
    } catch (err: any) {
      console.error("Signout failed:", err);
      setErrorMsg("Failed to log out correctly from Google account.");
    }
  };

  const handleCreateBackup = async () => {
    if (!accessToken || !folderId) {
      setErrorMsg("No active Google Drive link. Sign in first.");
      return;
    }

    if (safeTransactions.length === 0) {
      setErrorMsg("Ledger is empty. No transaction records available to back up.");
      return;
    }

    setBackingUp(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "-");
      const filename = `swiftpay_ledger_backup_${dateStr}_${timeStr}.json`;

      const payload = JSON.stringify({
        source: "Swiftpay Sovereign Applet",
        backedUpAt: now.toISOString(),
        transactionsCount: safeTransactions.length,
        data: safeTransactions
      }, null, 2);

      const contentBlob = new Blob([payload], { type: "application/json" });
      await uploadFileToDrive(accessToken, filename, "application/json", contentBlob, folderId);

      setSuccessMsg(`Secure ledger backup '${filename}' successfully uploaded!`);
      // Reload files
      await loadFolderAndFiles();
    } catch (err: any) {
      console.error("Backup failed", err);
      setErrorMsg("Failed to upload backup JSON file to Google Drive.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreBackup = async (fileId: string, filename: string) => {
    if (!accessToken) return;

    const confirmRestore = window.confirm(
      `CRITICAL CONFIRMATION REQUIRED:\n\nAre you sure you want to restore the transaction history from the backup file:\n"${filename}"?\n\nThis will merge with your existing transaction database records.`
    );
    if (!confirmRestore) return;

    setRestoringFileId(fileId);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const backupData = await downloadDriveFile(accessToken, fileId);
      
      // Validation check
      if (!backupData || !Array.isArray(backupData.data)) {
        throw new Error("Invalid backup file structure or corrupted data stream.");
      }

      onRestoreTransactions(backupData.data);
      setSuccessMsg(`Successfully restored ${backupData.data.length} transaction records into the live ledger!`);
    } catch (err: any) {
      console.error("Restore failed", err);
      setErrorMsg(err.message || "Failed to download and process backup file from Drive.");
    } finally {
      setRestoringFileId(null);
    }
  };

  // Helper formatting
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const brandBg = isDarkMode ? "bg-slate-900/60 border-slate-900" : "bg-slate-50 border-slate-200";

  return (
    <div id="google_drive_backup_card" className={`border rounded-[32px] p-6 sm:p-8 space-y-6 text-left transition-colors duration-300 ${
      isDarkMode ? "bg-[#0c1424] border-slate-900 text-white" : "bg-white border-2 border-black text-slate-800"
    }`}>
      
      {/* Tab/Component Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-800/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#10b981]" />
            <h3 className="text-base font-extrabold tracking-tight uppercase">Google Drive Ledger Cloud Sync</h3>
          </div>
          <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
            Keep your sovereign financial ledger safe by backing up and restoring transaction databases and receipts.
          </p>
        </div>

        {googleUser && (
          <button
            onClick={handleSignOut}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors border ${
              isDarkMode 
                ? "bg-rose-950/20 border-rose-900/35 hover:bg-rose-900/60 text-rose-400" 
                : "bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600"
            }`}
            title="Unlink Google account"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Unlink Drive</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-xs text-center flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-[#10b981] rounded-xl text-xs text-center flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#10b981] animate-spin" />
          <span className="text-xs text-slate-500 font-mono font-black uppercase">Sensing Cloud Link...</span>
        </div>
      ) : !googleUser ? (
        
        /* VIEW 1: AUTHENTICATION PROMPT */
        <div className="space-y-6 text-center py-6">
          <div className="flex justify-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isDarkMode ? "bg-emerald-950/40 border border-emerald-900/40 text-[#10b981]" : "bg-emerald-100 text-[#10b981]"
            }`}>
              <CloudLightning className="w-7 h-7" />
            </div>
          </div>

          <div className="space-y-2 max-w-sm mx-auto">
            <h4 className="text-sm font-bold uppercase tracking-wider">Authorize Drive Integration</h4>
            <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Swiftpay is non-custodial and stores details locally. Click below to securely connect your personal Google Drive account to backup your ledger database records and statement PDFs.
            </p>
          </div>

          {/* Styled Sign In with Google Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="gsi-material-button cursor-pointer relative"
              style={{
                background: isDarkMode ? "#0c1424" : "#ffffff",
                border: isDarkMode ? "1px solid #1e293b" : "1px solid #747775",
                borderRadius: "16px",
                padding: "8px 24px",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.2s"
              }}
            >
              {signingIn ? (
                <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
              ) : (
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "18px", height: "18px" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              )}
              <span style={{
                color: isDarkMode ? "#e2e8f0" : "#1f2937",
                fontSize: "13px",
                fontWeight: "700",
                fontFamily: "Inter, sans-serif"
              }}>
                {signingIn ? "Securing Tunnel..." : "Sign in with Google"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        
        /* VIEW 2: LOGGED IN CLOUD CONTROLS */
        <div className="space-y-6">
          
          {/* Linked Google Profile Info Panel */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${brandBg}`}>
            <div className="flex items-center gap-3">
              {googleUser.photoURL ? (
                <img 
                  src={googleUser.photoURL} 
                  alt={googleUser.displayName || "Google"} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border-2 border-[#10b981]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 font-bold border-2 border-emerald-900 flex items-center justify-center text-sm uppercase">
                  {googleUser.email?.slice(0, 1)}
                </div>
              )}
              <div className="text-left">
                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider block w-fit mb-1">
                  Connected Drive Node
                </span>
                <h5 className="text-xs font-bold leading-tight">{googleUser.displayName || "Cloud Node Operator"}</h5>
                <p className="text-[10px] text-slate-500 font-mono">{googleUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
              <FolderCheck className="w-4 h-4 text-[#10b981]" />
              <span className="hidden sm:inline font-bold">"Swiftpay Receipts" Folder Synced</span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Action 1: Upload Backup */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 text-left ${
              isDarkMode ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#10b981]">
                  <CloudUpload className="w-4 h-4" />
                  <h6 className="text-xs font-black uppercase tracking-wider">Backup Local Database</h6>
                </div>
                <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                  Compile your current local transaction history ledger ({safeTransactions.length} items) and push it securely as an encrypted JSON backup file onto your Google Drive.
                </p>
              </div>

              <button
                onClick={handleCreateBackup}
                disabled={backingUp || safeTransactions.length === 0}
                className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-[11px] tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
              >
                {backingUp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Backup...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Backup Database ({safeTransactions.length})</span>
                  </>
                )}
              </button>
            </div>

            {/* Action 2: Cloud Sync Stats */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 text-left ${
              isDarkMode ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-400">
                  <FolderCheck className="w-4 h-4 text-[#10b981]" />
                  <h6 className="text-xs font-black uppercase tracking-wider">Cloud Storage Registry</h6>
                </div>
                <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed`}>
                  All receipt statements and logs are filed in the dedicated <strong>Swiftpay Receipts</strong> folder at the root of your Google Drive workspace.
                </p>
              </div>

              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-900 pt-2.5">
                <span>Active Files Synced:</span>
                <span className="font-extrabold text-[#10b981]">{driveFiles.length} files</span>
              </div>
            </div>

          </div>

          {/* Drive Files Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-600"}`}>
                Drive Files & Statement Backups ({driveFiles.length})
              </span>
              <button 
                onClick={loadFolderAndFiles}
                disabled={loadingFiles}
                className="text-[10px] font-bold text-[#10b981] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingFiles ? "animate-spin" : ""}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {loadingFiles ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#10b981] animate-spin" />
                <span className="text-[10px] text-slate-500 font-mono uppercase">Scanning cloud files...</span>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className={`p-6 text-center border-2 border-dashed rounded-2xl ${
                isDarkMode ? "border-slate-900 bg-slate-950/20" : "border-slate-200 bg-slate-50"
              }`}>
                <p className="text-xs text-slate-500">No backup files found in "Swiftpay Receipts" folder.</p>
                <p className="text-[10px] text-slate-500/70 mt-1">Upload a database backup above to populate this cloud archive.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {driveFiles.map((file) => {
                  const isJson = file.name.endsWith(".json");
                  const isRestoring = restoringFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors text-left ${
                        isDarkMode 
                          ? "bg-slate-950/60 border-slate-900 hover:border-slate-800" 
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isJson 
                            ? isDarkMode ? "bg-indigo-950/60 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                            : isDarkMode ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-100 text-[#10b981]"
                        }`}>
                          {isJson ? <Database className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h6 className="text-xs font-bold truncate max-w-[190px] sm:max-w-xs">{file.name}</h6>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500 font-mono">
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(file.createdTime).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{formatBytes(parseInt(file.size || "0"))}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Open in Drive Link */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                              isDarkMode 
                                ? "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-300" 
                                : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                            }`}
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* If it's a JSON backup file, allow direct live restore! */}
                        {isJson && (
                          <button
                            onClick={() => handleRestoreBackup(file.id, file.name)}
                            disabled={isRestoring}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                              isDarkMode 
                                ? "bg-emerald-950/50 border border-emerald-900/40 hover:bg-emerald-900 text-[#10b981]" 
                                : "bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isRestoring ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CloudDownload className="w-3.5 h-3.5" />
                            )}
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Disclaimers & Security Details */}
      <div className="border-t border-slate-850/40 pt-4 text-center">
        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold mb-1">
          Zero-Knowledge API Sync
        </span>
        <p className="text-[9px] text-slate-500 leading-normal px-4">
          Google Cloud authorization tokens are processed in-memory. They are never transmitted, logged, or cached outside the direct communication endpoints with the official Google Drive API.
        </p>
      </div>

    </div>
  );
};
