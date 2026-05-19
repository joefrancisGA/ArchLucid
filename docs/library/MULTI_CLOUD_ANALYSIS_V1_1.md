> **Scope:** V1.1 engineering deliverable — analyze AWS and GCP customer architectures while ArchLucid remains hosted on Azure (ADR 0020). Not a buyer procurement document; not a commitment to re-host ArchLucid on AWS or GCP.

# Multi-cloud architecture analysis — V1.1 deliverable

**Audience:** Product, engineering, pilots, and assessments.

**Relationship:** [V1_SCOPE.md](V1_SCOPE.md) **§2.19** (buyer-contract summary). [ADR 0020](../architecture/adrs/0020-azure-primary-platform-permanent.md) (hosting stays Azure). [V1_DEFERRED.md §6n](V1_DEFERRED.md) (deferred-inventory row).

---

## 1. Objective

Customers run ArchLucid on **Azure-hosted SaaS** (or self-hosted Azure-aligned stacks) but need **architecture reviews** for workloads that live in **AWS** or **GCP**.

**V1.1 commits to:**

- **`CloudProvider.Aws`** and **`CloudProvider.Gcp`** on `ArchitectureRequest` (wire + CLI + operator UI).
- Ingestion of **AWS/GCP topology** via Terraform (`simple-terraform`, `terraform-show-json`) and **customer-controlled inventory ZIPs** (parity with **§2.16** Azure extractor posture).
- **Cost artifacts** for AWS/GCP rows using **live public pricing APIs** where feasible, with **illustrative fallbacks** when SKU/region probes fail (same honesty bar as Azure Retail + illustrative blend today).
- **Agent and finding context** that treats the **target** cloud as AWS or GCP (not Azure-by-default prompts when `CloudProvider` is set).

**V1.1 does not commit to:**

- Hosting ArchLucid production control plane on AWS or GCP.
- Replacing Entra ID, Azure SQL, Service Bus, Blob Storage, or Azure AI Search used **by the product**.
- Live API connectors that hold **long-lived credentials inside the customer AWS/GCP account** (Tier 2 opt-in for Azure in **§2.16** does not automatically extend to AWS/GCP in V1.1).
- AWS/GCP **Well-Architected / CAF / GCP framework** certification or score parity with native vendor tools.

---

## 2. Assumptions

- **ADR 0020** remains accepted: Azure is the permanent **hosting** surface unless a future ADR supersedes it.
- Customers can supply **Terraform state JSON** or run **read-only inventory scripts** in their own AWS/GCP accounts (Tier 1 — no ArchLucid credentials in customer cloud).
- Public **AWS Price List** and **GCP Cloud Billing Catalog** APIs are sufficient for V1.1 retail-style estimates; reserved/committed-use pricing remains out of scope unless separately promoted.
- V1 GA **Azure extractor ZIP** (**§2.16**) stays the reference pattern for trust-center language and citation contracts.

---

## 3. Constraints

| Constraint | Implication |
|------------|-------------|
| **No vendor access to customer cloud (default)** | AWS/GCP inventory ZIPs are customer-run scripts; ArchLucid only ingests uploaded packages. |
| **No `terraform apply` / `destroy`** | Same as **§2.17** — advisory Terraform only. |
| **Private endpoints / no SMB 445** | Product egress for pricing APIs uses HTTPS only; no new public ingestion surfaces on port 445. |
| **Authority pipeline unchanged** | New behavior plugs into `IContextConnector`, `IInfrastructureDeclarationParser`, `IInfrastructureCostArtifactAugmentationProvider`, and `CloudProvider` — no parallel finding schema per cloud. |
| **Minimum code** | Reuse `CanonicalObject`, existing connector pipeline, and cost line shapes; avoid cloud-specific duplicate orchestration. |

---

## 4. Phased delivery

