> **Scope:** Contributor-reference â€” curated `/al-bug` hunt zones. Not a buyer or operator document. Agents must not invent extra zones in the same invocation; update this file after each hunt.

# `/al-bug` hunt ledger

Curated zones covering the full product surface (API, persistence, UI, CLI, orchestration, billing, governance, auth, exports, background jobs, analyzers, pipeline engines, core libraries). The picker is `scripts/agent/al-bug-pick-zone.ps1` (explore/exploit + **impact** weight, not LLM ranking). Do **not** invent extra zones mid-hunt. Use `.\scripts\agent\al-bug-pick-zone.ps1 -Nominate` to find gaps.

**Updated:** 2026-08-17 (hypothesis quality bar: unseeded / candidate / hunt-ready / proven / invalid / valid-no-repro).

## How to use

1. Run `.\scripts\agent\al-bug-pick-zone.ps1 -Preview` (add `-Hint 'â€¦'` when the user named an area; add `-Refresh` to recompute git churn).
2. Hunt **only** the returned zone's `paths`. Treat `huntReadyHypotheses` as claims; treat `candidateHypotheses` as search lenses until a seed hunt.
3. After the hunt, edit this file (the script does **not** write it):
   - **Hit:** increment `hunts` and `bugs-found`; set `consecutive-dry-hunts` to `0`; set `last-hunt` and `last-bug` to today (`YYYY-MM-DD`); tick the hypothesis as `(proven)`.
   - **Dry:** increment `hunts` and `consecutive-dry-hunts`; set `last-hunt` to today; tick attempted hunt-ready rows as `(valid-no-repro)` or `(invalid)`. Do not invent another bug in the same files.
   - **Seed-only:** increment `hunts`; set `last-hunt`; set `status` to `open`; do **not** increment `consecutive-dry-hunts`. Promote or retire candidates. Do not refill with three harm-class templates.
   - **Reopened:** when JSON `reopened` is `true`, set `status` back to `open`.
4. Record the outcome and print rolling 24h yield: `.\scripts\agent\al-bug-rolling-stats.ps1 -RecordHunt -HuntZoneId '<id>' -HuntOutcome hit|dry|seed-only -Rolling24h`. Commit `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` with the ledger update.

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

- `[ ] (candidate) â€¦` â€” harm-class or unverified template. Not hunt-ready. No picker tie-break.
- `[ ] (hunt-ready) â€¦` â€” locus + input + wrong outcome + mechanism filled from **these** files.

Closed rows (never tick a miss as bare `[x]` â€” that counts as proven):

- `[x] (proven) â€¦` â€” failing repro (this hunt or earlier).
- `[x] (invalid) â€¦` â€” claim does not describe this code (missing path, wrong shape).
- `[x] (valid-no-repro) â€¦` â€” claim matches this code; current behavior is correct (cite the test).

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
  6 Ã— speed
+ 3 Ã— explore
+ 2 Ã— recent_churn              (min(3, commitCount since last-hunt))
+ 1 Ã— related_PD_or_TB          (min(2, id count))
+ 0.25 Ã— min(3, hunt-ready open hypotheses)
+ 0.5 Ã— precision               (0 when omitted)
âˆ’ 2 Ã— consecutive_dry_hunts

