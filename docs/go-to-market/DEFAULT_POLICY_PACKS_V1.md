> **Reviewed:** 2026-07-25

> **Scope:** Default policy packs — V1 GA bundles - full detail, tables, and links in the sections below.

# Default policy packs — V1 GA bundles

**Audience:** pilots, procurement, CS, and sellers explaining what governance content ships **in-tenant by default**.

**Last reviewed:** 2026-07-25


**Objective:** Declare **45** first-party curated categories bundled with every net-new tenant provisioning (see `IDefaultPolicyPackSeeder` / embedded manifest `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/bundled-policy-packs-v1.manifest.json`).

> **Note:** Pack **#25 — Snowflake Security** ships in the bundled manifest as `snowflake-security.json` ([`docs/samples/policy-packs/snowflake-security/README.md`](../samples/policy-packs/snowflake-security/README.md)). The manifest ships **45** content files aligned with tenant provisioning (25 original V1 GA packs, **16** AWS/GCP peer packs for multi-cloud parity, plus **4** provider-neutral architecture-quality baseline packs for Reliability, Performance, Operational Excellence, and Sustainability).

## The "Brain" of the Governance Model

ArchLucid's policy packs act as the active "brain" of the governance engine. By decoupling the core evaluation engine from domain-specific knowledge, policy packs future-proof the system against rapid technology shifts. Rather than updating core binaries to support a new framework or compliance standard, new logic is injected via JSON/YAML documents containing:
1. **Compliance Rules:** The actual gates that inspect architecture evidence.
2. **Alert Rules:** Operational observability rules that trigger Loki/Grafana alerts.
3. **Advisory Defaults:** Contextual guidance and remediation advice.

This design enables deep customization via hierarchical scoping (Tenant, Workspace, Project) where multiple packs are dynamically merged, allowing central security teams and individual project squads to combine their distinct governance requirements seamlessly.

**Content velocity:** Curated packs are drafted with an **LLM generator → critic model → human SME** pipeline; regenerate samples with **`python scripts/generate_v1_bundled_policy_packs.py`**. Authoring playbook: **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)**.

