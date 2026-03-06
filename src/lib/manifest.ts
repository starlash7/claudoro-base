import { APP_URL } from '@/lib/miniapp'

export interface MiniappManifest {
  accountAssociation: {
    header: string
    payload: string
    signature: string
  }
  miniapp: {
    version: '1'
    name: string
    homeUrl: string
    iconUrl: string
    imageUrl: string
    buttonTitle: string
    splashImageUrl: string
    splashBackgroundColor: string
    subtitle: string
    description: string
    primaryCategory: string
    tags: string[]
    heroImageUrl: string
    tagline: string
    ogTitle: string
    ogDescription: string
    ogImageUrl: string
    screenshotUrls: string[]
    requiredChains: string[]
  }
}

const byComma = (value: string): string[] => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const getMiniappManifest = (): MiniappManifest => {
  const name = process.env.NEXT_PUBLIC_MINIAPP_NAME || 'Claudoro'
  const subtitle = process.env.NEXT_PUBLIC_MINIAPP_SUBTITLE || 'Vibe coding focus timer'
  const description =
    process.env.NEXT_PUBLIC_MINIAPP_DESCRIPTION ||
    'Run focused coding sessions with Pomodoro, streak tracking, and optional GitHub context.'
  const tagline = process.env.NEXT_PUBLIC_MINIAPP_TAGLINE || 'Ship in focused sprints'
  const primaryCategory = process.env.NEXT_PUBLIC_MINIAPP_CATEGORY || 'productivity'
  const tags = byComma(process.env.NEXT_PUBLIC_MINIAPP_TAGS || 'focus,timer,pomodoro')

  const screenshots = byComma(
    process.env.NEXT_PUBLIC_MINIAPP_SCREENSHOTS ||
      `${APP_URL}/screenshot-1.png,${APP_URL}/screenshot-2.png,${APP_URL}/screenshot-3.png`
  )

  return {
    accountAssociation: {
      header: process.env.MINIAPP_ACCOUNT_ASSOCIATION_HEADER || 'REPLACE_WITH_HEADER',
      payload: process.env.MINIAPP_ACCOUNT_ASSOCIATION_PAYLOAD || 'REPLACE_WITH_PAYLOAD',
      signature: process.env.MINIAPP_ACCOUNT_ASSOCIATION_SIGNATURE || 'REPLACE_WITH_SIGNATURE'
    },
    miniapp: {
      version: '1',
      name,
      homeUrl: APP_URL,
      iconUrl: `${APP_URL}/icon.png`,
      imageUrl: `${APP_URL}/og.png`,
      buttonTitle: process.env.NEXT_PUBLIC_MINIAPP_BUTTON_TITLE || 'Start Focus',
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: process.env.NEXT_PUBLIC_MINIAPP_SPLASH_BG || '#0B0F1A',
      subtitle,
      description,
      primaryCategory,
      tags,
      heroImageUrl: `${APP_URL}/hero.png`,
      tagline,
      ogTitle: name,
      ogDescription: description,
      ogImageUrl: `${APP_URL}/og.png`,
      screenshotUrls: screenshots,
      requiredChains: ['eip155:8453']
    }
  }
}
