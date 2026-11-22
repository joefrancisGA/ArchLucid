# Aspects measurement recovery and freshness contract

## What broke

The historically displayed 1.3479 defects/KLOC was read repeatedly from a saved workbook
snapshot (November 22, 2026, 9:43 AM EST) without new reviewed-line evidence.
The canonical GitHub JSONL ledger formerly held only nine verified source-review
observations, not the workbook's 463-defect/343,492-line historical population.
Those datasets have not been proven equivalent and **must not be spliced**.

## The source of truth going forward

- Source: `docs/engineering/aspects-review-ledger.jsonl`.
- Each newly discovered defect requires a stable defect ID, the pinned first-parent
  baseline commit, exact source blob SHA, repository-relative path and actually
  inspected, nonblank source-line spans.
- Prefer `python scripts/aspects_review_evidence.py --ledger
  docs/engineering/aspects-review-ledger.jsonl record-verified --repo .
  --baseline <full-git-sha> --path <source-path> --span <start-end>
  --defect-id <stable-defect-id>`.
- Overlapping spans within the same path/blob are counted once, even when multiple
  confirmed defect IDs share a reviewed section. Different versions of the same
  file are **not** assumed to represent different source lines: cross-revision
  content-lineage deduplication is still outstanding.
- Never turn file fetches, hypothetical defects, pending PRs, or unfounded notes
  into verified source-review spans.

## Current capture and automation

The November 22, 2026 reconciliation appends 16 distinct, manually reviewed
defect identifiers with source/line spans and a pinned ancestor commit.
These rows are revalidated against Git on every source-verified snapshot run.
The new `aspects-density-snapshot.yml` runs on every push to `master`,
qualifying PRs, or manual dispatch. It uploads JSON and Markdown reports with:

- Pinned HEAD and 900 first-parent commits.
- Source-verified subset defect count and unique path/blob reviewed-line denominator.
- Distinct files and evidence-event fingerprint.
- Exactly new covered path/blob lines, new defect identifiers and newly
  reviewed files relative to a comparable prior snapshot.
- A prior rate and signed delta **only** when the window and methodology match.
- Explicit `stale_no_new_verified_evidence` when a new commit arrived
  without new verified review observations.

New PRs under `aspects/` created after the changeover must update the JSONL
ledger; older open PRs are exempt while they finish their existing validation.
The source-verified report runs Git blob/span validation; the lightweight PR
gate alone is not a verification of the evidence.

## Local manual reproducibility

```bash
python -m unittest discover -s scripts/tests -p test_aspects_review_evidence.py -v
python -m unittest discover -s scripts/tests -p test_aspects_density_snapshot.py -v
python scripts/aspects_density_snapshot.py --repo . --head "$(git rev-parse HEAD)" \
  --window 900 --ledger docs/engineering/aspects-review-ledger.jsonl \
  --json-out artifacts/aspects/aspects-density-snapshot.json \
  --markdown-out artifacts/aspects/aspects-density-snapshot.md
```

## Chart and reconciliation policy

The preferred moving-average chart remains **700 observations / a 25-point
moving average**, but it must be plotted from a verified, coherent evidence
series. If there are fewer than 700 true observations, display the available
count and do not fabricate points or extrapolate the old spreadsheet.
Do not describe discovered-defect density as unresolved defect density.

The legacy workbook may be reconciled later only by importing its individual
source observations, validating each against its pinned Git baseline and
deduplicating cross-revision content lineage. Until then it is explicitly
**historical, not a current verified metric**.
