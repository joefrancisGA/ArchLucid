# Policy-filter golden delta

Regression instrument for `ComplianceRulePackGovernanceFilter` — not evidence that all 39 engines are policy-aware.

**Graph:** one network `TopologyResource` and one storage `TopologyResource` with no `SecurityBaseline` / `PolicyControl` coverage.

| Posture | `complianceRuleKeys` | Compliance finding rule id |
| --- | --- | --- |
| Storage-only | `storage-must-have-policy-applicability` | `storage-must-have-policy-applicability` |
| Network-only | `network-must-have-security-baseline` | `network-must-have-security-baseline` |

**claimBoundary:** proves tenant rule-key filtering changes compliance findings on a fixed graph. The six-engine `GoldenCorpusHarness` path still uses `FileComplianceRulePackProvider` unchanged.
