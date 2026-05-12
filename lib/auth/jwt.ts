import { SignJWT, jwtVerify, JWTPayload } from 'jose';

// Fallback default secret just in case, but should ALWAYS use process.env.JWT_SECRET in production
const DEFAULT_SECRET = 'sturdy-flour-super-ultra-secret-development-key-2026';

function getEncodedSecret(customSecret?: string) {
  const secret = customSecret || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface AuthPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Signs and creates an encoded JWT string for the target user payload.
 * Valid for 7 days by default.
 */
export async function signToken(
  payload: Omit<AuthPayload, 'iat' | 'exp'>,
  secretKey?: string
): Promise<string> {
  const encodedSecret = getEncodedSecret(secretKey);
  
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
    
  return token;
}

/**
 * Decrypts and verifies the token against our server secret.
 * Returns valid typed payload, or null if verification fails.
 */
export async function verifyToken(
  token: string,
  secretKey?: string
): Promise<AuthPayload | null> {
  try {
    const encodedSecret = getEncodedSecret(secretKey);
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ['HS256'],
    });
    
    return payload as AuthPayload;
  } catch (error) {
    // Token expired, malformed, or signature mismatch
    return null;
  }
}
