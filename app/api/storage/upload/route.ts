import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    const env = getRequestContext().env;
    if (!env.R2) {
      return NextResponse.json({ error: 'R2 Bucket not bound in this environment' }, { status: 500 });
    }

    const fileExt = file.name.split('.').pop() || 'bin';
    const key = `${crypto.randomUUID()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    
    await env.R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      }
    });

    // Return local access URL
    return NextResponse.json({ 
      success: true, 
      key,
      url: `/api/storage/serve/${key}` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
