> **Scope:** Static buyer-safe demo proof packets — **Demo-derived** labels only; no real customer outcome claims.

# Demo proof packets (V1)

Use these before a buyer runs their own tenant to show **proof package shape**, evidence labels, and deferred boundaries.

| Packet | Buyer job | File |
| --- | --- | --- |
| Azure SaaS readiness | ISV Azure SaaS pilot posture | [azure-saas-readiness-demo-proof.md](azure-saas-readiness-demo-proof.md) |
| AI governance | Responsible AI on a committed review | [ai-governance-demo-proof.md](ai-governance-demo-proof.md) |
| Healthcare claims (demo) | PHI-minimization policy on findings | [healthcare-claims-demo-proof.md](healthcare-claims-demo-proof.md) |

## Job → accelerator map (TB-114)

| Buyer job | Accelerator / proof shape | Prerequisites | Limitations |
| --- | --- | --- | --- |
| First sponsor artifact in 20 minutes | [`FIRST_VALUE_20_MINUTES.md`](../../runbooks/FIRST_VALUE_20_MINUTES.md) + `archlucid pilot proof-packet` | API + SQL + auth mode; one committed run | Simulator vs real must be labeled; see [`WHAT_NOT_TO_PROMISE.md`](../WHAT_NOT_TO_PROMISE.md) |
| Azure SaaS procurement questions | [azure-saas-readiness-demo-proof.md](azure-saas-readiness-demo-proof.md) | Hosted pilot profile lint PASS/HOLD snapshot | Not a CPA SOC 2 report |
| Responsible AI / governance review | [ai-governance-demo-proof.md](ai-governance-demo-proof.md) | Policy pack + PilotStrict posture on run | Not third-party model audit |
| Healthcare claims (demo only) | [healthcare-claims-demo-proof.md](healthcare-claims-demo-proof.md) | Demo workspace only | **Demo-derived** — not a customer outcome |
| Differentiation vs generic copilots | [`DIFFERENTIATION_PROOF_PACKET.md`](../DIFFERENTIATION_PROOF_PACKET.md) | Committed run + audit sample | Does not replace live reference customer |
| Full first-pilot rollup | `scripts/collect-first-pilot-proof.ps1 -RunId <id>` | RunId after commit; optional `-ProductionLikeHostedPilot` | Secrets never written into proof folder |

**Walkthroughs:** [`library/walkthroughs/README.md`](../../library/walkthroughs/README.md) · **Core pilot:** [`CORE_PILOT.md`](../../CORE_PILOT.md)
