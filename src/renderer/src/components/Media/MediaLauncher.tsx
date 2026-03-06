import { useState } from 'react'
import { ExternalLink, Music4, PlayCircle } from 'lucide-react'

const CUSTOM_URL_STORAGE_KEY = 'claudoro_custom_media_url'

function SpotifyLogo(): React.JSX.Element {
  return (
    <svg aria-hidden="true" className="h-6 w-6 shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" fill="#1DB954" r="11" />
      <path
        d="M6.5 9.3c3.6-1.1 7.9-.8 11.1.9"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M7.4 12c3-.8 6.2-.5 8.8.8"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M8.3 14.5c2.3-.6 4.8-.3 6.8.7"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </svg>
  )
}

const quickLinks = [
  {
    id: 'spotify-app',
    label: 'Open Spotify App',
    url: 'spotify:'
  },
  {
    id: 'spotify-playlist',
    label: 'Spotify Playlist',
    url: 'https://open.spotify.com/genre/focus'
  }
]

export default function MediaLauncher(): React.JSX.Element {
  const [customUrl, setCustomUrl] = useState(() => {
    return localStorage.getItem(CUSTOM_URL_STORAGE_KEY) ?? ''
  })
  const [status, setStatus] = useState('')

  const handleOpenLink = async (url: string, label: string): Promise<void> => {
    const success = await window.electronAPI.openExternal({ url })

    if (!success) {
      setStatus(`Failed to open: ${label}`)
      return
    }

    setStatus(`Opened: ${label}`)
  }

  return (
    <section className="terminal-card p-3">
      <div className="terminal-section-title mb-2">
        <Music4 size={16} />
        Music
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickLinks.map((item) => (
          <button
            className="terminal-btn terminal-btn-secondary px-3 py-2 text-left"
            key={item.id}
            onClick={() => {
              void handleOpenLink(item.url, item.label)
            }}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex min-w-0 items-center gap-2">
                {item.id.startsWith('spotify') ? <SpotifyLogo /> : null}
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </span>
              <ExternalLink className="ml-auto shrink-0" size={13} />
            </span>
          </button>
        ))}
      </div>

      <div className="terminal-soft-card mt-3 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        <p className="terminal-kicker">Custom URL</p>
        <div className="mt-2 flex gap-2">
          <input
            className="terminal-input w-full px-2.5 py-2 text-xs outline-none transition-colors placeholder:text-[var(--terminal-dim)]"
            onChange={(event) => {
              const value = event.target.value
              setCustomUrl(value)
              localStorage.setItem(CUSTOM_URL_STORAGE_KEY, value)
            }}
            placeholder="https://open.spotify.com/... or https://youtube.com/..."
            type="url"
            value={customUrl}
          />
          <button
            className="terminal-btn terminal-btn-primary px-3"
            disabled={!customUrl.trim()}
            onClick={() => {
              void handleOpenLink(customUrl, 'Custom URL')
            }}
            type="button"
          >
            <PlayCircle size={14} />
          </button>
        </div>
      </div>

      <div className="terminal-soft-card mt-3 min-h-[150px] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        <p className="terminal-kicker">Upcoming Updates</p>
        <div className="mt-2 space-y-1.5 text-xs text-[var(--terminal-muted)]">
          <p>More music integrations and playback controls will be added soon.</p>
        </div>
      </div>

      <div className="mt-2 min-h-4 text-[11px] text-[var(--terminal-muted)]">{status}</div>
    </section>
  )
}
