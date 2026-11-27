> **Scope:** Contributor-reference — internal engineering assurance guidance and operational controls; not buyer-facing proof or a correctness/superiority claim.

# Automatic regression from every confirmed defect

Every confirmed defect must leave a durable memory in the system.

Accepted dispositions:

- `structural-prevention`
- `property-test`
- `metamorphic-test`
- `regression-test`
- `documented-nonautomatable` with a concrete reason

`python3 scripts/assurance/regression_ledger.py <ledger.json> --enforce` validates a JSON list or an object with a `defects` list. It rejects malformed records and duplicate defect IDs. Use `--artifact-root` when receipts are staged outside the ledger directory. Report-only mode emits the same errors without enforcing them; an unreadable or invalid JSON ledger exits nonzero in either mode.

## Evidence receipts

Put `defectId`, `regressionDisposition`, the receipt's relative `regressionArtifact` path, and its `regressionArtifactSha256` on each confirmed automated or structural disposition. The validator reads the file within the artifact directory and checks the SHA-256 of its exact bytes. For example, a regression receipt has this shape (revision and outcome values are illustrative):

```json
{
  "schemaVersion": 1,
  "defectId": "EXAMPLE-1",
  "regressionDisposition": "regression-test",
  "intendedBehavior": "A negative input maps to zero under the lower-bound contract.",
  "testIdentity": "Example.BoundsTests.NegativeInputMapsToZero",
  "expectedFailureReason": "negative input was not clamped",
  "baseline": {
    "revision": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "testIdentity": "Example.BoundsTests.NegativeInputMapsToZero",
    "executedCount": 1,
    "exitCode": 1,
    "outcome": "assertion-failed",
    "failureReason": "negative input was not clamped"
  },
  "corrected": {
    "revision": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "testIdentity": "Example.BoundsTests.NegativeInputMapsToZero",
    "executedCount": 1,
    "exitCode": 0,
    "outcome": "passed"
  }
}
```

Property and metamorphic tests use the same receipt shape. For `structural-prevention`, replace the test fields with a `proof` object containing `revision`, `mechanism`, `verificationReference`, and `outcome: verified`. Cite the specific invariant and check in the proof reference, not merely the name of a tool. A `documented-nonautomatable` row instead records `owner`, `reason`, `revisitCondition`, and `approvedBy`. Validation checks the receipt structure, content digest, and stated outcomes. It does not authenticate who ran the commands or independently replay the cited revisions.

## Sampled revert verification

The existing `al-bug-verify-proven-revert.py` sample first requires a passing test on the corrected commit. It then restores the changed production paths from the parent in a disposable worktree, retaining the corrected test, and reruns that test. For a legacy Markdown citation, add `[expected-failure: stable assertion text]` to identify the defect-specific failure. Only an executed failure of the same test that matches that text is `guarded`. An executed pass on both versions is `unguarded`. Missing, skipped, ambiguous, timed-out, or build-only runs and unrelated failures are uncheckable, with separate details in the report.

The current adapter checks one cited Core .NET test through its TRX result. A filename-only Vitest citation is not proof of an exact test. The report counts eligible rows and rows with both citations separately from the bounded sample. The sampled verifier and structured receipt validator are complementary controls. The existing sample limits and ratchet baselines are unchanged, and the receipt validator is not yet enforced on a repository-wide defect ledger.

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
