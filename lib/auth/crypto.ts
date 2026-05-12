/**
 * Edge-Native Secure Password Hashing using WebCrypto API
 * Works perfectly inside Cloudflare Workers without external native dependencies like bcrypt.
 */

// Using PBKDF2 with SHA-256 as recommended standard.
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // 128 bits salt

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hashes a raw password into a string format storing both salt and derived key.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256 // key length in bits
  );

  const saltBase64 = arrayBufferToBase64(salt);
  const keyBase64 = arrayBufferToBase64(derivedKey);

  // Store together separated by dot for simplicity: "salt.derivedKey"
  return `${saltBase64}.${keyBase64}`;
}

/**
 * Compares a raw password with a previously stored composite hash string.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltBase64, originalKeyBase64] = storedHash.split('.');
    if (!saltBase64 || !originalKeyBase64) return false;

    const salt = base64ToArrayBuffer(saltBase64);
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new Uint8Array(salt),
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    const newKeyBase64 = arrayBufferToBase64(derivedKey);
    
    // Standard string comparison (sufficient since derivation cost dominates attack vectors)
    return newKeyBase64 === originalKeyBase64;
  } catch (e) {
    console.error("Password verification failed", e);
    return false;
  }
}
