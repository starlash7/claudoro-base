import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const APP_STORAGE_KEY = 'claudoro_app'
const APP_STORE_VERSION = 1
const ONBOARDING_VERSION = 1

interface AppState {
  onboardingVersion: number
  hasCompletedOnboarding: boolean
  completeOnboarding: () => void
  resetOnboarding: () => void
}

type PersistedAppState = Pick<AppState, 'onboardingVersion' | 'hasCompletedOnboarding'>

const defaultPersistedAppState: PersistedAppState = {
  onboardingVersion: 0,
  hasCompletedOnboarding: false
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...defaultPersistedAppState,
      completeOnboarding: () => {
        set({
          onboardingVersion: ONBOARDING_VERSION,
          hasCompletedOnboarding: true
        })
      },
      resetOnboarding: () => {
        set(defaultPersistedAppState)
      }
    }),
    {
      name: APP_STORAGE_KEY,
      version: APP_STORE_VERSION,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<PersistedAppState>

        return {
          onboardingVersion: state.onboardingVersion ?? 0,
          hasCompletedOnboarding: state.hasCompletedOnboarding ?? false
        } as PersistedAppState
      }
    }
  )
)

export const useShouldShowOnboarding = (): boolean => {
  const onboardingVersion = useAppStore((state) => state.onboardingVersion)
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding)

  return !hasCompletedOnboarding || onboardingVersion < ONBOARDING_VERSION
}
