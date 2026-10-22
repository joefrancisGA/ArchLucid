# Fix: CI #2503 — Playwright live-API E2E failures (`archlucid-ui`)

> Run: 101 executed / 138 total, many `@release-gate`-class `live-api-*.spec.ts` failures across
> unrelated pages and flows. Read "Evidence" under each concern before changing anything — several
> clusters share one root cause; do not re-diagnose from scratch or "fix" by loosening assertions
> without confirming intent first.

## Failing concerns (grouped by root cause, not by spec file)

| # | Concern | Class | Blast radius |
|---|---------|-------|--------------|
| A | `e2e/helpers/live-api-client.ts` missing/misused exports | TypeError, 0ms fail | 2 tests |
| B | axe color-contrast regressions (WCAG 2.2 AA) | serious a11y violation | 2 tests |
| C | Fixture `description` text fails architecture-domain admission gate | 400 `REJECT-AS-WRITTEN` | 8 tests / 7 spec files |
| D | `POST .../commit` hangs past Playwright test timeout | `Request context disposed` | ~13 tests / 10 spec files |
| E | Stale/regressed headings, test ids, and routes in reviews/runs/audit UI | `toBeVisible` timeout | ~10 tests / 7 spec files |
| F | Backend 503/400 + trial/draft product bugs | assorted | ~6 tests |

All six are independent — fix in parallel, verify each in isolation.

---

## Concern A — `live-api-client.ts` helper bugs (quick, mechanical)

### Evidence

1. `archlucid-ui/e2e/helpers/ensure-demo-workspace-seed.ts:6` imports `getPilotRunDeltasRaw` from
   `./live-api-client`, but **no such export exists** in `live-api-client.ts` (confirmed via full
   export scan). Every caller of `ensureDemoWorkspaceSeedReady` — e.g.
   `live-api-buyer-golden-path.spec.ts` — fails immediately with
   `TypeError: (0 , _liveApiClient.getPilotRunDeltasRaw) is not a function` (0ms, both attempts).
2. `archlucid-ui/e2e/live-api-rate-limit-smoke.spec.ts:13` calls `liveApiBase()` **as a function**,
   but `live-api-client.ts:22` exports it as `export const liveApiBase = resolveLiveApiBase();` — a
   **string constant**, not a function (it's explicitly `@deprecated` in favor of
   `resolveLiveApiBase()`). Fails with `TypeError: (0 , _liveApiClient.liveApiBase) is not a function`.

### Fix

1. Add `getPilotRunDeltasRaw` to `live-api-client.ts`, modeled directly on the adjacent
   `getAuthorityRunDetailRaw` (`live-api-client.ts:422`): `GET /v1/pilots/runs/{runId}/pilot-run-deltas`
   (see `docs/library/API_CONTRACTS.md:148`), same `LiveTenantScopeHeaders` + `mergeTenantScope` pattern,
   `encodeURIComponent(runId)`, returns `Promise<APIResponse>`.
