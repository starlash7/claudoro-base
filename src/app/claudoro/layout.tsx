import type { Metadata } from 'next'
import { APP_HOME_URL, APP_ORIGIN, MINIAPP_EMBED } from '@/lib/miniapp'

const BASE_APP_ID = process.env.NEXT_PUBLIC_BASE_APP_ID || '69aa69133c6755b23e8e40e9'

export const metadata: Metadata = {
  metadataBase: new URL(APP_ORIGIN),
  title: 'Claudoro',
  description: 'Vibe coding timer miniapp on Base.',
  openGraph: {
    title: 'Claudoro',
    description: 'Vibe coding timer miniapp on Base.',
    url: APP_HOME_URL,
    images: [`${APP_ORIGIN}/og.png`]
  },
  other: {
    'base:app_id': BASE_APP_ID,
    'fc:miniapp': JSON.stringify(MINIAPP_EMBED),
    'fc:frame': JSON.stringify(MINIAPP_EMBED)
  }
}

export default function ClaudoroLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return <>{children}</>
}
