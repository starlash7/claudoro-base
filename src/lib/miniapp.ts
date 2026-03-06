const FALLBACK_HOME_URL = 'https://claudoro-base.vercel.app/claudoro'
export const BASE_APP_ID = process.env.NEXT_PUBLIC_BASE_APP_ID || '69aa69133c6755b23e8e40e9'

const normalizeUrl = (value: string): string => value.trim().replace(/\/$/, '')

export const APP_HOME_URL = normalizeUrl(process.env.NEXT_PUBLIC_URL || FALLBACK_HOME_URL)
export const APP_ORIGIN = new URL(APP_HOME_URL).origin
export const APP_HOME_PATH = new URL(APP_HOME_URL).pathname || '/'
export const ASSET_VERSION = normalizeUrl(
  process.env.NEXT_PUBLIC_ASSET_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || 'dev'
)

export const assetUrl = (filename: string): string =>
  `${APP_ORIGIN}/miniapp-assets/${encodeURIComponent(ASSET_VERSION)}/${encodeURIComponent(filename)}`

export const MINIAPP_EMBED = {
  version: 'next',
  imageUrl: assetUrl('og.png'),
  button: {
    title: 'Start Focus',
    action: {
      type: 'launch_miniapp',
      name: 'Claudoro',
      url: APP_HOME_URL,
      splashImageUrl: assetUrl('splash.png'),
      splashBackgroundColor: '#0B0F1A'
    }
  }
}
