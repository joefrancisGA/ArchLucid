> **Scope:** Contributor-reference — curated `/al-bug` hunt zones. Not a buyer or operator document. Agents must not invent extra zones in the same invocation; update this file after each hunt.

# `/al-bug` hunt ledger

Curated zones covering the full product surface (API, persistence, UI, CLI, orchestration, billing, governance, auth, exports, background jobs, analyzers, pipeline engines, core libraries). The picker is `scripts/agent/al-bug-pick-zone.ps1` (explore/exploit + **impact** weight, not LLM ranking). Do **not** invent extra zones mid-hunt. Use `.\scripts\agent\al-bug-pick-zone.ps1 -Nominate` to find gaps.

**Updated:** 2026-08-17 (hypothesis quality bar: unseeded / candidate / hunt-ready / proven / invalid / valid-no-repro).

## How to use

1. Run `.\scripts\agent\al-bug-pick-zone.ps1 -Preview` (add `-Hint '…'` when the user named an area; add `-Refresh` to recompute git churn).
2. Hunt **only** the returned zone's `paths`. Treat `huntReadyHypotheses` as claims; treat `candidateHypotheses` as search lenses until a seed hunt.
3. After the hunt, edit this file (the script does **not** write it):
   - **Hit:** increment `hunts` and `bugs-found`; set `consecutive-dry-hunts` to `0`; set `last-hunt` and `last-bug` to today (`YYYY-MM-DD`); tick the hypothesis as `(proven)`.
   - **Dry:** increment `hunts` and `consecutive-dry-hunts`; set `last-hunt` to today; tick attempted hunt-ready rows as `(valid-no-repro)` or `(invalid)`. Do not invent another bug in the same files.
   - **Seed-only:** increment `hunts`; set `last-hunt`; set `status` to `open`; do **not** increment `consecutive-dry-hunts`. Promote or retire candidates. Do not refill with three harm-class templates.
   - **Reopened:** when JSON `reopened` is `true`, set `status` back to `open`.

### Zone status

| Status | Meaning |
| --- | --- |
| `unseeded` | Never read for hypotheses. Listed `[ ]` rows are **candidates**. First hunt is a seed hunt. |
| `open` | Seeded or previously hunted. Eligible for normal hunts. |
| `cooling` | Yield dropped; picker waits while any `open` or `unseeded` zone remains. |
| `exhausted` | All three exhaustion conditions hold. Reopens only on git churn. |

New zones start **`unseeded`** with zero hunt-ready rows. Do not template-seed three cross-tenant / stale-cache / fail-open one-liners.

### Hypothesis tags

Open rows:

- `[ ] (candidate) …` — harm-class or unverified template. Not hunt-ready. No picker tie-break.
- `[ ] (hunt-ready) …` — locus + input + wrong outcome + mechanism filled from **these** files.

Closed rows (never tick a miss as bare `[x]` — that counts as proven):

- `[x] (proven) …` — failing repro (this hunt or earlier).
- `[x] (invalid) …` — claim does not describe this code (missing path, wrong shape).
- `[x] (valid-no-repro) …` — claim matches this code; current behavior is correct (cite the test).

Untagged `[ ]` on `unseeded` or `hunts: 0` is treated as **candidate**. Untagged `[ ]` after the zone has been hunted is treated as **hunt-ready**. Untagged `[x]` is treated as **proven**.

A hunt-ready row must name a locus, a concrete input, an observable wrong outcome, and a mechanism. Harm-class-only rows stay `(candidate)` until the files show the prerequisite (join, cache, fail-open catch). After a miss, replacement rows must cite a **different mechanism**.

## Scoring (picker)

Time unit is **hunts**, not wall-clock minutes. Exploit zones with a short mean hunts-per-bug; explore untried / under-sampled zones so the catalog can learn.

```text
mean_hunts_per_bug = hunts / bugs when bugs > 0, else hunts + 2 (prior)
speed              = 1 / mean_hunts_per_bug
explore            = 1 / sqrt(hunts + 1)
precision          = proven / (proven + invalid) when that sum >= 2, else omitted
                     (valid-no-repro is not in the denominator)

base_score =
  6 × speed
+ 3 × explore
+ 2 × recent_churn              (min(3, commitCount since last-hunt))
+ 1 × related_PD_or_TB          (min(2, id count))
+ 0.25 × min(3, hunt-ready open hypotheses)
+ 0.5 × precision               (0 when omitted)
− 2 × consecutive_dry_hunts

score = base_score × impact_multiplier   (high ×1.40, medium ×1.00, low ×0.65)
```

Hunt-ready count is a small tie-break only. Candidate/template rows must not inflate score or lock the catalog. Precision rewards zones whose hypotheses matched the code; it does not punish valid-no-repro exhaustion.

Eligibility: `open` and `unseeded` always; `cooling` only when no `open` or `unseeded` zone remains; `exhausted` only when git shows commits on `paths` since `last-hunt`.

## Nominate mode

`.\scripts\agent\al-bug-pick-zone.ps1 -Nominate -Preview` returns the same ranked pick with `nominate: true` in JSON — use it to preview which catalog row the picker would surface next when widening coverage.

## Exhaustion (all must hold)

1. Every listed hypothesis has a passing regression test, or was retired as `(invalid)` or `(valid-no-repro)`.
2. **3 consecutive dry hunts**.
3. **No production-path commits** in that zone since `last-hunt`.

Set `status` to `cooling` when yield has dropped (for example two dry hunts) but exhaustion is not complete. Set `exhausted` only when all three conditions hold.

---
## Zone: topology-proposal-merge

- **id:** topology-proposal-merge
- **status:** open
- **impact:** medium
- **aliases:** topology merge; merge gate; graph merge
- **paths:** ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs; ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalGraphMerge.cs
- **test-filter:** FullyQualifiedName~AgentTopologyProposalMergeGateTests|FullyQualifiedName~AgentTopologyProposalGraphMergeTests
- **hunts:** 13
- **bugs-found:** 9
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** unknown

High historical yield. **Not exhausted** ΓÇö remaining hypotheses are type-family and post-processor disagreements, not the parameterized alias cases already covered.

### Hypotheses

- [x] Renamed manifest labels not aliased to inventoried graph node ids
- [x] Synthetic `svc-` / `ds-` keys vs graph SourceId
- [x] Terraform SourceId vs graph SourceId
- [x] ARM resource id with whitespace
- [x] Storage vs data category for datastore synthetic ids
- [x] Cost/compliance relationship-only edges with a rename overlay
- [x] Classic `azurerm_cdn_profile` / `cdn_endpoint` Data-category nodes omit `svc-` synthetic (only `cdn_frontdoor` was recognized)
- [ ] Merge gate keeps a relationship but graph merge drops the edge for a type family not in parameterized tests
- [ ] Duplicate node-id collision when overlay and inventoried node share SourceId but different labels
- [ ] Gate vs merge disagreement after structural post-processor strips a relationship
- [ ] Relationship-only follow-up when rename overlay is in a different agent result filtered out by inventory

---

## Zone: arm-terraform-source-ids

