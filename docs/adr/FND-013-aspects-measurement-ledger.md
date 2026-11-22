# ADR FND-013 — Aspects measurement ledger exchange

Status: Incremental evidence-based subset reporting (2026-11-22). Source-verified snapshots now run after master updates; historical workbook reconciliation and true cross-revision content-lineage deduplication remain incomplete.

## Source mapping
- `scripts/aspects_review_evidence.py` is the current evidence recorder. It requires explicit verified review spans, baseline and blob SHAs, and unions path/blob intervals; it explicitly warns this is **not cross-revision content-lineage deduplication**.
- `scripts/tests/test_aspects_review_evidence.py` tests idempotence, first-parent membership, actual blob validation, overlapping spans, and rejection of unverified observations.
- `.github/workflows/aspects-evidence-reconciliation.yml` is **workflow_dispatch only** and must not be triggered by Aspects check-ins.

## Decision
Introduce a versioned reporting envelope for Aspects measurements: pinned head and first-parent window, source-ledger provenance, unique path/blob LOC, reviewed/new files, distinct confirmed defects, verified fixes, repeated discoveries and possible duplicates, and density with prior and delta. A zero denominator requires null density. The contract does not manufacture missing historical records.

## Measurement honesty
- `uniquePathBlobLines` is content-aware interval union **within a path/blob**, but can overcount unchanged lines across different blobs; never call it globally deduplicated LOC.
- Count confirmed distinct defects by stable, reviewed identifiers; do not treat fuzzy matches as confirmed deduplication.
- Count verified fixes separately from discovered defects; a merged PR is not proof of a fixed defect.
- `provisional` and `unavailable` are first-class states; do not fabricate precision or hide the denominator.
- Prior/delta metrics must use comparable windows and methods; signed delta = current minus previous.
- Source baselines must be verified first-parent members of the reported window by an actual Git traversal.
- Ledger references are not evidence of actual review unless the source observations pass existing validation.

## Integration gates
Build an adapter around `scripts/aspects_review_evidence.py` only after historical evidence reconciliation; add cross-revision lineage mapping before claiming unique LOC across commits. Keep the existing workflow manual-only and the 1.0 CI unaffected.

## November 22, 2026 implementation

- `scripts/aspects_density_snapshot.py` revalidates pinned blobs and line spans against Git, produces an auditable report with a deterministic evidence fingerprint, and rejects incomparable prior-rate deltas.
- `.github/workflows/aspects-density-snapshot.yml` produces an artifact for master updates rather than silently reprinting the latest saved spreadsheet number.
- `.github/workflows/aspects-evidence-gate.yml` requires new Aspects branches to submit ledger evidence; older pre-existing PRs remain exempt.
- Historical observations are separately backfilled into the canonical ledger with exact source pins, not added directly to the old workbook denominator. See `docs/engineering/ASPECTS_DENSITY_MEASUREMENT.md`.
- This is an evidence-backed **observed subset**; a verified full historical series requires independent row-level reconciliation and cross-revision deduplication.
