# Aspects review commands — production, test quality and mutation evidence

The conversational commands map to the following independent review programs.
A plan is not a completed review. The command split was approved on 2026-11-24,
and the production default was raised to 40 files on 2026-11-27.

| Command | Default | Purpose | Evidence |
|---|---:|---|---|
| Aspects | 40 production files | Oldest-first source review, correction and regression | Existing aspects-review-ledger.jsonl; historical production workbook stays separate |
| Test Aspects | 10 test files | Assertion quality and failure-detection review | test-aspects-review-ledger.jsonl; independent CSV/JSON history |
| Mutation Aspects | One scoped target, 30 minute budget | Assess whether meaningful seeded faults are detected | mutation-aspects-ledger.jsonl, original Stryker artifact |

All ledger paths are under docs/engineering and are initialized upon the first
actual observation. The router reuses the existing systematic Git inventory,
source span validator, age tracking and Stryker configurations. No mutation
engine, full build, CI dispatch, merge or scheduled job is introduced.

## Plan, review, record, report

```bash
HEAD_SHA="$(git rev-parse master)"
python scripts/aspects_commands.py aspects plan --head "$HEAD_SHA"
python scripts/aspects_commands.py test-aspects plan --head "$HEAD_SHA"
# An explicit size overrides the default; it does not silently change it.
python scripts/aspects_commands.py aspects plan --head "$HEAD_SHA" --limit 35
```

Production and test candidates are filtered before the batch limit. The test
queue prioritizes likely shared-control tests (tenant/scope, authorization,
governance, integrity, provenance, privilege/reachability) by path-keyword
heuristic, then uses the existing review-status/oldest-first ordering within
each bucket. Inspect actual criticality; filename matching is not a guarantee.

For each selected test, inspect its production contract and dependencies,
independent expected results, negative assertions, error handling, actual
concurrency coordination, deterministic fixtures, integration boundaries,
and whether it can pass with the implementation broken. Treat uncovered
behavior as a defect only when the contract and gap are demonstrated.
Do not count the production contract's LOC as test LOC. Do not count a
production defect in the test ledger unless a distinct test defect is shown.

Record each actual inspected nonblank span using the router. Example only
(substitute the real file, spans, ID and findings):

```bash
python scripts/aspects_commands.py test-aspects record \
  --baseline "$HEAD_SHA" --path Core.Tests/ExampleTests.cs --span 1-3 \
  --review-id TEST-ASPECTS-0001 --outcome defect --defect-id TEST-D-0001 \
  --category false-pass --severity critical \
  --notes "Independent oracle missing; explain concrete failure scenario and evidence."

python scripts/aspects_commands.py test-aspects report \
  --csv-out artifacts/aspects/test-aspects-history.csv
python scripts/aspects_commands.py aspects report \
  --csv-out artifacts/aspects/production-verified-history.csv
```

Clean reviews require meaningful notes on the assertion/oracle inspected;
use --outcome clean without a defect ID, category or severity. Use stable
defect IDs for shared root causes rather than counting each symptom.
Categories: false-pass, mocked-subject, authorization-isolation,
coupled-oracle, missing-boundary, exception-assertion, false-concurrency,
integration-gap, flaky, redundant and other.

**Reporting:** Test Aspects starts at zero observations, not at production's
historical count. Report separate coverage, confirmed defect density, counts by
severity/category, 25/700-observation moving averages (null until sufficient data)
and least-squares slope per 100 observations, based on the most recent 700
cumulative density observations. Report signed SMA25 change relative to the
previous completed batch when both exist. Export separate CSV series for the
workbook/chart; do not overwrite the existing production workbook or reinterpret
its observations as these new verified series. Path/blob/line union removes
exact duplicates but does not prove cross-revision source lineage. Repeated
observations without new lines or defects do not advance the new series.

For production reports retain the established historical workbook, chart
(SMA25, SMA700 and regression trendline), signed SMA25 delta and provisional
coverage qualifier. The new verified-series export is not a replacement for
historical reconciliation. Review corrections are PRs against master;
full builds remain RC49-only unless separately authorized.

## Advisory test integrity and oracle provenance

