import { BellRing, CircleCheckBig, Github, Play } from 'lucide-react'
import { useState } from 'react'
import { useStats } from '../../hooks/useStats'
import { useSettingsStore } from '../../store/settingsStore'
import { useTimerStore } from '../../store/timerStore'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
}

const getPermission = (): NotificationPermission => {
  if (typeof Notification === 'undefined') {
    return 'denied'
  }

  return Notification.permission
}

export default function OnboardingModal({
  isOpen,
  onClose,
  onOpenSettings
}: OnboardingModalProps): React.JSX.Element | null {
  const isGitHubEnabled = useSettingsStore((state) => state.isGitHubEnabled)
  const timerStatus = useTimerStore((state) => state.status)
  const { todayCompletedSessions } = useStats()

  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(getPermission())

  if (!isOpen) {
    return null
  }

  const hasStartedSession = timerStatus !== 'idle' || todayCompletedSessions > 0
  const canRequestNotifications =
    typeof Notification !== 'undefined' && notificationPermission !== 'granted'

  const requestNotifications = (): void => {
    if (typeof Notification === 'undefined') {
      return
    }

    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission)
    })
  }

  return (
    <section className="terminal-card p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="terminal-kicker">Quick Start</p>
          <h2 className="mt-1 text-xl font-bold tracking-[0.01em] text-[var(--terminal-text)]">
            Start a focus session first
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--terminal-muted)]">
            GitHub and notifications are optional. The first useful action is just typing a goal
            and pressing Start.
          </p>
        </div>

        <button className="terminal-btn terminal-btn-secondary px-3 py-1.5" onClick={onClose} type="button">
          Hide
        </button>
      </div>

      <div className="mt-3 grid gap-2.5">
        <article className="terminal-soft-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="terminal-section-title text-sm">
                <Play size={14} />
                Use the timer now
              </p>
              <p className="mt-1 text-sm text-[var(--terminal-muted)]">
                Add a goal, keep the default 25-minute focus mode, and start immediately.
              </p>
            </div>
            {hasStartedSession ? (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--accent)] bg-[rgba(217,119,87,0.12)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-[var(--accent-strong)]">
                <CircleCheckBig size={11} />
                Ready
              </span>
            ) : null}
          </div>
        </article>

        <article className="terminal-soft-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="terminal-section-title text-sm">
                <Github size={14} />
                Connect GitHub later
              </p>
              <p className="mt-1 text-sm text-[var(--terminal-muted)]">
                GitHub is optional in the miniapp. Open Settings only if you want contribution
                context.
              </p>
            </div>
            {isGitHubEnabled ? (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--accent)] bg-[rgba(217,119,87,0.12)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-[var(--accent-strong)]">
                <CircleCheckBig size={11} />
                Connected
              </span>
            ) : null}
          </div>
        </article>

        <article className="terminal-soft-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="terminal-section-title text-sm">
                <BellRing size={14} />
                Turn on notifications when you want
              </p>
              <p className="mt-1 text-sm text-[var(--terminal-muted)]">
                Alerts help when a session ends, but they should not block first use.
              </p>
            </div>
            {notificationPermission === 'granted' ? (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--accent)] bg-[rgba(217,119,87,0.12)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-[var(--accent-strong)]">
                <CircleCheckBig size={11} />
                Enabled
              </span>
            ) : null}
          </div>
        </article>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="terminal-btn terminal-btn-primary" onClick={onClose} type="button">
          Start with timer
        </button>

        <button
          className="terminal-btn terminal-btn-secondary"
          onClick={() => {
            onOpenSettings()
          }}
          type="button"
        >
          Open Settings
        </button>

        {canRequestNotifications ? (
          <button
            className="terminal-btn terminal-btn-secondary"
            onClick={requestNotifications}
            type="button"
          >
            Allow Notifications
          </button>
        ) : null}
      </div>
    </section>
  )
}
