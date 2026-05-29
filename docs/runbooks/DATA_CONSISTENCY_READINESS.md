> **Scope:** Operator handoff checklist for data-consistency probes before a pilot or release.

# Data consistency readiness (release handoff)

**Last reviewed:** 2026-05-28

Run the collector after SQL migrations succeed and before customer handoff:

```powershell
./scripts/collect-data-consistency-readiness.ps1 -BaseUrl https://your-api.example
```

For first-pilot handoff, prefer the combined proof pipeline so data consistency appears beside preflight and committed-run evidence:

```powershell
./scripts/collect-first-pilot-proof.ps1 -BaseUrl https://your-api.example -RunId <committed-run-guid>

First-pilot proof maps collector **HOLD** to **BLOCK** for sponsor handoff when integrity probes (for example `/health/ready` or orphan counts) require stop. See `dataConsistencyProof` in `go-no-go-summary.json` and the **Data consistency proof** section in `go-no-go-summary.md`.
```

## What “healthy” means

| Signal | Healthy | Investigate |
| --- | --- | --- |
| `/health/ready` | 200 with expected SQL checks | Migration failure, wrong connection string |
| `/health/diagnostics` | No unexpected orphan counts | See matrix remediation (dry-run first) |
| Archived runs | Present with `ArchivedUtc` only | Not counted as orphans |

## Dry-run before destructive remediation

Never delete or quarantine from this script. Use admin diagnostics dry-run endpoints documented in [`DATA_CONSISTENCY_MATRIX.md`](../library/DATA_CONSISTENCY_MATRIX.md).

The collector writes `data-consistency-summary.json` with `dataConsistencyStatus` of `PASS`, `WARN`, or `HOLD`. The first-pilot proof pipeline maps skipped collection to `NOT_RUN`.

## Related

- [`DATA_CONSISTENCY_MATRIX.md`](../library/DATA_CONSISTENCY_MATRIX.md)
- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)
