<!-- Infrastructure-evidence relationship-first topology Composer prompts.
     Origin: 2026-09-11 owner ask: optimize SecureNow/inventory diagram generation
     if the collector may call ARG + typed ARM reads (not ARM export / dependsOn).
     Do not implement from this index. -->

# Infrastructure-evidence relationship-first topology — Composer prompt set (IE-RF-01–IE-RF-12)

Inventory diagrams and SecureNow path engines walk **ARM ids that survived in the snapshot**. Today that is a thin property flatten (first NIC IP config, first private-endpoint target, parent/child from the ARM id). Resource Graph is already the Tier 1 index, but it dumps `properties` instead of emitting an edge list. Hosted collection lists `/resources` and usually has **empty** nested properties.

These prompts make collection **relationship-first** inside the **existing** extractor family. They do **not** add `Export-AzResourceGroup`, a second ZIP collector, or Azure calls at Mermaid render time.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/infra-evidence-rf-NN-*.md` file per Composer / Cloud Agent session.

Copy-paste docs index: [`docs/architecture/INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_RELATIONSHIP_FIRST_COMPOSER_PROMPTS.md).

Hold: [`docs/library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md`](../../docs/library/INFRA_EVIDENCE_RELATIONSHIP_FIRST_HOLD.md) (**IE-RF-12**).

Contracts: [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) (plane wins) · [`docs/library/SECURENOW_ARCHITECT_PLANE.md`](../../docs/library/SECURENOW_ARCHITECT_PLANE.md) (consumes edges; do not re-run SA-01–SA-22 bodies). Network-mode empty-canvas work stays **IE-ND-01–IE-ND-05** — do not re-open those as greenfield.

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | Association types are ad hoc strings; flatteners keep only `[0]` | **IE-RF-01** | Locked `associationType` catalog + ZIP/materialize contract |
| 2 | ARG `project properties` truncates; no typed edge queries | **IE-RF-02** | Tier 1 ARG relationship projections → `network-associations.json` |
| 3 | Hosted `/resources` list has empty nested properties | **IE-RF-03** | Type-scoped ARM list GETs on the existing hosted client |
| 4 | No VM→NIC; only first NIC IP config / first PE target | **IE-RF-04** | All IP configs + `vmToNic` |
| 5 | NSG/route/peering buried in VNet JSON, not edges | **IE-RF-05** | `nicToNsg`, `subnetToNsg`, `subnetToRouteTable`, `vnetPeering` |
| 6 | App Gateway / LB / Private DNS / App Service VNet missing | **IE-RF-06** | L7 + Private DNS + App Service subnet + extra PE hops |
| 7 | Materializer does not map new association types | **IE-RF-07** | Snapshot relationships + `ProvenanceKind` (extend SA-02, no new client) |
| 8 | Operators need VM→VNet on the picture without lying | **IE-RF-08** | Display-only derived layout edges (DeterministicInference) |
| 9 | Silent sparse graphs when ARG/list fails | **IE-RF-09** | Completeness warnings + CollectionStatus per relationship class |
| 10 | Intended vs effective NSG/UDR invisible | **IE-RF-10** | Optional effective NSG/routes, fail-soft, not executive default |
| 11 | Network mermaid still looks disconnected after new edges | **IE-RF-11** | Golden fixture: VM+NIC+subnet+VNet+NSG+peering in Network mode |
| 12 | Temptation to ARM-export / `dependsOn` / diagram-time Azure | **IE-RF-12** | Written hold — not implementation |

## Run order

