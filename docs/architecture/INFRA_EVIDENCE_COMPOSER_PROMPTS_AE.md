> **Scope:** Copy-paste prompts **AE-01–AE-10** and **CW-01**. Index: [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). Contract: [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md). Pack #24: [`../library/POLICY_PACK_ARC_AMPE_DESIGN.md`](../library/POLICY_PACK_ARC_AMPE_DESIGN.md).

# AE / CW — ARC-AMPE audit evidence (snapshot consumer) and crosswalk

**There is no second Azure collector.** Selectors read `AzureInventorySnapshot`. Pack #24 remains architecture-review themes, not this plane.

**Invariant:** AI explains evidence; AI is not the evidence. Automated evaluation ≠ auditor conclusion. Readiness ≠ compliance.

---

# AE-01 — Audit domain model and catalog ingest

**Depends on:** plane · **Branch:** `cursor/audit-framework-catalog-ingest-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: persist AuditFramework, AuditControl, and ingest of an authoritative versioned control specification. Do NOT invent ARC-AMPE control text or evidence requirements. Azure-specific collection comes later as selectors over snapshots, not as invented CMS rules.

Why: Pack #24 maps architecture themes and forbids CMS conformity / SSPP / attestation. This plane is assessment evidence. dbo.AuditEvents is the platform operator log — do not reuse those tables.

Do not: hard-code control catalogs in C#; copy Volume II into the repo; call this CMS certification; merge into PolicyPackContentDocument.

Read: POLICY_PACK_ARC_AMPE_DESIGN.md (disclaimer invariants — copy the honesty, not the rules JSON); plane §§2, 6.

Work:
1. AuditFramework: FrameworkId, Name, Version, Publisher, EffectiveDate, SourceReference, Status, content hash of imported spec.
2. AuditControl: ControlId, FrameworkId, ControlNumber, Title, Description, Objective, Applicability, ControlType, ParentControlId, EvaluationGuidance, Metadata key/value. EvidenceRequirements are AE-02 rows, not a giant JSON column if they are queryable.
3. Import API: ExecuteAuthority, JSON (and YAML if cheap). Reject import without Version + SourceReference. Store original spec blob + hash. Controls are immutable for that FrameworkVersion; new import = new version.
4. Tests: import fixture with 3 fake “EXAMPLE” controls (not real CMS text); second import with same version+hash is idempotent; different hash same version rejected; tenant isolation; disclaimer test that buyer-facing strings you add do not say “certified” or “auditor conclusion.”
5. Document: this catalog is supplied by the customer/owner; engineering fixtures are synthetic.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: versioned catalogs ingest; no invented ARC-AMPE controls in product data.
```

---

# AE-02 — Evidence requirements and snapshot selectors

**Depends on:** AE-01, IE-03 · **Branch:** `cursor/audit-evidence-selectors-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: AuditEvidenceRequirement rows plus AuditEvidenceSelector registry. Selectors DECLARE CollectorId, Version, EvidenceTypesProduced, RequiredAzurePermissions, SupportedResourceTypes, API versions, CollectionMethod, ExpectedCost/Duration, FreshnessCharacteristics — but they READ AzureInventorySnapshot (and optional extra columns added to the SHARED snapshot in IE-02). They must not new up ARM HTTP clients.

If a requirement needs a property the snapshot lacks, add it to the shared extractor schema (follow IE-02) and stop. Do not create Get-ArchLucidArcAmpePackage.ps1.

Do not: collect categories not required by the imported catalog for this assessment; collect secrets because Graph/ARM exposes them; Entra Global Reader.

Read: plane §§1, 6; IE-02 collector files (consume, don’t fork).

Work:
1. EvidenceRequirement: ControlId, Name, Description, EvidenceType, RequiredAzureScopes/ResourceTypes, CollectionMethod, Frequency, EvaluationMethod, ManualEvidenceAllowed, RequiredFreshness, AutomationClass FullyAutomatable|PartiallyAutomatable|Manual|NotApplicable|Unsupported.
2. Selector interface IAuditEvidenceSelector.Select(snapshot, requirement) → evidence candidates + gaps. Registry of selectors (identity/RBAC/network/data/logging/governance/posture/resilience/inventory) enabled only when the assessment’s catalog references those EvidenceTypes.
3. Permissions documented per selector; if snapshot lacks Entra/PIM/CA/Defender rows, return CollectionStatus=Unsupported or Insufficient, not fake data.
4. Tests: catalog without logging requirements does not invoke logging selector; missing property → Insufficient not pass; architecture test: no new IHostedAzureArmReadClient in an Audit* namespace.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
Done when: requirements exist; selectors only read snapshots; unused categories are not scraped.
```

---

# AE-03 — Control-to-evidence mapping and deterministic evaluation

