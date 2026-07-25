> **Reviewed:** 2026-07-25

> **Scope:** Index — static buyer-safe demo proof shapes now live on buyer-job pages (**Demo-derived** labels only; no real customer outcome claims).

# Demo proof packets (V1)

Use these **before** a buyer runs their own tenant to show proof package shape, evidence labels, and deferred boundaries. Content lives on the buyer-job canons (formerly separate `*-demo-proof.md` files).

| Packet | Buyer job (canon) |
| --- | --- |
| Azure SaaS readiness | [`../buyer-jobs/AZURE_SAAS_READINESS.md`](../buyer-jobs/AZURE_SAAS_READINESS.md#demo-proof-shape-demo-derived-only) |
| AI governance | [`../buyer-jobs/AI_GOVERNANCE_REVIEW.md`](../buyer-jobs/AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only) |
| Healthcare claims (demo) | [`../buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md`](../buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md#demo-proof-shape-demo-derived-only) |
| First-run simulator script | [`../DEMO_QUICKSTART.md`](../DEMO_QUICKSTART.md#first-run-demo-script-simulator) |

## Job → accelerator map (TB-114)

| Buyer job | Accelerator / proof shape | Prerequisites | Limitations |
| --- | --- | --- | --- |
| First sponsor artifact in 20 minutes | [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed) + `archlucid pilot proof-packet` | API + SQL + auth mode; one committed run | Simulator vs real must be labeled; see [`WHAT_NOT_TO_PROMISE.md`](../WHAT_NOT_TO_PROMISE.md) |
| Azure SaaS procurement questions | [`AZURE_SAAS_READINESS.md`](../buyer-jobs/AZURE_SAAS_READINESS.md#demo-proof-shape-demo-derived-only) | Hosted pilot profile lint PASS/HOLD snapshot | Not a CPA SOC 2 report |
| Responsible AI / governance review | [`AI_GOVERNANCE_REVIEW.md`](../buyer-jobs/AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only) | Policy pack + PilotStrict posture on run | Not third-party model audit |
| Healthcare claims (demo only) | [`HEALTHCARE_CLAIMS_POLICY_REVIEW.md`](../buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md#demo-proof-shape-demo-derived-only) | Demo workspace only | **Demo-derived** — not a customer outcome |
| Differentiation vs generic copilots | [`DIFFERENTIATION_PROOF_PACKET.md`](../DIFFERENTIATION_PROOF_PACKET.md) | Committed run + audit sample | Does not replace live reference customer |
| Full first-pilot rollup | `scripts/collect-first-pilot-proof.ps1 -RunId <id>` | RunId after commit; optional `-ProductionLikeHostedPilot` | Secrets never written into proof folder |

**Walkthroughs:** [`library/walkthroughs/README.md`](../../library/walkthroughs/README.md) · **Core pilot:** [`CORE_PILOT.md`](../../CORE_PILOT.md)))))))))
