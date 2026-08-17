> **Scope:** Contributor-reference — curated `/al-bug` hunt zones. Not a buyer or operator document. Agents must not invent extra zones in the same invocation; update this file after each hunt.

# `/al-bug` hunt ledger

Curated zones covering the product (API, persistence, UI, CLI, orchestration, billing, governance). The picker is `scripts/agent/al-bug-pick-zone.ps1` (explore/exploit, not LLM ranking). Do **not** invent extra zones mid-hunt; do **not** treat this as a static “always hunt topology first” list.

**Updated:** 2026-08-17 (finding-inspect-sql hit: main/follow-up inspect SQL now scopes FindingRecords.TenantId).

## How to use

1. Run `.\scripts\agent\al-bug-pick-zone.ps1 -Preview` (add `-Hint '…'` when the user named an area; add `-Refresh` to recompute git churn).
2. Hunt **only** the returned zone’s `paths` / open hypotheses.
3. After the hunt, edit this file (the script does **not** write it):
   - **Hit:** increment `hunts` and `bugs-found`; set `consecutive-dry-hunts` to `0`; set `last-hunt` and `last-bug` to today (`YYYY-MM-DD`); tick the proven hypothesis.
   - **Dry:** increment `hunts` and `consecutive-dry-hunts`; set `last-hunt` to today; tick attempted hypotheses (or retire invalid ones). Do not invent another bug in the same files.
   - **Reopened:** when JSON `reopened` is `true`, set `status` back to `open`.

## Scoring (picker)

Time unit is **hunts**, not wall-clock minutes. Exploit zones with a short mean hunts-per-bug; explore untried / under-sampled zones so the catalog can learn.

```text
mean_hunts_per_bug = hunts / bugs when bugs > 0, else hunts + 2 (prior)
speed              = 1 / mean_hunts_per_bug
explore            = 1 / sqrt(hunts + 1)

score =
  6 × speed
+ 3 × explore
+ 2 × recent_churn              (min(3, commitCount since last-hunt))
+ 1 × related_PD_or_TB          (min(2, id count))
+ 0.25 × min(3, open hypotheses)
− 2 × consecutive_dry_hunts
```

Open-hypothesis count is a small tie-break only. A zone with many unchecked rows must not permanently block the rest of the catalog.

Eligibility: `open` always; `cooling` only when no `open` zone remains; `exhausted` only when git shows commits on `paths` since `last-hunt`.

## Exhaustion (all must hold)

1. Every listed hypothesis has a passing regression test, or was retired as invalid.
2. **3 consecutive dry hunts**.
3. **No production-path commits** in that zone since `last-hunt`.

Set `status` to `cooling` when yield has dropped (for example two dry hunts) but exhaustion is not complete. Set `exhausted` only when all three conditions hold.

---

## Zone: topology-proposal-merge

- **id:** topology-proposal-merge
- **status:** open
- **aliases:** topology merge; merge gate; graph merge
- **paths:** ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs; ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalGraphMerge.cs
- **test-filter:** FullyQualifiedName~AgentTopologyProposalMergeGateTests|FullyQualifiedName~AgentTopologyProposalGraphMergeTests
- **hunts:** 12
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-16
- **last-bug:** 2026-08-16
- **related-pd-tb:** none
- **code-changed-since:** unknown

High historical yield. **Not exhausted** — remaining hypotheses are type-family and post-processor disagreements, not the parameterized alias cases already covered.

### Hypotheses

- [x] Renamed manifest labels not aliased to inventoried graph node ids
- [x] Synthetic `svc-` / `ds-` keys vs graph SourceId
- [x] Terraform SourceId vs graph SourceId
- [x] ARM resource id with whitespace
- [x] Storage vs data category for datastore synthetic ids
- [x] Cost/compliance relationship-only edges with a rename overlay
- [ ] Merge gate keeps a relationship but graph merge drops the edge for a type family not in parameterized tests
- [ ] Duplicate node-id collision when overlay and inventoried node share SourceId but different labels
- [ ] Gate vs merge disagreement after structural post-processor strips a relationship
- [ ] Relationship-only follow-up when rename overlay is in a different agent result filtered out by inventory

---

## Zone: arm-terraform-source-ids

- **id:** arm-terraform-source-ids
- **status:** open
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

