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

- Manifest route path: `/.well-known/farcaster.json`
  - implemented at `src/app/.well-known/farcaster.json/route.ts`
- Copy `.env.example` to `.env.local` and set real values.
- `accountAssociation` is loaded from env vars:
  - `MINIAPP_ACCOUNT_ASSOCIATION_HEADER`
  - `MINIAPP_ACCOUNT_ASSOCIATION_PAYLOAD`
  - `MINIAPP_ACCOUNT_ASSOCIATION_SIGNATURE`
- Chain is fixed to Base in manifest:
  - `requiredChains: ["eip155:8453"]`

## Metadata

- Embed metadata is generated in `src/app/layout.tsx`
- App URL source is `NEXT_PUBLIC_URL` (fallback: `https://claudoro-base.vercel.app`)

## Migration Notes

- Renderer logic from `starlash7/Claudoro` is reused.
- Electron-only capabilities are shimmed for web runtime in `src/lib/electronApiShim.ts`.
- Desktop-only tray/window control behavior is disabled for miniapp runtime.
