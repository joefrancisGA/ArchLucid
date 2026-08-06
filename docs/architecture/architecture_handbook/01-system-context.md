# 1. System context

ArchLucid turns architecture requests and evidence into versioned packages (golden manifests), decision traces, governance evidence, and exportable artifacts.

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
- Azure OpenAI, Service Bus, and Blob are optional for live models, integration fan-out, and large artifacts.
