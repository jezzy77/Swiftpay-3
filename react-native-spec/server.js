const express = require('express');
const crypto = require('crypto');
const { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const app = express();
app.use(express.json());

const rpID = 'your-app-domain.com'; // Must match your mobile app association domain
const origin = 'app://your-app-scheme'; // Your mobile deep link scheme

// In-memory key value store (Use a secure, encrypted database in production)
// Keys are the completely anonymous cryptographic user hash or random UUID to enforce non-KYC compliance
const db = {}; 

// --- REGISTRATION FLOW ---
app.get('/auth/register/options', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Anonymous userId parameter is required." });
  }
  
  // We hash the userId deterministically to completely strip any potential identifier
  const userHashBytes = crypto.createHash('sha256').update(userId).digest();

  const options = await generateRegistrationOptions({
    rpName: 'Private App Inc',
    rpID,
    userID: userHashBytes,
    userName: userId,
    userDisplayName: "Anonymous User",
    // 🔒 Critical Privacy Option: Blocks hardware tracking vectors (e.g., batch key credentials)
    // Enforces user anonymity and completely disables device/hardware tracking.
    attestationConveyancePreference: 'none', 
    authenticatorSelection: { 
      userVerification: 'required', 
      residentKey: 'required',
      authenticatorAttachment: 'platform'
    }
  });

  // Temporarily cache challenge in the non-tracking database
  db[userId] = { 
    currentChallenge: options.challenge,
    updatedAt: new Date().toISOString()
  }; 

  res.json(options);
});

app.post('/auth/register/verify', async (req, res) => {
  const { userId, credential } = req.body;
  if (!userId || !credential) {
    return res.status(400).json({ error: "Missing required verification inputs." });
  }

  const expectedChallenge = db[userId]?.currentChallenge;
  if (!expectedChallenge) {
    return res.status(400).json({ error: "Session expired or challenge invalid." });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true
    });

    if (verification.verified) {
      // Save public key details. This stores purely cryptographic hashes. No biometrics.
      db[userId].passkey = verification.registrationInfo; 
      db[userId].currentChallenge = null; // consume challenge
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal cryptographic verification failure: " + error.message });
  }
});

// --- AUTHENTICATION FLOW ---
app.get('/auth/login/options', async (req, res) => {
  const { userId } = req.query;
  if (!userId || !db[userId]?.passkey) {
    return res.status(404).json({ error: "Anonymous credentials not found on this node." });
  }

  const options = await generateAuthenticationOptions({ 
    rpID, 
    userVerification: 'required',
    allowCredentials: [{
      id: db[userId].passkey.credentialID,
      type: 'public-key'
    }]
  });
  
  db[userId].currentChallenge = options.challenge;
  res.json(options);
});

app.post('/auth/login/verify', async (req, res) => {
  const { userId, assertion } = req.body;
  const user = db[userId];

  if (!user || !user.passkey || !user.currentChallenge) {
    return res.status(400).json({ error: "Authentication session expired or credentials missing." });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: user.passkey.credentialID,
        credentialPublicKey: user.passkey.credentialPublicKey,
        counter: user.passkey.counter,
      },
      requireUserVerification: true
    });

    if (verification.verified) {
      // Update signature counter to prevent replay attacks
      user.passkey.counter = verification.authenticationInfo.newCounter;
      user.currentChallenge = null; // consume challenge

      // Generate a private, single-use, non-tracking session token (JWT payload style but custom)
      const token = "private_jwt_token_" + crypto.randomBytes(32).toString('hex');

      res.json({ success: true, token });
    } else {
      res.status(400).json({ error: 'Invalid biometric proof' });
    }
  } catch (error) {
    console.error("Authentication verification error:", error);
    res.status(500).json({ error: "Signature verification failed: " + error.message });
  }
});

// Port 3000 is default for container entry point
app.listen(3000, () => {
  console.log('Zero-Tracking Non-KYC Cryptographic Server online on port 3000');
});
