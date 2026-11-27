> **Scope:** Targeted internal source audit of ArchLucid/SecureNow test governance and AI-assisted regression preservation; not an executed test-suite assessment or release certification.

# AI-assisted test governance audit

**Inspected revision:** [81c9168e3a853c187a2184dd3287e7aadf3ab93b](https://github.com/joefrancisGA/ArchLucid/commit/81c9168e3a853c187a2184dd3287e7aadf3ab93b), 2026-11-27.

**Objective:** Identify additional requirements that prevent AI agents from obtaining green tests by changing the test oracle, reducing test execution scope, or misrepresenting verification. Extend existing controls instead of creating competing test infrastructure.

## Established foundations

| Control | Source | Audit result |
| --- | --- | --- |
| Agent test integrity and shared impact | [Common governance](../engineering/AI_ASSISTED_DEVELOPMENT_GOVERNANCE.md), [shared-component rule](../../.cursor/rules/Shared-Component-Impact-Analysis.mdc) | Already prohibit weakening or removing assertions, tests and gates merely to get green; require affected-consumer verification and honest completion. |
| Confirmed defect regression disposition | [Automatic regression policy](../assurance/AUTOMATIC_REGRESSION_POLICY.md), [regression ledger validator](../../scripts/assurance/regression_ledger.py) | Existing regression/prevention categories and validator; strengthen evidence binding and invocation rather than replace the ledger. |
| Actual defect sensitivity | [Proven-fix revert verifier](../../scripts/agent/al-bug-verify-proven-revert.py), [CI](../../.github/workflows/ci.yml) | CI invokes a blocking sample of five rows, with new-unguarded and new-uncheckable baseline ratchets (line 2812 at inspected revision). Useful existing red/green/revert capability; not proof for every changed regression test. |
| Test selection and discovery | [Test execution model](../library/TEST_EXECUTION_MODEL.md), [CI path lanes](../../scripts/ci/detect_ci_path_lanes.py), [RC wiring guard](../../scripts/ci/tests/test_rc43_ci_wiring.py) | Existing test tiers, path lanes, Vitest inventory checks, and a zero-executed-test guard in the repair workflow. No comprehensive cross-runner discovery reconciliation established by this audit. |
| Mutation and test quality | [Risk-weighted mutation](../assurance/RISK_WEIGHTED_MUTATION_TESTING.md), [Aspects commands](../engineering/ASPECTS_REVIEW_COMMANDS.md), [scheduled Stryker](../../.github/workflows/stryker-scheduled.yml) | Existing ten-target scheduled workflow, mutation baselines, scoped Mutation Aspects and distinct Test Aspects review evidence. Avoid parallel mutation runners or indiscriminate expansion. |
| Prevention and compatibility | [Defect-prevention backlog](../engineering/DEFECT_PREVENTION_IMPLEMENTATION_BACKLOG.md), [coverage validator](../../scripts/ci/check_defect_prevention_coverage.py) | Existing prevention matrix and CI validation. Extend relevant controls; matrix integrity is not proof of test execution. |

## Additional requirements, in recommended order

Identifiers TG-AUD-01 through TG-AUD-08 are stable audit finding labels. The owner authorized their addition to the [active technical backlog](../ACTIVE_TECHNICAL_BACKLOG.md) as FND-163 through FND-170, retaining the four Critical and four High priorities. These are tracked requirements, not evidence of completed implementation. Implementation requires a separate authorized change, reuse assessment and regression evidence.

| Audit finding | Active backlog ID | Priority |
| --- | --- | --- |
| TG-AUD-01 | FND-163 | Critical |
| TG-AUD-02 | FND-164 | Critical |
| TG-AUD-03 | FND-165 | Critical |
| TG-AUD-04 | FND-166 | Critical |
| TG-AUD-05 | FND-167 | High |
| TG-AUD-06 | FND-168 | High |
| TG-AUD-07 | FND-169 | High |
| TG-AUD-08 | FND-170 | High |

### TG-AUD-01 — Critical: test integrity and regression preservation rule

**Gap:** Current common governance prohibits deliberate weakening but does not specify a complete review protocol for expected-result, snapshot, tolerance, mocking, exclusion and test-discovery changes.

**Requirement:** Add a focused always-applied Cursor rule pointing to a canonical cross-agent procedure. Preserve the original oracle; distinguish a production defect, defective test, legitimate requirement change and flaky/environmental failure. Require cited existing contract or authorized new contract, before/after intent, affected consumers, and review of potentially weakened coverage. Require the same regression to fail against the defective behavior and pass after correction when reproducible; allow documented alternatives (structural prevention or independent reference/property test) and explicitly unverified cases. Never require preserving an independently demonstrated erroneous test expectation.

**Acceptance:** Positive and negative policy examples include legitimate contract evolution, test refactor, weakened assertion, snapshot rubber stamp, newly skipped test and mock substitution. No duplicate governance framework.

### TG-AUD-02 — Critical: mutation evidence and denominator honesty

**Confirmed source observation:** [assert_stryker_score_vs_baseline.py](../../scripts/ci/assert_stryker_score_vs_baseline.py), lines 17–85 and 157–187, prefers the first nested numeric mutationScore, returning zero counts in that case. Its fallback excludes NoCoverage, Ignored and Pending, and counts Killed, Timeout, RuntimeError and CompileError as detected. This is not an assertion-kill metric. The function's existing intent is a Stryker compatibility ratchet; counting some non-kill categories in a tool-specific score does not itself prove a defect in the reported Stryker score. The risk is conflating that score with meaningful regression detection, or increasing a fallback score by losing coverage. A synthetic fallback report with one Killed and nine NoCoverage statuses returns 100% on its one included mutant, not evidence that all ten were tested.

**Requirement:** Preserve the official tool-specific score and baseline semantics explicitly; separately report status-level counts, actual assertion/behavioral kills, no-coverage, survived, equivalent/ignored, timeout/error and incomplete outcomes. Reuse existing Mutation Aspects semantics. Validate report schema, scoped mutant identity and completeness; never treat an empty or malformed report as verified success. Reconcile official-score fallback with the installed Stryker version; do not silently rebase existing baselines. Require independent fixtures for status categories, conflicting nested scores, missing/invalid values and zero-denominator behavior.

### TG-AUD-03 — Critical: diff-aware test-change review guard

**Gap:** Targeted inventory and regression guards exist; this audit did not establish a general PR guard detecting weakening across test code, configuration, fixtures and CI.

**Requirement:** Reuse existing CI guard framework and diff lanes. Flag changed expected outcomes, deleted assertions, loosened tolerances, removed negative controls, skip/only/xfail changes, snapshot and golden re-locks, mocks replacing real dependencies, changed filters/discovery, coverage exclusions and analyzer suppressions. Use deterministic/AST-aware analysis where practical, identify exact changed paths and rationale, and require appropriate review of materially weakened coverage. Flagging is not proof of misconduct; allow legitimate reviewed changes, scoped time-bounded exceptions and a ratchet for existing debt. Begin with reporting and independently tested detection; promote to blocking only after false-positive calibration and owner authorization.

### TG-AUD-04 — Critical: evidence-bound red/green regression disposition

**Established control:** Existing revert verifier already checks selected proven fixes and blocks newly unguarded or uncheckable rows in its sample. Existing regression ledger validator checks category and artifact/reason fields.

**Gap:** The validator accepts a nonempty artifact string without independently establishing that the artifact exists or demonstrates the defect; its documented list input path uses payload.get before distinguishing a list. The `--enforce` option is required for a nonzero exit on validation findings. A repository-wide mandatory invocation and all-defect coverage were not established. Do not infer that all current ledger entries or fixes are invalid.

**Requirement:** Extend existing ledger and verifier to bind defect ID, baseline/corrected revision, affected contract, exact test identity, expected failure reason, observed execution/count/outcome, and evidence artifact digest or structural-prevention proof. Validate schema and artifact resolution, reject missing/empty/malformed required evidence, distinguish unexecuted from failed-to-prove, and use targeted, bounded verification for new critical defects. Support authorized nonautomatable exceptions with owner, rationale and revisit conditions. Use isolated worktrees/fixtures; never revert the user's working tree or claim unrelated compilation failure proves the defect.

### TG-AUD-05 — High: discovery, skip, quarantine and coverage reconciliation

**Gap:** Localized inventory and zero-test controls do not establish a complete all-runner coverage record.

**Requirement:** Extend existing test tiers/shard manifests and test-result summaries to reconcile expected discovered/executed tests with actual selected, passed, failed, skipped, quarantined, timed-out and not-run states by runner, project and revision. Detect unexpected disappearance, narrower filters, duplicated or missing shards, silent environment-dependent skips and zero-test success. Preserve intentional scoped selection and documented optional dependencies. Quarantines require ownership, reason, expiry and replacement verification where material. No blanket test-count minimum that discourages legitimate test consolidation.

### TG-AUD-06 — High: authorized contract and baseline evolution

**Gap:** Some existing golden/manifest re-lock protections are strong, but general test oracle changes require a consistent procedure across runners.

**Requirement:** Reuse existing OpenAPI, golden-cohort, manifest and snapshot re-lock controls; require cited authorized contract change and explicit baseline diff/review for meaningful expectation changes. Verify old and new behavior against a pinned reference where appropriate. Do not allow bulk snapshot regeneration, lower mutation thresholds or broad test exclusions to masquerade as correction. Support legitimate updates with evidence, compatibility assessment and independent review when available.

### TG-AUD-07 — High: bounded mutation execution and workflow input integrity

**Confirmed source observation:** [stryker-pr.yml](../../.github/workflows/stryker-pr.yml) currently has only workflow_dispatch, but still reads github.event.pull_request.base.sha and head.sha for checkout/fetch/planning/differential execution. A normal manual dispatch does not supply that pull-request event object. The job is advisory (continue-on-error). The workflow comments explain that the PR trigger was disabled to control runner congestion. [Scheduled Stryker](../../.github/workflows/stryker-scheduled.yml) has ten targets; the older narrative describes nine.

**Requirement:** Preserve deliberate cost controls; define validated explicit base/head inputs for an authorized differential run or reuse an existing scoped Mutation Aspects workflow instead. Confirm source revisions and baseline test health, nonzero test execution, scoped report provenance, completion status and actual mutation coverage. Keep broad mutation scheduled and critical-kernel work bounded by existing budget; reconcile documentation and actual ten-target baseline/config inventory without silently changing thresholds. Do not re-enable broad per-PR mutation or dispatch comprehensive master CI without owner approval.

### TG-AUD-08 — High: risk-adjusted verification evidence and integration review

**Gap:** The governance workflow already calls for impact-based tests and independent review, but a common machine-readable proof of relevant test execution and integrated-revision evidence was not established.

**Requirement:** Extend existing result artifacts, Test Aspects and review practices to tie affected contracts/consumers to actual test commands and outcomes at the exact integrated revision. Require negative controls for critical boundaries; distinguish real integration dependencies from mocks, manual witness from deterministic tests, flake retry from a clean first pass and skipped from verified. Verify selected versus full equivalence on representative authorized release samples. Record verification cost, escaped regressions, false-positive guard rate and coverage gaps separately from production defect density. Never claim independent review when no separate reviewer was used.

## Delivery priorities and constraints

Start with TG-AUD-01, TG-AUD-02 and TG-AUD-04, then introduce TG-AUD-03 in reporting mode. Reuse existing Test Aspects, Stryker, revert verification, defect prevention and CI path-lane infrastructure. The eight findings do not assert eight confirmed product defects. TG-AUD-02 and TG-AUD-07 have specific source-level observations; other findings describe governance gaps or unverified breadth of enforcement. No changes to tests, thresholds, branch protection, CI workflow triggers or product code are authorized by this audit alone.

## Audit evidence and limitations

Read-only repository source inspection at the stated revision; relevant agent guidance, assurance policy, workflows, test execution model, verifier/validator scripts, mutation baselines and selected self-tests were inspected. Search results were used to locate sources and check related open work, not to assert an exhaustive tree inventory. No tests, builds, mutation jobs, live CI checks or independent second-agent review were run. No whole-suite pass rate or mutation improvement is claimed. Current live branch protection and agent-local workspaces were not available for verification.