| Phase | Calendar (planning) | Buyer-visible outcome |
|-------|-------------------|------------------------|
| **Phase 1 — Terraform + provider enum** | ~1 week | `cloudProvider: Aws \| Gcp` on requests; `terraform show -json` from AWS/GCP projects classifies resources; illustrative costing labels say AWS/GCP (not Azure). |
| **Phase 2 — Classification + illustrative cost** | ~1–2 weeks | `RuntimePlatform` arms for common AWS/GCP services; resource-type mappers; human-readable cost tables with illustrative USD. |
| **Phase 3 — Inventory ZIP + upload** | ~2 weeks | `Get-ArchLucidAwsPackage` / `Get-ArchLucidGcpPackage` scripts; ingest endpoints; audit events; citation contract aligned with **§2.16**. |
| **Phase 4 — Live pricing + agent prompts** | ~2–3 weeks | AWS Price List + GCP Billing Catalog adapters; cloud-aware agent system prompts; golden-corpus fixtures for AWS/GCP scenarios. |

**Total engineering estimate:** ~6–8 weeks focused delivery for full parity with the Azure analyze path (not including GTM copy or policy-pack expansion).

Implementation may land **incrementally** before all phases complete; **buyer-contract** language follows **§2.19** in [V1_SCOPE.md](V1_SCOPE.md) (Phase 1+2 = minimum V1.1 obligation unless owner amends scope there).

---

## 5. Workstreams and touchpoints

### 5.1 Request model and CLI (`CloudProvider`)

| Item | Primary files / surfaces |
|------|--------------------------|
| Extend enum | `ArchLucid.Contracts/Common/CloudProvider.cs` — add `Aws = 2`, `Gcp = 3` |
| CLI parsing | `ArchLucid.Cli/Commands/CliCommandShared.cs` — map `aws`, `gcp` (replace today’s silent Azure fallback for non-empty unknown strings) |
| Wire / OpenAPI | Regenerate snapshot + clients per [Http-Surface-Docs-And-Clients.mdc](../../.cursor/rules/Http-Surface-Docs-And-Clients.mdc) |
| Operator UI | Baseline wizard / review create — cloud provider selector when promoted from deferred wizard copy |

**Acceptance:** `POST /v1/architecture/request` with `cloudProvider: 2` persists and flows to orchestration; CLI `--cloud aws` sets enum correctly.

### 5.2 Terraform ingestion (already provider-agnostic shape)

| Item | Primary files |
|------|----------------|
| Object-type resolution | `TerraformShowJsonInfrastructureDeclarationParser.cs`, `SimpleTerraformDeclarationParser.cs` — `aws_*`, `google_*` / `google_*` security and policy arms |
| Category enrichment | `CanonicalInfrastructureEnricher.cs` — VPC, subnet, S3, EC2, GCE, Cloud SQL patterns |

**Acceptance:** Fixture `terraform-show-json` from a small AWS module produces `TopologyResource` / `SecurityBaseline` rows with `terraformType` and `providerName` properties; no parser crash on `hashicorp/aws` provider blocks.

### 5.3 Customer-controlled inventory ZIPs (AWS / GCP)

Parallel to **§2.16** Azure extractor:

| Item | Deliverable |
|------|-------------|
| AWS script | `scripts/Get-ArchLucidAwsPackage.ps1` (and/or `.sh`) — Resource Explorer or Config export → `resources.json` + `manifest.json` |
| GCP script | `scripts/Get-ArchLucidGcpPackage.ps1` (and/or `.sh`) — `gcloud asset list` export → same schema shape |
| Readers | `ArchLucid.Core/AwsExtractor/*`, `ArchLucid.Core/GcpExtractor/*` |
| Upload | Generalize or sibling routes under `/v1/extractor/{provider}/upload` (exact route TBD at implementation; document in OpenAPI) |
| Persistence | Reuse package storage pattern from Azure extractor records |
| Trust center | Tier 1 default: no ArchLucid credentials in customer AWS/GCP |

**Acceptance:** Upload ZIP associates with `runId`; `resources.json` feeds canonical graph; durable audit events emitted; README in ZIP states read-only collection posture.

### 5.4 Costing

