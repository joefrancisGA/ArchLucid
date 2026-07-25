> **Reviewed:** 2026-07-25

> **Scope:** Commercial SEND gating for ROI baseline completeness (Assessment Improvement 4).

# ROI baseline SEND policy (V1)

**Last reviewed:** 2026-07-25

**Owner decision (2026-06-07):** Commercial **SEND** requires **COMPLETE** baseline completeness unless an approved override artifact is attached.

Machine-readable policy: [`scripts/ci/data/roi_baseline_send_policy.v1.json`](../../scripts/ci/data/roi_baseline_send_policy.v1.json).

## Baseline completeness statuses

| Status | Meaning | SEND allowed? |
| --- | --- | :---: |
| **COMPLETE** | Required baselines are sponsor-safe and non-defaulted | Yes (if other proof gates pass) |
| **PARTIAL** | Weak labels (e.g. `labeled-other`, `stale`) | No — override required |
| **DEFAULTED** | Scorecard/model defaults used | No — override required |
| **NOT_COLLECTED** | Missing, demo-derived, or explicit not-collected | No — override required |

## Minimum fields for SEND (non-defaulted)

These align with [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §2 core metrics:

1. **Review cycle hours (baseline)** — wall-clock hours per review cycle.
2. **Architect hours per review (baseline)** — person-hours per review.
3. **ROI basis source** — `roiBasisStatus` must be one of:
   - `buyer-provided`
   - `uploaded-actual-or-amortized`
   - `azure-retail`
   - `classified`

**Documentation hours (baseline)** is recommended for ARB/annual conversations but **not blocking** for SEND.

When `roiBasisStatus` is in the complete set above, the proof pipeline treats required numeric baselines as collected via scorecard/proof posture (see `collect-first-pilot-proof.ps1`).

## Override authority and template

| Role | May approve override? |
| --- | :---: |
| **executive-owner** | Yes |
| **cfo-delegate** | Yes |
| **sales** / **pilot-operator** | Record only — cannot self-approve |

Place `roi-baseline-send-override.json` in the proof folder next to `go-no-go-summary.json`. Template: [`templates/roi-baseline-send-override.template.json`](templates/roi-baseline-send-override.template.json).

Required override fields:

- `approvedByRole` — `executive-owner` or `cfo-delegate`
- `recordedBy` — `sales` or `pilot-operator`
- `validForRunId` — must match proof `runId` when supplied
- `rationale` — at least 24 characters
- `acceptedRisk` — explicit claim boundary (e.g. no projected dollar ROI until baselines collected)

**Override does not clear:** proof `BLOCK` rows, `DEFERRED_SCOPE`, or procurement HOLD.

## Artifacts

| Artifact | Purpose |
| --- | --- |
| `roi-baseline-send-evaluation.json` | Machine-checked completeness + `sendEligible` |
| `quote-to-proof-readiness.json` | Includes `baselineCompletenessStatus` |
| `commercial-closeout.json` | Includes completeness + overrideApplied |

## Evaluate locally

```powershell
python scripts/ci/evaluate_roi_baseline_send.py `
  --go-no-go-summary artifacts/proof/go-no-go-summary.json `
  --json-out artifacts/proof/roi-baseline-send-evaluation.json `
  --strict-send
```

With override:

```powershell
python scripts/ci/evaluate_roi_baseline_send.py `
  --go-no-go-summary artifacts/proof/go-no-go-summary.json `
  --override-json artifacts/proof/roi-baseline-send-override.json `
  --json-out artifacts/proof/roi-baseline-send-evaluation.json
```

## Related

- [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`ROI_MODEL.md`](ROI_MODEL.md)
- [`QUOTE_TO_PROOF_PACKET.md`](QUOTE_TO_PROOF_PACKET.md#readiness-checklist)
