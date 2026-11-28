> **Scope** — Internal, offline assurance on reviewed synthetic inputs. A sampled result is evidence for the exact registered assertion and scope, not a product-wide claim or promotion approval.

# FND-082 sampling of shared engine conclusions

[FND-078](FND078_PAIRED_ENGINE_EVALUATION.md) aligns observations from two pinned runs. [FND-079](FND079_DIVERGENT_FINDING_VERIFICATION.md) checks disagreements and deliberately does not treat agreement as truth. This increment also checks two cases: matching emitted assertions and complete paired scopes where neither engine emits a specifically expected finding. Neither workflow runs in a customer environment.

## Freeze the frame before examining engine output

An independent fixture custodian registers which scoped findings could be assessed. Do not derive this roster from the two engines' findings. Otherwise a finding missed by both would never enter the sample. Use only reviewed synthetic reports, receipts, evidence, and reference sources. Freeze the manifest, seed, target identities, risk strata, budgets, and checks before examining candidate outcomes.

| Manifest field | Contract |
| --- | --- |
| `schemaVersion`, `dataClass`, `policyVersion` | Version 1, `reviewed_synthetic`, and a reviewed policy version. |
| `fixtureSha256`, `checkBundleSha256` | Bind the exact FND-078 fixture and the independently reviewed FND-079 check bundle. |
| `selectionSeedSha256` | A preselected 64-character lowercase hex seed. Do not shop for another seed after seeing the results. |
| `samplesPerFrame` | Integer quota per severity (`critical`, `high`, `medium`, `low`, `informational`). The quota applies separately to shared silence and matching emitted assertions. |
| `verificationLimits` | FND-079 limits with `checks`, `work`, and `deadlineMs`. Critical frames spend the shared verification budget first. |
| `targets` | Up to 512 independently registered scoped targets. Each has `family`, `scopeKey`, `identity`, `assertionId`, `valueType`, `form`, `severity`, and `checkId`. Require unique scoped identities. A null check ID marks a target that cannot yet be independently verified. |

For a `positive_boolean_finding`, use a presence predicate with an exact contract. A true independent result means the engine should emit the scoped finding with the declared assertion ID and the Boolean value true. A false result means this finding should be absent in a completely evaluated scope. Silence is eligible only when both scopes are complete, use the expected identity scheme, and do not contain an uncorrelatable finding. A finding with an explicit false scalar assertion is not silence.

A `scalar_assertion` checks a matching emitted Boolean or signed 64-bit integer assertion. Two silent receipts are not a scalar result. In either form, the check must bind the exact scope, identity, assertion, and type. The FND-079 implementation supplies the deterministic oracle, immutable source, fact coverage, references, and work bounds. Human judgment, unpinned evidence, and engine agreement never replace independent proof.

## Interpret the report

The selection hash uses the pinned seed, case ID, frame, and scoped identity. Selection is without replacement and independent of receipt or target order. These are samples of the registered frame only. Run separate fixtures for ArchLucid and SecureNow.

- `shared_false_negative` means both engines were silent in a complete comparable scope and the independent presence predicate was true.
- `shared_false_positive` means both emitted a matching positive finding and the independent presence predicate was false.
- `shared_wrong_assertion` means both asserted the same scoped scalar but the independent check returned a different exact value.
- `confirmed_correct` means the exact checked value or absence was corroborated. It says nothing about other findings or partitions.
- `unknown` keeps missing or incomplete evidence, coverage, identity ambiguity, unsupported claims, or exhausted budgets out of proven results. FND-079 handles divergent findings. Unsampled targets are distinct from unknown sampled targets.

For each eligible stratum the report records selected, resolved, confirmed error, unknown, and unsampled counts. Its error-count range is the observed error count through that count plus all sampled unknowns and unsampled items. This is a conservative bound for the eligible registered frame, not a confidence interval or an estimate for excluded scopes. Review incomplete coverage and exclusions separately. A zero error count alone is not a pass.

## Run and hand off a confirmed error

```bash
python3 scripts/assurance/sample_engine_agreements.py \
  --fixture fixture.json --plan plan.json --baseline baseline.json --candidate candidate.json \
  --checks approved-checks.json --manifest manifest.json --manifest-sha256 "$REVIEWED_MANIFEST_PIN" \
  > agreement-sampling.json
```

