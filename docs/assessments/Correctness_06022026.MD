# Correctness Solution Quality Assessment — 78.75/100 (78.75%)

**Assessment date:** 2026-06-02  
**Scope:** ArchLucid V1 / V1.1 in-contract commitments. V1.1-deferred and V2-deferred items are excluded from scoring.  
**Method:** Independent first-principles analysis of source code, test coverage data, backlog, and architecture documentation. No prior assessments referenced.  
**Weighted composite score: 78.75 / 100**

---

## Scoring Rubric

| Area | Weight | Raw Score | Weighted |
|------|--------|-----------|----------|
| Test Coverage | 25% | 60 | 15.00 |
| Business Logic Correctness | 20% | 74 | 14.80 |
| Null Safety & Defensive Programming | 20% | 82 | 16.40 |
| Idempotency & Concurrency Correctness | 15% | 71 | 10.65 |
| API Contract Correctness | 10% | 82 | 8.20 |
| Data Integrity & Persistence Correctness | 10% | 68 | 6.80 |
| Error Handling & Exception Propagation | 5% | 80 | 4.00 |
| AI/Agent Output Correctness | 5% | 58 | 2.90 |
| **Total** | **100%** | — | **78.75** |

---

## Areas by Priority (Most Improvement Needed First)

---

### 1. Test Coverage — 60/100 (Weight: 25%)

**Why this ranks first:** The CI merged-line gate floor is 75%, which is met. However, several critical production assemblies sit in the 2–24% range — meaning large swaths of decision-making, notification, authorization, and host orchestration logic run untested in CI.

**Evidence from coverage data (snapshot 2026-05-15):**

| Assembly | Line Coverage | Coverable Lines | Risk |
|----------|--------------|-----------------|------|
| `ArchLucid.Notifications` | **2.90%** | 414 | ChatOps hooks — zero coverage |
| `ArchLucid.Capabilities.Cost` | **14.75%** | 122 | `CostConstraintFindingEngine` at 0% |
| `ArchLucid.Host.Core` | **24.44%** | 12,168 | Auth handler 0%, scope provider 0% |
| `ArchLucid.Decisioning` | **22.30%** | 13,406 | Huge, complex, undertested |
| `ArchLucid.Application` | **51.41%** | 41,745 | Core orchestration; large uncovered surface |

**Security-critical 0% classes:**
- `TenantOrProjectCapabilityAuthorizationHandler` (98 uncovered lines) — controls route-level capability gating
- `HttpScopeContextProvider` (22 lines) — derives tenant/workspace/project scope from HTTP context for every authenticated request

**V1.1 target** is merged line ≥ 95%; the current merged line is 75%, 20 percentage points below target.

**Tradeoffs:** Coverage requires integration (SQL) tests for Persistence paths, which are expensive. The CI gate correctly requires `ARCHLUCID_SQL_TEST` for full regression.

**Improvements:** COR-001–COR-005 below.

---

### 2. Business Logic Correctness — 74/100 (Weight: 20%)

**Why this ranks second:** Measurable logic defects exist in production code paths. Notably:

#### 2a. Reasoning Token Cost Underreporting (P0 bug)

`AgentExecutionTraceRunLlmCostAggregator.Compute()` (line 56 in the aggregator) always passes `reasoningTokens: 0` to `ILlmCostEstimator.EstimateUsd`:

```csharp
decimal? slice = costEstimator.EstimateUsd(inTok, outTok, 0, deploymentForCost);
```

`TB-033` added `ReasoningTokenCount` to `AgentExecutionTrace` and `AgentExecutionTraceRecorder` persists it. However, the aggregator was never updated to use it. Operators running o-series or reasoning-model deployments have **systematically underreported LLM cost estimates** — the reasoning token cost portion is silently dropped.

**Impact:** Incorrect CFO-facing ROI metrics; LLM budget tracking; per-run cost estimates on the RunDetail page.

