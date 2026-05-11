# `archlucid-ui` — agent scope

## What this folder is

Next.js (App Router) UI for ArchLucid: marketing, operator shell, and review workflows. It consumes the HTTP API; **business rules and authority logic live in .NET** under the repo root.

## Before large UI refactors

- **API contract of record:** `docs/library/API_CONTRACTS.md` (canonical surface is **`GET /openapi/v1.json`**, not Swagger-only JSON).
- **Generated types:** `npm run generate:api-types` → `src/lib/api-types.generated.ts` (must stay aligned when OpenAPI changes; see root workspace rule **`Http-Surface-Docs-And-Clients.mdc`**).

## Typical commands

From **`archlucid-ui/`**:

| Task | Command |
|------|---------|
| Install deps | `npm ci` |
| Lint / unit tests | See **`package.json`** scripts (Vitest). |
| E2E | Playwright scripts in **`package.json`** (often require API / env — see **`docs/engineering/BUILD.md`**). |

Repo-wide build graph: **`docs/engineering/BUILD.md`**.

## .NET coupling (minimal Solution Filter)

Open **`ArchLucid.UI.slnf`** at the repo root when you only need **Contracts + `ArchLucid.Api.Client`** beside this folder (e.g. verifying generated client parity). Full backend work stays on **`ArchLucid.sln`** or **`ArchLucid.Backend.slnf`**.

## Repo-level agent docs

See root **`AGENTS.md`** for monorepo layout, assessments read list, and other **`*.slnf`** filters.
