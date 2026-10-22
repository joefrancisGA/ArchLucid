# UX: Graceful Off-Script Panels (No Dead-End Redirects)

## Goal
Replace `DemoStrictNavigationGate`'s silent redirect-to-home with an informative "available in your tenant" page, so when a CTO clicks `/admin`, `/settings`, `/search`, or any other blocked route during a demo, they see a useful panel — not a confusing blank home screen.

## Context
- Current state: `DemoStrictNavigationGate.tsx` silently redirects blocked prefixes to `/`. To a CTO watching, this looks like a bug or a broken link.
- Blocked prefixes (from `DemoStrictNavigationGate`): `/admin`, `/settings`, `/replay`, `/planning`, `/search`, `/integrations`, `/evolution`, `/users`, `/billing`, and others.
- Key files:
  - `archlucid-ui/src/components/cto-demo/CtoDemoReviewRouteGuard.tsx` — related guard pattern
  - `archlucid-ui/src/components/DemoStrictNavigationGate.tsx` (or equivalent — find via grep for `DemoStrictNavigationGate`)
  - `archlucid-ui/src/app/(operator)/` — route structure

## What to build

### 1. `CtoDemoBlockedRoutePanel` component
New component `archlucid-ui/src/components/cto-demo/CtoDemoBlockedRoutePanel.tsx`:

Props:
```typescript
type Props = {
  readonly routePath: string;
  readonly routeLabel: string;
  readonly description: string;
};
```

Renders a full-page centered panel (not a redirect):
```
[ArchLucid logo / product name]

[route icon]  Settings

This area is available in a provisioned ArchLucid tenant.
During this showcase, the five-step review journey is live
— Settings, Admin, and integrations are available post-signup.

[Return to demo →]   [Request access]
```

Rules:
- Use enterprise design tokens (neutral surface, `OPERATOR_TYPOGRAPHY`, no bright backgrounds).
- "Return to demo →" navigates to the current tour step's `href` (read from `readBuyerCtoDemoTourActive()` and `resolveBuyerCtoDemoTourNavigation(pathname)`). If tour is not active, navigate to `/`.
- "Request access" links to `/signup` or `/get-started`.
- The panel must show the correct `routeLabel` and `description` for the blocked path — not a generic message.

### 2. Route metadata map
In a new file `archlucid-ui/src/lib/cto-demo-blocked-route-registry.ts`, define a map from blocked path prefix to metadata:

```typescript
export type BlockedRouteEntry = {
  readonly prefix: string;
  readonly label: string;
  readonly description: string;
};

export const CTO_DEMO_BLOCKED_ROUTES: readonly BlockedRouteEntry[] = [
  { prefix: "/admin", label: "Admin console", description: "Tenant configuration, user management, and system health monitoring." },
  { prefix: "/settings", label: "Settings", description: "Workspace preferences, API keys, and integration configuration." },
  { prefix: "/search", label: "Search", description: "Full-text search across all architecture packages, findings, and decisions." },
  { prefix: "/replay", label: "Replay", description: "Re-run any historical review with updated policy packs to track improvement." },
  { prefix: "/planning", label: "Planning", description: "Multi-quarter governance roadmap and remediation scheduling." },
  { prefix: "/integrations", label: "Integrations", description: "Connect Jira, ServiceNow, Slack, and CI/CD pipelines (V1.1)." },
  { prefix: "/evolution", label: "Evolution candidates", description: "Trend analysis of recurring findings across architecture packages." },
  { prefix: "/users", label: "Users & roles", description: "Role-based access control and authority assignment." },
  { prefix: "/billing", label: "Billing", description: "Subscription management and usage reporting." },
];

export function findBlockedRouteEntry(pathname: string): BlockedRouteEntry | null { ... }
```

### 3. Update `DemoStrictNavigationGate`
Instead of `router.replace("/")`, render `<CtoDemoBlockedRoutePanel>` with the matched entry's label and description. If no entry matches, fall back to a generic panel (label: "This page", description: "This area is available in a provisioned tenant.").

Use client-side rendering (not a server redirect) so the blocked-route panel appears at the correct URL, not at `/`.

### 4. Page title
Set `document.title` to `"{routeLabel} — ArchLucid"` in the panel so the browser tab is still informative.

## Acceptance criteria
- Navigating to `/admin` during a demo shows the "Admin console" panel, not home.
- Navigating to `/settings` shows the "Settings" panel with a "Return to demo" CTA.
- "Return to demo" navigates to the current tour step when the tour is active, or `/` otherwise.
- The panel renders for every entry in `CTO_DEMO_BLOCKED_ROUTES`.
- Existing `CtoDemoReviewRouteGuard` is unaffected.
- Unit test: `findBlockedRouteEntry("/admin/users")` returns the `/admin` entry.
- Unit test: panel renders with correct label and description for each route prefix.
