# CD-01 — Working teaching copy matches Working nav

**Do not fork WA-04** for help-as-desk rows (`ARCHITECTURE_HOME_WORKING_ENTRY`). This file is **first-week / Operate deferral copy**: it still tells Working seats that Graph, Compare, and approval stay out of the sidebar until the first committed package. Working nav already skips that hide (`skipProgressiveNavDensity` in `useOperatorShellNavRows.ts`). Sidebar unlock phase is unused for visibility (`operate-nav-progressive-unlock.ts`).

## Goal

Working-mode first-week copy, onboarding deferral notes, and review-detail committed notes **do not claim the sidebar is locked** when Working already shows Insights / Governance / Reports. Guided may keep first-session deferral copy that matches *Guided* nav. Do not auto-switch stored Guided users.

## Why

Casual tools teach a funnel. A livelihood desk that shows Graph in the sidebar while a callout says “stay out of the sidebar until you commit” trains the architect to distrust the product. That is eval copy leaking onto the paying seat.

## Context

- `archlucid-ui/src/lib/first-week-route-guidance.ts` — `operateDeferralNote` on `home`, `onboarding`, `review-detail-committed`
- `archlucid-ui/src/lib/first-week-route-guidance.ts` `resolveFirstWeekRouteGuidanceForShell` — branches on buyer-polish only, not Working
- `archlucid-ui/src/hooks/useOperatorShellNavRows.ts` — `skipProgressiveNavDensity = isWorkingMode`
- `archlucid-ui/src/lib/usability/operate-nav-progressive-unlock.ts` — comment: sidebar visibility no longer uses phase
- CD-13 unmounts the guidance on Working review-detail; this file fixes the **copy** wherever it still mounts (Home, onboarding, Guided)

## What to build

1. Split first-week `operateDeferralNote` (and any “unlock after first commit” sentences) by workspace mode. Working: omit lock claims, or say those surfaces are already in the sidebar. Guided: keep deferral that matches `filterNavGroupsForFirstSessionPilotMode`.
2. `resolveFirstWeekRouteGuidanceForShell` must take Working vs Guided (or eval chrome via `resolveProductionEvalChrome`), not buyer-polish alone.
3. Vitest: Working home/onboarding fixtures do not contain “stay out of the sidebar” / “unlock in the sidebar after your first committed review”. Guided may still. `useOperatorShellNavRows.ts` empty diff for tab collapse.

## Acceptance criteria

- A Working user cannot screenshot a callout that contradicts the visible sidebar.
- Guided first-session deferral remains honest for Guided nav.
- Desktop review tabs unchanged.

## Constraints

- Do not hide desktop tabs behind **More**.
- Do not implement **M-90**.
- Do not re-enable Operate unlock phase as a Working sidebar gate.
