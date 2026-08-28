# Policy-filter golden delta

Regression instrument for `ComplianceRulePackGovernanceFilter` — not evidence that all 39 engines are policy-aware.

**Graph:** one network `TopologyResource` and one storage `TopologyResource` with no `SecurityBaseline` / `PolicyControl` coverage.

| Posture | `complianceRuleKeys` | Compliance finding rule id |
| --- | --- | --- |
| Storage-only | `storage-must-have-policy-applicability` | `storage-must-have-policy-applicability` |
| Network-only | `network-must-have-security-baseline` | `network-must-have-security-baseline` |

**claimBoundary:** proves tenant rule-key filtering changes compliance findings on a fixed graph. The fourteen-engine `GoldenCorpusHarness` path still uses `FileComplianceRulePackProvider` unchanged.

## Declaration-security sibling (`PolicyFilteredDeclarationGoldenCorpusTests`)

**Graph:** one `TopologyResource` with `tf.public_network_access=enabled` and `httpsOnly=false`.

| Posture | Filtered rule id | Declaration finding |
| --- | --- | --- |
| SOC 2 transport | `soc2-004` | HTTPS / transport-security only (`soc2-004`) |
| CIS Azure public access | `cis-az-006` | Public network / data-protection only (`cis-az-006`) |

**claimBoundary:** proves tenant rule keys change **declaration-security-baseline** findings on a fixed graph. Coverage, topology, cost, and inventory engines remain pack-inert; this is not evidence that all 39 engines are policy-aware.

## Expectation-coverage sibling (`PolicyExpectationCoverageGoldenCorpusTests`)

**Graph:** `ContextSnapshot` plus network + compute `TopologyResource` nodes only (no storage, data, or identity).

| Posture | Stamp | Topology-coverage missing categories |
| --- | --- | --- |
| Baseline | none | `storage`, `data` (no `identity`) |
| Identity extra | `policyExpectedTopologyCategories=identity` | `storage`, `data`, **`identity`** |

**claimBoundary:** proves stamped `advisoryDefaults` extras change **topology-coverage** findings on a fixed graph. Coverage extras are additive; open-commitment remains pack-inert; not all 39 engines are policy-aware.

## Bundled-pack declaration coverage (PP-01, measured 2026-08-28)

Guard: `BundledPolicyPackDeclarationThemeTests` (`ArchLucid.Decisioning.Tests`, `Suite=Core`, so the `master` push corset runs it). It resolves each bundled pack through the same path as `PolicyFilteredComplianceRulePackProvider`: the merged file catalog (`default-compliance.rules.json` **+** `ga-starter-compliance.rules.json`, **795** rules) narrowed by `complianceRuleKeys` and then by `priorityFloor`.

**Two mechanisms decide whether a pack moves declaration rows** — both must hold:

1. a theme-mapped rule id in `DeclarationSignalPolicyKeyMap` must be **present in the merged catalog**, and
2. that rule's `priority` must **survive the pack's `priorityFloor`** (floor `P0` evaluates only `P0` rules, per [`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../library/POLICY_PACK_RULE_PRIORITY_MODEL.md) §Inclusion rule).

### Declaration themes enabled per pack

| Bundled pack | At shipped `P0` (before) | At shipped `P0` (now) | At `P1` |
| --- | --- | --- | --- |
| `security-architecture-baseline` | **silent** | **`data-protection`** (`sec-base-006`) | `data-protection` |
| `aks-production-baseline` | `workload-isolation` | `workload-isolation` | + `network-isolation` |
| `eks` / `gke-production-baseline` | `workload-isolation` | `workload-isolation` | + `data-protection`, `network-isolation` |
| `gdpr-baseline` | `encryption`, `transport-security` | unchanged | unchanged |
| `pci-dss-architecture` | `data-protection`, `network-isolation` | unchanged | unchanged |
| `soc2-tsc-architecture` | silent | silent | **`encryption`, `transport-security`** (`soc2-003`, `soc2-004`) |
| `cis-azure-foundations` | silent | silent | **`data-protection`** (`cis-az-006`) |
| `cis-aws` / `cis-gcp-foundations` | silent | silent | `data-protection`, `encryption` |
| `hipaa-architecture`, `iso27001-architecture`, `zero-trust-architecture` | silent | silent | still silent — see gap 2 |

**Closed by this change:** `security-architecture-baseline` emitted **no** declaration rows at its shipped floor because its only mapped id (`sec-base-028`) is `P2`. Mapping the `P0` control `sec-base-006` ("Data stores avoid public internet exposure") fixes that; `aks`/`eks`/`gke-002` and `-003` do the same for the Kubernetes baselines.

**Deliberately not fixed:** frameworks whose `P0` tier is identity or administrative stay silent at the pilot floor. CIS Azure `P0` is `cis-az-001`…`005` (MFA, guest users, Conditional Access, consent); HIPAA `P0` is boundary/risk-analysis documentation; ISO 27001 `P0` is asset inventory and classification. The declaration classifier evaluates storage public access, HTTPS-only, TLS posture, admin ingress, and container privilege — none of those controls govern any of it. Mapping them anyway would emit a **false `PolicyRuleId`** on buyer exports, which is worse than silence.

### Remaining gaps (owner decisions, not defects to patch blindly)

| # | Gap | Evidence | Lever |
| --- | --- | --- | --- |
| 1 | **`priorityFloor: P0` hides declaration controls.** SOC 2 and CIS Azure only move declaration rows at `P1`. | table above | Whether bundled declaration packs should ship `P1` (A4 frames `P0` as provisional "until corpora are fully tagged"). |
| 2 | **Catalog truncated to 10 rules** for `soc2`, `cis-az`, `gdpr`, `hipaa`, `iso27001`, `pci`, `zta`, `aks`, so **18 of 28** declared keys in **18** packs resolve to nothing — and mapped ids `soc2-018`, `cis-az-012/018/019/025/027`, `hipaa-017/022/024`, `iso27001-025`, `aks-015/021` can never fire. | `Theme_map_never_cites_a_rule_id_outside_the_documented_unbacked_set` | Extend `ga-starter-compliance.rules.json` to full framework coverage with real `appliesToCategory` / `requiredNodeType` / `requiredEdgeType`. |

Gap 2 is why HIPAA, ISO 27001, and Zero Trust stay silent even at `P1`.

**Rejected design — do not implement.** A "family tier" letting any prefix-family id (e.g. `soc2-001` alone) enable every theme its framework governs. It would override an admin's deliberate rule curation and emit findings with no citable rule id. Prefix-family membership stays **vocabulary detection only**, never theme enablement.

**claimBoundary:** same architecture + different assigned pack ⇒ different declaration rows and different cited rule ids, **demonstrable today for `security-architecture-baseline`, the Kubernetes baselines, GDPR, and PCI at shipped floors, and for SOC 2 vs CIS Azure at `P1`**. Not evidence that all 39 engines are policy-aware.
