> **Scope:** Golden decisioning corpus **case-32** — **merge input gate** rejects an `AgentResult` whose **`runId` stamp does not match** the bundle `mergeRunId` (cross-run merge attempt). **No LLM** — JSON fixtures only.

# case-32

**Scenario (mirrors `docs/library/GOVERNANCE.md` §Segregation of duties).** HTTP governance blocks a reviewer from approving or rejecting their **own** submission by comparing **canonical actor keys** and durable request identity. The decisioning merge slice uses a related invariant: coordinator merge must not accept agent results **stamped for a different run** than the merge bundle’s `mergeRunId` (`DecisionMergeInputGate.ValidateResult`). This case supplies one valid-shaped `AgentResult` with `runId: "golden-merge-run-1"` while `mergeRunId` is **`golden-merge-case-32`**, producing a single deterministic error and **no** merged services.

**Graph:** Same single-requirement snapshot shape as **case-02** (stable requirement + topology-coverage findings).

Regenerate **only** `expected-*.json` here when merge gate messages or authority decisions change; use `ARCHLUCID_RECORD_DECISIONING_GOLDEN=1` for automated **case-01–case-30** only.
