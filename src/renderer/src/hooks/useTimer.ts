import { useEffect, useRef } from 'react'
import { TIMER_DURATIONS, type TimerMode } from '../../../shared/constants'
import { useTimerStore } from '../store/timerStore'
import { useStats } from './useStats'

const getNotificationMessage = (mode: TimerMode): { title: string; body: string } => {
  if (mode === 'pomodoro') {
    return {
      title: 'Pomodoro Complete',
      body: 'Take a short break, then start the next focus session.'
    }
  }

  if (mode === 'shortBreak' || mode === 'longBreak') {
    return {
      title: 'Break Complete',
      body: 'Time to return to focus mode.'
    }
  }

  return {
    title: 'Deep Focus Ended',
    body: 'The session was ended manually.'
  }
}

export const useTimer = (): void => {
  const status = useTimerStore((state) => state.status)
  const mode = useTimerStore((state) => state.mode)
  const timeRemaining = useTimerStore((state) => state.timeRemaining)
  const tick = useTimerStore((state) => state.tick)
  const recoverElapsed = useTimerStore((state) => state.recoverElapsed)
  const completeSession = useTimerStore((state) => state.completeSession)
  const recordPomodoroSession = useStats().recordPomodoroSession
  const completionGuard = useRef(false)

  useEffect(() => {
    recoverElapsed()

    const syncElapsed = (): void => {
      recoverElapsed()
    }

    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        syncElapsed()
      }
    }

    window.addEventListener('focus', syncElapsed)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('focus', syncElapsed)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [recoverElapsed])

  useEffect(() => {
    if (status !== 'running') {
      return
    }

    const interval = window.setInterval(() => {
      tick()
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [status, tick])

  useEffect(() => {
    if (status !== 'running') {
      completionGuard.current = false
      return
    }

    if (mode === 'deepFocus') {
      completionGuard.current = false
      return
    }

    if (timeRemaining > 0) {
      completionGuard.current = false
      return
    }

    if (completionGuard.current) {
      return
    }

    completionGuard.current = true

    if (mode === 'pomodoro') {
      recordPomodoroSession(TIMER_DURATIONS.pomodoro)
    }

    window.electronAPI.showNotification(getNotificationMessage(mode)).catch(() => {
      // noop - renderer still works without notification support
    })

    completeSession()
  }, [status, mode, timeRemaining, recordPomodoroSession, completeSession])
}