score = base_score Ã— impact_multiplier   (high Ã—1.40, medium Ã—1.00, low Ã—0.65)
```

Hunt-ready count is a small tie-break only. Candidate/template rows must not inflate score or lock the catalog. Precision rewards zones whose hypotheses matched the code; it does not punish valid-no-repro exhaustion.

Eligibility: `open` and `unseeded` always; `cooling` only when no `open` or `unseeded` zone remains; `exhausted` only when git shows commits on `paths` since `last-hunt`.

## Nominate mode

`.\scripts\agent\al-bug-pick-zone.ps1 -Nominate -Preview` returns the same ranked pick with `nominate: true` in JSON â€” use it to preview which catalog row the picker would surface next when widening coverage.

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

High historical yield. **Not exhausted** Î“Ã‡Ã¶ remaining hypotheses are type-family and post-processor disagreements, not the parameterized alias cases already covered.

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
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] ARM resource id indexed in the endpoint index but not resolved by the edge mapper â€” retired (invalid on current code): tf.id / tf.resource_id already indexed and resolved; rename via ARM ServiceId already matches
- [x] Terraform SourceId claimed in merge but missing from alias resolution â€” fixed: NodeMatchesService/Datastore now compare ServiceId/DatastoreId to Label (tf show JSON address-on-label shape)
- [x] Endpoint keyed by a property bag value that is not a SourceId
- [ ] (candidate) New Terraform resource type missing from `LooksLikeTerraformDatastoreSourceId` / `LooksLikeTerraformServiceSourceId` drops synthetic endpoint keys on category-mismatched nodes â€” promote via seed hunt when ARM catalog churns

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

- [x] Tenant-plane SQL still uses the host catalog or a hardcoded tenant id (retired Î“Ã‡Ã¶ `SqlTenantSettingsRepositoryConnectionFactoryContractTests` + PD-003 fix on master)
- [x] Cache wrapper returns stale miss after upsert when setting-key casing differs (`TenantSettings_TryGetAsync_refreshes_after_upsert_when_setting_key_casing_differs`)
- [x] DefaultTenant FK insert/update disagrees with the cached read path (retired Î“Ã‡Ã¶ PD-003 disposition merged on master: `ArchLucidPersistenceStartup` ApiKey DefaultTenant bootstrap + scoped `ISqlConnectionFactory`; repository uses same `tenantId` on read/write/cache keys)

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
- **paths:** ArchLucid.Application/Runs/Orchestration/CommitOutputIntegrityService.cs; ArchLucid.Application/Runs/Orchestration/RealCommitAgentOutputQualityGateEvaluator.cs; ArchLucid.Core/AgentEvaluation/AgentExecutionTraceLatestPerTaskSelector.cs
- **test-filter:** FullyQualifiedName~AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests|FullyQualifiedName~RealCommitAgentOutputQualityGateEvaluatorTests
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-18
- **related-pd-tb:** TB-2226
- **code-changed-since:** 3

### Hypotheses

- [x] Integrity check accepts a payload whose declared artifact hashes do not match committed bytes Î“Ã‡Ã¶ fixed as quality-gate mismatch: `QualityRejected` ignored when `RecordedQualityGateOutcome` was Accepted/Warned
- [x] Missing optional artifact is treated as a hash match Î“Ã‡Ã¶ retired: not applicable to commit quality-gate paths; superseded-retry trace selection was the real gap
- [x] Integrity failure is logged but commit still proceeds Î“Ã‡Ã¶ retired: inverse bug found; superseded rejected traces incorrectly blocked commit after successful auto-retry
- [x] Latest-per-task selector breaks on equal `CreatedUtc` and picks a superseded rejected schema-remediation attempt over a later accepted attempt Î“Ã‡Ã¶ fixed: tie-break on `AttemptIndex` then `TraceId` in `AgentExecutionTraceLatestPerTaskSelector`

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

- [x] Retry policy retries a non-transient SQL error (constraint / timeout misclassified) Î“Ã‡Ã¶ fixed: `SqlTransientDetector` treated outer `TimeoutException` before inner non-transient `SqlException`
- [x] Commit retry exhausts attempts but still returns success to the caller Î“Ã‡Ã¶ retired: `IsExhausted` and orchestrator loop throw `ConflictException` on budget/attempt exhaustion; idempotent reconcile success is intentional
- [x] Transient retry does not include the same isolation / tenant scope on the replay Î“Ã‡Ã¶ retired: `OrchestratorTransientDbRetry` re-invokes caller lambda; scope is captured by caller closure

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

- [x] A consumed or expired OTP still issues a session Î“Ã‡Ã¶ retired: `VerifyCodeAsync_rejects_expired_code`, `VerifyCodeAsync_rejects_reused_code`, and `TryCompleteAsync` completion paths reject expired/already-completed challenges
- [x] Challenge lookup is not tenant-scoped and can verify another tenant's code Î“Ã‡Ã¶ retired (invalid): OTP challenges are pre-tenant and keyed by normalized email; verification requires challenge id + code hash bound to that row
- [x] Concurrent verify requests both succeed on the same one-time challenge Î“Ã‡Ã¶ retired: `EmailOtpChallengeRepositoryConcurrencyTests.TryCompleteAsync_allows_only_one_successful_completion`

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

- [x] A protocol-relative or encoded external URL is accepted as an in-app return path â€” fixed earlier (`/%2f%2fevil.example`); regression in `TryNormalize_rejects_open_redirect_shapes`
- [x] Backslash or `@` host smuggling bypasses the leading-slash check â€” retired: existing `TryNormalize_rejects_open_redirect_shapes` cases cover `/\\evil`, `/path@evil`, `/%40` decode
- [x] Control characters in the return path still survive normalization â€” fixed: reject control chars after each percent-decode pass (`/%09//evil.example`, `/%00//evil.example`)

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
- [ ] (candidate) Erasure command deletes another tenantÎ“Ã‡Ã–s rows when ids collide in cache

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

