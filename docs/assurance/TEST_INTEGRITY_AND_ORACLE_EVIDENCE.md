> **Scope:** Internal contributor evidence for FND-165 and FND-171. A bounded sample, not a report of repository-wide test quality.

# Test integrity and independent oracle evidence

## FND-165 reporting-mode calibration

The initial pilot ([PR 8333](https://github.com/joefrancisGA/ArchLucid/pull/8333), [run 46065115741](https://github.com/joefrancisGA/ArchLucid/actions/runs/46065115741)) published a JSON report at head `68c54c4b2b9b49b0d70a2a299037f45395a13601`. Its reported merge base was `5c68b71dda7016b8c599b164f9a75dc021a46473`. It scanned two pilot-supported paths and correctly signalled the workflow's new targeted test command.

The wider scanner was replayed locally on three merged PR heads. Dates, hashes, and results here describe the comparison rather than the entire head tree. The requested base and actual Git merge base can differ.

| PR and sample | Base supplied | PR head | Supported paths | Findings |
| --- | --- | --- | ---: | ---: |
| #8320 Python mutation-score reporting restructure | `dc5b783503935e8d8dd8a4b9f6bb4b3fc8ebe154` | `c84ef5d46174e35bd35fcead5dd21ce6551192da` | 6 | 14 |
| #8327 .NET rendering checks and production template change | `f9ab237bc0abd826d4f1374e9816709d36b2c590` | `6519a87cbb73056a64e9c3756989e5fa023bb7d3` | 1 | 0 |
| #8329 TypeScript UI scope and review tests | `f3b7e447eee03cff7415653ab2f7cbf990ace1bd` | `09445d4af0f86d18307f64de890e4b190bb40b1a` | 5 | 0 |

The sample author classified three of the 14 findings as noise for a reviewer assessing weakening. In #8320, the config argument assertion moved to an explicit index lookup, the incomplete-score assertion kept its expectation after fixture extraction, and the deleted negative control produced a second signal for the same line. The other 11 were definition or check changes worth reviewing. A reported removal of a test definition does not establish loss of its contract when another test covers it. The two zero-signal PRs added tests or checks without an identified supported-pattern reduction on review. This hand-labeled sample yields 3/14 noisy signals, not an estimate of repository-wide false positives or missed changes. Controls for skips, altered tolerances, mock replacement and static selection changes are synthetic. Three redundant descendant findings were removed from the initial run on #8320. The bounds for workflow files now accommodate the current main workflow that the pilot had marked unscanned. Separate scope, truncation, and reporting-only behavior remain.

No existing debt was imported as approved and no exceptions were issued. **Keep this advisory.** Before seeking owner approval for limited blocking, collect a larger, risk-stratified set of human-reviewed PRs including deleted checks, legitimate rewrites, broad control/config shifts, and omissions. Specify target review noise, missed-case and runtime thresholds, agreed owners, and a rollback path. Recheck actual hosted outputs before proposing any scope.

## FND-171 covered contracts and verification

The [provenance inventory](../../scripts/assurance/regression-evidence/independent-oracles.json) records registered test identity, contract, expected-result derivation, source locator/content pin, examples and open questions. It extends [FND-163](../engineering/AI_ASSISTED_DEVELOPMENT_GOVERNANCE.md#23-mandatory-test-integrity-and-regression-preservation) and [FND-166 evidence](AUTOMATIC_REGRESSION_POLICY.md). It is not another defect ledger. No seeded mistake is logged as a production defect. Inventory entries classify source independence and limitations, not confidence in a whole component.

Verification used a disposable .NET 10 Release xUnit project with the repo's test package versions, warnings treated as errors, and the actual product/reference/test sources included. It ran 12 cases with no failures or skips, including the real cut-point analyzer comparison. The full consuming .NET project suites and broad CI were not run. The [worked examples](INDEPENDENT_ORACLE_WORKED_CASES.md) show independent expected results. Golden corpus compatibility remains characterization, and graph boundary coverage remains an open question. A separate recurring Test Aspects audit stays under FND-172.

In an isolated copy of the same project, the finite vector calculation was made unsigned and the neutral reference graph counted occurrences instead of set membership. These are harmless synthetic controls. One deliberately coupled test per variant computed its expected result by calling the same code under test. Re-run the selected four tests with:

```bash
dotnet test Probe.csproj -c Release \
  --filter 'FullyQualifiedName~Cosine_matches_worked|FullyQualifiedName~Counts_distinct_path_ids|FullyQualifiedName~CoupledControls'
```

The seeded run returned exit 1 with both coupled controls passing and both independent cases failing. Observed assertion differences were -0.6 expected vs +0.6 actual for the signed dot-product case, and 2 expected vs 3 actual for repeated-path deduplication. The unmodified source-linked build and its production/reference comparison were green. The product source inputs were fetched at `5c68b71dda7016b8c599b164f9a75dc021a46473`; the compared sources were not changed by the subsequent master merge `87bf081a2a45e41555876a2f59689a080d62a284`.

For full project-level verification of the affected tests on the normal release lane, target only these classes:

```bash
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj -c Release --filter 'FullyQualifiedName~EmbeddingFaithfulnessIndependentOracleTests'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj -c Release --filter 'FullyQualifiedName~SecureNowReferenceCutPointOracleTests|FullyQualifiedName~ReferenceCutPointWorkedOracleTests'
```

The advisory check validates source pins and searches for registered test identities. It cannot establish that an expected result was independently derived, determine whether cited requirements are authoritative, or discover all unregistered critical tests. Expand the inventory and resolve per-contract ambiguity before adopting wider verification claims.


## FND-165 follow-up calibration and rollout decision

After #8339 merged, replayed 13 landed comparisons at the first-parent boundary. This deliberately mixed Python test/evidence revisions, .NET assertion and fixture changes, TypeScript/Vitest additions, and CI workflow edits. It is not a statistical sample. Author review of the removed alerts found mock setup added with new tests or test modules, rather than a real dependency replaced in an existing check. Changes to shared fixtures and existing test mocks still produce review findings. New skip/exclusive markers still produce findings.

| PR | First-parent base | Landed merge | Supported files | Before | After |
| --- | --- | --- | ---: | ---: | ---: |
| #8338 | `2bab65622b14` | `a5e2ec0d2e03` | 2 | 0 | 0 |
| #8335 | `5c68b71dda70` | `87bf081a2a45` | 3 | 25 | 3 |
| #8334 | `87bf081a2a45` | `bde9f398f7c9` | 1 | 1 | 1 |
| #8332 | `350231361101` | `27911eaf2fc0` | 3 | 0 | 0 |
| #8331 | `27911eaf2fc0` | `b25f279794d3` | 3 | 8 | 0 |
| #8330 | `b25f279794d3` | `3ba0ab3e1969` | 2 | 2 | 2 |
| #8329 | `f3b7e447eee0` | `5c68b71dda70` | 5 | 0 | 0 |
| #8328 | `3386d3f4b46a` | `f9ab237bc0ab` | 1 | 0 | 0 |
| #8327 | `f9ab237bc0ab` | `e0eabdf2bb3d` | 1 | 0 | 0 |
| #8326 | `9a40453a48f2` | `1a718a4fde7f` | 1 | 8 | 0 |
| #8324 | `967b54a9487c` | `689362774044` | 3 | 0 | 0 |
| #8320 | `6cd5f80c92f5` | `d70c4052ab07` | 6 | 14 | 14 |
| #8316 | `0e9e7759ca66` | `882cdb16ebc8` | 4 | 6 | 6 |

The sample covered 35 supported files and produced 64 signals before and 26 after. The change removes 38 additions-only mock alerts. It does not claim that the remaining 26 are all actionable. All 13 scans completed for supported scope, with no unsupported or unscanned files among the selected comparisons. Warm-cache runs took 0.02–0.12 seconds on this checkout. Initial runs with missing Git blobs took as long as 27 seconds per comparison, so this is not a hosted runtime guarantee.

The eleven independently labeled synthetic Git pairs yielded eight detections. The detected changes were a Python assertion, a pytest selection setting, a .NET negative control, a .NET mock added to an existing test, a Vitest tolerance, a Playwright exclusive test, a coverage exclusion, and a snapshot refresh. Three intentionally challenging positives were missed: an assertion edited only in a same-file Python helper, a data-driven expectation in an unsupported JSON fixture, and an edit to a multiline Playwright selection value without editing the option name. The fixture was reported as unsupported. These are measured example misses, not a repository-wide recall estimate.

**Decision for this review: keep the guard advisory.** The measured misses and the lack of independent human labels or agreed operating thresholds do not support making it required. No exceptions, branch-protection changes, or full CI dispatch were made. Reproduce a row with the existing scanner by supplying the full SHAs resolved from its base and merge Git prefixes.

## FND-171 follow-up scope and boundary

The registry expands from nine to fourteen entries. The previously uncertain SecureNow comparison is now classified as independent **for the small fixture below the production depth cap**. The new entries also cover two distinct branches, revisited-node rejection, the neutral reference's inclusive edge budget, and the ArchLucid topology identity and idempotence properties. These are scoped test claims, not a product-wide coverage assertion.

The reference treats its edge budget as inclusive for endpoint evaluation. The production walk checks its budget before accepting a terminal. The existing comparison is valid below the cap and cannot settle production's exact-cap contract. The new written example and four cases fix the boundary for the neutral reference only. Keep the two contracts separate unless the owner establishes a normative production expectation. This follow-up does not reclassify the difference as a confirmed product defect and makes no production change.

The [path-scoped project workflow](../../.github/workflows/pr-independent-oracle-project-tests.yml) runs Release tests through both normal project files and verifies that each TRX actually records passed tests. It is not a required merge check. On the local checkout the AgentRuntime test project restored its normal dependency graph, but the shared Application compiler exited 137 before test execution. That is not a test pass or failure. A separate source-linked .NET 10 Release probe passed all 16 cases, including the four new neutral boundary cases. Check the hosted project's own TRX before treating this verification as complete.