- [x] ARM resource id indexed in the endpoint index but not resolved by the edge mapper — retired (invalid on current code): tf.id / tf.resource_id already indexed and resolved; rename via ARM ServiceId already matches
- [x] Terraform SourceId claimed in merge but missing from alias resolution — fixed: NodeMatchesService/Datastore now compare ServiceId/DatastoreId to Label (tf show JSON address-on-label shape)
- [x] Endpoint keyed by a property bag value that is not a SourceId

---

## Zone: tenant-settings-sql

- **id:** tenant-settings-sql
- **status:** open
- **aliases:** tenant settings; DefaultTenant FK
- **paths:** ArchLucid.Persistence/Tenancy/SqlTenantSettingsRepository.cs; ArchLucid.Persistence/Tenancy/CachingTenantSettingsRepository.cs
- **test-filter:** FullyQualifiedName~SqlTenantSettingsRepository
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** PD-003
- **code-changed-since:** unknown

**PD-003** (DefaultTenant FK + TenantSettings tenant-plane SQL) was Fixed on RC11/RC12 and is **not merged**. Do not treat PD-002 / TB-867 (ServiceNow wrong SQL catalog, Done) as open work in this zone.

### Hypotheses

- [ ] Tenant-plane SQL still uses the host catalog or a hardcoded tenant id
- [ ] Cache wrapper returns another tenant’s settings after a tenant switch
- [ ] DefaultTenant FK insert/update disagrees with the cached read path

---

## Zone: ui-form-validation

- **id:** ui-form-validation
- **status:** open
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
- **aliases:** output integrity; commit integrity
- **paths:** ArchLucid.Application/Runs/Orchestration/CommitOutputIntegrityService.cs; ArchLucid.Application/Runs/Orchestration/RealCommitAgentOutputQualityGateEvaluator.cs
- **test-filter:** FullyQualifiedName~AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests|FullyQualifiedName~RealCommitAgentOutputQualityGateEvaluatorTests
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-17
- **last-bug:** 2026-08-17
- **related-pd-tb:** TB-2226
- **code-changed-since:** 2

### Hypotheses

- [x] Integrity check accepts a payload whose declared artifact hashes do not match committed bytes — fixed as quality-gate mismatch: `QualityRejected` ignored when `RecordedQualityGateOutcome` was Accepted/Warned
- [ ] Missing optional artifact is treated as a hash match
- [ ] Integrity failure is logged but commit still proceeds

---

## Zone: content-safety-admission

- **id:** content-safety-admission
- **status:** open
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

- [ ] Composite short-circuits to allow when one inner precheck throws
- [ ] Semantic admission gate skips deterministic precheck failures
- [ ] Default precheck allows an executable injection pattern covered by AgentRuntime regression tests

---

## Zone: storage-vs-data-category

- **id:** storage-vs-data-category
- **status:** open
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
- **status:** open
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

- [ ] JSON round-trip drops a required work field and the processor still dequeues
- [ ] Unknown payload version is treated as the current contract
- [ ] Tenant id in the payload is not the tenant used for SQL

---

## Zone: technology-ledger-merge

- **id:** technology-ledger-merge
- **status:** open
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

- [ ] Ledger merge keeps an agent-proposed technology that the inventory already replaced
- [ ] Duplicate technology names from two agents both survive merge
- [ ] Merge policy ignores a seeded ledger row when the proposal uses a different casing

---

## Zone: orchestrator-transient-retry

- **id:** orchestrator-transient-retry
- **status:** open
- **aliases:** transient retry; commit retry
- **paths:** ArchLucid.Application/Runs/Orchestration/OrchestratorTransientDbRetry.cs; ArchLucid.Application/Runs/Orchestration/CommitRunTransientRetryPolicy.cs
- **test-filter:** FullyQualifiedName~OrchestratorTransientDbRetryTests|FullyQualifiedName~CommitRunTransientRetryPolicyTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] Retry policy retries a non-transient SQL error (constraint / timeout misclassified)
- [ ] Commit retry exhausts attempts but still returns success to the caller
- [ ] Transient retry does not include the same isolation / tenant scope on the replay

---

## Zone: email-otp-auth

