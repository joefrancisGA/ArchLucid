> **Scope:** Contributor-reference — Authoritative Azure AI Search index field contract for ArchLucid retrieval — OData names, formats, and precedence when an index already exists outside the repo.
>
> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Azure AI Search index field contract

**Audience:** Platform engineers, retrieval contributors, Terraform authors (TB-096), and operators reconciling a pre-existing Search index.

**Last reviewed:** 2026-05-30

---

## Precedence rule (owner decision 2026-05-30)

When an Azure AI Search index already exists **outside this repository** (portal-created, legacy Terraform, or a customer landing zone):

1. **This contract wins.** Field names and formats below are authoritative for ArchLucid runtime behavior.
2. **Do not** point production ArchLucid at an index whose field names differ unless you **reindex or migrate** the index to this contract (or change `AzureSearchSdkClient` in-repo — out of scope for ops-only fixes).
3. **Index resource name** comes from configuration only: `Retrieval:AzureSearch:IndexName` (section `Retrieval:AzureSearch`). The Search **service** endpoint is `Retrieval:AzureSearch:Endpoint`.

Implementation references:

- Upsert + vector query: `ArchLucid.Retrieval/Indexing/AzureSearchSdkClient.cs` (`ToSearchDocument`, `SearchAsync`)
- OData scope filter: `ArchLucid.Retrieval/Indexing/AzureSearchTenantScopeFilterBuilder.cs`
- Domain model: `ArchLucid.Retrieval/Models/RetrievalChunk.cs`, `CorpusKind` enum

---

## Requested fields (authoritative index names)

All index field names are **camelCase** OData identifiers (Azure AI Search JSON field names).

| Concept | Index field | Stored as | Notes |
|--------|-------------|-----------|--------|
| **Tenant** | `tenantId` | `Edm.String` (GUID **D** format) | Required on every chunk. Platform corpora use `00000000-0000-0000-0000-000000000000`. |
| **Workspace** | `workspaceId` | `Edm.String` (GUID **D** format) | Required. Platform corpora use `00000000-0000-0000-0000-000000000000`. |
| **Project** | `projectId` | `Edm.String` (GUID **D** format) | Required. Platform corpora use `00000000-0000-0000-0000-000000000000`. |
| **Corpus kind** | `corpusKind` | `Edm.String` | Enum name from `CorpusKind`: `Conversation`, `TenantManifest`, `PriorManifest`, `PolicyPack`, `PlatformDoc`, `ReferenceArchitecture`, `AzureRetailPrice`. |
| **Document id** | `documentId` | `Edm.String` | Logical parent document id (manifest, artifact, policy rule, etc.) — **not** the Azure Search key. |
| **Chunk / document key** | `chunkId` | `Edm.String` | **Azure Search document key** (`DeleteDocumentsAsync` uses this field name). One row per embedding chunk. |
| **Vector content** | `embedding` | `Collection(Edm.Single)` | Dense embedding for vector search. **Not** `vector`, `vectorContent`, or `contentVector`. |
| **Lexical content** | `text` | `Edm.String` | Chunk text snippet (searchable body). |

**Do not rename** the vector field to `vectorContent`. ArchLucid vector queries target **`embedding`** only.

---

## Additional indexed fields (required for full product behavior)

| Index field | Stored as | When required |
|-------------|-----------|---------------|
| `sourceType` | `Edm.String` | Always (hit metadata). |
| `sourceId` | `Edm.String` | Always (hit metadata). |
| `title` | `Edm.String` | Always (hit metadata). |
| `runId` | `Edm.String` (GUID **D**) | When run-scoped retrieval or delete is used. |
| `manifestId` | `Edm.String` (GUID **D**) | When manifest-scoped retrieval is used. |
| `decisionId` | `Edm.String` | Optional facet for prior-manifest / decision chunks. |
| `findingId` | `Edm.String` | Optional facet for finding-linked chunks. |
| `policyPackRulePackId` | `Edm.String` | **Required** when `IncludePlatformCorpora` + policy-pack allowlists are used — OData filter references this field; index schema must expose it even though upsert mapping should be kept aligned in code. |

---

## Vector search configuration

- **Vector field name:** `embedding`
- **Query API:** `VectorizedQuery.Fields = { "embedding" }` in `AzureSearchSdkClient`
- **Dimension:** Must match the embedding deployment configured for ArchLucid (stamped on `RetrievalChunk.EmbeddingDimension` at index time; index schema must allow that dimension).

Semantic reranking (`Retrieval:Reranking:Provider = AzureAiSearchSemantic`) uses the same index; semantic configuration is an Azure resource/index setting — field names above still apply.

---

## Scope filter (TB-071)

Every production search and scoped delete applies an OData filter built from:

- `tenantId`, `workspaceId`, `projectId` (always)
- optional `runId`, `manifestId`
- optional platform branch: `tenantId eq '00000000-0000-0000-0000-000000000000'` with `corpusKind` / `policyPackRulePackId` clauses when `IncludePlatformCorpora` is true

External indexes **must** mark scope fields **`filterable`** (and vector field **`searchable`** in the vector profile sense per Azure SDK).

---

## Reconciling an external index

1. Export or inspect the existing index definition in Azure Portal / ARM / Terraform.
2. Compare field names to the table above (camelCase, exact spelling).
3. If names differ: **create a new index** matching this contract, reindex from ArchLucid (`RetrievalIndexingService` / corpus startup indexers), cut over `Retrieval:AzureSearch:IndexName`, retire the legacy index.
4. If names match but types differ (e.g. GUID stored as `Edm.Guid` instead of `Edm.String`): prefer **string GUID D format** to match current OData filters unless you change the filter builder.

---

## Related

- [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) — `Retrieval:AzureSearch:*` keys
- [`AI_SEARCH_SKU_GUIDANCE.md`](AI_SEARCH_SKU_GUIDANCE.md) — tier and networking
- [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) — corpus semantics
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-071**, **TB-096**
