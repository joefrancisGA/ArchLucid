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


## Important: recorded historical review LOC is NOT just the newer 2,528-line ledger

The successful original historical-900 Git source-pin audit (Actions run
45160219395, artifact 14812729056, source audit SHA-256
6bd330eb81fa105ee2b48deb32be2b77885daa5d3a629fa54e1472ac975dd3c1)
verified exact source at 4,514 of 5,741 historical review records:
**238,239 source-line occurrences**, **6,020 repeated exact path/blob lines**,
and **232,219 unique exact path/blob source identities** at the original
900-first-parent historical head 15ac3b9abeff23e4fa8cb7a16027bf9b17211251.
The immutable census, linked to its source artifact, is in
docs/engineering/aspects-historical/audit-checkpoints/2026-11-23-original-900-source-pin-coverage.json.

The **2,528-line, 45-defect** successful source ledger measurement is a
*separate narrow follow-on review population*, measured at its own old PR
synthetic merge head 48689d5dde62a2c08097ef9733609773ffeacec1;
**17.800633 defects/KLOC applies only to those 2,528 lines**, NEVER to the
232,219 historically pinned lines. The 232,219 pinned source identities prove
source/blob/span integrity, not all the original review events, not full
cross-revision deduplication, and not a distinct-defect numerator; therefore
do not calculate a rate by dividing the ledger's 45 defects or the workbook's
463 by 232,219. The historical workbook's last **343,492** reported unique
reviewed LOC and rate **1.347921 defects/KLOC** remain separately labeled
partial workbook accounting; also do not splice them into a new verified rate.

Every Aspects report MUST prominently display the original historical
**232,219 Git-pinned candidate source lines** and its exact original cohort
and provenance, not merely the small incremental ledger. A new run can
accurately report the incremental source-verified density without implying it
represents all prior code-review work. This reporting correction adds no
independently verified new review LOC or confirmed distinct defects.

## Single consolidated update (historical, provisional and current)

Run the consolidated command. It validates three distinct populations before
producing the standard user-facing Aspects update:

```bash
python -m unittest discover -s scripts/tests -p 'test_aspects_accounting_report.py' -v
python scripts/aspects_accounting_report.py \
  --verified-snapshot artifacts/aspects/aspects-density-snapshot.json \
  --json-out artifacts/aspects/aspects-accounting-report.json \
  --markdown-out artifacts/aspects/aspects-accounting-report.md \
  --700-csv-out artifacts/aspects/aspects-provisional-700-sma25.csv \
  --900-csv-out artifacts/aspects/aspects-historical-900-sma25.csv \
  --700-svg-out artifacts/aspects/aspects-provisional-700-sma25.svg
```

`aspects-density-snapshot.yml` runs this after revalidating the live reviewed
source ledger and uploads all five report artifacts in the *existing* Aspects
snapshot bundle. The lightweight `aspects-accounting-report.yml` validates
the historical/provisional inputs and Python calculation on PRs without a
comprehensive master build. GitHub Actions artifacts (and the generated
Markdown) are the report; creating a new Git commit alone is not a measurement.

The three outputs **must not be mixed**:

- **Historical 900-first-parent captures:** exactly **79 actual recorded**
  workbook snapshots as originally imported. Latest partial source checkpoint
  is the November 22, 2026 capture at 463 / 343,492 = 1.3479207667/KLOC.
  All 25-point moving averages are recalculated. This is not current.
- **700-observation provisional trend:** exactly **100 workbook-derived
  backprojections plus 600 separately imported workbook event rows**. Event
  increments, cumulative counts, each reported rate and all 600 shared rows
  must reconcile before generating its CSV/SVG. The latest workbook-provisional
  rate is 491 / 343,818 = 1.42808113595/KLOC, distinct from the historical
  900-commit snapshot. This is a 700-point chart, **not 700 independent
  snapshots or 700 source-verified reviews**.
- **Current verified ledger subset:** only live Git revalidated source
  observations and distinct IDs from `aspects_density_snapshot.py`. As-of
  HEAD, scope, current subset defect IDs and exact path/blob reviewed LOC are
  displayed explicitly. New/repeated reviewed LOC, new defect IDs, rate and
  signed delta appear only when a *comparable prior verified snapshot* exists.
  If no comparable predecessor is available, those fields are **unknown
  (`null`), never represented as zero**.

Every Aspects progress report must state (1) the actual as-of Git SHA,
(2) current live verified reviewed LOC and repeats **or unknown if no
comparison**, (3) actual new distinct defect IDs **or unknown**, (4)
historical/provisional context marked by provenance, and (5) CI status.
Never repeat 463/343,492, 232,219, 6,020 or the 700 provisional count as
new code-review progress.

**Outstanding audit work:** Git path/blob coverage is not yet fully
content-lineage deduplicated across revisions, and the historical candidate
source population lacks original review pins. This does not block reproducible
historical/provisional charts or the narrower verified ledger report, but it
does block claiming a complete current 900-commit defect density. The report
makes that boundary explicit.
