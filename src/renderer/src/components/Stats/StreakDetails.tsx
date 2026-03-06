interface StreakDetailsProps {
  activityByDate: Record<string, number>
  currentStreak: number
  longestStreak: number
  title: string
  summaryLabel: string
  tooltipSuffix?: string
  colorScale: number[]
  dateRange?: {
    start: string
    end: string
  }
  showYearLabels?: boolean
}

interface CellData {
  dateKey: string
  value: number
  isFuture: boolean
}

const WEEKS_TO_SHOW = 52
const DAYS_TO_SHOW = WEEKS_TO_SHOW * 7

const dateKey = (date: Date): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

const parseDateKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

const buildCells = (
  activityByDate: Record<string, number>,
  range?: { start: string; end: string }
): CellData[] => {
  const today = new Date()
  const todayKey = dateKey(today)

  if (range) {
    const cells: CellData[] = []
    const start = parseDateKey(range.start)
    const end = parseDateKey(range.end)
    const cursor = new Date(start)

    while (cursor <= end) {
      const key = dateKey(cursor)
      cells.push({
        dateKey: key,
        value: activityByDate[key] ?? 0,
        isFuture: key > todayKey
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return cells
  }

  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()))

  return Array.from({ length: DAYS_TO_SHOW }, (_, index) => {
    const target = new Date(endOfWeek)
    target.setDate(endOfWeek.getDate() - (DAYS_TO_SHOW - 1 - index))

    const key = dateKey(target)
    const value = activityByDate[key] ?? 0

    return {
      dateKey: key,
      value,
      isFuture: key > todayKey
    }
  })
}

const buildWeekColumns = (cells: CellData[]): CellData[][] => {
  const columns: CellData[][] = []

  for (let index = 0; index < cells.length; index += 7) {
    columns.push(cells.slice(index, index + 7))
  }

  return columns
}

const buildMonthLabels = (weekColumns: CellData[][]): string[] => {
  let lastMonth = -1

  return weekColumns.map((week) => {
    const date = new Date(`${week[0].dateKey}T00:00:00`)
    const month = date.getMonth()

    if (month !== lastMonth) {
      lastMonth = month
      return date.toLocaleString('en-US', { month: 'short' })
    }

    return ''
  })
}

const buildYearLabels = (weekColumns: CellData[][]): string[] => {
  let lastYear = -1

  return weekColumns.map((week) => {
    const date = new Date(`${week[0].dateKey}T00:00:00`)
    const year = date.getFullYear()

    if (year !== lastYear) {
      lastYear = year
      return String(year)
    }

    return ''
  })
}

const getHeatColor = (value: number, colorScale: number[]): string => {
  if (value <= 0) {
    return '#fff4ef'
  }

  const palette = ['#f8d7ca', '#f0b59f', '#e28d71', '#d97757', '#b85c3f']
  let level = 0

  for (let index = 0; index < colorScale.length; index += 1) {
    if (value >= colorScale[index]) {
      level = Math.min(index + 1, palette.length - 1)
    }
  }

  return palette[level]
}

export default function StreakDetails({
  activityByDate,
  currentStreak,
  longestStreak,
  title,
  summaryLabel,
  tooltipSuffix = '',
  colorScale,
  dateRange,
  showYearLabels = false
}: StreakDetailsProps): React.JSX.Element {
  const cells = buildCells(activityByDate, dateRange)
  const weekColumns = buildWeekColumns(cells)
  const monthLabels = buildMonthLabels(weekColumns)
  const yearLabels = buildYearLabels(weekColumns)
  const totalActivity = cells.reduce((sum, cell) => sum + cell.value, 0)
  const summaryRangeText = dateRange
    ? `${dateRange.start} to ${dateRange.end}`
    : `last ${WEEKS_TO_SHOW} weeks`

  return (
    <section className="terminal-card p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="terminal-section-title">{title}</h2>
        <div className="flex items-center gap-2 text-[11px] text-[var(--terminal-dim)]">
          <span>{currentStreak}d</span>
          <span>·</span>
          <span>Best {longestStreak}d</span>
        </div>
      </div>

      <div className="terminal-soft-card overflow-x-auto p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        {showYearLabels ? (
          <div className="mb-1 flex min-w-max gap-1 pl-5 text-[10px] font-semibold text-[var(--terminal-dim)]">
            {yearLabels.map((label, index) => (
              <div className="w-3" key={`year-${index}`}>
                {label}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mb-2 flex min-w-max gap-1 pl-5 text-[10px] text-[var(--terminal-dim)]">
          {monthLabels.map((label, index) => (
            <div className="w-3" key={`month-${index}`}>
              {label}
            </div>
          ))}
        </div>

        <div className="flex min-w-max gap-2">
          <div className="grid grid-rows-7 gap-1 text-[10px] text-[var(--terminal-dim)]">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, index) => (
              <span className="h-2.5 leading-[10px]" key={`day-${index}`}>
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {weekColumns.map((week, weekIndex) => (
              <div className="grid grid-rows-7 gap-1" key={`week-${weekIndex}`}>
                {week.map((cell) => (
                  <div
                    className="h-2.5 w-2.5 rounded-[2px] border border-[rgba(217,119,87,0.18)]"
                    key={cell.dateKey}
                    style={{
                      backgroundColor: cell.isFuture
                        ? 'rgba(217,119,87,0.04)'
                        : getHeatColor(cell.value, colorScale)
                    }}
                    title={`${cell.dateKey} · ${cell.value}${tooltipSuffix}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-[var(--terminal-dim)]">
          <p>
            {totalActivity} {summaryLabel} in {summaryRangeText}
          </p>
          <div className="flex items-center gap-1">
            <span>Less</span>
            {[0, ...colorScale].map((value) => (
              <div
                className="h-2.5 w-2.5 rounded-[2px] border border-[rgba(217,119,87,0.18)]"
                key={value}
                style={{ backgroundColor: getHeatColor(value, colorScale) }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </section>
  )
}