**Rule count and priorities:** Bundled packs are **not** limited to a fixed number of rules per framework. Each pack should grow to cover its standard as content matures. Rules carry **`priority`** (`P0` must-have, `P1` should-have, `P2` nice-to-have). Net-new seeds default to **`priorityFloor: P0`** in `advisoryDefaults` so pilots enforce the must-have subset first; operators widen to `P1` / `P2` as governance matures. Details: **[`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../library/POLICY_PACK_RULE_PRIORITY_MODEL.md)**.

---

## 1. What ships for V1 GA

All rows below are seeded as **`PlatformDefault`** (Architect workspace: **Bundled default (platform)**). Curated rule narratives live in **`docs/samples/policy-packs/*-rules-v1.json`**; provisioning copies are embedded under **`ArchLucid.Application/.../Bundled/`**.

| # | Bundled category | Display name | Rule key prefix (examples) | Notes |
|---|------------------|--------------|----------------------------|
| 1 | AI Governance | AI Governance / Responsible AI | `ai-gov-001` … `020` | Full curated corpus |
| 2 | Security baseline | Security Architecture Baseline | `sec-base-001` … `030` | Full curated corpus |
| 3 | Azure WAF | Azure Well-Architected Framework | `waf-az-001` … `012` | Full curated corpus |
| 4 | Azure CAF / LZ | Azure Landing Zone / Cloud Adoption Framework | `lz-caf-001` … `012` | Full curated corpus |
| 5 | Privacy | GDPR Compliance Baseline | `gdpr-001` … | Expand per GDPR themes |
| 6 | Compliance | SOC 2 Type II (Architecture Themes) | `soc2-001` … | Expand per TSC |
| 7 | Cost | FinOps & Cloud Cost Optimization | `cost-opt-001` … `006` | Extractor-aligned |
| 8 | Application security | OWASP API Security Top 10 | `owasp-api-001` … | ~10 categories + depth |
| 9 | Compliance | ISO/IEC 27001 ISMS (Architecture Slice) | `iso27001-001` … | Expand per Annex A slice |
| 10 | Security | CIS Microsoft Azure Foundations Benchmark | `cis-az-001` … | Prefer `cis-az-l1-*` / `l2-*` ids |
| 11 | Healthcare | HIPAA / HITECH Safeguards | `hipaa-001` … | Expand per safeguard |
| 12 | Payments | PCI-DSS (Architecture / Segmentation) | `pci-001` … | Expand per DSS area |
| 13 | Security | Zero Trust Architecture | `zta-001` … | NIST 800-207 themes |
| 14 | Reliability | Azure Resiliency & Disaster Recovery | `az-dr-001` … | |
| 15 | Platform | AKS Production Baseline | `aks-001` … | |
| 16 | Data governance | Data Classification & Lineage | `data-class-001` … | |
| 17 | Identity | Entra ID / IAM Architecture Baseline | `entra-iam-001` … | |
| 18 | Application platform | Serverless & PaaS Security (Azure) | `az-paas-001` … | |
| 19 | Compliance | NIST Cybersecurity Framework 2.0 | `nist-csf-001` … | CSF functions |
| 20 | DevSecOps | Software Supply Chain & SBOM | `supply-chain-001` … | |
| 21 | Engineering | DORA / DevSecOps Delivery Posture | `dora-001` … | Small corpus OK |
| 22 | Operations | Observability & OpenTelemetry Baseline | `otel-001` … | |
| 23 | Data platform | Azure SQL / Cosmos DB Data-Layer Security | `az-data-001` … | |
| 24 | Compliance | ARC-AMPE Architecture Themes (CMS ACA / Medicaid Partner Entities) | `arc-ampe-pillar-*`, `arc-ampe-id-*`, … | Spec: [`POLICY_PACK_ARC_AMPE_DESIGN.md`](../library/POLICY_PACK_ARC_AMPE_DESIGN.md) |
| **25** | **Data platform security** | **Snowflake Security** | `sf-id-001`, `sf-rbac-001`, `sf-prot-001`, `sf-stage-001`, … | **Full curated corpus (57 rules)** — [`snowflake-security/README.md`](../samples/policy-packs/snowflake-security/README.md) |
| 26 | Architecture | AWS Well-Architected Framework | `waf-aws-001` … | AWS inventory + Terraform `aws_*` evidence |
| 27 | Architecture | Google Cloud Architecture Framework | `waf-gcp-001` … | GCP inventory + Terraform `google_*` evidence |
| 28 | Security | CIS AWS Foundations Benchmark | `cis-aws-001` … | Peer to CIS Azure pack |
| 29 | Security | CIS Google Cloud Platform Foundation Benchmark | `cis-gcp-001` … | Peer to CIS Azure pack |
| 30 | Identity | AWS IAM / Identity Center Architecture Baseline | `iam-aws-001` … | Peer to Entra IAM pack |
| 31 | Identity | GCP Cloud IAM Architecture Baseline | `iam-gcp-001` … | Peer to Entra IAM pack |
| 32 | Platform | AWS Landing Zone / Control Tower | `lz-aws-001` … | Peer to Azure CAF/LZ pack |
| 33 | Platform | GCP Landing Zone / Resource Hierarchy | `lz-gcp-001` … | Peer to Azure CAF/LZ pack |
| 34 | Reliability | AWS Resiliency & Disaster Recovery | `aws-dr-001` … | Peer to Azure resiliency pack |
| 35 | Reliability | GCP Resiliency & Disaster Recovery | `gcp-dr-001` … | Peer to Azure resiliency pack |
| 36 | Platform | EKS Production Baseline | `eks-001` … | Peer to AKS pack |
| 37 | Platform | GKE Production Baseline | `gke-001` … | Peer to AKS pack |
| 38 | Application platform | AWS Serverless & PaaS Security | `aws-paas-001` … | Peer to Azure PaaS pack |
| 39 | Application platform | GCP Serverless & PaaS Security | `gcp-paas-001` … | Peer to Azure PaaS pack |
| 40 | Data platform | AWS Data-Layer Security | `aws-data-001` … | Peer to Azure data-layer pack |
| 41 | Data platform | GCP Data-Layer Security | `gcp-data-001` … | Peer to Azure data-layer pack |
| 42 | Reliability | Reliability and Resilience | `rel-base-001` … `008` | Provider-neutral architecture-quality baseline |
| 43 | Performance | Performance and Scalability | `perf-base-001` … `008` | Provider-neutral architecture-quality baseline |
| 44 | Operations | Operational Excellence | `ops-base-001` … `008` | Provider-neutral architecture-quality baseline |
| 45 | Sustainability | Sustainability and Resource Efficiency | `sust-base-001` … `009` | Provider-neutral environmental / resource-efficiency baseline (no fabricated carbon claims) |

**Appendices (selected):** **[`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md)** · **[`POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`](../library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md)**

Assignments seed **cloud-neutral + Azure baseline** packs **enabled** by default (`PolicyPackAssignments.IsEnabled = true` for `DefaultPolicyPackCatalog.ResolveStandardBaselineDisplayNames(CloudProvider.Azure)`); AWS/GCP-specific baselines auto-enable when a run targets `CloudProvider.Aws` or `CloudProvider.Gcp` via `DefaultPolicyPackCloudBaselineApplicator`. Merges participate in **`PolicyPackResolver`** like any other activated assignment.

### Organization Private vs Review Engine Knowledge

| Knowledge class | `PackType` (origin) | `DistributionScope` | Buyer meaning |
| --- | --- | --- | --- |
| **Review Engine Knowledge** | `BuiltIn` / `PlatformDefault` | `Platform` | ArchLucid-curated expertise bundled with the product |
| **Organization Knowledge** | `TenantCustom` / `WorkspaceCustom` / `ProjectCustom` | `OrganizationPrivate` | Your institutional standards — not published, not discoverable outside your tenant, and not used to train or improve other customers' packs |

Customer-authored packs remain versionable **inside your tenant** (`PublishVersion` / SemVer). Organization Private blocks **distribution outside the tenant** (global catalog promotion, marketplace, org-shared installs) — not in-tenant lifecycle.

---

## 2. Framework & jurisdiction disclaimers (all bundled rules)

Starter corpora use **informative thematic mapping** (`frameworkMappings`) to accelerate architecture review—they **do not** constitute statutory legal classification, conformity assessment, CIS/OWASP/PCI/HIPAA/SOC 2 pass-fail automation, Microsoft Well-Architected / CAF / landing-zone **certification**, **or** CMS ARC-AMPE conformity / SSPP authoring / ATO.

**Operational truth:** Buyers remain responsible for jurisdictional applicability, contractual obligations, auditor evidence breadth, and any certification claims.

---

## 3. Architect workspace — where bundles appear

- **Registered list & effective merge:** **`/policy-packs`** surfaces packs returned by **`GET`** list + effective merges; seeded rows show **Bundled default (platform)**.
- **Rule key inspection:** Expanded **Inspect** accordion lists merged **`complianceRuleKeys`** plus pointers to appendix / sample JSON.
- **Findings UX:** Rows in **`/governance/findings`** link to Inspect on review detail.

---

## 4. Security / tenancy posture (non-regression assertion)

Bundles are **`PlatformDefault`** rows **scoped per tenant/workspace/project**, not silently shared writable globals. Architects **cannot republish** them through the shipped HTTP surface (UI disables **Publish**, API rejects `PublishVersion`).

### Content quality harness (CI)

Bundled pack JSON, manifest counts, curated rule corpora, disclaimer language, and duplicate rule keys are validated by:

```bash
python scripts/ci/check_policy_pack_content_quality.py
```

The harness fails on duplicate `complianceRuleKeys`, missing rule rationale in curated JSON, missing framework disclaimers, unsupported certification wording, or manifest/doc count drift. Unit tests live in `scripts/ci/tests/test_check_policy_pack_content_quality.py`.

---

## 5. Content roadmap

The prioritized **top-20 commercial backlog** from **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)** is **included in V1 GA** (plus AI Governance and Security baseline as core corpora). Future work **expands rule count and priority tagging** per framework via content revisions, not binary releases — see **[`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../library/POLICY_PACK_RULE_PRIORITY_MODEL.md)**.

---

## 6. Operator calibration

Bundled packs are **curated architecture governance content**, not statutory certification of Azure WAF, ISO, HIPAA, or SOC 2 compliance.

### Severity interpretation

| Severity | Operator meaning | Typical action |
| --- | --- | --- |
| **Advisory** | Context and remediation hints | Document; no commit block |
| **Warning** | Material gap — review before commit | Fix evidence or accept explicit waiver in pilot notes |
| **Blocking (critical/high)** | May block commit when enforcement enabled | Resolve or run dry-run until clean |

### False-positive handling

1. Run **dry-run** before enabling `BlockCommitOnCritical`.
2. Tune **priority floor** (P0 only for first pilot) per [`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../library/POLICY_PACK_RULE_PRIORITY_MODEL.md).
3. Scope packs at workspace/project when central security and squad packs must merge.
4. Record waived findings in pilot notes — do not silently ignore blocking rows in sponsor packets.

### Dry-run interpretation

```http
POST /v1/governance/policy-packs/dry-run
```

| Dry-run outcome | Next step |
| --- | --- |
| No blocking findings | Consider enforcement for pilot charter |
| Warnings only | Proceed with documented caveats |
| Critical/high blocking | Fix evidence or adjust pack scope before sponsor send |

Proof artifact: `governance-policy-pack-dry-run-proof` in first-pilot evidence bundle when collected.

### When to enforce BlockCommitOnCritical

Enable only when:

- Pilot charter requires hard governance stops, **and**
- Dry-run false-positive rate is acceptable on buyer evidence, **and**
- Sponsor understands blocked commits are product behavior, not infra failure.

Keep **WarnOnly** on engineer laptops (`appsettings.Development.json`).

### Calibration fixtures (repo tests)

| Pack theme | Test / fixture anchor |
| --- | --- |
| Azure WAF / security baseline | Bundled `waf-az-*` rules in policy pack tests under `ArchLucid.Application.Tests` |
| AI governance | `ai-gov-*` rules · walkthrough [`AI_GOVERNANCE_REVIEW.md`](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md) |

```powershell
dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~PolicyPack"
```

Related: [`PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md) · [`POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md)