- **id:** email-otp-auth
- **status:** open
- **aliases:** email otp; otp auth; email challenge
- **paths:** ArchLucid.Api/Controllers/Auth/EmailOtpAuthController.cs; ArchLucid.Application/Identity/EmailOtpAuthService.cs
- **test-filter:** FullyQualifiedName~EmailOtpAuthServiceTests|FullyQualifiedName~EmailOtpChallengeRepositoryConcurrencyTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] A consumed or expired OTP still issues a session
- [ ] Challenge lookup is not tenant-scoped and can verify another tenant’s code
- [ ] Concurrent verify requests both succeed on the same one-time challenge

---

## Zone: auth-return-path

- **id:** auth-return-path
- **status:** open
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

- [ ] A protocol-relative or encoded external URL is accepted as an in-app return path
- [ ] Backslash or `@` host smuggling bypasses the leading-slash check
- [ ] Control characters in the return path still survive normalization

---

## Zone: tenant-erasure

- **id:** tenant-erasure
- **status:** open
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

- [ ] Erasure proceeds while a legal hold is still active
- [ ] Quarantine middleware lets mutating requests through after erasure has started
- [ ] Erasure command deletes another tenant’s rows when ids collide in cache

---

## Zone: tenant-scoped-analyzer

- **id:** tenant-scoped-analyzer
- **status:** open
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

- [ ] Analyzer misses a Dapper QueryAsync on a tenant table with no scope binding
- [ ] Interpolated SQL is treated as scoped when the tenant predicate is only in a comment
- [ ] Empty exemption justification does not fire the diagnostic

---

## Zone: sql-run-repository

- **id:** sql-run-repository
- **status:** open
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
- **status:** cooling
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

- [x] Inspect read returns a finding whose tenant does not match the request scope — fixed: main inspect + FindingRecords joins in FollowUpBatch require `fr.TenantId`/`WorkspaceId`/`ProjectId` (run-only predicates were insufficient when row tenant diverges)
- [x] Mapper drops evidence fields so inspect shows success with empty trail — retired (invalid): mapper only parses enums; evidence is built in the repository from related nodes
- [x] Inspect query joins without tenant on the child table and leaks sibling-tenant rows — fixed: FollowUpBatch now scopes FindingRelatedNodes / rules / actions / AuditEvents / FindingReviewEvents / RiskExceptions to TenantId+WorkspaceId+ProjectId

---

## Zone: llm-wallet

- **id:** llm-wallet
- **status:** open
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

- [ ] Debit applies to a different tenant’s wallet when the header tenant differs from the route
- [ ] Concurrent debits both succeed past the remaining balance
- [ ] Wallet read returns another tenant’s remaining credits

---

## Zone: finding-disposition

- **id:** finding-disposition
- **status:** open
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

- [ ] Disposition writes succeed for a finding that belongs to another tenant
- [ ] Validation accepts a closed finding as still actionable
- [ ] Required rationale is skipped when the disposition kind is reject

---

## Zone: review-recurrence

- **id:** review-recurrence
- **status:** open
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

- [ ] Next-run lands in the past so the scheduler fires immediately in a loop
- [ ] Disabled recurrence still computes a next run
- [ ] Time-zone conversion shifts the cadence by a day around DST

---

## Zone: alert-simulation

- **id:** alert-simulation
- **status:** open
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

- [x] Simulation context loads findings from a tenant other than the caller — fixed: reject run detail / findings whose scope or RunId does not match the caller
- [x] Dry-run simulation persists a real alert delivery — retired (invalid): `RuleSimulationService` evaluates in-memory and only reads suppression state
- [ ] Missing workspace still returns 200 with another workspace’s rules

---

## Zone: weekly-digest-email

- **id:** weekly-digest-email
- **status:** open
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

- [ ] Digest email includes findings from a tenant the recipient cannot access
- [ ] Dispatcher treats a send failure as success and skips retry
- [ ] Unsubscribed address still receives the weekly summary

---

## Zone: outbound-webhook-dry-run

- **id:** outbound-webhook-dry-run
- **status:** open
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

- [ ] Dry-run posts to the live customer endpoint
- [ ] Dry-run payload includes secrets from another tenant’s webhook config
- [ ] Controller returns success when the dry-run service throws

---

## Zone: architecture-recommendation