**Fix:** Pass `trace.ReasoningTokenCount ?? 0` as the third argument.

#### 2b. `GovernanceWorkflowService.PromoteAsync` — Non-Atomic State Transition (P1 bug)

In `PromoteAsync`, when targeting `prod`, the approval status is mutated and persisted **before** the promotion record is created:

```csharp
prodApprovalToMarkPromoted.Status = GovernanceApprovalStatus.Promoted;
await approvalRepo.UpdateAsync(prodApprovalToMarkPromoted, cancellationToken);  // line 331
// ... no UoW wrapping ...
await promotionRepo.CreateAsync(record, cancellationToken);  // line 334 — if this throws...
```

If `promotionRepo.CreateAsync` fails (transient SQL, timeout, constraint), the approval is permanently marked `Promoted` with no corresponding `GovernancePromotionRecord`. Subsequent attempts to use that approval will fail because its status is no longer `Approved`. This is an irrecoverable inconsistency requiring manual DB repair.

**Fix:** Wrap both operations in a `IArchLucidUnitOfWork` (which is already available via `_unitOfWorkFactory`).

#### 2c. `DecisionRuleEngine` Action Semantics Not Differentiated in Audit Trail (P2 gap)

`require`, `allow`, and `prefer` are semantically distinct actions — `require` implies a mandatory constraint, `prefer` implies a soft recommendation, `allow` is permissive. However, all three map identically to `audit.AcceptedFindingIds` with no differentiation. The audit trace cannot distinguish which action was applied, limiting operator explainability and traceability of architectural decisions.

**Tradeoff:** Changing the audit schema would require a migration. This is low risk to ship but medium effort to fix.

---

### 3. Idempotency & Concurrency Correctness — 71/100 (Weight: 15%)

#### 3a. `SubmitAgentResultAsync` Multi-Replica Race (P1)

The duplicate-result guard in `SubmitAgentResultAsync` reads `existingResults` from an in-memory snapshot loaded **before** the UoW opens:

```csharp
List<AgentResult> existingResults = detail.Results;          // loaded outside UoW
// ...
if (existingResults.Any(r => ...))                           // in-memory check
    return SubmitResultResult.BadRequest(...);
await using IArchLucidUnitOfWork uow = ...;
await resultRepository.CreateAsync(result, ...);             // actual insert
```

In a multi-replica deployment, two concurrent submissions for the same `TaskId` can both pass the in-memory guard and both reach the `CreateAsync` call. The DB-level unique index on `(RunId, TaskId)` is the only backstop, but if no such unique constraint exists, duplicates can persist.

**Evidence:** `TB-087` added a unique index on the **findings** backfill path. No equivalent evidence that `AgentResults` has a `(RunId, TaskId)` unique DB-level constraint.

**Fix:** Either re-read results inside the UoW transaction, or ensure a DB-level `UNIQUE (RunId, TaskId)` constraint exists and handle the resulting constraint violation as a 409.

#### 3b. `TB-011` (Wave B) Still Partial

The dual-replica LLM budget harness in CI and the persisted quality-gate aggregate read path remain incomplete. This means:
- LLM budget enforcement may not reconcile correctly across replicas
- Quality-gate outcomes may not be persisted for all consumer paths

---

### 4. Data Integrity & Persistence Correctness — 68/100 (Weight: 10%)

#### 4a. `PromoteAsync` Atomicity Gap (see §2b above — also a data integrity issue)

#### 4b. TB-065 and TB-068 Still Open — Non-Additive Migration Safety

`TB-065` (deploy-safety: detect non-additive column/index migrations in CI) and `TB-068` (migration rollback runbook) remain unaddressed. A non-additive DDL change (column rename, NOT NULL without default, index drop) deployed to a running system can cause data loss or downtime during rolling deploy.

#### 4c. `CrossTenantPortfolioSummaryAsync` Scope Push Without Exception Safety

