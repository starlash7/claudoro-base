'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-mono/500.css'
import '@fontsource/geist-mono/700.css'
import App from '@/renderer/src/App'
import { ensureElectronApiShim } from '@/lib/electronApiShim'

export default function ClaudoroClientApp(): React.JSX.Element {
  ensureElectronApiShim()

  useEffect(() => {
    sdk.actions.ready().catch(() => {
      // noop: app should still work in normal browser runtime.
    })
  }, [])

  return <App />
}
