import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const GOAL_HISTORY_STORAGE_KEY = 'claudoro_goal_history'
const GOAL_HISTORY_STORAGE_VERSION = 1

export interface GoalRecord {
  date: string
  text: string
  completed: boolean
  completedAt: number | null
}

interface GoalHistoryState {
  goals: GoalRecord[]
  syncTodayGoal: (text: string) => void
  completeTodayGoal: () => void
}

interface UseGoalHistoryResult {
  goals: GoalRecord[]
  todayGoal: GoalRecord | null
  syncTodayGoal: (text: string) => void
  completeTodayGoal: () => void
}

const toDateKey = (date: Date): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

const getTodayKey = (): string => toDateKey(new Date())

const sortAndLimit = (goals: GoalRecord[]): GoalRecord[] => {
  return goals.sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-180)
}

const useGoalHistoryStore = create<GoalHistoryState>()(
  persist(
    (set) => ({
      goals: [],

      syncTodayGoal: (text) => {
        const today = getTodayKey()
        const trimmed = text.trim()

        set((state) => {
          const nextGoals = [...state.goals]
          const index = nextGoals.findIndex((goal) => goal.date === today)

          if (!trimmed) {
            if (index >= 0 && !nextGoals[index].completed) {
              nextGoals.splice(index, 1)
            }

            return { goals: sortAndLimit(nextGoals) }
          }

          if (index >= 0) {
            const current = nextGoals[index]
            const changed = current.text !== trimmed

            nextGoals[index] = {
              ...current,
              text: trimmed,
              completed: changed ? false : current.completed,
              completedAt: changed ? null : current.completedAt
            }
          } else {
            nextGoals.push({
              date: today,
              text: trimmed,
              completed: false,
              completedAt: null
            })
          }

          return { goals: sortAndLimit(nextGoals) }
        })
      },

      completeTodayGoal: () => {
        const today = getTodayKey()

        set((state) => {
          const nextGoals = [...state.goals]
          const index = nextGoals.findIndex((goal) => goal.date === today)

          if (index < 0) {
            return state
          }

          const current = nextGoals[index]

          if (!current.text.trim() || current.completed) {
            return state
          }

          nextGoals[index] = {
            ...current,
            completed: true,
            completedAt: Date.now()
          }

          return { goals: sortAndLimit(nextGoals) }
        })
      }
    }),
    {
      name: GOAL_HISTORY_STORAGE_KEY,
      version: GOAL_HISTORY_STORAGE_VERSION,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<GoalHistoryState>
        return {
          goals: state.goals ?? []
        }
      }
    }
  )
)

export const useGoalHistory = (): UseGoalHistoryResult => {
  const goals = useGoalHistoryStore((state) => state.goals)
  const syncTodayGoal = useGoalHistoryStore((state) => state.syncTodayGoal)
  const completeTodayGoal = useGoalHistoryStore((state) => state.completeTodayGoal)

  const today = getTodayKey()
  const todayGoal = goals.find((goal) => goal.date === today) ?? null

  return {
    goals,
    todayGoal,
    syncTodayGoal,
    completeTodayGoal
  }
}
