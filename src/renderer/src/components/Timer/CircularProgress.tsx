import type { TimerMode } from '../../../../shared/constants'

interface CircularProgressProps {
  mode: TimerMode
  timeRemaining: number
  totalTime: number
  children: React.ReactNode
}

const RADIUS = 124
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const modeColor: Record<TimerMode, string> = {
  pomodoro: '#d97757',
  shortBreak: '#b49a8a',
  longBreak: '#c86a49',
  deepFocus: '#9f4d34'
}

export default function CircularProgress({
  mode,
  timeRemaining,
  totalTime,
  children
}: CircularProgressProps): React.JSX.Element {
  const progress =
    mode === 'deepFocus' || totalTime === 0
      ? 1
      : Math.max(0, Math.min(1, (totalTime - timeRemaining) / totalTime))

  const strokeOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="relative h-[272px] w-[272px] sm:h-[324px] sm:w-[324px]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 320 320">
        <circle
          cx="160"
          cy="160"
          fill="none"
          r={RADIUS + 12}
          stroke="rgba(217, 119, 87, 0.18)"
          strokeDasharray="2 7"
          strokeWidth="2"
        />
        <circle
          cx="160"
          cy="160"
          fill="none"
          r={RADIUS}
          stroke="rgba(217, 119, 87, 0.18)"
          strokeWidth="13"
        />
        <circle
          cx="160"
          cy="160"
          fill="none"
          r={RADIUS}
          stroke={modeColor[mode]}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
          strokeWidth="13"
          style={{
            filter: 'drop-shadow(0 0 7px rgba(217, 119, 87, 0.28))',
            transition: 'stroke-dashoffset 0.8s ease-out'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center p-9 sm:p-12">
        {children}
      </div>
    </div>
  )
}
