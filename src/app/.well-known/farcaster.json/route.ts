import { NextResponse } from 'next/server'
import { getMiniappManifest } from '@/lib/manifest'

export function GET(): NextResponse {
  return NextResponse.json(getMiniappManifest(), {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400'
    }
  })
}
