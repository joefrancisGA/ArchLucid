> **Scope:** Copy-paste prompts **IE-09–IE-15**. Index: [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). Contract: [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).

# IE-09–IE-15 — Operational security findings and remediation factory

Third finding stream. **Not** `IFindingEngine`. **Not** sealed `FindingsSnapshot`. AE-09 will open operational findings from audit evaluation failures via this model.

---

# IE-09 — Operational security finding ingest

**Depends on:** IE-04 · **Branch:** `cursor/operational-security-finding-domain-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: OperationalSecurityFinding as a third finding stream with SQL, repository, ingest API, validation, tenant isolation. No matcher, no execution.

Do not: subclass Finding or write FindingRecords/FindingsSnapshot; add IFindingEngine; assume Microsoft/Defender/Azure as the only SourceSystem; duplicate rows on re-ingest.

Read: plane §§ finding streams, idempotent ingest; FINDING_STREAM_PRODUCT_OF_RECORD.md; Finding.cs (do not extend).

Work:
1. Fields: FindingId, TenantId, WorkspaceId, ProjectId, Provider, SourceSystem, SourceFindingId, CloudResourceId nullable, ExternalResourceId, ResourceType, SubscriptionOrAccountId, ControlId, ControlFramework, Title, Description, Severity, RiskScore, Exploitability, Exposure, BusinessCriticality, BlastRadius, FirstObservedUtc, LastObservedUtc, Status (Open, Recurred, Closed, Exception, AwaitingVerification), RawEvidenceReference. Metadata as key/value table, not unbounded JSON.
2. Append-only observation history. Natural key (TenantId, Provider, SourceSystem, SourceFindingId) or fingerprint (ExternalResourceId, ControlId, Title).
3. POST /v1/operational-security/findings/ingest (ExecuteAuthority), batch + per-item errors. GET list/detail. OpenAPI + route registry. Audit Ingested/Deduplicated.
4. UI if any: distinct Operate page, never unlabeled mix with sealed architecture findings (WK-19).
5. Tests: dedupe; foreign tenant 404; isolation SQL.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: ingest is idempotent; types do not collide with Finding.
```

---

# IE-10 — Remediation pattern registry

**Depends on:** plane · **Branch:** `cursor/remediation-pattern-registry-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: versioned RemediationPattern registry (Draft → UnderReview → Approved → Deprecated → Retired). Only Approved versions may be used by the factory. JSON/YAML import. No matcher. No ARM mutate payloads ArchLucid will execute.

Do not: execute remediations; auto-approve via LLM; add PolicyPackContentDocument properties; Azure-only ApplicableProviders.

Read: plane §8; policy pack versioning (pattern only); YamlDotNet already in Directory.Packages.props.

Work:
1. Pattern + immutable Approved versions: ControlObjective, eligibility/exclusion, preflight, ExecutionDefinition (advisory TF template ref, runbook ref, verification queries — not customer credentials), Rollback, RecurrenceControl, ExceptionPolicy, RequiredApprovals, AutomationLevel Manual|Guided|SemiAutomated|Automated per plane (Automated ≠ apply).
2. Structured match fields for IE-11 (provider, resourceType, controlId, severityMin, propertyEquals).
3. APIs: draft, submit, approve (SoD: approver ≠ author), deprecate, retire, get, list, JSON/YAML, bulk with per-item errors.
4. Tests: non-Approved rejected by a stub factory guard; YAML round-trip; self-approval blocked.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
Done when: versioned patterns ingest; only Approved is usable.
```

---

# IE-11 — Deterministic matcher and conflicts

**Depends on:** IE-09, IE-10 · **Branch:** `cursor/remediation-pattern-matcher-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: match OperationalSecurityFinding to Approved pattern versions. Deterministic first. AI may propose PossibleMatch only; it cannot write ExactMatch. AI explains evidence; it is not the evidence.

Do not: IFindingEngine; silently pick among conflicts; LLM ExactMatch; start instances.

Read: ComplianceFindingEngine (determinism pattern only).

Work:
1. MatchKind: ExactMatch, ProbableMatch, PossibleMatch, NoMatch, Conflict.
2. Exact: provider + resourceType + controlId. Probable: type + controlFramework without id. Possible: keyword/property overlap. Document rules in a short docs/library/REMEDIATION_PATTERN_MATCHING.md.
3. Conflicts persist (two Exact, contradictory strategies, version skew). Fail closed for execution.
4. Explain string: “Pattern {key} v{n} matched because …”.
5. Tests: exact; two exact → Conflict; AI mock cannot write ExactMatch.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: ExactMatch is deterministic; conflicts are explicit.
```