**Depends on:** AE-02 · **Branch:** `cursor/audit-control-evaluation-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: for each imported control, record what evidence is required, what was selected, automation class, deterministic evaluation, explainability. Incomplete → INSUFFICIENT EVIDENCE. Never infer compliance. Never write HumanDisposition from LLM.

Example shape (automated evaluation text, not auditor conclusion): “73/74 applicable resources satisfy the technical requirement. Exception EX-174 on resource ABC. Technical evidence supports implementation with one approved exception.”

Do not: fabricate missing evidence; set auditor conclusion; call the result a compliance score.

Work:
1. Mapping pipeline: Control → EvidenceRequirement → Selector → snapshot rows → AuditEvidence → Evaluation record (pass counts, exception ids, confidence, ProvenanceKind=DeterministicInference).
2. Explainability persisted (not only logs): requirement ids, snapshot id, resource counts, exception ids, formula.
3. HumanDisposition and Notes are separate columns, default unset.
4. Tests: one failing resource + approved exception → evaluation text includes exception; zero evidence → INSUFFICIENT EVIDENCE and no Pass; AI mock cannot write HumanDisposition.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: insufficient evidence is first-class; evaluation is deterministic and distinct from auditor conclusion.
```

---

# AE-04 — Immutable audit evidence snapshots

**Depends on:** AE-02, IE-03 · **Branch:** `cursor/audit-evidence-snapshot-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: AuditEvidenceSnapshot as a point-in-time, append-only collection run for an AuditAssessment. It REFERENCES AzureInventorySnapshotId(s) plus selected evidence hashes. Never overwrite prior audit evidence with current Azure state.

Do not: store a second copy of the entire ARM inventory if the inventory snapshot already has it — point at it. Distinct from AzureInventoryBaseline (IE-07) and ArchitectureVersions.

Work:
1. AuditAssessment: FrameworkId+Version, TenantId, Scope, period start/end, Status, RequestedBy.
2. AuditEvidenceSnapshot: SnapshotId, AssessmentId, SubscriptionIds, CollectionStarted/CompletedUtc, Collector/SelectorVersions, FrameworkVersion, ControlCatalogVersion, Completeness, Failures, Warnings, EvidenceHash (root), InventorySnapshotIds.
3. AuditEvidence items: requirement id, CloudResourceId, types, CollectedUtc, collector version, raw + normalized pointers, EvidenceHash, CollectionStatus, FreshnessStatus (AE-05 may compute), Confidence. Provenance: when, how, selector version, Azure scope, API/query id, raw pointer.
4. Cryptographic hash of artifacts (SHA-256). Tests: mutating blob without new snapshot fails a verify API; second collection = new SnapshotId.
5. Read modes: current, assessment-period, historical, baseline (named audit baseline ≠ infra baseline).

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: evidence is immutable and hashed; inventory snapshot is referenced, not duplicated as a giant JSON.
```

---

# AE-05 — Evidence freshness

**Depends on:** AE-04 · **Branch:** `cursor/audit-evidence-freshness-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: classify evidence Current/Fresh/Aging/Stale/Expired/Unknown from AuditEvidenceRequirement.RequiredFreshness. Never silently reuse stale evidence as current-assessment green. Scheduled refresh = new inventory snapshot (existing auto-pull, default off) then new AuditEvidenceSnapshot — not an overwrite.

Work: dashboard counts (fresh/stale/missing/recollect/manual). Current assessment evaluation must exclude Stale/Expired or mark Insufficient. Unknown if timestamp missing. Tests: stale row cannot produce a passing current evaluation; historical read still returns the stale row labeled.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: freshness is a gate, not a badge.
```

---

# AE-06 — Audit readiness (not a compliance score)

**Depends on:** AE-03, AE-05 · **Branch:** `cursor/audit-readiness-score-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: AUDIT READINESS independent from technical evaluation. Do not conflate “we satisfy the control” with “we can demonstrate it.” Do NOT name the aggregate a compliance score unless the imported catalog defines that math (it will not in fixtures).

Per control: Applicability, Evidence Required/Collected, Freshness, Completeness, Automated Evaluation, Manual required, Exceptions, Outstanding Actions.
Aggregates: applicable, fully/partially/lacking evidenced, stale, requiring human evidence, technically failing, approved exceptions, ready for auditor review.
Copy: pack #24 honesty — not CMS conformity. UI labels “Audit readiness” / “Technical evaluation” separately.

Tests: control with passing eval but stale evidence is not “ready for auditor review”; strings “compliance score” absent unless catalog flag set.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: readiness and evaluation are separate; no fake compliance score.
```

---

# AE-07 — Manual and hybrid evidence

