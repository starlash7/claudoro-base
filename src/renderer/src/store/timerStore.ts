import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  POMODOROS_BEFORE_LONG_BREAK,
  TIMER_DURATIONS,
  type MascotState,
  type TimerMode,
  type TimerStatus
} from '../../../shared/constants'

const TIMER_STORAGE_KEY = 'claudoro_timer'
const TIMER_STORAGE_VERSION = 1
const RECOVERY_NOTICE_THRESHOLD_SECONDS = 20

interface TimerState {
  mode: TimerMode
  status: TimerStatus
  timeRemaining: number
  totalTime: number
  completedPomodoros: number
  mascotState: MascotState
  goal: string
  isCommitPromptOpen: boolean
  lastTickAt: number | null
  recoveryNoticeSeconds: number | null
  setMode: (mode: TimerMode) => void
  setGoal: (goal: string) => void
  openCommitPrompt: () => void
  closeCommitPrompt: () => void
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
  completeSession: () => void
  recoverElapsed: () => void
  clearRecoveryNotice: () => void
}

interface ElapsedResult {
  timeRemaining: number
  totalTime: number
  lastTickAt: number | null
}

const getModeDuration = (mode: TimerMode): number => {
  if (mode === 'deepFocus') {
    return 0
  }

  return TIMER_DURATIONS[mode]
}

const getMascotStateForMode = (mode: TimerMode): MascotState => {
  if (mode === 'shortBreak' || mode === 'longBreak') {
    return 'break'
  }

  return 'focusing'
}

const getElapsedSeconds = (lastTickAt: number | null, now = Date.now()): number => {
  if (!lastTickAt) {
    return 0
  }

  return Math.max(0, Math.floor((now - lastTickAt) / 1000))
}

const applyElapsed = (
  mode: TimerMode,
  timeRemaining: number,
  totalTime: number,
  lastTickAt: number | null,
  now = Date.now()
): ElapsedResult => {
  if (!lastTickAt) {
    return {
      timeRemaining,
      totalTime,
      lastTickAt
    }
  }

  const elapsedSeconds = getElapsedSeconds(lastTickAt, now)

  if (elapsedSeconds <= 0) {
    return {
      timeRemaining,
      totalTime,
      lastTickAt
    }
  }

  if (mode === 'deepFocus') {
    return {
      timeRemaining: timeRemaining + elapsedSeconds,
      totalTime: totalTime + elapsedSeconds,
      lastTickAt: now
    }
  }

  const nextTimeRemaining = Math.max(0, timeRemaining - elapsedSeconds)

  return {
    timeRemaining: nextTimeRemaining,
    totalTime,
    lastTickAt: nextTimeRemaining > 0 ? now : null
  }
}