```csharp
using IDisposable overrideScope = AmbientScopeContext.Push(new ScopeContext { TenantId = tenantId });
```

The `using` declaration disposes the scope override at the **block end**, but exceptions thrown by `_runDetailQueryService.GetRunDetailAsync(...)` inside the `foreach` will unwind the `using` scope correctly only if `IDisposable.Dispose` is exception-safe. If `AmbientScopeContext` uses thread-local or async-local state, an exception during tenant N's processing could bleed tenant N's context into subsequent error-handling code (structured logging, exception filters). This is a low-probability but high-impact blast-radius risk.

---

### 5. AI/Agent Output Correctness — 58/100 (Weight: 5%)

#### 5a. Adversarial Critic Posture (TB-177, P0 — in backlog)

The `CriticAgentHandler` is currently consensus-leaning (rule 8 of `CriticSystemPromptTemplate.cs`). An agent Critic that defers to prior agents' conclusions reduces the challenge value of the review step. TB-177 is already tracked at P0.

#### 5b. Reasoning Token Underreporting (see §2a above)

Directly impacts AI cost output correctness.

#### 5c. No Calibrated Confidence (TB-180 — in backlog)

Quality-gate confidence thresholds lack empirical calibration. Manifests approved with < 20 data points have the same confidence label as those with > 200. TB-180 is tracked.

---

### 6. Error Handling & Exception Propagation — 80/100 (Weight: 5%)

**Strengths:**
- Consistent `try { ... } catch { rollback; throw }` pattern in UoW-wrapped operations
- Informational-audit failures are fail-open by design (TB-001)
- `DurableAuditLogRetry.TryLogAsync` provides bounded retry without blocking workflow state

**Gap:** `LlmCompletionClient` cancellation propagation — if a `CancellationToken` is cancelled mid-LLM call, the token usage may be partially counted before the exception surfaces. This is a minor metering accuracy concern, not a correctness-blocking issue.

---

### 7. API Contract Correctness — 82/100 (Weight: 10%)

**Strengths:**
- OpenAPI snapshot contract tests (`RunDetailDtoOpenApiContractTests`) are merge-blocking
- Route/tier/policy/nav registry has CI enforcement via pre-commit hook and sponsor drift guard (TB-121 done)
- TB-113 closed (`RunDetailDto` schema drift)
- TB-106–112 addressing RunDetailPage operator fidelity — mostly done

**Gap:** The generated `ArchLucidApiClient.g.cs` (modified in git status) has no automated drift guard for the client side — changes to the OpenAPI spec that are backward-incompatible but not caught by the snapshot (e.g., semantic changes to field names) may not be flagged.

---

### 8. Null Safety & Defensive Programming — 82/100 (Weight: 20%)

**Strengths:**
- Constructor null guards (`ArgumentNullException.ThrowIfNull`) used consistently throughout services
- `string.IsNullOrWhiteSpace` guarding on all user-input strings before processing
- `TryParseRunGuid` guards against malformed run IDs before DB hits
- `ArgumentException.ThrowIfNullOrWhiteSpace` on all public service entry points

**Gaps:**
- `ResolveEnvironmentLabel()` iterates `detail.Manifest?.Services ?? []` — if `Services` itself contains nulls, a `NullReferenceException` would surface. Low probability given the domain model, but not guarded.
- `ExecutiveRoiSummaryService.BuildHistoryAsync` uses a `while(true)` loop with a break condition — if `_runDetailQueryService.ListRunSummariesKeysetAsync` never returns `hasMore == false` due to a pagination bug, this becomes an infinite loop. A max-page guard is absent.

---

## Cursor Prompts for Suggested Improvements

---

### COR-001 — Fix Reasoning Token Cost Underreporting in Cost Aggregator

**Priority:** P0 | **Size:** XS | **Backlog ID:** TB-196 (new)

