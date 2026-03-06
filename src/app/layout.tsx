import type { Metadata } from 'next'
import '@/renderer/src/styles/globals.css'
import { BASE_APP_ID } from '@/lib/miniapp'

export const metadata: Metadata = {
  other: {
    'base:app_id': BASE_APP_ID
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