const hasElapsedChanges = (
  previous: Pick<TimerState, 'timeRemaining' | 'totalTime' | 'lastTickAt'>,
  next: ElapsedResult
): boolean => {
  return (
    previous.timeRemaining !== next.timeRemaining ||
    previous.totalTime !== next.totalTime ||
    previous.lastTickAt !== next.lastTickAt
  )
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      mode: 'pomodoro',
      status: 'idle',
      timeRemaining: TIMER_DURATIONS.pomodoro,
      totalTime: TIMER_DURATIONS.pomodoro,
      completedPomodoros: 0,
      mascotState: 'idle',
      goal: '',
      isCommitPromptOpen: false,
      lastTickAt: null,
      recoveryNoticeSeconds: null,

      setMode: (mode) => {
        const modeDuration = getModeDuration(mode)

        set({
          mode,
          status: 'idle',
          timeRemaining: modeDuration,
          totalTime: modeDuration,
          mascotState: 'idle',
          lastTickAt: null,
          recoveryNoticeSeconds: null
        })
      },

      setGoal: (goal) => {
        set({ goal })
      },

      openCommitPrompt: () => {
        set({ isCommitPromptOpen: true })
      },

      closeCommitPrompt: () => {
        set({ isCommitPromptOpen: false })
      },

      start: () => {
        const { mode, timeRemaining, totalTime } = get()
        const modeDuration = getModeDuration(mode)
        const isCountUpMode = mode === 'deepFocus'
        const needsResetBeforeStart = !isCountUpMode && timeRemaining <= 0

        set({
          status: 'running',
          timeRemaining: needsResetBeforeStart ? modeDuration : timeRemaining,
          totalTime: needsResetBeforeStart || totalTime <= 0 ? modeDuration : totalTime,
          mascotState: getMascotStateForMode(mode),
          lastTickAt: Date.now(),
          recoveryNoticeSeconds: null
        })
      },

      pause: () => {
        const { mode, timeRemaining, totalTime, lastTickAt } = get()
        const synced = applyElapsed(mode, timeRemaining, totalTime, lastTickAt)

        set({
          ...synced,
          status: 'paused',
          mascotState: 'idle',
          lastTickAt: null,
          recoveryNoticeSeconds: null
        })
      },

      reset: () => {
        const { mode } = get()
        const modeDuration = getModeDuration(mode)

        set({
          status: 'idle',
          timeRemaining: modeDuration,
          totalTime: modeDuration,
          mascotState: 'idle',
          lastTickAt: null,
          recoveryNoticeSeconds: null
        })
      },

      tick: () => {
        const { status, mode, timeRemaining, totalTime, lastTickAt } = get()

        if (status !== 'running') {
          return
        }

        const synced = applyElapsed(mode, timeRemaining, totalTime, lastTickAt)

        if (
          !hasElapsedChanges(
            {
              timeRemaining,
              totalTime,
              lastTickAt
            },
            synced
          )
        ) {
          return
        }

        set(synced)
      },

      completeSession: () => {
        const { mode, completedPomodoros } = get()

        if (mode === 'pomodoro') {
          const nextPomodoros = completedPomodoros + 1
          const shouldLongBreak = nextPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0
          const nextMode: TimerMode = shouldLongBreak ? 'longBreak' : 'shortBreak'
          const duration = TIMER_DURATIONS[nextMode]

          set({
            mode: nextMode,
            status: 'idle',
            timeRemaining: duration,
            totalTime: duration,
            completedPomodoros: nextPomodoros,
            mascotState: 'complete',
            lastTickAt: null,
            recoveryNoticeSeconds: null
          })
          return
        }

        if (mode === 'shortBreak' || mode === 'longBreak') {
          set({
            mode: 'pomodoro',
            status: 'idle',
            timeRemaining: TIMER_DURATIONS.pomodoro,
            totalTime: TIMER_DURATIONS.pomodoro,
            mascotState: 'complete',
            lastTickAt: null,
            recoveryNoticeSeconds: null
          })
          return
        }

        set({
          status: 'idle',
          mascotState: 'complete',
          lastTickAt: null,
          recoveryNoticeSeconds: null
        })
      },

      recoverElapsed: () => {
        const { status, mode, timeRemaining, totalTime, lastTickAt } = get()

        if (status !== 'running') {
          return
        }

        const now = Date.now()
        const elapsedSeconds = getElapsedSeconds(lastTickAt, now)
        const synced = applyElapsed(mode, timeRemaining, totalTime, lastTickAt, now)

        if (
          !hasElapsedChanges(
            {
              timeRemaining,
              totalTime,
              lastTickAt
            },
            synced
          )
        ) {
          return
        }

        set({
          ...synced,
          recoveryNoticeSeconds:
            elapsedSeconds >= RECOVERY_NOTICE_THRESHOLD_SECONDS ? elapsedSeconds : null
        })
      },

      clearRecoveryNotice: () => {
        set({ recoveryNoticeSeconds: null })
      }
    }),
    {
      name: TIMER_STORAGE_KEY,
      version: TIMER_STORAGE_VERSION,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<TimerState>

        return {
          mode: state.mode ?? 'pomodoro',
          status: state.status ?? 'idle',
          timeRemaining: state.timeRemaining ?? TIMER_DURATIONS.pomodoro,
          totalTime: state.totalTime ?? TIMER_DURATIONS.pomodoro,
          completedPomodoros: state.completedPomodoros ?? 0,
          mascotState: state.mascotState ?? 'idle',
          goal: state.goal ?? '',
          lastTickAt: state.lastTickAt ?? null,
          recoveryNoticeSeconds: null
        }
      },
      partialize: (state) => ({
        mode: state.mode,
        status: state.status,
        timeRemaining: state.timeRemaining,
        totalTime: state.totalTime,
        completedPomodoros: state.completedPomodoros,
        mascotState: state.mascotState,
        goal: state.goal,
        lastTickAt: state.lastTickAt
      }),
      onRehydrateStorage: () => (state) => {
        state?.recoverElapsed()
      }
    }
  )
)
