import { useMemo } from 'react'
import GoalSection from './GoalSection'
import { useStats } from '../../hooks/useStats'
import { useGitHub } from '../../hooks/useGitHub'
import { type StreakSource, useSettingsStore } from '../../store/settingsStore'
import StreakDetails from './StreakDetails'

interface StatCardProps {
  label: string
  value: string
}

interface ParsedValue {
  amount: string
  unit: string
}

interface StreakViewModel {
  activityByDate: Record<string, number>
  currentStreak: number
  longestStreak: number
  title: string
  summaryLabel: string
  tooltipSuffix: string
  colorScale: number[]
  dateRange?: {
    start: string
    end: string
  }
  showYearLabels?: boolean
}

const parseValue = (value: string): ParsedValue => {
  const match = value.trim().match(/^(\d+)([a-zA-Z]+)?$/)

  if (!match) {
    return { amount: value, unit: '' }
  }

  return {
    amount: match[1],
    unit: match[2] ?? ''
  }
}

function StatCard({ label, value }: StatCardProps): React.JSX.Element {
  const { amount, unit } = parseValue(value)

  return (
    <div className="terminal-soft-card stat-card flex min-h-[96px] flex-col justify-between p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">
        <span className="stat-card-number">{amount}</span>
        {unit ? <span className="stat-card-unit">{unit}</span> : null}
      </p>
    </div>
  )
}

const toDateKey = (date: Date): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

