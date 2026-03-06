import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STATS_STORAGE_KEY = 'claudoro_stats'
const STATS_STORAGE_VERSION = 1

export interface DailyStat {
  date: string
  completedSessions: number
  focusMinutes: number
}

interface RecordFocusOptions {
  countCompleted?: boolean
}

interface StatsState {
  dailyStats: DailyStat[]
  currentStreak: number
  lastActiveDate: string | null
  recordFocusSession: (durationSeconds: number, options?: RecordFocusOptions) => void
  recordPomodoroSession: (durationSeconds: number) => void
}

interface UseStatsResult {
  dailyStats: DailyStat[]
  todayCompletedSessions: number
  todayFocusMinutes: number
  currentStreak: number
  longestStreak: number
  recordFocusSession: (durationSeconds: number, options?: RecordFocusOptions) => void
  recordPomodoroSession: (durationSeconds: number) => void
}

const formatDate = (date: Date): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

const getTodayKey = (): string => formatDate(new Date())

const subtractDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() - days)
  return next
}

const getActiveDates = (dailyStats: DailyStat[]): string[] => {
  return dailyStats
    .filter((stat) => stat.completedSessions > 0 || stat.focusMinutes > 0)
    .map((stat) => stat.date)
    .sort((a, b) => (a > b ? 1 : -1))
}

const calculateCurrentStreak = (dailyStats: DailyStat[]): number => {
  const activeDays = new Set(getActiveDates(dailyStats))

  let streak = 0
  let cursor = new Date()

  while (activeDays.has(formatDate(cursor))) {
    streak += 1
    cursor = subtractDays(cursor, 1)
  }

  return streak
}

const calculateLongestStreak = (dailyStats: DailyStat[]): number => {
  const activeDates = getActiveDates(dailyStats)

  if (activeDates.length === 0) {
    return 0
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < activeDates.length; index += 1) {
    const prev = new Date(`${activeDates[index - 1]}T00:00:00`)
    const next = new Date(`${activeDates[index]}T00:00:00`)

    const gap = Math.round((next.getTime() - prev.getTime()) / 86_400_000)

    if (gap === 1) {
      current += 1
      longest = Math.max(longest, current)
      continue
    }

    current = 1
  }

  return longest
}

const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      dailyStats: [],
      currentStreak: 0,
      lastActiveDate: null,

      recordFocusSession: (durationSeconds, options) => {
        const today = getTodayKey()
        const roundedMinutes = Math.max(1, Math.round(durationSeconds / 60))
        const countCompleted = options?.countCompleted ?? true

        set((state) => {
          const index = state.dailyStats.findIndex((item) => item.date === today)
          const nextDailyStats = [...state.dailyStats]

          if (index >= 0) {
            const target = nextDailyStats[index]
            nextDailyStats[index] = {
              ...target,
              completedSessions: target.completedSessions + (countCompleted ? 1 : 0),
              focusMinutes: target.focusMinutes + roundedMinutes
            }
          } else {
            nextDailyStats.push({
              date: today,
              completedSessions: countCompleted ? 1 : 0,
              focusMinutes: roundedMinutes
            })
          }

          const limited = nextDailyStats.sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-120)

          return {
            dailyStats: limited,
            lastActiveDate: today,
            currentStreak: calculateCurrentStreak(limited)
          }
        })
      },

      recordPomodoroSession: (durationSeconds) => {
        get().recordFocusSession(durationSeconds, { countCompleted: true })
      }
    }),
    {
      name: STATS_STORAGE_KEY,
      version: STATS_STORAGE_VERSION,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<StatsState>

        return {
          dailyStats: state.dailyStats ?? [],
          currentStreak: state.currentStreak ?? 0,
          lastActiveDate: state.lastActiveDate ?? null
        }
      }
    }
  )
)

export const useStats = (): UseStatsResult => {
  const today = getTodayKey()
  const dailyStats = useStatsStore((state) => state.dailyStats)
  const currentStreak = useStatsStore((state) => state.currentStreak)
  const recordFocusSession = useStatsStore((state) => state.recordFocusSession)
  const recordPomodoroSession = useStatsStore((state) => state.recordPomodoroSession)

  const todayStat = dailyStats.find((stat) => stat.date === today)

  return {
    dailyStats,
    todayCompletedSessions: todayStat?.completedSessions ?? 0,
    todayFocusMinutes: todayStat?.focusMinutes ?? 0,
    currentStreak,
    longestStreak: calculateLongestStreak(dailyStats),
    recordFocusSession,
    recordPomodoroSession
  }
}