- **id:** architecture-recommendation
- **status:** open
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
- **status:** cooling
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
- **status:** open
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

- [ ] Runner reports pass when a cross-tenant probe actually returned 200
- [ ] Probe uses the victim tenant’s token instead of the attacker token
- [ ] Aggregator treats skipped probes as isolation successes

---

## Zone: cli-draft-new

- **id:** cli-draft-new
- **status:** open
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

- [ ] Draft is created under a tenant other than the signed-in CLI tenant
- [ ] Command reports success when the API returned 4xx
- [ ] Existing draft id is overwritten without confirmation

---

## Zone: cli-terraform-evidence

- **id:** cli-terraform-evidence
- **status:** open
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

- [ ] ARM resource id is stored in the wrong Terraform attribute (name vs id)
- [ ] Module-wrapped resource is skipped so evidence omits a live ARM id
- [ ] Parser treats a comment containing `resource_id` as a real binding

---

## Zone: ui-runs-list

- **id:** ui-runs-list
- **status:** cooling
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
- [x] Failed load still shows a previous tenant’s cached rows (retired: props-only client; loader clears runs and Sets loadFailure; list not mounted when hubLoadOk is false)
- [x] Empty state is skipped so a spinner never ends after a 403 (retired: no spinner in RunsListClient; 403 surfaces OperatorApiProblem upstream)

---

## Zone: ui-auth-callback

- **id:** ui-auth-callback
- **status:** open
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

2026-08-17 dry hunt: listed hypotheses do not hold on `AuthCallbackAccessPanel`. Denial keeps `AUTH_CALLBACK_ACCESS_HEADING` + `technicalDetail` (success title only after 2xx access-request submit as “Access request sent”). Recovery links are only `/auth/signin` (no operator-shell href). Panel is props-only (no `useSearchParams` / react-query / email-otp session); error strings are fixed copy and do not interpolate emails. Existing `AuthCallbackAccessPanel` + `CallbackClient` tests (6) pass.

### Hypotheses

- [x] Access-denied technical detail is shown as a successful sign-in (retired: denial heading + detail until access-request 2xx; success copy is request-sent, not signed-in)
- [x] Callback continues into the operator shell when the grant is missing (retired: panel only links to `/auth/signin`; no `window.location` / operator routes)
- [x] Error copy includes another user’s email from a leftover query cache (retired: no query/session read; duplicate/submit errors are fixed strings)

---

## Zone: ui-help-docs

- **id:** ui-help-docs
- **status:** cooling
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
- [x] Missing topic is rendered as a GitHub blob link (retired: not-found → `/help`; doc-index has no github blob URLs)
- [x] Index lists topics the current role is not allowed to open (fixed: generate_doc_index no longer bleeds internal-runbook titles onto public slugs)

---

## Zone: ui-webhooks-settings

- **id:** ui-webhooks-settings
- **status:** cooling
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
- [x] Split-site origin check allows the operator app origin as a public page — fixed: `normalizeRequestHost` no longer strips ports; request Host must match `URL.host` from configured origins (localhost:3000 vs :3001)

---

## Zone: ui-architecture-intelligence

- **id:** ui-architecture-intelligence
- **status:** open
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

- [x] Page shows recommendations for a package outside the current workspace — fixed: clear `runState` when inbound `runId` changes
- [x] Stale query data from the previous tenant remains after scope switch — fixed: reset intake + reasoning on operator scope key change
- [ ] Error state is omitted so a failed load looks like an empty architecture

---

## Zone: scim-users

- **id:** scim-users
- **status:** open
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

- [ ] PATCH/DELETE affects a user in another tenant when externalId collides
- [ ] Filter query returns users outside the provisioning tenant
- [ ] Create succeeds without mapping the user into the caller’s tenant

---

## Zone: identity-provider-config

- **id:** identity-provider-config
- **status:** open
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

- [ ] Activation writes IdP settings onto a tenant the admin does not own
- [ ] Disable still leaves the previous client secret usable
- [ ] Config GET returns another tenant’s client id

---

## Zone: worker-host

- **id:** worker-host
- **status:** open
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

- [ ] Worker host starts without a tenant-scope constraint on background jobs
- [ ] Composition registers a singleton that caches the first request’s tenant
- [ ] Startup succeeds when a required hosted service failed to resolve
