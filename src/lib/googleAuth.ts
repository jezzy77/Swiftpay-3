import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App if not already done
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with Drive Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/drive");
googleProvider.addScope("https://www.googleapis.com/auth/drive.file");
googleProvider.addScope("https://www.googleapis.com/auth/drive.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/drive.metadata.readonly");

// In-memory token storage (Do NOT persist in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we don't have token cached yet, clear state
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Google Auth error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign Out
export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Get current cached access token
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Set token directly (e.g. if restored from flow)
export const setGoogleAccessToken = (token: string) => {
  cachedAccessToken = token;
};

// --- Google Drive API Integrations ---

/**
 * Find or create a folder named "Swiftpay Receipts" in Google Drive.
 */
export async function getOrCreateReceiptsFolder(accessToken: string): Promise<string> {
  const folderName = "Swiftpay Receipts";
  
  // 1. Search for existing folder
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  try {
    const searchRes = await fetch(searchUrl, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    if (!searchRes.ok) {
      throw new Error(`Failed to search Drive folder: ${searchRes.statusText}`);
    }
    
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    
    // 2. Folder does not exist, create it
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder"
      })
    });
    
    if (!createRes.ok) {
      throw new Error(`Failed to create receipts folder: ${createRes.statusText}`);
    }
    
    const createData = await createRes.json();
    return createData.id;
  } catch (err) {
    console.error("getOrCreateReceiptsFolder error:", err);
    throw err;
  }
}

/**
 * Upload a file to Google Drive (PDF statement or transaction history JSON)
 */
export async function uploadFileToDrive(
  accessToken: string,
  filename: string,
  mimeType: string,
  contentBlob: Blob,
  folderId?: string
): Promise<any> {
  const boundary = "-------SwiftpayMultipartBoundary31415926535";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: filename,
    mimeType: mimeType,
    parents: folderId ? [folderId] : []
  };

  const metadataPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  
  // Convert blob content to base64 encoding
  const base64Content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file content blob"));
    reader.readAsDataURL(contentBlob);
  });

  const headerBlob = new Blob([
    delimiter,
    metadataPart,
    delimiter,
    `Content-Type: ${mimeType}\r\n`,
    `Content-Transfer-Encoding: base64\r\n\r\n`
  ]);

  const bodyBlob = new Blob([
    headerBlob,
    base64Content,
    closeDelimiter
  ]);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: bodyBlob
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive file upload failed: ${res.statusText} - ${text}`);
  }

  return await res.json();
}

/**
 * List files in the specific Google Drive folder.
 */
export async function listReceiptsFiles(accessToken: string, folderId: string): Promise<any[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,webViewLink,size)&orderBy=createdTime desc`;
  
  try {
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to list receipts: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error("listReceiptsFiles error:", err);
    throw err;
  }
}

/**
 * Download a file's content from Google Drive (e.g. for restoring transaction history backup).
 */
export async function downloadDriveFile(accessToken: string, fileId: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  try {
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to download file from Drive: ${res.statusText}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("downloadDriveFile error:", err);
    throw err;
  }
}
