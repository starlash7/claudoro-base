import { useEffect } from 'react'

const appendLog = (
  level: 'info' | 'warn' | 'error',
  event: string,
  message: string,
  context?: Record<string, unknown>
): void => {
  window.electronAPI
    .appendLog({
      level,
      source: 'renderer',
      event,
      message,
      context
    })
    .catch(() => {
      // noop - app should continue even when logging fails
    })
}

export const useAppLogging = (): void => {
  useEffect(() => {
    appendLog('info', 'renderer-mounted', 'Renderer initialized.')

    const onError = (event: ErrorEvent): void => {
      appendLog('error', 'window-error', event.message || 'Unhandled window error.', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason
      appendLog(
        'error',
        'unhandled-rejection',
        reason instanceof Error ? reason.message : String(reason),
        {
          reason: reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)
        }
      )
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])
}
