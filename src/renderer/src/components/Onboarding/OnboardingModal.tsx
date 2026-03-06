import { useMemo, useState } from 'react'
import { BellRing, CheckCircle2, Github, FolderOpen } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
}

type OnboardingStep = 'github' | 'repo' | 'notifications'

interface StepItem {
  id: OnboardingStep
  title: string
  description: string
}

const steps: StepItem[] = [
  {
    id: 'github',
    title: 'Connect GitHub',
    description: 'Connect GitHub and choose Account mode or Repository mode in Settings.'
  },
  {
    id: 'repo',
    title: 'Set Local Repository Path',
    description: 'Select your local repository folder for commit prompts.'
  },
  {
    id: 'notifications',
    title: 'Enable Notifications',
    description: 'Allow notifications so session completion alerts can fire.'
  }
]

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
  const localRepoPath = useSettingsStore((state) => state.localRepoPath)

  const [stepIndex, setStepIndex] = useState(0)
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(getPermission())

  const isGitHubStepDone = isGitHubEnabled
  const isRepoPathStepDone = localRepoPath.trim().length > 0
  const isNotificationStepDone = notificationPermission === 'granted'

  const completionMap = useMemo(
    () => ({
      github: isGitHubStepDone,
      repo: isRepoPathStepDone,
      notifications: isNotificationStepDone
    }),
    [isGitHubStepDone, isRepoPathStepDone, isNotificationStepDone]
  )

  if (!isOpen) {
    return null
  }

  const step = steps[stepIndex]
  const isCurrentStepDone = completionMap[step.id]
  const isLastStep = stepIndex === steps.length - 1

  const handlePrimary = (): void => {
    if (step.id === 'notifications') {
      if (typeof Notification === 'undefined') {
        return
      }

      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission)
      })
      return
    }

    onOpenSettings()
  }

  const getPrimaryLabel = (): string => {
    if (step.id === 'notifications') {
      return 'Allow Notifications'
    }

    return 'Open Settings'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(250,245,240,0.8)] px-4 py-6 backdrop-blur-sm">
      <div className="terminal-modal w-full max-w-lg p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="terminal-section-title">Welcome to Claudoro</h2>
          <span className="terminal-kicker">{`Step ${stepIndex + 1}/${steps.length}`}</span>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {steps.map((item, index) => {
            const isActive = index === stepIndex
            const isDone = completionMap[item.id]

            return (
              <span
                className="h-2 rounded-full border"
                key={item.id}
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

        <div className="terminal-soft-card p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="terminal-section-title text-sm">
              {step.id === 'github' ? <Github size={14} /> : null}
              {step.id === 'repo' ? <FolderOpen size={14} /> : null}
              {step.id === 'notifications' ? <BellRing size={14} /> : null}
              {step.title}
            </p>
            {isCurrentStepDone ? (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--accent)] bg-[rgba(217,119,87,0.12)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-[var(--accent-strong)]">
                <CheckCircle2 size={11} />
                Done
              </span>
            ) : null}
          </div>

          <p className="text-sm text-[var(--terminal-muted)]">{step.description}</p>

          <div className="mt-3 flex items-center gap-2">
            <button
              className="terminal-btn terminal-btn-secondary"
              onClick={handlePrimary}
              type="button"
            >
              {getPrimaryLabel()}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button className="terminal-btn terminal-btn-secondary" onClick={onClose} type="button">
            Skip for Now
          </button>

          <div className="flex items-center gap-2">
            <button
              className="terminal-btn terminal-btn-secondary"
              disabled={stepIndex === 0}
              onClick={() => {
                setStepIndex((prev) => Math.max(0, prev - 1))
              }}
              type="button"
            >
              Back
            </button>

            {!isLastStep ? (
              <button
                className="terminal-btn terminal-btn-primary"
                onClick={() => {
                  setStepIndex((prev) => Math.min(steps.length - 1, prev + 1))
                }}
                type="button"
              >
                Next
              </button>
            ) : (
              <button className="terminal-btn terminal-btn-primary" onClick={onClose} type="button">
                Finish Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
