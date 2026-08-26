# Policy-filter golden delta

Regression instrument for `ComplianceRulePackGovernanceFilter` — not evidence that all 39 engines are policy-aware.

**Graph:** one network `TopologyResource` and one storage `TopologyResource` with no `SecurityBaseline` / `PolicyControl` coverage.

| Posture | `complianceRuleKeys` | Compliance finding rule id |
| --- | --- | --- |
| Storage-only | `storage-must-have-policy-applicability` | `storage-must-have-policy-applicability` |
| Network-only | `network-must-have-security-baseline` | `network-must-have-security-baseline` |

**claimBoundary:** proves tenant rule-key filtering changes compliance findings on a fixed graph. The six-engine `GoldenCorpusHarness` path still uses `FileComplianceRulePackProvider` unchanged.

## Declaration-security sibling (`PolicyFilteredDeclarationGoldenCorpusTests`)

**Graph:** one `TopologyResource` with `tf.public_network_access=enabled` and `httpsOnly=false`.

| Posture | Filtered rule id | Declaration finding |
| --- | --- | --- |
| SOC 2 transport | `soc2-004` | HTTPS / transport-security only (`soc2-004`) |
| CIS Azure public access | `cis-az-006` | Public network / data-protection only (`cis-az-006`) |

**claimBoundary:** proves tenant rule keys change **declaration-security-baseline** findings on a fixed graph. Coverage, topology, cost, and inventory engines remain pack-inert; this is not evidence that all 39 engines are policy-aware.
