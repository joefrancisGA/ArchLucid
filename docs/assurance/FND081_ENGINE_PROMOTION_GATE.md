> **Scope** — Internal, offline, advisory evaluation of reviewed synthetic cases for ArchLucid and SecureNow. A passing result does not authorize production promotion.

# FND-081 severity-weighted engine promotion evaluation

FND-081 uses the pinned [FND-078 paired evaluation](FND078_PAIRED_ENGINE_EVALUATION.md) contract and reruns [FND-079 deterministic verification](FND079_DIVERGENT_FINDING_VERIFICATION.md) on the exact comparison inputs and an independently approved check bundle. It does not run an engine adapter, authenticate reviewer identities, attest where timings were measured, or change any deployed artifact.

The current [RC gate](../runbooks/RC_RELEASE_GATE.md) and the Golden Cohort fine-tuning support-ratio check are separate. The latter does not assess paired, severity-stratified correctness. Neither is changed by this advisory evaluator. The new path-filtered CI job checks the offline contract without adding a release requirement.

## Approve and freeze three inputs

Use canonical JSON digests from the existing FND-078 codec. The trusted custodian must obtain the policy, cohort, run, release and subsequent decision pins from the reviewed evidence pipeline. Rehashing locally generated or mismatched evidence does not establish its source.

| Document | Required data in schema version 1 |
| --- | --- |
| Policy | `policyVersion`, the required `products`, and `minCasesPerProduct`. Each severity entry contains a descending positive integer `weight`, `minPositive`, `minNegative`, `minCoverageBps`, `maxUnknownBps`, `minPrecisionBps`, `minRecallBps`, `maxPrecisionDropBps`, and `maxRecallDropBps`. The `weightedQuality` entry contains the same precision/recall floors and drop limits for the weighted result. `verificationLimits` carries the FND-079 `checks`, `work`, and `deadlineMs` budgets. |
| Cohort | `cohortVersion`, `dataClass: reviewed_synthetic`, the immutable `baselineReleaseSha`, and the baseline `engines` by product using the FND-078 engine spec. Each element of `cases` pins `caseId`, `product`, `fixtureSha256`, `checkBundleSha256`, `performanceProfileSha256`, and scoped `labels`. |
| Paired run | `targetReleaseSha`, candidate `engines` by product, and one entry per evaluated case. Supply `caseId`, FND-078 `fixture` and pair `plan`, `baseline` and `candidate` receipts, FND-079 `checks`, any `adjudications`, and `performance`. The run pin must identify this exact bundle for the candidate selected by release control. |

Every document has `schemaVersion: 1`. Both engine roles use the same fixture, evidence, scope, configuration and policy. The registered case determines the scope regardless of which findings the engines emit. A case cannot count twice under different IDs for the same product and input fingerprint. The current tool operates on reviewed synthetic data only. A synthetic marker is not a sanitizer or a tenant authorization check.

For each label, provide `family`, `scopeKey`, `identity`, independent `severity`, `truth`, `expected`, `evidenceSha256`, and `activeHeadSha256`.

- `independent_corpus` uses a reviewed evidence digest and a null active head. An expected assertion has `assertionId` and a Boolean or integer `asserted` value. A null expectation means an independently confirmed **absence of an emitted finding** in a complete partition.
- `accepted_adjudication` also requires a pinned reproducible FND-080 export in the run and the custodian's current active ledger head in the cohort. An export must match the case, fixture and exact scoped assertion. Custody must refresh the cohort when an approval is disputed or superseded. The tool does not see private ledgers or retrieve their latest heads.
- `unresolved` is not a negative label. Set expectation, evidence, and head to null. Unregistered observations are also unknown. A checked disagreement may establish an exact regression, but cannot add an unregistered label to the accuracy denominator.

Keep cohort selection, labels, weights, floors and budgets independent of the candidate. Preserve protected holdout custody. Do not turn unverified engine agreement, model preferences, or missing observations into truth. FND-082 sampling of shared blind spots is a separate source of future evidence.

The policy's `performance` object takes `minSamples` and a map of `measures`. Require `latencyMs` and optionally `peakMemoryKiB` and `costMicros`. Each measure has an absolute `maxValue` and a `maxIncreaseBps` limit, or null for no relative limit. Each run case supplies a `profile` matching the approved benchmark method and environment digest, and `baseline` and `candidate` sample arrays per measure. Collect them under equivalent conditions. The evaluator checks matching counts, sample minima, and nearest-rank p95 per case. It does not instrument the workload.

