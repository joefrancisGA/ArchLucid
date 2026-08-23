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
- **hunts:** 14
- **bugs-found:** 10
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — hunt #50: greenfield compliance declared endpoints but graph merge dropped dangling edges
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
- [x] (proven) Merge gate keeps a relationship but graph merge drops the edge for a type family not in parameterized tests — **hit 2026-08-23 hunt #50:** greenfield compliance-only proposals materialized endpoint aliases but not nodes, so `DropDanglingEdges` removed relationships the gate kept; fixed by materializing declared services/datastores on empty graphs.
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
- **test-filter:** FullyQualifiedName~AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests|FullyQualifiedName~RealCommitAgentOutputQualityGateEvaluatorTests|FullyQualifiedName~AgentExecutionTraceLatestPerTaskSelectorTests
- **hunts:** 5
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — hunt #37: AttemptIndex must rank before CreatedUtc in latest-per-task selector
- **related-pd-tb:** TB-2226
- **code-changed-since:** 0

### Hypotheses

- [x] Integrity check accepts a payload whose declared artifact hashes do not match committed bytes Î“Ã‡Ã¶ fixed as quality-gate mismatch: `QualityRejected` ignored when `RecordedQualityGateOutcome` was Accepted/Warned
- [x] Missing optional artifact is treated as a hash match Î“Ã‡Ã¶ retired: not applicable to commit quality-gate paths; superseded-retry trace selection was the real gap
- [x] Integrity failure is logged but commit still proceeds Î“Ã‡Ã¶ retired: inverse bug found; superseded rejected traces incorrectly blocked commit after successful auto-retry
- [x] Latest-per-task selector breaks on equal `CreatedUtc` and picks a superseded rejected schema-remediation attempt over a later accepted attempt Î“Ã‡Ã¶ fixed: tie-break on `AttemptIndex` then `TraceId` in `AgentExecutionTraceLatestPerTaskSelector`
- [x] (proven) `AgentExecutionTraceLatestPerTaskSelector` sorts `CreatedUtc` before `AttemptIndex`, so a superseded rejected attempt with a newer timestamp blocks commit after a higher `AttemptIndex` accepted retry — **hit 2026-08-23 hunt #37:** order by `AttemptIndex` then `CreatedUtc` then `TraceId`

---

## Zone: content-safety-admission

- **id:** content-safety-admission
- **status:** cooling
- **impact:** medium
- **aliases:** content safety; admission gate; prompt injection
- **paths:** ArchLucid.Application/Runs/Orchestration/CompositeRequestContentSafetyPrecheck.cs; ArchLucid.Application/Runs/Orchestration/LlmSemanticAdmissionGate.cs; ArchLucid.Application/Runs/Orchestration/DefaultRequestContentSafetyPrecheck.cs
- **test-filter:** FullyQualifiedName~DefaultRequestContentSafetyPrecheckTests|FullyQualifiedName~LlmSemanticAdmissionGateTests
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — hunt #45: Default precheck omitted Environment and list fields from injection scan
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Composite short-circuits to allow when one inner precheck throws — exceptions propagate; composite does not catch and allow.
- [x] (invalid) Semantic admission gate skips deterministic precheck failures — `CompositeRequestContentSafetyPrecheck` accumulates failures from every inner precheck (Default then Semantic).
- [x] (valid-no-repro) Default precheck allows an executable injection pattern covered by AgentRuntime regression tests — `PromptInjectionExecutableRegressionTests.Precheck_blocks_expected_prompts` already exercises `expectedBlockedAt=precheck` fixtures.
- [x] (proven) Default precheck omitted `Environment`, `Constraints`, and other list/snapshot fields from `PromptInjectionPatternSignals` scan, allowing injection to pass create-time admission and reach agent objectives (`TechnologyLedgerObjectiveComposer`).

