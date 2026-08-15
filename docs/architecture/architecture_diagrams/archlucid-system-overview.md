> **Scope:** ArchLucid system-context and review happy-path diagrams (Mermaid source + SVG).
> **Spine doc:** [`../../START_HERE.md`](../../START_HERE.md) · **Poster:** [`../../ARCHITECTURE_ON_ONE_PAGE.md`](../../ARCHITECTURE_ON_ONE_PAGE.md)

# ArchLucid — system overview

Browsers and CLI hit the API (optionally via Front Door/APIM); the API orchestrates reviews, governance, and exports against SQL; the Worker drains async outboxes; Azure OpenAI, Service Bus, and Blob are optional.

## System overview (rendered)

![ArchLucid system overview](archlucid-system-overview.svg)

Editable source: [`archlucid-system-overview.mmd`](archlucid-system-overview.mmd)

### Mermaid source

```mermaid
flowchart TB
  subgraph actors["People & automation"]
    OP["Operators / architects"]
    SP["Sponsors / evaluators"]
    CLI["CLI / CI automation"]
  end

  subgraph edge["Edge optional"]
    FD["Front Door"]
    GW["APIM"]
  end

  subgraph product["ArchLucid platform"]
    UI["Architect workspace<br/>Next.js BFF proxy"]
    API["ArchLucid.Api<br/>REST · auth · orchestration"]
    WK["ArchLucid.Worker<br/>outbox · queues · jobs"]
  end

  subgraph domain["Application domain libraries"]
    APP["Application<br/>runs · export · replay"]
    DEC["Decisioning<br/>policy packs · merge · governance"]
    SYN["ArtifactSynthesis<br/>bundles · packaging"]
    RET["Retrieval<br/>RAG · indexing"]
    CTX["ContextIngestion"]
    KG["KnowledgeGraph"]
    PER["Persistence<br/>Dapper · SQL authority"]
  end

  subgraph azure["Azure data plane"]
    SQL[("SQL Server<br/>tenant catalogs")]
    SB["Service Bus optional"]
    BL["Blob optional"]
    ID["Entra ID"]
    AOAI["Azure OpenAI optional"]
  end

  OP --> UI
  SP --> UI
  CLI --> FD
  UI --> FD
  FD --> GW
  GW --> API
  UI -.->|"local / direct"| API
  CLI -.->|"API client"| API

  API --> APP
  API --> DEC
  API --> SYN
  API --> RET
  APP --> PER
  DEC --> PER
  SYN --> PER
  RET --> PER
  CTX --> PER
  KG --> CTX

  API --> ID
  API --> SQL
  WK --> SQL
  API --> SB
  WK --> SB
  API --> BL
  WK --> BL
  API --> AOAI
  WK --> AOAI
```

## Review happy path (rendered)

![ArchLucid review happy path](archlucid-review-happy-path.svg)

Editable source: [`archlucid-review-happy-path.mmd`](archlucid-review-happy-path.mmd)

### Mermaid source

```mermaid
sequenceDiagram
  actor Architect
  participant UI as Architect workspace
  participant API as ArchLucid.Api
  participant Pipe as Coordinator / authority pipeline
  participant SQL as SQL Server
  participant Worker as ArchLucid.Worker
  actor Reviewer

  Architect->>UI: Create architecture request + evidence
  UI->>API: POST /v1/architecture/request
  API->>SQL: Persist run / request
  API->>Pipe: Execute review
  Pipe->>SQL: Manifests, traces, findings
  Pipe-->>UI: Timeline on review detail
  Architect->>API: Finalize / commit
  API->>SQL: Sealed record + artifacts
  API->>SQL: Outbox enqueue
  Worker->>SQL: Drain outbox / index / events
  Reviewer->>UI: Package, exports, sponsor view
```

## Further reading

| Need | Doc |
|------|-----|
| Architecture poster | [`../../ARCHITECTURE_ON_ONE_PAGE.md`](../../ARCHITECTURE_ON_ONE_PAGE.md) |
| C4 context / containers | [`../README.md`](../README.md) |
| Containers detail | [`../../library/ARCHITECTURE_CONTAINERS.md`](../../library/ARCHITECTURE_CONTAINERS.md) |
| Flows | [`../../library/ARCHITECTURE_FLOWS.md`](../../library/ARCHITECTURE_FLOWS.md) |
| Re-render SVG | [`README.md`](README.md) |
