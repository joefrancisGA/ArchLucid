> **Scope:** Golden decisioning corpus **case-36** — legacy mixed-origin actor graph without `TrustBoundary` nodes (DX-03 companion to case-35). **No LLM** — JSON fixtures only.

# case-36

**Scenario.** Hand-authored internal human and public-anonymous external actors with no `TrustBoundary` nodes. Exercises **trust-boundary**, **external-exposure**, and **privileged-access** after DX-03 moved case-35 to declaration-seeded actors with auto trust boundaries.

Regenerate `expected-*.json` by running `GoldenCorpusMaterializerTests` with `ARCHLUCID_RECORD_DECISIONING_GOLDEN=1` (`Record_hand_authored_case_36_when_env_flag_set`).
