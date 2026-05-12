import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/crypto';
import { signToken } from '@/lib/auth/jwt';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Connect to DB
    const env = getRequestContext().env;
    // Safe retrieval of JWT_SECRET from Cloudflare env variables, fallback to default provided by helper if not set
    const jwtSecret = (env as any).JWT_SECRET as string | undefined;
    
    const db = getDb(env.DB);

    // Find user
    const [user] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Verify password via Edge-Native hash checker
    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Sign the secure JWT
    const token = await signToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret
    );

    // Create valid secure, HTTP-Only, SameSite cookie response
    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // True on production
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    return response;
  } catch (err: any) {
    console.error('Login execution error', err);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el login' },
      { status: 500 }
    );
  }
}
