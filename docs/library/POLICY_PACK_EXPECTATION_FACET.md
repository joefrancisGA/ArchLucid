# Policy-pack expectation facets (V1)

**Status:** engineering contract for PP-03–PP-05 · **Encoding:** `PolicyPackContentDocument.advisoryDefaults` string keys (no OpenAPI change in V1).

Tenant policy packs already drive **rule-set selection** (`compliance`) and **declaration signal gating** (`declaration-security-baseline`, `declaration-premise-conflict`). This note defines how the same packs parameterize **coverage** and **cost** engines without muting commitment or cross-run history.

## Five policy-awareness kinds

| Kind | Representative engines | Pack influence in V1 |
|------|------------------------|----------------------|
| Rule-set selection | `compliance` | `complianceRuleKeys` / ids — shipped |
| Signal gating | `declaration-security-baseline`, `declaration-premise-conflict` | Theme / prefix maps — shipped (PP-01) |
| Expectation parameterization | `topology-coverage`, `security-coverage`, `security-gap`, `security-baseline-completeness`, `requirement-expectation`, `requirement-coverage`, `requirement-gap`, `required-capability-coverage` | **This note** — additive extras via graph stamp |
| Threshold / severity | `cost-constraint`, `cost-breach` | **This note** — `cost.requireBudgetCap`, `cost.breachSeverity` |
| Commitment / history | `open-commitment`, `portfolio-recurrence`, `requirement-cross-run-diff`, `topology-cross-run-diff` | **Never** — packs must not hide overdue waivers or review diffs |

**Non-goals:** inventory reconciliation (`orphaned-*`, `*-inventory-reconciliation`), pack-per-engine JSON catalogs, or implying all 39 engines are policy-aware.

## Additive floor

Pack extras **union** with heuristic baselines from `TopologyExpectedCategoryResolver`, `WorkloadConditionedSecurityControlFamilyResolver`, and `WorkloadConditionedRequirementExpectationResolver`. A pack cannot remove Network / Compute / Storage / Data pillars when the heuristic still expects them. Tests must prove a pack that lists only `identity` still keeps default pillars.

Missing or blank advisory keys = today's resolver behavior (no stamp, no change).

## Facet encoding (V1)

Reserved `advisoryDefaults` keys (pipe-separated values, ordinal ignore-case), same pattern as `priorityFloor`:

| Key | Values | Consumers |
|-----|--------|-----------|
| `expectation.topologyCategories.add` | Known topology categories (`network`, `compute`, `storage`, `data`, `identity`) | Topology coverage family |
| `expectation.securityControlFamilies.add` | Known control families (`identity-access`, `network-isolation`, …) | Security coverage / gap / completeness |
| `expectation.requirementThemes.add` | Free strings (`traceability`, `data-protection`, …) | Requirement expectation / coverage / gap |
| `cost.requireBudgetCap` | `true` / `false` / `1` / `0` / `yes` / `no` | `cost-constraint` |
| `cost.breachSeverity` | `Info` \| `Warning` \| `Error` \| `Critical` | `cost-breach` (only when a breach would already emit; minimum clamp Warning) |

Unknown keys are ignored. Invalid tokens within a list are skipped (no throw). First-class JSON facet on `PolicyPackContentDocument` is a later contract change if these keys prove useful.

## Graph stamp

`FindingsOrchestrator` loads `IEffectiveGovernanceLoader` for the ambient scope (`IScopeContextProvider`), parses merged `advisoryDefaults`, and writes pipe-separated extras onto the `ContextSnapshot` node via `ContextGraphPropertyKeys`. Coverage and cost engines keep `AnalyzeAsync(GraphSnapshot)` with no extra DI.

Fail-open: loader exceptions log and continue with an unstamped graph.

## GTM claim boundary

Assigning SOC 2 / CIS / FinOps can **add** required topology categories, security families, requirement themes, or cost thresholds. It does **not** mean all 39 finding engines are policy-aware. Commitment and cross-run engines remain pack-independent.

## Related docs

- [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md) — bundled packs and declaration coupling
- [`POLICY_PACK_EXPECTATION_COMPOSER_PROMPTS.md`](../architecture/POLICY_PACK_EXPECTATION_COMPOSER_PROMPTS.md) — implementation prompts PP-02–PP-05
- [`POLICY_PACK_RULE_PRIORITY_MODEL.md`](POLICY_PACK_RULE_PRIORITY_MODEL.md) — `priorityFloor` precedent
