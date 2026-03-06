import type {
  AppLogPayload,
  ExternalOpenPayload,
  GitCommitPayload,
  GitCommitResult,
  NotificationPayload,
  TrayAction,
  TrayStatePayload
} from '@/shared/constants'

const TOKEN_STORAGE_KEY = 'claudoro_github_token'

const detectPlatform = (): NodeJS.Platform => {
  if (typeof navigator === 'undefined') {
    return 'linux'
  }

  const agent = navigator.userAgent.toLowerCase()

  if (agent.includes('mac')) {
    return 'darwin'
  }

  if (agent.includes('win')) {
    return 'win32'
  }

  return 'linux'
}

const showWebNotification = async (payload: NotificationPayload): Promise<boolean> => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false
  }

  if (Notification.permission === 'granted') {
    new Notification(payload.title, { body: payload.body })
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      new Notification(payload.title, { body: payload.body })
      return true
    }
  }

  return false
}

const openExternal = async ({ url }: ExternalOpenPayload): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false
  }

  const raw = url.trim()

  if (!raw) {
    return false
  }

  try {
    const parsed = new URL(raw)
    const protocol = parsed.protocol

    if (!['http:', 'https:', 'spotify:'].includes(protocol)) {
      return false
    }

    const opened = window.open(parsed.toString(), '_blank', 'noopener,noreferrer')
    return Boolean(opened)
  } catch {
    return false
  }
}

const appendLog = async (payload: AppLogPayload): Promise<boolean> => {
  if (typeof console === 'undefined') {
    return false
  }

  const scope = `[${payload.source}] ${payload.event}`

  if (payload.level === 'error') {
    console.error(scope, payload.message, payload.context ?? {})
  } else if (payload.level === 'warn') {
    console.warn(scope, payload.message, payload.context ?? {})
  } else {
    console.info(scope, payload.message, payload.context ?? {})
  }

  return true
}

const getGitHubToken = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
}

const setGitHubToken = async (token: string): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false
  }

  const trimmed = token.trim()

  if (!trimmed) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    return true
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, trimmed)
  return true
}

const clearGitHubToken = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  return true
}

const updateTrayState = async (payload: TrayStatePayload): Promise<boolean> => {
  void payload
  return true
}

const onTrayAction = (listener: (action: TrayAction) => void): (() => void) => {
  void listener
  return () => {
    // noop in web miniapp runtime
  }
}

const commitChanges = async (payload: GitCommitPayload): Promise<GitCommitResult> => {
  void payload
  return {
    success: false,
    message: 'Local git commit is not available in Base Miniapp runtime.'
  }
}

const createElectronApiShim = (): Window['electronAPI'] => {
  return {
    platform: detectPlatform(),
    minimizeWindow: async () => false,
    closeWindow: async () => false,
    getGitHubToken,
    setGitHubToken,
    clearGitHubToken,
    showNotification: showWebNotification,
    selectDirectory: async () => null,
    commitChanges,
    openExternal,
    appendLog,
    updateTrayState,
    onTrayAction
  }
}

export const ensureElectronApiShim = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  if (window.electronAPI) {
    return
  }

  window.electronAPI = createElectronApiShim()
}