## Decision and evidence

- **Block** on an unacceptable confirmed critical change, an unresolved material critical disagreement, a pinned quality threshold breach, or a performance budget breach. For this synthetic contract, a new error on a critical slot is intolerable and every unresolved critical difference is considered material. Neither weighted gains nor other products' results can compensate. A conflict between independently pinned truth and a deterministic proof remains explicit.
- **Insufficient** if the available evidence cannot show a pass and no confirmed block takes precedence. Examples include missing or incomparable coverage, unknown critical truth, missing cases, insufficient labels, an undefined rate required by policy, or too few paired performance measurements.
- **Pass** only when all applicable checks clear. This is an advisory result. The output always contains `promotionAuthorized: false`.

Report separate per-product, per-severity precision, recall, labelled positive and negative counts, unknowns and scoped coverage. Scores use exact ratios when applying thresholds and integer basis points for display. Undefined metrics are null, never perfect. Weight true positives, false positives and false negatives before computing the aggregate per product. Evaluate that aggregate in addition to, not in place of, each stratum and hard critical rules. Sample and unknown budgets do not constitute statistical confidence intervals or a claim about unlabeled cases.

The audit output binds the decision to immutable policy, cohort, case, comparison, verification, run, candidate, and baseline digests. It records reason codes and hashed case/slot references without copying findings, evidence text, reviewer data, or raw identities. Keep the source artifacts and final pinned result in the existing release evidence custody. Digests provide linkage, not authentication.

## Run and rehearse without deployment

```bash
python3 scripts/assurance/evaluate_engine_promotion.py evaluate \
  --policy policy.json --policy-sha256 "$POLICY_PIN" \
  --cohort cohort.json --cohort-sha256 "$COHORT_PIN" \
  --run paired-run.json --run-sha256 "$RUN_PIN" \
  --target-release-sha "$CANDIDATE_SHA" > engine-promotion-advisory.json
```

`evaluate` returns 0 for pass, 1 for block or insufficient (with the audit report on stdout), and 2 for invalid input or execution failure. Preserve the result and exit status separately. Do not treat a missing file, execution error, or non-pass as approval.

```bash
python3 scripts/assurance/evaluate_engine_promotion.py rehearse \
  --report engine-promotion-advisory.json --report-sha256 "$ADVISORY_PIN" \
  --policy-sha256 "$POLICY_PIN" --cohort-sha256 "$COHORT_PIN" --run-sha256 "$RUN_PIN" \
  --target-release-sha "$CANDIDATE_SHA" --baseline-release-sha "$LAST_KNOWN_GOOD_SHA"
```

Rehearsal validates the exact pins and emits the candidate and rollback release and engine identities without deploying either. An isolated rehearsal can provide independently collected, pinned `--observations` and `--observations-sha256`. The version 1 observation document has `kind: isolated-engine-promotion-observations`, `rehearsalSha256` for the exact plan, and three stages (`before`, `afterPromotion`, `afterRollback`) with `releaseSha` and per-product `enginePins`. The verifier rejects a release marked as rolled back if any engine or configuration identity remains on the candidate. The synthetic tests verify the contract, not a real deployment.

## Remaining before mandatory activation

1. Reconcile the full promotion inventory with release owners. The RC signoff workflow and fine-tuning check are identified, but manual promotion and deployment authority have not been verified end to end.
2. Generate independently pinned signed-off evidence from the authorized release runner. Choose accepted policy thresholds, held-out evaluation inputs and measurement methods without using candidate outcomes.
3. Run non-blocking candidate evaluations against the release cohort, review false alarms and missing evidence, and exercise a known-good candidate and a known-bad one using the actual preproduction release path.
4. Wire the exact candidate decision and its provenance into every authoritative promotion path. Demonstrate that unavailable, stale, wrong-target, and blocked results cannot promote. Apply the repository's durable audit contract to the real promotion mutation.
5. Rehearse rollback using the deployment system in an isolated release environment, collect independent observations, verify restored behavior as well as artifact identity, and retain the evidence. Revalidate the complete path before requiring the gate.

No existing PR gate, deployment, rollback or release policy is modified by this increment.