**Cursor Prompt:**
```
Fix the reasoning token cost underreporting bug in `ArchLucid.AgentRuntime/` — 
`AgentExecutionTraceRunLlmCostAggregator.cs`.

The line:
  decimal? slice = costEstimator.EstimateUsd(inTok, outTok, 0, deploymentForCost);
must be changed to use `trace.ReasoningTokenCount ?? 0` as the third argument.

Also add the reasoning token sum to `promptSum`/`completionSum` tracking so the 
`AgentExecutionTraceRunLlmCostSummary` can optionally expose it. Update 
`AgentExecutionTraceRunLlmCostAggregatorTests` to cover the reasoning token path 
(create a trace with `ReasoningTokenCount = 500`, verify the USD estimate increases).

Do not change the `ILlmCostEstimator` interface — it already accepts `reasoningTokens`.
```

---

### COR-002 — Fix PromoteAsync Non-Atomic State Transition

**Priority:** P1 | **Size:** S | **Backlog ID:** TB-197 (new)

**Cursor Prompt:**
```
Fix the data integrity bug in `ArchLucid.Application/Governance/GovernanceWorkflowService.cs` —
method `PromoteAsync`.

When `targetEnvironment == GovernanceEnvironment.Prod`, the approval status is mutated to
`Promoted` and persisted BEFORE the promotion record is created, with no unit-of-work wrapper.
If `promotionRepo.CreateAsync` fails, the approval is permanently stuck in `Promoted` status
with no corresponding promotion record.

Fix: Wrap `approvalRepo.UpdateAsync(prodApprovalToMarkPromoted)` and 
`promotionRepo.CreateAsync(record)` in a single `IArchLucidUnitOfWork` using 
`_unitOfWorkFactory`. Use the same `try { ... } catch { rollback; throw }` pattern already 
present in `ActivateAsync`.

Add a unit test `GovernanceWorkflowServicePromoteAtomicityTests` that mocks 
`promotionRepo.CreateAsync` to throw and asserts the approval status is NOT changed.
```

---

### COR-003 — Add Unit Tests for CostConstraintFindingEngine (0% → ≥ 90%)

**Priority:** P1 | **Size:** S | **Backlog ID:** TB-198 (new)

**Cursor Prompt:**
```
Add comprehensive unit tests for `ArchLucid.Capabilities.Cost/CostConstraintFindingEngine.cs`
in a new file `ArchLucid.Capabilities.Cost.Tests/CostConstraintFindingEngineTests.cs`.

Cover:
1. A graph snapshot with one `CostConstraint` node where `costRisk=high` → severity `Warning`
2. A graph snapshot where `costRisk=low` → severity `Info`
3. A node with a valid `maxMonthlyCost=1000` → `MaxMonthlyCost = 1000m` in payload
4. A node with a missing/unparseable `maxMonthlyCost` → `MaxMonthlyCost = null`
5. A node with a missing `budgetName` → falls back to `node.Label`
6. An empty graph snapshot → returns empty findings list
7. A graph snapshot with multiple `CostConstraint` nodes → emits one finding per node

Ensure tests use `[Trait("Category", "Unit")]` and FluentAssertions.
```

---

### COR-004 — Add Unit Tests for TenantOrProjectCapabilityAuthorizationHandler (0% → ≥ 90%)

**Priority:** P1 | **Size:** M | **Backlog ID:** TB-199 (new)

**Cursor Prompt:**
```
Add unit tests for 
`ArchLucid.Host.Core/Authorization/TenantOrProjectCapabilityAuthorizationHandler.cs`
(currently 0% line coverage, 98 uncovered lines).

Create `ArchLucid.Host.Core.Tests/Authorization/TenantOrProjectCapabilityAuthorizationHandlerTests.cs`.

Cover:
1. User has the required capability → `context.Succeed` called
2. User lacks the capability → `context.Fail` called
3. No user identity → `context.Fail` called
4. Missing tenant claim → `context.Fail`
5. Project-scoped capability with matching project claim → `context.Succeed`
6. Project-scoped capability with mismatched project → `context.Fail`

Use `DefaultAuthorizationHandlerContext` with appropriate `ClaimsPrincipal` mocks.
Ensure tests use `[Trait("Category", "Unit")]`.
```