2. In `live-api-rate-limit-smoke.spec.ts:13`, change `const base = liveApiBase();` to
   `const base = liveApiBase;` (or migrate the whole file to `resolveLiveApiBase()` for consistency
   with the deprecation note — prefer this since it's a one-line file).

### Acceptance

- `live-api-buyer-golden-path.spec.ts` and `live-api-rate-limit-smoke.spec.ts` no longer fail with a
  `TypeError` (remaining failures, if any, must be genuine live-API assertions, not helper bugs).
- No other caller of `liveApiBase` (const) is broken by the rate-limit-smoke edit — grep first.

---

## Concern B — axe color-contrast violations (WCAG 2.2 AA, `serious`)

### Evidence

1. **Finding detail page, dark mode** — `copy-for-jira-button`
   (`archlucid-ui/src/components/CopyFindingAsWorkItemButton.tsx`): foreground `#525252` on background
   `#171717` → contrast **2.29**, needs **4.5:1**. Route:
   `/runs/claims-intake-modernization/findings/phi-minimization-risk`.
2. **Advisory page** — inactive tab `#advisory-hub-tab-schedules`
   (`archlucid-ui/src/components/advisory/AdvisoryHubClient.tsx`): foreground `#848484` on background
   `#fafafa` → contrast **3.58**, needs **4.5:1**. Route: `/advisory`.

### Fix

- Follow `docs/library/UI_DESIGN_SYSTEM.md` (Carbon-based neutral tokens) — do **not** invent new hex
  values. Find the existing muted-text/icon Tailwind token used elsewhere for AA-compliant secondary
  text in dark mode and light mode respectively (e.g. `text-neutral-400`/`dark:text-neutral-300` class
  family already used by compliant components) and apply it to:
  - the icon/label inside the Jira-copy button for the **dark** variant specifically (`#171717` bg is
    `dark:bg-neutral-950`-class — pick a foreground that hits â‰¥4.5:1 against it, not just against light
    surfaces).
  - the inactive-tab text/border color in `AdvisoryHubClient.tsx` for the **light** surface (`#fafafa`
    is `bg-neutral-50`).
- Verify computed contrast (e.g. quick calc or existing token contrast table in
  `UI_DESIGN_SYSTEM.md`) meets 4.5:1 at the given font sizes (12px / 13px, both below the 18.66px/14px
  bold "large text" AA threshold of 3:1 — the 4.5:1 bar applies).
- Do not change `aria-selected`/interactive behavior — visual-only fix.

### Acceptance

- `npx playwright test e2e/live-api-accessibility.spec.ts -g "@live-a11y-pr"` (from `archlucid-ui/`,
  requires `LIVE_API_URL` — see `docs/engineering/BUILD.md` for the live-API harness) shows 0 critical
  or serious violations on the Finding-detail and Advisory routes, both light and dark mode.
- No regression in `CopyFindingAsWorkItemButton.test.tsx` / `advisory-hub-tab.test.ts`.

---

## Concern C — fixture `description` text fails the architecture-domain admission gate

### Evidence

`ArchLucid.Application/Runs/Orchestration/LlmSemanticAdmissionGate.cs:15-17` (and the draft-lane
twin, `ArchLucid.Application/Drafts/DraftAdmissionDomainHeuristic.cs:10-12`) reject
`POST /v1/architecture/request` unless `description` matches:

```
\b(architecture|system|database|api|service|cloud|azure|aws|gcp|security|compliance|tenant|scale|latency|throughput|auth|identity)\b
```

`live-api-client.ts:118-134` already has `liveE2eArchitectureDescription(testIntent)` — a helper that
appends architecture vocabulary when the intent alone would be rejected — and a comment noting it
mirrors this exact gate. **Seven spec files already route their `description` through it correctly**
(`live-api-archival`, `live-api-analysis-report`, `live-api-alert-rules`, `live-api-advisory-flow`,
`live-api-negative-paths`, `live-api-jwt-auth`, `live-api-auth-parity-spine`). The following hardcode a
raw literal instead and contain **none** of the required keywords, so every one 400s at `createRun`:

| Spec | Line(s) | Literal |
|------|---------|---------|
| `live-api-concurrency.spec.ts` | 35 | `"Live E2E: parallel commit race."` |
| `live-api-concurrency.spec.ts` | 75 | `"Live E2E: parallel governance approve."` |
| `live-api-email-run-to-sponsor.spec.ts` | 43 | `"Live E2E: drive a committed run so the sponsor PDF CTA renders on /runs/[runId]."` |
| `live-api-why-archlucid.spec.ts` | 59 | `"Live E2E: drive counters for /why-archlucid proof page."` |
| `live-api-search-ask-graph.spec.ts` | 39 | `"Live E2E search / ask / graph path."` |
| `live-api-replay-export.spec.ts` | 37 | `"Live E2E: replay and re-export after commit."` |
| `live-api-governance-rejection.spec.ts` | 52-53 | `"Live E2E governance rejection path: committed run with approval request rejected by a different actor."` |
| `live-api-smoke.spec.ts` (`buildLiveSmokeScopedRunCreateBody`) | 62-63 | `"Live smoke scoped run for authority compare alongside seeded demo workspace A product tour baseline."` |

### Fix

In each location above, wrap the literal: `description: liveE2eArchitectureDescription("<same text>")`
(import `liveE2eArchitectureDescription` from `./helpers/live-api-client` if not already imported).
Do **not** change the admission gate's keyword regex — the fixtures are the bug, not the gate (7 other
specs already comply with it).

### Acceptance

- Every spec/line above imports and uses `liveE2eArchitectureDescription`.
- Grep confirms no remaining `description:` literal in `archlucid-ui/e2e/*.spec.ts` that both (a) is
  passed to `createRun`/`postArchitectureRequestRaw` and (b) fails the keyword regex.