**IE-RF-01** first (catalog). **IE-RF-02** and **IE-RF-03** after 01 (parallel: PowerShell vs hosted). **IE-RF-04** after 02 **or** 03 (needs nested properties). **IE-RF-05** / **IE-RF-06** after 02/03. **IE-RF-07** after 01 (fixtures can land before live collection) and must consume 04–06 types. **IE-RF-08** after 07. **IE-RF-09** after 02/03. **IE-RF-10** after 07; optional. **IE-RF-11** after 07+08. **IE-RF-12** is not implementation.

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IE-RF-01** | First | IE-02 ZIP layout, `network-associations.json` |
| **IE-RF-02** | After 01 | Catalog types; Az.ResourceGraph |
| **IE-RF-03** | After 01; parallel 02 | `GetOnlyHostedAzureArmReadClient` |
| **IE-RF-04** | After 02 or 03 | Nested NIC/VM properties |
| **IE-RF-05** | After 02 or 03 | VNet/NSG/route properties |
| **IE-RF-06** | After 02 or 03 | AppGW/LB/DNS/App Service lists |
| **IE-RF-07** | After 01; consume 04–06 | `AzureInventorySecurityEdgeMaterializer` |
| **IE-RF-08** | After 07 | `DiagramAstFromGraphCompiler` |
| **IE-RF-09** | After 02/03 | Telemetry / completeness warnings |
| **IE-RF-10** | After 07 | Optional; Security/reachability only |
| **IE-RF-11** | After 07+08 | IE-ND-01 category helper if present |
| **IE-RF-12** | Hold | — |

## Do not implement from this set

| Item | Why |
|------|-----|
| Second Azure / ARC-AMPE collector / `Get-SecureNowAttackPathPackage.ps1` | Plane §1 |
| `Export-AzResourceGroup` / ARM template export as diagram source | Live export ≠ intent; reconstructed `dependsOn` is a deploy DAG |
| `dependsOn` as architecture arrows | Deploy order, not topology |
| Per-resource ARM GET for every id in the subscription | Use type-scoped lists + ARG projections |
| Azure calls at Mermaid render / `DiagramAst` compile | Snapshots are append-only |
| Network Watcher topology as the primary graph | Watcher often missing; fail-soft only in **IE-RF-10** |
| Flow logs / VM Insights as architecture edges | Observed traffic ≠ intended topology |
| Promote `nsgAllowRule` Storage heuristic to ObservedFact | Remains DeterministicInference |
| `terraform apply` / ARM writes / write roles | IE plane §2 |
| `IFindingEngine` / coverage engines | `HOLD_NO_COVERAGE_ENGINES.md` |
| Re-open IE-ND-01–IE-ND-05 as greenfield | Those close Network-mode empty canvas |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |
| Desktop review tab collapse | workspace rule |

## Product vs company (every prompt)

- **SecureNow** = Security product in the Security shell.
- **ArchLucid** = Architecture product + legal/company.
- Collector scripts: change **shared** `ArchLucid.*.helpers.ps1`. `Get-SecureNowAzurePackage.ps1` is a branded variant — keep helper identifiers `ArchLucid.*`. Code identifiers stay `ArchLucid`. Env stays `ARCHLUCID_*`.

## Global constraints (every prompt)

- Read [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) first. **One Azure collector family.**
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files (Linux Cloud: `pwsh` from `$HOME/.local/bin`).
- Commit only on the named feature branch.
- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. Blank line before `if` / `foreach` unless first in method. Check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests.**
- ADR 0037: `TenantId` on every new table. Isolation test modeled on `SqlAzureExtractorPackageRepositoryScopeIsolationSqlIntegrationTests`.
- DbUp next unused number **and** `ArchLucid.sql` **and** `Migrations/Rollback/Rnnn_*.sql` only if a prompt requires a new table (prefer extending `network-associations.json` + existing relationship rows).
- HTTP: OpenAPI snapshot + route registry only if a prompt adds routes (this set should not).
- **AI explains evidence; AI is not the evidence.**
- UI: Carbon, sentence case, **TB-2005**, **TB-645**. No desktop tab collapse. Mermaid stays dynamically imported.
- One scoped compile; one retry on exit 1. No new NuGet unless the prompt says so.
- Stage only files the prompt names. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

## After each prompt

Summarize: files changed, tests run, which `associationType` / edge types landed, residual InsufficientEvidence / completeness warnings, hosted vs Tier 1 parity, Architecture review `IFindingEngine` stream unchanged, no-apply hold still holds.
