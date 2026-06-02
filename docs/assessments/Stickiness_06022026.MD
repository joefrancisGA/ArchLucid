> **Scope:** Evaluator — independent first-principles Stickiness quality assessment; not a buyer-facing status report.

# Stickiness — Solution Quality Assessment (3.26%)

**Date:** 2026-06-02
**Assessor:** Independent AI coding agent — no prior assessment scores consulted.
**Score:** **63 / 100**
**Weighted contribution:** **3.26%** (weight 6, total model weight 116 — COMMERCIAL category)
**Quality model note:** Stickiness is formally defined in `docs/library/ASSESSMENT_QUALITY_MODEL.md` (COMMERCIAL category, weight 6, total weight 116). Prior draft of this file used an inferred weight of 5 against an old 50-point pool; the title and weighted contribution have been corrected to reflect the canonical model.

---

## 0. Methodology

**Quality definition (derived):** Stickiness = the degree to which ArchLucid converts a one-time pilot operator into a habitual user — creating recurring operating workflows, governance continuity, cross-review compounding value, and organizational dependency through risk register ownership, digest rhythms, comparison loops, product learning, and decision persistence.

**Evidence sources read:**
- `docs/library/REPEAT_REVIEW_LOOP.md`
- `docs/library/CUSTOMER_SUCCESS_PERSISTENCE_DESIGN.md`
- `docs/library/AI_LEVERAGE_ROADMAP.md` (items 11, 14)
- `docs/library/TECH_BACKLOG.md` (TB-057–063)
- `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`
- `docs/library/OPERATOR_DECISION_GUIDE.md`
- `docs/library/PRODUCT_LEARNING.md`
- `docs/library/GOVERNANCE_WORKFLOW_UI.md`
- `ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.cs`
- `archlucid-ui/src/lib/api/governance-stickiness-api.ts`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectGovernanceStickinessPanel.tsx`
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx`
- `docs/library/ASSESSMENT_QUALITY_MODEL.md`, `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`
- `.cursor/rules/Assessment-Scope-V1_1.mdc`

**Inferred weight:** 5 (on par with Proof-of-ROI Readiness). Total pool treated as 50 for weighted contribution.
**Weighted contribution formula:** `score × 5 / 50 = score × 10%`

**Sub-dimensions and weights:**

| Sub-dimension | Weight | Score | Deficiency signal |
|---|---:|---:|---:|
| Governance continuity (finding lifecycle, waivers, risk register, decision register) | 25% | 73 | 6.75 |
| Repeat-review loop completeness | 25% | 68 | 8.00 |
| Cross-review value compounding (compare, product learning, AI narrative) | 20% | 58 | 8.40 |
| Operating rhythm / digest (recurrence, decisions-needed, first-30-days) | 20% | 55 | 9.00 |
| CustomerSuccess signals (OperatorStickinessSignals, TenantHealthScores, CS-06) | 10% | 50 | 5.00 |

**Composite:** 73×0.25 + 68×0.25 + 58×0.20 + 55×0.20 + 50×0.10 = 18.25 + 17.00 + 11.60 + 11.00 + 5.00 = **62.85 → 63/100**

---

## 1. Scoring Justification

### 1a. Governance continuity — 73/100

**Strengths found in code:**

`GovernanceStickinessController.cs` (12+ endpoints wired to the full TB-057–061 stickiness workflow) is fully implemented and injected at startup:
- `POST/GET /v1/governance/findings/{findingId}/dispositions` — finding disposition (TB-058 done)
- `POST/GET /v1/governance/risk-exceptions` + revoke + renew — waivers/exceptions (TB-059 done)
- `GET /v1/governance/risk-register` — architecture risk register (TB-057 API done)
- `GET /v1/governance/decision-register` — decision register (TB-060 API done)
- `GET /v1/governance/decisions-needed-summary` — decision-needed digest summary (TB-061 partial)
- `POST/GET /v1/governance/recurrence-schedules` — review recurrence scheduling
- `GET/PUT /v1/governance/realized-value/attestation` — realized value tracking

`governance-stickiness-api.ts` fully mirrors all of the above with typed client wrappers.

`FindingInspectGovernanceStickinessPanel.tsx` exposes disposition and waiver workflows from within the finding inspector (TB-058, TB-059 UI done).

