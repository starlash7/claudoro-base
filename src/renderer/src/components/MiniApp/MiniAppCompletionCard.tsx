import { CheckCircle2, Share2, Sparkles, SquarePlus } from 'lucide-react'
import { useState } from 'react'

interface MiniAppCompletionCardProps {
  completedSessions: number
  focusMinutes: number
  goal: string
  isAdded: boolean
  onSave: () => Promise<{ ok: boolean; message?: string }>
  onShare: () => Promise<{ ok: boolean; message?: string }>
}

const getSessionLabel = (completedSessions: number): string => {
  return completedSessions === 1 ? '1 session' : `${completedSessions} sessions`
}

export default function MiniAppCompletionCard({
  completedSessions,
  focusMinutes,
  goal,
  isAdded,
  onSave,
  onShare
}: MiniAppCompletionCardProps): React.JSX.Element {
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleShare = async (): Promise<void> => {
    setIsSharing(true)
    const result = await onShare()
    setShareStatus(result.message ?? null)
    setIsSharing(false)
  }

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    const result = await onSave()
    setSaveStatus(result.message ?? null)
    setIsSaving(false)
  }

  return (
    <section className="terminal-card p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="terminal-kicker">Session Complete</p>
          <h2 className="mt-1 text-xl font-bold tracking-[0.01em] text-[var(--terminal-text)]">
            Keep the momentum public
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--terminal-muted)]">
            {`Today: ${getSessionLabel(completedSessions)} · ${focusMinutes} minutes`}
            {goal.trim() ? ` · Goal: ${goal.trim()}` : ''}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded border border-[var(--accent)] bg-[rgba(217,119,87,0.12)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-strong)]">
          <Sparkles size={12} />
          Ready to share
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="terminal-btn terminal-btn-primary"
          disabled={isSharing}
          onClick={() => {
            void handleShare()
          }}
          type="button"
        >
          <span className="flex items-center gap-2">
            <Share2 size={15} />
            {isSharing ? 'Opening…' : 'Share progress'}
          </span>
        </button>

        {!isAdded ? (
          <button
            className="terminal-btn terminal-btn-secondary"
            disabled={isSaving}
            onClick={() => {
              void handleSave()
            }}
            type="button"
          >
            <span className="flex items-center gap-2">
              <SquarePlus size={15} />
              {isSaving ? 'Saving…' : 'Save app'}
            </span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-[var(--terminal-border-soft)] bg-[rgba(255,255,255,0.76)] px-2 py-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--terminal-dim)]">
            <CheckCircle2 size={13} />
            Saved to Base App
          </span>
        )}
      </div>

      {shareStatus || saveStatus ? (
        <div className="mt-3 grid gap-2">
          {shareStatus ? (
            <p className="text-xs font-semibold tracking-[0.04em] text-[var(--terminal-dim)]">
              {shareStatus}
            </p>
          ) : null}
          {saveStatus ? (
            <p className="text-xs font-semibold tracking-[0.04em] text-[var(--terminal-dim)]">
              {saveStatus}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