- [x] Inspect read returns a finding whose tenant does not match the request scope Î“Ã‡Ã¶ fixed: main inspect + FindingRecords joins in FollowUpBatch require `fr.TenantId`/`WorkspaceId`/`ProjectId` (run-only predicates were insufficient when row tenant diverges)
- [x] Mapper drops evidence fields so inspect shows success with empty trail Î“Ã‡Ã¶ retired (invalid): mapper only parses enums; evidence is built in the repository from related nodes
- [x] Inspect query joins without tenant on the child table and leaks sibling-tenant rows Î“Ã‡Ã¶ fixed: FollowUpBatch now scopes FindingRelatedNodes / rules / actions / AuditEvents / FindingReviewEvents / RiskExceptions to TenantId+WorkspaceId+ProjectId

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

- [ ] (candidate) Debit applies to a different tenantÎ“Ã‡Ã–s wallet when the header tenant differs from the route
- [ ] (candidate) Concurrent debits both succeed past the remaining balance
- [ ] (candidate) Wallet read returns another tenantÎ“Ã‡Ã–s remaining credits

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

- [x] Simulation context loads findings from a tenant other than the caller Î“Ã‡Ã¶ fixed: reject run detail / findings whose scope or RunId does not match the caller
- [x] Dry-run simulation persists a real alert delivery Î“Ã‡Ã¶ retired (invalid): `RuleSimulationService` evaluates in-memory and only reads suppression state
- [ ] Missing workspace still returns 200 with another workspaceÎ“Ã‡Ã–s rules

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
- [ ] (candidate) Dry-run payload includes secrets from another tenantÎ“Ã‡Ã–s webhook config
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
- [ ] (candidate) Probe uses the victim tenantÎ“Ã‡Ã–s token instead of the attacker token
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
- [x] Failed load still shows a previous tenantÎ“Ã‡Ã–s cached rows (retired: props-only client; loader clears runs and Sets loadFailure; list not mounted when hubLoadOk is false)
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

2026-08-17 dry hunt: listed hypotheses do not hold on `AuthCallbackAccessPanel`. Denial keeps `AUTH_CALLBACK_ACCESS_HEADING` + `technicalDetail` (success title only after 2xx access-request submit as Î“Ã‡Â£Access request sentÎ“Ã‡Â¥). Recovery links are only `/auth/signin` (no operator-shell href). Panel is props-only (no `useSearchParams` / react-query / email-otp session); error strings are fixed copy and do not interpolate emails. Existing `AuthCallbackAccessPanel` + `CallbackClient` tests (6) pass.

