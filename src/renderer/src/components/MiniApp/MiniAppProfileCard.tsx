import { BadgeCheck, CircleUserRound, ExternalLink } from 'lucide-react'

interface MiniAppProfileCardProps {
  isAdded: boolean
  locationLabel: string | null
  onOpenProfile: () => void
  userAvatarUrl: string | null
  userHandle: string | null
  userLabel: string
}

const getInitial = (label: string): string => label.trim().charAt(0).toUpperCase() || 'C'

export default function MiniAppProfileCard({
  isAdded,
  locationLabel,
  onOpenProfile,
  userAvatarUrl,
  userHandle,
  userLabel
}: MiniAppProfileCardProps): React.JSX.Element {
  return (
    <section className="terminal-card p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {userAvatarUrl ? (
            <div
              aria-label={`${userLabel} avatar`}
              className="h-11 w-11 rounded-full border border-[var(--terminal-border-soft)] bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url("${userAvatarUrl}")` }}
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--terminal-border-soft)] bg-[rgba(217,119,87,0.12)] text-sm font-bold text-[var(--accent-strong)]">
              {getInitial(userLabel)}
            </div>
          )}

          <div className="min-w-0">
            <p className="terminal-kicker">Base App</p>
            <h2 className="truncate text-base font-bold tracking-[0.01em] text-[var(--terminal-text)] sm:text-lg">
              {`Welcome back, ${userLabel}`}
            </h2>
            <p className="mt-1 text-sm text-[var(--terminal-muted)]">
              {locationLabel || 'Your next useful action is another focus sprint.'}
            </p>
            {userHandle ? (
              <p className="mt-1 text-xs font-semibold tracking-[0.05em] text-[var(--terminal-dim)]">
                {userHandle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded border border-[var(--terminal-border-soft)] bg-[rgba(255,255,255,0.7)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--terminal-dim)]">
            {isAdded ? <BadgeCheck size={12} /> : <CircleUserRound size={12} />}
            {isAdded ? 'Saved' : 'Live'}
          </span>

          {userHandle ? (
            <button
              className="terminal-btn terminal-btn-secondary px-3 py-1.5 text-xs"
              onClick={onOpenProfile}
              type="button"
            >
              <span className="flex items-center gap-1.5">
                <ExternalLink size={13} />
                Profile
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
