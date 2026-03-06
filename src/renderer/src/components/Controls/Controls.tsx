import { Check, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useStats } from '../../hooks/useStats'
import { useTimerStore } from '../../store/timerStore'

export default function Controls(): React.JSX.Element {
  const mode = useTimerStore((state) => state.mode)
  const status = useTimerStore((state) => state.status)
  const timeRemaining = useTimerStore((state) => state.timeRemaining)
  const start = useTimerStore((state) => state.start)
  const pause = useTimerStore((state) => state.pause)
  const reset = useTimerStore((state) => state.reset)
  const completeSession = useTimerStore((state) => state.completeSession)
  const { skipToNext } = usePomodoro()
  const { recordFocusSession } = useStats()

  const isRunning = status === 'running'
  const isDeepFocus = mode === 'deepFocus'

  const handleCompleteDeepFocus = (): void => {
    if (timeRemaining > 0) {
      recordFocusSession(timeRemaining, { countCompleted: true })
    }

    completeSession()
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <button
        aria-label={isRunning ? 'Pause' : 'Start'}
        className="terminal-btn terminal-btn-primary px-4 sm:px-5"
        onClick={() => {
          if (isRunning) {
            pause()
            return
          }

          start()
        }}
        type="button"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] sm:text-sm">
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {isRunning ? 'Pause' : 'Start'}
        </span>
      </button>

      <button
        aria-label="Reset"
        className="terminal-icon-btn p-2.5"
        onClick={() => {
          reset()
        }}
        type="button"
      >
        <RotateCcw size={17} />
      </button>

      {isDeepFocus ? (
        <button
          aria-label="Complete session"
          className="terminal-icon-btn border-[var(--accent)] bg-[rgba(217,119,87,0.14)] p-2.5 text-[var(--accent-strong)]"
          onClick={handleCompleteDeepFocus}
          type="button"
        >
          <Check size={17} />
        </button>
      ) : (
        <button
          aria-label="Skip"
          className="terminal-icon-btn p-2.5"
          onClick={() => {
            skipToNext()
          }}
          type="button"
        >
          <SkipForward size={17} />
        </button>
      )}
    </div>
  )
}