- **id:** arm-terraform-source-ids
- **status:** open
- **impact:** medium
- **aliases:** ARM resource ids; terraform source id; endpoint index
- **paths:** ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEdgeMapper.cs; ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEndpointIndex.cs
- **test-filter:** FullyQualifiedName~TopologyProposalRelationshipEdgeMapperTests|FullyQualifiedName~AgentTopologyProposalGraphMergeTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] ARM resource id indexed in the endpoint index but not resolved by the edge mapper ΓÇö retired (invalid on current code): tf.id / tf.resource_id already indexed and resolved; rename via ARM ServiceId already matches
- [x] Terraform SourceId claimed in merge but missing from alias resolution ΓÇö fixed: NodeMatchesService/Datastore now compare ServiceId/DatastoreId to Label (tf show JSON address-on-label shape)
- [x] Endpoint keyed by a property bag value that is not a SourceId

---

## Zone: tenant-settings-sql

- **id:** tenant-settings-sql
- **status:** open
- **impact:** high
- **aliases:** tenant settings; DefaultTenant FK
- **paths:** ArchLucid.Persistence/Tenancy/SqlTenantSettingsRepository.cs; ArchLucid.Persistence/Tenancy/CachingTenantSettingsRepository.cs
- **test-filter:** FullyQualifiedName~SqlTenantSettingsRepository
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** PD-003
- **code-changed-since:** unknown

**PD-003** (DefaultTenant FK + TenantSettings tenant-plane SQL) was Fixed on RC11/RC12 and is **not merged**. Do not treat PD-002 / TB-867 (ServiceNow wrong SQL catalog, Done) as open work in this zone.

### Hypotheses

- [x] Tenant-plane SQL still uses the host catalog or a hardcoded tenant id (retired ΓÇö `SqlTenantSettingsRepositoryConnectionFactoryContractTests` + PD-003 fix on master)
- [x] Cache wrapper returns stale miss after upsert when setting-key casing differs (`TenantSettings_TryGetAsync_refreshes_after_upsert_when_setting_key_casing_differs`)
- [x] DefaultTenant FK insert/update disagrees with the cached read path (retired ΓÇö PD-003 disposition merged on master: `ArchLucidPersistenceStartup` ApiKey DefaultTenant bootstrap + scoped `ISqlConnectionFactory`; repository uses same `tenantId` on read/write/cache keys)

---

## Zone: ui-form-validation

- **id:** ui-form-validation
- **status:** open
- **impact:** low
- **aliases:** form validation; signup form; TB-2005
- **paths:** archlucid-ui/src/components/marketing/SignupForm.tsx
- **test-filter:** SignupForm
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-16
- **last-bug:** never
- **related-pd-tb:** TB-2005
- **code-changed-since:** unknown

TB-2005 program is **Done** (2026-07-29). Hunt remaining form gaps against `docs/library/UI_DESIGN_SYSTEM.md` and `.cursor/rules/UI-Form-Validation-Affordances.mdc` (disable primary until hard client validation passes; field errors on the form; `showError` toasts only for system/async failures).

2026-08-16 dry hunt: listed hypotheses do not hold on `SignupForm`. Submit stays disabled for empty/invalid required fields; invalid keyboard submit shows inline `role="alert"` messages and does not call `showError` or fetch.

### Hypotheses

- [x] Primary submit stays enabled while required fields are empty or invalid
- [x] Validation errors appear only in a toast, not on the form
- [x] Hard client checks are skipped when the form is submitted with the keyboard

---

## Zone: commit-output-integrity

- **id:** commit-output-integrity
- **status:** open
- **impact:** medium
- **aliases:** output integrity; commit integrity
- **paths:** ArchLucid.Application/Runs/Orchestration/CommitOutputIntegrityService.cs; ArchLucid.Application/Runs/Orchestration/RealCommitAgentOutputQualityGateEvaluator.cs
- **test-filter:** FullyQualifiedName~AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests|FullyQualifiedName~RealCommitAgentOutputQualityGateEvaluatorTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** TB-2226
- **code-changed-since:** 3

### Hypotheses

- [x] Integrity check accepts a payload whose declared artifact hashes do not match committed bytes ΓÇö fixed as quality-gate mismatch: `QualityRejected` ignored when `RecordedQualityGateOutcome` was Accepted/Warned
- [x] Missing optional artifact is treated as a hash match ΓÇö retired: not applicable to commit quality-gate paths; superseded-retry trace selection was the real gap
- [x] Integrity failure is logged but commit still proceeds ΓÇö retired: inverse bug found; superseded rejected traces incorrectly blocked commit after successful auto-retry

---

## Zone: content-safety-admission

- **id:** content-safety-admission
- **status:** unseeded
- **impact:** medium
- **aliases:** content safety; admission gate; prompt injection
- **paths:** ArchLucid.Application/Runs/Orchestration/CompositeRequestContentSafetyPrecheck.cs; ArchLucid.Application/Runs/Orchestration/LlmSemanticAdmissionGate.cs; ArchLucid.Application/Runs/Orchestration/DefaultRequestContentSafetyPrecheck.cs
- **test-filter:** FullyQualifiedName~DefaultRequestContentSafetyPrecheckTests|FullyQualifiedName~LlmSemanticAdmissionGateTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Composite short-circuits to allow when one inner precheck throws
- [ ] (candidate) Semantic admission gate skips deterministic precheck failures
- [ ] (candidate) Default precheck allows an executable injection pattern covered by AgentRuntime regression tests

---

## Zone: storage-vs-data-category

- **id:** storage-vs-data-category
- **status:** open
- **impact:** medium
- **aliases:** storage vs data; structural post-processor; consistency gate
- **paths:** ArchLucid.Application/Runs/Orchestration/AgentProposalStructuralPostProcessor.cs; ArchLucid.Application/Runs/Orchestration/CrossAgentProposalConsistencyGate.cs
- **test-filter:** FullyQualifiedName~AgentProposalStructuralPostProcessorTests|FullyQualifiedName~CrossAgentProposalConsistencyGateTests
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-16
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

2026-08-16 dry hunt: listed hypotheses do not hold on `AgentProposalStructuralPostProcessor` / `CrossAgentProposalConsistencyGate`. Neither file rewrites datastore category (`storage` vs `data`); synthetic `ds-` aliases are unchanged. Existing keep-path tests (26) pass; the gate does not drop a relationship the post-processor retained under current claim/validation key unions.

### Hypotheses

- [x] Post-processor rewrites a datastore to `storage` while the consistency gate still keys it as `data`
- [x] Consistency gate drops a relationship the post-processor just added
- [x] Category rewrite does not update synthetic `ds-` aliases

---

## Zone: authority-pipeline-payload

- **id:** authority-pipeline-payload
- **status:** unseeded
- **impact:** medium
- **aliases:** authority payload; pipeline work payload
- **paths:** ArchLucid.Application/Runs/Orchestration/AuthorityPipelineWorkPayload.cs
- **test-filter:** FullyQualifiedName~AuthorityPipelineWorkPayloadJsonTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) JSON round-trip drops a required work field and the processor still dequeues
- [ ] (candidate) Unknown payload version is treated as the current contract
- [ ] (candidate) Tenant id in the payload is not the tenant used for SQL

---

## Zone: technology-ledger-merge