2026-08-23 dry hunt #46: no open hypotheses remain after hunt #45 fix; composite/semantic paths already retired or proven.

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
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Retry policy retries a non-transient SQL error (constraint / timeout misclassified) Î“Ã‡Ã¶ fixed: `SqlTransientDetector` treated outer `TimeoutException` before inner non-transient `SqlException`
- [x] Commit retry exhausts attempts but still returns success to the caller Î“Ã‡Ã¶ retired: `IsExhausted` and orchestrator loop throw `ConflictException` on budget/attempt exhaustion; idempotent reconcile success is intentional
- [x] Transient retry does not include the same isolation / tenant scope on the replay Î“Ã‡Ã¶ retired: `OrchestratorTransientDbRetry` re-invokes caller lambda; scope is captured by caller closure
- [x] (proven) `AggregateException` with a non-transient `SqlException` listed before a deadlock (`1205`) skips orchestrator retry — fixed: `IsRetriableOrchestratorDbFailure` flattens aggregate inners before `SqlTransientDetector` (`ExecuteAsync_retries_deadlock_when_aggregate_exception_lists_it_after_non_transient_sql`)

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
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] A protocol-relative or encoded external URL is accepted as an in-app return path â€” fixed earlier (`/%2f%2fevil.example`); regression in `TryNormalize_rejects_open_redirect_shapes`
- [x] Backslash or `@` host smuggling bypasses the leading-slash check â€” retired: existing `TryNormalize_rejects_open_redirect_shapes` cases cover `/\\evil`, `/path@evil`, `/%40` decode
- [x] Control characters in the return path still survive normalization â€” fixed: reject control chars after each percent-decode pass (`/%09//evil.example`, `/%00//evil.example`)
- [x] Deeply nested percent-encoded slashes survive the three-pass decode cap (`/%2525252f%2525252fevil.example` accepted as in-app path) — fixed: eight-pass decode cap plus reject residual `%2f`/`%5c`/`%2e`; regression in `TryNormalize_rejects_open_redirect_shapes`
- [x] (proven) Embedded protocol-relative segments survive return-path normalization — fixed: `ContainsProtocolRelativeTraversal` rejects leading and embedded `//`/`/\`; regression in `TryNormalize_rejects_open_redirect_shapes` and `TryNormalize_rejects_deeply_encoded_embedded_protocol_relative_segment`
- [x] (proven) Residual double-encoded slashes survive the eight-pass decode cap — **hit 2026-08-21:** `%252F%252F` residue evaded single-level `%2f` detection after the decode loop; regression in `TryNormalize_rejects_residual_double_encoded_slashes_after_decode_cap`
- [x] (proven) Unicode slash homoglyphs bypass ASCII-only protocol-relative checks — **hit 2026-08-22:** fullwidth solidus (`／`, `%EF%BC%8F`) and fullwidth reverse solidus (`＼`) evaded `ContainsProtocolRelativeTraversal`; regression in `TryNormalize_rejects_unicode_slash_homoglyph_protocol_relative_paths`
- [x] (proven) Additional Unicode slash homoglyphs bypass `IsSlashHomoglyph` — **hit 2026-08-23:** light diagonal (`╱`, `%E2%95%B1`), big solidus (`⧸`, `%E2%A7%B8`), and solidus overlay (`⧶`) evaded slash-homoglyph checks; regression in `TryNormalize_rejects_additional_unicode_slash_homoglyph_protocol_relative_paths` and `TryNormalize_rejects_deeply_encoded_additional_unicode_slash_homoglyph_segment`

---

## Zone: tenant-erasure

- **id:** tenant-erasure
- **status:** open
- **impact:** high
- **aliases:** tenant delete; erasure; quarantine middleware
- **paths:** ArchLucid.Application/Tenancy/TenantErasureCommandService.cs; ArchLucid.Api/Middleware/TenantErasureQuarantineMiddleware.cs
- **test-filter:** FullyQualifiedName~TenantErasure
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Erasure proceeds while a legal hold is still active — `IsEligibleForScheduledHardPurge` and SQL list queries exclude rows with future `LegalHoldUntilUtc`; orphan cleanup skips active holds in `OrphanedTenantCatalogCleanupBackgroundWork`
- [x] (proven) Quarantine middleware lets mutating requests through after erasure has started — **hit 2026-08-23:** `TrialSeatReservationMiddleware` ran before `TenantErasureQuarantineMiddleware`, so offboarded active-trial tenants still incremented `TrialSeatsUsed` before the 403; fixed by running erasure quarantine first in `PipelineExtensions`
- [x] (proven) Restore quarantine leaves stale `TenantErasureApprovedUtc` on in-memory tenants — **hit 2026-08-23:** `InMemoryTenantRepository` `CopyTenant(clearErasureQuarantine: true)` kept prior approval, so a restored tenant could be hard-purged after re-offboard without a fresh admin approval; aligned with Dapper restore SQL that nulls approval columns
- [x] (invalid) Erasure command deletes another tenant's rows when ids collide in cache — `TenantGetByIdRequestCache` keys by `Guid` tenant id; no cross-tenant alias path in this zone

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
- **test-filter:** FullyQualifiedName~SqlRunRepositoryScopeIsolationSqlIntegrationTests|FullyQualifiedName~RunRepositoryWorkspaceSystemNameSqlTests
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — hunt #38: workspace system-name collision SQL must trim ProjectId
- **related-pd-tb:** none
- **code-changed-since:** 0

2026-08-16 dry hunt: listed hypotheses do not hold on `SqlRunRepository`. `SelectByScopedId` and `Update` already require `TenantId` + `WorkspaceId` + `ScopeProjectId`; `GetById_wrong_scope_returns_null_when_run_saved_under_other_tenant` covers cross-tenant get. List shapes use `RunListWarningFlagSql.ScopeWhereTail` with `r.TenantId = @TenantId` always; `WorkspaceId` is a non-nullable `Guid` (empty workspace is not a security boundary). Cross-tenant update matches 0 rows and throws. Admin/archive paths are `[TenantScopeExempt]` by catalog routing, not Layer D bleed.

### Hypotheses

- [x] (valid-no-repro) Get-by-id returns a run that belongs to a different tenant — `GetById_wrong_scope_returns_null_when_run_saved_under_other_tenant`
- [x] (valid-no-repro) List query omits tenant predicate when workspace filter is empty — `RunListWarningFlagSql.ScopeWhereTail` always binds `r.TenantId`
- [x] (valid-no-repro) Update succeeds against a run id from another tenant in the same database — scoped `WHERE` matches 0 rows
- [x] (valid-no-repro) Workspace system-name collision returns true for another tenant's active run — InMemory cross-tenant guard test
- [x] (proven) `ExistsActiveRunWithSystemNameInWorkspace` compares `UPPER(ProjectId)` without trimming so padded slugs bypass the workspace collision guard — **hit 2026-08-23 hunt #38:** `LTRIM(RTRIM(ProjectId))` before `UPPER`

---

## Zone: finding-inspect-sql

- **id:** finding-inspect-sql
- **status:** open
- **impact:** high
- **aliases:** finding inspect; dapper inspect read
- **paths:** ArchLucid.Persistence/Findings/DapperFindingInspectReadRepository.cs; ArchLucid.Persistence/Findings/FindingInspectReadModelMapper.cs; ArchLucid.Persistence/Sql/FindingInspectReadSql.cs
- **test-filter:** FullyQualifiedName~FindingInspectReadModelMapperTests|FullyQualifiedName~FindingInspectReadSqlTests|FullyQualifiedName~DapperFindingInspectReadRepositoryTests|FullyQualifiedName~FindingInspectEndpointTests
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Inspect read returns a finding whose tenant does not match the request scope Î“Ã‡Ã¶ fixed: main inspect + FindingRecords joins in FollowUpBatch require `fr.TenantId`/`WorkspaceId`/`ProjectId` (run-only predicates were insufficient when row tenant diverges)
- [x] Mapper drops evidence fields so inspect shows success with empty trail Î“Ã‡Ã¶ retired (invalid): mapper only parses enums; evidence is built in the repository from related nodes
- [x] Inspect query joins without tenant on the child table and leaks sibling-tenant rows — fixed: FollowUpBatch now scopes FindingRelatedNodes / rules / actions / AuditEvents / FindingReviewEvents / RiskExceptions to TenantId+WorkspaceId+ProjectId
- [x] (proven) `ResolveRuleFields` pairs `DecisionRuleId` from `AppliedRuleIdsJson` with unrelated `FindingTraceRulesApplied` SortOrder=0 text — fixed: keep `DecisionRuleName` aligned with the first applied rule id when JSON ids exist

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
- **status:** open
- **impact:** medium
- **aliases:** disposition; finding decision
- **paths:** ArchLucid.Application/Governance/FindingDisposition/FindingDispositionService.cs; ArchLucid.Application/Governance/FindingDisposition/FindingDispositionValidation.cs
- **test-filter:** FullyQualifiedName~FindingDispositionValidationTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Disposition writes succeed for a finding that belongs to another tenant — trail append uses `scope.TenantId`; no cross-tenant leak path in zone files.
- [x] (valid-no-repro) Validation accepts a closed finding as still actionable — disposition is append-only by design (`FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`); no finding-state gate in validation.
- [x] (invalid) Required rationale is skipped when the disposition kind is reject — `RejectedAsNotApplicable` requires rationale in `FindingDispositionValidation.Validate`.
- [x] (proven) Deferred disposition rejects empty rationale while operator UI gates (TB-2305) require rationale only for Accepted and RejectedAsNotApplicable — fixed by removing Deferred from `requiresRationale`.
- [x] (proven) Non-Accepted dispositions persist trade-off acknowledgment and cross-kind fields (`RevisitDueUtc`, `EvidenceRequestText`) on unrelated disposition kinds — fixed in `FindingDispositionService` note builder and record normalization.

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
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-17
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Simulation context loads findings from a tenant other than the caller — fixed: reject run detail / findings whose scope or RunId does not match the caller
- [x] Dry-run simulation persists a real alert delivery — retired (invalid): `RuleSimulationService` evaluates in-memory and only reads suppression state
- [x] Missing workspace still returns 200 with another workspace's rules — (valid-no-repro): `RunMatchesCallerScope` rejects foreign-workspace run detail; `StampSimulationScope` overwrites embedded rule scope before `SimulateAsync`; covered by `GetContextsAsync_when_authority_returns_foreign_workspace_run_returns_empty`

---

## Zone: weekly-digest-email

- **id:** weekly-digest-email
- **status:** open
- **impact:** low
- **aliases:** weekly digest; executive summary email
- **paths:** ArchLucid.Application/Notifications/Email/WeeklyExecutiveSummaryEmailDispatcher.cs
- **test-filter:** FullyQualifiedName~WeeklyExecutiveSummaryJobTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Digest email includes findings from a tenant the recipient cannot access — dispatcher only renders pre-built `summaryMarkdown`; tenant scoping lives in the delivery scanner and export service.
- [x] (valid-no-repro) Dispatcher treats a send failure as success and skips retry — send failures throw; ledger reservation before send is intentional TB-089 idempotency (duplicate ACA retries blocked).
- [x] (invalid) Unsubscribed address still receives the weekly summary — unsubscribe filtering is not in the dispatcher; sponsor report path has no unsubscribe URL parameter (unlike exec digest).
- [x] (proven) Whitespace-only recipient lists reserve the weekly ledger and return success without sending any email — fixed by normalizing mailboxes before ledger reservation.
- [x] (proven) Template render failures after ledger reservation block weekly retry for the ISO week — fixed by rendering templates before `TryRecordSentAsync` while keeping ledger-before-send for outbound idempotency.

---

## Zone: outbound-webhook-dry-run

- **id:** outbound-webhook-dry-run
- **status:** open
- **impact:** high
- **aliases:** webhook dry run; outbound webhook
- **paths:** ArchLucid.Api/Controllers/Webhooks/OutboundWebhookDryRunController.cs; ArchLucid.Host.Composition/Services/OutboundWebhookDryRunService.cs
- **test-filter:** FullyQualifiedName~OutboundWebhookDryRunServiceTests|FullyQualifiedName~OutboundWebhookDryRunControllerTests
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-20
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** 3

### Hypotheses

- [x] (invalid) Dry-run posts to the live customer endpoint — retired: operator supplies `TargetUrl`; POST is the feature (no stored webhook config in zone paths)
- [x] (invalid) Dry-run payload includes secrets from another tenant's webhook config — retired: controller uses request `SharedSecret` only; no tenant webhook lookup in zone paths
- [x] (invalid) Controller returns success when the dry-run service throws — retired: `ProbeWithBodyAsync` catches transport errors and returns `TransportSucceeded=false`; controller intentionally returns 200 with probe outcome in body

---

## Zone: architecture-recommendation

- **id:** architecture-recommendation
- **status:** open
- **impact:** medium
- **aliases:** recommendation engine; alternatives
- **paths:** ArchLucid.Application/ArchitectureIntelligence/ArchitectureRecommendationEngine.cs
- **test-filter:** FullyQualifiedName~ArchitectureRecommendationAlternativesTests|FullyQualifiedName~ArchitectureRecommendationProposedChangeTests
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] Recommended change targets an element that is not in the current package (retired: engine has no package element targeting)
- [x] Alternative list duplicates the primary recommendation as if it were distinct
- [x] Engine emits a must-change when evidence only supports a suggestion (proven)
- [x] (proven) Unverified/indeterminate findings still emit production-control alternatives — **hit 2026-08-23:** `ArchitectureRecommendationAlternatives.Build` ignored `ProvenancePresentationMapper` and returned private-network/API-gateway paths while `ProposedChange` asked to collect evidence first

---

## Zone: extraction-router

- **id:** extraction-router
- **status:** open
- **impact:** medium
- **aliases:** extraction router; difficulty router
- **paths:** ArchLucid.Application/ArchitectureIntelligence/DifficultyBasedExtractionRouter.cs
- **test-filter:** FullyQualifiedName~DifficultyBasedExtractionRouterTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Hard extraction is routed to the cheap path and still treated as high fidelity
- [x] Router swallows a failed extraction and returns an empty graph as success (retired: no failure/empty-success path; placeholder Assumption on miss)
- [x] Difficulty score is computed from a different document than the one extracted (retired: Classify and Extract share the same sourceText)
- [x] (proven) `InferLifecycleScopeForIndex` tags elements TargetState when any target marker appears before matchIndex, ignoring a later current-state section (`Extract_tags_component_after_current_state_section_even_when_target_state_appears_first`, `Extract_tags_component_after_as_is_section_even_when_to_be_appears_first`)

---

## Zone: cli-tenant-isolation

- **id:** cli-tenant-isolation
- **status:** open
- **impact:** high
- **aliases:** tenant isolation cli; negative isolation test
- **paths:** ArchLucid.Cli/Commands/TenantIsolationNegativeTestCommand.cs; ArchLucid.Cli/Commands/TenantIsolationNegativeTestRunner.cs
- **test-filter:** FullyQualifiedName~TenantIsolationNegativeTestRunnerTests
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Offline replay trusted manifest `verdict: pass` even when `observedStatusCode` was 200 on deny-status probes — fixed by deriving deny verdicts from observed status unless manifest marks skip.
- [x] (invalid) Probe uses the victim tenant's token instead of the attacker token — live mode applies alternate scope headers on a second client; same credential probes cross-tenant scope by design.
- [x] (proven) Live ship-gate reported overall PASS when cross-tenant probes were SKIP (primary sanity Pass + infra 5xx skips) — fixed by downgrading live overall to SKIP and non-zero exit when isolation was not verified.

- [x] (proven) exclude-run-id probes reported PASS on HTTP 5xx when the foreign runId was absent — fixed by skipping list-exclusion probes on server errors like deny-status probes.

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
- **status:** open
- **impact:** medium
- **aliases:** terraform evidence; deployment evidence terraform
- **paths:** ArchLucid.Cli/Commands/DeploymentEvidenceTerraformReference.cs
- **test-filter:** FullyQualifiedName~DeploymentEvidenceTerraformReferenceTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Deployment evidence listed `terraform-pilot` before composition roots — fixed by reordering to hosted validate/apply sequence (composition, leaves, orchestrator legacy, pilot default profile).
- [x] (proven) Deployment evidence omitted `infra/terraform-pilot` while listing other metadata-only composition roots — fixed by adding pilot as the first expected apply-order entry.
- [x] (invalid) ARM resource id is stored in the wrong Terraform attribute (name vs id) — zone file is static apply-order text only; no ARM id parsing.
- [x] (invalid) Module-wrapped resource is skipped so evidence omits a live ARM id — no Terraform module parsing in this zone.
- [x] (invalid) Parser treats a comment containing `resource_id` as a real binding — no HCL parser in this zone.

---

## Zone: ui-runs-list

- **id:** ui-runs-list
- **status:** open
- **impact:** low
- **aliases:** reviews list; runs list client
- **paths:** archlucid-ui/src/app/(operator)/architecture/reviews/RunsListClient.tsx
- **test-filter:** RunsListClient
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) List renders reviews from a workspace the operator is not scoped to — hub scope intentionally lists cross-project rows; no workspace field on `RunSummary`.
- [x] (invalid) Failed load still shows a previous tenant's cached rows — props-only client; loader clears runs upstream when hub load fails.
- [x] (invalid) Empty state is skipped so a spinner never ends after a 403 — no spinner in `RunsListClient`; 403 surfaces via `OperatorApiProblem` upstream.
- [x] (proven) Space on a compare checkbox bubbled to the row keyboard handler and opened the inspector — fixed by ignoring checkbox targets in `activateRowKeyboard` (matching click behavior).

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
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Topic markdown fetch follows an external URL instead of the in-app help route (retired: fetchHelpTopicMarkdown uses `/api/help/{slug}`)
- [x] Missing topic is rendered as a GitHub blob link (retired: not-found Î“Ã¥Ã† `/help`; doc-index has no github blob URLs)
- [x] Index lists topics the current role is not allowed to open (fixed: generate_doc_index no longer bleeds internal-runbook titles onto public slugs)
- [x] (proven) Fetched doc-index rows duplicate static quick links when the same URL appears under a different category or title — **hit 2026-08-23:** `mergeDocIndex` deduped only on `category|title|url`, so `/help/choose-your-next-step` rendered twice (Getting Started static + Go-to-Market fetched) and `/help/admin-diagnostics` showed both static and fetched titles.

---

## Zone: ui-webhooks-settings

- **id:** ui-webhooks-settings
- **status:** open
- **impact:** medium
- **aliases:** webhooks settings; outbound webhook ui
- **paths:** archlucid-ui/src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx; archlucid-ui/src/app/(operator)/integrations/webhooks/use-webhooks-settings.ts
- **test-filter:** WebhooksSettings
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Signing secret from a previous workspace remains visible after scope switch
- [x] Save succeeds in the UI when the API returned 403 (retired: create throws on !ok; success callout only after await)
- [x] Dry-run control posts to the live endpoint from the settings form (retired: no dry-run on create form; Send test uses /test)
- [x] (proven) In-flight webhook test or save state survives operator scope switch — **hit 2026-08-21:** scope `useEffect` cleared form rows but not `testingId`/`isSaving`; stale async completions could disable tests or show save success in the new workspace.
- [x] (proven) Stale subscription list from a previous workspace overwrites rows after scope switch — **hit 2026-08-23:** `load()` in `use-webhooks-settings.ts` lacked `scopeGenerationRef` guards; an in-flight `listAlertRoutingSubscriptions` completion could call `setItems` with the prior workspace's subscriptions after the operator switched scope.

---

## Zone: ui-host-gate

- **id:** ui-host-gate
- **status:** cooling
- **impact:** medium
- **aliases:** host gate; split site host
- **paths:** archlucid-ui/src/lib/host-gate.ts
- **test-filter:** host-gate
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (proven) Operator path is treated as marketing on the public host (or the reverse) — **hit 2026-08-23:** `/dashboard`, `/portfolio`, `/admin/*`, and other legacy bookmarks were absent from `LEGACY_OPERATOR_PATH_PREFIXES`, so split-host marketing requests stayed `next` instead of redirecting to the app origin.
- [x] (proven) Retired bookmark is not redirected and 404s instead of the shim — **hit 2026-08-23:** `/alert-routing` and hard-retired executive-dashboard bookmarks were not classified as operator paths; marketing host served its own 404 chrome instead of forwarding to the app 404 shim.
- [x] Split-site origin check allows the operator app origin as a public page Î“Ã‡Ã¶ fixed: `normalizeRequestHost` no longer strips ports; request Host must match `URL.host` from configured origins (localhost:3000 vs :3001)

2026-08-23 dry hunt #48: no open hypotheses; `host-gate.test.ts` (10) passes on split-host redirect matrix.

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
- **status:** open
- **impact:** high
- **aliases:** stripe webhook; marketplace webhook; billing webhook replay
- **paths:** ArchLucid.Api/Controllers/Billing/BillingStripeWebhookController.cs; ArchLucid.Api/Controllers/Billing/BillingMarketplaceWebhookController.cs; ArchLucid.Application/Budgeting/LlmTenantWalletStripeWebhookProcessor.cs; ArchLucid.Persistence/Billing/MemoryCacheBillingWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~BillingStripeWebhook|FullyQualifiedName~BillingMarketplaceWebhook|FullyQualifiedName~LlmTenantWalletStripeWebhook|FullyQualifiedName~MemoryCacheBillingWebhookReplayGuard
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Replay guard treated event-id case variants as distinct keys — fixed by normalizing event ids to lowercase in cache keys.
- [x] (proven) `TryRegisterEventAsync` allowed duplicate concurrent registrations — fixed with atomic `ConcurrentDictionary` claims like ITSM replay guard.
- [x] (invalid) Tenant resolution lives in `AzureMarketplaceBillingProvider`; verified JWT claim precedence is intentional when `TenantIdClaimType` is configured.
- [x] (invalid) Stripe and Marketplace controllers return 400 BadRequest when provider rejects invalid signatures.

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
- **status:** open
- **impact:** high
- **aliases:** SAML; trial JWT; SCIM bearer; OIDC auth stack
- **paths:** ArchLucid.Api/Auth/; ArchLucid.Core/Auth/Saml/
- **test-filter:** FullyQualifiedName~Saml|FullyQualifiedName~LocalTrialJwt|FullyQualifiedName~ScimBearer
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — SAML scope claim promotion skipped when IdP attribute type casing differed from configured claim type
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) SAML metadata parser accepts an entity id that does not match the configured IdP — no separate configured IdP entity id; host SAML binds `AllowedIssuer` from fetched metadata `entityID` (`ArchLucidSaml2IdpMetadataBinder.ApplyResolvedEntity`)
- [x] (valid-no-repro) Trial JWT is accepted after the trial window has expired — trial expiry enforced by `TrialLimitGate` on mutating policies; JWT `exp` is access-token lifetime by design (`LocalTrialJwtIssuer`, `TrialLimitAuthorizationHandler`)
- [x] (invalid) SCIM bearer token for tenant A authorizes provisioning writes for tenant B — Argon hash is tenant-salted (`ScimArgonSecretHasherTests.VerifySecret_wrong_tenant_salt_returns_false`); scope uses `tenant_id` claim over headers (`HttpScopeContextProviderTests.GetCurrentScope_prefers_jwt_claim_over_header`)
- [x] Future `auth_time` / `iat` passes step-up as recent authentication (`RecentAuthenticationEvaluator.HasRecentAuthentication`) — fixed: reject negative age; regression in `HasRecentAuthentication_returns_false_for_future_auth_time`
- [x] (proven) SAML inbound scope claims (`tenant_id`, `workspace_id`, `project_id`, `oid`) not promoted when configured source claim type casing differs from assertion — **hit 2026-08-23:** `PromoteSingleValueIfMissing` used case-sensitive `FindFirst` while role promotion was case-insensitive; aligned lookup in `ArchLucidSamlInboundClaimsNormalizer`.

---

## Zone: tenant-data-export

- **id:** tenant-data-export
- **status:** open
- **impact:** high
- **aliases:** tenant export; run export; export SSRF
- **paths:** ArchLucid.Application/Exports/; ArchLucid.Api/Controllers/Authority/ExportsController.cs; ArchLucid.Api/Controllers/Authority/ArchitectureExportController.cs; ArchLucid.Api/Controllers/Authority/RunsExportController.cs; ArchLucid.Core/Security/AllowedRunExportBlobDestinationUrlPolicy.cs
- **test-filter:** FullyQualifiedName~ArchitectureReviewExport|FullyQualifiedName~ExportsController|FullyQualifiedName~AllowedRunExportBlobDestinationUrlPolicy
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — sponsor packet deterministic report undercounted high-severity findings
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Export includes runs or findings from a workspace outside the caller scope — fixed: `ExportsController` binds export records to scoped `GetRunDetailAsync` before read/compare/replay
- [x] (proven) Sponsor review packet export succeeds for in-progress or broken-manifest runs — **hit 2026-08-19:** `SponsorReviewPacketBuilder` omitted `IsCommitted` / `HasBrokenManifestReference` guards used by other export services.
- [x] (proven) Sponsor review packet deterministic report undercounts high-severity findings — **hit 2026-08-23:** `BuildDeterministicSponsorReport` compared `Severity.ToString()` to `"High"` but `FindingSeverity` uses `Error` for the high band; aligned with `RunSummaryOnePagerDocumentFactory` mapping.
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
- **hunts:** 6
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — stale-running watchdog skipped MaxRetries=0 jobs and did not re-notify the durable queue after reclaim
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (proven) Job dequeue runs work without re-binding tenant scope from the job payload — `BackgroundJobWorkUnitExecutor` resolves scope via `BackgroundJobWorkUnitScopeResolver` and pushes `AmbientScopeContext` before run-scoped reads
- [x] Leader-elected hosted service runs the same outbox drain on every replica â€” retired: intentional when `HostLeaderElection:Enabled` is false; default is enabled
- [x] Stuck-running watchdog marks a healthy job failed and it is retried into duplicate side effects â€” fixed stale threshold to exceed processor visibility (2026-08-17)
- [x] (proven) MarkCanceledAsync on a pending in-memory job still runs after dequeue — `InMemoryBackgroundJobQueue` overwrote `Canceled` with `Running` when the channel item was processed; fixed by skipping canceled and non-runnable states before execution (2026-08-23)
- [x] (proven) Integration event DLQ auto-retry never requeues eligible dead letters when permanently failed rows fill the first list cap — **hit 2026-08-23:** `IntegrationEventDlqRetryBackgroundWork` listed only the first 100 dead-letter rows; 100 newer permanently failed rows hid an eligible older row from `ResetDeadLetterForRetryAsync`
- [x] (proven) `MarkCanceledAsync` on a running in-memory job is overwritten by late executor success — **hit 2026-08-23:** `ExecuteAsync` persisted `Succeeded` without re-checking `BackgroundJobState.Canceled` after `ExecuteAsync` returned
- [x] (proven) Stale-running watchdog never reclaims `MaxRetries=0` export jobs (`RetryCount < MaxRetries` is always false) and leaves reclaimed `Pending` rows without Azure queue notifications — **hit 2026-08-23:** `ResetStaleRunningJobsOlderThanAsync` now allows the zero-retry crash reclaim path, marks exhausted rows `Failed`, and `BackgroundJobStuckRunningWatchdogBackgroundWork` re-sends queue notifications for pending reclaims

---

## Zone: itsm-inbound-webhooks

- **id:** itsm-inbound-webhooks
- **status:** open
- **impact:** high
- **aliases:** ITSM webhook; ServiceNow inbound; connector secret
- **paths:** ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs; ArchLucid.Application/Integrations/Itsm/; ArchLucid.Persistence/Integrations/MemoryCacheItsmInboundWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~ItsmInboundWebhook
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Stale ITSM correlation with missing finding row returned HTTP 400 — fixed by acknowledging (`Accepted=true`) while still emitting tenant-scoped rejected audit.
- [x] (candidate) Webhook accepted when the shared secret does not match the connector config - invalid: WebhookSecrets.SecureEquals rejects before parse
- [x] (proven) Replay guard allows duplicate delivery of the same event id — **hit 2026-08-20:** `MemoryCacheItsmInboundWebhookReplayGuard.TryClaimAsync` used `IMemoryCache.GetOrCreate`, whose factory can run twice under concurrency; event ids were also case-sensitive so `delivery-1` and `DELIVERY-1` bypassed dedupe
- [x] (candidate) Inbound payload is applied to a tenant inferred from the body instead of the authenticated connector - fixed: tenant-scoped routes use TryGetByExternalKeyForTenantAsync
- [x] (proven) Authenticated ITSM webhook with malformed JSON body surfaces `JsonException` as HTTP 500 — **hit 2026-08-23:** `ItsmInboundWebhooksController` called `JsonDocument.Parse` after shared-secret verify with no `JsonException` guard; valid token + non-JSON body returned 500 instead of 400

---

## Zone: ui-auth-proxy

- **id:** ui-auth-proxy
- **status:** open
- **impact:** high
- **aliases:** UI auth; API proxy; edge proxy
- **paths:** archlucid-ui/src/lib/auth/; archlucid-ui/src/app/api/proxy/; archlucid-ui/src/proxy.ts
- **test-filter:** lib/auth|proxy-route|proxy.ts
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (candidate) Proxy forwards operator cookies or auth headers to a marketing-only upstream path - invalid: server bearer stripped on allowlisted marketing paths; cookies are not copied upstream
- [x] (candidate) Return-destination helper accepts an external URL that bypasses host-gate - invalid: `isSafeReturnPath` rejects external URLs; host-gate runs on next navigation
- [x] (proven) Anonymous marketing proxy path can reach a mutating operator API route via literal `..` segments - fixed: reject `..`/`.` proxy segments before upstream fetch
- [x] (proven) `buildProxyUpstreamPath` — `%2e%2e` proxy segments decode to `..` during URL normalization and reach `architecture/draft/*` while literal `..` segments are rejected
- [x] (proven) Double-encoded `%252e%252e` proxy segments bypass the `%2e` substring guard and still reach operator draft routes from anonymous marketing paths
- [x] (proven) Post-sign-in return URLs accept embedded protocol-relative segments — **hit 2026-08-21:** `isSafeReturnPath` only rejected leading `//` and percent-decoded three passes, so `/x%2F%2Fevil.example` and quadruple-encoded `//` payloads passed through `signInHasReturnDestination`.
- [x] (proven) Nine-level `%2e%2e` proxy segments bypass the eight-pass decode guard and still normalize onto `architecture/draft/*` while `isAnonymousMarketingProxyPath` skips bearer auth — **hit 2026-08-23:** reject proxy segments and return paths that remain percent-encoded after the decode guard.

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
- **status:** open
- **impact:** high
- **aliases:** content safety guard; prompt injection sanitizer; agent evidence untrusted input
- **paths:** ArchLucid.AgentRuntime/Safety/; ArchLucid.AgentRuntime/PromptInjection/
- **test-filter:** FullyQualifiedName~AzureContentSafetyGuard|FullyQualifiedName~AgentEvidenceUntrustedInputSanitizer|FullyQualifiedName~PromptInjection
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (valid-no-repro) Content safety guard maps a blocked category to allow on SDK failure — intentional fail-open when `FailClosedOnSdkError=false` (`AzureContentSafetyGuardSdkFailureTests`).
- [x] (proven) Untrusted evidence delimiter is stripped so injection payload reaches the model prompt — embedded `</untrusted_input>` / `<untrusted_input>` broke the outer wrapper; fixed with ZWSP tag neutralization in `AzureResourceTagPromptSanitizer`.
- [x] (valid-no-repro) Sanitizer runs after the prompt is assembled instead of before — `ArchitectureRunExecuteOrchestrator.AgentLoop` calls `SanitizeAsync` before `agentExecutor.ExecuteAsync`.

---

## Zone: application-analysis

- **id:** application-analysis
- **status:** open
- **impact:** medium
- **aliases:** architecture analysis; compare quality delta
- **paths:** ArchLucid.Application/Analysis/
- **test-filter:** FullyQualifiedName~ArchitectureAnalysis|FullyQualifiedName~CompareQuality
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Analysis compares runs from different tenants when scope keys collide — rollup/compare loads runs via `IRunDetailQueryService` + `ScopeContext`; manifest reads are tenant-scoped; export records key on globally unique run GUIDs
- [x] (candidate) Quality delta treats a failed run as higher quality than a succeeded run — **fixed 2026-08-18:** missing knowledge model substituted empty model, zeroing uncovered-mandatory "after" counts
- [x] (proven) Compare summary omits manifest datastore/relationship diffs that exist in the source run — **fixed 2026-08-23:** `MarkdownEndToEndReplayComparisonSummaryFormatter` only listed services/controls while `EndToEndReplayComparisonExportService` already surfaced datastores and relationships
- [x] (proven) `CompletionStateDiffers` false when both runs completed at different times — **hit 2026-08-23:** `BuildRunDiff` only set the flag for null-vs-non-null `CompletedUtc`; export showed "Completion State Differs: No" while `ChangedFields` listed `CompletedUtc`

---

## Zone: application-billing-logic

- **id:** application-billing-logic
- **status:** open
- **impact:** high
- **aliases:** marketplace billing; checkout mutation; billing application layer
- **paths:** ArchLucid.Application/Billing/
- **test-filter:** FullyQualifiedName~Marketplace|FullyQualifiedName~BillingCheckout|FullyQualifiedName~TenantLlmCostReporting
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Marketplace mutation handler applies a subscription change to the wrong tenant — `MarketplaceChange*WebhookMutationHandler` receives resolved `tenantId` from persistence; no alternate tenant lookup in Application layer.
- [x] (invalid) Checkout session is created without binding the caller tenant id — checkout session creation lives in `ArchLucid.Api/Controllers/Billing/` and `Persistence/Billing`, not `ArchLucid.Application/Billing/`.
- [x] (invalid) Idempotent replay of a billing event double-applies seat or credit changes — replay guard and `TryInsertWebhookEventAsync` are in `AzureMarketplaceBillingProvider` (Persistence), not Application mutation handlers.
- [x] (proven) `TenantLlmCostReportingService.BuildDashboardAsync` sets `ByWorkspaceProject[].WorkspaceName` from `tenant.Name` instead of the scoped workspace display name — operators see tenant label on workspace breakdown rows (fixed 2026-08-23; `TenantLlmCostReportingServiceTests`).
- [x] (proven) `TenantLlmCostTopRunRanker.RankAsync` lists runs via `ListRunsByProjectAsync(..., "default", ...)` so create flows that map `SystemName` onto the run project slug yield an empty Top Runs panel — fixed 2026-08-23; `TenantLlmCostTopRunRankerTests.RankAsync_includes_runs_whose_project_slug_is_not_default`.

---

## Zone: application-pilots

- **id:** application-pilots
- **status:** open
- **impact:** medium
- **aliases:** buyer proof pack; board pack; pilot artifacts
- **paths:** ArchLucid.Application/Pilots/
- **test-filter:** FullyQualifiedName~BuyerProofPack|FullyQualifiedName~BoardPack
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Proof pack includes findings from a workspace outside the pilot scope — `GetRunDetailAsync` and `ValueReportBuilder.BuildAsync` both honor current `ScopeContext`; no cross-workspace join in pack builders (`PilotReportCardService.EnsureScopeMatches` pattern elsewhere).
- [x] (candidate) PDF builder silently drops a section when source data is missing — **partial 2026-08-18:** snapshot fallback populated severity counts but left governed-coverage and top-finding unset (buyer proof / first-value surfaces)
- [x] (invalid) Pack builder uses cached tenant data after a scope switch — `BuyerProofPackBuilder` / `BoardPackPdfBuilder` do not use `IMemoryCache`; only `PilotOutcomeSummaryService` caches and keys include workspace id.
- [x] (proven) `PilotRunDeltaComputer` agent-results path counts operator-muted findings in severity buckets and can select a muted row as top finding while snapshot fallback and `FirstValueReportBuilder.FormatSponsorTopFindings` exclude `IsMuted` — buyer proof ZIP deltas JSON overstated suppressed findings (hunt 2026-08-23).

---

## Zone: agent-runtime-evaluation

- **id:** agent-runtime-evaluation
- **status:** open
- **impact:** medium
- **aliases:** agent evaluation; evaluation runner
- **paths:** ArchLucid.AgentRuntime/Evaluation/
- **test-filter:** FullyQualifiedName~Evaluation
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Evaluation runner scores a failed trace as passed — warn-only gate records parse failures without rejecting; pilot strict rejects unparsed output (`AgentOutputTraceQualityEvaluatorTests`).
- [x] (invalid) Runner uses a golden fixture from a different tenant's catalog — reference cases load from a single configured JSON path, not tenant-scoped catalogs (`AgentOutputReferenceCaseCatalog`).
- [x] (invalid) Batch evaluation swallows per-item failures and reports aggregate success — `AgentOutputEvaluationRecorder` evaluates each latest-per-task trace independently via `Task.WhenAll`.
- [x] (proven) Architecture finding confidence enrichment uses the first trace per agent type — **hit 2026-08-18:** `AgentArchitectureFindingConfidenceEnricher` keyed traces by `AgentType` instead of `TaskId`, so multiple tasks of the same agent type inherited the wrong schema/reference signals.
- [x] (proven) Findings snapshot confidence enrichment uses superseded or wrong trace — **hit 2026-08-19:** `FindingsSnapshotEvaluationConfidenceEnricher` grouped raw traces by `AgentType` and took `First()`, ignoring `AgentExecutionTraceLatestPerTaskSelector` and mis-scoring retried tasks.
- [x] (proven) PilotStrict sponsor evidence gate evaluates superseded auto-retry traces — **hit 2026-08-21:** `RunAgentOutputPilotEvidenceAggregator.WouldPilotStrictBlockSponsorEvidenceAsync` iterated all persisted traces; a rejected first attempt blocked sponsor evidence even when the latest retry passed PilotStrict.
- [x] (proven) Confidence enrichment ignores PilotStrict faithfulness rejection — **hit 2026-08-23:** `ComputeQualityGateAcceptedForConfidenceAsync` and both confidence enrichers evaluated traces without run evidence/faithfulness, so `schemaPassed` stayed true on outputs PilotStrict would reject for low agent-result faithfulness support.

---

## Zone: decisioning

- **id:** decisioning
- **status:** open
- **impact:** medium
- **aliases:** decisioning engine; findings merge; advisory alerts
- **paths:** ArchLucid.Decisioning/
- **test-filter:** FullyQualifiedName~Decisioning|FullyQualifiedName~FindingsMerge
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (valid-no-repro) Merge keeps conflicting findings from two agents without deduplication — `FindingSnapshotConfluentMerger` dedupes payload-equal partitions and emits `finding-merge-conflict` for payload-unequal keys; `FindingsOrchestratorTests.GenerateFindingsSnapshotAsync_payload_conflict_is_confluent`.
- [x] (proven) Advisory alert fires for a finding outside the run scope — **hit 2026-08-18:** `AlertEvaluator` / `AlertMetricSnapshotBuilder` did not filter `RecommendationRecords` by `context.RunId`.
- [x] (proven) Comparison security improvements emit false `SecurityRegression` advisory signals — **hit 2026-08-19:** `ImprovementSignalAnalyzer` treated any `SecurityDelta` status change as regression, including NonCompliant→Compliant and newly added controls.
- [x] (valid-no-repro) Compliance gate passes when required evidence nodes are absent — `GraphComplianceEvaluator` flags uncovered required nodes; golden path tests confirm.
- [x] (proven) `SecurityDeltaRegressionClassifier` treats negated compliant phrases as good status — **hit 2026-08-23:** substring match on `compliant` ranked `Not Compliant` and `Non Compliant` as rank 2, so Compliant→Not Compliant deltas emitted no `SecurityRegression` signal.

---

## Zone: persistence-identity

- **id:** persistence-identity
- **status:** open
- **impact:** high
- **aliases:** identity repository; authentication identity dapper
- **paths:** ArchLucid.Persistence/Identity/
- **test-filter:** FullyQualifiedName~AuthenticationIdentity|FullyQualifiedName~IdentityRepository
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Identity lookup by email returns a user from another tenant — `IAuthenticationIdentityRepository` has no email lookup; sign-in domain routing uses global domain keys by design.
- [x] (invalid) Link/unlink writes succeed without scoping to the caller tenant — persistence repos are record-oriented; caller tenant enforcement lives in application services.
- [x] (valid-no-repro) Cached identity read returns stale data after a tenant-scoped upsert — `CachingSecondaryReferenceDataRepositoryTests` proves eviction after upsert/insert for tenant IdP config and sign-in domains.
- [x] (proven) `InMemoryAuthenticationIdentityRepository.ReEnableAsync` reclaimed a disabled external key while another active identity already held it — **hit 2026-08-23:** in-memory store ignored the SQL filtered unique index (`UX_AuthenticationIdentities_ExternalKey WHERE DisabledUtc IS NULL`) and dual-activated the same external key.
- [x] (proven) `InMemoryTenantSignInEmailDomainRepository.FindByNormalizedDomainAsync` / `ListByTenantIdAsync` return soft-removed domains (`RemovedUtc` set) that `DapperTenantSignInEmailDomainRepository` excludes via `RemovedUtc IS NULL` — **hit 2026-08-23:** in-memory reads ignored soft-delete filter on all three query methods; dev/test routing could resurrect removed sign-in domains.

---

## Zone: retrieval

- **id:** retrieval
- **status:** cooling
- **impact:** medium
- **aliases:** retrieval indexing; embedding; pricing retrieval
- **paths:** ArchLucid.Retrieval/
- **test-filter:** FullyQualifiedName~Retrieval|FullyQualifiedName~Indexing
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (proven) Index query returns chunks from another tenant's corpus — **hit 2026-08-18:** Azure policy-pack OData filter omitted platform sentinel `tenantId`, allowing cross-tenant `PolicyPack` matches when `IncludePlatformCorpora` is on.
- [x] (valid-no-repro) Pricing estimate uses the wrong model tariff for the tenant plan — EA multiplier and cache keys are tenant-scoped; covered by existing pricing tests.
- [x] (valid-no-repro) Reindex job deletes vectors for the wrong workspace — `RetrievalIndexingService` validates scope and passes all four scope fields to delete.
- [x] (proven) Structure-aware chunker splits fenced code blocks mid-fence when the fence segment exceeds `maxChars` — **hit 2026-08-23:** `StructureAwareTextChunker` fell back to `SimpleTextChunker` on the whole fence segment, emitting chunks with a single orphan ``` marker; fixed by re-wrapping inner splits with opener/closer fences.

2026-08-23 dry hunt #49: no open hypotheses; chunker fence regression covered by `StructureAwareTextChunkerTests`.

---

## Zone: ui-oidc

- **id:** ui-oidc
- **status:** open
- **impact:** high
- **aliases:** oidc authority; sign-in routing; OIDC host
- **paths:** archlucid-ui/src/lib/oidc/
- **test-filter:** oidc-authority|oidc
- **hunts:** 10
- **bugs-found:** 11
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Authority host check accepts a look-alike domain as the configured issuer — locus is `archlucid-ui/src/lib/auth/oidc-authority-host.ts`, outside this zone; covered by `oidc-authority-host.test.ts`.
- [x] (valid-no-repro) OIDC redirect builds a return URL that leaves the operator origin — `storePostSignInReturnUrl` / `isSafeReturnPath` reject absolute, protocol-relative, and smuggled paths; covered by `session.test.ts` and `safe-return-path.test.ts`.
- [x] (invalid) Silent renew uses a stale authority after tenant IdP switch — `ensureAccessTokenFresh` reads `getOidcAuthority()` on each refresh; discovery cache is keyed by normalized discovery URL, not a frozen authority snapshot.
- [x] (proven) Scheme-less OIDC authority builds a relative discovery URL against the SPA origin — **hit 2026-08-23:** `discoveryUrlForAuthority` concatenated `/.well-known/...` without normalizing a missing scheme, so `fetch` resolved against the app origin; fixed by prefixing `https://` when the authority omits `://`.
- [x] (proven) `clearOidcSession` leaves a stale post-sign-in return URL for the next sign-in — **hit 2026-08-23:** session clears omitted `OIDC_POST_SIGN_IN_RETURN_URL_KEY`, so an aborted sign-in could redirect a later login to an old path; fixed by clearing the return-url key with the other OIDC session keys.
- [x] (proven) Failed OIDC discovery fetch is cached permanently — **hit 2026-08-23:** `loadDiscoveryDocument` stored rejected promises in `discoveryPromises`, so a transient 503/network error blocked all later sign-in, refresh, and logout discovery until a full page reload; fixed by evicting the cache entry in `.catch` before rethrowing.
- [x] (proven) Concurrent `ensureAccessTokenFresh` calls fire duplicate refresh requests — **hit 2026-08-23:** parallel API callers each entered `ensureAccessTokenFresh` without a single-flight guard, so the IdP rejected the second refresh (`invalid_grant`) and the catch-all handler called `clearOidcSession`, logging the operator out after an otherwise successful refresh; fixed by deduping in-flight refresh with a shared promise.
- [x] (proven) Non-numeric `OIDC_EXPIRES_AT_MS_KEY` bypasses expiry skew so `getAccessTokenForApi` returns a stale access token — **hit 2026-08-23:** `getExpiresAtMs` used `Number(raw)` without validating finiteness, so corrupted session storage (`"not-a-number"`) yielded `NaN` and `Date.now() >= NaN - skew` stayed false while `isLikelySignedIn` already returned false; fixed by treating non-finite parsed values as expired.
- [x] (proven) In-flight token refresh resurrects OIDC session after `clearOidcSession` — **hit 2026-08-23 hunt #34:** `ensureAccessTokenFresh` always called `persistTokenResponse` when the IdP refresh completed, so sign-out or idle-timeout clears that ran mid-flight wrote tokens back into `sessionStorage`; fixed by tracking a session generation counter bumped on clear and skipping persist/clear side effects for stale refreshes.
- [x] (proven) Stale in-flight refresh blocks token refresh for a replacement session after `clearOidcSession` — **hit 2026-08-23 hunt #36:** `clearOidcSession` bumped the generation counter but left `refreshInFlight` set, so the first `ensureAccessTokenFresh` on a new sign-in awaited the prior session's refresh instead of starting one with the new refresh token; fixed by clearing the in-flight guard when session keys are removed.
- [x] (proven) Transient OIDC refresh network failure clears the operator session — **hit 2026-08-23 hunt #41:** `ensureAccessTokenFresh` catch-all called `clearOidcSession` on any refresh rejection, so a flaky `Failed to fetch` during background renew wiped tokens while the refresh token was still valid; fixed by clearing only on OAuth auth failures (`invalid_grant`, 401/403) and leaving the session intact for network/5xx errors.
- [x] (proven) Stale refresh `finally` clears the replacement session's in-flight guard — **hit 2026-08-23 hunt #42:** `ensureAccessTokenFresh` always set `refreshInFlight = null` in `finally`, so when a prior-session refresh completed after `clearOidcSession` and a replacement refresh had started, the stale `finally` nulled the guard and parallel API callers fired a duplicate IdP refresh (`invalid_grant` risk); fixed by clearing `refreshInFlight` only when it still references the completing promise.
- [x] (proven) Negative `expires_in` from token response writes a past expiry and breaks the session — **hit 2026-08-23:** `persistTokenResponse` stored `Date.now() + negative expires_in`, so a malformed IdP payload left the access token immediately expired and could tight-loop refresh; fixed by falling back to the default lifetime for negative values while still honoring zero.
- [x] (proven) Missing `access_token` in token response persists the literal string `"undefined"` — **hit 2026-08-23:** `sessionStorage.setItem` coerced `undefined` to `"undefined"`, so `isLikelySignedIn` returned true and API calls sent `Bearer undefined`; fixed by rejecting empty or non-string access tokens before writing session keys.

---

## Zone: archlucid-core

- **id:** archlucid-core
- **status:** open
- **impact:** high
- **aliases:** core domain; security policies; tenancy models
- **paths:** ArchLucid.Core/
- **test-filter:** FullyQualifiedName~ArchLucid.Core
- **hunts:** 6
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) URL allow-list policy accepts a credential-bearing redirect target — **hit 2026-08-18:** outbound HTTPS URL policies allowed `https://user:pass@host` because only scheme/host were validated; embedded userinfo now rejected.
- [x] (proven) Teams trigger parse silently disables all notifications for unknown-only JSON — **hit 2026-08-20:** `ParseOrDefault` filtered unknown entries to an empty list instead of returning the documented all-on default when every stored trigger name was unrecognized
- [x] (valid-no-repro) Tenant scope model treats empty workspace as a wildcard — `ActivityScopeTags` rejects `Guid.Empty` workspace ids; no wildcard semantics in Core tenancy models.
- [x] (valid-no-repro) Configuration default enables a production-unsafe integration flag — ITSM/native and quick-scan defaults are gated by environment validators and hosted-SaaS overrides.
- [x] (proven) Integration webhook simulate rejects governance approval and alert-acknowledged aliases — **hit 2026-08-21:** `ResolveEventType` switch omitted `GovernanceApprovalApproved`, `GovernanceApprovalRejected`, and `AlertAcknowledged` PascalCase/kebab aliases while sibling triggers were wired; CLI simulate-webhook threw for those event names.
- [x] (proven) Tenant Azure OpenAI deployment catalog lookup is case-sensitive on JSON tier keys — **hit 2026-08-23:** `TenantAzureOpenAiDeploymentsCatalog.TryParse` returned a case-sensitive dictionary so `ResolveDeploymentName` missed `Default` / mixed-case tier keys and fell back to the raw tier name instead of the configured deployment; regression in `TenantAzureOpenAiDeploymentsCatalogTests`.
- [x] (proven) Governance promotion webhook sample omits `environment` and schema activation fields so Service Bus `promotion_environment` routing is never resolved — **hit 2026-08-23:** `CreateGovernancePromotionActivated` emitted `targetEnvironment` / `promotionRecordId` instead of the publisher contract (`environment`, `activationId`, `manifestVersion`, `activatedBy`, `activatedUtc`); regression in `GovernancePromotionActivated_webhook_sample_matches_schema_and_resolves_promotion_environment`
- [x] (proven) `IntegrationWebhookPayloadSamples.ResolveEventType` ignores `IntegrationEventTypes.MapToCanonical` for legacy `com.archiforge.*` vendor aliases — **hit 2026-08-23:** Service Bus dispatch and outbox priority map legacy strings but CLI simulate-webhook threw before payload creation; regression in `ResolveEventType_maps_legacy_vendor_alias_before_known_set_lookup`

---

## Zone: archlucid-contracts

- **id:** archlucid-contracts
- **status:** open
- **impact:** low
- **aliases:** API contracts; DTO serialization; OpenAPI models
- **paths:** ArchLucid.Contracts/
- **test-filter:** FullyQualifiedName~Contracts
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (valid-no-repro) JSON round-trip drops a required field on a versioned request DTO — `KeyContractsJsonRoundTripTests` and `JsonRoundTripPropertyTests` cover core request/run DTO shapes.
- [x] (proven) Enum serialization accepts an out-of-range value as the default variant — **hit 2026-08-19:** `ServiceType`, `DatastoreType`, `RuntimePlatform`, and `RelationshipType` JSON converters cast numeric ordinals without `Enum.IsDefined`; fixed on master in `47e7613370` (same pattern as `AgentType` in `4d4340387c`).
- [x] (invalid) Contract change breaks backward compatibility without a version bump signal — versioning is policy/process, not a deserialization defect in these converters.
- [x] (proven) `FindingSeverity` numeric ordinals bypass validation in eval-corpus and architecture-finding converters — `EvalCorpusFindingSeverityJsonConverter` and `ArchitectureFindingJsonConverter.ReadSeverity` cast out-of-range integers; fixed with `Enum.IsDefined` + regression tests.
- [x] (proven) Case-variant unknown sentinel bypasses structured-brief readiness — **hit 2026-08-21:** `IsUnknownConfirmSentinel` used ordinal string equality so `"unknown — confirm before review"` counted as a confirmed quality-attribute chip and could unblock review start under TB-2343.
- [x] (proven) Hyphen/en-dash unknown sentinel variants bypass structured-brief readiness — **hit 2026-08-23:** `IsUnknownConfirmSentinel` compared only case-normalized text, so `"Unknown - confirm before review"` (ASCII hyphen) and en-dash variants counted as confirmed brief entries and could satisfy `QualityAttributeMeetsMinimum`; fixed by normalizing dash glyphs before comparison.

---

## Zone: context-ingestion

- **id:** context-ingestion
- **status:** open
- **impact:** medium
- **aliases:** context ingestion; connector stages; canonicalization
- **paths:** ArchLucid.ContextIngestion/
- **test-filter:** FullyQualifiedName~ContextIngestion|FullyQualifiedName~Canonicalization
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Canonicalization drops tenant id from ingested connector payload — no tenant id in canonical objects; isolation is repository scope
- [x] (invalid) Stage pipeline continues after a failed validation with partial graph — parsers skip bad declarations by design with warnings, not a validation gate
- [x] (invalid) Duplicate external keys from two tenants collapse into one node — ingestion is per-project snapshot, not multi-tenant batch dedup
- [x] (proven) `InfrastructureDeclarationConnector.DeltaAsync` keys resources by `SourceId` (declaration id) so multiple resources in one declaration collapse in `SetDiffConnectorDeltaComputer` — fixed with composite `SourceId|ObjectType|Name` key
- [x] (proven) `ContextIngestionRequestMapper.FromArchitectureRequest` assigns fresh random `DocumentId` / `DeclarationId` on every map, so identical re-ingest reports false add/remove churn — fixed with `ContextIngestionStableReferenceIds` keyed by name + content type / format
- [x] (proven) `ContextIngestionStableReferenceIds` hashes `contentType` / declaration `format` case-sensitively while parsers and `SupportedContextDocumentContentTypes` accept casing variants — **hit 2026-08-23:** re-map with `TEXT/PLAIN` or `JSON` produced different stable ids and false connector add/remove deltas; fixed by lowercasing format/contentType in `StableId` hash input; regression in `ContextIngestionStableReferenceIdsTests` and `DocumentConnectorTests.DeltaAsync_ReMappedDocumentWithDifferentContentTypeCasing`

---

## Zone: knowledge-graph-provenance

- **id:** knowledge-graph-provenance
- **status:** open
- **impact:** medium
- **aliases:** knowledge graph; provenance; lineage
- **paths:** ArchLucid.KnowledgeGraph/; ArchLucid.Provenance/
- **test-filter:** FullyQualifiedName~KnowledgeGraph|FullyQualifiedName~Provenance
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Graph merge links a node to provenance from another tenant — `DefaultGraphBuilder` / `ProvenanceBuilder` build from a single scoped snapshot; tenant isolation is repository/query scope, not a merge defect in these files
- [x] (invalid) Lineage query traverses into a sibling tenant's artifact store — `ArchLucid.Provenance` query/build paths do not open cross-tenant artifact stores; persistence uses `ScopeContext` on snapshot reads/writes
- [x] (invalid) Provenance record is written without workspace scope — `SqlProvenanceSnapshotRepository` and `ProvenanceGraphAccessService` persist/query with `TenantId` + `WorkspaceId` + `ProjectId`
- [x] (proven) Topology projected-spend enrichment overwrites parsed constraint spend when property keys use non-canonical casing — **hit 2026-08-19:** `CostConstraintProjectedSpendEnricher.HasProjectedSpend` used case-sensitive `ContainsKey` while deserialized `GraphNode.Properties` can use PascalCase keys
- [x] (proven) Topology cost projection under-scales when instance-count property keys use PascalCase — **hit 2026-08-19:** `GraphTopologyInfrastructureCostNodes.ReadProperty` used case-sensitive `TryGetValue`, so `InstanceCount` on deserialized nodes defaulted quantity to 1
- [x] (proven) Explicit parent-child containment edges omitted when `parentNodeId` uses PascalCase on a case-sensitive property bag — **hit 2026-08-20:** `DefaultGraphEdgeInferer` used case-sensitive `Properties.TryGetValue` for `parentNodeId`, `connectedToNodeIds`, and targeted topology id keys
- [x] (proven) WAF alignment flag omitted when associated-findings property keys use PascalCase — **hit 2026-08-21:** `GraphMaterializationStages` read `associatedFindings` / `findings` from raw `CanonicalObject.Properties` with case-sensitive `TryGetValue` instead of the normalized node bag via `GraphNodePropertyReader`
- [x] (proven) Topology sensitivity misclassified when property keys use PascalCase on a case-sensitive bag — **hit 2026-08-23:** `TopologySensitivityClassifier` used case-sensitive `TryGetValue` for `topologySensitivity`, `category`, `publicNetworkAccess`, and `resourceType` instead of `GraphNodePropertyReader`

---

## Zone: notifications-pipeline

- **id:** notifications-pipeline
- **status:** open
- **impact:** medium
- **aliases:** notifications; email dispatchers beyond weekly summary
- **paths:** ArchLucid.Notifications/; ArchLucid.Application/Notifications/
- **test-filter:** FullyQualifiedName~Notifications|FullyQualifiedName~EmailDispatcher
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (invalid) Dispatcher sends to recipients outside the tenant membership list — no membership-validation locus in zone; callers supply mailboxes
- [x] (invalid) Template render includes another user's email in the body — zone Razor models carry URLs/metadata only, no cross-user mailbox fields
- [x] (invalid) Send failure is treated as success and suppresses retry — post-reservation ledger block is documented intentional (TB-089 / EMAIL_NOTIFICATIONS.md)
- [x] (proven) Weekly sponsor summary and report dispatchers share one idempotency key — **hit 2026-08-19:** `WeeklySponsorSummaryEmailDispatcher` reused `weekly-sponsor-report:{tenant}:{isoWeek}` so the summary email was skipped when the report sent first in the same ISO week
- [x] (proven) Weekly sponsor summary email subject still says "report" — **hit 2026-08-23:** `WeeklySponsorSummaryEmailDispatcher.TryDispatchAsync` copied subject/log strings from `WeeklySponsorReportEmailDispatcher` after the idempotency-key split; recipients saw "weekly sponsor report" on the summary email class

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
- **hunts:** 4
- **bugs-found:** 3
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-21
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Singleton service caches the first request tenant for the process lifetime — `CachingGovernanceDashboardService` keys cache entries with `HotPathCacheKeys.GovernanceDashboard(scope, tenantId, …)` per request scope
- [x] (invalid) Optional security service is not registered in production configuration — harm-class template; no single missing-security locus identified in composition partials
- [x] (invalid) Composition registers two implementations for the same tenant-scoped interface — `ISponsorReportRecipientLookup` is registered in both weekly modules with the same implementation type; MS.DI last registration wins without functional divergence
- [x] (proven) Weekly sponsor summary pipeline never wired into composition root — **hit 2026-08-19:** `RegisterWeeklySponsorSummaryServices` / worker infrastructure existed but were not called from `AddArchLucidApplicationServices`, so `IWeeklySponsorSummaryEmailDispatcher` was absent from DI
- [x] (proven) Weekly sponsor summary container offload has no `IArchLucidJob` — **hit 2026-08-20:** `RegisterWeeklySponsorSummaryWorkerInfrastructure` skips `WeeklySponsorSummaryHostedService` when `Jobs:OffloadedToContainerJobs` includes `weekly-sponsor-summary`, but `RegisterArchLucidJobRunners` never registered a matching job so container offload silently dropped delivery
- [x] (proven) Data-archival container offload drops agent trace blob cleanup — **hit 2026-08-21:** `RegisterAgentResultBlobCleanupHostedService` reused `ArchLucidJobsOffload.IsOffloaded(..., DataArchival)` so offloading `data-archival` unregistered `AgentResultBlobCleanupHostedService` even though no matching `IArchLucidJob` exists
- [x] (valid-no-repro) Orphan-probe container offload drops `OrphanProbeArchLucidJob` — `InMemoryStorageProviderRegistrar` / `SqlStorageProviderRegistrar` register `IArchLucidJob` before the hosted-service gate; `ContainerJobsOffloadRegistrationTests` offload parity (2026-08-23)
- [x] (valid-no-repro) Required-audit-trail-orphan-probe offload drops matching `IArchLucidJob` — same dual registration pattern as orphan-probe; `ContainerJobsOffloadRegistrationTests` (2026-08-23)
- [x] (valid-no-repro) Audit-change-feed offload with Cosmos audit enabled drops `AuditEventChangeFeedArchLucidJob` — `RegisterCosmosPolyglotPersistence` registers job after hosted-service gate; `ContainerJobsOffloadRegistrationTests` (2026-08-23)
- [x] (valid-no-repro) Logic App trial-email owner still registers `TrialLifecycleEmailScanHostedService` — `RegisterTrialLifecycleEmailHostedServices` gates on `TrialLifecycleEmailRoutingOptions.IsLogicAppOwnerMode`; `ContainerJobsOffloadRegistrationTests` (2026-08-23)

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
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — Admin integration outbox dead-letter list/retry/suppress/curl lacked tenant scope
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] Admin mutating endpoint lacks tenant binding on route parameters — (proven): `RunsController` request endpoints (2026-08-18); `AdminController.ArchiveRunsByIds` called global `ArchiveRunsByIdsAsync` without `GetByIdAsync(scope, …)` filter (2026-08-18); `AdminController.ArchiveRunsBatch` called global `ArchiveRunsCreatedBeforeAsync` without scoped cutoff filter (2026-08-22); `AdminDiagnosticsService` integration outbox dead-letter list/retry/suppress/curl called `IIntegrationEventOutboxRepository` without `scope.TenantId` (2026-08-23)
- [x] Authority read returns artifacts for a run in another workspace — fixed ComparisonsController scoped load (2026-08-17)
- [x] (valid-no-repro) Controller accepts a scope header that overrides the authenticated tenant — `ScopeIdentityBindingMiddleware` + `ScopeIdentityBindingIntegrationTests` (TB-072/TB-925) reject mismatched headers on Authority/Admin routes; `HttpScopeContextProvider` prefers claims over headers

---

## Zone: api-governance-tenancy-controllers

- **id:** api-governance-tenancy-controllers
- **status:** open
- **impact:** high
- **aliases:** governance controllers; tenancy controllers
- **paths:** ArchLucid.Api/Controllers/Governance/; ArchLucid.Api/Controllers/Tenancy/
- **test-filter:** FullyQualifiedName~GovernanceController|FullyQualifiedName~TenancyController
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) `PolicyPacksController.Publish` / `PolicyPacksAppService.TryPublishVersionAsync` — cross-tenant publish: caller scope tenant B + pack id owned by tenant A → HTTP 200 and version row upserted (reads already 404 on scope mismatch; publish omitted tenant/workspace/project check)
- [x] (invalid) Tenancy suspend endpoint affects a tenant id from the body not the principal — no suspend action under `ArchLucid.Api/Controllers/Tenancy/`
- [x] (invalid) List endpoint omits tenant predicate when workspace filter is empty — `PolicyPacksController.ListVisiblePacksAsync` always passes `scope.TenantId` into `ListByScopeAsync` (`WHERE TenantId = @TenantId`)
- [x] (proven) `PolicyPacksController.SimulateBulk` — pack id from another tenant scope → dry-run evaluates foreign pack content (only `IsDeleted` checked, not tenant/workspace/project vs `scope`) (2026-08-23)

---

## Zone: application-agents

- **id:** application-agents
- **status:** open
- **impact:** medium
- **aliases:** application agents; agent handlers wiring
- **paths:** ArchLucid.Application/Agents/
- **test-filter:** FullyQualifiedName~Application.Agents
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 12

### Hypotheses

- [x] (invalid) Agent invocation uses a default tenant when scope is missing — retired: `ExternalSubprocessorEngineAcknowledgmentService`, `EvidenceProposalPromoter`, and `AgentToolInvocationRecordWriter` throw when `TenantId` is empty
- [x] (invalid) Handler result is cached across tenants with the same run id — retired: no cross-run result cache in `ArchLucid.Application/Agents/` (only catalog cache invalidation)
- [x] (invalid) Agent registry resolves a handler without checking feature flags per tenant — retired: `RegisteredAgentHandlersInspector` lists DI handlers; execution routing lives outside this folder
- [x] (proven) Reasoning-only LLM cost slices report Unavailable basis when estimator returns null — `AgentExecutionTraceRunLlmCostAggregator.ComputeCore` early-return ignored reasoning token counts (fixed 2026-08-20)
- [x] (proven) Trace-derived tool forensics emit enum agent-type labels that disagree with structured ledger rows — `RunToolInvocationForensicsBuilder.BuildFromTraces` used `AgentType.ToString()` instead of `InferAgentTypeLabel(FormatToolName(...))`; regression in `Build_trace_derived_rows_use_tool_slug_agent_type_labels`
- [x] (proven) Engine provenance omits reasoning-only token totals — **hit 2026-08-23:** `ReviewRunEngineProvenanceAggregator.Aggregate` mapped only prompt/completion sums from the cost aggregator; o-series reasoning-only traces showed `EstimatedCostUsd` with null `TotalOutputTokens`; regression in `Aggregate_reasoning_only_traces_include_reasoning_tokens_in_output_total`

---

## Zone: application-governance-policy

- **id:** application-governance-policy
- **status:** open
- **impact:** medium
- **aliases:** policy packs; governance coverage; before-after diff
- **paths:** ArchLucid.Application/Governance/
- **test-filter:** FullyQualifiedName~PolicyPack|FullyQualifiedName~Governance
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (invalid) Policy pack diff includes rules from a seeded pack in another tenant — retired: `PolicyPackBeforeAfterDiffComposer` and `PolicyPackBeforeAfterConfigurationSnapshotBuilder` operate on in-memory pack content and findings passed in; `DefaultPolicyPackSeeder` uses tenant-scoped repositories
- [x] (invalid) Coverage calculator counts a waived finding as still open — retired: no coverage calculator in `Governance/`; waiver expiry uses `GovernanceWaiverExpiryWindow` / `GovernanceDecisionsNeededSummaryCalculator` distinct-finding union, not open-finding counts
- [x] (invalid) Default policy pack activation skips required approval metadata — retired: `DefaultPolicyPackSeeder` platform bootstrap calls `CreatePackAsync` / `PublishVersionAsync` / `AssignAsync` by design for bundled defaults, not operator approval flow
- [x] (proven) Policy-pack before/after snapshot marks advisory findings as blocking commit — `PolicyPackBeforeAfterConfigurationSnapshotBuilder` used severity-only check instead of `PreCommitGateResult.BlockingFindingIds` (fixed 2026-08-20)
- [x] (proven) Governance dry-run skips pre-commit enforcement for PascalCase metadata keys — **hit 2026-08-21:** `PolicyPackGovernanceDryRunService` read `blockCommitOnCritical` / `blockCommitMinimumSeverity` via case-sensitive `metadata.TryGetValue`, so JSON-deserialized metadata with `BlockCommitOnCritical` never activated the gate
- [x] (proven) Focused pilot execute-time snapshot excludes pinned organization packs that preview and commit capture include — **hit 2026-08-23:** `EffectiveGovernanceSnapshotBuilder` used `IsAllowedPackDisplayName` instead of `IsPackAllowedInFocusedReview`, dropping pinned org and platform-overlay packs from execute-time `PackAssignments`

---

## Zone: application-tenancy-lifecycle

- **id:** application-tenancy-lifecycle
- **status:** open
- **impact:** high
- **aliases:** tenant suspend; tenant migration; trial bootstrap
- **paths:** ArchLucid.Application/Tenancy/
- **test-filter:** FullyQualifiedName~Tenancy|FullyQualifiedName~TenantSuspend|FullyQualifiedName~TenantMigration
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Suspend leaves mutating API paths active for the tenant — retired: `TenantSuspendCommandService` persists suspend state; mutating-path enforcement lives in API middleware/filters outside this folder
- [x] (invalid) Migration copies rows without rewriting tenant id on child tables — retired: `TenantCatalogMigrationOrchestrator` coordinates suspend/projection refresh/verification; no catalog row-copy logic in `ArchLucid.Application/Tenancy/`
- [x] (invalid) Trial bootstrap creates resources under a host catalog tenant id — retired: `TrialTenantBootstrapService` scopes `AmbientScopeContext` to `result.TenantId` and uses `ContosoRetailDemoIds.ForTenant(result.TenantId)`
- [x] (proven) Migration verification passes without workspace/project scope on committed run candidate — `TenantMigrationVerificationProbe.RunAsync` omitted scope-id validation before scoped read probe (fixed 2026-08-20)
- [x] (proven) Projection refresh stage advances before `RefreshAsync` completes — `TenantCatalogMigrationOrchestrator.RunProjectionRefreshAsync` updated stage to `ProjectionRefresh` before calling refresh; failed refresh blocked retry and allowed `RunVerificationAsync` to skip incomplete refresh (fixed 2026-08-23)

---

## Zone: host-core-coordination

- **id:** host-core-coordination
- **status:** open
- **impact:** medium
- **aliases:** host coordination; export outbox; backfill
- **paths:** ArchLucid.Host.Core/Coordination/
- **test-filter:** FullyQualifiedName~Coordination|FullyQualifiedName~OutboxProcessor
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) `CosmosGraphSnapshotOutboxProcessor.ProcessEntryAsync` loads SQL with outbox `ScopeContext` but `CosmosGraphSnapshotRepository.SaveAsync` reads `IScopeContextProvider.GetCurrentScope()`; without `AmbientScopeContext.Push`, worker background drain tags Cosmos documents with dev-default tenant triple instead of the outbox entry scope — fixed 2026-08-20 (`CosmosGraphSnapshotOutboxProcessorTests.ProcessPendingBatchAsync_pushes_ambient_scope_before_cosmos_save`)
- [x] (invalid) Outbox processor pushes export blobs to a destination for the wrong tenant — `RunExportBlobPushOutboxProcessor` passes explicit `ScopeContext` into `IRunExportPackageBuilder.BuildAsync`; export path does not read ambient scope
- [x] (invalid) Backfill job replays events without idempotency keys — backfill lives under `ArchLucid.Persistence/Coordination/Backfill`, not this zone
- [x] (invalid) Coordination lease is not released and blocks all replicas — lease acquire/release is in SQL `DequeuePendingAsync`, not in `RecoverableOutboxProcessorBase` shell
- [x] (proven) `CosmosGraphSnapshotOutboxProcessor.VerifyOptions` mutates the bound `IOptions` instance (`configured.LeaseDurationSeconds = 60`) instead of returning a normalized copy like sibling processors; first drain permanently changes the DI-bound lease for later readers — fixed 2026-08-23 (`CosmosGraphSnapshotOutboxProcessorTests.ProcessPendingBatchAsync_clamps_short_lease_without_mutating_bound_options`)
- [x] (valid-no-repro) `PostCommitProjectionOutboxProcessor` dispatches `IacStubGeneration` without ambient scope so `FindingIacStubGenerator` reads dev-default tenant — ambient is pushed in `ProcessEntryAsync` before `DispatchWorkTypeAsync`; no repro on current code

---

## Zone: ui-operator-routes

- **id:** ui-operator-routes
- **status:** open
- **impact:** medium
- **aliases:** operator shell routes; operator pages
- **paths:** archlucid-ui/src/app/(operator)/
- **test-filter:** operator
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Architecture scorecard `usePilotScorecardPage.onSaveBaselines` PUT `/api/proxy/v1/pilots/scorecard/baselines` omitted `mergeRegistrationScopeForProxy` while reads use scoped `getPilotScorecard` — save lands on proxy dev-default tenant, refetch reads operator-selected tenant (save appears to no-op) — fixed 2026-08-20 (`use-pilot-scorecard-page.test.tsx`)
- [x] (proven) Baseline settings GET/PUT `/api/proxy/v1/tenant/baseline` omitted `mergeRegistrationScopeForProxy` — load/save hit proxy dev-default tenant instead of operator-selected scope (baseline appears not to stick after save) — fixed 2026-08-21 (`page.test.tsx` forwards operator scope headers when loading and saving tenant baseline)
- [x] (valid-no-repro) Stale react-query cache shows the previous tenant after scope switch — `usePilotScorecardQuery` scope-less key is a real gap on `/insights/architecture-scorecard`, but not reproved this hunt; sponsor/scorecard cache invalidation remains open if scope-switch stale data is reported
- [x] (invalid) Error boundary hides a 403 and renders an empty success state — no operator-route locus where a 403 is caught and replaced with empty success; compare/governance surfaces surface load failures explicitly
- [x] (proven) Billing wallet GET/PUT `/api/proxy/v1/billing/wallet` omitted `mergeRegistrationScopeForProxy` — load/save hit proxy dev-default tenant instead of operator-selected scope (wallet settings appear not to stick after save) — fixed 2026-08-22 (`OperatorBillingWalletPanel.test.tsx`)
- [x] (proven) Architecture intelligence `getJson`/`postJson` in `architecture-intelligence-client-api.ts` omitted `mergeRegistrationScopeForProxy` — product-run source-context load and reasoning POSTs hit proxy dev-default tenant instead of operator-selected scope (hydrated review context wrong or missing after scope switch) — fixed 2026-08-23 (`architecture-intelligence-client-api.test.tsx`)
- [x] (proven) `AdminEvidenceProposalsPageClient` GET `/api/proxy/v1/admin/evidence/proposals` and POST promote omitted `mergeRegistrationScopeForProxy` — list/promote hit proxy dev-default tenant instead of operator-selected scope (wrong tenant proposals shown or promote lands on wrong catalog) — fixed 2026-08-23 (`AdminEvidenceProposalsPageClient.test.tsx`)

---

## Zone: ui-marketing-surfaces

- **id:** ui-marketing-surfaces
- **status:** open
- **impact:** low
- **aliases:** marketing pages; pricing; trust center UI
- **paths:** archlucid-ui/src/app/(marketing)/
- **test-filter:** marketing
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Marketing form submits PII to the wrong API environment — Quick Scan and pricing quote POST through `/api/proxy/v1/marketing/...` (`proxy-route-anonymous-marketing.test.ts`, `QuickScanClient.tsx`).
- [x] (invalid) Pricing page shows an internal-only plan tier to anonymous visitors — anonymous pricing loads public `loadPricingDoc()`; no internal tier leak found in seed read.
- [x] (proven) Trust Center evidence pack ZIP href used raw `/v1/marketing/trust-center/evidence-pack.zip` instead of `/api/proxy/...` — Next.js has no rewrite; anonymous download links 404. Fixed `TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF`; regression in `trust-center-marketing.test.ts`.
- [x] (proven) Sponsor digest deep-link `mapResponse` defaulted `signInUrl` to `/auth/sign-in` (no route) when API omitted the field — workspace sign-in CTA on `/digest/sponsor` links 404 instead of `/auth/signin` — fixed 2026-08-21 (`exec-digest-sponsor-deep-link-server.test.ts`)
- [x] (proven) Marketing showcase page used raw `decodeURIComponent(runId)` and `encodeURIComponent(runId)` for API fetch — malformed `%` segments throw `URIError` (500) and encoded run keys double-encode for `/v1/marketing/showcase/{runKey}` — fixed 2026-08-23 (`showcase-page.test.tsx`)

---

## Zone: capabilities-cost-mcp

- **id:** capabilities-cost-mcp
- **status:** cooling
- **impact:** medium
- **aliases:** capabilities cost; MCP server; cost estimation
- **paths:** ArchLucid.Capabilities.Cost/; ArchLucid.Mcp/
- **test-filter:** FullyQualifiedName~Capabilities.Cost|FullyQualifiedName~Mcp
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Cost estimate uses list price when tenant has a negotiated discount — zone paths surface graph cost findings and MCP retrieval only; no negotiated-discount or list-price estimation logic exists here.
- [x] (invalid) MCP tool invocation lacks tenant scope binding — `McpRetrievalToolsController.SearchAsync` binds `TenantId`/`WorkspaceId`/`ProjectId` from `IScopeContextProvider`; `RetrievalTools` rejects `Guid.Empty` tenant.
- [x] (invalid) Cost module returns zero for an unknown SKU instead of failing closed — `ArchLucid.Capabilities.Cost` has no SKU lookup; `PriceRowLookupAsync` returns retrieval hits (empty when none), not a zero cost.
- [x] (proven) `RetrievalTools.SearchAsync` applies `CorpusKindFilter` after a TopK-limited search, dropping corpus-specific hits ranked below the search cap — **hit 2026-08-23 hunt #28:** `PriceRowLookupAsync` with `TopK=3` returned empty when the sole `AzureRetailPrice` hit ranked 13th; fixed by over-fetching to the 25-hit cap before post-filtering and then taking the requested TopK.

2026-08-23 dry hunt #47: no open hypotheses; TopK over-fetch regression covered by `RetrievalToolsTests.PriceRowLookupAsync_returns_retail_hits_when_they_rank_below_requested_topk`.

---

## Zone: ui-operator-lib

- **id:** ui-operator-lib
- **status:** open
- **impact:** medium
- **aliases:** operator lib; operator scope; operator API client
- **paths:** archlucid-ui/src/lib/operator/
- **test-filter:** lib/operator
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Operator API helper omits workspace scope on mutating requests — no mutating helpers under `operator/`; sole proxy GET uses `mergeRegistrationScopeForProxy` with full scope headers.
- [x] (proven) Cached operator context survives tenant switch — `hydrateOperatorShellStatusCaches` writes trial/homepage/stickiness/etc. to scope-agnostic TanStack keys; scope change did not clear them. Fixed via `clearOperatorShellStatusScopeAgnosticCaches` on `writeOperatorScopeToStorage` / `clearOperatorScopeStorage`.
- [x] (proven) Session stable shell cache survives tenant switch-back — `writeOperatorShellStableCache` kept prior-tenant snapshots in sessionStorage; switching away and back rehydrated stale trial/catalog/budget before bootstrap refetch. Fixed via `clearOperatorShellStableCache` on scope change (`operator-shell-status-scope-cache.test.ts`).
- [x] (invalid) Error mapper surfaces another tenant's problem detail in the toast — `operator-connectivity-error-present.ts` is stateless; no cross-request error cache in this directory.
- [x] (proven) Assigned-to-me findings compact presets missing from `OPERATOR_EMPTY_STATE_PRESET_KINDS` — three `GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_*_COMPACT` exports added without TB-1556 kind registration; `operator-empty-state-kind-presets.test.ts` failed on `GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT`. Fixed by registering `error` / `collection` / `filtered` kinds.
