# FND-079 deterministic verification of divergent findings

Use this offline verifier after [FND-078 paired engine evaluation](FND078_PAIRED_ENGINE_EVALUATION.md). Its verdict applies only to a declared assertion in one authorized fixture partition. It does not decide which engine is stronger, independently endorse a severity label, verify customer environments, or promote findings to decision-grade authority.

## Run and retain the evidence

Start with one fixture, pair plan, and the actual baseline and candidate receipts. Author and review a separate check bundle using evidence that was not derived from the engine observations and pin the bundle before use. No report, receipt, or check bundle can name a process to run. The included checks only operate on local materialized JSON.

```bash
python3 scripts/assurance/verify_divergent_findings.py \
  --fixture fixture.json --plan plan.json \
  --baseline pair-receipts/baseline.json --candidate pair-receipts/candidate.json \
  --comparison pair-report.json --checks checks.json \
  --checks-sha256 "$REVIEWED_CHECK_BUNDLE_SHA256" > verification-report.json
```

The verifier reconstructs the comparison with the original FND-078 implementation before accepting a supplied report. It rejects a changed observation, mismatched input or altered comparison classification. The original runner's adapter-digest flags are kept for report linkage only and are not independently reattested. Omit `--comparison` to use the recomputed report and its hash. The FND-078 canonical JSON representation is used throughout. Keep the original fixture, pair plan, receipts, report, check bundle and reviewed digest together. Supplied JSON files are limited to 4 MiB each. For an original comparison larger than that limit, omit the report argument and recompute from receipts.

To calculate a digest to be reviewed rather than blindly trusting the input at execution:

```bash
PYTHONPATH=scripts/assurance python3 -c 'import sys; import paired_engine_evaluation as p; print(p.sha(p.canonical(p.read(sys.argv[1]))))' checks.json
```

## Declare an independent check

| Record | Required fields and constraints |
| --- | --- |
| Claim projection in an FND-078 finding's `semantics` | `assertionId` and typed `asserted` Boolean, integer or nonempty string. `severity` from the observations guides scheduling only. The observation's identity, family and scope come from the validated FND-078 finding. Additional semantic fields are preserved but are not adjudicated. |
| Check bundle | `schemaVersion` 1, `fixtureSha256` and `checks`. The fixture pin must match the original paired input. |
| Check | Unique `checkId`, `version`, `family`, `scopeKey`, exact `identity`, `assertionId`, `valueType` (`boolean`, `integer`, or `string`), `oracle`, `factId`, and `source` (`id`, full commit or content digest in `revision`, and precise `locator`). |
| Independent witness in fixture `evidence.verificationFacts` | `family`, `scopeKey`, `factId`, `status`, `value`, and `references`. A conclusive witness must have complete coverage and at least one traceable reference. The fact must be inside the declared partition. |
| Allowed oracles | `read_scalar` reads one independently established typed value. `count_distinct` derives an integer cardinality from up to 1,024 string member IDs. Missing, incomplete or ill-typed evidence cannot confirm or refute anything. |

An oracle checks the exact typed assertion, not an absence in either output. For example, hand-enumerate the distinct members of a neutral fixture catalog containing `["one", "two", "two", "three"]`. A disputed count of three is supported and a count of four is refuted. If the catalog is incomplete, the count remains inconclusive. The same approach works for both product labels without contacting a live system. The bundled tests exercise these synthetic catalogs, not a product-wide validation of engine findings.

When adding a check, record where the expected property came from and how its evaluator differs from the disputed computation. A shared implementation helper, either output, or agreement between them is not independent evidence. The digest only pins reviewed input bytes. It cannot decide whether a human chose an independent source. Deploy any new oracle as reviewed bounded code with an independently worked positive, negative and gap case, not an expression or executable embedded in the bundle.

## Routing and budgets

Disagreements with a reported critical severity are scheduled first, using both sides to prioritize a changed finding. Exact identifiers break ties deterministically. Coverage or identity incomparables are retained as inconclusive. An agreed finding is skipped because sampling agreed outputs belongs to FND-082.

For each exact claim, use the cheapest available check. A scalar costs one work unit and distinct counting costs two plus one per input member. Missing or incomplete facts are recorded without charging an execution. If a cheaper check cannot settle the claim, continue to an applicable alternative within budget. Alternatives in the same group must be reviewed as equivalent ways to check the same assertion. A completed cheap check does not establish the absence of unexamined contradictions.

Defaults are `--max-checks 64`, `--max-work 4096` and `--deadline-ms 1500`. The deadline applies to verification attempts after validating inputs. No background workers, remote calls, or model judgments are used. Count and input limits bound the preflight and each deterministic operation. A deadline reached during execution discards that attempt's result rather than converting it into a truth verdict.

## Interpret and hand off results

- **Supported** or **refuted** means a complete, exact independent check settled the declared scalar assertion. It does not assess the original finding's other semantic fields.
- **Inconclusive** retains insufficient coverage, incomplete evidence, execution failures, timeouts or exhausted budgets. Do not interpret it as a negative result.
- **Not testable** means the assertion has no supported projection or approved check for that scope and identity.
- Each result keeps its origin side, original observation, coverage and comparison-row digest. The report retains the fixture/component hashes, both run receipts' hashes, the comparison hash, the check-bundle digest, and the exact check/version/source and scoped evidence used. Unresolved rows are available for FND-080 handoff. No human workflow, promotion gate or agreement sampling is added.
- Exit zero means a report was produced, including fully unresolved comparisons. Exit two means invalid, mismatched, or unreadable input. Neither exit value is a quality or release gate.

Verify the full starter set locally:

```bash
python3 -m unittest discover -s scripts/ci/tests -p 'test_verify_divergent_findings.py' -v
```

Acceptance cases exercise all four verdicts, an independently supported omitted claim, a refuted added claim, a changed finding with different outcomes on both sides, exact input and report pinning, incomplete coverage, out-of-scope evidence, absent methods, reproducibility, measured work ordering, and fail-safe deadline/execution behavior.