- **id:** technology-ledger-merge
- **status:** unseeded
- **impact:** medium
- **aliases:** technology ledger; ledger merge policy
- **paths:** ArchLucid.Application/Runs/Orchestration/TechnologyLedgerAgentProposalMergePolicy.cs
- **test-filter:** FullyQualifiedName~TechnologyLedger
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Ledger merge keeps an agent-proposed technology that the inventory already replaced
- [ ] (candidate) Duplicate technology names from two agents both survive merge
- [ ] (candidate) Merge policy ignores a seeded ledger row when the proposal uses a different casing

---

## Zone: orchestrator-transient-retry

- **id:** orchestrator-transient-retry
- **status:** open
- **impact:** medium
- **aliases:** transient retry; commit retry
- **paths:** ArchLucid.Application/Runs/Orchestration/OrchestratorTransientDbRetry.cs; ArchLucid.Application/Runs/Orchestration/CommitRunTransientRetryPolicy.cs
- **test-filter:** FullyQualifiedName~OrchestratorTransientDbRetryTests|FullyQualifiedName~CommitRunTransientRetryPolicyTests
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** 1

### Hypotheses

- [x] Retry policy retries a non-transient SQL error (constraint / timeout misclassified) ΓÇö fixed: `SqlTransientDetector` treated outer `TimeoutException` before inner non-transient `SqlException`
- [x] Commit retry exhausts attempts but still returns success to the caller ΓÇö retired: `IsExhausted` and orchestrator loop throw `ConflictException` on budget/attempt exhaustion; idempotent reconcile success is intentional
- [x] Transient retry does not include the same isolation / tenant scope on the replay ΓÇö retired: `OrchestratorTransientDbRetry` re-invokes caller lambda; scope is captured by caller closure

---

## Zone: email-otp-auth

- **id:** email-otp-auth
- **status:** open
- **impact:** high
- **aliases:** email otp; otp auth; email challenge
- **paths:** ArchLucid.Api/Controllers/Auth/EmailOtpAuthController.cs; ArchLucid.Application/Identity/EmailOtpAuthService.cs
- **test-filter:** FullyQualifiedName~EmailOtpAuthServiceTests|FullyQualifiedName~EmailOtpChallengeRepositoryConcurrencyTests
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-17
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] A consumed or expired OTP still issues a session ΓÇö retired: `VerifyCodeAsync_rejects_expired_code`, `VerifyCodeAsync_rejects_reused_code`, and `TryCompleteAsync` completion paths reject expired/already-completed challenges
- [x] Challenge lookup is not tenant-scoped and can verify another tenant's code ΓÇö retired (invalid): OTP challenges are pre-tenant and keyed by normalized email; verification requires challenge id + code hash bound to that row
- [x] Concurrent verify requests both succeed on the same one-time challenge ΓÇö retired: `EmailOtpChallengeRepositoryConcurrencyTests.TryCompleteAsync_allows_only_one_successful_completion`

---

## Zone: auth-return-path

- **id:** auth-return-path
- **status:** open
- **impact:** high
- **aliases:** return path; sign-in redirect; open redirect
- **paths:** ArchLucid.Application/Identity/AuthSignInReturnPathGuard.cs
- **test-filter:** FullyQualifiedName~AuthSignInReturnPathGuardTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] A protocol-relative or encoded external URL is accepted as an in-app return path — fixed earlier (`/%2f%2fevil.example`); regression in `TryNormalize_rejects_open_redirect_shapes`
- [x] Backslash or `@` host smuggling bypasses the leading-slash check — retired: existing `TryNormalize_rejects_open_redirect_shapes` cases cover `/\\evil`, `/path@evil`, `/%40` decode
- [x] Control characters in the return path still survive normalization — fixed: reject control chars after each percent-decode pass (`/%09//evil.example`, `/%00//evil.example`)

---

## Zone: tenant-erasure

- **id:** tenant-erasure
- **status:** unseeded
- **impact:** high
- **aliases:** tenant delete; erasure; quarantine middleware
- **paths:** ArchLucid.Application/Tenancy/TenantErasureCommandService.cs; ArchLucid.Api/Middleware/TenantErasureQuarantineMiddleware.cs
- **test-filter:** FullyQualifiedName~TenantErasure
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Erasure proceeds while a legal hold is still active
- [ ] (candidate) Quarantine middleware lets mutating requests through after erasure has started
- [ ] (candidate) Erasure command deletes another tenantΓÇÖs rows when ids collide in cache

---

## Zone: tenant-scoped-analyzer

- **id:** tenant-scoped-analyzer
- **status:** unseeded
- **impact:** high
- **aliases:** ARCH006; tenant scoped query analyzer
- **paths:** ArchLucid.Analyzers/TenantScopedQueryScopeBindingAnalyzer.cs
- **test-filter:** FullyQualifiedName~TenantScopedQueryScopeBindingAnalyzerTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Analyzer misses a Dapper QueryAsync on a tenant table with no scope binding
- [ ] (candidate) Interpolated SQL is treated as scoped when the tenant predicate is only in a comment
- [ ] (candidate) Empty exemption justification does not fire the diagnostic

---

## Zone: sql-run-repository

- **id:** sql-run-repository
- **status:** open
- **impact:** high
- **aliases:** run repository; sql run scope
- **paths:** ArchLucid.Persistence/Repositories/SqlRunRepository.cs
- **test-filter:** FullyQualifiedName~SqlRunRepositoryScopeIsolationSqlIntegrationTests
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-16
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

2026-08-16 dry hunt: listed hypotheses do not hold on `SqlRunRepository`. `SelectByScopedId` and `Update` already require `TenantId` + `WorkspaceId` + `ScopeProjectId`; `GetById_wrong_scope_returns_null_when_run_saved_under_other_tenant` covers cross-tenant get. List shapes use `RunListWarningFlagSql.ScopeWhereTail` with `r.TenantId = @TenantId` always; `WorkspaceId` is a non-nullable `Guid` (empty workspace is not a security boundary). Cross-tenant update matches 0 rows and throws. Admin/archive paths are `[TenantScopeExempt]` by catalog routing, not Layer D bleed.

### Hypotheses

- [x] Get-by-id returns a run that belongs to a different tenant
- [x] List query omits tenant predicate when workspace filter is empty
- [x] Update succeeds against a run id from another tenant in the same database

---

## Zone: finding-inspect-sql

- **id:** finding-inspect-sql
- **status:** open
- **impact:** high
- **aliases:** finding inspect; dapper inspect read
- **paths:** ArchLucid.Persistence/Findings/DapperFindingInspectReadRepository.cs; ArchLucid.Persistence/Findings/FindingInspectReadModelMapper.cs; ArchLucid.Persistence/Sql/FindingInspectReadSql.cs
- **test-filter:** FullyQualifiedName~FindingInspectReadModelMapperTests|FullyQualifiedName~FindingInspectReadSqlTests|FullyQualifiedName~FindingInspectEndpointTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Inspect read returns a finding whose tenant does not match the request scope ΓÇö fixed: main inspect + FindingRecords joins in FollowUpBatch require `fr.TenantId`/`WorkspaceId`/`ProjectId` (run-only predicates were insufficient when row tenant diverges)
- [x] Mapper drops evidence fields so inspect shows success with empty trail ΓÇö retired (invalid): mapper only parses enums; evidence is built in the repository from related nodes
- [x] Inspect query joins without tenant on the child table and leaks sibling-tenant rows ΓÇö fixed: FollowUpBatch now scopes FindingRelatedNodes / rules / actions / AuditEvents / FindingReviewEvents / RiskExceptions to TenantId+WorkspaceId+ProjectId