`GovernanceFindingsQueueClient.tsx` imports `getArchitectureRiskRegister` and renders the architecture risk register data with ITSM links, human review status, and CSV export — TB-057 is functionally done at the data level.

`governance/decision-register/page.tsx` exists — TB-060 UI done.

**Gaps:**
- No standalone `/governance/risk-exceptions` management page. Risk exceptions are accessible only from within an individual finding inspector panel, not as a cross-register list view with create/renew/revoke/expiry filtering.
- TB-057 reframing: the route still reads as "Governance findings queue" rather than "Architecture Risk Register" in the nav label. Operators may not realize this is the durable risk register concept.
- `GET /v1/governance/decisions-needed-summary` is implemented but not surfaced as a prominent KPI card in the governance dashboard — operators have to know to call the API.
- Expiring waiver banner/alert: `waiversExpiringWithin14Days` is in the summary DTO but there is no visual nudge on the governance dashboard or home screen.

### 1b. Repeat-review loop completeness — 68/100

**Strengths:**
- `REPEAT_REVIEW_LOOP.md` is clear, has a second-review proof checklist, and defines five stickiness signals (reused prior decision, repeated finding category trend, improved cycle time, governance trend, executive ROI rollup).
- Compare runs: UI compare and API compare endpoints ship in V1 per `API_CONTRACTS.md`.
- Governance dry-run → enforce path is documented and implemented.
- Recurrence scheduling API exists (`POST /v1/governance/recurrence-schedules` with cron expression, `NextRunUtc`).
- `PILOT_SUCCESS_SCORECARD.md` includes a six-week pilot timeline with explicit second-review data collection.

**Gaps:**
- No post-commit UI nudge: after a committed review, there is no "Schedule next review" affordance visible to the operator. The recurrence scheduling API exists but operators must know to call it or navigate to a route that does not yet exist in the UI.
- No `/governance/recurrence-schedules` management page in the UI (`Glob` search returns 0 results for `recurrence*` in `archlucid-ui/src/app`).
- The second-review proof collection script (`collect-first-pilot-proof.ps1`) does not appear to accept a run-number argument or include comparison delta in the output — it is framed as a first-run-only tool.
- No automated measurement of cycle time improvement across runs (the scorecard has blank fields; there is no OTel metric for second-review time-to-commit delta).

### 1c. Cross-review value compounding — 58/100

**Strengths:**
- Compare runs (UI + API): available and shipped.
- Product learning signals (`ProductLearningPilotSignals`) are collected per-finding, per-artifact, per-manifest.
- Product learning dashboard at `/product-learning` with summary, opportunities, trends, triage queue.
- `PRODUCT_LEARNING.md` documents four feedback dispositions (Trusted, Revised, Rejected, NeedsFollowUp).

**Gaps:**
- Product learning is explicitly one-directional: `PRODUCT_LEARNING.md` §1 states "Nothing in 58R auto-changes prompts, rule packs, or agents from this data." Operators submit feedback but nothing closes the loop — the product does not visibly improve or adjust based on their input within the same tenant session.
- No AI narrative on compare: `AI_LEVERAGE_ROADMAP.md` item 11 ("Conversational compare-two-runs explainer") is NOT implemented. Operators get a raw diff table rather than a 3–5 sentence narrative of "what changed and why does it matter." This is the single highest-leverage AI stickiness feature and it is absent.
- No evidence proposals queue: `AI_LEVERAGE_ROADMAP.md` item 14 is not built. Agents cannot propose new evidence catalog entries; the catalog does not grow from use.
- The comparison view has no AI-generated "net better or worse" verdict — operators must interpret raw delta rows.

### 1d. Operating rhythm / digest — 55/100

**Strengths:**
- `GovernanceDecisionsNeededSummary` DTO is fully specified: `pendingApprovals`, `staleRisks`, `unownedHighSeverityRisks`, `findingsAwaitingEvidence`, `waiversExpiringWithin14Days`, `deferredFindingsDue`, `totalDecisionItems`.
- `IGovernanceDigestDecisionNeededComposer` service is registered and the API endpoint exists.
- `governance/first-30-days/page.tsx` exists (a route specifically for first-30-days operating rhythm guidance).
- `ExecutiveRoiSummaryService` export path supports ROI summary exports with buyer-provided labels.

