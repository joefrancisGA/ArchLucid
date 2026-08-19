# UX: Prominent Tenant / Workspace Isolation Cue

## Goal
Add an always-visible boundary indicator in the shell that shows the CTO which tenant and workspace they are in. This directly answers the multi-tenant isolation question every enterprise CTO asks — "how do I know my data is separate from other customers?" — without them having to ask.

## Context
- The current shell header (`AppShellClient.tsx`) has: logo, breadcrumbs, global search, `AuthPanel`, `ScopeSwitcher`, help, theme.
- `ScopeSwitcher` exists but is a picker — not a permanent visible label.
- The assessment flags workspace/project IDOR and scope confusion (SAQ-012) as trust risks.
- Key files:
  - `archlucid-ui/src/components/AppShellClient.tsx`
  - `archlucid-ui/src/components/ScopeSwitcher.tsx` (or equivalent — find via grep)
  - `archlucid-ui/src/lib/demo-ui-env.ts`
  - `archlucid-ui/src/lib/design-tokens.ts`
  - `archlucid-ui/src/lib/showcase-static-demo.ts` — demo tenant name

## What to build

### 1. `TenantWorkspaceBoundaryBadge` component
New component `archlucid-ui/src/components/shell/TenantWorkspaceBoundaryBadge.tsx`:

```typescript
type Props = {
  readonly tenantName: string;
  readonly workspaceName: string;
  readonly variant?: "header" | "compact";
};
```

Renders a small pill in the shell header:
- **Header variant** (default): `"Tenant: Acme Corp · Workspace: Default"` — `OPERATOR_TYPOGRAPHY.badge` size, neutral border, white/neutral background.
- **Compact variant**: icon only (building icon) with tooltip showing full tenant + workspace.

Uses a shield or building icon from `lucide-react` (already available).

Design rules:
- Neutral surface only — no teal/amber background.
- Border: `border border-neutral-200 dark:border-neutral-700`.
- Text: `text-neutral-600 dark:text-neutral-400`.
- No bright color — this is a trust signal, not an alert.

### 2. Tenant/workspace data source

**In demo/buyer-polished mode:**
- Tenant name: `"Claims Intake Showcase"` (or read from a new constant `SHOWCASE_DEMO_TENANT_NAME` in `showcase-static-demo.ts`).
- Workspace name: `"Healthcare"` (matching the active story).
- Update workspace name reactively when the story changes (listen to `ARCHLUCID_CTO_DEMO_STORY_CHANGED_EVENT`).

**In live mode (real tenant):**
- Read from the existing scope/workspace context (find where `ScopeSwitcher` gets its data — likely a context or hook).
- If no tenant name is available, show `"Your tenant"` as a safe fallback.

### 3. Wire into `AppShellClient`
In `AppShellClient.tsx`, add `<TenantWorkspaceBoundaryBadge>` to the header bar:
- Position: between the breadcrumbs and the right-side icons (`AuthPanel`, help, theme), or just to the left of `ScopeSwitcher`.
- In buyer-polished mode: always visible.
- In full-operator mode: visible by default (this is a general trust feature, not demo-only).
- Use `variant="header"` on ≥ lg screens, `variant="compact"` (icon + tooltip) on smaller screens.

### 4. Demo isolation callout on executive landing (Step 1)
In `CtoDemoExecutiveAboveFold.tsx`, add a one-line trust note directly below the verdict:

> "Showing data from the **Claims Intake Showcase** tenant — isolated from all other tenants by design."

Use `OPERATOR_TYPOGRAPHY.badge` text, neutral color. Render only in buyer-polished / demo mode.

This makes "tenant isolation" tangible at the moment the CTO is most focused.

### 5. Link to the isolation details panel
The `TenantWorkspaceBoundaryBadge` should be clickable in demo mode: clicking opens the `CtoDemoHowItWorksTrigger` dialog (built in the `ux-how-it-works-panel.md` prompt) directly to the "Isolation" section.

If the how-it-works panel has not been built yet, link to `/help/getting-started#how-archlucid-works` as a fallback.

## Acceptance criteria
- `TenantWorkspaceBoundaryBadge` renders in the shell header in both buyer-polished and full-operator mode.
- In demo mode, it shows the showcase tenant name and updates when the story selector changes.
- In live mode, it shows the real tenant name (or "Your tenant" fallback).
- The executive landing Step 1 shows the isolation callout in demo mode.
- The badge is keyboard-focusable and has a tooltip with the full tenant + workspace name.
- Unit tests: renders correct tenant/workspace text in demo mode; renders "Your tenant" when no tenant name is available; updates when story changes.
- Does not render on marketing/public routes (use `isBuyerPolishedOperatorShellEnv()` guard — it's only true inside the architect workspace; API name remains `OperatorShell`).

## Constraints
- No new icon library — use `lucide-react` (already a dependency).
- The badge must not exceed 200px wide on mobile (use `max-w-[200px] truncate` on the text).
- Do not replace `ScopeSwitcher` — this is an additive, read-only trust signal.