---

## Zone: llm-wallet

- **id:** llm-wallet
- **status:** unseeded
- **impact:** high
- **aliases:** llm wallet; tenant wallet; billing wallet
- **paths:** ArchLucid.Api/Controllers/Billing/WalletController.cs; ArchLucid.Application/Budgeting/LlmTenantWalletService.cs; ArchLucid.Persistence/Data/Repositories/SqlLlmTenantWalletRepository.cs
- **test-filter:** FullyQualifiedName~LlmTenantWalletServiceTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Debit applies to a different tenantΓÇÖs wallet when the header tenant differs from the route
- [ ] (candidate) Concurrent debits both succeed past the remaining balance
- [ ] (candidate) Wallet read returns another tenantΓÇÖs remaining credits

---

## Zone: finding-disposition

- **id:** finding-disposition
- **status:** unseeded
- **impact:** medium
- **aliases:** disposition; finding decision
- **paths:** ArchLucid.Application/Governance/FindingDisposition/FindingDispositionService.cs; ArchLucid.Application/Governance/FindingDisposition/FindingDispositionValidation.cs
- **test-filter:** FullyQualifiedName~FindingDispositionValidationTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Disposition writes succeed for a finding that belongs to another tenant
- [ ] (candidate) Validation accepts a closed finding as still actionable
- [ ] (candidate) Required rationale is skipped when the disposition kind is reject

---

## Zone: review-recurrence

- **id:** review-recurrence
- **status:** unseeded
- **impact:** low
- **aliases:** recurrence; next run calculator
- **paths:** ArchLucid.Application/Governance/ArchitectureReviewRecurrenceNextRunCalculator.cs
- **test-filter:** FullyQualifiedName~ArchitectureReviewRecurrenceNextRunCalculatorTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Next-run lands in the past so the scheduler fires immediately in a loop
- [ ] (candidate) Disabled recurrence still computes a next run
- [ ] (candidate) Time-zone conversion shifts the cadence by a day around DST

---

## Zone: alert-simulation

- **id:** alert-simulation
- **status:** open
- **impact:** high
- **aliases:** alert sim; simulation context
- **paths:** ArchLucid.Api/Controllers/Alerts/AlertSimulationController.cs; ArchLucid.Persistence/Alerts/Simulation/AlertSimulationContextProvider.cs
- **test-filter:** FullyQualifiedName~AlertSimulationContextProviderTests
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** 2

### Hypotheses

- [x] Simulation context loads findings from a tenant other than the caller ΓÇö fixed: reject run detail / findings whose scope or RunId does not match the caller
- [x] Dry-run simulation persists a real alert delivery ΓÇö retired (invalid): `RuleSimulationService` evaluates in-memory and only reads suppression state
- [ ] Missing workspace still returns 200 with another workspaceΓÇÖs rules

---

## Zone: weekly-digest-email

- **id:** weekly-digest-email
- **status:** unseeded
- **impact:** low
- **aliases:** weekly digest; executive summary email
- **paths:** ArchLucid.Application/Notifications/Email/WeeklyExecutiveSummaryEmailDispatcher.cs
- **test-filter:** FullyQualifiedName~WeeklyExecutiveSummaryJobTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Digest email includes findings from a tenant the recipient cannot access
- [ ] (candidate) Dispatcher treats a send failure as success and skips retry
- [ ] (candidate) Unsubscribed address still receives the weekly summary

---

## Zone: outbound-webhook-dry-run

- **id:** outbound-webhook-dry-run
- **status:** unseeded
- **impact:** high
- **aliases:** webhook dry run; outbound webhook
- **paths:** ArchLucid.Api/Services/OutboundWebhookDryRunService.cs; ArchLucid.Api/Controllers/Webhooks/OutboundWebhookDryRunController.cs
- **test-filter:** FullyQualifiedName~OutboundWebhookDryRunServiceTests|FullyQualifiedName~OutboundWebhookDryRunControllerTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Dry-run posts to the live customer endpoint
- [ ] (candidate) Dry-run payload includes secrets from another tenantΓÇÖs webhook config
- [ ] (candidate) Controller returns success when the dry-run service throws

---

## Zone: architecture-recommendation

- **id:** architecture-recommendation
- **status:** open
- **impact:** medium
- **aliases:** recommendation engine; alternatives
- **paths:** ArchLucid.Application/ArchitectureIntelligence/ArchitectureRecommendationEngine.cs
- **test-filter:** FullyQualifiedName~ArchitectureRecommendationAlternativesTests|FullyQualifiedName~ArchitectureRecommendationProposedChangeTests
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Recommended change targets an element that is not in the current package (retired: engine has no package element targeting)
- [x] Alternative list duplicates the primary recommendation as if it were distinct
- [ ] Engine emits a must-change when evidence only supports a suggestion

---

## Zone: extraction-router

- **id:** extraction-router
- **status:** open
- **impact:** medium
- **aliases:** extraction router; difficulty router
- **paths:** ArchLucid.Application/ArchitectureIntelligence/DifficultyBasedExtractionRouter.cs
- **test-filter:** FullyQualifiedName~DifficultyBasedExtractionRouterTests
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Hard extraction is routed to the cheap path and still treated as high fidelity
- [x] Router swallows a failed extraction and returns an empty graph as success (retired: no failure/empty-success path; placeholder Assumption on miss)
- [x] Difficulty score is computed from a different document than the one extracted (retired: Classify and Extract share the same sourceText)

---

## Zone: cli-tenant-isolation

- **id:** cli-tenant-isolation
- **status:** unseeded
- **impact:** high
- **aliases:** tenant isolation cli; negative isolation test
- **paths:** ArchLucid.Cli/Commands/TenantIsolationNegativeTestCommand.cs; ArchLucid.Cli/Commands/TenantIsolationNegativeTestRunner.cs
- **test-filter:** FullyQualifiedName~TenantIsolationNegativeTestRunnerTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Runner reports pass when a cross-tenant probe actually returned 200
- [ ] (candidate) Probe uses the victim tenantΓÇÖs token instead of the attacker token
- [ ] (candidate) Aggregator treats skipped probes as isolation successes

---

## Zone: cli-draft-new

- **id:** cli-draft-new
- **status:** unseeded
- **impact:** low
- **aliases:** draft new; cli draft
- **paths:** ArchLucid.Cli/Commands/DraftNewCommand.cs
- **test-filter:** FullyQualifiedName~DraftNewCommandCoreTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Draft is created under a tenant other than the signed-in CLI tenant
- [ ] (candidate) Command reports success when the API returned 4xx
- [ ] (candidate) Existing draft id is overwritten without confirmation

---

## Zone: cli-terraform-evidence

- **id:** cli-terraform-evidence
- **status:** unseeded
- **impact:** medium
- **aliases:** terraform evidence; deployment evidence terraform
- **paths:** ArchLucid.Cli/Commands/DeploymentEvidenceTerraformReference.cs
- **test-filter:** FullyQualifiedName~DeploymentEvidenceTerraformReferenceTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) ARM resource id is stored in the wrong Terraform attribute (name vs id)
- [ ] (candidate) Module-wrapped resource is skipped so evidence omits a live ARM id
- [ ] (candidate) Parser treats a comment containing `resource_id` as a real binding

---

