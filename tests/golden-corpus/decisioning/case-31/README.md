> **Scope:** Golden decisioning corpus **case-31** — deterministic compliance-policy gap on a **storage** topology slice **combined with** pillar **topology coverage** gaps (network, compute, data missing). **No LLM** — JSON fixtures only.

# case-31

**Scenario.** The graph has a single **`TopologyResource`** in category **`storage`** (cold ledger archive) with **no** `PolicyControl` nodes and **no** `APPLIES_TO` edges, so the default rule pack reports a **compliance violation** (`storage-must-have-policy-applicability`) while the topology coverage engine simultaneously reports **incomplete pillar coverage** (expected network, compute, storage, data — only storage is present). Together this exercises **multi-signal** decisioning: **Compliance** + **Security coverage** (unprotected storage) + **Topology** category gap in the same run payload.

Regenerate expected artifacts with `ARCHLUCID_RECORD_DECISIONING_GOLDEN=1` only for automated cases **case-01–case-30**; **case-31** is hand-authored — update `expected-*.json` by running `dotnet test` on `GoldenCorpusRegressionTests` and reconciling any `.actual` dumps after intentional engine changes.
