> **Scope:** Wave-close acceptance for live-seat first login (LS-001–LS-024). Evidence is test names and ADR 0102 — not manual screenshot sign-off.

# Live-seat acceptance — 2026-09-20

**ADR 0102 status:** Proposed (engineering landed; owner may Accept when satisfied).

**Owner screenshot target:** Record selected while scope still shows Customer Intake Demo and NOT LIVE DATA without choosing Training.

## Done test (from `LIVE_SEAT_COMPOSER_PROMPTS.md`)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Signed-in user who did not choose Training lands on live tenant workspace | **Pass** | `operator-scope-bootstrap.test.ts` (`bootstrapDedicatedWorkspaceScope_replaces_dev_default_scope_for_signed_in_users`); `live-seat-first-login-matrix.test.ts`; `getEffectiveBrowserProxyScopeHeaders` sticky-demo bypass in `operator-scope-storage.ts` |
| 2 | First login asks Training vs start in my workspace; returning users skip | **Pass** | `FirstSessionPurposeChooser.test.tsx`; `FirstSessionPurposeChooserHost.tsx`; `UserPreferencesControllerTests` (first-session-purpose); `first-session-purpose-copy.test.ts` |
| 3 | Invite path: accept → live workspace; create only without membership | **Pass** | `PostAuthBootstrapServiceTests` (`ResolveStatusAsync_prioritizes_pending_invitation`, `LiveSeatLs004_single_membership_resolves_complete_destination`); `post-auth-dedicated-scope.test.ts`; `applyDedicatedWorkspaceScopeFromAccessToken` in `PostAuthBootstrapClient` |
| 4 | Training opt-in; not a third Record/Practice segment | **Pass** | `live-seat-training-not-practice-ratchet.test.ts`; ADR 0102 consequences; `FirstSessionPurposeChooser` has no Record/Practice segments |
| 5 | Record + sample still shows NOT LIVE DATA | **Pass** | `live-seat-sample-scope-honesty.test.ts`; `DemoVsLiveChromeBanner.test.tsx` |
| 6 | Empty live Home primary CTA is start work | **Pass** | `resolve-empty-home-do-this-next` tests / `empty-live-home-copy.ts` (LS-012) |

## Prompt coverage

| Prompts | Status |
|---------|--------|
| LS-001–LS-003 | ADR 0102 + `first-session-purpose-copy` + `LIVE_SEAT_SIGNED_IN_SAMPLE_SCOPE_INVENTORY.md` |
| LS-004–LS-009, LS-016 | Post-auth order comments/tests; bootstrap dedicated scope; create-workspace copy; invitation workspace resolve |
| LS-010–LS-015, LS-023 | Scope bootstrap redirect, exit Training, help topic, workspace scope guide |
| LS-017–LS-018 | Funnel telemetry + Vitest matrix (`live-seat-first-login-matrix.test.ts`) |
| LS-019–LS-022 | `LiveSeatLs019_*` / `LiveSeatLs004_*` C# tests; `live-seat-do-not-autoseed-demo.test.ts` |
| LS-021 | `live-seat-prompt-inventory.test.ts` |
| LS-024 | This document |

## Owner index questions (assumed unless corrected)

| Question | Assumed answer |
|----------|----------------|
| Training definition | Guided + explicit sample visit |
| Invited first-time users see chooser | Yes |
| Chooser frequency | Once per user (server preference) |
| Secondary sample walkthrough on live Home | Yes (LS-012 secondary CTA) |
| Invitee workspace | Invitation workspace / tenant default |
| Self-serve skip create when membership exists | Yes (bootstrap Complete) |

## Residual / not closed here

- **TB-927** invitee create-review walk remains in `live-api-private-beta-access.spec.ts`; operator Home scope chrome after accept is asserted via `assertLiveSeatOperatorScopeChrome` (LS-018 Playwright).
- **Playwright** full first-login matrix (all join paths × Training) remains Vitest-only; release-gate specs cover invite accept → live scope chrome.
- Silent demo writers listed in `LIVE_SEAT_SIGNED_IN_SAMPLE_SCOPE_INVENTORY.md` — re-audit if new scope writers land.

## Explicit non-changes

- Training is **not** a Record/Practice segment; tokens remain `"career"` / `"rehearsal"`.
- **Guided** workspace mode remains.
- Sample honesty banners remain on sample scope.
- Host `AgentExecution:Mode` default **Simulator** unchanged (no G-REAL-06).
