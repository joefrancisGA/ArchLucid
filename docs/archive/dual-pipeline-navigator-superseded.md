> **Reviewed:** 2026-07-22

> **Archived (2026-04-22):** Superseded for operator-facing narrative by [`docs/CANONICAL_PIPELINE.md`](../library/CANONICAL_PIPELINE.md). Retained for engineering ADR cross-links and historical context.

> **Scope:** Dual pipeline navigator (Coordinator vs Authority) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Dual pipeline navigator (Coordinator vs Authority)

**Objective**: Cut ramp-up time for the two execution paths that both converge on a **golden manifest**, without reading every ADR first. This page is the map; ADRs remain the receipts.

**Assumptions**: You are working in the .NET solution (`ArchLucid.*` assemblies, renaming incrementally to ArchLucid). Storage is SQL-backed with optional in-memory providers in tests.

**Constraints**: The pipelines historically shared contracts but used **different persistence ports** for some artifacts (see [ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md); ADRs 0010/0021 removed 2026-08-02).

---

## Which path do I use?

Most contributors hit one of three questions: "where do I add an event for an HTTP-triggered architecture run?", "where do I add an event for an ingested authority manifest?", or "how do I add a shared concept like findings?". This decision tree answers all three at the level of *which interface family to extend*.

```mermaid
flowchart TD
    start[I need to add or change a run-flow concept] --> entry{Is the run created by an HTTP request from an operator or CLI client?}
    entry -- Yes --> coord[Coordinator pipeline<br/>edit ICoordinatorGoldenManifestRepository / ICoordinatorDecisionTraceRepository<br/>and emit AuditEventTypes.CoordinatorRun*]
    entry -- No, it ingests external context --> auth[Authority pipeline<br/>edit IGoldenManifestRepository / IDecisionTraceRepository in ArchLucid.Decisioning.Interfaces<br/>and emit AuditEventTypes.RunStarted / RunCompleted]
    entry -- It is a contract, finding, or decision-node shape used by both --> shared[Shared contract surface<br/>ArchLucid.Contracts or ArchLucid.Core; do NOT create a third repository pair]
    coord --> ascertain{Did you also need to touch the matching authority constant?}
    auth --> ascertain
    ascertain -- Yes --> dual[Dual-write — register the link in CoordinatorToAuthorityMap inside AuditEventTypes_DoNotCollideAcrossPipelinesTests.cs and document it in docs/AUDIT_COVERAGE_MATRIX.md]
    ascertain -- No --> done[Done — keep the change scoped to one pipeline]
    shared --> done
```

If the answer is "I want to delete one pipeline outright", that is **proposed ADR 0021**, not a regular PR — see "Why we have not collapsed these" below.

---

## Why we have not collapsed these

