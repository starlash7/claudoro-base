import { CheckCircle2, Circle } from 'lucide-react'
import { useMemo } from 'react'
import { useGoalHistory } from '../../hooks/useGoalHistory'

const formatDate = (dateKey: string): string => {
  const date = new Date(`${dateKey}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export default function GoalSection(): React.JSX.Element {
  const { goals } = useGoalHistory()

  const recentGoals = useMemo(
    () =>
      goals
        .filter((goal) => goal.text.trim().length > 0)
        .sort((a, b) => (a.date > b.date ? -1 : 1))
        .slice(0, 20),
    [goals]
  )

  return (
    <section className="terminal-card p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="terminal-section-title">Goal History</h2>
        <span className="text-[11px] text-[var(--terminal-dim)]">{recentGoals.length} records</span>
      </div>

      {recentGoals.length === 0 ? (
        <div className="terminal-soft-card p-3 text-sm text-[var(--terminal-dim)]">
          No goal history yet. Add and complete your first goal in Timer.
        </div>
      ) : (
        <div className="terminal-soft-card divide-y divide-[rgba(217,119,87,0.16)] overflow-hidden">
          {recentGoals.map((goal) => (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5" key={goal.date}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--terminal-text)]">
                  {goal.text}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--terminal-dim)]">
                  {formatDate(goal.date)}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold tracking-[0.06em] ${
                  goal.completed
                    ? 'border-[rgba(36,132,79,0.35)] bg-[rgba(36,132,79,0.12)] text-[rgb(28,110,67)]'
                    : 'border-[rgba(217,119,87,0.28)] bg-[rgba(217,119,87,0.08)] text-[var(--terminal-dim)]'
                }`}
              >
                {goal.completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                {goal.completed ? 'Done' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
