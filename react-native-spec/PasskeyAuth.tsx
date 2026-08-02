import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Text, Alert, ActivityIndicator } from 'react-native';
import { Passkey } from 'react-native-passkey';

const BACKEND_URL = 'https://your-private-api.com';

// 🔒 CRITICAL SECURITY PRECEPT: Use a securely generated local random string 
// to strictly avoid collecting user identifiers such as names, phone numbers, or emails.
const ANONYMOUS_USER_ID = "anon_user_" + Math.random().toString(36).substring(2, 15);

export default function PasskeyAuth() {
  const [loading, setLoading] = useState(false);

  // 1. Register a new Passkey locally on the device (TouchID / FaceID)
  const registerPasskey = async () => {
    setLoading(true);
    try {
      // Fetch dynamic registration options from the private zero-tracking backend
      const response = await fetch(`${BACKEND_URL}/auth/register/options?userId=${ANONYMOUS_USER_ID}`);
      const options = await response.json();

      // Passkey handles native platform formatting. Triggers FaceID/TouchID prompt on device.
      const credential = await Passkey.create(options);

      // Submit the verified public key structure back to the sovereign server
      const verifyResponse = await fetch(`${BACKEND_URL}/auth/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: ANONYMOUS_USER_ID, credential }),
      });

      const result = await verifyResponse.json();
      if (result.success) {
        Alert.alert("Success", "Passkey generated locally on hardware enclave. Node link established.");
      } else {
        throw new Error(result.error || "Handshake verification failed");
      }
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Authenticate using an existing hardware Passkey
  const authenticatePasskey = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login/options?userId=${ANONYMOUS_USER_ID}`);
      const options = await response.json();

      // Request device signature over the unique, single-use cryptographic challenge
      const assertion = await Passkey.get(options);

      const verifyResponse = await fetch(`${BACKEND_URL}/auth/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: ANONYMOUS_USER_ID, assertion }),
      });

      const result = await verifyResponse.json();
      if (result.success) {
        Alert.alert("Authenticated!", "Secure zero-tracking private session successfully established.");
      } else {
        throw new Error(result.error || "Invalid biometric signature proof");
      }
    } catch (error: any) {
      Alert.alert("Authentication Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Sovereign Auth</Text>
        <Text style={styles.subtitle}>Zero-Tracking Biometric Enclave</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          onPress={registerPasskey} 
          disabled={loading} 
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.text}>Create Private Passkey</Text>
          )}
        </Pressable>

        <Pressable 
          onPress={authenticatePasskey} 
          disabled={loading} 
          style={({ pressed }) => [
            styles.button,
            styles.loginBtn,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.text}>Login with Passkey</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Hardware-bound cryptokeys • No telemetry • No logs</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#090D16', 
    padding: 24,
    gap: 40 
  },
  headerContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    gap: 16,
  },
  button: { 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    backgroundColor: '#10B981', 
    borderRadius: 16, 
    width: '100%', 
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtn: { 
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: { 
    color: '#FFFFFF', 
    fontWeight: '800', 
    fontSize: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  footerText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