**Depends on:** AE-01 · **Branch:** `cursor/audit-manual-hybrid-evidence-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: human evidence (policies, procedures, approvals, tickets, training, risk assessments, ADRs, IR docs, change records, screenshots, external attestations) plus hybrid: Azure snapshot evidence + human + ArchLucid architecture evidence (sealed review, ADR). LLM cannot manufacture organizational documents.

Work: Owner, SubmittedBy, SubmittedUtc, ApplicablePeriod, Expiration, DocumentVersion, EvidenceHash, ReviewStatus. Reuse blob/evidence package storage. Link ITSM correlations when present. Expired human evidence follows AE-05. Tests: LLM path cannot INSERT a policy row; hybrid control lists all three source kinds; tenant isolation.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
Done when: humans can attach hashed artifacts; models cannot mint them.
```

---

# AE-08 — Auditor evidence package

**Depends on:** AE-04, AE-07 · **Branch:** `cursor/audit-evidence-package-export-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: reproducible ZIP/folder export:

/ARC-AMPE-{assessment}/ Executive-Summary.md Scope.md Collection-Methodology.md Evidence-Completeness.md Exceptions.md Controls/CONTROL-*/ (Control-Summary, Evidence-Index, Automated-Evidence, Manual-Evidence, Exceptions, Evaluation.md) Raw-Evidence/ Normalized-Evidence/ Collection-Manifest.json Evidence-Hashes.json

Human-readable + machine manifest. Regenerating from the store must match hashes. Evaluation.md = automated evaluation + gaps, never auditor sign-off. Pin framework/collector/snapshot versions. Honesty: not CMS conformity. Reuse ArtifactSynthesis packaging. If ITenantBrandingService exists, branded cover/header (BR-06); else ArchLucid defaults.

Tests: golden hash for a fixture assessment; missing evidence listed not filled; simulator/real collection method labeled.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
Done when: package is a projection of the store; hashes verify.
```

---

# AE-09 — Continuous readiness on inventory diff

**Depends on:** IE-06, IE-13, AE-04 · **Branch:** `cursor/audit-continuous-reeval-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when a new AzureInventorySnapshot is materialized (extractor auto-pull or upload), run IE-06 vs prior snapshot, invalidate affected AuditEvidence hashes, re-evaluate affected controls only. Timeline states are technical: TechnicallySupported → DriftDetected → AtRisk → RemediationInProgress → Verified → TechnicallySupported. Do not name them COMPLIANT in product copy unless the imported catalog defines that term.

Detect: stale evidence, technical eval fail, resource in/out of scope, exception expired, evidence disappeared, policy/RBAC/network/security changes (IE-06 ChangeTypes).

Handoff: evaluation fail → OperationalSecurityFinding (IE-09 ingest, SourceSystem=ArchLucid.AuditEval) → ExactMatch approved pattern → RemediationInstance (nullable AssessmentId/ControlId) → verify on NEXT inventory snapshot → new AuditEvidenceSnapshot → re-eval. Full provenance. Still no terraform apply.

Tests: public-IP add invalidates a network-exposure requirement and flags the control; unrelated tag-only change does not re-eval all controls; stale reuse still forbidden for current assessment.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: diff drives reassessment; remediation is the existing factory; no second collector cron dump.
```

---

# AE-10 — Evidence lineage (chain of custody)

**Depends on:** AE-03, IE-04 · **Branch:** `cursor/audit-evidence-lineage-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: every positive audit checkbox is clickable. GET lineage:

AuditControl → EvidenceRequirement → AutomatedEvaluation → AuditEvidence (normalized) → CloudResourceId → raw API/query blob → CollectedUtc → selector/collector version.

If an auditor asks why ArchLucid believes the control is supported, this chain is the answer — not “the AI determined it.” Optional AI explanation is a narration of these ids (AiInference) and must fail if any link is missing.

UI: Operate audit control detail; green check opens the chain. Insufficient evidence shows the broken link.

Tests: fixture with 2 resources + 1 exception returns all ids; removing raw blob makes VerifyHash fail and checkbox cannot stay green; tenant isolation.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: chain of custody is complete without LLM.
```

---

# CW-01 — Security crosswalk engine

**Depends on:** AE-01, IE-10 · **Branch:** `cursor/security-crosswalk-engine-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: many-to-many mappings among imported AuditControl, MCSB control ids, Azure Policy definition/initiative ids, Defender recommendation ids, OperationalSecurityFinding, RemediationPattern, architecture Requirement / policy rule id, AuditEvidenceRequirement.

Every edge: MappingType, Confidence, Source (Authoritative|VendorPublished|OrganizationDefined|DeterministicallyDerived|AIProposed), Version, Rationale, HumanVerified, timestamps. AI may PROPOSE; it cannot set Authoritative or HumanVerified=true.

Do not assume 1:1. Do not republish MCSB/ARC-AMPE control bodies (cite ids). Reuse pack frameworkMappings as hints for deterministic/vendor rows only.

Tests: AIProposed cannot be used as Authoritative in evaluation; version mismatch invalidates mapping; many-to-many insert works; tenant org-defined mappings isolated.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: crosswalks are versioned and AI-proposed stays non-authoritative.
```
