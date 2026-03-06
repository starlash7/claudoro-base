import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useGoalHistory } from '../../hooks/useGoalHistory'
import { useTimerStore } from '../../store/timerStore'

const getTodayKey = (): string => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return `claudoro_goal_${local.toISOString().slice(0, 10)}`
}

export default function GoalInput(): React.JSX.Element {
  const goal = useTimerStore((state) => state.goal)
  const setGoal = useTimerStore((state) => state.setGoal)
  const status = useTimerStore((state) => state.status)
  const { todayGoal, syncTodayGoal, completeTodayGoal } = useGoalHistory()
  const isGoalCompleted = Boolean(todayGoal?.completed)

  useEffect(() => {
    const saved = localStorage.getItem(getTodayKey())

    if (saved) {
      setGoal(saved)
      syncTodayGoal(saved)
    } else {
      setGoal('')
      syncTodayGoal('')
    }
  }, [setGoal, syncTodayGoal])

  return (
    <div className="terminal-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="terminal-kicker block" htmlFor="goal-input">
          Today&apos;s Goal
        </label>
        <button
          className={`terminal-btn px-2.5 py-1 ${
            isGoalCompleted ? 'terminal-btn-secondary' : 'terminal-btn-primary'
          }`}
          disabled={!goal.trim() || isGoalCompleted}
          onClick={() => {
            completeTodayGoal()
          }}
          type="button"
        >
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} />
            {isGoalCompleted ? 'Completed' : 'Complete'}
          </span>
        </button>
      </div>

      <input
        className="terminal-input w-full px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--terminal-dim)]"
        id="goal-input"
        onChange={(event) => {
          const nextGoal = event.target.value
          setGoal(nextGoal)
          localStorage.setItem(getTodayKey(), nextGoal)
          syncTodayGoal(nextGoal)
        }}
        readOnly={status === 'running'}
        type="text"
        value={goal}
      />

      <p className="mt-2 text-[11px] text-[var(--terminal-dim)]">
        {isGoalCompleted
          ? 'Marked complete for today.'
          : status === 'running'
            ? 'Every second counts.'
            : 'Keep it short, like a command before starting your session.'}
      </p>
    </div>
  )
}