- The 8 listed tests no longer fail with `VALIDATION_FAILED` / `REJECT-AS-WRITTEN` (remaining failures,
  if any, must be a different, genuine issue — cross-reference Concern D before concluding "fixed").

---

## Concern D — `POST /v1/architecture/review/{runId}/finalize` hangs past the Playwright test timeout

### Evidence

Roughly a dozen specs across unrelated flows (`live-api-advisory-flow`, `live-api-alert-rules`,
`live-api-analysis-report`, `live-api-archival`, `live-api-compare-runs` Ã—2, `live-api-conflict-journey`,
`live-api-journey`, `live-api-negative-paths` Ã—2, `live-api-trial-signup` funnel) all fail the same way:
the test's own `test.setTimeout(...)` (ranging 120s–480s) elapses while control is suspended inside
`commitRun` (`archlucid-ui/e2e/helpers/live-api-client.ts:335-365`), specifically at the
`await request.post(.../commit, ...)` call on line 341. When Playwright kills the test at its timeout,
the in-flight request context is disposed, surfacing as
`Error: apiRequestContext.post: Request context disposed.` — that message is a **symptom of the
timeout**, not the root cause.

`commitRun`'s own retry loop (`maxCommitTransient409Attempts = 12`, ~2s per 409/~0.5s per 5xx) cannot
by itself burn 2–8 minutes — so a **single** `POST .../commit` call to the live `ArchLucid.Api` is
itself hanging for minutes without returning any response (not even a slow-but-valid one), most likely
a backend deadlock/blocking wait in the commit/authority-merge orchestration path, or a lock never
released from a prior run in the same suite (note several of these specs run store-and-verify commit
flows back-to-back with shared demo/workspace fixtures).

Do **not** conclude "flaky CI" and raise timeouts — that only hides a genuine hang, exactly as diagnosed
previously for a hung `IHostedService` in `.cursor/prompts/fix-ci-run-2162-all-failures.md` (Concern B+C)
and `.cursor/prompts/fix-ci-run-2138-ask-host-lifecycle-hang.md`. This is very likely the same class of
bug (an unbounded await somewhere in the commit path) — check those two docs' methodology (blame dumps,
bounded-lifecycle guards) even though the surface symptom here is HTTP-level rather than host-dispose.

### Investigation steps

1. Reproduce locally against a real `ArchLucid.Api` instance (see `docs/engineering/BUILD.md` /
   `docs/LIVE_E2E_AUTH_ASSUMPTIONS.md` for the live-API harness). Run one failing spec in isolation
   (e.g. `live-api-conflict-journey.spec.ts`, smallest timeout) with `LIVE_API_URL` pointed at a local
   API process, and watch the API process's own logs/thread state while the test is stuck on commit.
2. Find the commit endpoint: `ArchLucid.Api/Controllers/Authority/RunsController.cs` (commit route,
   see `ArchLucid.Api/Routing/RunWriteLifecycleRoutes.cs`) → trace into
   `ArchLucid.Application/ArchitectureRunServiceResults.cs` and the commit/authority-merge service it
   calls. Look for: unbounded `await` on a distributed lock, semaphore, outbox drain, or a synchronous
   `.Result`/`.Wait()`/`GetAwaiter().GetResult()` deadlock risk, and any lock acquisition that is never
   released on a prior exception path (a run that previously errored mid-commit could leave a lock
   held, explaining why unrelated specs — which don't share a runId — all wedge: they may share a
   coarser-grained lock, e.g. per-tenant/per-workspace, or a saturated background worker/outbox queue
   that commit waits on synchronously).
3. If the CI job for #2503 captured hang/blame artifacts or timeouts at the process level, check for
   `.dmp`/diagnostic output the same way `fix-ci-run-2162-all-failures.md` Step 1 does; otherwise add
   temporary diagnostic logging around the commit path's lock acquisition/outbox wait to pinpoint the
   exact `await` that never resolves, then remove the temporary logging once the real fix lands.

### Fix

- Make the identified blocking operation honor a bounded timeout/cancellation token so `commit` either
  succeeds, returns a proper transient error (409/503) that the existing retry loop already handles, or
  fails fast with a clear exception — it must never hang indefinitely.
