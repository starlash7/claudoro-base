import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useAnimationFrame, useMotionValue, type Variants } from 'framer-motion'
import { useStats } from '../../hooks/useStats'
import { useTimerStore } from '../../store/timerStore'

type VisualState = 'running' | 'sleeping' | 'celebrate'
type FocusStyle = 'stride' | 'dash' | 'scan'

const MASCOT_SIZE = 74
const EDGE_PADDING = 16
const TARGET_DISTANCE_MIN = 100
const MAX_FRAME_DELTA_MS = 48

const IDLE_SPEED = 98
const RUNNING_SPEED = 146
const CELEBRATE_SPEED = 186

const SLEEP_DOCK_INSET_X = 0
const SLEEP_DOCK_INSET_Y = 0

const AXIS_THRESHOLD = 2
const WALK_BOB = 1.8
const DASH_BOB = 2.7
const SCAN_BOB = 1.1
const CELEBRATE_BOB = 4.4

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface WalkerState {
  x: number
  y: number
  targetX: number
  targetY: number
  facing: 1 | -1
  stepPhase: number
  swayPhase: number
  stepTempo: number
  swayScale: number
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const randomBetween = (min: number, max: number): number => {
  return min + Math.random() * (max - min)
}

const distance = (aX: number, aY: number, bX: number, bY: number): number => {
  return Math.hypot(aX - bX, aY - bY)
}

const computeBounds = (element: HTMLElement): Bounds => {
  const halfW = Math.max(0, (element.clientWidth - MASCOT_SIZE) / 2 - EDGE_PADDING)
  const halfH = Math.max(0, (element.clientHeight - MASCOT_SIZE) / 2 - EDGE_PADDING)

  return {
    minX: -halfW,
    maxX: halfW,
    minY: -halfH,
    maxY: halfH
  }
}

const hasUsableBounds = (bounds: Bounds): boolean => {
  return bounds.maxX - bounds.minX > 12 && bounds.maxY - bounds.minY > 12
}

const pickTarget = (bounds: Bounds, walker: WalkerState): { x: number; y: number } => {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const x = randomBetween(bounds.minX, bounds.maxX)
    const y = randomBetween(bounds.minY, bounds.maxY)

    if (distance(walker.x, walker.y, x, y) >= TARGET_DISTANCE_MIN) {
      return { x, y }
    }
  }

  return {
    x: randomBetween(bounds.minX, bounds.maxX),
    y: randomBetween(bounds.minY, bounds.maxY)
  }
}

const pickFocusStyle = (): FocusStyle => {
  const roll = Math.random()
  if (roll < 0.34) {
    return 'dash'
  }

  if (roll < 0.67) {
    return 'scan'
  }

  return 'stride'
}

const mascotVariants: Variants = {
  running: {
    rotate: [0, -1.6, 1.4, -0.9, 0],
    transition: { duration: 0.82, repeat: Infinity, ease: 'easeInOut' }
  },
  sleeping: {
    y: [0, -1.2, 0],
    scale: [1, 1.025, 1],
    transition: { duration: 2.1, repeat: Infinity, ease: 'easeInOut' }
  },
  celebrate: {
    rotate: [0, -8, 8, -5, 0],
    scale: [1, 1.12, 1.04, 1],
    transition: { duration: 0.72, repeat: Infinity, ease: 'easeOut' }
  }
}

