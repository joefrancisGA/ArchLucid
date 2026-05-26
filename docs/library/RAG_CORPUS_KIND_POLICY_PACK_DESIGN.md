> **Scope:** Contributor-reference — Engineering design for RAG-V1-000 (partial) + RAG-V1-001 — `CorpusKind`, platform corpus seam, and `PolicyPackCorpusIndexer`; extends [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md) and [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-021**; not procurement copy.

# RAG — `CorpusKind` + `PolicyPackCorpusIndexer` design

**Date:** 2026-05-23  
**Status:** Approved for implementation (engineering backlog **TB-021**, sub-IDs **RAG-V1-000** partial + **RAG-V1-001**)  
**Backlog:** [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md) · [`TECH_BACKLOG.md#tb-021--rag-quality-program--v1-foundation`](TECH_BACKLOG.md#tb-021--rag-quality-program--v1-foundation) · [`LATEST.md`](../assessments/LATEST.md) Improvement **#26**

---

## 1. Objective

Add a typed **corpus seam** to the existing `ArchLucid.Retrieval` stack and ship the first **platform-wide** corpus — **policy-pack rule text** — so the **Compliance** agent can retrieve control descriptions before the LLM call and cite `ruleId` values in findings.

**Success criteria (minimum slice):**

- Policy-pack rules from `templates/policy-packs/**/compliance-rules.json` are embedded and searchable.
- `ComplianceAgentHandler` prepends retrieved controls to the user prompt (fail-open on retrieval errors).
- Tenant A never sees tenant B's tenant-scoped chunks; platform chunks are visible to all tenants when opted in.
- Manifest hash / replay verify behaviour is unchanged (retrieval is prompt context only).

---

## 2. What is being built and why

`RetrievalDocument`, `RetrievalChunk`, and `RetrievalHit` today carry a free-text `SourceType` string (`"Manifest"`, `"Artifact"`, etc.) with no structured way to:

- route policy-pack content separately from tenant data,
- filter or cite by corpus in prompts,
- apply per-corpus tenant-scoping rules (policy packs are **platform-wide**, not per-tenant).

This design adds **`CorpusKind`** (additive — no breaking changes), **`ICorpusSource`** for platform corpora, and **`PolicyPackCorpusIndexer`** which indexes rule descriptions under a **platform sentinel** `TenantId` and surfaces them to `ComplianceAgentHandler` before the LLM call.

### Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Replace `SourceType` with `CorpusKind` only | Breaking — `SourceType` flows through vector index and `AskService.BuildRetrievalContext` |
| Separate vector index per corpus | Two pipelines and DI registrations for content that refreshes only on pack publish |
| Duplicate policy packs per tenant partition | Multiplies embedding cost with no benefit — pack text is not tenant-specific |

### Scope boundary

**In this slice (RAG-V1-000 partial + RAG-V1-001):**

- `CorpusKind` enum + `CorpusKindSentinels`
- `ICorpusSource` interface
- `CorpusKind` on `RetrievalDocument`, `RetrievalChunk`, `RetrievalHit`
- `RetrievalQuery.IncludePlatformCorpora`
- `InMemoryVectorIndex` platform-sentinel OR filter
- `RetrievalDocumentBuilder` sets `CorpusKind` on existing `Build*` methods
- `PolicyPackCorpusIndexer` + startup refresh hosted service
- `ComplianceAgentHandler` retrieval before LLM (TopK = 6, fail-open)
- Unit tests per §8

**Deferred to follow-on PRs (still TB-021 / RAG-V1-000 remainder):**

- `IRetrievalCitationFormatter`
- `dbo.RetrievalGroundingTrace` + DbUp migration
- Architecture test: tenant-bound query must include scope
- `AzureAiSearchVectorIndex` / `IAzureSearchClient` field mapping for `CorpusKind` (production Azure Search wiring is stubbed today)
- Other agent handlers (topology, cost, critic)
- `docs/templates/policy-packs/**` (index `templates/policy-packs/**` only in v1 slice)

---

## 3. Types and interfaces

### 3.1 `ArchLucid.Retrieval/Models/CorpusKind.cs` (new)

```csharp
namespace ArchLucid.Retrieval.Models;

public enum CorpusKind
{
    Conversation,
    TenantManifest,
    PolicyPack,
    PlatformDoc,
    ReferenceArchitecture,
    AzureRetailPrice
}

public static class CorpusKindSentinels
{
    /// <summary>Platform-scoped corpora use TenantId = Guid.Empty.</summary>
    public static readonly Guid PlatformSentinelTenantId = Guid.Empty;
}
```

### 3.2 `ArchLucid.Retrieval/Indexing/ICorpusSource.cs` (new)

```csharp
public interface ICorpusSource
{
    CorpusKind Kind { get; }
    Task<IReadOnlyList<RetrievalDocument>> BuildDocumentsAsync(CancellationToken ct);
}
```

### 3.3 Model additions

| Type | Property | Default / notes |
|------|----------|-----------------|
| `RetrievalDocument` | `CorpusKind CorpusKind` | `Conversation` for back-compat only; new builders set explicitly |
| `RetrievalChunk` | `CorpusKind CorpusKind` | Copied from parent document in `RetrievalIndexingService` |
| `RetrievalHit` | `CorpusKind CorpusKind` | Returned from vector index |
| `RetrievalQuery` | `bool IncludePlatformCorpora` | Default `false`; compliance agent sets `true` |

### 3.4 `RetrievalDocumentBuilder` — `CorpusKind` mapping

| Method | `CorpusKind` |
|--------|--------------|
| `BuildForManifest` | `TenantManifest` |
| `BuildForArtifacts` | `TenantManifest` |
| `BuildForConversation` | `Conversation` |
| `BuildForProvenance` | `TenantManifest` |

---

## 4. Indexing and search

### 4.1 `RetrievalIndexingService`

Copy `doc.CorpusKind` onto each `RetrievalChunk` in the existing chunk construction loop.

### 4.2 `InMemoryVectorIndex.SearchAsync`

Replace strict tenant-only filter with:

```csharp
bool tenantMatch = x.TenantId == query.TenantId
    && x.WorkspaceId == query.WorkspaceId
    && x.ProjectId == query.ProjectId
    && (!query.RunId.HasValue || x.RunId == query.RunId)
    && (!query.ManifestId.HasValue || x.ManifestId == query.ManifestId);

bool platformMatch = query.IncludePlatformCorpora
    && x.TenantId == CorpusKindSentinels.PlatformSentinelTenantId;

return tenantMatch || platformMatch;
```

Platform chunks use `WorkspaceId = Guid.Empty` and `ProjectId = Guid.Empty`; the OR branch must not require workspace/project match for sentinel rows.

**Azure AI Search:** When the real `IAzureSearchClient` is implemented, use an equivalent `$filter` OR on sentinel `tenantId`. Out of scope for this slice.

---

## 5. `PolicyPackCorpusIndexer`

**Location:** `ArchLucid.Retrieval/Indexing/PolicyPackCorpusIndexer.cs`

**Input:** `templates/policy-packs/**/compliance-rules.json` (configurable via `PolicyPackCorpusIndexerOptions`).

**One document per rule** (small chunks, citeable `SourceId`):

| Field | Value |
|-------|-------|
| `DocumentId` | `policy-pack-rule-{rulePackId}-{ruleId}` |
| `TenantId` | `CorpusKindSentinels.PlatformSentinelTenantId` |
| `WorkspaceId` / `ProjectId` | `Guid.Empty` |
| `CorpusKind` | `PolicyPack` |
| `SourceType` | `PolicyPackRule` |
| `SourceId` | `ruleId` |
| `Title` | `controlName` |
| `Content` | `[{rulePackId} v{version}] [{severity}] {controlName} ({appliesToCategory}): {description}` |
| `ContentHash` | SHA-256 of `rulePackId + version + ruleId + description` (embedding cache stability) |

**Refresh:** `PolicyPackCorpusStartupIndexerHostedService` on host startup when `Retrieval:PolicyPackCorpus:IndexOnStartup` is true (default). Errors log at Warning; do not fail startup.

**Configuration:**

```json
"Retrieval": {
  "PolicyPackCorpus": {
    "PolicyPacksDirectory": "templates/policy-packs",
    "RulesFileName": "compliance-rules.json",
    "IndexOnStartup": true
  }
}
```

---

## 6. `ComplianceAgentHandler` integration

1. Inject `IRetrievalQueryService` (already registered scoped).
2. Before `LlmAgentSchemaCompletion.CompleteAsync`, call retrieval with:

```csharp
new RetrievalQuery
{
    TenantId = scope.TenantId,
    WorkspaceId = scope.WorkspaceId,
    ProjectId = scope.ProjectId,
    QueryText = BuildPolicyQueryText(request), // systemName + env + capabilities + constraints
    TopK = 6,
    IncludePlatformCorpora = true
}
```

3. Append labelled block to user prompt:

```text
Policy Pack Controls (retrieved — cite ruleId when referencing):
[1] PolicyPackRule / hc-ctrl-002 — ...
...
```

If zero hits: include `(none retrieved — grounding unavailable)` and log warning; **do not fail the run**.

4. System prompt addendum: when controls are provided, reference by `ruleId`; if none provided, proceed without inventing external controls.

**Out of scope:** `groundingMissing` on typed finding payload until `RetrievalGroundingTrace` lands (RAG-V1-000 remainder).

---

## 7. DI registration

In `RegisterRetrieval` (`ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`):

```csharp
services.Configure<PolicyPackCorpusIndexerOptions>(...);
services.AddSingleton<PolicyPackCorpusIndexer>();
services.AddHostedService<PolicyPackCorpusStartupIndexerHostedService>();
```

`PolicyPackCorpusIndexer` is a **singleton** (static template files, no request state).

---

## 8. Files changed / created

| File | Action |
|------|--------|
| `ArchLucid.Retrieval/Models/CorpusKind.cs` | Create |
| `ArchLucid.Retrieval/Indexing/ICorpusSource.cs` | Create |
| `ArchLucid.Retrieval/Indexing/PolicyPackCorpusIndexerOptions.cs` | Create |
| `ArchLucid.Retrieval/Indexing/PolicyPackCorpusIndexer.cs` | Create |
| `ArchLucid.Retrieval/Indexing/PolicyPackCorpusStartupIndexerHostedService.cs` | Create |
| `ArchLucid.Retrieval/Models/RetrievalDocument.cs` | Modify |
| `ArchLucid.Retrieval/Models/RetrievalChunk.cs` | Modify |
| `ArchLucid.Retrieval/Models/RetrievalHit.cs` | Modify |
| `ArchLucid.Retrieval/Models/RetrievalQuery.cs` | Modify |
| `ArchLucid.Retrieval/Indexing/RetrievalDocumentBuilder.cs` | Modify |
| `ArchLucid.Retrieval/Indexing/RetrievalIndexingService.cs` | Modify |
| `ArchLucid.Retrieval/Indexing/InMemoryVectorIndex.cs` | Modify |
| `ArchLucid.AgentRuntime/ComplianceAgentHandler.cs` | Modify |
| `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` | Modify |
| `ArchLucid.Retrieval.Tests/PolicyPackCorpusIndexerTests.cs` | Create |
| `ArchLucid.Retrieval.Tests/InMemoryVectorIndexPlatformCorpusTests.cs` | Create |
| `ArchLucid.AgentRuntime.Tests/ComplianceAgentHandlerRetrievalTests.cs` | Create |

---

## 9. Test plan

| Test | Assertions |
|------|------------|
| `PolicyPackCorpusIndexerTests` | Correct `DocumentId`, sentinel `TenantId`, `CorpusKind = PolicyPack`; stable `ContentHash` |
| `InMemoryVectorIndexPlatformCorpusTests` | `IncludePlatformCorpora = false` excludes platform chunks; `true` includes them; no cross-tenant leakage |
| `ComplianceAgentHandlerRetrievalTests` | Pre-seeded rule appears in prompt with `ruleId` + description |
| `ComplianceAgentHandlerNoRetrievalTests` | Empty index; run completes; prompt notes grounding unavailable |
| Regression | Existing tests pass — defaults preserve prior behaviour |

---

## 10. Invariants (must not regress)

1. **Replay / manifest hash** — retrieval is prompt-only; no change to committed chain fingerprint.
2. **Tenant isolation** — OR on sentinel `TenantId` only; never widens tenant-scoped rows across tenants.
3. **Fail-open retrieval** — errors in compliance retrieval path are logged, not thrown (same as `AskService`).
4. **Deterministic rules** — `RuleBasedDecisionEngine` unchanged; RAG enriches LLM narrative only.

---

## 11. Security · scalability · reliability · cost

| Concern | Posture |
|---------|---------|
| **Security** | Platform corpus is allow-listed rule text only; no GTM or pen-test docs; sentinel id is not a real tenant |
| **Scalability** | Index once at startup (+ explicit refresh on pack publish later); O(rules) documents, not O(runs) |
| **Reliability** | Startup indexer fail-open; compliance retrieval fail-open |
| **Cost** | One embedding pass per rule at refresh; `ContentHash` enables skip when unchanged |

---

## 12. Related documents

| Doc | Role |
|-----|------|
| [ADR 0004](../architecture/adrs/0004-transactional-outbox-retrieval-indexing.md) | Tenant manifest indexing outbox (unchanged in this slice) |
| [ADR 0005](../architecture/adrs/0005-llm-completion-pipeline.md) | Embedding + completion quota pipeline |
| [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md) | Full V1 / V1.1 / V2 task list |
| [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-021** | V1 scheduling entry for assessments |
| [`authoring-prompts/PACK_CONTEXTS.md`](authoring-prompts/PACK_CONTEXTS.md) **AI-05** | RAG governance policy-pack thematic mapping |