**Gaps:**
- `GovernanceDecisionsNeededSummary` is accessible via API but is NOT visually prominent in the governance dashboard. The governance dashboard shows pending approvals, recent decisions, and policy pack changes — it does not show a "decisions needed today" KPI card that aggregates the seven signals.
- No recurrence scheduling UI exists — operators cannot set up a weekly review cadence from within the product.
- No email/push delivery for the decisions-needed digest: TB-061 covers the "decision-needed governance digest" but the endpoint is in-app-only; there is no mechanism to push the summary to governance leads on a schedule.
- The `governance/first-30-days` route exists but its content quality and whether it drives operators back to the product regularly is not verified.

### 1e. CustomerSuccess signals — 50/100

**Strengths:**
- `TenantHealthScoringCalculator` (pure, testable static scoring logic).
- `OperatorStickinessSignals` and `PilotFunnelSnapshot` domain models.
- CS-03 fix implemented: `RefreshAllTenantHealthScoresAsync` delegates to `dbo.sp_TenantHealthScores_BatchRefresh` (single MERGE, not 3,000+ round-trips).
- `IOperatorStickinessSnapshotReader` interface is cleanly separated from persistence.

**Gaps (from `CUSTOMER_SUCCESS_PERSISTENCE_DESIGN.md`):**
- **CS-06** (High): `SqlOperatorStickinessSnapshotReader` does not inject `IRlsSessionContextApplicator`. A future call path without the `WHERE TenantId = @TenantId` parameter guard would silently cross tenant boundaries. This is a security gap, not a theoretical one.
- No operator-facing health score surface: `TenantHealthScores` are computed but not exposed in any UI or admin endpoint that ArchLucid operators (internal SaaS team) can monitor to identify at-risk accounts.
- `ToDateTimeOffset` method returns `DateTime?` — method name misleading (CS-07, low but confusing).
- No CS alerting on stickiness threshold drop: if a tenant's engagement score falls below a threshold, there is no signal to the ArchLucid team.

---

## 2. What the Score Reflects

**Score: 63/100**

The backend stickiness substrate is more complete than the visible product surface suggests. `GovernanceStickinessController` (12+ endpoints), `governance-stickiness-api.ts` (fully typed client), `FindingInspectGovernanceStickinessPanel` (disposition + waiver UI in finding inspector), and the decision register page ship most of the TB-057–061 commercial stickiness review work.

The 37-point gap comes from three compounding weaknesses:

1. **Surface visibility:** The stickiness features exist in the product but are buried. Risk exceptions have no standalone management page. The recurrence scheduling API has no UI. The decision-needed summary is not a visible KPI card. Operators who do not know these routes exist will not use them, eliminating the habit loop.

2. **Value compounding is one-directional:** Product learning signals are collected but never returned to operators in a product-visible way. Compare deltas show raw diff rows but no AI narrative. The product feels static between runs rather than compounding in intelligence.

3. **Operating rhythm has no engine:** The decisions-needed digest API exists but has no delivery mechanism. Recurrence scheduling has an API but no UI. Without a scheduled nudge or in-product reminder, the product relies on operators proactively returning — which is not stickiness.

**What is correctly excluded from the score:**
- ITSM productization (TB-063 scope: V1.1) — the ITSM primitives exist and TB-063 is marked Done (2026-06-01); full native Jira/ServiceNow productization is V1.1.
- MCP tool membrane — V1.1 per `V1_DEFERRED.md` §6d.
- Cross-tenant pattern learning / aggregate signals — V2 per `V1_DEFERRED.md` §1.

---

## 3. Improvements — Ordered by Weighted Deficiency

### S-01 — Recurrence scheduling UI: post-commit flow + management page

**Priority:** P1
**Sub-dimension:** Operating rhythm / digest (deficiency signal 9.0 — highest)
**TB:** TB-222

**Problem:** `POST /v1/governance/recurrence-schedules` and `GET /v1/governance/recurrence-schedules` are fully implemented in `GovernanceStickinessController`. `ArchitectureReviewRecurrenceSchedule` (with `scheduleId`, `cronExpression`, `nextRunUtc`, `isEnabled`) is fully typed in the UI client. But there is no UI that calls these endpoints. Operators who want a weekly review cadence must call the API directly. The post-commit flow has no "Schedule next review" affordance. This is the single most concrete operating-rhythm gap — the recurrence infrastructure is built and idle.