### Hypotheses

- [x] Access-denied technical detail is shown as a successful sign-in (retired: denial heading + detail until access-request 2xx; success copy is request-sent, not signed-in)
- [x] Callback continues into the operator shell when the grant is missing (retired: panel only links to `/auth/signin`; no `window.location` / operator routes)
- [x] Error copy includes another userÎ“Ã‡Ã–s email from a leftover query cache (retired: no query/session read; duplicate/submit errors are fixed strings)

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
- [x] Missing topic is rendered as a GitHub blob link (retired: not-found Î“Ã¥Ã† `/help`; doc-index has no github blob URLs)
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
- [x] Split-site origin check allows the operator app origin as a public page Î“Ã‡Ã¶ fixed: `normalizeRequestHost` no longer strips ports; request Host must match `URL.host` from configured origins (localhost:3000 vs :3001)

---

## Zone: ui-architecture-intelligence

- **id:** ui-architecture-intelligence
- **status:** open
- **impact:** medium
- **aliases:** architecture intelligence page; ai page client
- **paths:** archlucid-ui/src/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePageClient.tsx
- **test-filter:** ArchitectureIntelligencePageClient
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** 15

### Hypotheses

- [x] Page shows recommendations for a package outside the current workspace Î“Ã‡Ã¶ fixed: clear `runState` when inbound `runId` changes
- [x] Stale query data from the previous tenant remains after scope switch Î“Ã‡Ã¶ fixed: reset intake + reasoning on operator scope key change
- [x] Error state is omitted so a failed load looks like an empty architecture â€” (valid-no-repro): `ArchitectureIntelligenceProductContextLoadFailure` renders on HTTP failure; covered by `shows intake load failure with retry when deep-linked product context fails` in `ArchitectureIntelligencePageClient.buyer-polished.test.tsx`
- [ ] (candidate) Deep-linked run with empty `sourceTexts` and no `from` param shows "Scoped to run" without empty-intake notice â€” locus: `use-architecture-intelligence-page.ts` `inboundContextLine` default branch when `productContextStatus === "empty"`

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
- [ ] (candidate) Create succeeds without mapping the user into the callerÎ“Ã‡Ã–s tenant

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
- [ ] (candidate) Config GET returns another tenantÎ“Ã‡Ã–s client id

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
- [ ] (candidate) Composition registers a singleton that caches the first requestÎ“Ã‡Ã–s tenant
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
- [ ] (candidate) Admin can read or rotate another tenantÃ¢â‚¬â„¢s API key settings
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
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** 2026-08-19 — sponsor review packet exported for in-progress runs
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Export includes runs or findings from a workspace outside the caller scope — fixed: `ExportsController` binds export records to scoped `GetRunDetailAsync` before read/compare/replay
- [x] (proven) Sponsor review packet export succeeds for in-progress or broken-manifest runs — **hit 2026-08-19:** `SponsorReviewPacketBuilder` omitted `IsCommitted` / `HasBrokenManifestReference` guards used by other export services.
- [x] (invalid) Blob destination URL policy allows an internal/metadata endpoint (SSRF) — retired: decimal/link-local literals rejected; Azure blob host + DNS resolve guard
- [x] (invalid) Export succeeds when the run is still in progress and returns partial or stale bytes — retired for DOCX/PDF/HTML/summary paths; sponsor packet gap fixed above.

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
- **last-bug:** 2026-08-17 â€” watchdog reclaimed Running jobs before queue visibility expired (10m vs 15m default)
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [ ] Job dequeue runs work without re-binding tenant scope from the job payload
- [x] Leader-elected hosted service runs the same outbox drain on every replica â€” retired: intentional when `HostLeaderElection:Enabled` is false; default is enabled
- [x] Stuck-running watchdog marks a healthy job failed and it is retried into duplicate side effects â€” fixed stale threshold to exceed processor visibility (2026-08-17)

