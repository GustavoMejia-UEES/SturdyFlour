import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const env = getRequestContext().env;
  try {
    // Attempt manual sqlite alteration via the underlying raw statement interface
    await env.DB.prepare("ALTER TABLE courses ADD COLUMN theme_color TEXT DEFAULT '#2563eb'").run();
    return NextResponse.json({ success: true, message: "Migration applied successfully" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Already exists?" });
  }
}
