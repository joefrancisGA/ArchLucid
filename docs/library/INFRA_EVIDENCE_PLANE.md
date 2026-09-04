> **Scope:** Engineering contract for the infrastructure-evidence plane: one Azure collection feeding architecture, drift, security remediation, ARC-AMPE audit evidence, diagrams, and tenant branding of those artifacts. **Contributor-reference** — internal only.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Prompts:** [`../architecture/INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](../architecture/INFRA_EVIDENCE_COMPOSER_PROMPTS.md)

# Infrastructure-evidence plane

**Status:** Design contract for Composer prompts **IE / AE / CW / BR**. Not shipped product.

This plane **extends the evidence graph**. It is not a CMDB, not a Defender console, not an apply engine, and not CMS attestation.

## 1. Spine (non-negotiable)

```text
Azure Collector (existing extractor ZIP + hosted Reader GET)
        → AzureInventorySnapshot  (normalized, hashed, append-only)
              ├── Advisory Terraform reconstruction
              ├── Temporal diff / drift
              ├── Architecture diagram reconciliation
              ├── Operational security findings + governed remediation
              └── Audit evidence selectors → ARC-AMPE evaluation
                        └── Evidence lineage (click a green checkbox)
```

**One Azure collection supports architecture, drift, security remediation, and audit evidence.**

Do **not** build a second ARC-AMPE ARM harvest. Audit “collectors” are **declarative selectors** over snapshot rows (and catalog-driven *additions to the shared snapshot schema* when a required property is missing).

When Snapshot B differs from Snapshot A, the **same diff rows** tell you:

- which architectural assumptions changed
- which security-relevant configuration changed
- which audit evidence hashes are invalid
- which ARC-AMPE controls must be reassessed

That is strictly stronger than periodically dumping Azure config into an audit folder.

## 2. Hard invariants

| Invariant | Meaning |
|-----------|---------|
| **AI explains evidence; AI is not the evidence** | Models narrate cited rows. They must not mint ARM facts, org documents, ExactMatch, authoritative crosswalks, or auditor conclusions. |
| **One collector family** | `Get-ArchLucidAzurePackage.ps1` + `HostedAzureExtractorClient` + snapshot materialize. No parallel ARC-AMPE ZIP. |
| **Evidence lineage** | Every green audit checkbox is a clickable chain: control → requirement → evaluation → normalized evidence → `CloudResourceId` → raw API/query → timestamp → collector version. |
| **No customer write roles** | Never `Owner` / `Contributor` / `User Access Administrator` / Entra **Global Reader**. Tier 2 = `Reader` + `Cost Management Reader` plus *documented, least-privilege Graph scopes* only when the imported catalog requires Entra evidence **and** the tenant grants them. Inaccessible → `CollectionStatus` gap, not silent role expansion. |
| **Never `terraform apply` / `destroy`** | Advisory emit + next-snapshot verification only. |
| **`aztfexport` remains primary live TF export** | Reconstruction is labeled reconstruction, never “original Terraform.” |
| **Do not invent ARC-AMPE controls** | Import a versioned control specification. Pack #24 stays **architecture themes**, not this assessment plane. |
| **Automated evaluation ≠ auditor conclusion** | Separate records. Never present a score as CMS conformity. |
| **Readiness ≠ compliance** | Possessing evidence ≠ satisfying the control. Do not name a “compliance score” unless the imported catalog defines that math. |
| **Three finding streams stay distinct** | Sealed `FindingsSnapshot` / agent findings / `OperationalSecurityFinding`. |
| **No new coverage `IFindingEngine`** | Matcher and audit evaluators are not review-graph coverage engines. |
| **Tenant isolation** | ADR 0037 database-per-tenant. Tenant A branding/evidence never appears in Tenant B artifacts. |

## 3. Name map

| Brief name | Land as | Do not collide with |
|------------|---------|---------------------|
| SecurityFinding | `OperationalSecurityFinding` | `Finding` (review engines) |
| AzureSubscriptionSnapshot | `AzureInventorySnapshot` | `AzureExtractorPackageRecord` (ZIP is raw evidence; snapshot is the projection) |
| AuditEvidenceSnapshot | `AuditEvidenceSnapshot` | Inventory snapshot **or** `dbo.AuditEvents` (platform operator log) |
| Collector (audit) | `AuditEvidenceSelector` (reads snapshot) | A second ARM client |
| SecurityException | `OperationalSecurityException` | `RiskExceptionRecord` (architecture waivers) — share expiry semantics |
| TenantBrandingProfile | `TenantBrandingProfile` | Extend `TenantFirstValueReportBranding*`, do not fork |

Provenance kinds on every derived claim: **ObservedFact**, **DerivedFact**, **DeterministicInference**, **AiInference**, **HumanAssertion**.

## 4. Existing seams

| Seam | Extend |
|------|--------|
| Extractor | `ArchLucid.Core/AzureExtractor/*`, `Application/AzureExtractor/*`, `Integrations.AzureExtractor/*`, `scripts/azure/Get-ArchLucidAzurePackage.ps1` |
| Graph | `CanonicalObject`, `GraphSnapshot`, `GraphEdge.InferenceSource` / `Weight` / `ReasoningTrace`, `GET /v1/evidence-graph/…` |
| Terraform | CLI aztfexport wrap, `TerraformAdvisorySnippetTemplates`, `ADVISORY.md` |
| Compare | **Pattern** from `IComparisonService`; **new** `IAzureInventoryDiffService` (not golden-manifest types) |
| Findings | Third stream; ITSM outbound may attach to operational ids when mapped |
| Waivers / approvals | `RiskExceptionRecord` + `GovernanceApprovalRequests` |
| ARC-AMPE pack #24 | [`POLICY_PACK_ARC_AMPE_DESIGN.md`](POLICY_PACK_ARC_AMPE_DESIGN.md) — thematic review only; this plane is assessment evidence |
| Branding | `ITenantFirstValueReportBrandingRepository`, `FirstValueReportBrandingSanitizer`, `CONSULTING_DOCX_TEMPLATE.md`, `ArchLucidLogo`, `--al-*` tokens |
| Ask | `AskPromptTemplateCatalog`, `AskUserPromptComposer`, redaction |

**Do not** add a new `.csproj` unless architecture tests force it.

## 5. Snapshot as shared system of observation

Normalized tables (indicative): snapshot header (FK `PackageId`), resources, properties (bounded; large ARM → blob), relationships (provenance + confidence), identities, role assignments, network, tags, diagnostics, unknown types (never drop).

`CloudResourceId` is stable across snapshots for the same normalized ARM id in the same ArchLucid tenant.

Raw ZIP bytes remain forensic evidence. Snapshot rows point at `SourceEvidenceReference`.

## 6. Audit evidence as a consumer

```text
Imported AuditFramework + AuditControl catalog
    → AuditEvidenceRequirement
    → AuditEvidenceSelector (which snapshot columns / ARG queries)
    → AuditEvidence (normalized + raw hash, CollectionUtc, CollectorVersion)
    → AutomatedEvaluation (deterministic)
    → HumanDisposition / auditor conclusion (humans only)
```

If the catalog needs a property the snapshot lacks, **extend the shared snapshot** (IE-02 schema bump), then select it. Do not stand up `ArcAmpeZip`.

Entra/PIM/Conditional Access/Defender/Policy: optional selectors, catalog-driven, least privilege, fail to `INSUFFICIENT EVIDENCE` when APIs/permissions are absent.

**Freshness:** never silently reuse stale evidence for a *current* assessment. Historical / assessment-period reads are labeled.

**Continuous loop:** new inventory snapshot → diff → invalidate evidence hashes → re-evaluate affected controls → optional operational finding → approved pattern → instance → verify via **next** snapshot → new audit evidence. Timeline states are technical (`TechnicallySupported`, `DriftDetected`, `AtRisk`, …), not attestation.

## 7. Evidence lineage (chain of custody)

For every positive audit checkbox:

1. ARC-AMPE (or imported) control  
2. Evidence requirement  
3. Deterministic evaluation (counts, exceptions, formula)  
4. Normalized Azure evidence rows  
5. `CloudResourceId` / ARM id  
6. Raw API/query payload pointer  
7. Collection timestamp  
8. Collector / selector version  

If an auditor asks why ArchLucid believes a control is supported, the answer is that chain — **not** “the AI determined it.” AI may then explain the chain.

## 8. Security remediation (no apply)

Discover → classify → prioritize → preflight → approve → canary/wave → execute → verify → close.

Execute = runbook / advisory TF / ITSM. Verify = independent snapshot read. Conflicts do not auto-resolve. AI cannot mint ExactMatch.

## 9. Branding

Visual identity is tenant-scoped. Text may still say ArchLucid (powered-by, help, legal, version).

`ITenantBrandingService` is the only resolver. Order: Active profile → tenant default → ArchLucid product brand.

`--brand-*` tokens must not override severity/status semantics. Tenant A assets never render in Tenant B artifacts (including exports and email).

## 10. Security / scale / reliability / cost

| Concern | Approach |
|---------|----------|
| Security | Reader-only; no secrets; SVG sanitization; SoD; append-only hashed evidence; AI cannot authorize |
| Scale | Normalized tables + blob; graph MaxNodes; Mermaid partition; catalog-driven collection (do not scrape unused categories) |
| Reliability | Idempotent ingest; completeness warnings; verification ≠ emit-200; stale evidence labeled |
| Cost | Tier 1 default; auto-pull default off; LLM after deterministic paths |

## 11. Out of scope

ArchLucid ARM writes; replacing aztfexport; inventing ARC-AMPE control text; CMS conformity / SSPP authoring; merging Azure+AWS+GCP snapshots; new coverage engines; tab collapse; GTM cohorts M-90/M-44/M-91/M-92; SOC 2 CPA / third-party pen test as engineering work.