| Item | Primary files |
|------|----------------|
| Platforms | `RuntimePlatform.cs` — AWS (`Ec2`, `Lambda`, `Eks`, `Rds`, `S3`, …) and GCP (`ComputeEngine`, `Gke`, `CloudSql`, …) values |
| Mappers | `AwsResourceCostMapper`, `GcpResourceCostMapper` (mirror `AzureArmResourceCostMapper`) |
| Pricing clients | `AwsBulkPricingClient`, `GcpCloudBillingCatalogClient` |
| Augmentation providers | Implement `IInfrastructureCostArtifactAugmentationProvider`; select by `CloudProvider` in host composition |
| Fallbacks | Extend `IllustrativeInfrastructureCostFallback` display names for non-Azure platforms |
| Nodes | `ManifestInfrastructureCostNodes.FromAwsExtractorInventory` / `FromGcpExtractorInventory` |

**Acceptance:** Cost-summary artifact for an AWS Terraform fixture shows line items labeled as AWS services; `PriceSource` distinguishes Retail/API vs Estimated; summary text does not claim Azure Retail when `CloudProvider` is Aws.

### 5.5 Agents and findings

| Item | Notes |
|------|--------|
| System prompts | Branch on `ArchitectureRequest.CloudProvider` — service names, security idioms (e.g. public S3, GCP firewall rules) |
| Policy packs | **Out of V1.1 minimum** unless owner promotes — Azure CIS pack remains; AWS/GCP thematic packs are follow-on |
| Golden corpus | Add 2–3 AWS and 2–3 GCP scenario fixtures under `ArchLucid.AgentRuntime.Tests` / golden cohort |

**Acceptance:** Real-mode or simulator run with `CloudProvider.Aws` produces findings that reference AWS constructs, not `azurerm_*` defaults.

---

## 6. Explicit non-goals (V1.1)

| Non-goal | Pointer |
|----------|---------|
| Re-host ArchLucid on AWS/GCP | [ADR 0020](../architecture/adrs/0020-azure-primary-platform-permanent.md) |
| Azure DevOps / GitHub CI decoration for AWS/GCP repos | Separate backlog; not implied by this deliverable |
| Direct live inventory pull (ArchLucid-held AWS/GCP roles) | Deferred; Tier 1 ZIP-only for V1.1 |
| Multi-cloud **single graph** merge across three clouds in one review | V2 candidate — V1.1 reviews target **one** `CloudProvider` per request |
| Policy pack parity (CIS AWS, GCP foundation) | GTM / pack backlog |

---

## 7. Verification

| Phase | Minimum verification |
|-------|---------------------|
| 1 | Unit tests on parser + `ParseCloudProvider`; one integration test ingesting AWS `terraform-show-json` |
| 2 | Unit tests on mappers + illustrative cost lines |
| 3 | Upload integration test (local blob); script smoke in CI optional |
| 4 | WireMock or recorded HTTP for pricing clients; golden-corpus agent smoke |

Release checklist: extend [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) V1.1 section when owner promotes gate items.

---

## 8. GTM and assessment rules

- **Positioning:** “ArchLucid runs on Azure; analyzes Azure, AWS, and GCP architectures” — update [POSITIONING.md](../go-to-market/POSITIONING.md) and [COMPETITIVE_LANDSCAPE.md](../go-to-market/COMPETITIVE_LANDSCAPE.md) when Phase 2 ships (not before contract text in **§2.19**).
- **`(A)` V1.1 readiness:** Absence of AWS/GCP analyze **before** V1.1 window closes may score against product readiness **after** **§2.19** is in force; **V1 GA** assessments **must not** deduct for AWS/GCP-only buyers (per prior competitive gap framing).
- **Procurement:** Buyers requiring ArchLucid **hosted** in AWS/GCP remain **not a fit** for V1.1 — see [NOT_A_FIT.md](../go-to-market/NOT_A_FIT.md) until ADR supersedes.

---

## 9. Related

- [V1_SCOPE.md](V1_SCOPE.md) **§2.16** (Azure extractor reference), **§2.19** (V1.1 contract)
- [V1_DEFERRED.md §6n](V1_DEFERRED.md)
- [ARCHITECTURE_INVARIANTS.md](ARCHITECTURE_INVARIANTS.md) — tenant isolation and audit parity unchanged
- [docs/archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md](../archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) — historical “AWS agents / multi-cloud deferred to V1.1”
