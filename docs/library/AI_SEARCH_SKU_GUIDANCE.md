> **Scope:** Contributor-reference — Azure AI Search — SKU notes for ArchLucid retrieval - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Azure AI Search — SKU notes for ArchLucid retrieval

**Objective:** Pick a search tier that matches environment (dev vs prod), network boundaries, and cost.

**Assumptions:** Retrieval uses `Retrieval:VectorIndex=AzureSearch` with private connectivity preferred in production.

**Constraints:** Do not expose SMB (port 445) for file-based alternatives; use Azure-native private endpoints where policy requires.

## Dev / test

- **Free** or lowest **Basic** tier is acceptable when vector volume is tiny and latency spikes are tolerable.
- Run without private endpoints on isolated subscriptions only; treat indexes as non-production data.
- Pair with **Azurite** or emulator-backed storage for local compose; AI Search itself has no official local emulator — use a small Azure resource or **InMemory** vector mode (`Retrieval:VectorIndex=InMemory`) for laptop-only work.

## Production

- **Default hosted tfvars** use **`search_sku_name = "basic"`** (`infra/terraform/prod/variables.tf`) for cost; raise to **`standard`** (module default in `infra/modules/azure-search`) when QPS, SLA, or replica/partition scale requires it — expect **−20–60% retrieval p95** under load vs undersized Basic.
- **Private endpoint** + **private DNS** (see `infra/terraform-private/` patterns): deny public network access on the search resource after cutover.
- **Cost:** replicas × partitions dominate bill; embedding and query volume drive RU-like pressure — cap upstream embedding batching (`Retrieval:EmbeddingCaps` in `appsettings.json`) before scaling search replicas.

## HNSW vector knobs (index contract)

Index JSON (`deploy/rc6/archlucid-retrieval-index.json`, field contract in [`AZURE_AI_SEARCH_INDEX_CONTRACT.md`](AZURE_AI_SEARCH_INDEX_CONTRACT.md)) uses algorithm **`archlucid-hnsw`**:

| Parameter | Shipped default | Tuning note |
|-----------|-----------------|-------------|
| `m` | `4` | Higher → denser graph / more recall + memory |
| `efConstruction` | `400` | Higher → better index quality, slower builds |
| `efSearch` | `500` | Higher → better query recall, more latency/CPU |
| `metric` | `cosine` | Keep aligned with embedding space |

Change HNSW only with a **reindex** plan; SKU upgrades alone do not rewrite algorithm parameters.

## Operational notes

- Reindex jobs after schema changes; monitor **throttling** responses and backoff in callers.
- Align **Terraform** variables for SKU, capacity, and `public_network_access_enabled` with the above posture.
