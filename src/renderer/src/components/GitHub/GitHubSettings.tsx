import { useEffect, useState } from 'react'
import { CheckCircle2, FolderOpen, X } from 'lucide-react'
import { type GitHubMode, useSettingsStore } from '../../store/settingsStore'

interface GitHubSettingsProps {
  isOpen: boolean
  onClose: () => void
}

type ConnectionState =
  | { status: 'idle'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }
  | { status: 'loading'; message: string }

interface RepoTarget {
  owner: string
  repo: string
}

const parseGitHubError = async (response: Response, fallback: string): Promise<string> => {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as { message?: string }
      if (payload.message?.trim()) {
        return payload.message.trim()
      }
    } catch {
      // noop
    }
  } else {
    const text = (await response.text()).trim()
    if (text) {
      return text
    }
  }

  return fallback
}

const parseRepoInput = (value: string): { owner: string; repo: string } | null => {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '')
  if (!normalized) {
    return null
  }

  const segments = normalized.split('/').filter(Boolean)

  if (segments.length === 1) {
    return {
      owner: '',
      repo: segments[0]
    }
  }

  if (segments.length === 2) {
    return {
      owner: segments[0],
      repo: segments[1]
    }
  }

  return null
}

export default function GitHubSettings({
  isOpen,
  onClose
}: GitHubSettingsProps): React.JSX.Element | null {
  const storedMode = useSettingsStore((state) => state.githubMode)
  const storedToken = useSettingsStore((state) => state.githubToken)
  const storedRepo = useSettingsStore((state) => state.githubRepo)
  const storedRepoPath = useSettingsStore((state) => state.localRepoPath)
  const storedRepoVerified = useSettingsStore((state) => state.githubRepoVerified)
  const updateGitHubSettings = useSettingsStore((state) => state.updateGitHubSettings)

  const [mode, setMode] = useState<GitHubMode>('repository')
  const [token, setToken] = useState('')
  const [repo, setRepo] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [isAuthVerified, setIsAuthVerified] = useState(false)
  const [isRepoAccessVerified, setIsRepoAccessVerified] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'idle',
    message: ''
  })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let cancelled = false

    setMode(storedMode)
    setToken(storedToken)
    setRepo(storedRepo)
    setRepoPath(storedRepoPath)
    setIsAuthVerified(storedRepoVerified)
    setIsRepoAccessVerified(storedRepoVerified)
    setConnectionState({
      status: 'idle',
      message: ''
    })

    const syncSecureToken = async (): Promise<void> => {
      const secureToken = (await window.electronAPI.getGitHubToken()).trim()

      if (cancelled || !secureToken) {
        return
      }

      setToken(secureToken)

      if (secureToken !== storedToken) {
        updateGitHubSettings({ githubToken: secureToken })
      }
    }

    void syncSecureToken()

    return () => {
      cancelled = true
    }
  }, [
    isOpen,
    storedMode,
    storedToken,
    storedRepo,
    storedRepoPath,
    storedRepoVerified,
    updateGitHubSettings
  ])

  if (!isOpen) {
    return null
  }

  const handlePickDirectory = async (): Promise<void> => {
    const selected = await window.electronAPI.selectDirectory()

    if (!selected) {
      return
    }

    setRepoPath(selected)
  }

  const resolveAccountLogin = async (trimmedToken: string): Promise<string> => {
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${trimmedToken}`
      }
    })

    if (!profileResponse.ok) {
      const message = await parseGitHubError(
        profileResponse,
        `Connection failed (${profileResponse.status}).`
      )
      throw new Error(message)
    }

    const profile = (await profileResponse.json()) as { login?: string }
    const owner = profile.login?.trim() ?? ''

    if (!owner) {
      throw new Error('Unable to detect GitHub username from token.')
    }

    return owner
  }

  const resolveRepoTarget = (repoInput: string, fallbackOwner: string): RepoTarget => {
    const parsed = parseRepoInput(repoInput)

    if (!parsed) {
      throw new Error('Repository must be either "repo" or "owner/repo".')
    }

    if (parsed.owner) {
      return {
        owner: parsed.owner,
        repo: parsed.repo
      }
    }

    return {
      owner: fallbackOwner,
      repo: parsed.repo
    }
  }

  const verifyRepoAccess = async (trimmedToken: string, target: RepoTarget): Promise<void> => {
    const repoResponse = await fetch(
      `https://api.github.com/repos/${target.owner}/${target.repo}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${trimmedToken}`
        }
      }
    )

    if (!repoResponse.ok) {
      const message = await parseGitHubError(
        repoResponse,
        `Repository check failed (${repoResponse.status}).`
      )
      throw new Error(message)
    }
  }

  const handleSave = async (): Promise<void> => {
    const trimmedToken = token.trim()
    const trimmedRepoInput = repo.trim()

    if (!trimmedToken) {
      setConnectionState({
        status: 'error',
        message: 'Please enter a token first.'
      })
      return
    }

    if (mode === 'repository' && !trimmedRepoInput) {
      setConnectionState({
        status: 'error',
        message: 'Please enter repository name.'
      })
      return
    }

    setConnectionState({
      status: 'loading',
      message:
        mode === 'repository'
          ? 'Saving and verifying repository...'
          : 'Saving account connection...'
    })

    try {
      const accountLogin = await resolveAccountLogin(trimmedToken)

      let canonicalRepo = trimmedRepoInput
      let isRepoVerified = false
      let statusMessage = `Connected as ${accountLogin}. Account activity mode enabled.`

      if (mode === 'repository') {
        const target = resolveRepoTarget(trimmedRepoInput, accountLogin)
        await verifyRepoAccess(trimmedToken, target)
        canonicalRepo = `${target.owner}/${target.repo}`
        isRepoVerified = true
        statusMessage = `Connected. Repo access OK: ${canonicalRepo}`
      }

      const hasSavedToken = await window.electronAPI.setGitHubToken(trimmedToken)

      if (!hasSavedToken) {
        throw new Error('Unable to save token in secure storage. Check system keychain access.')
      }

      const verifiedAt = Date.now()

      updateGitHubSettings({
        githubMode: mode,
        githubToken: trimmedToken,
        githubUsername: accountLogin,
        githubRepo: canonicalRepo,
        localRepoPath: repoPath,
        githubRepoVerified: isRepoVerified,
        githubRepoVerifiedAt: isRepoVerified ? verifiedAt : null
      })

      setConnectionState({
        status: 'success',
        message: statusMessage
      })
      setIsAuthVerified(true)
      setIsRepoAccessVerified(isRepoVerified)
      setRepo(canonicalRepo)
      onClose()
    } catch (error) {
      setConnectionState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to save GitHub settings.'
      })
      setIsAuthVerified(false)
      setIsRepoAccessVerified(false)
    }
  }

  const canSave = Boolean(token.trim() && (mode === 'account' || repo.trim()))

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(250,245,240,0.8)] px-4 py-6 backdrop-blur-sm">
      <div className="terminal-modal w-full max-w-md p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="terminal-section-title">GitHub Settings</h2>
          <button className="terminal-icon-btn p-1.5" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-[var(--terminal-muted)]">Activity Source</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`terminal-btn ${mode === 'account' ? 'terminal-btn-primary' : 'terminal-btn-secondary'}`}
                onClick={() => {
                  setMode('account')
                  setIsRepoAccessVerified(false)
                  setConnectionState({ status: 'idle', message: '' })
                }}
                type="button"
              >
                Account
              </button>
              <button
                className={`terminal-btn ${mode === 'repository' ? 'terminal-btn-primary' : 'terminal-btn-secondary'}`}
                onClick={() => {
                  setMode('repository')
                  setConnectionState({ status: 'idle', message: '' })
                }}
                type="button"
              >
                Repository
              </button>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--terminal-dim)]">
              Account mode shows profile-wide contribution graph. Repository mode adds repo-level
              commits/PRs/issues.
            </p>
          </div>

          <label className="block text-xs text-[var(--terminal-muted)]" htmlFor="github-token">
            Token
            <input
              className="terminal-input mt-1 w-full px-3 py-2 text-sm outline-none transition-colors"
              id="github-token"
              onChange={(event) => {
                setToken(event.target.value)
                setIsAuthVerified(false)
                setIsRepoAccessVerified(false)
              }}
              placeholder="ghp_xxx"
              type="password"
              value={token}
            />
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--terminal-dim)]">
              Recommended PAT scopes: <code>repo</code> and <code>read:user</code> for private
              repositories.
            </p>
          </label>

          {mode === 'repository' ? (
            <label className="block text-xs text-[var(--terminal-muted)]" htmlFor="github-repo">
              Repository
              <input
                className="terminal-input mt-1 w-full px-3 py-2 text-sm outline-none transition-colors"
                id="github-repo"
                onChange={(event) => {
                  setRepo(event.target.value)
                  setIsRepoAccessVerified(false)
                }}
                placeholder="Claudoro or starlash7/Claudoro"
                type="text"
                value={repo}
              />
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--terminal-dim)]">
                Enter <code>repo</code> or <code>owner/repo</code>. Repo is saved as{' '}
                <code>owner/repo</code>.
              </p>
            </label>
          ) : null}

          <label className="block text-xs text-[var(--terminal-muted)]" htmlFor="github-local-path">
            Local Repository Path
            <div className="mt-1 flex gap-2">
              <input
                className="terminal-input w-full px-3 py-2 text-sm outline-none transition-colors"
                id="github-local-path"
                onChange={(event) => {
                  setRepoPath(event.target.value)
                }}
                placeholder="/Users/.../repo"
                type="text"
                value={repoPath}
              />
              <button
                className="terminal-icon-btn px-3"
                onClick={() => {
                  void handlePickDirectory()
                }}
                title="Select folder"
                type="button"
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </label>
        </div>

        <div className="mt-3 min-h-5 text-xs">
          {connectionState.message ? (
            <p
              className={
                connectionState.status === 'success'
                  ? 'text-[var(--accent-strong)]'
                  : connectionState.status === 'error'
                    ? 'text-[var(--accent-strong)]'
                    : 'text-[var(--terminal-muted)]'
              }
            >
              {connectionState.message}
            </p>
          ) : null}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex h-6 items-center gap-1.5">
            {isAuthVerified ? (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--terminal-border)] bg-[rgba(217,119,87,0.08)] px-2 py-1 text-[11px] font-semibold tracking-[0.05em] text-[var(--terminal-text)]">
                <CheckCircle2 size={12} />
                Auth OK
              </span>
            ) : null}
            {isRepoAccessVerified ? (
              <span className="inline-flex items-center gap-1 rounded border border-[var(--accent)] bg-[rgba(217,119,87,0.12)] px-2 py-1 text-[11px] font-semibold tracking-[0.05em] text-[var(--accent-strong)]">
                <CheckCircle2 size={12} />
                Repo Mode Verified
              </span>
            ) : null}
          </div>

          <button
            className="terminal-btn terminal-btn-primary"
            disabled={!canSave || connectionState.status === 'loading'}
            onClick={() => {
              void handleSave()
            }}
            type="button"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  )
}
