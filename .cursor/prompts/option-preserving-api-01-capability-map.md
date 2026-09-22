# OP-01 — Capability map (no host split, no code moves)

**Do not** add a second API project, Worker, Next.js app, or SQL catalog. **Do not** move `ArchLucid.Application` folders or split csproj files. **Do not** change INV-006 or ADR 0037.

If `docs/architecture/data/product-capability-map.json` already exists and `ProductCapabilityMapCoverageTests` already fail on an unmapped controller, **extend the map — do not invent a second file**.

## Goal

Commit a **machine-readable capability cut** so later sessions can 403 Architecture-only routes, ratchet namespace leakage, and (much later) extract a SecureNow host that only compiles against the modules it needs.

Classify **every** `ControllerBase` in `ArchLucid.Api` and every first-level `ArchLucid.Application.*` namespace cluster. Human prose without the JSON is not done.

## Why

Libraries today are **layers** (`Application`, `Persistence`, `Host.Composition`), not products. SecureNow’s spine (findings, policy packs, infra evidence, users, IdP, extract-upload) lives in the same assemblies as runs and sealed manifests. A second HTTP project that “only takes what it needs” will take the whole graph until this cut exists.

## Context

- `ArchLucid.Api/Controllers/**/*Controller.cs`
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts` (UI hrefs — **hints**, not the API map)
- `ArchLucid.Core/ProductLine/ProductLineId.cs`
- `ArchLucid.Host.Composition/Startup/Modules/InfraEvidenceCompositionModule.cs`
- `ArchLucid.Architecture.Tests/DependencyInjection/ApiHostControllerAndHandlerDiscovery.cs`
- UI catalog: branding, SCIM, billing, recycle bin, Slack, webhooks, Azure Boards are **architecture**; infrastructure + findings + policy packs are **both**; extract-upload under infrastructure is **security**

## Capabilities (closed set)

| Id | Meaning | Typical productLine |
|----|---------|---------------------|
| `platform` | Auth, tenancy, users, IdP, health, version, support, operator shell, notifications prefs | `both` |
| `authority` | Runs, reviews, architecture objects, sealed manifests, planning/ask/compare for reviews, ROI, pilots, evolution, SCIM, Marketplace, outbound webhooks | `architecture` |
| `infra-evidence` | Inventory snapshots, drift, Terraform, diagrams, remediation factory/waves, audit evidence, cloud connections, extract-upload | `both` (exceptions per controller) |
| `governance` | Findings inspect/mute, policy packs, standards, governance approval/stickiness (not sealed-review orchestration) | `both` |

`productLine` values: `architecture` | `security` | `both`.

`status` values: `assigned` | `disputed`. Disputed rows **must** have `ownerNote`. OP-04 treats disputed as `both` (do not 403). Prefer `assigned` when the UI catalog and controller job agree.

## What to build

1. `docs/architecture/data/product-capability-map.json` with this shape (one file, sorted by `typeName`):

```json
{
  "version": 1,
  "capabilities": ["platform", "authority", "infra-evidence", "governance"],
  "alwaysAllowedRoutePrefixes": ["/health", "/openapi"],
  "controllers": [
    {
      "typeName": "ArchLucid.Api.Controllers.Authority.RunsController",
      "capability": "authority",
      "productLine": "architecture",
      "status": "assigned",
      "ownerNote": null
    }
  ],
  "applicationNamespaces": [
    {
      "namespacePrefix": "ArchLucid.Application.Runs",
      "capability": "authority",
      "status": "assigned",
      "ownerNote": null
    }
  ]
}
```

2. Classify **per controller type**, not per folder. Folder heuristics (verify, then override):
   - `Controllers/Authority`, `Architecture`, `Planning`, `Roi`, `Pilots`, `Evolution`, `Scim`, `Webhooks`, `Mcp` → likely `authority` / `architecture`
   - `Controllers/InfraEvidence`, `OperationalSecurity` → likely `infra-evidence` / `both` (TenantBranding* is UI-architecture — mark `architecture` or `disputed`)
   - `Controllers/Findings`, most `Governance` → likely `governance` / `both` (`ManifestsController` / sealed-review paths may be `authority`)
   - `Controllers/User`, `Support`, `Internal`, `Diagnostics`, `Operator`, `Notifications` → likely `platform` / `both`
   - `Controllers/Billing`, `Marketing`, `Demo` → likely `authority` or `platform` with `productLine: architecture` unless the route is truly shared
   - `Controllers/Integrations` and `Authority/Tier2ConnectionController` / `GcpTier2ConnectionController` → per action family; cloud connections are UI-`both` except AWS/GCP extras

3. `applicationNamespaces`: one row per first-level namespace under `ArchLucid.Application` (e.g. `Runs`, `InfraEvidence`, `Governance`, `Findings`, `Billing`). Root types in `ArchLucid.Application` (no extra segment) get prefix `ArchLucid.Application` and `capability: authority` or `disputed`.

4. Architecture tests (new files, one class per file) in `ArchLucid.Architecture.Tests`:
   - Load the JSON (repo-relative path; fail clearly if missing/invalid).
   - Every `ControllerBase` in `ArchLucid.Api` appears exactly once in `controllers`.
   - Every `capability` / `productLine` / `status` value is in the closed set.
   - Disputed rows have non-empty `ownerNote`.
   - Duplicate `typeName` fails.
   - Optional: warn-as-fail if `applicationNamespaces` prefixes do not cover at least the well-known folders `Runs`, `InfraEvidence`, `Governance`, `Findings` (exact list you discover).

5. Short pointer in `docs/architecture/OPTION_PRESERVING_API_SPLIT_COMPOSER_PROMPTS.md` that the map file is the contract (one sentence). Do not rewrite TECH_BACKLOG history.

## Acceptance criteria

- `dotnet test ArchLucid.Architecture.Tests --filter FullyQualifiedName~ProductCapabilityMap` is green.
- Map contains **all** API controllers (today ~200+ `*Controller.cs` types; do not stop at folders).
- Zero code moves. `ArchLucid.Api.csproj` project references unchanged.
- Disputed count is listed in the session summary. Prefer fewer than 15 disputed rows; if more, you under-classified.

## Constraints

- Do not emit a second map format (Markdown tables are optional comments only; JSON is canonical).
- Do not 403 anything in this prompt (that is **OP-04**).
- Do not add HTTP headers (that is **OP-03**).
- Do not classify Persistence tables except as optional `ownerNote` text. Schema split is **OP-08**.
- Commit on the feature branch the owner named (Cloud Agent: `cursor/option-preserving-api-prompts-3024` unless told otherwise).
- Scoped tests only.