- If the root cause is a leaked lock/held resource from an unrelated failing run, fix the release path
  (e.g. `try/finally` or `using` around the lock) so one bad run cannot wedge every subsequent commit in
  the suite.
- Keep `maxCommitTransient409Attempts`/backoff in `live-api-client.ts` unchanged unless the backend fix
  changes the expected transient-error shape.

### Acceptance

- Run the 3 fastest affected specs locally against a live API 3Ã— each back-to-back in the same process
  (mirroring CI's shared demo/workspace fixtures) — commit must return within seconds every time, no
  test timeout.
- `.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"` passes.
- No behavior change to commit's success/conflict/error semantics beyond eliminating the hang.

---

## Concern E — stale/regressed headings, test ids, and default paths in reviews/runs UI

### Evidence

A recent UX change moved `/reviews/new`'s default intake path to `"quick-review"`
(`ReviewsNewPathSwitcher.tsx:54`: `useState<ReviewsNewActivePath>("quick-review")`), and gated the full
wizard shell behind `wizardMode === "full"` while `wizardMode` itself defaults to `"quick"`
(`NewRunWizardClient.tsx:266-267`, `:726-727`). This breaks several **older** E2E assumptions that a
guided/full wizard renders immediately on navigation:

| Spec | Broken assumption |
|------|--------------------|
| `live-api-socratic-intake.spec.ts` (both tests) | expects `data-testid="socratic-intake-wizard"` visible immediately at `/reviews/new` — it only renders after selecting the `"guided-intake"` path (see the already-correct pattern in `QuickReviewWizard.test.tsx:114`: click `reviews-new-path-guided-intake` first) |
| `live-api-smoke.spec.ts` (`pilot spine`, line 144) | expects `data-testid="new-run-wizard-progress"` visible at `/reviews/new?baseline=1` — only renders when `showFullWizardShell` is true, which requires `wizardMode === "full"`; confirm whether `?baseline=1` is still supposed to force full-wizard mode and, if so, why it no longer does (check `NewRunWizardClient.tsx` around lines 230-270 for how `wizardMode` is derived from search params) |
| `live-api-core-pilot-path.spec.ts` | expects `getByRole("heading", { name: "Architecture reviews" })` on `/reviews` — confirm current heading text/role on the reviews list page (`RunsListClient.tsx`; note line 665 has an `EnterpriseTable ariaLabel="Architecture reviews (empty)"`, which is not a `<heading>`) |
| `live-api-error-states.spec.ts` | expects headings `"Run detail"` (h2) on `/runs/{fakeId}`, and `getByRole("heading", {name: /runs/i}).first()` on `/runs?projectId=default` — confirm current heading markup on both pages |
| `live-api-review-manifest-roundtrip.spec.ts` | expects `section[aria-label="Review outcome summary"]` on a finalized review's outcome-strip — confirm current `aria-label`/selector on the outcome-strip component (`EmailRunToSponsorBanner.tsx` / outcome-strip section — grep for `outcomeStripSignedRecordLink`) |
| `live-api-whitelabel-export.spec.ts` | `#artifacts-exports` never appears within 180s on a finalized run detail page — confirm the export section's current `id` (see `RunDetailArtifactsExportsSection.tsx`) |

### Fix approach — for **each** row above

1. Load the actual current page/component and determine whether the **product** intentionally changed
   (new copy, new default path, renamed id/aria-label) or whether something is **broken** (element
   should render but a bug prevents it, e.g. an error boundary swallowing the content, or a truly
   missing `id`/`aria-label` that was dropped in a refactor).
2. If intentional: update the **spec** to match current behavior — for wizard-path tests, add the
   `.click()` on `reviews-new-path-guided-intake` (or whichever affordance now reaches the wizard)
   before asserting; for heading/selector renames, assert the current text/id (prefer referencing a
   shared label constant from `src/lib/i18n.ts` / `architecture-review-vocabulary.ts` over a hardcoded
   string, per the pattern in `fix-ci-run-2162-all-failures.md` Concern A2).
3. If broken: fix the **component** (add back the missing `id`/`aria-label`/heading, or fix whatever
   swallows the render) — do not "fix" by relaxing the test to accept a broken state.
4. For the `?baseline=1` full-wizard case specifically: if the query param is still documented/intended
   to force the full wizard (check `docs/` for `baseline=1` usage), fix `wizardMode` derivation to honor
   it; if the flow was intentionally consolidated into `quick-review`, update the smoke test to follow
   the new entry point instead.

### Acceptance

- All 7 specs above pass without weakening any assertion's intent (each fix must be traceable to either
  a cited intentional product change or a named component bug fix).
