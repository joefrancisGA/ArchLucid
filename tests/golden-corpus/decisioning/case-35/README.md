> **Scope:** Golden decisioning corpus **case-35** — trust-boundary, privileged-access, and external-exposure on a WK-08 declaration-seeded actor graph plus one guided-intake human. **No LLM** — JSON fixtures only.

# case-35

**Scenario.** Kubernetes `ServiceAccount` and anonymous `aws_iam_role` declarations seed machine actors (WK-08). An internal human actor from guided intake enables privileged-access. Mixed internal/external origins with no `TrustBoundary` nodes fire trust-boundary and external-exposure.

Other harness engines may add topology coverage signals on the same graph.

Regenerate `expected-*.json` by running `GoldenCorpusMaterializerTests` with `ARCHLUCID_RECORD_DECISIONING_GOLDEN=1` (hand-authored recorder includes `case-35`).