## Zone: ui-runs-list

- **id:** ui-runs-list
- **status:** open
- **impact:** low
- **aliases:** reviews list; runs list client
- **paths:** archlucid-ui/src/app/(operator)/architecture/reviews/RunsListClient.tsx
- **test-filter:** RunsListClient
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-17
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] List renders reviews from a workspace the operator is not scoped to (retired: no workspace field on RunSummary; cross-project rows are intentional hub scope listing)
- [x] Failed load still shows a previous tenantΓÇÖs cached rows (retired: props-only client; loader clears runs and Sets loadFailure; list not mounted when hubLoadOk is false)
- [x] Empty state is skipped so a spinner never ends after a 403 (retired: no spinner in RunsListClient; 403 surfaces OperatorApiProblem upstream)

---

## Zone: ui-auth-callback

- **id:** ui-auth-callback
- **status:** open
- **impact:** low
- **aliases:** auth callback; access panel
- **paths:** archlucid-ui/src/app/(operator)/auth/callback/AuthCallbackAccessPanel.tsx
- **test-filter:** AuthCallbackAccessPanel
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-17
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

2026-08-17 dry hunt: listed hypotheses do not hold on `AuthCallbackAccessPanel`. Denial keeps `AUTH_CALLBACK_ACCESS_HEADING` + `technicalDetail` (success title only after 2xx access-request submit as ΓÇ£Access request sentΓÇ¥). Recovery links are only `/auth/signin` (no operator-shell href). Panel is props-only (no `useSearchParams` / react-query / email-otp session); error strings are fixed copy and do not interpolate emails. Existing `AuthCallbackAccessPanel` + `CallbackClient` tests (6) pass.

### Hypotheses

- [x] Access-denied technical detail is shown as a successful sign-in (retired: denial heading + detail until access-request 2xx; success copy is request-sent, not signed-in)
- [x] Callback continues into the operator shell when the grant is missing (retired: panel only links to `/auth/signin`; no `window.location` / operator routes)
- [x] Error copy includes another userΓÇÖs email from a leftover query cache (retired: no query/session read; duplicate/submit errors are fixed strings)

---

## Zone: ui-help-docs

- **id:** ui-help-docs
- **status:** open
- **impact:** low
- **aliases:** help docs; help client
- **paths:** archlucid-ui/src/app/(operator)/help/HelpDocsClient.tsx
- **test-filter:** HelpDocsClient
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Topic markdown fetch follows an external URL instead of the in-app help route (retired: fetchHelpTopicMarkdown uses `/api/help/{slug}`)
- [x] Missing topic is rendered as a GitHub blob link (retired: not-found ΓåÆ `/help`; doc-index has no github blob URLs)
- [x] Index lists topics the current role is not allowed to open (fixed: generate_doc_index no longer bleeds internal-runbook titles onto public slugs)

---

## Zone: ui-webhooks-settings

- **id:** ui-webhooks-settings
- **status:** open
- **impact:** medium
- **aliases:** webhooks settings; outbound webhook ui
- **paths:** archlucid-ui/src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx
- **test-filter:** WebhooksSettings
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Signing secret from a previous workspace remains visible after scope switch
- [x] Save succeeds in the UI when the API returned 403 (retired: create throws on !ok; success callout only after await)
- [x] Dry-run control posts to the live endpoint from the settings form (retired: no dry-run on create form; Send test uses /test)

---

## Zone: ui-host-gate

- **id:** ui-host-gate
- **status:** open
- **impact:** medium
- **aliases:** host gate; split site host
- **paths:** archlucid-ui/src/lib/host-gate.ts
- **test-filter:** host-gate
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** 29

### Hypotheses

- [ ] Operator path is treated as marketing on the public host (or the reverse)
- [ ] Retired bookmark is not redirected and 404s instead of the shim
- [x] Split-site origin check allows the operator app origin as a public page ΓÇö fixed: `normalizeRequestHost` no longer strips ports; request Host must match `URL.host` from configured origins (localhost:3000 vs :3001)

---

## Zone: ui-architecture-intelligence

- **id:** ui-architecture-intelligence
- **status:** open
- **impact:** medium
- **aliases:** architecture intelligence page; ai page client
- **paths:** archlucid-ui/src/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePageClient.tsx
- **test-filter:** ArchitectureIntelligencePageClient
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** 15

### Hypotheses

- [x] Page shows recommendations for a package outside the current workspace ΓÇö fixed: clear `runState` when inbound `runId` changes
- [x] Stale query data from the previous tenant remains after scope switch ΓÇö fixed: reset intake + reasoning on operator scope key change
- [ ] Error state is omitted so a failed load looks like an empty architecture

---

## Zone: scim-users

- **id:** scim-users
- **status:** unseeded
- **impact:** high
- **aliases:** scim; entra provisioning users
- **paths:** ArchLucid.Api/Controllers/Scim/ScimUsersController.cs
- **test-filter:** FullyQualifiedName~ScimUsers
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) PATCH/DELETE affects a user in another tenant when externalId collides
- [ ] (candidate) Filter query returns users outside the provisioning tenant
- [ ] (candidate) Create succeeds without mapping the user into the callerΓÇÖs tenant

---

## Zone: identity-provider-config

- **id:** identity-provider-config
- **status:** unseeded
- **impact:** high
- **aliases:** identity provider; idp activation
- **paths:** ArchLucid.Api/Controllers/Admin/IdentityProviderConfigurationController.cs; ArchLucid.Api/Services/Admin/IdentityProviderActivationService.cs
- **test-filter:** FullyQualifiedName~IdentityProviderActivationServiceTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Activation writes IdP settings onto a tenant the admin does not own
- [ ] (candidate) Disable still leaves the previous client secret usable
- [ ] (candidate) Config GET returns another tenantΓÇÖs client id

---

## Zone: worker-host

- **id:** worker-host
- **status:** unseeded
- **impact:** low
- **aliases:** worker program; worker host startup
- **paths:** ArchLucid.Worker/Program.cs
- **test-filter:** FullyQualifiedName~WorkerHostStartupTests|FullyQualifiedName~WorkerCompositionTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Worker host starts without a tenant-scope constraint on background jobs
- [ ] (candidate) Composition registers a singleton that caches the first requestΓÇÖs tenant
- [ ] (candidate) Startup succeeds when a required hosted service failed to resolve
---

## Zone: billing-webhooks

- **id:** billing-webhooks
- **status:** unseeded
- **impact:** high
- **aliases:** stripe webhook; marketplace webhook; billing webhook replay
- **paths:** ArchLucid.Api/Controllers/Billing/BillingStripeWebhookController.cs; ArchLucid.Api/Controllers/Billing/BillingMarketplaceWebhookController.cs; ArchLucid.Application/Budgeting/LlmTenantWalletStripeWebhookProcessor.cs; ArchLucid.Persistence/Billing/MemoryCacheBillingWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~BillingStripeWebhook|FullyQualifiedName~BillingMarketplaceWebhook|FullyQualifiedName~LlmTenantWalletStripeWebhook|FullyQualifiedName~MemoryCacheBillingWebhookReplayGuard
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Replay guard accepts the same Stripe event id twice under concurrent delivery
- [ ] (candidate) Marketplace webhook credits a tenant that does not match the subscription payload
- [ ] (candidate) Invalid signature still returns 2xx so the provider stops retrying

