> **Scope:** Contributor-reference — curated `/al-bug` hunt zones. Not a buyer or operator document. Agents must not invent extra zones in the same invocation; update this file after each hunt.

# `/al-bug` hunt ledger

Curated zones for **yield-ranked** defect hunting. The picker is `scripts/agent/al-bug-pick-zone.ps1` (not LLM ranking). Do **not** treat this as a static “always hunt topology first” list.

**Updated:** 2026-08-16 (arm-terraform-source-ids hit: Terraform ARM ids in tf.id / tf.resource_id).

## How to use

1. Run `.\scripts\agent\al-bug-pick-zone.ps1 -Preview` (add `-Hint '…'` when the user named an area; add `-Refresh` to recompute git churn).
2. Hunt **only** the returned zone’s `paths` / open hypotheses.
3. After the hunt, edit this file (the script does **not** write it):
   - **Hit:** increment `hunts` and `bugs-found`; set `consecutive-dry-hunts` to `0`; set `last-hunt` and `last-bug` to today (`YYYY-MM-DD`); tick the proven hypothesis.
   - **Dry:** increment `hunts` and `consecutive-dry-hunts`; set `last-hunt` to today; tick attempted hypotheses (or retire invalid ones). Do not invent another bug in the same files.
   - **Reopened:** when JSON `reopened` is `true`, set `status` back to `open`.

## Scoring (picker)

```text
score =
  3 × historical_yield          (bugs/hunts; floor 0.5 when hunts = 0)
+ 2 × recent_churn              (min(3, commitCount since last-hunt))
+ 2 × open_hypotheses           (unchecked - [ ] rows)
+ 1 × related_PD_or_TB          (min(2, id count))
− 2 × consecutive_dry_hunts
```

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
- **test-filter:** FullyQualifiedName~TopologyProposalRelationshipEdgeMapperTests
- **hunts:** 1
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-16
- **last-bug:** 2026-08-16
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] ARM resource id indexed in the endpoint index but not resolved by the edge mapper
- [ ] Terraform SourceId claimed in merge but missing from alias resolution
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
- **paths:** ArchLucid.Application/Runs/Orchestration/CommitOutputIntegrityService.cs
- **test-filter:** FullyQualifiedName~AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] Integrity check accepts a payload whose declared artifact hashes do not match committed bytes
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
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] Post-processor rewrites a datastore to `storage` while the consistency gate still keys it as `data`
- [ ] Consistency gate drops a relationship the post-processor just added
- [ ] Category rewrite does not update synthetic `ds-` aliases

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
