# Claudoro Reference Audit

Date: 2026-03-06
Reference repo: https://github.com/starlash7/Claudoro
Reference commit: `c6a6d24`

## What It Is

- Electron desktop app (`electron-vite`) with React + TypeScript.
- Product scope: focus timer (Pomodoro/deep focus), goal/streak tracking, optional GitHub context.
- Current architecture is split into:
  - `src/main` (Electron main process + IPC)
  - `src/preload` (bridge)
  - `src/renderer` (React UI)

## Stack Snapshot

- UI: React 19 + Tailwind CSS 4 + framer-motion + lucide-react
- State: Zustand + persisted local storage
- Runtime: Electron 39 + Vite 7
- Storage/security: Electron IPC + keychain (`keytar` fallback)

## Reuse Potential For Base Miniapp

High reuse (can move with little/no changes):

- Timer core state machine in `src/renderer/src/store/timerStore.ts`
- Goal history logic in `src/renderer/src/hooks/useGoalHistory.ts`
- Stats/streak logic in `src/renderer/src/hooks/useStats.ts`
- Most presentation components under `src/renderer/src/components/*`

Medium reuse (small adapter needed):

- `src/renderer/src/hooks/useTimer.ts`
  - Replace `window.electronAPI.showNotification` with web Notification API or no-op fallback.
- `src/renderer/src/hooks/useGitHub.ts`
  - Works on web, but token handling should move away from Electron secure store.

Low/no reuse (Electron-only):

- `src/main/*`, `src/preload/*`, `src/shared/constants.ts` IPC channel section
- `src/renderer/src/components/Titlebar/Titlebar.tsx`
- `src/renderer/src/hooks/useTrayIntegration.ts`
- Any direct use of `window.electronAPI` (token storage, folder picker, commit command, external opener)

## Miniapp Migration Impact

Must remove or redesign for Base Miniapp:

- Desktop window controls/minimize/close
- Tray integration and tray toggle actions
- Local folder picker and local git commit execution
- OS keychain token writes through Electron bridge

Miniapp-specific additions required:

- `@farcaster/miniapp-sdk` bootstrap (`sdk.actions.ready()`)
- `fc:miniapp` embed metadata on app entry/share routes
- Manifest route at `/.well-known/farcaster.json`
- Signed `accountAssociation`
- `requiredChains: ["eip155:8453"]`

## Practical Porting Strategy

1. Create a Next.js Miniapp shell.
2. Copy renderer-only code (`src/renderer/src`) into web app modules.
3. Replace `window.electronAPI` references with web adapters.
4. Hide or defer desktop-only features (tray, local commit, native window controls).
5. Add Base Miniapp metadata + manifest + signing.
6. Validate in Base App preview and publish.

## Concrete Adapter Plan

- `platform.ts` (new): provide functions for `notify`, `openExternal`, `saveToken`, `loadToken`.
- Web implementation:
  - `notify`: Notification API + graceful fallback
  - `openExternal`: `window.open(url, '_blank', 'noopener,noreferrer')`
  - `saveToken/loadToken`: `localStorage` (v0) or backend session (v1)
- Replace direct `window.electronAPI` calls in:
  - `App.tsx`
  - `GitHubSettings.tsx`
  - `CommitMessageModal.tsx`
  - `MediaLauncher.tsx`
  - `useAppLogging.ts`
  - `useTrayIntegration.ts` (remove)
  - `Titlebar.tsx` (remove/replace with web header)

## Recommendation For v0 Launch

- Keep: timer, goal, streak, GitHub read-only metrics, sharing.
- Defer: local git commit flow, tray behavior, secure keychain flow.
- Chain: Base only (`eip155:8453`) as requested.