---

## Zone: itsm-inbound-webhooks

- **id:** itsm-inbound-webhooks
- **status:** open
- **impact:** high
- **aliases:** ITSM webhook; ServiceNow inbound; connector secret
- **paths:** ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs; ArchLucid.Application/Integrations/Itsm/; ArchLucid.Persistence/Integrations/MemoryCacheItsmInboundWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~ItsmInboundWebhook
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-18
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (candidate) Webhook accepted when the shared secret does not match the connector config - invalid: WebhookSecrets.SecureEquals rejects before parse
- [ ] (candidate) Replay guard allows duplicate delivery of the same event id - not reproduced; sequential replay covered
- [x] (candidate) Inbound payload is applied to a tenant inferred from the body instead of the authenticated connector - fixed: tenant-scoped routes use TryGetByExternalKeyForTenantAsync

---

## Zone: ui-auth-proxy

- **id:** ui-auth-proxy
- **status:** open
- **impact:** high
- **aliases:** UI auth; API proxy; edge proxy
- **paths:** archlucid-ui/src/lib/auth/; archlucid-ui/src/app/api/proxy/; archlucid-ui/src/proxy.ts
- **test-filter:** lib/auth|proxy-route|proxy.ts
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-18
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (candidate) Proxy forwards operator cookies or auth headers to a marketing-only upstream path - invalid: server bearer stripped on allowlisted marketing paths; cookies are not copied upstream
- [x] (candidate) Return-destination helper accepts an external URL that bypasses host-gate - invalid: `isSafeReturnPath` rejects external URLs; host-gate runs on next navigation
- [x] (candidate) Anonymous marketing proxy path can reach a mutating operator API route - fixed: reject `..`/`.` proxy segments before upstream fetch

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
- **status:** open
- **impact:** medium
- **aliases:** architecture analysis; compare quality delta
- **paths:** ArchLucid.Application/Analysis/
- **test-filter:** FullyQualifiedName~ArchitectureAnalysis|FullyQualifiedName~CompareQuality
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-18
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [ ] (candidate) Analysis compares runs from different tenants when scope keys collide
- [x] (candidate) Quality delta treats a failed run as higher quality than a succeeded run — **fixed 2026-08-18:** missing knowledge model substituted empty model, zeroing uncovered-mandatory "after" counts
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
- **status:** open
- **impact:** medium
- **aliases:** buyer proof pack; board pack; pilot artifacts
- **paths:** ArchLucid.Application/Pilots/
- **test-filter:** FullyQualifiedName~BuyerProofPack|FullyQualifiedName~BoardPack
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-18
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [ ] (candidate) Proof pack includes findings from a workspace outside the pilot scope
- [x] (candidate) PDF builder silently drops a section when source data is missing — **partial 2026-08-18:** snapshot fallback populated severity counts but left governed-coverage and top-finding unset (buyer proof / first-value surfaces)
- [ ] (candidate) Pack builder uses cached tenant data after a scope switch

---

## Zone: agent-runtime-evaluation

