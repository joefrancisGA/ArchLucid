# Architecture improvement #5: ArchLucid performance and reliability proof

The existing `scripts/load/hotpaths.js` runs five real API hot paths. This increment adds a **fail-closed evidence contract**; it does not claim to have executed a load test.

Run only against an isolated disposable deployment with representative seeded data. Do not use production credentials or include secrets in the metadata.

```bash
BASE_URL=http://127.0.0.1:5000 VUS=5 DURATION=2m \
  K6_SUMMARY_TREND_STATS='med,p(95),p(99)' \
  k6 run scripts/load/hotpaths.js --summary-export artifacts/archlucid-hotpaths.json
```

Create `artifacts/archlucid-hotpaths-metadata.json` with the exact commit, isolated environment, database seed profile, runner hardware profile, concurrency and duration:

```json
{
  "gitSha": "REPLACE_WITH_TESTED_COMMIT_SHA",
  "environment": "isolated-staging",
  "workload": "scripts/load/hotpaths.js",
  "databaseProfile": "REPLACE_WITH_SEEDED_DATASET_DESCRIPTION",
  "runnerProfile": "REPLACE_WITH_RUNNER_CPU_RAM",
  "vus": 5,
  "durationSeconds": 120
}
```

```bash
python3 scripts/ci/evaluate_archlucid_hotpath_evidence.py \
  --summary artifacts/archlucid-hotpaths.json \
  --metadata artifacts/archlucid-hotpaths-metadata.json \
  --output artifacts/archlucid-hotpaths-verdict.json
```

The evaluator rejects missing metrics, missing endpoint samples, invalid percentiles, zero requests, incomplete metadata, and unapproved production metadata. It requires at least 99% passing checks and aggregate p95 below 2 seconds. Five endpoint-specific tagged p95 metrics must exist; k6 emits them via explicit thresholds in the load script. The per-endpoint 2-second thresholds are enforced by k6; the evaluator currently validates their presence and numerical validity, not the k6 threshold verdict. Preserve the original k6 summary alongside the verdict.

**Limitations:** This is a reproducibility and evidence-integrity foundation, not production-like proof by itself. Before claiming readiness, exercise cold/warm starts, failure injection, representative tenant cardinalities, SQL query plans, repeated runs, and SecureNow's separate workload. Thresholds are provisional and must be approved against actual SLOs.
