# Claudoro Base Miniapp

Claudoro desktop app logic migrated into a Base Miniapp shell.

## Stack

- Next.js 16 (App Router)
- React 19 + Tailwind CSS 4
- `@farcaster/miniapp-sdk`
- Zustand + Framer Motion + Lucide

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Base Miniapp Setup Notes

- Manifest file path: `public/.well-known/farcaster.json`
- Current `accountAssociation` values are placeholders:
  - `REPLACE_WITH_HEADER`
  - `REPLACE_WITH_PAYLOAD`
  - `REPLACE_WITH_SIGNATURE`
- Chain is fixed to Base in manifest:
  - `requiredChains: ["eip155:8453"]`

## Metadata

- Embed metadata is generated in `src/app/layout.tsx`
- App URL source is `NEXT_PUBLIC_URL` (fallback: `https://claudoro-base.vercel.app`)

## Migration Notes

- Renderer logic from `starlash7/Claudoro` is reused.
- Electron-only capabilities are shimmed for web runtime in `src/lib/electronApiShim.ts`.
- Desktop-only tray/window control behavior is disabled for miniapp runtime.
