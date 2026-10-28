# SecureNow controlled-beta buyer proof: evidence to decision

> **Demo fixture / illustrative scenario — NOT customer evidence, not a production validation, and not a claim of observed attack traffic.** This guide supports a facilitated buyer demonstration; real output must be substituted before sponsor claims.

## Buyer job

A cloud-security architect wants to know which Azure permissions and network configurations form a consequential **possible access path**, where to intervene, and what later evidence would demonstrate a change worked.

## Script (10–15 minutes)

1. **Scope and freshness** — Start from SecureNow Home. Show the current tenant, workspace, Azure subscription and collection result. A missing, partial or stale capture is a coverage gap, not a clean bill of health.
2. **Find and inspect** — Open **Priorities & waves**, then one ranked path; use **Path inspect** to open cited hops, provenance, weakest confidence band and contributing dimensions. Do not claim a numerical probability or confirmed exploitation.
3. **Explain intervention** — Show an advisory cut point and the linked remediation pattern when available. A cut point is an *analysis recommendation*, not proof that a change is safe to implement.
4. **Engineer action** — Open the remediation instance and present the runbook or Terraform representation as advisory. The engineer applies any Azure change **outside** SecureNow under their organization's approvals.
5. **Verify, or fail honestly** — Show the later successful Azure capture, documented change attestation, completed path analysis and substantive property or path postcondition. If any are missing, the correct outcome is **not verified**.
6. **Audit trail** — Show the evidence association to the relevant control and note that a GRC analyst, not an AI model, records a control disposition.

## Illustrative example (invented, never present as customer outcome)

An Azure storage account is represented in a fixture with an undesirable public-network-access property and a possible access path. The proposed control is to restrict that exposure. No live system is changed by this demo. A passing later-capture example is only a deterministic test case; the deliberately incomplete capture must **not** be accepted as evidence of closure.

## What buyer should be able to inspect

- Azure snapshot identity, collection timestamp, scope and completeness
- Finding and path identifiers, ordered cited hops, provenance, confidence band
- Independent ranking dimensions and the proposed cut point
- Human-approved external action and its timestamp
- Later successful capture and evaluated security postcondition
- Explicit verification result, failures when present, and audit link

## Claims we must NOT make from this fixture

Do not say: “SecureNow prevented a breach,” “observed exfiltration,” “compliance certified,” “autonomously repaired Azure,” “guaranteed cost savings,” or “this synthetic case proves production detection accuracy.”

## Pilot proof collection

For real pilots, collect prior and later time-to-investigation, operator hours for the same decision, findings backed by source evidence, path classifications challenged by reviewers, verification failure rates, and incident/support records. Report denominator, scope and missing measurements; retain redacted, tenant-authorized identifiers only.

## Existing product entry points

See [security evidence paths operator guide](../library/customer-facing/SECURITY_EVIDENCE_PATHS_OPERATOR_GUIDE.md), [SecureNow requirements](SECURENOW_REQUIREMENTS.md), and [verification contract](../library/SECURENOW_ARCHITECT_HOLD.md). This guide does not add a second engine, collector, API, or product workflow.
