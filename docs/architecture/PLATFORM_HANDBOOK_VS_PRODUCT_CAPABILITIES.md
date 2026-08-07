> **Scope:** Clarifies platform meta-documentation (handbook + zoom-in diagrams) versus ArchLucid product capabilities for customer architecture reviews.
> **Spine doc:** [`../START_HERE.md`](../START_HERE.md) · **Handbook:** [`architecture_handbook/README.md`](architecture_handbook/README.md) · **Diagrams:** [`architecture_diagrams/README.md`](architecture_diagrams/README.md)

# Platform handbook vs product capabilities

**Audience:** Engineers and owners deciding whether a deliverable should come from **in-repo documentation / coding-agent work** or from the **ArchLucid product** (authority pipeline, exports, graph tools).

## Summary

ArchLucid is the system of record for **customer architecture intelligence** (evidence → review → golden manifest → exports).  
Coding-agent / repo work is the path for **platform meta-architecture** (documenting ArchLucid itself, zoom-in diagrams, regenerable Word handbook, code and IaC changes).

They complement each other; neither replaces the other.

## Capability comparison

| Capability | Coding agent / repo docs | ArchLucid product |
|------------|--------------------------|-------------------|
| Document **ArchLucid itself** from the monorepo | Yes — ADRs, flows, handbooks, DOCX | No — not a self-documenting platform handbook feature |
| Edit/create code, tests, Terraform, scripts | Yes | No |
| Review a **customer’s** architecture from evidence | No live tenant pipeline | Yes — authority pipeline, golden manifest, findings |
| Enforce governance / policy packs on tenant data | No | Yes |
| Consulting DOCX / package for a **reviewed run** | Can draft docs offline only | Yes — product export path |
| Mermaid of a **run’s provenance graph** | Only if invented from code (not live run state) | Yes — UI Mermaid artifacts + CLI `graph export` |
| Multi-tenant isolation, authZ, outboxes in production | No | Yes |
| Cross-repo synthesis + regenerable **platform** Word book | Yes — handbook + Pandoc script | No |

## What the product already does with diagrams and DOCX

| Capability | What exists |
|------------|-------------|
| **Mermaid in UI** | Review artifacts can be classified/rendered as Mermaid (`MermaidDiagram`, architecture diagram panel). |
| **Graph export** | CLI `graph export <runId> --format mermaid\|graphml` from the run provenance graph. |
| **Consulting DOCX** | Architecture package / analysis DOCX exports for a *reviewed* customer architecture. |
| **This platform handbook** | Not a product feature — zoom-ins and `architecture_handbook/` are **repo documentation** about ArchLucid itself. |

## Living platform handbook (repo)

Canonical approach for an exhaustive, diagram-backed description of the **platform**:

1. Keep a **Markdown chapter spine** under [`architecture_handbook/`](architecture_handbook/).
2. Keep Mermaid sources + SVG/PNG under [`architecture_diagrams/`](architecture_diagrams/).
3. **Regenerate DOCX** with:

```powershell
.\scripts\docs\generate-architecture-handbook-docx.ps1
```

Output: `docs/architecture/architecture_handbook/ARCHITECTURE_HANDBOOK.docx`  
(Chapters rewrite `.svg` image links to `.png` for reliable Pandoc embedding on Windows.)

## Zoom-in diagram series (status snapshot)

Diagrams live under [`architecture_diagrams/`](architecture_diagrams/). Series planned for the handbook:

| # | Topic | Role |
|---|--------|------|
| — | System overview + review happy path | Context |
| 1 | Authority pipeline | Starter |
| 2 | Authority vs legacy coordinator | Starter |
| 3 | Async / outbox path | Starter |
| 7 | Governance & policy packs | Starter (next) |
| 11 | Tenant isolation | Starter |
| 12 | Azure deployment topology | Starter |
| 4–6, 8–10, 13–15 | Export/replay, comparison/drift, .NET graph, RAG, artifacts, security, UI shell, first-run, ITSM | Shipped |
| — | Stage zoom-ins, failure/failover, Ask/RAG + webhook threats | Shipped (handbook ch. 13–15) |

Regenerate DOCX after Mermaid SVG/PNG render: `.\scripts\docs\generate-architecture-handbook-docx.ps1 -SkipPngRender` (or `-Pack Buyer`).

## Related docs

| Need | Doc |
|------|-----|
| Architecture poster | [`../ARCHITECTURE_ON_ONE_PAGE.md`](../ARCHITECTURE_ON_ONE_PAGE.md) |
| C4 index | [`README.md`](README.md) |
| Flows | [`../library/ARCHITECTURE_FLOWS.md`](../library/ARCHITECTURE_FLOWS.md) |
| Containers | [`../library/ARCHITECTURE_CONTAINERS.md`](../library/ARCHITECTURE_CONTAINERS.md) |
| Consulting DOCX (product) | [`../library/CONSULTING_DOCX_TEMPLATE.md`](../library/CONSULTING_DOCX_TEMPLATE.md) |
| CLI graph export | [`../library/CLI_USAGE.md`](../library/CLI_USAGE.md) |