The [FND-165 review workflow](../../.github/workflows/pr-test-integrity-report.yml) points reviewers to changes that could affect what tests prove or what runs. Apply the [FND-163 review procedure](AI_ASSISTED_DEVELOPMENT_GOVERNANCE.md#23-mandatory-test-integrity-and-regression-preservation) before accepting a material change. A signal is a review lead, not proof of lost coverage or approval of a change.

```bash
python3 scripts/ci/report_test_integrity_diff.py --base "$BASE_SHA" --head "$HEAD_SHA" \
  --output test-integrity-report.json
python3 scripts/assurance/check_independent_oracles.py --head "$HEAD_SHA" \
  --output independent-oracles.json
```

The integrity report compares the pinned head with its Git merge base. It covers Python AST patterns, selected xUnit/NUnit/MSTest and FluentAssertions matchers, and common Vitest/Jest/Playwright test and assertion forms. It highlights assertion and expected-outcome edits, explicit negatives and tolerances, fixture/mock changes, skips or exclusive tests, named runner filters and discovery/exclusions, analyzer suppressions, and conventional golden/snapshot changes. Code and configuration signals carry base/head line anchors. Golden/snapshot artifacts are identified at file level. Simple exact named-test renames and whitespace changes can be recognized without treating all moves as identical.

The output statuses distinguish no supported changes, supported-scope completion, partial, and incomplete. An unsupported path, parser failure, exhausted cap, missing history, or truncation is not a clean result. The check does not resolve arbitrary helpers, dynamic discovery, dataflow, regular-expression literals or all templating/preprocessor syntax. PR path filters and GitHub's event diff limits can omit files from workflow scheduling. Use the pinned local invocation when a receipt is missing.

Review every visible finding that materially changes behavior. A [review record](../../scripts/ci/test-integrity-review.json) contains its exact finding ID and path, a decision, owner, reason, evidence URL, and revisit condition. Exceptions also require a UTC expiry date and become expired on that date. Merge-base records are annotations only, PR additions or edits are proposals, and neither can suppress findings or establish authorization. Historical-debt changes and attempted additions are reported separately. Only the applicable reviewer can approve a spending-down plan or an exception. Expect an ID to change if its path, test identity, recognized signal evidence, or identical occurrence order changes.

Both results are advisory artifacts from PR code, not attestations made by a trusted independent service. See the [sample and go/no-go evidence](../assurance/TEST_INTEGRITY_AND_ORACLE_EVIDENCE.md) for the current limits. FND-171's [registered tests](../../scripts/assurance/regression-evidence/independent-oracles.json) point to independent worked cases and reference assurance, and distinguish characterization from correctness evidence. No branch-protection or release-policy changes are implied.

## Mutation Aspects

Reuse the existing risk-weighted Stryker tooling, rather than introduce a
second mutation runner or broad matrix. Select ONE existing scoped configuration:

```bash
python scripts/aspects_commands.py mutation-aspects plan \
  --head "$HEAD_SHA" --target ApplicationGraphMergeProperties --budget-minutes 20
```

Other supported targets are ApplicationGovernance,
ApplicationCommitCriticalPaths and DecisioningMerge. The plan exposes the
pinned config hash, actual mutate globs, test projects, filter, baseline and
Stryker commands. Pick the smallest relevant kernel. If none fits, explicitly
design an appropriate narrower configuration before running. Do not quietly
fall back to a full assembly or matrix.

Execute only after selecting a disposable local checkout at the pinned SHA
(with pinned .NET tools available) and confirming the scope. Run the listed
baseline commands; ensure a nonzero number of tests executed and all passed.
Then run the single pinned Stryker evidence command with a fresh output
directory. It enforces the shared wall-clock budget and only writes a receipt
for a completed, reconciled report. Note an interrupted run as incomplete
without importing it as a scored observation.
Do not run an entire solution build against master; use RC49 for comprehensive
builds. No tool restores, builds or mutation jobs are automatically triggered
by the router. Existing scheduled Stryker jobs remain unchanged.

After a completed run, import its actual JSON artifact and baseline evidence:

```bash
python scripts/aspects_commands.py mutation-aspects record \
  --head "$HEAD_SHA" --target ApplicationGraphMergeProperties \
  --report /path/to/mutation-report.json \
  --run-evidence /path/to/run-evidence.json \
  --source "workflow/run/artifact or local run identity" \
  --baseline-evidence "passing baseline test run and nonzero executed count"
python scripts/aspects_commands.py mutation-aspects report
```

The importer verifies the receipt against the Git-pinned configuration and
report SHA-256, then records the run source and operator-attested successful
baseline evidence. This is not independent re-execution or authentication of
an externally supplied receipt. A duplicate
head/target/report digest does not add another observation. Keep the actual
report artifact accessible for inspection.

Report killed, survived, no coverage, timeout, runtime/compile errors,
ignored, pending and unknown separately. Strict assertion kill rate =
Killed/(Killed+Survived), with a separate coverage-inclusive rate =
Killed/(Killed+Survived+NoCoverage). No executed denominator yields no score;
pending or unknown suppress both percentages. Neither rate is a replacement
for the existing Stryker CI score, which uses different status rules.
Never treat compiler failure, timeout or equivalent mutants as an assertion
kill; assess survivors for meaningful behavioral distinctions and add
independent semantic tests. Mutation evidence does not add production or test
defects until a specific distinct defect is actually confirmed.

See [risk-weighted mutation testing](../assurance/RISK_WEIGHTED_MUTATION_TESTING.md)
and [existing Stryker tooling](../library/MUTATION_TESTING_STRYKER.md).
