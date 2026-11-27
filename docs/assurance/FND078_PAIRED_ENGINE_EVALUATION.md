# FND-078 paired engine evaluation

The offline harness compares observations from two independently instantiated versions of an ArchLucid or SecureNow analysis engine. A comparison indicates differences, not correctness, regression truth, or promotion eligibility. The harness does not add a product endpoint, fetch live evidence, or change a merge or release rule. It reuses checked-in golden and reference-world cases for its deterministic validation.

## Run the reference cases

```bash
python3 -m unittest discover -s scripts/ci/tests -p 'test_paired_engine_evaluation.py' -v
```

The executable tests reuse the [ArchLucid golden topology case](../../tests/golden-corpus/agent-output-reference-cases.json) and the [neutral SecureNow reference graph](INDEPENDENT_ORACLE_WORKED_CASES.md#simple-directed-walk-edge-budget). They run the two pinned, deterministic fixture adapters in fresh subprocesses, then reverse the order and compare the results. The independently enumerated first slice expects one new and one agreed observation for each product. Separately specified tests exercise removed, changed and incomparable cases. These are harness acceptance cases, not benchmarks of production engine quality. No production engine-release adapter, live corpus execution, independent human labels, or promotion gate is bundled.

## Run an engine pair or compare existing receipts

Prepare one authorized, materialized fixture and a pair plan. For `run`, explicitly supply two trusted local adapter executables or Python adapter files. Both receive the identical canonical fixture JSON on stdin and must write exactly one receipt JSON object to stdout. Use product-specific offline adapters to invoke the selected engine version and project its actual evidence coverage and normalized findings into the receipt. Do not copy an expected version or fixture hash into a receipt for a run that did not use them. Executable paths do not come from the fixture or the pair plan.

```bash
python3 scripts/assurance/paired_engine_evaluation.py run \
  --fixture fixture.json --plan plan.json \
  --baseline ./baseline-adapter --candidate ./candidate-adapter \
  --timeout 30 --receipt-directory pair-receipts > pair-report.json
```

Use `--candidate-first` for the reverse-order check. Adapters run with a fresh working directory and bounded elapsed time and JSON input/output size. Run only reviewed, locally trusted adapters. This is not a process sandbox. The adapter digest pins the reviewed entry file, not the interpreter, all transitive dependencies, or an external model. Each adapter is responsible for binding those engine/model/prompt versions accurately and not fetching different evidence or configuration. No customer or live runner is invoked by the checked-in acceptance tests.

To replay a comparison without executing code:

```bash
python3 scripts/assurance/paired_engine_evaluation.py compare \
  --fixture fixture.json --plan plan.json \
  --baseline pair-receipts/baseline.json --candidate pair-receipts/candidate.json \
  > replay-report.json
```

Replay validates the receipt's declared pins and comparison inputs. It does not verify an executable digest or independently attest that an imported receipt was produced by a real run. Keep the fixture, pair plan, receipts and report together as internal evaluation evidence.

## Version 1 input and receipt contract

| Object | Fields and meaning |
| --- | --- |
| Fixture | `schemaVersion` 1, `product` (`ArchLucid` or `SecureNow`), `caseId`, `cohortVersion`, explicit `partitions`, and nonempty JSON objects `evidence`, `policy`, `scope`, `configuration`. Materialize the same inputs for both sides before running. |
| Partition | `family`, `scopeKey` and expected `identityScheme`. Define the requested coverage independently of the engine outputs. A scope key is an authorized case-local identity, not a tenant authorization decision. |
| Pair plan | `schemaVersion` 1, `fixtureSha256`, and `baseline` and `candidate` engine objects. Each engine has `id`, a full immutable commit `revision`, `model`, `promptVersion`, and a lowercase `adapterSha256`. Use null for inapplicable model or prompt. |
| Engine receipt | `schemaVersion` 1, `fixtureSha256`, actual `engine` object, `coverage` array, and `findings` array. Coverage must describe what was evaluated, not simply what was requested. |
| Coverage row | `family`, `scopeKey`, `status` (`complete`, `partial`, `failed`, `notEvaluated`, `notApplicable`, or `stale`), `reason` (required unless complete), and actual `identityScheme` (required when complete). Omission becomes missing coverage. |
| Finding row | `family`, `scopeKey`, original `sourceId`, authoritative stable `identity` or null, nonempty `semantics`, and nonempty `provenance` references. Put material structured values in `semantics`, not run IDs, timestamps, or original transport ordering. Do not change the meaning of a semantic field without versioning the adapter contract. |

The fixture and receipt hashes use the harness canonical JSON bytes, serialized with sorted object keys, no insignificant whitespace and no nonfinite values. For an on-disk fixture, use the repository helper to compute the plan pin:

```bash
PYTHONPATH=scripts/assurance python3 -c 'import sys; import paired_engine_evaluation as p; print(p.sha(p.canonical(p.read(sys.argv[1]))))' fixture.json
```

A `run` adapter can hash the exact bytes it reads from stdin. Use the executable file's raw bytes for its adapter digest. Never recompute a digest from different input to make a receipt match.

For reusable cross-run keys, adapters should emit a scoped `fnd:v2:…` key from the existing [finding correlation rules](../architecture/adrs/0063-cross-review-finding-identity.md) and declare `archlucid-finding-v2`. When a product or fixture already supplies a different stable authoritative source identity, use `authoritative-source-v1` only if both sides share its namespace and semantics. The harness does not generate aliases, compare fuzzy titles, or silently bridge differing key schemes. If an upstream key includes a message or category and that field changes, the new key is not presumed to be the same finding. An adapter without a trustworthy identity must emit null and preserve the original source ID.

## Interpret the report

- **Agreed / changed** compares semantic fields for one exact identity in the same family and scope. Original IDs and provenance on both sides stay visible. Agreement is not ground truth.
- **Added / removed** requires both sides to have completed the same partition under the pinned identity scheme. A finding missing from a side with incomplete coverage or potentially unresolved matching is not a confirmed addition/removal.
- **Incomparable** preserves the coverage status, missing or conflicting identities, all collided observations, and the reason. A partition missing on both sides remains visible even when no findings were emitted.
- Top-level counts group comparison rows by family. An incomparable row may represent a whole partition or multiple findings and is not a finding count or accuracy statistic. The report keeps the fixture and component hashes and independently records both receipt hashes.
- Exit zero means the report was produced, not that the candidate won or that every comparison is conclusive. Exit two indicates an invalid or mismatched input, an adapter error, a timeout, or a size-budget error. Do not reinterpret those as zero findings.

TB-2408's cohort-level win/draw/loss scores and minimum sample sizes need independent labels before any strength claim. An optional blinded model judge can prioritize review only. Deterministic adjudication, human label workflow, promotion gating, and agreement sampling stay with FND-079 through FND-082.
