import { APP_HOME_URL, APP_ORIGIN } from '@/lib/miniapp'

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
    canonicalDomain: string
    primaryCategory: string
    tags: string[]
    heroImageUrl: string
    tagline: string
    ogTitle: string
    ogDescription: string
    ogImageUrl: string
    screenshotUrls: string[]
    requiredChains: string[]
    requiredCapabilities: string[]
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
      `${APP_ORIGIN}/screenshot-1.png,${APP_ORIGIN}/screenshot-2.png,${APP_ORIGIN}/screenshot-3.png`
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
      homeUrl: APP_HOME_URL,
      iconUrl: `${APP_ORIGIN}/icon.png`,
      imageUrl: `${APP_ORIGIN}/og.png`,
      buttonTitle: process.env.NEXT_PUBLIC_MINIAPP_BUTTON_TITLE || 'Start Focus',
      splashImageUrl: `${APP_ORIGIN}/splash.png`,
      splashBackgroundColor: process.env.NEXT_PUBLIC_MINIAPP_SPLASH_BG || '#0B0F1A',
      subtitle,
      description,
      canonicalDomain: APP_ORIGIN.replace(/^https?:\/\//, ''),
      primaryCategory,
      tags,
      heroImageUrl: `${APP_ORIGIN}/hero.png`,
      tagline,
      ogTitle: name,
      ogDescription: description,
      ogImageUrl: `${APP_ORIGIN}/og.png`,
      screenshotUrls: screenshots,
      requiredChains: ['eip155:8453'],
      requiredCapabilities: ['actions.ready']
    }
  }
}
