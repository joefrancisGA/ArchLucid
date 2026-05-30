> **Scope:** Contributor-reference — Honest mapping between application configuration keys and Terraform roots.

# IaC runtime parity (code config → Terraform roots)

**Purpose:** Honest mapping between application configuration keys and Terraform roots. Advisory vs required follows hosting profile in [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md).

| Runtime dependency | Appsettings / env keys | Terraform root (repo) | Status | Backlog |
| --- | --- | --- | --- | --- |
| Azure SQL | `ConnectionStrings:ArchLucid` | `infra/terraform/prod` | **Required** (hosted pilot) | — |
| Azure Blob (artifacts) | `Storage:*` | `infra/terraform/prod` | **Required** when not InMemory | — |
| Azure OpenAI | `AzureOpenAI:*`, `ArchLucid:Agents:*` | `deploy/hosted-prod-terraform` (canonical scaffold; mirror to `infra/terraform/prod` when infra tree is writable) | **Required** (hosted SaaS LLM) | TB-093, TB-080 |
| Azure AI Search | `Retrieval:VectorIndex=AzureSearch`, `Retrieval:AzureSearch:*` | `deploy/hosted-prod-terraform` (same) | **Required** on production-like profiles | TB-071, TB-096 |
| Redis (cache) | `Redis:*` | — | Optional / deferred | TB-094 |
| Cosmos (graph) | `Cosmos:*` | — | Optional (InMemory/SQL paths exist) | TB-095 |
| Service Bus | `ServiceBus:*` | — | Optional (outbox) | TB-099 |
| ACR | Deploy scripts | `infra/terraform-acr` (partial) | **Required** for image pull in Azure | TB-097 |
| Key Vault | `KeyVault:*` | `infra/terraform-private` | **Required** when KV public access disabled | TB-091 |

## Apply order (operator)

1. `infra/terraform-private` (network + Key Vault private endpoint when enabled)
2. `deploy/hosted-prod-terraform` (or `infra/terraform/prod` when present) — API host, worker, SQL, storage, ACR/image source, Azure OpenAI, and Azure AI Search for production-like profiles
3. Focused validation roots/modules, only when intentionally validating OpenAI/Search in isolation or using a customer-provided landing-zone dependency
4. Configure appsettings / Container Apps env per [`CONTAINERIZATION.md`](CONTAINERIZATION.md)

## Composition decision

**Owner decision (2026-05-30):** `infra/terraform/prod` is the authoritative Terraform root for the hosted production footprint. Azure OpenAI and Azure AI Search should be **composed into that root by default**, not treated as separate operator-facing apply roots for production-like hosted deployments.

Separate roots remain useful as temporary validation surfaces or reusable module staging areas, but the default docs and examples should present one hosted-stack story so private networking, RBAC, diagnostics, tags, and app configuration are planned together.

## Trust center cross-link

Buyer-facing posture: [`docs/go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) — interim self-assessment; CPA SOC 2 and third-party pen test are V1.1 backlog (TB-135, TB-136).
