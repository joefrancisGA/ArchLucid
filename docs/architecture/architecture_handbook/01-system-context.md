# 1. System context

ArchLucid turns architecture intent and evidence into **two co-equal jobs** (ADR 0067), not one funnel:

| Job | Kernel | Durable output |
|-----|--------|----------------|
| **Create architecture** | Synthesis — drafts and optional generation | Mutable draft; a run with origin `Created` is not a sealed record |
| **Review** | Evaluation — authority pipeline | Findings, decision trace, golden manifest, exports |

Both jobs may persist through `dbo.Runs` after spawn. That shared table is a persistence spine, not proof that the jobs are sequential lifecycle steps. Formal maps: chapter 75. Standalone Word pack: `docs/architecture/ARCHITECTURE_AND_REVIEW_ENGINES.docx`.

## Actors

| Actor | How they touch the system |
|-------|---------------------------|
| Operators / architects | Browser → Architect workspace (Next.js) |
| Sponsors / evaluators | Same UI; sponsor-oriented views and packages |
| CLI / CI automation | HTTPS → API (API key or JWT), optionally via Front Door / APIM |

## Diagram — system overview

![ArchLucid system overview](../architecture_diagrams/archlucid-system-overview.svg)

## Diagram — review happy path

![ArchLucid review happy path](../architecture_diagrams/archlucid-review-happy-path.svg)

## Trust edges (summary)

- UI proxies to `ArchLucid.Api` with scope and correlation headers.
- API authenticates via Entra ID / JWT or API keys (environment-dependent).
- Authoritative persistence is SQL Server (database-per-tenant catalogs).
- Completions use the model catalog (ADR 0065); embeddings remain Azure OpenAI. Service Bus and Blob are optional for integration fan-out and large artifacts.