---

## Zone: api-key-auth

- **id:** api-key-auth
- **status:** unseeded
- **impact:** high
- **aliases:** API key auth; admin API key settings
- **paths:** ArchLucid.Api/Authentication/ApiKeyAuthenticationHandler.cs; ArchLucid.Api/Services/Admin/AdminApiKeySettingsService.cs; ArchLucid.Api/Controllers/Admin/AdminApiKeySettingsController.cs
- **test-filter:** FullyQualifiedName~ApiKeyAuthentication|FullyQualifiedName~AdminApiKeySettings
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Revoked API key still authenticates until process restart
- [ ] (candidate) Admin can read or rotate another tenantâ€™s API key settings
- [ ] (candidate) Missing or malformed key header is treated as an authenticated principal

---

## Zone: scope-binding-middleware

- **id:** scope-binding-middleware
- **status:** unseeded
- **impact:** high
- **aliases:** scope binding; tenant scope middleware; route tenant filter
- **paths:** ArchLucid.Api/Middleware/ScopeIdentityBindingMiddleware.cs; ArchLucid.Api/Middleware/ScopeResolutionGuardMiddleware.cs; ArchLucid.Api/Security/RouteTenantScopeBindingFilter.cs
- **test-filter:** FullyQualifiedName~ScopeIdentityBinding|FullyQualifiedName~ScopeResolutionGuard|FullyQualifiedName~RouteTenantScopeBinding
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Route filter binds scope from the body while the URL names a different tenant
- [ ] (candidate) Middleware lets a mutating request through when scope resolution fails open
- [ ] (candidate) Workspace id from the route is not propagated to the scope context provider

---

## Zone: saml-jwt-bearer

- **id:** saml-jwt-bearer
- **status:** unseeded
- **impact:** high
- **aliases:** SAML; trial JWT; SCIM bearer; OIDC auth stack
- **paths:** ArchLucid.Api/Auth/; ArchLucid.Core/Auth/Saml/
- **test-filter:** FullyQualifiedName~Saml|FullyQualifiedName~LocalTrialJwt|FullyQualifiedName~ScimBearer
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) SAML metadata parser accepts an entity id that does not match the configured IdP
- [ ] (candidate) Trial JWT is accepted after the trial window has expired
- [ ] (candidate) SCIM bearer token for tenant A authorizes provisioning writes for tenant B

---

## Zone: tenant-data-export

- **id:** tenant-data-export
- **status:** open
- **impact:** high
- **aliases:** tenant export; run export; export SSRF
- **paths:** ArchLucid.Application/Exports/; ArchLucid.Api/Controllers/Authority/ExportsController.cs; ArchLucid.Api/Controllers/Authority/ArchitectureExportController.cs; ArchLucid.Api/Controllers/Authority/RunsExportController.cs; ArchLucid.Core/Security/AllowedRunExportBlobDestinationUrlPolicy.cs
- **test-filter:** FullyQualifiedName~ArchitectureReviewExport|FullyQualifiedName~ExportsController|FullyQualifiedName~AllowedRunExportBlobDestinationUrlPolicy
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17 — export record lookup by id bypassed run scope
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Export includes runs or findings from a workspace outside the caller scope — fixed: `ExportsController` binds export records to scoped `GetRunDetailAsync` before read/compare/replay
- [x] Blob destination URL policy allows an internal/metadata endpoint (SSRF) — retired: decimal/link-local literals rejected; Azure blob host + DNS resolve guard
- [x] Export succeeds when the run is still in progress and returns partial or stale bytes — retired: export paths require committed manifest via scoped run detail loaders

---

## Zone: host-core-jobs

- **id:** host-core-jobs
- **status:** open
- **impact:** medium
- **aliases:** background jobs; hosted services; durable job queue
- **paths:** ArchLucid.Host.Core/Jobs/; ArchLucid.Host.Core/Hosted/
- **test-filter:** FullyQualifiedName~ArchLucidJob|FullyQualifiedName~BackgroundJob|FullyQualifiedName~Hosted
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17 — watchdog reclaimed Running jobs before queue visibility expired (10m vs 15m default)
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [ ] Job dequeue runs work without re-binding tenant scope from the job payload
- [x] Leader-elected hosted service runs the same outbox drain on every replica — retired: intentional when `HostLeaderElection:Enabled` is false; default is enabled
- [x] Stuck-running watchdog marks a healthy job failed and it is retried into duplicate side effects — fixed stale threshold to exceed processor visibility (2026-08-17)

---

## Zone: itsm-inbound-webhooks

- **id:** itsm-inbound-webhooks
- **status:** unseeded
- **impact:** high
- **aliases:** ITSM webhook; ServiceNow inbound; connector secret
- **paths:** ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs; ArchLucid.Application/Integrations/Itsm/; ArchLucid.Persistence/Integrations/MemoryCacheItsmInboundWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~ItsmInboundWebhook
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Webhook accepted when the shared secret does not match the connector config
- [ ] (candidate) Replay guard allows duplicate delivery of the same event id
- [ ] (candidate) Inbound payload is applied to a tenant inferred from the body instead of the authenticated connector

---

## Zone: ui-auth-proxy

- **id:** ui-auth-proxy
- **status:** unseeded
- **impact:** high
- **aliases:** UI auth; API proxy; edge proxy
- **paths:** archlucid-ui/src/lib/auth/; archlucid-ui/src/app/api/proxy/; archlucid-ui/src/proxy.ts
- **test-filter:** lib/auth|proxy-route|proxy.ts
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Proxy forwards operator cookies or auth headers to a marketing-only upstream path
- [ ] (candidate) Return-destination helper accepts an external URL that bypasses host-gate
- [ ] (candidate) Anonymous marketing proxy path can reach a mutating operator API route

---

## Zone: security-analyzers

- **id:** security-analyzers
- **status:** unseeded
- **impact:** high
- **aliases:** require authorization analyzer; tenant identity boundary; mutating controller audit
- **paths:** ArchLucid.Analyzers/RequireAuthorizationAnalyzer.cs; ArchLucid.Analyzers/TenantIdentityBoundaryAnalyzer.cs; ArchLucid.Analyzers/MutatingControllerAuditAnalyzer.cs
- **test-filter:** FullyQualifiedName~RequireAuthorizationAnalyzer|FullyQualifiedName~TenantIdentityBoundaryAnalyzer|FullyQualifiedName~MutatingControllerAuditAnalyzer
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Mutating controller without `[Authorize]` does not fire `RequireAuthorizationAnalyzer`
- [ ] (candidate) Cross-tenant repository call with only workspace id in scope passes `TenantIdentityBoundaryAnalyzer`
- [ ] (candidate) Controller action mutates state without audit attribute and analyzer stays silent

---

## Zone: agent-runtime-safety

- **id:** agent-runtime-safety
- **status:** unseeded
- **impact:** high
- **aliases:** content safety guard; prompt injection sanitizer; agent evidence untrusted input
- **paths:** ArchLucid.AgentRuntime/Safety/; ArchLucid.AgentRuntime/PromptInjection/
- **test-filter:** FullyQualifiedName~AzureContentSafetyGuard|FullyQualifiedName~AgentEvidenceUntrustedInputSanitizer|FullyQualifiedName~PromptInjection
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Content safety guard maps a blocked category to allow on SDK failure
- [ ] (candidate) Untrusted evidence delimiter is stripped so injection payload reaches the model prompt
- [ ] (candidate) Sanitizer runs after the prompt is assembled instead of before

