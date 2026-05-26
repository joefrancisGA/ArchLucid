> **Scope:** Contributor-reference — Reference for **built-in finding engines** — identifiers, owning assemblies, and representative output patterns.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Finding engine output reference

**Last reviewed:** 2026-05-10

**Source of truth:** Built-in engine type ids are listed in
`ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery.BuiltInEngineTypeIds` (repository) and extended by **`cost-constraint`** in `ArchLucid.Capabilities.Cost`. Plugins must use **distinct** `EngineType` values or they are skipped at discovery time.

---

## Built-in engines

| Engine id | Implementation (typical) | Category | What it analyzes |
|-----------|--------------------------|----------|------------------|
| `requirement` | `RequirementFindingEngine` | Requirements | Requirement nodes vs graph evidence. |
| `topology-coverage` | `TopologyCoverageFindingEngine` | Topology | Component/service coverage vs topology expectations. |
| `security-baseline` | `SecurityBaselineFindingEngine` | Security | Baseline security controls and gaps. |
| `security-coverage` | `SecurityCoverageFindingEngine` | Security | Security-relevant coverage across the graph. |
| `policy-applicability` | `PolicyApplicabilityFindingEngine` | Policy | Which policies apply to the snapshot. |
| `policy-coverage` | `PolicyCoverageFindingEngine` | Policy | Policy rule coverage results. |
| `requirement-coverage` | `RequirementCoverageFindingEngine` | Requirements | Requirement coverage scoring. |
| `compliance` | `ComplianceFindingEngine` | Compliance | Rule-pack violations → `ComplianceFinding` payloads. |
| `cost-constraint` | `CostConstraintFindingEngine` | Cost | `CostConstraint` graph nodes → cost/architecture findings. |

---

## Output shape (conceptual)

All engines implement **`IFindingEngine`** (`ArchLucid.Decisioning/Interfaces/IFindingEngine.cs`) and emit **`Finding`** records with: — stable id from the table above (or plugin id).
- **`Category`** — UX grouping (Security, Topology, …).
- **Structured payload** — engine-specific DTOs under **`ArchLucid.Decisioning.Findings.Payloads`** (e.g. compliance violations reference rule identifiers).
- **Severity** — mapped per engine rules; compliance maps from violation text with a safe default.

**UI / exports:** Findings roll into review surfaces, manifest snapshots, and **[PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)** Pilot vs Operate narratives — the manifest remains the buyer-facing aggregate artifact.

---

## Plugins

External **`IFindingEngine`** implementations can be dropped into the configured plugin directory (see `FindingEnginePluginDiscovery` CLI comments). Assemblies named **`ArchLucid.*`** are ignored in the plugin scan to avoid double-loading core engines.

---

## Related

- **[ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md)** — review / authority pipeline context.
- **[V1_SCOPE.md](V1_SCOPE.md)** — which engines and integrations are in headline scope vs deferred.
