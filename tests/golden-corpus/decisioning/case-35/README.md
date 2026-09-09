> **Scope:** Golden decisioning corpus **case-35** — DX-03 declaration-seeded actors with auto `TrustBoundary` nodes plus one guided-intake internal human. **No LLM** — JSON fixtures only.

# case-35

**Scenario.** Kubernetes `ServiceAccount` and anonymous `aws_iam_role` declarations seed machine actors (WK-08 / DX-03). DX-03 materialization adds a `TrustBoundary` for the public anonymous actor, so **external-exposure** and cross-origin **trust-boundary** do not fire. The guided-intake internal human still enables **privileged-access**.

Other harness engines may add topology coverage signals on the same graph.

Regenerate `expected-*.json` by running `GoldenCorpusMaterializerTests` with `ARCHLUCID_RECORD_DECISIONING_GOLDEN=1` (`Record_hand_authored_case_35_when_env_flag_set`).