- **id:** agent-runtime-evaluation
- **status:** open
- **impact:** medium
- **aliases:** agent evaluation; evaluation runner
- **paths:** ArchLucid.AgentRuntime/Evaluation/
- **test-filter:** FullyQualifiedName~Evaluation
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** 2026-08-19
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Evaluation runner scores a failed trace as passed — warn-only gate records parse failures without rejecting; pilot strict rejects unparsed output (`AgentOutputTraceQualityEvaluatorTests`).
- [x] (invalid) Runner uses a golden fixture from a different tenant's catalog — reference cases load from a single configured JSON path, not tenant-scoped catalogs (`AgentOutputReferenceCaseCatalog`).
- [x] (invalid) Batch evaluation swallows per-item failures and reports aggregate success — `AgentOutputEvaluationRecorder` evaluates each latest-per-task trace independently via `Task.WhenAll`.
- [x] (proven) Architecture finding confidence enrichment uses the first trace per agent type — **hit 2026-08-18:** `AgentArchitectureFindingConfidenceEnricher` keyed traces by `AgentType` instead of `TaskId`, so multiple tasks of the same agent type inherited the wrong schema/reference signals.
- [x] (proven) Findings snapshot confidence enrichment uses superseded or wrong trace — **hit 2026-08-19:** `FindingsSnapshotEvaluationConfidenceEnricher` grouped raw traces by `AgentType` and took `First()`, ignoring `AgentExecutionTraceLatestPerTaskSelector` and mis-scoring retried tasks.

---

## Zone: decisioning

- **id:** decisioning
- **status:** open
- **impact:** medium
- **aliases:** decisioning engine; findings merge; advisory alerts
- **paths:** ArchLucid.Decisioning/
- **test-filter:** FullyQualifiedName~Decisioning|FullyQualifiedName~FindingsMerge
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** 2026-08-19
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (valid-no-repro) Merge keeps conflicting findings from two agents without deduplication — `FindingSnapshotConfluentMerger` dedupes payload-equal partitions and emits `finding-merge-conflict` for payload-unequal keys; `FindingsOrchestratorTests.GenerateFindingsSnapshotAsync_payload_conflict_is_confluent`.
- [x] (proven) Advisory alert fires for a finding outside the run scope — **hit 2026-08-18:** `AlertEvaluator` / `AlertMetricSnapshotBuilder` did not filter `RecommendationRecords` by `context.RunId`.
- [x] (proven) Comparison security improvements emit false `SecurityRegression` advisory signals — **hit 2026-08-19:** `ImprovementSignalAnalyzer` treated any `SecurityDelta` status change as regression, including NonCompliant→Compliant and newly added controls.
- [x] (valid-no-repro) Compliance gate passes when required evidence nodes are absent — `GraphComplianceEvaluator` flags uncovered required nodes; golden path tests confirm.

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
- **status:** open
- **impact:** medium
- **aliases:** retrieval indexing; embedding; pricing retrieval
- **paths:** ArchLucid.Retrieval/
- **test-filter:** FullyQualifiedName~Retrieval|FullyQualifiedName~Indexing
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-18
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Index query returns chunks from another tenant's corpus — **hit 2026-08-18:** Azure policy-pack OData filter omitted platform sentinel `tenantId`, allowing cross-tenant `PolicyPack` matches when `IncludePlatformCorpora` is on.
- [x] (valid-no-repro) Pricing estimate uses the wrong model tariff for the tenant plan — EA multiplier and cache keys are tenant-scoped; covered by existing pricing tests.
- [x] (valid-no-repro) Reindex job deletes vectors for the wrong workspace — `RetrievalIndexingService` validates scope and passes all four scope fields to delete.

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
- **status:** open
- **impact:** high
- **aliases:** core domain; security policies; tenancy models
- **paths:** ArchLucid.Core/
- **test-filter:** FullyQualifiedName~ArchLucid.Core
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-18
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) URL allow-list policy accepts a credential-bearing redirect target — **hit 2026-08-18:** outbound HTTPS URL policies allowed `https://user:pass@host` because only scheme/host were validated; embedded userinfo now rejected.
- [x] (valid-no-repro) Tenant scope model treats empty workspace as a wildcard — `ActivityScopeTags` rejects `Guid.Empty` workspace ids; no wildcard semantics in Core tenancy models.
- [x] (valid-no-repro) Configuration default enables a production-unsafe integration flag — ITSM/native and quick-scan defaults are gated by environment validators and hosted-SaaS overrides.

---

## Zone: archlucid-contracts

