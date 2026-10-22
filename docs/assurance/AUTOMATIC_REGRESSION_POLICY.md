> **Scope:** Contributor-reference — internal engineering assurance guidance and operational controls; not buyer-facing proof or a correctness/superiority claim.

# Automatic regression from every confirmed defect

Every confirmed defect must leave a durable memory in the system.

Accepted dispositions:

- `structural-prevention`
- `property-test`
- `metamorphic-test`
- `regression-test`
- `documented-nonautomatable` with a concrete reason

`scripts/assurance/regression_ledger.py` validates a defect ledger against this policy.

## Preferred mapping

| Defect class | Preferred memory |
|---|---|
| invalid state/compile invariant | structural prevention |
| ordering/serialization sensitivity | property/metamorphic |
| reasoning semantics | golden/synthetic/reference oracle |
| tenant/authorization | structural + mutation |
| UI/export mismatch | cross-surface contract |
| one-off external/manual behavior | regression test or documented nonautomatable |

A screenshot or prose note alone is not durable regression coverage unless the defect itself is purely visual/textual.
