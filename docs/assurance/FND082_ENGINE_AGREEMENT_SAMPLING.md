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

Only confirmed shared errors yield `fnd081LabelCandidates`. Each contains the exact case and fixture bindings, scoped label, and a digest of its independent proof and sampling context. To use one in [FND-081's advisory evaluator](https://github.com/joefrancisGA/ArchLucid/pull/8371), the cohort custodian reviews that evidence, adds the exact `label` to the matching fixture's cohort case, and issues a new trusted cohort pin. With a critical recall floor, an accepted shared miss must block even if neither engine regressed relative to the other. Keep proposals and approved corpus entries distinct. This tool does not publish a label, promote an engine, change release enforcement, or send anything to a human reviewer. Unknown cases can be reviewed separately and must not be inserted into the truth denominator.