The two pipelines looked duplicative on first read. **Closed 2026-04-29** — see [ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md) and [`redirects.md`](../redirects.md#historical-adrs-removed-2026-08-02) for removed ADRs 0010, 0012, 0021, 0028, 0029.

- **[ADR 0030 — Coordinator → Authority pipeline unification](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md)**. Authoritative closure record: coordinator repository family deleted, `dbo.GoldenManifestVersions` dropped, Authority path is canonical.
  - `ArchLucid.Core.Tests/Audit/AuditEventTypes_DoNotCollideAcrossPipelinesTests.cs` — coordinator and authority audit constants stay distinct on the wire.
  - `ArchLucid.Api.Tests/Startup/DualPipelineRegistrationDisciplineTests.cs` — coordinator and authority repositories stay distinct concrete types in the container; the renamed `ICoordinator*` family does not silently regrow into the unprefixed namespace.

The right way to challenge this boundary today is a **new ADR** — the strangler is closed.

**Strangler inventory + CI ceiling (2026-04-21 follow-on).** See [`architecture/COORDINATOR_STRANGLER_INVENTORY.md`](../architecture/COORDINATOR_STRANGLER_INVENTORY.md) for migrate / keep / delete rows and [`scripts/ci/assert_coordinator_reference_ceiling.py`](../../scripts/ci/assert_coordinator_reference_ceiling.py) for non-test reference-count regression.

**Unification plan (shipped — [ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md)).** The sequenced **PR A0 → PR A4** plan replaced the original single-PR-A deletion framing. This archived page remains for historical context only.

---

## Architecture overview

| Concept | Coordinator (string `ArchitectureRuns.RunId`) | Authority (ingestion / `Guid` run) |
|--------|-----------------------------------------------|-------------------------------------|
| **Entry** | `POST /v1/architecture/request`, `ArchitectureRunService` | `AuthorityRunOrchestrator` / `AuthorityPipelineStagesExecutor` |
| **Primary actors** | `IAgentExecutor`, `DecisionEngineService` (merge) | Context ingestion → graph → findings → `RuleBasedDecisionEngine` |
| **Trace CLR type** | **`RunEventTrace`** (`RunEventTracePayload`) — merge/agent steps | **`RuleAuditTrace`** (`RuleAuditTracePayload`) — rule ids, finding accept/reject |
| **Trace JSON** | Same envelope for both: `DecisionTrace` base + `kind` + `runEvent` *or* `ruleAudit` (`DecisionTraceJsonConverter`) | (same wire shape when exposed as JSON) |
| **Manifest port** | `ICoordinatorGoldenManifestRepository` (versioned string manifest) | `IGoldenManifestRepository` (authority manifest + snapshot ids) |
| **Typical UI** | Runs / tasks / agent results / `GET .../runs/{id}/provenance` | Authority run detail, graph, `GET /v1/authority/runs/{id}/provenance` |

---

## Shared artifacts (overlap)

These concepts appear in **both** worlds or form the **bridge** between operator mental models:

| Artifact / concept | Coordinator use | Authority use |
|--------------------|-----------------|----------------|
| **`GoldenManifest` contract shape** | Output of merge on commit | Output of rule engine / builder after ingestion |
| **`FindingsSnapshot`** | May be referenced in merge/governance context | Primary input to rule-based decisioning |
| **Decision nodes** | `IDecisionEngineV2` / persisted `DecisionNode` rows at commit | Resolved decisions on authority manifest |
| **Traceability ids** | `ManifestMetadata.DecisionTraceIds` ↔ **`RunEventTrace`** `TraceId` | Provenance graph edges from **`RuleAuditTrace`** to rules/findings |
| **Scope** (`Tenant` / `Workspace` / `Project`) | All mutating routes | All authority rows and traces |

---

## Component breakdown

- **Coordinator path**: `RunsController` (`v1/architecture`) → `ArchitectureRunService` / `RunDetailQueryService` → manifest **reads** via `IUnifiedGoldenManifestReader` (ADR 0021 Phase 1); coordinator **writes** and traces still use `ICoordinatorGoldenManifestRepository` / `ICoordinatorDecisionTraceRepository` where orchestration persists those artifacts.
- **Authority path**: Ingestion connectors → `ContextSnapshot` → `GraphSnapshot` → `FindingsSnapshot` → `RuleBasedDecisionEngine` → `IDecisionTraceRepository` (rule audit) and `IGoldenManifestRepository`.
- **Naming**: Prefer **`RunEventTrace`** vs **`RuleAuditTrace`** in code and code review; the abstract **`DecisionTrace`** base is only the shared JSON/polymorphic carrier. Payload DTOs remain `RunEventTracePayload` / `RuleAuditTracePayload`.

---

## Data flow (side by side)

```mermaid
flowchart TB
  subgraph coord [Coordinator string run]
    R[ArchitectureRequest]
    T[Agent tasks / results]
    M[DecisionEngineService merge]
    RE[RunEventTrace rows]
    R --> T --> M --> RE
  end

  subgraph auth [Authority ingestion run]
    C[Context ingestion]
    G[Graph build]
    F[Findings engines]
    D[RuleBasedDecisionEngine]
    RA[RuleAuditTrace row]
    C --> G --> F --> D --> RA
  end

  GM[GoldenManifest]
  M --> GM
  D --> GM
```

**Intersection (conceptual)**: Both subgraphs can emit or consume **`GoldenManifest`**, **`FindingsSnapshot`**, and **decision** graph nodes; only the **trace subtype** and **repository port** differ.

---

## Onboarding walkthrough — one coordinator run (HTTP → committed manifest)

Use this when debugging **string** architecture runs (Swagger, CLI, or UI against `/v1/architecture/...`).

1. **`POST /v1/architecture/request`** — `RunsController.CreateRun` → `ArchitectureRunService.CreateRunAsync` persists `ArchitectureRequest`, `ArchitectureRun`, evidence bundle, and starter `AgentTask` rows (`ICoordinatorService` plans work).
2. **`POST /v1/architecture/run/{runId}/execute`** (or environment-driven auto-execution) — `ArchitectureRunService.ExecuteRunAsync` drives `IAgentExecutor`; results land in `AgentResult` via **`POST /v1/architecture/run/{runId}/result`** in integrated flows.
3. **Ready gate** — Run moves to **`ReadyForCommit`** when required agent results exist (see `ArchitectureRunService` status transitions).
4. **`POST /v1/architecture/run/{runId}/commit`** — `CommitRunAsync` loads request/tasks/results/evaluations, calls `IDecisionEngineV2.ResolveAsync` for **`DecisionNode`**s, then `IDecisionEngineService.MergeResults` (`DecisionEngineService`) to build **`GoldenManifest`** and append coordinator **`RunEventTrace`** rows.
5. **Traceability check** — `CommittedManifestTraceabilityRules.GetLinkageGaps` ensures `Manifest.Metadata.DecisionTraceIds` matches every persisted **`RunEventTrace`** id (merge attaches ids).
6. **Persist** — `ICoordinatorGoldenManifestRepository.CreateAsync`, `ICoordinatorDecisionTraceRepository.CreateManyAsync`, `IDecisionNodeRepository.CreateManyAsync`, and run status **`Committed`** with `CurrentManifestVersion` (`PersistCommittedRunRowsAsync`).
7. **Read-back** — `GET /v1/architecture/run/{runId}` (detail), `GET /v1/architecture/runs/{runId}/provenance` (linkage graph), manifest fetches by version as documented in `docs/ARCHITECTURE_FLOWS.md`.

**Mental model**: Stop at step 4 in the debugger once (`DecisionEngineService`, `DecisionMergeResult`); you will see **`List<RunEventTrace>`** in memory before SQL insert.

---

## Security model

Both paths honor **scope** (`TenantId` / `WorkspaceId` / `ProjectId`) and **authorization policies** on controllers. Provenance export and `/v1/authority/runs/{id}/provenance` require the same read authority as run detail.

**HTTP distinction (OpenAPI):** `GET /v1/authority/runs/{runId}/provenance` returns the **computed** structural graph (`DecisionProvenanceGraph`). `GET /v1/authority/runs/{runId}/provenance-snapshot` returns the **persisted** snapshot row (`DecisionProvenanceSnapshot`, raw graph JSON + metadata). These must not share the same path template.

---

## Operational considerations

- **Incomplete authority runs** (no graph/findings/trace) return **422** from the provenance endpoint; coordinator-only runs are expected to hit that path.
- **Tracing**: Use correlation IDs from the API; coordinator merge emits **`RunEventTrace`** rows for operator forensics.
- **Storage**: Coordinator SQL stores **run-event** payload JSON in `DecisionTraces.EventJson`; authority stores **rule-audit** fields in relational **decisioning** trace tables (`SqlDecisionTraceRepository`). The names are easy to confuse — use this doc and the **`RunEventTrace`** / **`RuleAuditTrace`** types when coding.

---

## Related docs

- [`docs/redirects.md`](../redirects.md#historical-adrs-removed-2026-08-02) — removed ADRs 0002, 0010, 0012, 0021
- [ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md)
- `docs/CONTEXT_INGESTION.md`
- `docs/ARCHITECTURE_FLOWS.md` — narrative run lifecycle
- [`../onboarding/ONBOARDING_HAPPY_PATH.md`](../onboarding/ONBOARDING_HAPPY_PATH.md) — HTTP spine redirect; [`../library/LIVE_E2E_HAPPY_PATH.md`](../library/LIVE_E2E_HAPPY_PATH.md) — scripted parity.
- `docs/architecture/README.md`
