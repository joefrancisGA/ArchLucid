# Security evidence paths (SecureNow)

Read architect paths in the remediation factory **Path inspect** panel without leaving the priority queue.

## What the panel shows

- **Confidence band** as a word label (Confirmed, Highly likely, Probable, Possible, Insufficient evidence) — not a percentage.
- **Architect path summary** — a deterministic sentence built from cited hops, weakest link, cut points, and verification hints.
- **Weakest hop** callout with provenance and band.
- **Cut points** and **organizational routing** when present on the path record.

## Honesty rules

SecureNow describes **configuration paths**, not observed traffic or auditor conclusions.

- Capability-to-flow paths use **may access** / **may reach** language.
- Missing network hops are omitted from the sentence instead of inventing a network segment.
- The desk does not claim data exfiltration, compliance attestation, or live **apply to Azure** actions from this panel.

## Where to go next

- Open an **advisory remediation instance** from the panel when one exists for the selected finding.
- Use cut-point summaries to prioritize one choke-point change instead of remediating every hop independently.

## Related

- Path inspect workbench: `docs/library/SECURENOW_PATH_INSPECT_WORKBENCH.md`
- Cut points: `docs/library/SECURENOW_CUT_POINTS.md`
