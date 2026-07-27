> **Reviewed:** 2026-07-25

> **Scope:** Index of outcome-led Specialty buyer-job pages (including demo proof shapes) linked from accelerator walkthroughs; not the Core first-pilot operator path.

# Buyer jobs (Specialty accelerators)

| Buyer job | Doc | Demo proof shape |
| --- | --- | --- |
| Azure SaaS readiness | [AZURE_SAAS_READINESS.md](AZURE_SAAS_READINESS.md) (alias) · [walkthrough packaging](../../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#buyer-job-packaging) | [#demo-proof-shape-demo-derived-only](../../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only) |
| AI governance | [AI_GOVERNANCE_REVIEW.md](AI_GOVERNANCE_REVIEW.md) | [#demo-proof-shape-demo-derived-only](AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only) |
| Healthcare claims (demo) | [HEALTHCARE_CLAIMS_POLICY_REVIEW.md](HEALTHCARE_CLAIMS_POLICY_REVIEW.md) | [#demo-proof-shape-demo-derived-only](HEALTHCARE_CLAIMS_POLICY_REVIEW.md#demo-proof-shape-demo-derived-only) |

**Core path:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · accelerator catalog [`docs/library/walkthroughs/README.md`](../../library/walkthroughs/README.md) · first-run simulator script [`DEMO_QUICKSTART.md`](../DEMO_QUICKSTART.md#first-run-demo-script-simulator)

Use demo proof shapes **before** a buyer runs their own tenant to show package shape, evidence labels, and deferred boundaries (**Demo-derived** only — not customer outcomes). Formerly under `demo-proof-packets/`.

## Job → accelerator map (TB-114)

| Buyer job | Accelerator / proof shape | Prerequisites | Limitations |
| --- | --- | --- | --- |
| First sponsor artifact in 20 minutes | [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed) + `archlucid pilot proof-packet` | API + SQL + auth mode; one committed run | Simulator vs real must be labeled; see [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) |
| Azure SaaS procurement questions | [walkthrough demo proof](../../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only) | Hosted pilot profile lint PASS/HOLD snapshot | Not a CPA SOC 2 report |
| Responsible AI / governance review | [AI_GOVERNANCE_REVIEW.md](AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only) | Policy pack + PilotStrict posture on run | Not third-party model audit |
| Healthcare claims (demo only) | [HEALTHCARE_CLAIMS_POLICY_REVIEW.md](HEALTHCARE_CLAIMS_POLICY_REVIEW.md#demo-proof-shape-demo-derived-only) | Demo workspace only | **Demo-derived** — not a customer outcome |
| Differentiation vs generic copilots | [`DIFFERENTIATION_PROOF_PACKET.md`](../DIFFERENTIATION_PROOF_PACKET.md) | Committed run + audit sample | Does not replace live reference customer |
| Full first-pilot rollup | `scripts/collect-first-pilot-proof.ps1 -RunId <id>` | RunId after commit; optional `-ProductionLikeHostedPilot` | Secrets never written into proof folder |
