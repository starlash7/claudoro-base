import type { Metadata } from 'next'
import { APP_HOME_URL, APP_ORIGIN, BASE_APP_ID, MINIAPP_EMBED } from '@/lib/miniapp'

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