Optionally pass `--comparison` to replay a supplied FND-078 report against the receipts. Pins use FND-078 canonical JSON, not the pretty-printed artifact bytes. A successful command means the report was produced, even if errors or unknowns were found. Invalid inputs fail without reporting a result.

## Summarize a pinned cohort

The cohort manifest has `schemaVersion: 1`, `cohortVersion`, `dataClass: reviewed_synthetic`, `products`, and `cases`. Every case records `product`, `caseId`, `fixtureSha256`, and the canonical `reportSha256`. The reviewed manifest is the complete expected case inventory, not a directory glob. The summarizer rejects missing and duplicate reports, detects identical inputs relabeled as separate cases within a product, and cross-checks recorded specimens against their stratum totals.

```bash
python3 scripts/assurance/summarize_engine_agreement_cohort.py \
  --cohort cohort.json --cohort-sha256 "$REVIEWED_COHORT_PIN" \
  --report archlucid-sampling.json --report securenow-sampling.json
```

Interpret the coverage and the error-range counts separately for each product, severity, and frame. Known shared false negatives have their own count. Cases with incomplete coverage are not eligible and do not narrow the error range. Rates use conservative outward rounding. Do not interpret them as statistical confidence intervals or make claims about an unregistered population.

## Review, export, and hand off through FND-080

The operator's sampling report contains a `reviewQueue` with a stable row digest for each sampled unknown or confirmed shared error, plus unresolved exclusions such as incomplete coverage. Correct, unsampled, and divergent cases do not enter this queue. Use the approved [FND-080 review policy and ledger](FND080_FINDING_ADJUDICATION.md) with the exact sampling report as `--report`, its canonical digest as the policy's `reportSha256`, and the chosen queue digest as `rowSha256`. The reviewed proof source must match the independent oracle source to export. For an unknown, it may be absent.

Generate the blinded packet and use the existing `genesis` and `append` commands to record independent proposal and acceptance. Share only the blinded packet. The operator keeps the sampling report, receipts, proof and ledger private. Reviewers see neutral choices and the curated evidence, not which value the engines returned, whether they agreed with a proof, or their identities. Unknown integer cases have no fabricated alternative. Human judgments are recorded but never promoted to deterministic truth.

For a reproducible regression, two eligible reviewers select and approve the independently verified value. Set `proofSha256` on the proposal to the digest of the selected row's `proof`, not the overall report. Then use the trusted ledger head and replay the unchanged inputs:

```bash
tool=(python3 scripts/assurance/review_divergent_findings.py)
private=(--report agreement-sampling.json --policy approval.json --policy-sha256 "$POLICY_PIN" --secret-file case.key)
"${tool[@]}" packet "${private[@]}" > reviewer-packet.json
"${tool[@]}" export-agreement "${private[@]}" --ledger ledger.json --head "$ACTIVE_HEAD" \
  --fixture fixture.json --plan plan.json --baseline baseline.json --candidate candidate.json \
  --checks approved-checks.json --manifest manifest.json > regression.json
"${tool[@]}" promotion-handoff --regression regression.json \
  --regression-sha256 "$REVIEWED_REGRESSION_PIN" --active-head "$ACTIVE_HEAD" > promotion-handoff.json
```

Provide the original `--comparison` to `export-agreement` if used to produce the sampled report. Export replays the exact pinned comparison and the independent oracle. It fails for unproven or disputed decisions, holdout or tuning partitions, different receipts or approval source, and stale ledger heads. Use FND-080's `check-regression` to compare the exported expectation against a fresh pinned candidate receipt. For a proved negative expectation it requires complete coverage and no matching or ambiguous identity. For an assertion it requires the exact value, identity, and severity. No review or regression result mutates an engine or release path.

For [FND-081 advisory evaluation](https://github.com/joefrancisGA/ArchLucid/pull/8371), the cohort custodian reviews the regression and fresh handoff, adds the scoped `label` to the matching case, attaches any `adjudications` to the matching run, and issues new trusted pins. Asserted findings use FND-081's accepted-adjudication contract. The current FND-081 schema represents a proved absence as an independent corpus label, so the custodian must recheck `sourceLedgerHeadSha256` and retire or repin that label if disputed. The original sampler's `fnd081LabelCandidates` remain unadjudicated proposals. A gate with a critical recall floor must block an approved shared miss even if neither engine regressed relative to the other.

The workflow and tests exercise reviewed synthetic fixtures only. No live reviewers, production promotion, or mandatory release enforcement is activated here.