---

### COR-005 — Add Unit Tests for HttpScopeContextProvider (0% → ≥ 90%)

**Priority:** P1 | **Size:** S | **Backlog ID:** TB-200 (new)

**Cursor Prompt:**
```
Add unit tests for 
`ArchLucid.Host.Core/Auth/Services/HttpScopeContextProvider.cs`
(currently 0% line coverage, 22 uncovered lines).

Create `ArchLucid.Host.Core.Tests/Auth/Services/HttpScopeContextProviderTests.cs`.

Cover:
1. Authenticated request with valid tenant/workspace/project claims → correct `ScopeContext`
2. Missing tenant claim → empty or default GUID in scope
3. Missing workspace claim → default GUID
4. Unauthenticated request → empty scope or throws (per documented contract)
5. Claims with malformed GUIDs → handles gracefully without throwing

Use `DefaultHttpContext` with `ClaimsPrincipal` constructed with test claims.
Use `[Trait("Category", "Unit")]`.
```

---

### COR-006 — Add DB-Level UNIQUE Constraint on AgentResults (RunId, TaskId)

**Priority:** P1 | **Size:** S | **Backlog ID:** TB-201 (new)

**Cursor Prompt:**
```
Add a DB-level UNIQUE constraint on `dbo.AgentResults (RunId, TaskId)` to make 
`SubmitAgentResultAsync` idempotency safe in multi-replica deployments.

Steps:
1. Add a DbUp migration in `ArchLucid.Persistence/Scripts/` (next sequential number) that adds:
   `ALTER TABLE dbo.AgentResults ADD CONSTRAINT UQ_AgentResults_RunId_TaskId UNIQUE (RunId, TaskId);`
   Note: check whether `RunId` is NVARCHAR or UNIQUEIDENTIFIER — use the correct type.

2. Update the canonical DDL in `Scripts/ArchLucid.sql` to include this constraint (per 
   one-DDL-file-per-database rule).

3. Update `SubmitAgentResultAsync` in `ArchLucidApplicationService` to catch the resulting
   `SqlException` with error number 2627 (unique key violation) and return 
   `SubmitResultResult.BadRequest("A result for this task has already been submitted.")`
   instead of re-throwing.

4. Add integration test `AgentResultRepositoryDuplicateInsertIntegrationTests` (SQL-backed) 
   that asserts the constraint is enforced.
```

---

### COR-007 — Add Notification Unit Tests (2.90% → ≥ 80%)

**Priority:** P2 | **Size:** M | **Backlog ID:** TB-202 (new)

**Cursor Prompt:**
```
Create `ArchLucid.Notifications.Tests/` project (or add to existing test project) and add 
unit tests for the following zero-coverage classes in `ArchLucid.Notifications/`:

1. `SlackInteractivityVerifier` — HMAC signature verification
   - Valid signature → returns true
   - Invalid signature → returns false
   - Expired timestamp → returns false (replay protection)

2. `ChatOpsWebhookDeliveryService` — HTTP delivery
   - Successful delivery → increments success counter
   - HTTP 4xx → logs warning, does not retry
   - HTTP 5xx → retries up to configured max

3. `AuthorityRunCommittedChatOpsHook` — event handler
   - Committed run event → calls delivery service with correct payload
   - Disabled config → no delivery attempted

Use `[Trait("Category", "Unit")]` and mock `HttpClient` via `HttpMessageHandler`.
```

---

### COR-008 — Add ConversationService Unit Tests (0% → ≥ 80%)