const getCurrentStreak = (activeDates: Set<string>): number => {
  let streak = 0
  const cursor = new Date()

  while (activeDates.has(toDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

const getLongestStreak = (activeDates: Set<string>): number => {
  const sorted = [...activeDates].sort((a, b) => (a > b ? 1 : -1))

  if (sorted.length === 0) {
    return 0
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < sorted.length; index += 1) {
    const prev = new Date(`${sorted[index - 1]}T00:00:00`)
    const next = new Date(`${sorted[index]}T00:00:00`)
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

const buildFocusActivityByDate = (
  dailyStats: Array<{ date: string; focusMinutes: number }>
): Record<string, number> => {
  return dailyStats.reduce<Record<string, number>>((map, stat) => {
    map[stat.date] = stat.focusMinutes
    return map
  }, {})
}

const buildGitHubActivityByDate = (
  contributionDays: Array<{ date: string; count: number }>
): Record<string, number> => {
  return contributionDays.reduce<Record<string, number>>((map, day) => {
    map[day.date] = day.count
    return map
  }, {})
}

const getCurrentYearDateRange = (): { start: string; end: string } => {
  const now = new Date()
  return {
    start: `${now.getFullYear()}-01-01`,
    end: `${now.getFullYear()}-12-31`
  }
}

const buildActiveDateSet = (activityByDate: Record<string, number>): Set<string> => {
  const activeDates = new Set<string>()

  Object.entries(activityByDate).forEach(([date, value]) => {
    if (value > 0) {
      activeDates.add(date)
    }
  })

  return activeDates
}

const buildHybridActivityByDate = (
  focusActivityByDate: Record<string, number>,
  githubActivityByDate: Record<string, number>
): Record<string, number> => {
  const dates = new Set([...Object.keys(focusActivityByDate), ...Object.keys(githubActivityByDate)])
  const map: Record<string, number> = {}

  dates.forEach((date) => {
    const hasFocus = (focusActivityByDate[date] ?? 0) > 0
    const hasGitHub = (githubActivityByDate[date] ?? 0) > 0
    map[date] = hasFocus || hasGitHub ? 1 : 0
  })

  return map
}

export default function Stats(): React.JSX.Element {
  const { dailyStats, todayCompletedSessions, todayFocusMinutes } = useStats()
  const streakSource = useSettingsStore((state) => state.streakSource)
  const setStreakSource = useSettingsStore((state) => state.setStreakSource)
  const isGitHubEnabled = useSettingsStore((state) => state.isGitHubEnabled)
  const { metrics, loading: githubLoading, error: githubError } = useGitHub()
  const currentYearDateRange = useMemo(() => getCurrentYearDateRange(), [])

  const streakView = useMemo<StreakViewModel>(() => {
    const focusActivityByDate = buildFocusActivityByDate(dailyStats)
    const githubActivityByDate = buildGitHubActivityByDate(metrics.contributionDays)
    const hybridActivityByDate = buildHybridActivityByDate(
      focusActivityByDate,
      githubActivityByDate
    )

    if (streakSource === 'github') {
      const activeDates = buildActiveDateSet(githubActivityByDate)

      return {
        activityByDate: githubActivityByDate,
        currentStreak: getCurrentStreak(activeDates),
        longestStreak: getLongestStreak(activeDates),
        title: 'GitHub Activity Heatmap',
        summaryLabel: 'contributions',
        tooltipSuffix: 'c',
        colorScale: [1, 2, 4, 8],
        dateRange: currentYearDateRange,
        showYearLabels: false
      }
    }

    if (streakSource === 'hybrid') {
      const activeDates = buildActiveDateSet(hybridActivityByDate)
      return {
        activityByDate: hybridActivityByDate,
        currentStreak: getCurrentStreak(activeDates),
        longestStreak: getLongestStreak(activeDates),
        title: 'Hybrid Activity Heatmap',
        summaryLabel: 'active days',
        tooltipSuffix: '',
        colorScale: [1]
      }
    }

    const activeDates = buildActiveDateSet(focusActivityByDate)
    return {
      activityByDate: focusActivityByDate,
      currentStreak: getCurrentStreak(activeDates),
      longestStreak: getLongestStreak(activeDates),
      title: 'Focus Heatmap',
      summaryLabel: 'minutes focused',
      tooltipSuffix: 'm',
      colorScale: [1, 20, 45, 90]
    }
  }, [currentYearDateRange, dailyStats, metrics.contributionDays, streakSource])

  const sourceOptions: Array<{ id: StreakSource; label: string }> = [
    { id: 'focus', label: 'Focus' },
    { id: 'github', label: 'GitHub' },
    { id: 'hybrid', label: 'Hybrid' }
  ]

  const shouldShowGitHubHint = streakSource !== 'focus'
  const sourceLabel =
    streakSource === 'focus' ? 'Focus' : streakSource === 'github' ? 'GitHub' : 'Hybrid'

  return (
    <section className="space-y-3">
      <section className="terminal-card space-y-2 p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="terminal-section-title">Today Stats</div>
          <span className="terminal-kicker">{`Streak Source: ${sourceLabel}`}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {sourceOptions.map((option) => {
            const isActive = streakSource === option.id

            return (
              <button
                className={`terminal-toggle-btn w-full px-2 py-1.5 text-[11px] font-semibold tracking-[0.06em] ${
                  isActive ? 'terminal-toggle-btn-active' : ''
                }`}
                key={option.id}
                onClick={() => {
                  setStreakSource(option.id)
                }}
                type="button"
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Completed" value={`${todayCompletedSessions}`} />
          <StatCard label="Focus Time" value={`${todayFocusMinutes}m`} />
          <StatCard label="Current Streak" value={`${streakView.currentStreak}d`} />
        </div>

        {shouldShowGitHubHint && !isGitHubEnabled ? (
          <p className="text-xs text-[var(--terminal-muted)]">
            Connect GitHub to include GitHub activity in streak.
          </p>
        ) : null}
        {shouldShowGitHubHint && isGitHubEnabled && githubLoading ? (
          <p className="text-xs text-[var(--terminal-muted)]">Syncing GitHub activity...</p>
        ) : null}
        {shouldShowGitHubHint && githubError ? (
          <p className="text-xs text-[var(--accent-strong)]">{githubError}</p>
        ) : null}
      </section>

      <StreakDetails
        activityByDate={streakView.activityByDate}
        colorScale={streakView.colorScale}
        currentStreak={streakView.currentStreak}
        dateRange={streakView.dateRange}
        longestStreak={streakView.longestStreak}
        showYearLabels={streakView.showYearLabels}
        summaryLabel={streakView.summaryLabel}
        title={streakView.title}
        tooltipSuffix={streakView.tooltipSuffix}
      />

      <GoalSection />
    </section>
  )
}