- No unit test regressions in `NewRunWizardClient.test.tsx`, `ReviewsNewPathSwitcher.test.tsx`,
  `QuickReviewWizard.test.tsx`, `RunsListClient.test.tsx`.

---

## Concern F — backend 503/400s and trial/draft product bugs

### Evidence

1. `GET /v1/governance/compliance-drift-trend` → **503** repeatedly (both attempts, both retries) in
   `live-api-error-states.spec.ts`'s governance-dashboard test — the dashboard heading never renders
   because the page presumably blocks/errors on this call. Trace the 503 to its source
   (`ExecutiveComplianceDriftTrendSection.tsx` on the UI side calling the API; backend handler wired
   through `GovernanceController.cs` — check for a missing config/feature dependency in the CI
   environment vs. a genuine handler bug).
2. `GET /v1/audit/search` → **400** for both `live-api-error-states.spec.ts` tests that pass a
   non-existent/malformed `runId` filter — confirm whether 400 is actually correct-and-the-test-is-wrong
   (a non-existent run id used as a *filter* value arguably should be a valid, empty-result 200, not a
   validation error) or whether the audit-search validator is too strict. The test's own intent
   ("shows no-results, not a crash") suggests **200 with empty results** is the desired contract — if
   so, the fix is in the audit-search input validation, not the test.
3. Board-pack endpoint → **503** in `live-api-executive-board-pack.spec.ts` (`expected 2xx, got 503`).
   Same investigation pattern as #1 — likely the same upstream dependency.
4. `live-api-trial-end-to-end.spec.ts:183`: `trialJson.trialSeatsUsed` expected `1`, got `0` after a
   fresh `/v1/register` — the seat-usage counter is not incrementing for the registering user. Find the
   trial-status/seat-counting code path (search `trialSeatsUsed` in `ArchLucid.*` and
   `InMemoryTenantRepository.cs`) and confirm the initial-seat increment on registration.
5. `live-api-trial-signup.spec.ts:153` (DevelopmentBypass UI test): the sample-run link href is
   `/reviews/{id}`, test expects `/runs/{id}`. Cross-reference Concern E — determine the **canonical**
   route for a run/review detail page today (several other passing specs use `/runs/{id}` as canonical)
   and fix whichever side is wrong: either the sample-run link should point at the canonical `/runs/`
   path, or `/runs/` and `/reviews/` are both valid aliases and the test needs updating — confirm via
   the routing config, don't guess.
6. `live-api-socratic-intake.spec.ts` draft-API-lane test: `submit` 400s with
   `"MUST question 'l0.actor.additional-kinds' must be answered before submit."` — the test's
   admit → skip-MUST → submit flow does not know about this MUST question id. Find where the test
   enumerates/skips MUST questions (`live-api-client.ts` draft helpers, `skipDraftQuestionLive`) and
   confirm whether `l0.actor.additional-kinds` is a newly added MUST question that the skip loop needs
   to include, or whether it should not be MUST-required in the first place.

### Fix

Each sub-item above needs its own root-cause determination (backend config/bug vs. stale fixture) before
changing anything — do not blanket-relax assertions to `expect(res.status()).toBeLessThan(600)` or
similar. Prefer fixing the backend/API when the test's documented intent (see each spec's `test(...)`
name and inline comments) describes correct behavior that the API fails to deliver.

### Acceptance

- All 6 sub-items pass with a named root cause (config gap, validator bug, seat-counter bug, route
  mismatch, or missing MUST-question skip) documented in the commit message.
- `.\scripts\ci\agent-compile-check.ps1 -ProjectPath "ArchLucid.Backend.slnf"` passes if any `.cs` files
  changed.

---

## General acceptance (all concerns)

- Do not raise Playwright `test.setTimeout` values as a "fix" for Concern D or any other timeout —
  that hides the hang instead of fixing it.
- Do not weaken axe/a11y assertions, admission-gate keyword lists, or HTTP status assertions to make a
  red test green — fix the underlying cause per the analysis above.
- Every concern is independently verifiable; do not bundle unrelated concerns into one commit.
- Per `AGENTS.md`/workspace rules: do not commit or push without an explicit branch name from the user.