---

## Zone: application-analysis

- **id:** application-analysis
- **status:** unseeded
- **impact:** medium
- **aliases:** architecture analysis; compare quality delta
- **paths:** ArchLucid.Application/Analysis/
- **test-filter:** FullyQualifiedName~ArchitectureAnalysis|FullyQualifiedName~CompareQuality
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Analysis compares runs from different tenants when scope keys collide
- [ ] (candidate) Quality delta treats a failed run as higher quality than a succeeded run
- [ ] (candidate) Compare summary omits a blocking finding that exists in the source run

---

## Zone: application-billing-logic

- **id:** application-billing-logic
- **status:** unseeded
- **impact:** high
- **aliases:** marketplace billing; checkout mutation; billing application layer
- **paths:** ArchLucid.Application/Billing/
- **test-filter:** FullyQualifiedName~Marketplace|FullyQualifiedName~BillingCheckout
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Marketplace mutation handler applies a subscription change to the wrong tenant
- [ ] (candidate) Checkout session is created without binding the caller tenant id
- [ ] (candidate) Idempotent replay of a billing event double-applies seat or credit changes

---

## Zone: application-pilots

- **id:** application-pilots
- **status:** unseeded
- **impact:** medium
- **aliases:** buyer proof pack; board pack; pilot artifacts
- **paths:** ArchLucid.Application/Pilots/
- **test-filter:** FullyQualifiedName~BuyerProofPack|FullyQualifiedName~BoardPack
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Proof pack includes findings from a workspace outside the pilot scope
- [ ] (candidate) PDF builder silently drops a section when source data is missing
- [ ] (candidate) Pack builder uses cached tenant data after a scope switch

---

## Zone: agent-runtime-evaluation

- **id:** agent-runtime-evaluation
- **status:** unseeded
- **impact:** medium
- **aliases:** agent evaluation; evaluation runner
- **paths:** ArchLucid.AgentRuntime/Evaluation/
- **test-filter:** FullyQualifiedName~Evaluation
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Evaluation runner scores a failed trace as passed
- [ ] (candidate) Runner uses a golden fixture from a different tenantâ€™s catalog
- [ ] (candidate) Batch evaluation swallows per-item failures and reports aggregate success

---

## Zone: decisioning

- **id:** decisioning
- **status:** unseeded
- **impact:** medium
- **aliases:** decisioning engine; findings merge; advisory alerts
- **paths:** ArchLucid.Decisioning/
- **test-filter:** FullyQualifiedName~Decisioning|FullyQualifiedName~FindingsMerge
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Merge keeps conflicting findings from two agents without deduplication
- [ ] (candidate) Advisory alert fires for a finding outside the run scope
- [ ] (candidate) Compliance gate passes when required evidence nodes are absent

---

## Zone: persistence-identity

- **id:** persistence-identity
- **status:** unseeded
- **impact:** high
- **aliases:** identity repository; authentication identity dapper
- **paths:** ArchLucid.Persistence/Identity/
- **test-filter:** FullyQualifiedName~AuthenticationIdentity|FullyQualifiedName~IdentityRepository
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Identity lookup by email returns a user from another tenant
- [ ] (candidate) Link/unlink writes succeed without scoping to the caller tenant
- [ ] (candidate) Cached identity read returns stale data after a tenant-scoped upsert

---

## Zone: retrieval

- **id:** retrieval
- **status:** unseeded
- **impact:** medium
- **aliases:** retrieval indexing; embedding; pricing retrieval
- **paths:** ArchLucid.Retrieval/
- **test-filter:** FullyQualifiedName~Retrieval|FullyQualifiedName~Indexing
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Index query returns chunks from another tenantâ€™s corpus
- [ ] (candidate) Pricing estimate uses the wrong model tariff for the tenant plan
- [ ] (candidate) Reindex job deletes vectors for the wrong workspace

---

## Zone: ui-oidc

- **id:** ui-oidc
- **status:** unseeded
- **impact:** high
- **aliases:** oidc authority; sign-in routing; OIDC host
- **paths:** archlucid-ui/src/lib/oidc/
- **test-filter:** oidc-authority|oidc
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Authority host check accepts a look-alike domain as the configured issuer
- [ ] (candidate) OIDC redirect builds a return URL that leaves the operator origin
- [ ] (candidate) Silent renew uses a stale authority after tenant IdP switch

---

## Zone: archlucid-core

- **id:** archlucid-core
- **status:** unseeded
- **impact:** high
- **aliases:** core domain; security policies; tenancy models
- **paths:** ArchLucid.Core/
- **test-filter:** FullyQualifiedName~ArchLucid.Core
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) URL allow-list policy accepts a credential-bearing redirect target
- [ ] (candidate) Tenant scope model treats empty workspace as a wildcard
- [ ] (candidate) Configuration default enables a production-unsafe integration flag

---

## Zone: archlucid-contracts

- **id:** archlucid-contracts
- **status:** unseeded
- **impact:** low
- **aliases:** API contracts; DTO serialization; OpenAPI models
- **paths:** ArchLucid.Contracts/
- **test-filter:** FullyQualifiedName~Contracts
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) JSON round-trip drops a required field on a versioned request DTO
- [ ] (candidate) Enum serialization accepts an out-of-range value as the default variant
- [ ] (candidate) Contract change breaks backward compatibility without a version bump signal

---

## Zone: context-ingestion

- **id:** context-ingestion
- **status:** unseeded
- **impact:** medium
- **aliases:** context ingestion; connector stages; canonicalization
- **paths:** ArchLucid.ContextIngestion/
- **test-filter:** FullyQualifiedName~ContextIngestion|FullyQualifiedName~Canonicalization
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Canonicalization drops tenant id from ingested connector payload
- [ ] (candidate) Stage pipeline continues after a failed validation with partial graph
- [ ] (candidate) Duplicate external keys from two tenants collapse into one node

---

## Zone: knowledge-graph-provenance

- **id:** knowledge-graph-provenance
- **status:** unseeded
- **impact:** medium
- **aliases:** knowledge graph; provenance; lineage
- **paths:** ArchLucid.KnowledgeGraph/; ArchLucid.Provenance/
- **test-filter:** FullyQualifiedName~KnowledgeGraph|FullyQualifiedName~Provenance
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Graph merge links a node to provenance from another tenant
- [ ] (candidate) Lineage query traverses into a sibling tenantâ€™s artifact store
- [ ] (candidate) Provenance record is written without workspace scope

---

## Zone: notifications-pipeline

- **id:** notifications-pipeline
- **status:** unseeded
- **impact:** medium
- **aliases:** notifications; email dispatchers beyond weekly summary
- **paths:** ArchLucid.Notifications/; ArchLucid.Application/Notifications/
- **test-filter:** FullyQualifiedName~Notifications|FullyQualifiedName~EmailDispatcher
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Dispatcher sends to recipients outside the tenant membership list
- [ ] (candidate) Template render includes another userâ€™s email in the body
- [ ] (candidate) Send failure is treated as success and suppresses retry

---

## Zone: artifact-synthesis

