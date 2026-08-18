> **Scope:** Contributor-reference — Reference for **built-in finding engines** — identifiers, owning assemblies, and representative output patterns.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Finding engine output reference

**Last reviewed:** 2026-08-17

**Formal spec:** [`../architecture/architecture_handbook/75-architecture-and-review-engines.md`](../architecture/architecture_handbook/75-architecture-and-review-engines.md) §3.3.

**Source of truth for plugin skip ids:** `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery.BuiltInEngineTypeIds`. Plugins must use **distinct** `EngineType` values or they are skipped at discovery time.

**Source of truth for what actually runs:** DI registration in `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.Decisioning.cs`. The skip set is a **proper subset** of registered engines — several Application and Cost engines are registered but not listed in `BuiltInEngineTypeIds` (handbook chapter 75 boundary B8; prompt EK-02). Do not treat the skip set as the full catalog.

All engines below implement **`IFindingEngine`** unless noted.

---

## Decisioning (graph-pure, typical)

| Engine id | Implementation | Category | What it analyzes |
|-----------|----------------|----------|------------------|
| `requirement` | `RequirementFindingEngine` | Requirement | Requirement nodes vs graph evidence. |
| `requirement-expectation` | `RequirementExpectationFindingEngine` | Requirement | Expected requirement coverage. |
| `requirement-gap` | `RequirementGapFindingEngine` | Requirement | Missing requirements. |
| `requirement-coverage` | `RequirementCoverageFindingEngine` | Requirement | Requirement coverage scoring. |
| `requirement-cross-run-diff` | `RequirementCrossRunDiffFindingEngine` | Requirement | Name-level delta vs prior context encoded on the current graph. |
| `topology-coverage` | `TopologyCoverageFindingEngine` | Topology | Component/service coverage vs topology expectations. |
| `topology-structure` | `TopologyStructureFindingEngine` | Topology | Structural topology properties. |
| `topology-cross-run-diff` | `TopologyCrossRunDiffFindingEngine` | Topology | Topology delta vs prior snapshot metadata on the graph. |
| `topology-anti-pattern` | `TopologyAntiPatternFindingEngine` | Topology | Anti-pattern matches. |
| `security-baseline` | `SecurityBaselineFindingEngine` | Security | Baseline security controls and gaps. |
| `security-baseline-expectation` | `SecurityBaselineExpectationFindingEngine` | Security | Expected baseline controls. |
| `security-baseline-completeness` | `SecurityBaselineCompletenessFindingEngine` | Security | Completeness of baseline nodes. |
| `security-gap` | `SecurityGapFindingEngine` | Security | Security gaps. |
| `security-coverage` | `SecurityCoverageFindingEngine` | Security | Security-relevant coverage across the graph. |
| `policy-applicability` | `PolicyApplicabilityFindingEngine` | Policy | Which policies apply to the snapshot. |
| `policy-coverage` | `PolicyCoverageFindingEngine` | Policy | Policy rule coverage results. |
| `compliance` | `ComplianceFindingEngine` | Compliance | Rule-pack violations → `ComplianceFinding` payloads. |
| `cost-constraint` | `CostConstraintFindingEngine` | Cost | `CostConstraint` graph nodes → cost/architecture findings. |
| `cost-breach` | `CostBreachFindingEngine` | Cost | Constraint breaches. |

## Application (effectful — close over extractors / options)

These still implement `IFindingEngine.AnalyzeAsync(GraphSnapshot, …)` but read additional repositories. The interface does not declare those effects (chapter 75, boundary B13; prompt EK-05).

| Engine id | Implementation | What it analyzes |
|-----------|----------------|------------------|
| `orphaned-azure-resource` | `OrphanedAzureResourceFindingEngine` | Azure inventory orphans. |
| `orphaned-aws-resource` | `OrphanedAwsResourceFindingEngine` | AWS inventory orphans. |
| `orphaned-gcp-resource` | `OrphanedGcpResourceFindingEngine` | GCP inventory orphans. |
| `azure-inventory-reconciliation` | `GraphAzureInventoryReconciliationFindingEngine` | Graph vs Azure inventory. |
| `aws-inventory-reconciliation` | `GraphAwsInventoryReconciliationFindingEngine` | Graph vs AWS inventory. |
| `gcp-inventory-reconciliation` | `GraphGcpInventoryReconciliationFindingEngine` | Graph vs GCP inventory. |
| `azure-inventory-security-baseline` | `AzureInventorySecurityBaselineFindingEngine` | Azure inventory vs security baseline. |
| `aws-inventory-security-baseline` | `AwsInventorySecurityBaselineFindingEngine` | AWS inventory vs security baseline. |
| `gcp-inventory-security-baseline` | `GcpInventorySecurityBaselineFindingEngine` | GCP inventory vs security baseline. |
| `advisor-cost-recommendation` | `AdvisorCostRecommendationFindingEngine` | Cloud advisor cost recommendations. |

`TechnologyConsistencyFindingEngine` implements **`ITechnologyConsistencyFindingEngine`**, not `IFindingEngine`. It is not in the findings fold.

---

## Output shape (conceptual)

Emit **`Finding`** records (`ArchLucid.Contracts/Findings/Finding.cs`) with:

- **`EngineType`** — stable id from the tables above (or plugin id).
- **`Category`** — must match the engine category after orchestrator fill; mismatch throws.
- **Structured payload** — engine-specific DTOs under **`ArchLucid.Decisioning.Findings.Payloads`**.
- **Severity**, optional **`PolicyRuleId`**, envelope fields (confidence, mute, treatment, model alias, …).

**Orchestrator merge:** parallel invoke; total failure → `AggregateException`; partial failure → snapshot + `FindingEngineFailure` rows; dedup key is `FindingType|Title` (first wins), **not** `FindingId` and **not** ADR 0063 `{policyRuleId:fingerprint}` (prompt EK-04).

**UI / exports:** Findings roll into review surfaces, manifest snapshots, and **[PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)** Pilot vs Operate narratives — the manifest remains the buyer-facing aggregate artifact.

---

## Plugins

External **`IFindingEngine`** implementations can be dropped into **`ArchLucid:FindingEngines:PluginDirectory`**. Assemblies named **`ArchLucid.*`** are ignored in the plugin scan. Parameterless public constructor required.

---

## Related

- **[ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md)** — review / authority pipeline context.
- **[V1_SCOPE.md](V1_SCOPE.md)** — which engines and integrations are in headline scope vs deferred.
- **[HOWTO_FINDING_ENGINE_PLUGINS.md](HOWTO_FINDING_ENGINE_PLUGINS.md)** — plugin contract.
- **[ENGINE_KERNEL_REMEDIATION_PROMPTS.md](../architecture/ENGINE_KERNEL_REMEDIATION_PROMPTS.md)** — EK-02, EK-04, EK-05.