**Priority:** P2 | **Size:** M | **Backlog ID:** TB-203 (new)

**Cursor Prompt:**
```
Add unit tests for `ArchLucid.Host.Core/Ask/ConversationService.cs` 
(currently 0% line coverage, 54 uncovered lines).

Create `ArchLucid.Host.Core.Tests/Ask/ConversationServiceTests.cs`.

Cover:
1. A new conversation → returns new session ID, empty message history
2. An existing conversation → appends user message, returns updated history
3. Asking with a null/empty message → returns validation error or empty response
4. Max-turn limit reached → truncates or compresses history per documented contract
5. Conversation not found by session ID → returns null or throws documented exception

Use mocked `IConversationRepository` (or equivalent). Use `[Trait("Category", "Unit")]`.
```

---

### COR-009 — Add DecisionRuleEngine Action Differentiation to Audit Trace

**Priority:** P2 | **Size:** S | **Backlog ID:** TB-204 (new)

**Cursor Prompt:**
```
Improve the audit trail in `ArchLucid.Decisioning/Services/RuleBasedDecisionEngine.cs`
to differentiate between `require`, `allow`, and `prefer` actions in the 
`RuleAuditTracePayload`.

Currently all three map identically to `audit.AcceptedFindingIds` — operators cannot 
distinguish a mandatory architectural constraint from a soft preference.

Steps:
1. Add `RequiredFindingIds`, `AllowedFindingIds`, `PreferredFindingIds` sets to 
   `RuleAuditTracePayload` alongside the existing `AcceptedFindingIds` (keep 
   `AcceptedFindingIds` as the union for backward compatibility with consumers).

2. In the `switch (rule.Action.ToLowerInvariant())` block, populate the new sets 
   in addition to `AcceptedFindingIds`.

3. Update the `DecisionTraceDto` / `RuleAuditTrace.From()` mapper to include these 
   new collections.

4. Add unit test `RuleBasedDecisionEngineActionDifferentiationTests` asserting 
   that `require` → `RequiredFindingIds`, `allow` → `AllowedFindingIds`, 
   `prefer` → `PreferredFindingIds`.

5. Update `dbo.DecisionTraces` Payload JSON column serialization 
   (backward-compatible — new fields are additive).
```

---

### COR-010 — Add BuildHistoryAsync Pagination Safety Guard

**Priority:** P2 | **Size:** XS | **Backlog ID:** TB-205 (new)

**Cursor Prompt:**
```
Add a max-page guard to `ExecutiveRoiSummaryService.BuildHistoryAsync` in 
`ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`.

The current implementation uses `while (true)` with a break on `!hasMore`.
If `ListRunSummariesKeysetAsync` returns `hasMore = true` indefinitely due to a 
pagination bug, this becomes an infinite loop.

Add a `const int maxPages = 500;` guard and break with a warning log when exceeded:

  int pages = 0;
  while (pages++ < maxPages)
  {
      ...
      if (!hasMore || string.IsNullOrEmpty(next)) break;
  }
  if (pages >= maxPages && logger.IsEnabled(LogLevel.Warning))
      logger.LogWarning("BuildHistoryAsync: reached page cap {MaxPages}; summary may be incomplete.", maxPages);

Apply the same fix to `BuildExportAsync` and `CollectCommittedRunsForTrendsAsync` which
have the same pattern.

Add a unit test verifying the guard prevents infinite iteration when the mock always 
returns `hasMore = true`.
```

---

### COR-011 (DEFERRED) — Complete Wave B Invariant Enforcement (TB-011)

**Priority:** P1 | **Depends On:** Owner sign-off on `Mixed` UX copy (INV-002) | **Backlog ID:** TB-011 (existing, partial)

This improvement extends existing TB-011 work. The dual-replica LLM budget harness in CI and the persisted quality-gate aggregate read path remain incomplete. **Cannot be completed** without the owner sign-off on `Mixed` mode UX copy, and the CI budget harness requires infrastructure availability.

