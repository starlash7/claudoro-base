const FALLBACK_APP_URL = 'https://claudoro-base.vercel.app'

const normalizeUrl = (value: string): string => value.replace(/\/$/, '')

export const APP_URL = normalizeUrl(process.env.NEXT_PUBLIC_URL || FALLBACK_APP_URL)

export const MINIAPP_EMBED = {
  version: 'next',
  imageUrl: `${APP_URL}/og.png`,
  button: {
    title: 'Start Focus',
    action: {
      type: 'launch_frame',
      name: 'Claudoro',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: '#0B0F1A'
    }
  }
}
