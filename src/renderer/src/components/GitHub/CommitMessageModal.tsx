import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { useTimerStore } from '../../store/timerStore'

export default function CommitMessageModal(): React.JSX.Element | null {
  const isOpen = useTimerStore((state) => state.isCommitPromptOpen)
  const closeCommitPrompt = useTimerStore((state) => state.closeCommitPrompt)
  const localRepoPath = useSettingsStore((state) => state.localRepoPath)

  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) {
    return null
  }

  const handleClose = (): void => {
    setMessage('')
    setStatus('')
    closeCommitPrompt()
  }

  const handleCommit = async (): Promise<void> => {
    if (!localRepoPath.trim()) {
      setStatus('Local repository path is missing. Set it in GitHub Settings first.')
      return
    }

    if (!message.trim()) {
      setStatus('Please enter a commit message.')
      return
    }

    setSubmitting(true)
    setStatus('Running commit...')

    try {
      const result = await window.electronAPI.commitChanges({
        repoPath: localRepoPath,
        message
      })

      if (!result.success) {
        setStatus(result.message)
        return
      }

      setStatus('Commit completed.')
      handleClose()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Commit failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(250,245,240,0.8)] px-4 backdrop-blur-sm">
      <div className="terminal-modal w-full max-w-md p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="terminal-section-title">Session Commit</h2>
          <button className="terminal-icon-btn p-1.5" onClick={handleClose} type="button">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-[var(--terminal-muted)]">
          Focus session finished. Leave a commit message now.
        </p>
        <p className="mt-1 truncate text-[11px] text-[var(--terminal-dim)]">
          repo: {localRepoPath || '(not configured)'}
        </p>

        <textarea
          className="terminal-input mt-3 h-24 w-full resize-none px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--terminal-dim)]"
          onChange={(event) => {
            setMessage(event.target.value)
          }}
          placeholder="e.g. feat(timer): replace mascot with original claude svg"
          value={message}
        />

        <div className="mt-2 min-h-5 text-xs text-[var(--terminal-muted)]">{status}</div>

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            className="terminal-btn terminal-btn-secondary"
            onClick={handleClose}
            type="button"
          >
            Later
          </button>
          <button
            className="terminal-btn terminal-btn-primary"
            disabled={submitting}
            onClick={() => {
              void handleCommit()
            }}
            type="button"
          >
            <span className="flex items-center gap-1.5">
              <Send size={14} /> Commit
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
