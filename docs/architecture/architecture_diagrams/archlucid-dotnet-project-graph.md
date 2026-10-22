> **Scope:** Zoom-in — .NET project / library dependency graph.
> **Containers:** [`../../library/ARCHITECTURE_CONTAINERS.md`](../../library/ARCHITECTURE_CONTAINERS.md)

# ArchLucid — .NET project graph

![.NET project graph](archlucid-dotnet-project-graph.svg)

Editable source: [`archlucid-dotnet-project-graph.mmd`](archlucid-dotnet-project-graph.mmd)

```mermaid
flowchart TB
  UI["archlucid-ui<br/>Next.js"]
  CLI["ArchLucid.Cli"]
  API["ArchLucid.Api"]
  WK["ArchLucid.Worker"]
  HOST["ArchLucid.Host.Composition"]
  APP["ArchLucid.Application"]
  DEC["ArchLucid.Decisioning"]
  PER["ArchLucid.Persistence"]
  CTX["ArchLucid.ContextIngestion"]
  KG["ArchLucid.KnowledgeGraph"]
  SYN["ArchLucid.ArtifactSynthesis"]
  RET["ArchLucid.Retrieval"]
  CTR["ArchLucid.Contracts"]

  UI --> API
  CLI --> API
  API --> HOST
  WK --> HOST
  HOST --> APP
  HOST --> DEC
  HOST --> PER
  HOST --> RET
  APP --> DEC
  APP --> PER
  APP --> SYN
  DEC --> CTR
  PER --> DEC
  PER --> CTX
  KG --> CTX
  SYN --> CTR
  RET --> CTR
  CTX --> CTR
```
