> **Scope:** Copy-paste Composer/Cloud Agent prompts to preserve a future SecureNow API host without splitting `ArchLucid.Api` first. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/option-preserving-api-00-index.md`](../../.cursor/prompts/option-preserving-api-00-index.md) (**OP-01–OP-08**)
> **Depends on:** [`PRODUCT_LINE_COMPOSER_PROMPTS.md`](PRODUCT_LINE_COMPOSER_PROMPTS.md) (**PL-01–PL-05**) — one API, two UI processes. **PL-05** stays in force for the host.
> **Do not fork:** second API host (until **TB-2400** owner pickup); second SQL catalog (until **TB-2401** owner pickup); second Next.js app; long-lived git product branches; GTM **M-90 / M-44 / M-91 / M-92**; closed assurance **TB-135 / TB-136**; desktop review tab collapse; ADR 0037 RLS revival

# Option-preserving API split — Composer prompts (OP-01–OP-08)

**Created:** 2026-09-10 · **Status:** **OP-01–OP-06 Done** (2026-09-10); **OP-07**/**OP-08** tracked as tech backlog **TB-2400**/**TB-2401** · **Audience:** Cursor Composer implementing the backend modularization that keeps a later SecureNow API extract cheap.

Owner decision: two products may become two hosts and two catalogs **later**. The sequence that preserves that option is **capability cut → architecture tests → product-line on the wire → route 403 → omit-able composition registrars → Worker ownership**. A second `Program.cs` is a compile check of that graph, not the first move.

Paste **one** `.cursor/prompts/option-preserving-api-NN-*.md` file per Composer session. **Do not implement from this document’s tables.**

**Canonical contract (OP-01):** `docs/architecture/data/product-capability-map.json` — regenerate with `python3 scripts/ci/build_product_capability_map.py`; coverage enforced by `ProductCapabilityMapCoverageTests`.

**Namespace ratchet (OP-02):** `docs/architecture/data/product-capability-namespace-allowlist.json` — refresh with `ARCHLUCID_REFRESH_CAPABILITY_ALLOWLIST=1 dotnet test ArchLucid.Architecture.Tests --filter Refresh_namespace_allowlist_snapshot` or `scripts/ci/refresh_product_capability_namespace_allowlist.sh`; enforced by `ProductCapabilityNamespaceRatchetTests`.

**Product-line signal (OP-03):** `ProductLine:Deployment` (default `both`) plus optional `X-ArchLucid-Product-Line`; resolved by `IProductLineRequestAccessor`. SecureNow UI forwards the header on BFF proxy; OpenAPI documents it as optional on `/openapi/v1.json`.

**Route gate (OP-04):** `ProductLineRouteGateMiddleware` blocks exclusive map rows when effective line is the other shell (403 problem+json). Unmapped controllers fail closed (500). Map loaded from `product-capability-map.json` at runtime.

Related (do not mix into an OP session): Security **display name** SecureNow is **SN-01–SN-08**. UI shells are **PL-01–PL-04**. Help job-match is **SH-01–SH-26**.

## Diagnosis → prompt

| Class | Prompt | Residual |
|-------|--------|----------|
| Controllers and Application are one blob | **OP-01** | Every controller classified; namespaces clustered |
| Cut is documentation-only | **OP-02** | Ratchet + NetArchTest so leakage cannot grow |
| Local dual-UI shares one API | **OP-03** | Deployment `both` + optional header; request cannot escalate |
| Security UI gate is Next.js-only | **OP-04** | API 403 Architecture-only routes |
| INV-006 host still registers everything | **OP-05** | Four facades; `AddArchLucidApplicationServices` still calls all |
| Background work has no product owner | **OP-06** | Hosted services classified; still one Worker |
| Pressure to clone the HTTP project | **TB-2400** (was **OP-07**) | Second-host compile check — backlog |
| Pressure to clone `ArchLucid.sql` | **TB-2401** (was **OP-08**) | Catalog split last — backlog |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **OP-01** Capability map | **First** | PL-05; do not move code |
| **OP-02** Architecture ratchet | After 01 | Map JSON |
| **OP-03** Product-line signal | After 01 | Additive header + host options |
| **OP-04** Architecture route gate | After 02+03 | Map `productLine` + resolver |
| **OP-05** Composition registrars | After 02 | Existing `Startup/Modules` |
| **OP-06** Worker ownership | After 01 | Parallel with 05 |
| **OP-07** → **TB-2400** | Backlog **V1.1** | Second-host compile check — [`TECH_BACKLOG_TB2400_INDEX.md`](../library/TECH_BACKLOG_TB2400_INDEX.md) |
| **OP-08** → **TB-2401** | Backlog **V2** | Catalog / DDL split last — same index |

## Intentional — do not “fix”

- Do **not** add `SecureNow.Api`, `ArchLucid.Host.Security`, or a second Worker unless the owner picks up **TB-2400** in that session.
- Do **not** split migrations or catalogs, or change INV-006 / ADR 0037, unless the owner picks up **TB-2401** in that session.
- Do **not** move `ArchLucid.Application` folders in OP-01–06. The map and ratchet come first. Physical assembly splits are a later set after the graph is proven.
- Do **not** make the product-line header required (CLI, MCP, Worker, and local dual-UI would break).
- Do **not** 403 `both` or `disputed` map rows, or `/health/*` / OpenAPI.
- Do **not** treat missing CPA SOC 2 or a published third-party pen test as an OP engineering gap.

## Global constraints

See [`.cursor/prompts/option-preserving-api-00-index.md`](../../.cursor/prompts/option-preserving-api-00-index.md). Working-tree safety; one class per file; no `ConfigureAwait(false)` in tests; scoped tests only; stage only files the prompt names.
