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
