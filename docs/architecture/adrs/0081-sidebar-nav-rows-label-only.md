> **Scope:** ADR 0081 — Operator sidebar nav rows are label-only; no visible helper copy under links.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0081: Sidebar nav rows are label-only

- **Status:** Accepted
- **Date:** 2026-09-08
- **Owner decision:** Remove visible descriptive sub-labels under sidebar navigation links

## Context

AO-40 / LS-11 introduced **visible** disabled-reason copy under Working bind-tool nav rows (for example, "Open an architecture identity desk first." beneath Evidence graph, Ask review questions, and Compare two reviews). The intent was to explain why a row was non-navigable without relying on native `title` tooltips.

In practice the sub-labels:

- Doubled vertical density in the primary left nav — the sidebar is scanned dozens of times per session on the Working seat (ADR 0080).
- Repeated the same gate sentence under multiple adjacent rows, adding noise without teaching a new affordance.
- Competed with group headings and work-queue badges for scan attention on an instrument surface that should stay compact (IBM Carbon / Fluent shell guidance in `UI_DESIGN_SYSTEM.md`).

Gate semantics remain correct: bind tools stay `navLinkDisabled` until a last-open architecture identity is set (ADR 0077 / 0079). Operators still need to know *why* a row is disabled — but that belongs in screen-reader supplemental hints, desk continuity empty states, or page-level guidance — not as a second line under every sidebar label.

**Related:** ADR 0079 (Working desk is the work surface), ADR 0080 (Working seat is never buyer-polished), `archlucid-ui/docs/NAV_CONFIG_CONTRACT.md`, `SidebarNavLink.tsx`, `apply-working-bind-tool-nav-gate.ts`.

## Decision

1. **Sidebar nav rows render a single visible label line** (plus optional icon, badge, and pin affordances). No visible helper, reason, or description copy may appear directly beneath a sidebar link or disabled nav row.
2. **Disabled-row explanations use `navLinkDisabledTitle` only**, exposed through `aria-describedby` on an `sr-only` supplemental hint in `SidebarNavLink` — never as visible adjacent text and never as native `title`.
3. **Remove `navLinkDisabledReason` and `navLinkDisabledVisibleHint`** from `NavLinkItem`. New nav metadata must not reintroduce visible sub-label fields.
4. **Vitest guard:** `sidebar-nav-link-density-guard.test.ts` fails if `SidebarNavLink` source reintroduces visible disabled-reason rendering or the removed type fields.
5. **Page-level and desk-level guidance** (empty states, LayerHeader, first-week route guidance, architecture desk bind banners) remain the supported surfaces for teaching bind-tool prerequisites — not the sidebar list.

## Trade-offs

**Gains:** Cleaner sidebar scan path for repeat Working operators; less repeated boilerplate under Insights/Outcomes rows; aligns with enterprise nav density expectations; one consistent pattern for enabled and disabled rows.

**Sacrifices:** Sighted users who never open an architecture desk no longer read the gate sentence inline in the sidebar — they must infer disabled styling or encounter guidance on the desk / destination empty state. Screen-reader users still receive the full reason via `aria-describedby`.

**Rejected:** Keeping visible sub-labels only on disabled rows (asymmetric density); collapsing Insights bind tools out of the sidebar entirely (would hide reachable destinations); using native `title` tooltips (hover-only, poor touch/a11y).

## Constraints

- **Do not** hide desktop review workspace tabs behind **More** (product direction).
- **Do not** remove Working bind-tool gates — only the visible sub-label presentation.
- **TB-645 vocabulary** on any buyer-visible copy touched by follow-up empty-state work.
- Nav config contract and Vitest guards must stay aligned when adding new sidebar rows.

## Expected impact

**System:** `SidebarNavLink` disabled branch matches enabled branch visually (one line); `applyWorkingBindToolNavGateToLink` sets `navLinkDisabledTitle` only; removed type fields cannot be set without a deliberate contract break.

**Security:** Unchanged — bind-tool gates and API authority remain authoritative; UI omission of sub-labels does not imply routes are safe to deep-link.

**Operations:** Support may need to point operators to architecture desk continuity when bind tools look muted — same as before, but without inline sidebar copy.

**Cost:** Small one-time UI cleanup; negligible runtime.

## Consequences

- **Positive:** Sidebar matches enterprise instrument density; ADR gives reviewers a hard stop for "helpful" sub-label regressions.
- **Negative:** First-time Working operators may need desk-level empty states to learn bind prerequisites if they skip architecture desk onboarding.
- **Follow-ups:** Ensure architecture desk / insights empty states mention bind prerequisites where sighted users land after clicking a disabled row is impossible (non-clickable rows).
