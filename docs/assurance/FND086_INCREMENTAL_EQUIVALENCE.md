> **Scope:** Contributor assurance for scoped SecureNow capture reuse and a synthetic paired recomputation harness. This is not a live rollout approval or a claim of production engine equivalence.

# FND-086 negative dependencies and incremental recomputation

An empty path result records a search, not an absence of dependencies. A later resource, edge, permission, or identity change may introduce a result that had no prior path row to invalidate.

## Reuse boundary

The versioned SecureNow coordinator reuses paths only when the diff is complete and empty, both scoped snapshots are eligible, and its prior output witness still matches the succeeded job. The new schema-3 receipt also binds the whole authorized capture domain. That witness includes tenant/workspace/project, subscription, capture/collector versions and method, resource and relationship cardinalities, inventory content hash, and completeness metadata. The path configuration and engine build continue to be bound separately. Snapshot IDs and capture time bind the execution, but time alone does not make two fresh, otherwise identical domains different.

A changed inventory, mismatched capture contract, unknown scope or collection method, incompatible receipt, or missing output cannot carry forward an old positive or negative result. The existing coordinator chooses full recomputation for an eligible target when reuse is unproved. An incomplete or stale target stays ineligible for decision-grade completion. Schema-2 receipts and earlier results are preserved but cannot authorize reuse. A fresh successful computation creates a new schema-3 receipt. This tightens versioned carry-forward only and does not expand the legacy [SA-13 neighborhood mode](../library/SECURENOW_INCREMENTAL_INVALIDATION.md).

## Run the paired shadow check

The versioned case format is `reviewed_synthetic` only. Supply separate before and after capture IDs in the same scope, immutable engine revisions, capture, collector, policy and configuration versions, explicit completeness, and a roster of scoped queries. Each domain includes its entire vertex and edge inventory and declared control state, even when no query yielded a path. Edges cannot cross domain boundaries. No live inventory, credentials, or engine endpoint is used.

```bash
python3 scripts/assurance/verify_incremental_equivalence.py \
  --case scripts/assurance/regression-evidence/fnd086-new-path.json \
  --case-sha256 ef0bdc7ff764bb849d56deb140811adfafe1e189aca5ec5a6740ec12b1a11843
```

The first run warms the incremental input from the before snapshot. A changed complete domain is recomputed conservatively, and an identical complete domain can reuse its result. A full observation is independently executed from the after snapshot and shares neither the old result nor a cached walk. Both encoded receipts bind the same target evidence, policy, configuration and engine version through the existing [FND-078 paired evaluator](FND078_PAIRED_ENGINE_EVALUATION.md). A separate bounded transitive closure checks both observations. Pair agreement alone never establishes truth.

Use `--prepare` to inspect the exact synthetic fixture, pair plan, and target-domain pins for receipt replay. To check independently supplied synthetic observations, pass `--observations` containing exactly `baseline` and `candidate` FND-078 receipts and an externally trusted `--observations-sha256`. Case and observation digests use the shared canonical JSON representation, not the pretty-printed bytes. Replay verifies bindings and provenance, not who ran an adapter.

| Shadow status | Meaning |
| --- | --- |
| `shadow_pass` | Full and incremental observations match the independent reference for every registered query. |
| `block_mismatch` | At least one result, completeness claim, or finding provenance contradicts the reference or pinned scope. |
| `block_insufficient` | No confirmed mismatch, but at least one query has incomplete coverage or lacks an independently provable outcome. |

The command returns 1 for either blocking result, 2 for invalid inputs, and 0 for a fixture pass. Every report sets `rolloutAuthorized: false`. Review the recorded dependency changes, fallback decisions, and exact fixture/comparison pins before considering a wider rollout. Run the same checks against approved product adapters and a pinned release cohort before any deployment decision. These fixture and coordinator tests do not validate the production equivalence of neighborhood reuse for changed inventories.
