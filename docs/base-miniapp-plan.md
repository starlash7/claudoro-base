# Claudoro -> Base Miniapp Migration Plan

Last updated: 2026-03-06

## 1) Product Direction

- Existing product: `claudoro` (vibe coding timer)
- Goal: migrate current desktop app into a Base Miniapp with minimal UI/logic rewrite
- Target chain (fixed): `Base` (`eip155:8453`)
- Launch strategy: migration-first MVP, then growth/featured optimization

## 2) Migration-First Architecture

### Keep as-is

- Existing timer UX and session logic
- Existing design system and app routes
- Existing backend model (if already in use)

### Add for Miniapp compatibility

- `@farcaster/miniapp-sdk` integration
- `sdk.actions.ready()` at app bootstrap (to remove loading state in client)
- Manifest endpoint at `/.well-known/farcaster.json`
- Embed metadata (`fc:miniapp`) on launch/shareable routes
- Base-safe in-app flows (no forced external redirects for critical paths)

### Base chain setup

- `requiredChains: ["eip155:8453"]`
- Any onchain actions (if present in claudoro) should default to Base

## 3) Required Platform Checklist (Current Docs)

- App must be publicly accessible via HTTPS
- Manifest must be accessible at `/.well-known/farcaster.json`
- Include valid `accountAssociation` in manifest (signed)
- Include required discovery metadata (`primaryCategory`, `tags`, etc.)
- `homeUrl` must expose valid embed metadata for launch/share previews
- For prod discovery, keep `noindex: false` (or omit)

## 4) Suggested MVP Scope for Claudoro Miniapp

- Timer start / pause / resume / complete (core loop unchanged)
- Session complete screen with share CTA
- Optional lightweight onchain milestone action on Base (v0.1)
- Analytics events:
  - app_open
  - timer_started
  - timer_completed
  - share_clicked
  - (optional) onchain_action_submitted

## 5) Execution Plan

### Phase A: Integrate Existing App (Day 1)

- Import/merge completed claudoro codebase into this repository
- Add Miniapp SDK bootstrap (`ready()`)
- Add Base Miniapp manifest file/route
- Add embed metadata to root + share route

### Phase B: Validate in Base Tooling (Day 2)

- Deploy to production-like HTTPS domain
- Generate `accountAssociation` from Base Build preview tool
- Paste signed association into manifest and redeploy
- Validate launch + metadata + manifest in preview

### Phase C: Publish & Index (Day 2)

- Post app URL in Base app feed
- Confirm search indexing (normally within ~10 minutes after valid share)
- Verify category placement and saved-app behavior

## 6) Concrete File-Level Integration Targets

- `/.well-known/farcaster.json` (implemented via framework route)
- App bootstrap/root layout: initialize Miniapp SDK and call `ready()` once
- Launch/share routes: add `fc:miniapp` metadata
- Env vars for `accountAssociation` and canonical URL

## 7) Manifest Baseline (Base chain)

```json
{
  "accountAssociation": {
    "header": "<signed>",
    "payload": "<signed>",
    "signature": "<signed>"
  },
  "miniapp": {
    "version": "1",
    "name": "Claudoro",
    "homeUrl": "https://<your-domain>",
    "iconUrl": "https://<your-domain>/icon.png",
    "splashImageUrl": "https://<your-domain>/splash.png",
    "splashBackgroundColor": "#0B0F1A",
    "subtitle": "Focus timer for builders",
    "description": "Run focused vibe-coding sessions and track completion.",
    "primaryCategory": "productivity",
    "tags": ["focus", "timer", "productivity"],
    "heroImageUrl": "https://<your-domain>/hero.png",
    "tagline": "Ship in focused sprints",
    "ogTitle": "Claudoro",
    "ogDescription": "A focused timer built for makers.",
    "ogImageUrl": "https://<your-domain>/og.png",
    "requiredChains": ["eip155:8453"]
  }
}
```

## 8) Immediate Inputs Needed

1. Completed `claudoro` source location (this repo/another repo/local path)
2. Stack of the finished app (Next.js/Vite/other)
3. Production domain to use for manifest signing
4. Whether v0 includes an onchain action or timer-only launch

## 9) Claudoro Reference Reality Check (2026-03-06)

- The referenced `Claudoro` project is an Electron desktop app (`electron-vite`), not a deployed web app.
- Migration should therefore be `renderer code reuse + Electron shell removal`, not a pure deploy.
- A file-level portability audit is documented in:
  - `docs/claudoro-reference-audit.md`
- This does not change the Base target chain decision:
  - `requiredChains: ["eip155:8453"]`

## 10) References

- Base: Migrate an Existing App
  - https://docs.base.org/mini-apps/quickstart/migrate-existing-apps
- Base: Create a Mini App
  - https://docs.base.org/mini-apps/quickstart/create-new-miniapp
- Base: Manifest
  - https://docs.base.org/mini-apps/core-concepts/manifest
- Base: Embeds & Previews
  - https://docs.base.org/mini-apps/core-concepts/embeds-and-previews
- Base: Sign Your Manifest
  - https://docs.base.org/mini-apps/technical-guides/sign-manifest
- Base: Base App Compatibility
  - https://docs.base.org/mini-apps/troubleshooting/base-app-compatibility
- Base: How Search Works
  - https://docs.base.org/mini-apps/troubleshooting/how-search-works
- Farcaster: Publishing your app (manifest ownership + domain)
  - https://miniapps.farcaster.xyz/docs/guides/publishing
