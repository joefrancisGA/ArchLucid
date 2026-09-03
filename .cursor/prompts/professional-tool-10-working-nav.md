# PT-10 — Working mode shows the full authorized professional nav

## Goal

In **Working** mode, the sidebar shows every destination the user’s **authority already allows**, including drafts, analysis, governance, and reports, **before** the first sealed review. Role-shaped density and first-session “pilot only” hiding apply to **Guided** only. Do not hide desktop review workspace tabs.

## Why

Daily users build a spatial map. `filterNavGroupsByRoleDensity` / `filterNavGroupsForFirstSessionPilotMode` (`archlucid-ui/src/lib/role-shaped-nav-density.ts`) hide groups until **Show all sidebar links**. Architect default is only `pilot` + `operate-analysis`. First session can be `pilot` only until a committed package exists. `OPERATOR_UI_EXPERIENCE_MODES.md` already *claims* Working unlocks full authorized nav before first commit — this prompt makes that true in `useOperatorShellNavRows` and related filters. Draft list `/architecture/architectures` must not stay a near-orphan.

## Context

- `archlucid-ui/src/lib/role-shaped-nav-density.ts`
- `archlucid-ui/src/hooks/useOperatorShellNavRows.ts`
- `archlucid-ui/src/hooks/use-role-nav-density-expanded.ts`
- `archlucid-ui/src/components/sidebar-nav/RoleNavDensityExpandControl.tsx`
- `archlucid-ui/src/lib/nav-disclosure-copy.ts`
- Architectures hub routes (`/architecture/architectures`)
- IA assessment: drafts stranded; progressive disclosure unvalidated

## What to build

1. Working mode: skip `filterNavGroupsForFirstSessionPilotMode` and skip role-density filtering (treat as `showFullNav === true`) while **still** honoring RBAC (hidden if unauthorized).
2. Guided mode: keep role-shaped density and first-session progressive disclosure; keep **Show all sidebar links**.
3. Promote **Architecture drafts** (`/architecture/architectures`) into the Architecture/Review work group for Working (and for Guided once a draft exists). “Create architecture” must not be the only path back to a saved draft.
4. Demote **First review guide / Getting started** in Working as already specified in experience-modes docs (footer or account, not a primary nav peer).
5. Command palette: do not list destinations the user cannot open; do list drafts/governance when Working unlocked them.
6. Vitest for nav row filters: Working + no committed review still shows analysis/governance groups the role allows; Guided + no commit stays thin.

## Acceptance criteria

- Working architect with zero sealed reviews can open drafts, findings, and (if authorized) governance from the sidebar without Show all.
- Guided new workspace still starts thin.
- Unauthorized admin routes stay hidden.
- Desktop review tabs are not collapsed as part of “simplifying” nav.

## Constraints

- **Forbidden:** More-menu overflow for core workspace tabs (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- Do not use nav visibility as a substitute for API authorization.
- Do not implement GTM first-session observation cohorts.
