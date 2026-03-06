const FALLBACK_HOME_URL = 'https://claudoro-base.vercel.app/claudoro'
export const BASE_APP_ID = process.env.NEXT_PUBLIC_BASE_APP_ID || '69aa69133c6755b23e8e40e9'

const normalizeUrl = (value: string): string => value.trim().replace(/\/$/, '')

export const APP_HOME_URL = normalizeUrl(process.env.NEXT_PUBLIC_URL || FALLBACK_HOME_URL)
export const APP_ORIGIN = new URL(APP_HOME_URL).origin
export const APP_HOME_PATH = new URL(APP_HOME_URL).pathname || '/'

export const MINIAPP_EMBED = {
  version: 'next',
  imageUrl: `${APP_ORIGIN}/og.png`,
  button: {
    title: 'Start Focus',
    action: {
      type: 'launch_miniapp',
      name: 'Claudoro',
      url: APP_HOME_URL,
      splashImageUrl: `${APP_ORIGIN}/splash.png`,
      splashBackgroundColor: '#0B0F1A'
    }
  }
}