- **id:** archlucid-contracts
- **status:** open
- **impact:** low
- **aliases:** API contracts; DTO serialization; OpenAPI models
- **paths:** ArchLucid.Contracts/
- **test-filter:** FullyQualifiedName~Contracts
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** 2026-08-19
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (valid-no-repro) JSON round-trip drops a required field on a versioned request DTO — `KeyContractsJsonRoundTripTests` and `JsonRoundTripPropertyTests` cover core request/run DTO shapes.
- [x] (proven) Enum serialization accepts an out-of-range value as the default variant — **hit 2026-08-19:** `ServiceType`, `DatastoreType`, `RuntimePlatform`, and `RelationshipType` JSON converters cast numeric ordinals without `Enum.IsDefined`; fixed on master in `47e7613370` (same pattern as `AgentType` in `4d4340387c`).
- [x] (invalid) Contract change breaks backward compatibility without a version bump signal — versioning is policy/process, not a deserialization defect in these converters.

---

## Zone: context-ingestion

- **id:** context-ingestion
- **status:** open
- **impact:** medium
- **aliases:** context ingestion; connector stages; canonicalization
- **paths:** ArchLucid.ContextIngestion/
- **test-filter:** FullyQualifiedName~ContextIngestion|FullyQualifiedName~Canonicalization
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** 2026-08-19
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Canonicalization drops tenant id from ingested connector payload — no tenant id in canonical objects; isolation is repository scope
- [x] (invalid) Stage pipeline continues after a failed validation with partial graph — parsers skip bad declarations by design with warnings, not a validation gate
- [x] (invalid) Duplicate external keys from two tenants collapse into one node — ingestion is per-project snapshot, not multi-tenant batch dedup
- [x] (proven) `InfrastructureDeclarationConnector.DeltaAsync` keys resources by `SourceId` (declaration id) so multiple resources in one declaration collapse in `SetDiffConnectorDeltaComputer` — fixed with composite `SourceId|ObjectType|Name` key

---

## Zone: knowledge-graph-provenance

- **id:** knowledge-graph-provenance
- **status:** open
- **impact:** medium
- **aliases:** knowledge graph; provenance; lineage
- **paths:** ArchLucid.KnowledgeGraph/; ArchLucid.Provenance/
- **test-filter:** FullyQualifiedName~KnowledgeGraph|FullyQualifiedName~Provenance
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** 2026-08-19
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Graph merge links a node to provenance from another tenant — `DefaultGraphBuilder` / `ProvenanceBuilder` build from a single scoped snapshot; tenant isolation is repository/query scope, not a merge defect in these files
- [x] (invalid) Lineage query traverses into a sibling tenant's artifact store — `ArchLucid.Provenance` query/build paths do not open cross-tenant artifact stores; persistence uses `ScopeContext` on snapshot reads/writes
- [x] (invalid) Provenance record is written without workspace scope — `SqlProvenanceSnapshotRepository` and `ProvenanceGraphAccessService` persist/query with `TenantId` + `WorkspaceId` + `ProjectId`
- [x] (proven) Topology projected-spend enrichment overwrites parsed constraint spend when property keys use non-canonical casing — **hit 2026-08-19:** `CostConstraintProjectedSpendEnricher.HasProjectedSpend` used case-sensitive `ContainsKey` while deserialized `GraphNode.Properties` can use PascalCase keys
- [x] (proven) Topology cost projection under-scales when instance-count property keys use PascalCase — **hit 2026-08-19:** `GraphTopologyInfrastructureCostNodes.ReadProperty` used case-sensitive `TryGetValue`, so `InstanceCount` on deserialized nodes defaulted quantity to 1

---

## Zone: notifications-pipeline

