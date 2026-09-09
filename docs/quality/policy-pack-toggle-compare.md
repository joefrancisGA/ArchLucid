# Policy pack toggle compare

> **Scope:** Checked-in regression artifact for declaration-security pack toggle; internal QA only — not buyer-facing certification evidence.

claimBoundary: proves tenant rule keys and bundled P1 SOC 2 vs CIS Azure packs change **declaration-security-baseline** findings on a fixed graph. Coverage, topology, cost, and inventory engines remain pack-inert; not evidence that all engines are policy-aware.

**Graph:** one `TopologyResource` (`api`) with `tf.public_network_access=enabled` and `httpsOnly=false`.

**Guard:** `PolicyPackToggleCompareReportTests` (`ArchLucid.Decisioning.Tests`, `Suite=Core`). Regenerate with `ARCHLUCID_RECORD_POLICY_PACK_TOGGLE_COMPARE=1`.

## Filtered rule-key postures (`PolicyFilteredDeclarationGoldenCorpusTests`)

| Posture | Filtered rule id | Finding title | PolicyRuleId |
| --- | --- | --- | --- |
| SOC 2 transport | soc2-004 | App service 'api' does not require HTTPS only. | soc2-004 |
| CIS Azure public access | cis-az-006 | Storage or data service 'api' allows public network access. | cis-az-006 |

## Bundled P1 packs (`PolicyPackP1ToggleGoldenCorpusTests`)

| Posture | Pack content file | Priority floor | Finding title | PolicyRuleId |
| --- | --- | --- | --- | --- |
| SOC 2 TSC architecture | soc2-tsc-architecture.json | P1 | App service 'api' does not require HTTPS only. | soc2-004 |
| SOC 2 TSC architecture | soc2-tsc-architecture.json | P1 | Storage or data service 'api' allows public network access. | soc2-018 |
| CIS Azure foundations | cis-azure-foundations.json | P1 | Storage or data service 'api' allows public network access. | cis-az-006 |
| CIS Azure foundations | cis-azure-foundations.json | P1 | App service 'api' does not require HTTPS only. | cis-az-025 |

