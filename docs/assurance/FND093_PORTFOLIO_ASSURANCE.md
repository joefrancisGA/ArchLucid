> **Scope:** FND-093 portfolio benchmark, scoped post-remediation evidence adapter, and promotion-review criteria. Fixture results are not customer outcomes or rollout approval.

# Remediation portfolio assurance

The focused PR lane runs the FND-088 graph and FND-089 exact small-case oracle, differential, constraints and metamorphic tests, FND-090 independent counterfactual recomputation, and FND-093 benchmark and observed-effectiveness tests. It also runs the existing verification evaluator's property and path tests. CI requires executed tests from all five portfolio suites and a JSON report from the expected benchmark cohort.

## Reproduce the benchmark evidence

```bash
FND093_BENCHMARK_REPORT=/tmp/fnd093-benchmark.json \
  dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj -c Release \
  --filter 'FullyQualifiedName~RemediationPortfolioBenchmarkTests'
```

The versioned synthetic cohort has 8, 32 and 96 actions, varying prerequisite/conflict density, overlap, joint actions, staffing, cost, disruption and mandatory selection. All three selectors see identical reviewed fixture graph, weights, limits and input identity. The harness checks selected action identities, hard limits and scored coverage independently of the solver before recording each comparison. Large cases may be work-limited. Compare the feasible lower bound with the reported bound, not with a claimed exact optimum; the independent exhaustive oracle remains scoped to small cases. These are supported estate-shaped fixtures, not representative empirical customer estates.

The report records the pinned solver/cohort revisions and input digest, modeled coverage for all three selectors, search/evaluation counts, elapsed time, test-process CPU and peak working-set high-water mark, plus calling-thread allocated bytes. The measured call includes setup, optimizer, top-N and greedy phases; the work counts distinguish phases, the elapsed and CPU measurements do not. Run only the benchmark filter for less process noise. Missing pricing is recorded as null. Set `FND093_USD_PER_CPU_HOUR` to an approved USD per CPU-hour estimate to compute estimated cost from measured CPU time at that rate. This is not a provider invoice. Record runner environment and repeat on the same hardware/software profile before setting policy limits.

## Observe actual outcomes

The scope-aware reader consumes records produced by the existing remediation-instance verification flow and reads only the two pinned inventory snapshots and exact instances bound to selected actions. Match the full project and action identity, including approved pattern revision, target and finding. Require evidenced approval and implementation and a scoped, complete later capture that strictly follows the baseline and every implementation attestation. A claimed benefit must also match the existing successful verification receipt bound to that later snapshot and an independently reviewed scenario observation. A confirmed positive observation can contradict a forecast even if the instance's own check failed; absence without complete evidence stays unknown. The reader never invokes the mutating verification workflow, executes remediation, or changes a record's status.

The observed review pins the exact plan and modeled impact, later inventory content, and the independently reviewed scenario roster with fact digests. Separately supply that review digest from an authorized evidence source. Content hashes are integrity checks, not reviewer signatures or causal proof. Agreement is an observed state matching a forecast, not proof of attribution to a particular action. Calibration reports versioned agreement, contradiction and unknown counts with the measured sample denominator and a separate count for forecasts that predicted a change. Successful existing receipt IDs and digests are retained for review. Reusing a project/snapshot/scenario cannot increase sample size and conflicting receipts block promotion review. No new probability or weight calibration is fabricated without a representative cohort.

## Promotion review

The assurance evaluator fails closed against a separately pinned benchmark, later-evidence package and approved policy. The policy can require specific fixtures, minimum measured observations, resource ceilings, a priced compute cap and limits on contradictions or unknowns. No approved later evidence, no eligibility for promotion review. Fixture negative controls cover unsafe/incomplete evidence. The existing CI lane enforces fixture correctness and publishes the report. There is no customer cohort or approved production promotion policy in this slice, and the new decision is not wired to deployment or operational execution.
