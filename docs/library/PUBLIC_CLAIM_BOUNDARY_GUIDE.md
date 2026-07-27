> **Reviewed:** 2026-07-26

> **Scope:** Contributor-reference — sales, marketing, and agent authoring for what ArchLucid may say in V1 vs deferred `(B)` / V1.1 items; buyer-facing claim guardrails (TB-134) plus the GTM “what not to promise” table (formerly `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`).

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

## GTM do-not-promise (sales / proof packets / sponsor email)

Separates `(A)` product readiness from `(B)` procurement realism. Use in sales, proof packets, and sponsor email.

| Topic | Safe wording | Do not promise |
| --- | --- | --- |
| SOC 2 CPA attestation | "Trust pack + control narrative; CPA program deferred" | "We are SOC 2 certified" |
| Third-party pen test | "Owner security testing + templates; vendor pen test deferred" | "Independent pen test report available" |
| Live Marketplace / Stripe checkout | "Quote + order-form path; self-serve commerce deferred" | "Buy on Marketplace today" |
| Named reference customer | "Demo proof packets + founder-led pilot" | "Customer X saved Y%" without approval |
| MCP / plugin marketplace | "REST/CLI integration recipes" | "MCP marketplace GA" |
| V1.1 connectors (Jira, ServiceNow, …) | "V1 REST/CLI/export handoff; roadmap connectors labeled V1.1" | "Native Jira/Teams GA in V1" |
| Multi-region active/active | "Single-region pilot deployment documented" | "Active/active multi-region SLA" |
| Realized ROI USD | "Source-classified estimates; tenant baselines when captured" | "Guaranteed $ savings" |
| Invoiced Azure OpenAI cost | "Budget estimates and token rollups" | "Invoice-accurate COGS" |

### Canonical deferral docs

- [`V1_SCOPE.md`](V1_SCOPE.md) §3
- [`../go-to-market/trust-center.md`](../go-to-market/trust-center.md)
- [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)

Former standalone: `docs/go-to-market/WHAT_NOT_TO_PROMISE.md` → this section.

## CI enforcement

- `python scripts/ci/check_claim_evidence_consistency.py` (unified gate + JSON report — T2-8)
- `python scripts/ci/check_compliance_posture_clarity.py`
- `python scripts/ci/check_commercial_overclaim_guard.py` (includes marketing UI paths)
- `python scripts/ci/check_proof_summary_promise_language.py` (forbidden phrase warn scan)

See [`CLAIM_EVIDENCE_CONSISTENCY_GATE.md`](../quality/CLAIM_EVIDENCE_CONSISTENCY_GATE.md).

## Linked artifacts

- [`../go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-review-engagement-pack-tb-133`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-review-engagement-pack-tb-133)
- [`QUOTE_TO_PROOF_PACKET.md`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-checklist)
- [`tier_fit_validation_matrix.v1.json`](../../scripts/ci/data/tier_fit_validation_matrix.v1.json)