**Owner input needed:** Please confirm the UX copy for `ExecutionMode.Mixed` (where some tasks ran real-LLM and others fell back to simulator) before engineering picks up the remaining TB-011 items.

---

### COR-012 — Add ResolveEnvironmentLabel Null Guard and Collection Safety

**Priority:** P3 | **Size:** XS | **Backlog ID:** TB-206 (new)

**Cursor Prompt:**
```
Add defensive null guards to `ExecutiveRoiSummaryService.ResolveEnvironmentLabel()` in
`ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`.

The current code:
  foreach (ManifestService service in detail.Manifest?.Services ?? [])
    foreach (string tag in service.Tags)

If `service.Tags` is null, this throws. Add a null-coalesce:
  foreach (string tag in service.Tags ?? [])

Also add a unit test covering:
  - A manifest with a service where `Tags` is null → returns "unspecified" without throwing
  - A manifest with a service where `Tags` is empty → returns "unspecified"
  - A manifest with `env:production` tag → returns "production"
```

---

## Pending Owner Questions

The following items need owner input before engineering work can begin. I will have these answers ready when you return.

| # | Question | Affects |
|---|----------|---------|
| **PQ-COR-01** | For `TB-011` (Wave B), what is the approved UX copy for `ExecutionMode.Mixed` display in the operator UI? Without this, the INV-002 UI surface cannot ship. | COR-011, TB-011 |
| **PQ-COR-02** | `SubmitAgentResultAsync`: Is there already a DB-level `UNIQUE (RunId, TaskId)` constraint on `dbo.AgentResults`? If so, COR-006 is partially done and only needs exception-handling. | COR-006 |
| **PQ-COR-03** | `DecisionRuleEngine` action semantics: Should `require`, `allow`, and `prefer` produce different downstream behavior (e.g., `require` blocks commit, `prefer` is advisory)? Or is the current same-treatment behavior intentional? This determines whether COR-009 is a schema fix or a behavior change. | COR-009 |

---

## Strengths (What Not to Break)

1. **Consistent null guard pattern** — `ArgumentNullException.ThrowIfNull` + constructor null checks across all services
2. **UoW rollback pattern** — `try { commit } catch { rollback; throw }` is consistently applied
3. **Informational audit fail-open** — TB-001 semantics are correctly implemented; audit failures do not block workflows
4. **Scope isolation** — recent TB-071–075 work closed the most critical multi-tenant blast-radius gaps
5. **OpenAPI snapshot testing** — API contract drift is caught at merge time
6. **GovernanceWaiverExpiryWindow canonicalization** — TB-149 closed the duplicate-implementation correctness bug cleanly
7. **`GovernanceDecisionsNeededSummaryCalculator`** — union cardinality (TB-150) correctly prevents double-counting

---

## Score Justification Summary

**78.75/100** reflects a system with strong defensive programming foundations and a well-understood backlog, but with measurable correctness defects that have not yet been remediated:

- The reasoning token cost underreporting bug (§2a) is a **silent, systematic monetary error**
- The governance PromoteAsync atomicity gap (§2b) is an **irrecoverable data corruption risk**
- The multi-replica result submission race (§3a) is a **correctness risk in scaled deployments**
- Test coverage below 15% in critical assemblies (cost engine, notifications, auth handler) represents **unguarded execution paths**

The score would reach ~85+ when COR-001 (reasoning tokens), COR-002 (PromoteAsync atomicity), COR-003/004/005 (critical zero-coverage paths), and COR-006 (DB unique constraint) are completed.

---

*Assessment produced: 2026-06-02. Scope: V1 / V1.1 in-contract items only. V1.1-deferred (TB-135/136 SOC 2 CPA / pen test) and V2-deferred items excluded from scoring per `Assessment-Scope-V1_1.mdc` and `V1_1-assurance-backlog.mdc`.*
