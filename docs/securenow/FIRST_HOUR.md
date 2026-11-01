> **Scope:** SecureNow first hour. Internal operator note. Not a timed SLA. Not customer evidence. Beta remains **NO_GO**.

# SecureNow first hour

Finish these four steps before you open verification, sponsor readouts, or compliance exports.

| Step | Job | Where in the product |
| --- | --- | --- |
| 1 — Scope and freshness | Confirm tenant, workspace, subscription, and that the latest collection result is visible. A missing or stale capture is a gap, not a clean bill of health. | SecureNow Home (environment line); [`/integrations/cloud-connections`](/integrations/cloud-connections) if collection is not connected |
| 2 — One ranked path | Open one ranked path and read cited hops and confidence bands. Do not treat the path as confirmed exploitation. | [`/security/remediation-factory`](/security/remediation-factory) (Priorities & waves) |
| 3 — Advisory cut point | Read the proposed cut point and linked remediation pattern. SecureNow recommends; it does not change Azure. | Path inspect from step 2; remediation patterns when linked |
| 4 — Stop | Do not start verification, engineer tickets, or sponsor packaging until the sponsor names the review question. | This note; [`/administration/securenow-first-hour`](/administration/securenow-first-hour) |

## Terms in one place

- **Possible access path** — a ranked permission and network combination SecureNow can cite. Not proof of an exploit.
- **Advisory cut point** — an analysis recommendation for where to intervene. Not proof the change is safe to implement without your approvals.
- **External change** — any Azure change made outside SecureNow under your organization's process.
- **NOT VERIFIED** — the honest outcome when a later capture, analysis, or postcondition is missing.

## What this note does not do

It does not promise a timed SLA, hands-free Azure repair, or a CPA attestation. It does not replace [`BUYER_PROOF_DEMO.md`](BUYER_PROOF_DEMO.md) for facilitated demos or [`ENGINEER_ANALYST_HANDOFF.md`](ENGINEER_ANALYST_HANDOFF.md) for the full analyst-to-engineer workflow.