**Cursor prompt:**
```
Create two UI surfaces for recurrence scheduling:

1. Post-commit nudge (RecurrenceSchedulePostCommitCard):
   In `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`, after the CommitRunButton succeeds and `hasGoldenManifest` is true, render a new `RecurrenceSchedulePostCommitCard` component. The card should:
   - Show "Schedule next review" heading using `OPERATOR_TYPOGRAPHY.pageTitle`.
   - Pre-fill a cron expression field defaulting to `0 8 * * 1` (weekly Monday 8am).
   - Include a display name field (default: "Weekly architecture review").
   - Submit via `createArchitectureReviewRecurrenceSchedule` from `governance-stickiness-api.ts` with `sourceRunId = runId`.
   - On success, show a StatusTag "Scheduled" badge and the `nextRunUtc` in a human-readable format.
   - On error, show an inline error message.
   - Wrap in a collapsible; open by default only when `hasStickinessPrompt` (new boolean prop) is true.

2. Recurrence management page (`/governance/recurrence-schedules`):
   Create `archlucid-ui/src/app/(operator)/governance/recurrence-schedules/page.tsx` and a `RecurrenceSchedulesClient.tsx` client component. The page should:
   - Call `listArchitectureReviewRecurrenceSchedules` on load.
   - Render schedules in an `EnterpriseTable` with columns: Name, Source Run ID (truncated), Cron, Next Run, Enabled.
   - Show a `StatusTag` (Ready / Needs attention) based on `isEnabled` and `nextRunUtc` being in the past.
   - Provide an enable/disable toggle (call `PUT /v1/governance/recurrence-schedules/{id}` if that endpoint exists, otherwise note the gap).
   - Add the route to the governance nav section in `nav-config.ts` after "Decision register".
   - Add a LayerHeader: "Operate (governance and trust)".

Add unit tests for `RecurrenceSchedulePostCommitCard`: submitted state, success state, error state.
```

---

### S-02 — Decision-needed summary KPI card in governance dashboard

**Priority:** P1
**Sub-dimension:** Operating rhythm / digest (deficiency signal 9.0)
**TB:** TB-223

**Problem:** `GET /v1/governance/decisions-needed-summary` returns a fully specified `GovernanceDecisionsNeededSummary` DTO with 7 fields: `pendingApprovals`, `staleRisks`, `unownedHighSeverityRisks`, `findingsAwaitingEvidence`, `waiversExpiringWithin14Days`, `deferredFindingsDue`, `totalDecisionItems`. `getGovernanceDecisionsNeededSummary` is fully implemented in `governance-stickiness-api.ts`. The governance dashboard (`/governance/dashboard`) shows pending approvals, recent decisions, and policy pack changes — but it does NOT surface this summary. Operators who open the dashboard on Monday morning have no answer to "what decisions do I need to make today?"

**Cursor prompt:**
```
Add a "Decisions needed" KPI card to the governance dashboard.

In `archlucid-ui/src/app/(operator)/governance/dashboard/page.tsx`:
1. Import `getGovernanceDecisionsNeededSummary` from `@/lib/api/governance-stickiness-api`.
2. Fetch the summary alongside the existing `getGovernanceDashboard` call (parallel fetch).
3. Create a new `DecisionsNeededSummaryCard` component in `archlucid-ui/src/components/governance/`:
   - Renders a 2×3 grid of KPI tiles using `OPERATOR_TYPOGRAPHY.kpiValue` for counts and `OPERATOR_TYPOGRAPHY.label` for labels.
   - Tiles: "Pending approvals" (pendingApprovals), "Stale risks" (staleRisks), "Unowned High risks" (unownedHighSeverityRisks), "Awaiting evidence" (findingsAwaitingEvidence), "Waivers expiring (14d)" (waiversExpiringWithin14Days), "Deferred items due" (deferredFindingsDue).
   - If `totalDecisionItems === 0`, render an `OperatorEmptyState` with message "No decisions needed — all risks are current."
   - If `waiversExpiringWithin14Days > 0`, wrap the tile in a subtle left-border accent using `--al-caution` CSS variable.
   - Each tile links to the relevant route: pending approvals → `/governance`, stale risks → `/governance/findings?filter=stale`, waivers expiring → `/governance/risk-exceptions`.
4. Place the card at the top of the governance dashboard, before the pending approval requests list.
5. Auto-refresh alongside the existing 30-second dashboard refresh.
6. Add a Vitest test for `DecisionsNeededSummaryCard`: renders 7 tiles, shows empty state when totalDecisionItems is 0, highlights waivers expiring tile.
```

