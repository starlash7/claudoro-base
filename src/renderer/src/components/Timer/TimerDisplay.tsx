import { POMODOROS_BEFORE_LONG_BREAK } from '../../../../shared/constants'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useTimerStore } from '../../store/timerStore'

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function TimerDisplay(): React.JSX.Element {
  const mode = useTimerStore((state) => state.mode)
  const completedPomodoros = useTimerStore((state) => state.completedPomodoros)
  const timeRemaining = useTimerStore((state) => state.timeRemaining)
  const { nextModeLabel } = usePomodoro()

  const cycleTotal = POMODOROS_BEFORE_LONG_BREAK
  const completedInCycle = mode === 'longBreak' ? cycleTotal : completedPomodoros % cycleTotal
  const completedInCycleClamped = Math.min(completedInCycle, cycleTotal)
  const activeIndex = mode === 'pomodoro' ? Math.min(completedInCycleClamped, cycleTotal - 1) : -1
  const isLongBreakNext = mode === 'pomodoro' && completedInCycleClamped === cycleTotal - 1
  const isDeepFocus = mode === 'deepFocus'
  const nextSummary = isLongBreakNext ? 'Long Break next' : `Next ${nextModeLabel}`

  return (
    <div className="terminal-hud-readout flex w-full max-w-[620px] flex-col items-center gap-3 text-center">
      <div className="terminal-time-box w-full px-3 py-4 sm:px-5 sm:py-6">
        <p className="terminal-time-text text-[clamp(3rem,12vw,6rem)] leading-[0.92]">
          {formatTime(timeRemaining)}
        </p>
      </div>

      {isDeepFocus ? (
        <p className="whitespace-nowrap text-[11px] font-semibold tracking-[0.05em] text-[var(--terminal-dim)]">
          Deep Focus runs until you stop it.
        </p>
      ) : (
        <section className="terminal-soft-card w-full px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="terminal-kicker">{`Focus ${completedInCycleClamped}/${cycleTotal}`}</p>
            <p className="whitespace-nowrap text-[11px] font-semibold tracking-[0.04em] text-[var(--terminal-dim)]">
              {nextSummary}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: cycleTotal }, (_, index) => {
              const isDone = index < completedInCycleClamped
              const isActive = index === activeIndex

              return (
                <span
                  className="h-2.5 rounded-full border transition-colors"
                  key={`cycle-segment-${index}`}
                  style={{
                    borderColor:
                      isDone || isActive ? 'rgba(217,119,87,0.56)' : 'rgba(217,119,87,0.2)',
                    backgroundColor: isDone
                      ? 'rgba(217,119,87,0.64)'
                      : isActive
                        ? 'rgba(217,119,87,0.34)'
                        : 'rgba(217,119,87,0.08)'
                  }}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
