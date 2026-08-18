# 2. Containers and domain libraries

## Deployable containers

| Container | Responsibility |
|-----------|----------------|
| **archlucid-ui** | Operator / marketing shell; BFF proxy to API |
| **ArchLucid.Api** | Versioned REST, authZ, orchestration entry |
| **ArchLucid.Worker** | Outbox drain, queues, long-running jobs |
| **ArchLucid.Cli** | Scripted run lifecycle and graph export |

## Major libraries

| Library | Responsibility |
|---------|----------------|
| **ArchLucid.Application** | Runs, export, replay, analysis orchestration |
| **ArchLucid.Decisioning** | Policy packs, merge, governance, schema validation |
| **ArchLucid.Persistence** | Dapper SQL authority + workflow data access |
| **ArchLucid.ContextIngestion** | Evidence / context pipeline |
| **ArchLucid.KnowledgeGraph** | Graph snapshots from context |
| **ArchLucid.ArtifactSynthesis** | Artifact generators and packaging |
| **ArchLucid.Retrieval** | Embedding / indexing / Ask RAG path |
| **ArchLucid.AgentSimulator** | Deterministic `IAgentExecutor` / `IReviewEngine` double — not the review evaluation kernel |
| **ArchLucid.Host.Composition** | DI graphs shared by Api and Worker |

Deep dive: `docs/library/ARCHITECTURE_CONTAINERS.md`, `docs/library/ARCHITECTURE_COMPONENTS.md`.