export default function Mascot(): React.JSX.Element {
  const mode = useTimerStore((state) => state.mode)
  const status = useTimerStore((state) => state.status)
  const currentStreak = useStats().currentStreak

  const arenaRef = useRef<HTMLDivElement | null>(null)
  const boundsRef = useRef<Bounds>({ minX: 0, maxX: 0, minY: 0, maxY: 0 })
  const walkerRef = useRef<WalkerState>({
    x: -12,
    y: 0,
    targetX: 0,
    targetY: 0,
    facing: 1,
    stepPhase: 0,
    swayPhase: 0,
    stepTempo: 1,
    swayScale: 0.3
  })

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const tilt = useMotionValue(0)
  const facing = useMotionValue(1)

  const [focusStyle, setFocusStyle] = useState<FocusStyle>('stride')
  const [isCelebrating, setIsCelebrating] = useState(false)
  const previousStreakRef = useRef<number | null>(null)
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncBounds = useCallback(() => {
    const element = arenaRef.current
    if (!element) {
      return
    }

    const bounds = computeBounds(element)
    boundsRef.current = bounds

    const walker = walkerRef.current
    walker.x = clamp(walker.x, bounds.minX, bounds.maxX)
    walker.y = clamp(walker.y, bounds.minY, bounds.maxY)

    const targetOutOfBounds =
      walker.targetX < bounds.minX ||
      walker.targetX > bounds.maxX ||
      walker.targetY < bounds.minY ||
      walker.targetY > bounds.maxY

    if ((walker.targetX === 0 && walker.targetY === 0) || targetOutOfBounds) {
      const target = pickTarget(bounds, walker)
      walker.targetX = target.x
      walker.targetY = target.y
      walker.stepTempo = randomBetween(0.88, 1.18)
      walker.swayScale = randomBetween(0.2, 0.45)
    }

    x.set(walker.x)
    y.set(walker.y)
  }, [x, y])

  useEffect(() => {
    if (previousStreakRef.current === null) {
      previousStreakRef.current = currentStreak
      return
    }

    if (currentStreak > previousStreakRef.current) {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }

      setTimeout(() => {
        setIsCelebrating(true)
      }, 0)

      celebrationTimeoutRef.current = setTimeout(() => {
        setIsCelebrating(false)
      }, 2500)
    }

    previousStreakRef.current = currentStreak
  }, [currentStreak])

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    syncBounds()

    const arenaElement = arenaRef.current
    if (!arenaElement) {
      return
    }

    let observer: ResizeObserver | null = null

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        syncBounds()
      })
      observer.observe(arenaElement)
    }

    window.addEventListener('resize', syncBounds)

    return () => {
      if (observer) {
        observer.disconnect()
      }
      window.removeEventListener('resize', syncBounds)
    }
  }, [syncBounds])

  const isBreakMode = mode === 'shortBreak'
  const visualState: VisualState = isCelebrating
    ? 'celebrate'
    : isBreakMode
      ? 'sleeping'
      : 'running'

  useEffect(() => {
    if (visualState !== 'running') {
      return
    }

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const queueNextStyleChange = (): void => {
      timeoutId = setTimeout(
        () => {
          if (cancelled) {
            return
          }

          setFocusStyle(pickFocusStyle())
          queueNextStyleChange()
        },
        randomBetween(2100, 4700)
      )
    }

    queueNextStyleChange()

    return () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [visualState])

  const speed =
    visualState === 'celebrate'
      ? CELEBRATE_SPEED
      : status === 'running'
        ? RUNNING_SPEED
        : IDLE_SPEED

  useAnimationFrame((_timestamp, delta) => {
    const frameDelta = Math.min(delta, MAX_FRAME_DELTA_MS)
    if (frameDelta <= 0) {
      return
    }

    const walker = walkerRef.current
    let bounds = boundsRef.current

    if (!hasUsableBounds(bounds) && arenaRef.current) {
      bounds = computeBounds(arenaRef.current)
      boundsRef.current = bounds
    }

    if (!hasUsableBounds(bounds)) {
      return
    }

    if (visualState === 'sleeping') {
      const sleepX = bounds.minX + SLEEP_DOCK_INSET_X
      const sleepY = bounds.maxY - SLEEP_DOCK_INSET_Y
      const dockingT = Math.min(1, frameDelta / 180)

      walker.x += (sleepX - walker.x) * dockingT
      walker.y += (sleepY - walker.y) * dockingT
      walker.facing = 1
      walker.stepPhase += (frameDelta / 1000) * 3

      const breath = Math.sin(walker.stepPhase) * 0.6
      x.set(walker.x)
      y.set(walker.y + breath)
      facing.set(1)
      tilt.set(Math.sin(walker.stepPhase) * 0.45)
      return
    }

    const dx = walker.targetX - walker.x
    const dy = walker.targetY - walker.y
    const dist = Math.hypot(dx, dy)

    if (dist <= AXIS_THRESHOLD) {
      const target = pickTarget(bounds, walker)
      walker.targetX = target.x
      walker.targetY = target.y
      walker.stepTempo = randomBetween(0.86, 1.25)
      walker.swayScale = randomBetween(0.18, 0.52)
    } else {
      const walkStyleSpeed = focusStyle === 'dash' ? 1.2 : focusStyle === 'scan' ? 0.88 : 1
      const step = (speed * walkStyleSpeed * frameDelta) / 1000
      const dirX = dx / Math.max(dist, 1)
      const dirY = dy / Math.max(dist, 1)

      walker.swayPhase += (frameDelta / 1000) * (focusStyle === 'dash' ? 11.8 : 8.2)
      const styleSway = focusStyle === 'scan' ? 0.8 : 1
      const sway = Math.sin(walker.swayPhase) * walker.swayScale * styleSway
      const perpX = -dirY
      const perpY = dirX

      walker.x += dirX * Math.min(step, dist) + perpX * sway
      walker.y += dirY * Math.min(step, dist) + perpY * sway

      walker.x = clamp(walker.x, bounds.minX, bounds.maxX)
      walker.y = clamp(walker.y, bounds.minY, bounds.maxY)
      walker.facing = dirX >= 0 ? 1 : -1
    }

    const stepRate =
      visualState === 'celebrate' ? 16 : focusStyle === 'dash' ? 14 : focusStyle === 'scan' ? 7 : 10
    walker.stepPhase += (frameDelta / 1000) * stepRate * walker.stepTempo

    const bob =
      visualState === 'celebrate'
        ? Math.max(0, Math.sin(walker.stepPhase)) * CELEBRATE_BOB
        : focusStyle === 'dash'
          ? Math.sin(walker.stepPhase) * DASH_BOB
          : focusStyle === 'scan'
            ? Math.sin(walker.stepPhase) * SCAN_BOB
            : Math.sin(walker.stepPhase) * WALK_BOB

    x.set(walker.x)
    y.set(walker.y - bob)
    facing.set(walker.facing)
    tilt.set(
      Math.sin(walker.stepPhase) *
        (visualState === 'celebrate'
          ? 2.4
          : focusStyle === 'dash'
            ? 1.9
            : focusStyle === 'scan'
              ? 0.6
              : 1.3)
    )
  })

  const showPartyHat = visualState === 'celebrate'
  const showSleepMarks = visualState === 'sleeping'

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" ref={arenaRef}>
      <motion.div
        className="absolute left-1/2 top-1/2 will-change-transform"
        style={{
          marginLeft: `-${MASCOT_SIZE / 2}px`,
          marginTop: `-${MASCOT_SIZE / 2}px`,
          x,
          y,
          rotate: tilt,
          scaleX: facing
        }}
      >
        {showSleepMarks ? (
          <div className="absolute -bottom-1 left-1/2 h-[8px] w-[58px] -translate-x-1/2 rounded-sm border border-[rgba(217,119,87,0.28)] bg-[rgba(255,243,236,0.92)]" />
        ) : null}

        <motion.div
          animate={{
            scaleX: visualState === 'sleeping' ? 1 : [0.9, 1.08, 0.9],
            opacity: visualState === 'sleeping' ? 0.14 : [0.16, 0.3, 0.16]
          }}
          className="pointer-events-none absolute left-1/2 top-[66px] h-[5px] w-[42px] -translate-x-1/2 rounded-full bg-[rgba(51,37,29,0.26)] blur-[1px]"
          transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.svg
          animate={visualState}
          className="block"
          shapeRendering="crispEdges"
          style={{
            width: MASCOT_SIZE,
            height: MASCOT_SIZE,
            filter:
              'drop-shadow(0 1px 0 rgba(47,37,29,0.14)) drop-shadow(0 0 4px rgba(217,119,87,0.22))'
          }}
          variants={mascotVariants}
          viewBox="0 0 64 64"
        >
          <rect fill="#d57958" height="14" width="46" x="9" y="8" />
          <rect fill="#d57958" height="5" width="54" x="5" y="22" />
          <rect fill="#d57958" height="3" width="1" x="4" y="23" />
          <rect fill="#d57958" height="3" width="1" x="59" y="23" />
          <rect fill="#d57958" height="11" width="46" x="9" y="27" />
          <rect fill="#d57958" height="7" width="4" x="14" y="38" />
          <rect fill="#d57958" height="7" width="4" x="24" y="38" />
          <rect fill="#d57958" height="7" width="4" x="36" y="38" />
          <rect fill="#d57958" height="7" width="4" x="46" y="38" />

          {showSleepMarks ? (
            <>
              <rect fill="#101010" height="2" width="8" x="15" y="18" />
              <rect fill="#101010" height="2" width="8" x="41" y="18" />
            </>
          ) : showPartyHat ? (
            <>
              <path d="M17 18l2 2 2 2-2 2-2 2-2-2-2-2 2-2z" fill="#101010" />
              <path d="M43 18l2 2 2 2-2 2-2 2-2-2-2-2 2-2z" fill="#101010" />
              <path d="M27 8l5-7 5 7z" fill="#ffd36b" />
              <rect fill="#ffd36b" height="1" width="10" x="27" y="8" />
              <circle cx="32" cy="1" fill="#ffffff" r="1.2" />
            </>
          ) : focusStyle === 'dash' ? (
            <>
              <rect fill="#101010" height="2" width="8" x="14" y="18" />
              <rect fill="#101010" height="2" width="8" x="42" y="18" />
            </>
          ) : focusStyle === 'scan' ? (
            <>
              <rect fill="#101010" height="6" width="4" x="16" y="15" />
              <rect fill="#101010" height="6" width="4" x="44" y="15" />
              <rect fill="#f6b89f" height="2" width="2" x="30" y="11" />
            </>
          ) : (
            <>
              <path d="M13 21l3-5h8l-3 5z" fill="#101010" />
              <path d="M39 21l3-5h8l-3 5z" fill="#101010" />
            </>
          )}

          {showSleepMarks ? (
            <>
              <motion.text
                animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, -6] }}
                fill="#b9593b"
                fontSize="5"
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                x="46"
                y="12"
              >
                z
              </motion.text>
              <motion.text
                animate={{ opacity: [0.2, 0.95, 0.2], y: [0, -4, -8] }}
                fill="#b9593b"
                fontSize="6"
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                x="50"
                y="10"
              >
                z
              </motion.text>
              <motion.text
                animate={{ opacity: [0.1, 0.75, 0.1], y: [0, -5, -10] }}
                fill="#b9593b"
                fontSize="7"
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }}
                x="55"
                y="7"
              >
                z
              </motion.text>
            </>
          ) : null}

          {showPartyHat ? (
            <>
              <path d="M6 14l2 3 3 2-3 2-2 3-2-3-3-2 3-2z" fill="#b9593b" />
              <path d="M58 38l2 3 3 2-3 2-2 3-2-3-3-2 3-2z" fill="#b9593b" />
            </>
          ) : null}
        </motion.svg>
      </motion.div>
    </div>
  )
}