---

### S-03 — AI conversational compare-two-runs narrative (AI_LEVERAGE_ROADMAP item 11)

**Priority:** P1
**Sub-dimension:** Cross-review value compounding (deficiency signal 8.4)
**TB:** TB-224

**Problem:** `IComparisonService` already produces structured deltas. The compare UI renders a diff table. But "what changed between run A and run B, and why does it matter?" requires human interpretation of raw delta rows. This is the gap identified in `AI_LEVERAGE_ROADMAP.md` item 11. Without a narrative, every comparison feels like a spreadsheet diff rather than a progress report — weakening the "value compounds over time" story that makes buyers renew.

**Cursor prompt:**
```
Add an AI narrative to the compare view.

Backend:
1. In `AskService.cs`, extend `AskAsync` to check if `AskRequest.BaseRunId` and `AskRequest.TargetRunId` are both non-null.
2. When both are present, after loading the comparison delta from `IComparisonService`, make a single additional LLM call using `IAgentCompletionClient` (ModelTier.Fast if multi-model tiering is available, else default model):
   - System prompt: "You are an enterprise architect reviewing the delta between two architecture runs. Write a 3–5 sentence narrative covering: (1) the most significant improvement, (2) any new risk introduced, (3) whether the architecture is net-better or net-worse overall. Be specific and concrete. If the delta has no changes, say so."
   - User content: serialize the delta into a compact JSON summary (total additions, removals, modifications; top 3 finding categories by change count).
3. Add string property `ComparisonNarrative` (nullable) to `AskResponse`.
4. Guard with config key `Ask:GenerateComparisonNarrative` (default `false`).
5. Add unit test: delta with additions produces non-empty narrative; empty delta produces null/empty.

Frontend:
6. In the archlucid-ui compare page (find via `IComparisonService` usage in UI routes), after loading the comparison delta:
   - If both run IDs are present, call `POST /v1/ask` with `{ baseRunId, targetRunId, question: "Summarize the architectural changes" }`.
   - If `ComparisonNarrative` is non-null, render it as a highlighted info callout (`bg-transparent border-l-4 border-[var(--al-info)]`) above the delta table with a "✦ AI narrative" label.
   - Show loading skeleton while the Ask call is in-flight.
   - Show nothing on error (non-blocking).
```

---

### S-04 — CS-06: Inject `IRlsSessionContextApplicator` in `SqlOperatorStickinessSnapshotReader`

**Priority:** P1 (security)
**Sub-dimension:** CustomerSuccess signals (deficiency signal 5.0, but security-critical)
**TB:** TB-225

**Problem:** `CUSTOMER_SUCCESS_PERSISTENCE_DESIGN.md` §5.3 explicitly flags CS-06 as **High** severity: `SqlOperatorStickinessSnapshotReader` does not apply `IRlsSessionContextApplicator` before executing its multi-subquery SELECT. The current guard is only `WHERE TenantId = @TenantId` parameter. In a future call path that omits the parameter, this would silently return cross-tenant data. This is the same class of defect that TB-048/TB-073 addressed elsewhere in the stack.

**Cursor prompt:**
```
Fix CS-06 in `ArchLucid.Persistence/CustomerSuccess/SqlOperatorStickinessSnapshotReader.cs`:

1. Add `IRlsSessionContextApplicator` as a constructor parameter (after `IReadReplicaQueryConnectionFactory`).
2. In both `GetOperatorSignalsAsync` and `GetFunnelSnapshotAsync`:
   a. Open the connection via `IReadReplicaQueryConnectionFactory.CreateOpenConnectionAsync(cancellationToken)`.
   b. Call `await _rlsSessionContextApplicator.ApplyAsync(connection, tenantId, cancellationToken)` before executing the query.
   c. Pass the open connection into the `CommandDefinition` explicitly.
3. Fix CS-07: rename `ToDateTimeOffset` to `ToNullableUtcDateTime` — the method returns `DateTime?`, not `DateTimeOffset`.
4. Fix CS-08: collapse `OperatorSignalsRow` and `FunnelRow` inner class properties to one-line `{ get; init; }` per `CSharp-SimpleProperties-OneLine.mdc`.
5. Fix CS-09: change all COUNT column row type properties to `long`; remove `ToInt(object? v)` defensive converter.
6. Update `InMemoryOperatorStickinessSnapshotReader.cs` constructor to accept (and ignore) the new applicator for DI parity.
7. Update DI registration in the composition root to pass `IRlsSessionContextApplicator` to `SqlOperatorStickinessSnapshotReader`.
8. Add unit tests to `ArchLucid.Persistence.Tests/CustomerSuccess/`:
   - `GetOperatorSignalsAsync_AppliesRls` — verifies `ApplyAsync` is called before query execution.
   - `GetFunnelSnapshotAsync_AppliesRls` — same for funnel query.
   - `ToNullableUtcDateTime_ReturnsNull_WhenDbNull` — verifies the renamed helper.
```