- **id:** notifications-pipeline
- **status:** open
- **impact:** medium
- **aliases:** notifications; email dispatchers beyond weekly summary
- **paths:** ArchLucid.Notifications/; ArchLucid.Application/Notifications/
- **test-filter:** FullyQualifiedName~Notifications|FullyQualifiedName~EmailDispatcher
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** 2026-08-19
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Dispatcher sends to recipients outside the tenant membership list — no membership-validation locus in zone; callers supply mailboxes
- [x] (invalid) Template render includes another user's email in the body — zone Razor models carry URLs/metadata only, no cross-user mailbox fields
- [x] (invalid) Send failure is treated as success and suppresses retry — post-reservation ledger block is documented intentional (TB-089 / EMAIL_NOTIFICATIONS.md)
- [x] (proven) Weekly sponsor summary and report dispatchers share one idempotency key — **hit 2026-08-19:** `WeeklySponsorSummaryEmailDispatcher` reused `weekly-sponsor-report:{tenant}:{isoWeek}` so the summary email was skipped when the report sent first in the same ISO week

---

## Zone: artifact-synthesis

- **id:** artifact-synthesis
- **status:** open
- **impact:** medium
- **aliases:** artifact synthesis; docx generator; packaging sanitization
- **paths:** ArchLucid.ArtifactSynthesis/
- **test-filter:** FullyQualifiedName~ArtifactSynthesis|FullyQualifiedName~Docx
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Generated document embeds unsanitized user HTML/script — `LlmArtifactFreeTextSanitizer` and `WordDocumentBuilder` emit plain OpenXML text nodes (control/bidi strip only); DOCX does not execute embedded markup as script
- [x] (invalid) Packager includes artifacts from a run outside the requested scope — `ArtifactPackagingService` only zips the `artifacts` list passed by the caller; no cross-run artifact selection locus in this zone
- [x] (invalid) Validation passes when required manifest hash is missing — `ExportManifestBuilder` intentionally writes empty `committedManifestHash` when `RunExportReadmeContext.ManifestHash` is absent; `ArtifactBundleValidator` does not model manifest-hash enforcement (see `ArtifactPackagingServiceExportManifestTests`)

---

## Zone: host-composition

- **id:** host-composition
- **status:** open
- **impact:** medium
- **aliases:** host composition; DI registration; startup modules
- **paths:** ArchLucid.Host.Composition/
- **test-filter:** FullyQualifiedName~Host.Composition|FullyQualifiedName~ServiceCollectionExtensions
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-19
- **last-bug:** 2026-08-19
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Singleton service caches the first request tenant for the process lifetime — `CachingGovernanceDashboardService` keys cache entries with `HotPathCacheKeys.GovernanceDashboard(scope, tenantId, …)` per request scope
- [x] (invalid) Optional security service is not registered in production configuration — harm-class template; no single missing-security locus identified in composition partials
- [x] (invalid) Composition registers two implementations for the same tenant-scoped interface — `ISponsorReportRecipientLookup` is registered in both weekly modules with the same implementation type; MS.DI last registration wins without functional divergence
- [x] (proven) Weekly sponsor summary pipeline never wired into composition root — **hit 2026-08-19:** `RegisterWeeklySponsorSummaryServices` / worker infrastructure existed but were not called from `AddArchLucidApplicationServices`, so `IWeeklySponsorSummaryEmailDispatcher` was absent from DI

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

- [ ] (candidate) Extractor pulls resources using credentials from another tenantÃ¢â‚¬â„¢s connector
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
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-18
- **last-bug:** 2026-08-18 â€” AdminController archive-by-ids archived runs globally without tenant scope
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] Admin mutating endpoint lacks tenant binding on route parameters â€” (proven): `RunsController` request endpoints (2026-08-18); `AdminController.ArchiveRunsByIds` called global `ArchiveRunsByIdsAsync` without `GetByIdAsync(scope, â€¦)` filter (2026-08-18)
- [x] Authority read returns artifacts for a run in another workspace â€” fixed ComparisonsController scoped load (2026-08-17)
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
- [ ] (candidate) Error mapper surfaces another tenantâ€™s problem detail in the toast
