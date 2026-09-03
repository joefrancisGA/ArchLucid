# PT-01 — Working mode is the default; teaching chrome never flashes

## Goal

Treat ArchLucid as a working-architect tool. **Working** workspace mode is the default for authenticated architects. **Guided** is an opt-in teaching mode. Teaching chrome must not render before preferences hydrate.

## Why

The product sells a seat for a repeat professional. Today `DEFAULT_WORKSPACE_MODE` is `"guided"` (`archlucid-ui/src/lib/workspace-mode/workspace-mode.ts`). `useTeachingChromeVisible()` returns **true** when context is null or `mounted` is false (`use-teaching-chrome-visible.ts`), so Working-mode users can flash tours, first-finding strips, and “where to go next” on first paint. Graduation after the first sealed review **never auto-switches**. That is a consumer-SaaS pattern, not a livelihood tool.

## Context

- `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md` — Guided vs Working table
- `archlucid-ui/src/components/WorkspaceModeProvider.tsx` — hydrates from localStorage then server
- `archlucid-ui/src/components/workspace-mode/WorkspaceModeGraduationOfferHost.tsx`
- `archlucid-ui/src/lib/api/user-preferences.ts`
- Call sites of `useTeachingChromeVisible()` (tours, first-finding strip, help auto-open, AppShell affordances)

## What to build

1. Change `DEFAULT_WORKSPACE_MODE` to `"working"`.
2. Keep Guided as an explicit preference in **Account → Preferences → Workspace mode**. First-run / evaluator copy may still *offer* Guided once, dismissibly — never re-enable teaching chrome by default.
3. `useTeachingChromeVisible()`:
   - Return **false** when context is null or `mounted` is false (fail closed: no teaching flash).
   - Return true only when mode is Guided **and** mounted.
4. Graduation offer: if the user is already Working, do not show “switch to Working.” If you keep an offer, invert it: offer Guided to people who want teaching, not Working to people who already have a sealed review.
5. Server `UserSettings.WorkspaceMode`: treat missing/null as Working to match the new default. Do not rewrite existing explicit `"guided"` rows.
6. Update Vitest for workspace-mode parsing, teaching-chrome visibility, provider first paint, and graduation host.

## Acceptance criteria

- A new authenticated user with no stored preference lands in Working: Overview is a work queue, tours/first-finding strips/Where-to-go-next do not render.
- Reloading a Working-mode session never paints Guided chrome before hydrate.
- An explicit Guided preference still shows teaching chrome after mount.
- Demo / CTO-tour overlays are unchanged when those tours are **actively** started; they are not implied by the workspace-mode default.

## Constraints

- Do not flip `NEXT_PUBLIC_OPERATOR_EXPERIENCE` in this prompt (that is PT-02).
- Do not hide review workspace tabs.
- Do not auto-switch a stored Guided user to Working.