---

### S-05 — Risk exceptions dedicated management page

**Priority:** P2
**Sub-dimension:** Governance continuity (deficiency signal 6.75)
**TB:** TB-226

**Problem:** `listRiskExceptions`, `createRiskException`, `renewRiskException`, and `revokeRiskException` are all implemented in `governance-stickiness-api.ts`. Risk exception creation is accessible from `FindingInspectGovernanceStickinessPanel.tsx` on the finding detail page. But there is no cross-finding list view where operators can see all active waivers, filter by expiry, renew expiring ones, or revoke outdated ones in bulk. An operator managing 40 active waivers across 200 findings has no single surface to do so.

**Cursor prompt:**
```
Create `archlucid-ui/src/app/(operator)/governance/risk-exceptions/page.tsx` and a `RiskExceptionsClient.tsx` client component.

`RiskExceptionsClient.tsx`:
1. On mount, call `listRiskExceptions()` from `governance-stickiness-api.ts`.
2. Render results in an `EnterpriseTable` with columns:
   - Finding ID (truncated with copy button)
   - Owner User ID
   - Rationale (truncated to 80 chars, full text in tooltip)
   - Status (StatusTag: "Active" green, "Expiring soon" amber when within 14 days, "Expired" red)
   - Expires (formatted date)
   - Actions (Renew / Revoke)
3. "Renew" opens an inline row form with a new expiration date picker (default: `defaultRiskExceptionExpiresAtUtc()` + 90 days) and an optional rationale field; calls `renewRiskException`.
4. "Revoke" calls `revokeRiskException` with a confirmation dialog.
5. Sort by `expiresAtUtc` ascending by default (soonest-to-expire at top).
6. Show a warning callout at the top when any exception expires within 14 days.
7. Show `OperatorEmptyState` when no active exceptions exist.

`page.tsx`:
- Server component wrapper with `OperatorPageHeader` title "Risk exceptions" and LayerHeader "Operate (governance and trust)".
- Render `<RiskExceptionsClient />`.

Add to governance nav in `nav-config.ts` after the "Governance findings" entry.

Add Vitest tests: renders table with 3 items, shows expiring-soon warning, empty state when 0 items.
```

---

### S-06 — Second-review proof collection: update `collect-first-pilot-proof.ps1` for repeat runs

**Priority:** P2
**Sub-dimension:** Repeat-review loop (deficiency signal 8.0)
**TB:** TB-227

**Problem:** `collect-first-pilot-proof.ps1` is named "first pilot proof" and is written as a first-run-only collection tool. The `REPEAT_REVIEW_LOOP.md` second-review proof checklist requires: "Compare output attached or linked in sponsor narrative" and "At least one stickiness signal improved or explained." Neither is collected by the current script. An operator doing the second review has no scripted path to produce comparison-enriched evidence.