- **id:** artifact-synthesis
- **status:** unseeded
- **impact:** medium
- **aliases:** artifact synthesis; docx generator; packaging sanitization
- **paths:** ArchLucid.ArtifactSynthesis/
- **test-filter:** FullyQualifiedName~ArtifactSynthesis|FullyQualifiedName~Docx
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Generated document embeds unsanitized user HTML/script
- [ ] (candidate) Packager includes artifacts from a run outside the requested scope
- [ ] (candidate) Validation passes when required manifest hash is missing

---

## Zone: host-composition

- **id:** host-composition
- **status:** unseeded
- **impact:** medium
- **aliases:** host composition; DI registration; startup modules
- **paths:** ArchLucid.Host.Composition/
- **test-filter:** FullyQualifiedName~Host.Composition|FullyQualifiedName~ServiceCollectionExtensions
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Singleton service caches the first request tenant for the process lifetime
- [ ] (candidate) Optional security service is not registered in production configuration
- [ ] (candidate) Composition registers two implementations for the same tenant-scoped interface

---

## Zone: cloud-extractors

- **id:** cloud-extractors
- **status:** unseeded
- **impact:** high
- **aliases:** aws extractor; gcp extractor; azure extractor
- **paths:** ArchLucid.Integrations.AwsExtractor/; ArchLucid.Integrations.GcpExtractor/; ArchLucid.Integrations.AzureExtractor/
- **test-filter:** FullyQualifiedName~AwsExtractor|FullyQualifiedName~GcpExtractor|FullyQualifiedName~AzureExtractor
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Extractor pulls resources using credentials from another tenantâ€™s connector
- [ ] (candidate) ARM/resource id mapping drops subscription scope and mis-attributes resources
- [ ] (candidate) Extractor treats a parse warning as success with an empty inventory

---

## Zone: api-authority-admin-controllers

- **id:** api-authority-admin-controllers
- **status:** open
- **impact:** high
- **aliases:** authority controllers; admin controllers
- **paths:** ArchLucid.Api/Controllers/Authority/; ArchLucid.Api/Controllers/Admin/
- **test-filter:** FullyQualifiedName~AuthorityController|FullyQualifiedName~AdminController
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17 — ComparisonsController IDOR: comparison/export history loaded by id without run scope
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [ ] Admin mutating endpoint lacks tenant binding on route parameters
- [x] Authority read returns artifacts for a run in another workspace — fixed ComparisonsController scoped load (2026-08-17)
- [ ] Controller accepts a scope header that overrides the authenticated tenant

---

## Zone: api-governance-tenancy-controllers

- **id:** api-governance-tenancy-controllers
- **status:** unseeded
- **impact:** high
- **aliases:** governance controllers; tenancy controllers
- **paths:** ArchLucid.Api/Controllers/Governance/; ArchLucid.Api/Controllers/Tenancy/
- **test-filter:** FullyQualifiedName~GovernanceController|FullyQualifiedName~TenancyController
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Governance write succeeds for a policy pack owned by another tenant
- [ ] (candidate) Tenancy suspend endpoint affects a tenant id from the body not the principal
- [ ] (candidate) List endpoint omits tenant predicate when workspace filter is empty

---

## Zone: application-agents

- **id:** application-agents
- **status:** unseeded
- **impact:** medium
- **aliases:** application agents; agent handlers wiring
- **paths:** ArchLucid.Application/Agents/
- **test-filter:** FullyQualifiedName~Application.Agents
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Agent invocation uses a default tenant when scope is missing
- [ ] (candidate) Handler result is cached across tenants with the same run id
- [ ] (candidate) Agent registry resolves a handler without checking feature flags per tenant

---

## Zone: application-governance-policy

- **id:** application-governance-policy
- **status:** unseeded
- **impact:** medium
- **aliases:** policy packs; governance coverage; before-after diff
- **paths:** ArchLucid.Application/Governance/
- **test-filter:** FullyQualifiedName~PolicyPack|FullyQualifiedName~Governance
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Policy pack diff includes rules from a seeded pack in another tenant
- [ ] (candidate) Coverage calculator counts a waived finding as still open
- [ ] (candidate) Default policy pack activation skips required approval metadata

---

## Zone: application-tenancy-lifecycle

- **id:** application-tenancy-lifecycle
- **status:** unseeded
- **impact:** high
- **aliases:** tenant suspend; tenant migration; trial bootstrap
- **paths:** ArchLucid.Application/Tenancy/
- **test-filter:** FullyQualifiedName~Tenancy|FullyQualifiedName~TenantSuspend|FullyQualifiedName~TenantMigration
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Suspend leaves mutating API paths active for the tenant
- [ ] (candidate) Migration copies rows without rewriting tenant id on child tables
- [ ] (candidate) Trial bootstrap creates resources under a host catalog tenant id

---

## Zone: host-core-coordination

- **id:** host-core-coordination
- **status:** unseeded
- **impact:** medium
- **aliases:** host coordination; export outbox; backfill
- **paths:** ArchLucid.Host.Core/Coordination/
- **test-filter:** FullyQualifiedName~Coordination|FullyQualifiedName~OutboxProcessor
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Outbox processor pushes export blobs to a destination for the wrong tenant
- [ ] (candidate) Backfill job replays events without idempotency keys
- [ ] (candidate) Coordination lease is not released and blocks all replicas

---

## Zone: ui-operator-routes

- **id:** ui-operator-routes
- **status:** unseeded
- **impact:** medium
- **aliases:** operator shell routes; operator pages
- **paths:** archlucid-ui/src/app/(operator)/
- **test-filter:** operator
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Page fetches data without forwarding the active workspace scope
- [ ] (candidate) Stale react-query cache shows the previous tenant after scope switch
- [ ] (candidate) Error boundary hides a 403 and renders an empty success state

---

## Zone: ui-marketing-surfaces

- **id:** ui-marketing-surfaces
- **status:** unseeded
- **impact:** low
- **aliases:** marketing pages; pricing; trust center UI
- **paths:** archlucid-ui/src/app/(marketing)/
- **test-filter:** marketing
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Marketing form submits PII to the wrong API environment
- [ ] (candidate) Pricing page shows an internal-only plan tier to anonymous visitors
- [ ] (candidate) Trust center link resolves to a non-public document slug

---

## Zone: capabilities-cost-mcp

- **id:** capabilities-cost-mcp
- **status:** unseeded
- **impact:** medium
- **aliases:** capabilities cost; MCP server; cost estimation
- **paths:** ArchLucid.Capabilities.Cost/; ArchLucid.Mcp/
- **test-filter:** FullyQualifiedName~Capabilities.Cost|FullyQualifiedName~Mcp
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Cost estimate uses list price when tenant has a negotiated discount
- [ ] (candidate) MCP tool invocation lacks tenant scope binding
- [ ] (candidate) Cost module returns zero for an unknown SKU instead of failing closed

---

## Zone: ui-operator-lib

- **id:** ui-operator-lib
- **status:** unseeded
- **impact:** medium
- **aliases:** operator lib; operator scope; operator API client
- **paths:** archlucid-ui/src/lib/operator/
- **test-filter:** lib/operator
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (candidate) Operator API helper omits workspace scope on mutating requests
- [ ] (candidate) Cached operator context survives a tenant switch without invalidation
- [ ] (candidate) Error mapper surfaces another tenant’s problem detail in the toast
