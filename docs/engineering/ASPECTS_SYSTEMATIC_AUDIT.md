# Aspects systematic whole-source review — coverage and age contract

**Decision (Nov 23, 2026):** Systematic, oldest-last-touched-first review is the primary Aspects track. Targeted defect hunts and architecture-control reuse investigations remain useful **secondary tracks**. A defect found during a targeted hunt must not make the systematic pass appear more complete. A systematic pass that finds **no defects** is still a real, recorded review.

## Snapshot, scope, and ordering

The planner `scripts/aspects_systematic_review.py` takes a full **Git SHA**, not a changing branch name. Its inventory is built from all eligible tracked source blobs under that SHA, not from only files where GitHub search found suspicious expressions.

- Tracked source suffixes include C#/.NET, JS/TS, Python, SQL, Terraform, shell/PowerShell, Bicep, Go, Rust, Java, C/C++, and other enumerated code types. Code-bearing CI workflow YAML and Dockerfiles are included. Tests, tooling and infrastructure have their **own lanes**. Generated, vendored, binary and non-source files are excluded explicitly by the script's `SOURCE_SUFFIXES`, `GENERATED_NAMES`, and `EXCLUDED_DIRS`. The claimed percentage is **eligible source**, not every byte in the Git repository.
- Record the exact current Git blob and count nonblank lines. Avoid claims about unverified historical paths, unchanged lines across different blobs, or fully audited code merely because a file was opened.
- Sort the next-review queue first by **no systematic review**, then by **no previously source-verified evidence at the same blob**, then by **oldest last Git modification date** and path for deterministic ties. Partially reviewed files remain eligible until complete. This prevents recent, defect-rich or frequently edited files from monopolizing the audit.
- Report `% systematic LOC reviewed = current-head systematic source-reviewed nonblank LOC / current-head eligible nonblank source LOC` for every lane and in aggregate. `known_current_blob_subset_coverage_percent` includes other *verified* ledger entries but does not represent systematic completion or fully reconciled historic coverage.
- Do not apply the previously accumulated historical workbook numerator to this inventory denominator. The legacy 900-first-parent reconciliation, operational SMA25, current source-inventory coverage, and targeted defect density are different series with explicitly different provenance.

## Record an actual review (even if clean)

From a full local Git checkout (no master or RC49 build required):

```bash
# Choose a frozen source snapshot. Do not substitute an unpinned branch here.
HEAD_SHA="$(git rev-parse master)"
python scripts/aspects_systematic_review.py --repo . \
  --ledger docs/engineering/aspects-review-ledger.jsonl \
  plan --head "$HEAD_SHA" \
  --json-out artifacts/aspects/systematic-inventory.json \
  --next-limit 20

# Hypothetical clean review: substitute an actual unreviewed file and exact nonblank spans:
python scripts/aspects_systematic_review.py --repo . \
  --ledger docs/engineering/aspects-review-ledger.jsonl record \
  --baseline "$HEAD_SHA" --path path/from/queue.cs \
  --span 1-3 --review-id systematic-0001 --track systematic --outcome clean \
  --architecture-reuse-status not-assessed

# For an actual confirmed defect, use --outcome defect --defect-id ASPECTS-...;
# for a high-risk side investigation use --track targeted (not systematic).
# Record source spans that were really inspected: blanks and out-of-range spans fail validation.

python scripts/aspects_systematic_review.py --repo . \
  --ledger docs/engineering/aspects-review-ledger.jsonl plan \
  --head "$HEAD_SHA" --review-id systematic-0001 \
  --json-out artifacts/aspects/systematic-inventory-after-review.json \
  --csv-out artifacts/aspects/systematic-reviewed-file-age.csv
```

The shown filename/spans are an **example command, not an assertion that a review was performed**. A clean reviewed source file is recorded with `defect_id=null`. Each row also records the architectural reuse control and an honest `compliant`, `gap`, `not-applicable`, or `not-assessed` status. Component/caller reuse gaps can be corrected separately without double-counting already-reviewed lines.

## Required source-age field on EVERY Aspects report

For each source file **actually inspected**, the evidence records:

1. Full repository-relative path, pinned pre-repair source blob and baseline SHA.
2. Earliest reachable Git commit and UTC commit date, using `git log --follow` to carry renames when possible. Say **first seen** rather than **created** unless introduction is verified; if the checkout is shallow, explicitly mark earliest history as incomplete.
3. **Last source modification BEFORE the Aspects repair:** commit SHA and UTC commit date from the same pinned history.
4. Days since that modification (as of report time), code lane, and whether any verified prior source review exists.
5. Source review track and outcome, exact source-line spans, architectural-control reuse result, and PR/validation status.

For a multi-file pass, display the **oldest source file actually reviewed** by earliest reachable `--follow` history, followed by its last-modified date. Print `unknown` rather than inventing an age or claiming files were inspected when they were merely listed in search results. `plan --review-id` exposes `oldest_source_file_reviewed` and all `reviewed_file_history`; `--csv-out` makes an appendable **File age / coverage** table for the historical workbook.

## Separate scorecards and CI

Every subsequent Aspects report should keep two scorecards, **systematic whole-code coverage** (including clean findings and old files) and **targeted defect discovery/architecture reuse**. The existing provisional defect-density SMA25 remains labeled as such, with its signed delta. Do **not** interpret a higher rate after selecting suspicious code as worsening quality, or a merged PR as proven tests passing.

Focused verification:

```bash
python -m unittest discover -s scripts/tests -p 'test_aspects_systematic_review.py' -v
```

`.github/workflows/aspects-systematic-review.yml` runs these **Python unit tests only** on matching PRs targeting master. It does **not** initiate comprehensive builds against `master` or `RC49`, dispatch CI, alter branch protection, merge PRs, or change the manual-only full-build policy for RC49.


## Named review commands (Nov 24, 2026)

The owner-approved commands are **Aspects** (35 production files), **Test Aspects**
(10 test files) and **Mutation Aspects** (one explicitly scoped critical kernel).
See [ASPECTS_REVIEW_COMMANDS.md](ASPECTS_REVIEW_COMMANDS.md) for the executable
entry points, evidence requirements, independent metrics and mutation cost controls.
The legacy planner/ledger remain available for historical reconciliation and
tooling or infrastructure reviews; the named commands do not combine their metrics.
