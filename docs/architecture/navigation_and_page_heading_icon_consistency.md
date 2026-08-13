# Navigation and page-heading icon consistency

**Date:** 2026-07-13  
**Scope:** Shared nav-derived page identity for top-level destinations — foundation, `PageHeading` component, integration pages, and representative Architecture / Insights / Governance / Administration routes.

## Architecture selected

**Option C (nav-config as SSOT) with shared `PageHeading` chrome.**

- `nav-config.ts` / `flattenNavLinks()` remain the authoritative source for route labels and icons.
- `resolve-nav-link-for-pathname.ts` resolves `pathname → NavLinkItem` using longest-prefix match.
- Query-scoped nav rows (e.g. `/reviews?projectId=default`) match **only** the exact pathname — not nested detail routes.
- `PageHeading` consumes `navHref` and resolves the icon at render time (no duplicate icon imports on pages).
- `OperatorPageHeader` accepts optional `navHref` and delegates to `PageHeading` when set.

**Not chosen:** a parallel route-identity registry (Option B) — would duplicate nav-config and increase drift risk.

**Partial precedent retained:** `webhooks-surface-icon.ts` remains the named export used in the integrations nav builder; page headings resolve the same `Webhook` icon through nav-config.

## Authoritative icon source

| Layer | Module | Role |
|-------|--------|------|
| Navigation | `*-nav-group-builder.ts` → `nav-config.ts` | Defines `NavLinkItem.icon` |
| Resolution | `resolve-nav-link-for-pathname.ts` | `resolveNavIconForHref(navHref)` |
| Presentation | `PageHeading.tsx` | Renders decorative icon beside title |

## Routes updated

### Integrations (required)

| Route | Component | Variant |
|-------|-----------|---------|
| `/integrations/cloud-connections` | `CloudConnectionsPageClient` | `integration` |
| `/integrations/jira` | `ItsmProductIntegrationPageClient` | `integration` |
| `/integrations/servicenow` | `ServiceNowIntegrationPageClient` | `integration` |
| `/integrations/teams` | `TeamsNotificationsIntegrationPageView` | `integration` |
| `/integrations/slack` | `SlackIntegrationPageClient` | `integration` |
| `/integrations/webhooks` | `WebhooksSettingsClient` | `integration` (migrated to `PageHeading`) |

### Representative top-level destinations

| Route | Component | Mechanism |
|-------|-----------|-----------|
| `/graph` | `GraphPageContent` | `OperatorPageHeader navHref="/graph"` |
| `/governance` | `GovernanceWorkflowPageContent` | `OperatorPageHeader navHref="/governance"` |
| `/administration/settings/users` | `SettingsRolesPageView` | `PageHeading` |
| `/architectures/new` | `architectures/new/page.tsx` | `PageHeading` (server component) |

## Routes deliberately excluded

- Review run detail (`/reviews/runs/{id}`) — no primary-nav identity; query-scoped list nav does not apply to detail.
- Help articles (`/help/...`) — documentation surfaces, not primary nav destinations.
- Nested integration provider pages (`/integrations/cloud-connections/azure`, etc.) — sub-configuration, not nav rows.
- Policy pack detail, approval lineage, SSO wizard steps, signup flows, error pages.
- Bulk migration of every governance sub-page (`/governance/findings`, `/governance/alerts`, …) — can adopt `navHref` on `OperatorPageHeader` incrementally.

## Terminology conflicts found (not changed)

| Surface | Nav label | Page title | Notes |
|---------|-----------|------------|-------|
| Users directory | Users & roles | Users and roles | Ampersand vs “and” — page copy kept; reported only |
| Evidence graph | Evidence trail (nav) | Evidence graph / buyer vocabulary on page | Existing product vocabulary split preserved |
| Executive dashboard | Portfolio overview (nav) | Executive summary vocabulary on `/dashboard` | Pre-existing; not altered in this pass |

## Bundle and rendering considerations

- Icons are static Lucide imports already present in nav builders — no new icon pack.
- `PageHeading` is a server-compatible component (no `"use client"`).
- No dynamic `import()` — tree-shaking unchanged.
- Icons use `aria-hidden` beside a real `h1`/`h2` title.

## Visual standard

| Token | Value |
|-------|-------|
| Default icon | `h-6 w-6`, `gap-3`, `items-start` flex row |
| Integration variant | `h-10 w-10` rounded tile (matches existing Webhooks polish) |
| Title | `OPERATOR_TYPOGRAPHY.pageTitle` |
| Description | `OPERATOR_TYPOGRAPHY.body` / helper text in page content |

## Files changed

| Path | Change |
|------|--------|
| `archlucid-ui/src/lib/resolve-nav-link-for-pathname.ts` | **New** — nav icon resolver |
| `archlucid-ui/src/lib/resolve-nav-link-for-pathname.test.ts` | **New** |
| `archlucid-ui/src/components/PageHeading.tsx` | **New** — shared heading chrome |
| `archlucid-ui/src/components/PageHeading.nav-identity.test.tsx` | **New** |
| `archlucid-ui/src/components/operator/OperatorPageHeader.tsx` | Optional `navHref` → `PageHeading` |
| Integration page clients (6) | `PageHeading` with `variant="integration"` |
| `GraphPageContent.tsx` | `navHref="/graph"` |
| `GovernanceWorkflowPageContent.tsx` | `navHref="/governance"` |
| `SettingsRolesPageView.tsx` | `PageHeading` |
| `architectures/new/page.tsx` | `PageHeading` |
| `webhooks/page.test.tsx` | Asserts shared nav/page icon |

## Tests run

```text
npx vitest run \
  src/lib/resolve-nav-link-for-pathname.test.ts \
  src/components/PageHeading.nav-identity.test.tsx \
  'src/app/(operator)/integrations/webhooks/page.test.tsx'
```

```text
npm run typecheck
```

## Test results

| Suite | Result |
|-------|--------|
| `resolve-nav-link-for-pathname.test.ts` | **6 passed** |
| `PageHeading.nav-identity.test.tsx` | **11 passed** |
| `webhooks/page.test.tsx` | **17 passed** |
| **Total** | **34 passed** |
| `npm run typecheck` | **Passed** |

## Remaining limitations

1. Most governance, insights, and administration sub-routes still use `OperatorPageHeader` without `navHref` — incremental adoption.
2. `OperatorPageHeader` without `navHref` keeps legacy layout (no icon).
3. Full `next build` not run in this pass; typecheck validates compile safety.
4. Mobile nav drawer does not duplicate page-heading icons (sidebar-only identity) — unchanged by design.
