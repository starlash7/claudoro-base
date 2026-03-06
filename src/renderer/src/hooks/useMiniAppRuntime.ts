'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { APP_HOME_URL } from '@/lib/miniapp'

type MiniAppContext = Awaited<typeof sdk.context>
type SafeAreaInsets = NonNullable<MiniAppContext['client']['safeAreaInsets']>

export interface ShareProgressInput {
  goal: string
  completedSessions: number
  focusMinutes: number
}

interface ActionResult {
  ok: boolean
  message?: string
}

interface MiniAppRuntimeResult {
  isMiniApp: boolean
  isContextLoaded: boolean
  context: MiniAppContext | null
  isAdded: boolean
  userLabel: string
  userHandle: string | null
  userAvatarUrl: string | null
  locationLabel: string | null
  openProfile: () => Promise<void>
  saveMiniApp: () => Promise<ActionResult>
  shareProgress: (input: ShareProgressInput) => Promise<ActionResult>
}

const SAFE_AREA_DEFAULTS = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)'
}

const applySafeAreaInsets = (insets?: SafeAreaInsets): void => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  root.style.setProperty('--miniapp-safe-area-top', insets ? `${insets.top}px` : SAFE_AREA_DEFAULTS.top)
  root.style.setProperty(
    '--miniapp-safe-area-right',
    insets ? `${insets.right}px` : SAFE_AREA_DEFAULTS.right
  )
  root.style.setProperty(
    '--miniapp-safe-area-bottom',
    insets ? `${insets.bottom}px` : SAFE_AREA_DEFAULTS.bottom
  )
  root.style.setProperty('--miniapp-safe-area-left', insets ? `${insets.left}px` : SAFE_AREA_DEFAULTS.left)
}

const getLocationLabel = (context: MiniAppContext | null): string | null => {
  if (!context?.location) {
    return null
  }

  switch (context.location.type) {
    case 'launcher':
      return 'Opened from your launcher'
    case 'channel':
      return `Opened from ${context.location.channel.name}`
    case 'cast_embed':
      return `Opened from @${context.location.cast.author.username || context.location.cast.author.fid}`
    case 'cast_share':
      return 'Opened from a shared cast'
    case 'notification':
      return 'Opened from a notification'
    case 'open_miniapp':
      return `Opened from ${context.location.referrerDomain}`
    default:
      return null
  }
}

const buildShareText = ({ goal, completedSessions, focusMinutes }: ShareProgressInput): string => {
  const sessionLabel = completedSessions === 1 ? '1 focus session' : `${completedSessions} focus sessions`
  const goalLine = goal.trim() ? ` Goal: ${goal.trim()}.` : ''

  return `I just finished ${sessionLabel} (${focusMinutes} min) in Claudoro on Base.${goalLine} Back to the next sprint.`
}

export const useMiniAppRuntime = (): MiniAppRuntimeResult => {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [isContextLoaded, setIsContextLoaded] = useState(false)
  const [context, setContext] = useState<MiniAppContext | null>(null)
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadContext = async (): Promise<void> => {
      const miniApp = await sdk.isInMiniApp().catch(() => false)

      if (cancelled) {
        return
      }

      setIsMiniApp(miniApp)

      if (!miniApp) {
        applySafeAreaInsets()
        setIsContextLoaded(true)
        return
      }

      const nextContext = await sdk.context.catch(() => null)

      if (cancelled) {
        return
      }

      setContext(nextContext)
      setIsAdded(nextContext?.client.added ?? false)
      applySafeAreaInsets(nextContext?.client.safeAreaInsets)
      setIsContextLoaded(true)
    }

    const handleMiniAppAdded = (): void => {
      setIsAdded(true)
    }

    const handleMiniAppRemoved = (): void => {
      setIsAdded(false)
    }

    void loadContext()

    sdk.on('miniAppAdded', handleMiniAppAdded)
    sdk.on('miniAppRemoved', handleMiniAppRemoved)

    return () => {
      cancelled = true
      sdk.off('miniAppAdded', handleMiniAppAdded)
      sdk.off('miniAppRemoved', handleMiniAppRemoved)
      applySafeAreaInsets()
    }
  }, [])

  const openProfile = useCallback(async (): Promise<void> => {
    if (!context?.user?.fid) {
      return
    }

    await sdk.actions.viewProfile({ fid: context.user.fid }).catch(() => {
      // noop - profile viewing is optional.
    })
  }, [context])

  const saveMiniApp = useCallback(async (): Promise<ActionResult> => {
    if (!isMiniApp) {
      return {
        ok: false,
        message: 'Open Claudoro inside Base App to save it.'
      }
    }

    if (isAdded) {
      return {
        ok: true,
        message: 'Already saved to your launcher.'
      }
    }

    try {
      await sdk.actions.addMiniApp()
      setIsAdded(true)
      return {
        ok: true,
        message: 'Saved to your Base App launcher.'
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AddMiniApp.InvalidDomainManifest') {
        return {
          ok: false,
          message: 'Save will work after accountAssociation is signed.'
        }
      }

      return {
        ok: false,
        message: 'Save was not completed.'
      }
    }
  }, [isAdded, isMiniApp])

  const shareProgress = useCallback(
    async (input: ShareProgressInput): Promise<ActionResult> => {
      if (!isMiniApp) {
        return {
          ok: false,
          message: 'Open Claudoro inside Base App to share progress.'
        }
      }

      try {
        const result = await sdk.actions.composeCast({
          text: buildShareText(input),
          embeds: [APP_HOME_URL]
        })

        return {
          ok: true,
          message: result?.cast ? 'Cast composer opened.' : 'Share composer opened.'
        }
      } catch {
        return {
          ok: false,
          message: 'Share was not completed.'
        }
      }
    },
    [isMiniApp]
  )

  const userLabel = useMemo(() => {
    if (!context?.user) {
      return 'Base builder'
    }

    return context.user.displayName?.trim() || context.user.username?.trim() || `FID ${context.user.fid}`
  }, [context])

  const userHandle = useMemo(() => {
    if (!context?.user?.username) {
      return null
    }

    return `@${context.user.username}`
  }, [context])

  const userAvatarUrl = context?.user?.pfpUrl?.trim() || null
  const locationLabel = useMemo(() => getLocationLabel(context), [context])

  return {
    isMiniApp,
    isContextLoaded,
    context,
    isAdded,
    userLabel,
    userHandle,
    userAvatarUrl,
    locationLabel,
    openProfile,
    saveMiniApp,
    shareProgress
  }
}