**Cursor prompt:**
```
Update `scripts/collect-first-pilot-proof.ps1` to support multi-run evidence collection.

1. Add a `-RunNumber` parameter (int, default 1). When `-RunNumber 2` or higher:
   a. Require a `-CompareBaseRunId` parameter (Guid, the previous committed run ID).
   b. Call `GET /v1/architecture/run/{CompareBaseRunId}/compare/{RunId}` (or the equivalent compare endpoint per `API_CONTRACTS.md`). Write the response JSON to `pilot-proof/compare-run{N-1}-to-run{N}.json`.
   c. Call `GET /v1/governance/decisions-needed-summary` and append the result to `pilot-proof/decisions-needed-summary-run{N}.json`.
   d. Call `GET /v1/governance/risk-register` and write to `pilot-proof/risk-register-run{N}.json`.
   e. In the output manifest, add a `stickinessSignals` section populated from the compare delta: `findingsReduced`, `findingsAdded`, `cycleTimeDeltaMinutes` (if timing data is available), `governanceComplianceDelta`.

2. Rename the output folder from `pilot-proof/` to `pilot-proof-run{N}/` when `-RunNumber > 1` to avoid overwriting first-run evidence.

3. Update the script header comment to state: "Supports first and repeat review collection. Use -RunNumber 2+ with -CompareBaseRunId for second and subsequent review evidence."

4. Update `docs/runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md` and `docs/library/REPEAT_REVIEW_LOOP.md` §5 (Second-review proof checklist) to reference the `-RunNumber 2` invocation pattern.

5. Add Pester tests (or equivalent PowerShell test): RunNumber=1 writes to pilot-proof/, RunNumber=2 requires CompareBaseRunId, output includes stickinessSignals section.
```

---

### S-07 — Internal tenant health score surface for ArchLucid operators

**Priority:** P3
**Sub-dimension:** CustomerSuccess signals (deficiency signal 5.0)
**TB:** TB-228

**Problem:** `TenantHealthScoringCalculator` computes engagement scores, governance scores, and pilot completion scores. `dbo.TenantHealthScores` stores them. But there is no endpoint or UI where ArchLucid's internal team can see per-tenant health signals to identify at-risk accounts (stalled, disengaged, or stuck post-first-run). This leaves the SaaS CS team blind to adoption signals during the critical post-pilot conversion window.

**Cursor prompt:**
```
Add an internal admin endpoint for tenant health scores.

Backend:
1. Create `GET /v1/admin/tenant-health` in a new `AdminCustomerSuccessController.cs` in `ArchLucid.Api/Controllers/Admin/`.
2. Require `ArchLucidPolicies.SystemAdminAuthority` (internal operator only — not tenant-scoped).
3. Inject `IOperatorStickinessSnapshotReader` and call `GetOperatorSignalsAsync` for all tenants (admin context bypasses RLS via `SqlRowLevelSecurityBypassAmbient`).
4. Also read `dbo.TenantHealthScores` via `ITenantCustomerSuccessRepository` (extend the interface with `GetAllHealthScoresAsync` if needed; use the RLS bypass ambient scoped to a background context).
5. Return `TenantHealthSummaryResponse` containing: `TenantId`, `WorkspaceId`, `EngagementScore`, `GovernanceScore`, `PilotFunnelStage` (from `PilotFunnelSnapshot`), `RunsLast7d`, `CommitsLast7d`, `LastActivityUtc`.
6. Add `[RequiresSystemAdmin]` attribute (or equivalent guard); do not expose to standard tenant users.
7. Add unit tests: returns 200 for system admin, returns 403 for tenant user.

Frontend (optional, admin-only):
8. Add a minimal `/admin/tenant-health` page (Next.js app directory) behind the existing admin auth guard.
9. Render results in `EnterpriseTable` with sortable columns: Tenant, Engagement, Governance, Funnel Stage, Runs 7d, Last Active.
10. Color code: red for engagement < 30, amber for 30–60, green > 60 using `SeverityTag`.
```

---

### S-08 (DEFERRED — AI LEVERAGE ROADMAP SEQUENCING): Evidence proposals queue from agent runs

**Priority:** DEFERRED — depends on agent post-processing infrastructure from `AI_LEVERAGE_ROADMAP.md` item 14
**Sub-dimension:** Cross-review value compounding

**Problem:** Agents do not propose new evidence catalog entries during runs. The catalog does not grow from use. This is the foundation of a compounding knowledge advantage. `AI_LEVERAGE_ROADMAP.md` item 14 ("Agent-curated evidence pack proposals") has a full Cursor prompt; implementation requires a new `dbo.EvidenceProposals` table, a second short LLM call in each `AgentHandler`, and a `/admin/evidence/proposals` review screen.

**DEFERRED:** This requires the multi-model tiered orchestration (TB-179) to be stable first, to avoid adding token cost to every agent invocation without the `ModelTier.Fast` fast-path available. Implement after TB-179 ships.

**Partial implementation possible:** Create `dbo.EvidenceProposals` table (DDL migration) and the `ProposedEvidenceJson` column on `dbo.AgentResults` now. The review screen and LLM proposal call can follow once TB-179 is in place.

