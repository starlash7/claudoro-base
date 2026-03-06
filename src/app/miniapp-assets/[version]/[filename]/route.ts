import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'

const ASSET_TYPES: Record<string, string> = {
  'hero.png': 'image/png',
  'icon.png': 'image/png',
  'og.png': 'image/png',
  'screenshot-1.png': 'image/png',
  'screenshot-2.png': 'image/png',
  'screenshot-3.png': 'image/png',
  'splash.png': 'image/png'
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> }
): Promise<NextResponse> {
  const params = await context.params
  const filename = params.filename

  if (typeof filename !== 'string') {
    return new NextResponse('Not found', { status: 404 })
  }

  const contentType = ASSET_TYPES[filename]

  if (!contentType) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = path.join(process.cwd(), 'public', filename)
  const fileBuffer = await readFile(filePath)

  return new NextResponse(fileBuffer, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Type': contentType
    }
  })
}
