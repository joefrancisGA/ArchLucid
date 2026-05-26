> **Scope:** Contributor-reference — ArchLucid system map - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid system map

**Canonical poster:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · **Operator atlas:** [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md)

High-level flows for navigation and onboarding. For component detail see [ARCHITECTURE_COMPONENTS.md](./ARCHITECTURE_COMPONENTS.md) and [ARCHITECTURE_FLOWS.md](./ARCHITECTURE_FLOWS.md).

---

## Primary HTTP flows

### Create architecture run (`POST /v1/architecture/runs` and related)

```mermaid
sequenceDiagram
    participant C as Client
    participant API as ArchLucid.Api
    participant App as ArchitectureRunService
    participant Coord as CoordinatorService
    participant Orch as AuthorityRunOrchestrator
    participant SQL as SQL persistence

    C->>API: ArchitectureRequest
    API->>App: CreateRunAsync
    App->>Coord: CreateRunAsync
    Coord->>Orch: ExecuteAsync / BeginDeferredAsync
    Note over Orch: Ingestion → graph → findings → decision → artifacts → commit
    Orch-->>Coord: RunRecord
    Coord-->>App: CoordinationResult (run, evidence, tasks)
    App->>SQL: Transaction: request, run, evidence, tasks
    App-->>API: CreateRunResult
    API-->>C: 201 + run id
```

### Execute run (agent tasks → commit)

```mermaid
sequenceDiagram
    participant C as Client
    participant API as ArchLucid.Api
    participant App as ArchitectureRunService
    participant Agents as Agent execution
    participant SQL as SQL persistence

    C->>API: POST execute
    API->>App: ExecuteRunAsync
    App->>Agents: Dispatch / evaluate
    Agents->>SQL: Results, manifest commit
    App-->>C: ExecuteRunResult
```

### Advisory scan (worker / combined host)

```mermaid
sequenceDiagram
    participant Host as Worker or Combined
    participant Lease as HostLeaderElection
    participant Adv as AdvisoryScanHostedService
    participant Runner as AdvisoryScanRunner
    participant SQL as SQL persistence

    Host->>Lease: Acquire lease (optional)
    Adv->>Runner: Due schedules
    Runner->>SQL: Read runs, write digest / recommendations
```

---

## Composition root entry points

| Host | File | Responsibility |
|------|------|----------------|
| API | `ArchLucid.Api/Program.cs` | HTTP pipeline, config validation, `AddArchLucidApplicationServices` |
| Worker | `ArchLucid.Worker/Program.cs` | Background loops, health, shared DI |
| DI assembly | `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions*.cs` (+ `Configuration/ArchLucidStorageServiceCollectionExtensions.cs`) | Partial classes: storage, agents, scheduling, alerts, pipeline, coordinator |

---

## Feature flags (Microsoft.FeatureManagement)

Section `FeatureManagement:FeatureFlags` in configuration. Used for gradual rollout of authority pipeline behavior. See `AuthorityPipeline:QueueContextAndGraph` and related options under `ArchLucid:AuthorityPipeline`.

---

## Observability artifacts

- **Traces**: `ArchLucidInstrumentation` activity sources (including `ArchLucid.AuthorityRun` and per-stage child activities).
- **Metrics**: OpenTelemetry meter **`ArchLucid`** (`ArchLucidInstrumentation.MeterName`); Prometheus scrape path under `Observability:Prometheus`. (Exported **metric series names** for queue depth and LLM usage use an `archlucid_*` prefix — see `infra/prometheus/`.)
- **LLM token dimensions (TB-015 Phase A)**: `LlmAccountingInvocationScope` (`AsyncLocal`) tags completion accounting with `consume_role` + `invoke_kind`; histogram **`archlucid.llm.completion_tokens`**.
- **Dashboards / alerts**: `infra/grafana/` and `infra/prometheus/` (reference JSON and rule files for operators).

---

## Context ingestion (TB-008 Phases 3–4)

| Component | Location | Role |
|-----------|----------|------|
| **`IConnectorDeltaComputer`** | `ArchLucid.ContextIngestion/Delta/` | Set-diff on `SourceId` replaces literal-string deltas (shared default + per-connector overrides via `ConnectorDeltaAsyncHelper`). |
| **`CompositeCanonicalEnricher`** | `ArchLucid.ContextIngestion/Canonicalization/` | Routes per-`ObjectType` enrichers (`TopologyResourceCanonicalEnricher`, `SecurityBaselineCanonicalEnricher`, …). |
| **`IPolicyTopologyOverlapResolver`** | `ArchLucid.ContextIngestion/Topology/` | Shared stable-ID overlap logic consumed by policy + topology stages (no duplicated normalizer rules). |

See [CONTEXT_INGESTION.md](./CONTEXT_INGESTION.md) for pipeline ordering and connector matrix.