---

## 4. Deferred / Owner-Input Items

| ID | Question | Blocking Item |
|----|----------|---------------|
| PQ-STK-01 | Should "Stickiness" be formally added to `ASSESSMENT_QUALITY_MODEL.md` as quality weight 5, bringing total weight from 45 to 50? This affects all future weighted scores. | Formal model update |
| PQ-STK-02 | Should the decision-needed digest be emailed to governance leads on a schedule? If yes: which email service (Azure Communication Services or SendGrid), and is this V1 or V1.1? | Digest delivery mechanism (extending TB-061) |
| PQ-STK-03 | Is there a `GET /v1/governance/recurrence-schedules/{id}` enable/disable/update endpoint? S-01 cursor prompt references `PUT` — if not implemented, the management page will be list+create only. | S-01 management page enable/disable toggle |

---

## 5. Commercial Stickiness Realism (B — informational, zero weight on A)

The following do not penalize `(A)` V1 readiness but are honest buyer stickiness friction:

- **ITSM productization deferred (V1.1):** One-click Jira/ServiceNow issue creation from findings is the highest-leverage workflow stickiness signal for enterprise teams. The backend primitives exist (TB-063 marked Done 2026-06-01); the UI productization is V1.1. Enterprise buyers who measure "does ArchLucid plug into our existing ITSM workflow" will need a V1.1 roadmap conversation.
- **No cross-tenant pattern learning:** The product cannot tell an operator "tenants with similar architecture profiles reduced findings in this category by X% after addressing Y." This level of compounding intelligence requires cross-tenant aggregate signals — explicitly V2 per `V1_DEFERRED.md` §1.
- **Product learning signals are not personalized:** Feedback submitted in tenant A does not influence agent behavior for tenant A. The product does not yet adapt. Buyers who expect "the product learns from my team" will be disappointed in V1.
- **MCP membrane absent:** V1.1 membrane surface. Enterprise AI-platform teams asking for agent-callable ArchLucid tools will need a V1.1 timeline.

---

## 6. Summary Table

| Improvement | TB | Priority | Owner Input Needed | Cursor Can Implement |
|-------------|-----|----------|--------------------|---------------------|
| S-01 Recurrence scheduling UI + management page | TB-222 | P1 | No | Yes — full |
| S-02 Decision-needed summary KPI card in governance dashboard | TB-223 | P1 | No | Yes — full |
| S-03 AI conversational compare-two-runs narrative | TB-224 | P1 | No | Yes — full |
| S-04 CS-06 RLS fix on `SqlOperatorStickinessSnapshotReader` | TB-225 | P1 (security) | No | Yes — full |
| S-05 Risk exceptions dedicated management page | TB-226 | P2 | Partial (PQ-STK-03 enable/disable) | Yes — partial |
| S-06 Second-review proof script `collect-first-pilot-proof.ps1` update | TB-227 | P2 | No | Yes — full |
| S-07 Internal tenant health score surface | TB-228 | P3 | No | Yes — full |
| S-08 Evidence proposals queue from agent runs | DEFERRED | DEFERRED | Depends on TB-179 | Partial (DDL migration only) |

---

## 7. Backlog Cross-Reference

All items above are new additions to `docs/library/TECH_BACKLOG.md`. Additionally, the following pre-existing backlog items are the highest-priority Stickiness dependencies:

| ID | Title | Relevance to Stickiness |
|----|-------|------------------------|
| **TB-057** | Architecture risk register UI reframing | Nav label and empty-state copy for "Architecture Risk Register" — largely API-done, UI reframing pending |
| **TB-061** | Decision-needed governance digest | TB-223 extends this item with the visual dashboard widget |
| **TB-062** | Executive dashboard live KPI replacement | Overlap: mock KPIs on executive surfaces undermine stickiness trust signal |
| **TB-103** | Orphan-candidate count dual pipeline | Executive KPI divergence weakens ROI compounding trust |
| **TB-155** | ROI cache vs live decisions-needed canonical source | Impacts decisions-needed count accuracy; S-02 depends on this being correct |
| **TB-179** | Multi-model tiered orchestration | Prerequisite for S-08 (evidence proposals) to be cost-safe |

---

*Assessment produced 2026-06-02. No prior assessment scores consulted. All evidence sourced from current repository state.*