---

# IE-12 — Operational exceptions

**Depends on:** IE-09 · **Branch:** `cursor/operational-security-exceptions-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: OperationalSecurityException with required expiration. Expired exceptions reopen visibility. Do not replace RiskExceptionRecord.

Do not: hide expired exceptions; skip rationale; use architecture FindingId as the only key.

Read: RiskExceptionRecord; SqlRiskExceptionRepository.RenewExpireRetire.cs.

Work:
1. Exception: operational finding and/or pattern and/or CloudResourceId (at least one), owners, rationale, residual risk, compensating controls, approval SoD, ExpirationUtc required, Status Active|Expired|Revoked, EvidenceReference, hash.
2. On expire: finding Status=Open/Recurred; idempotent observation SourceSystem=ArchLucid.ExceptionExpiry.
3. Tests: expiry creates observation; active does not; isolation; missing rationale rejected.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: exceptions expire into visible operational findings; TB-059 waivers unchanged.
```

---

# IE-13 — Remediation instance workflow (no cloud mutation)

**Depends on:** IE-11, IE-12 · **Branch:** `cursor/remediation-instance-workflow-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: RemediationInstance applies an Approved pattern version through governed states. Execute does not mutate customer Azure. Verify uses a later AzureInventorySnapshot (or PendingEvidence). Freeze PatternVersion on the instance.

AE-09 will create instances from audit evaluation failures — keep IDs and provenance so that path can attach AssessmentId/ControlId later without schema churn (nullable correlation columns now).

Do not: ARM PUT/PATCH/DELETE; terraform apply/destroy; non-Approved patterns; treat emit-200 as verified; auto-resolve Conflicts.

Work:
1. State machine: classify → preflight → approve → wave/canary → execute → verify → close. RecurrencePrevention is recorded control + optional ITSM, not ArchLucid deploying Azure Policy.
2. Preflight on latest snapshot: exception exists; missing rollback blocks SemiAutomated/Automated; IE-11 Conflict fail-closed; production tags if present.
3. Execute: Manual/Guided checklist + evidence; SemiAutomated/Automated write advisory artifact (TerraformAdvisorySnippetTemplates / IE-05) + optional existing ITSM outbound. Immutable RemediationEvidenceRecord (before, request, result=emitted, actor, correlation).
4. Verify: VerificationDefinition against snapshot properties. ExecutionSucceeded + VerificationFailed is first-class.
5. Tests: non-approved rejected; Conflict blocks; emit ≠ verified; snapshot-clear closes; grep this feature for terraform apply and ARM PUT.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: workflow is real; apply is absent; verification is independent.
```

---

# IE-14 — Pattern UI and bulk import

**Depends on:** IE-10 · **Branch:** `cursor/remediation-pattern-ui-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Operate UI for pattern create/review/approve/YAML import. Carbon enterprise rules. Not Core Pilot.

Do not: new review-detail tabs; unlabeled “findings”; in-place edit of Approved versions; ghost/link Buttons.

Read: archlucid-ui/AGENTS.md; UI_DESIGN_SYSTEM.md; NAV_CONFIG_CONTRACT.md; OPENAPI_CONTRACT_DRIFT.md.

Work: Operate nav (extended); list + version history; import errors; approve CTA disabled until SoD validation; Vitest empty/error; npm test scoped.

Done when: YAML import lands Draft and is not usable for production instances.
```

---

# IE-15 — Waves, explainable prioritization, metrics

**Depends on:** IE-13 · **Branch:** `cursor/remediation-factory-metrics-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: configurable wave sizes (defaults 1,5,25,100,500 — custom positive int allowed), transparent risk scoring, executive metrics. Do not hard-code those five as the only legal sizes. Do not hide the formula behind an LLM. Do not mutate Azure.

Work:
1. Weighted factors (Severity, Exploitability, KnownExploitation, InternetExposure, IdentityControlPlaneImpact, AssetCriticality, DataSensitivity, BlastRadius, CompensatingControls, RemediationComplexity, RemediationRisk). Persist breakdown. GET explains the score.
2. Waves: size N or explicit CloudResourceId list.
3. Metrics (ReadAuthority, tenant scoped): open, risk-weighted, critical exposure, created/week, remediated/week (verification succeeded), net burn, recurrence, pattern coverage (ExactMatch), automation %, verification failure, exceptions active/expiring/expired, business-blocked, average age, top ControlId/PatternKey.
4. UI: operator table + exec cards; simulator must not look like live scanner feed.
5. Tests: wave size 7; weight change reranks; metrics isolated.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: ranking is explainable; waves are configurable.
```
