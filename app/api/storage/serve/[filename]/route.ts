import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const env = getRequestContext().env;

  if (!env.R2) {
    return new NextResponse("R2 Storage not available", { status: 500 });
  }

  const object = await env.R2.get(filename);

  if (object === null) {
    return new NextResponse("Object Not Found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new NextResponse(object.body, {
    headers,
  });
}
