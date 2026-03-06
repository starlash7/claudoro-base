import type { Metadata } from 'next'
import '@/renderer/src/styles/globals.css'
import { APP_URL, MINIAPP_EMBED } from '@/lib/miniapp'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Claudoro',
  description: 'Vibe coding timer miniapp on Base.',
  openGraph: {
    title: 'Claudoro',
    description: 'Vibe coding timer miniapp on Base.',
    images: [`${APP_URL}/og.png`]
  },
  other: {
    'fc:miniapp': JSON.stringify(MINIAPP_EMBED),
    'fc:frame': JSON.stringify(MINIAPP_EMBED)
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
