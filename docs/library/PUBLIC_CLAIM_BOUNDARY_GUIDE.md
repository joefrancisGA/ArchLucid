> **Scope:** Contributor-reference — sales, marketing, and agent authoring for what ArchLucid may say in V1 vs deferred `(B)` / V1.1 items; buyer-facing claim guardrails (TB-134).

# Public claim boundary guide (TB-134)

## Allowed V1 claims (with proof)

- Architecture-review evidence from **committed** runs with labeled execution mode
- Self-assessed security posture and trust-center honesty (not CPA SOC 2)
- Service-led **AI & Cloud Architecture Readiness Review** and guided pilot paths
- ROI figures only when `roiBasisStatus` is classified and sponsor-safe

## Never imply in V1 copy (without explicit deferred caveat)

| Prohibited implication | Why | Say instead |
| --- | --- | --- |
| SOC 2 certified / CPA attested | TB-135 V1.1 backlog | Self-assessment; roadmap to CPA program |
| Buy on Azure Marketplace today | Commerce un-hold deferred | Request quote / guided pilot |
| Live Stripe production checkout | Build-flag gated | Request quote unless flag explicitly enabled |
| Public reference customer available | GTM owner output | Anonymized pilot evidence only |
| HIPAA / PCI / ISO **certification** from ArchLucid | Policy packs are advisory | Architecture-review input, not attestation |
| Simulator-only output equals production AI guarantee | G-REAL evidence required | Label execution mode and limitations |

## CI enforcement

- `python scripts/ci/check_compliance_posture_clarity.py`
- `python scripts/ci/check_commercial_overclaim_guard.py` (includes marketing UI paths)

## Linked artifacts

- [`../go-to-market/AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md`](../go-to-market/AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md)
- [`QUOTE_TO_PROOF_READINESS_CHECKLIST.md`](../go-to-market/QUOTE_TO_PROOF_READINESS_CHECKLIST.md)
- [`tier_fit_validation_matrix.v1.json`](../../../../scripts/ci/data/tier_fit_validation_matrix.v1.json)
