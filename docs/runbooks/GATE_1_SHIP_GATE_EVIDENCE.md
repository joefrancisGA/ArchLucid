> **Scope:** Owner/operator runbook for Gate 1 — one observed end-to-end first review on staging with durable `ship-gate-evidence` artifacts. Engineering validation only; does not substitute for a live staging run.

# Gate 1 — ship-gate evidence runbook

## Goal

Prove one complete first-review loop on staging:

1. Create architecture package (draft → review)
2. Execute analysis
3. Commit / finalize governance outcome
4. Produce sealed review record (manifest) with ≥1 artifact

Record PASS/FAIL evidence via `archlucid pilot ship-gate-evidence`.

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Staging API reachable | `archlucid.json` or `ARCHLUCID_API_BASE_URL` |
| Authorized CLI session | Same tenant/workspace as the staging pilot |
| SQL-backed API | Ship-gate probes load run detail from persistence |
| Completed run id | GUID for a **Committed** run with manifest + artifacts |
| Optional UI origin | `--ui-base-url` or `ARCHLUCID_UI_BASE_URL` for Gate 5 route smoke |

## Command

From repository root (writes artifacts when repo root resolves):

```bash
archlucid pilot ship-gate-evidence \
  --run-id <committed-run-guid> \
  --ui-base-url https://<staging-ui-host>
```

Artifacts (default):

- `artifacts/ship-gate-evidence/<runId>/ship-gate-evidence.json`
- `artifacts/ship-gate-evidence/<runId>/ship-gate-evidence.md`

Stdout-only (no files):

```bash
archlucid pilot ship-gate-evidence --run-id <guid> --no-write-artifacts
```

## Validate artifact shape (CI-safe)

```bash
python3 scripts/ci/assert_ship_gate_evidence_schema.py \
  artifacts/ship-gate-evidence/<runId>/ship-gate-evidence.json
```

Fixture reference: `scripts/ci/fixtures/ship-gate-evidence/pass.example.json`.

## Gate rollup

| Gate | What it checks |
|------|----------------|
| **1** | First review completion signals (committed, manifest, artifacts, provenance) |
| **2** | Citation integrity on representative run |
| **3** | Claim lint (unless `--skip-claim-lint`) |
| **4** | Export matrix (sponsor markdown, DOCX, artifact ZIP) |
| **5** | Operator UI route smoke (when `--ui-base-url` set) |
| **6** | Cross-tenant deny probes |

Overall verdict: **Fail** if any gate fails; **Unknown** if any gate is unknown and none fail.

## Failure triage

| Symptom | Likely cause | Next step |
|---------|--------------|-----------|
| Gate 1 FAIL — not committed | Run still in progress or failed | Re-run execute; check run status in UI |
| Gate 1 FAIL — manifest missing | Commit not finalized | Complete governance approval path |
| Gate 4 FAIL — export | Proxy timeout or missing artifact | See `LONG_RUNNING_OPERATIONS_CONTRACT.md`; use async export paths |
| Gate 5 UNKNOWN | No `--ui-base-url` | Expected for API-only runs; set UI origin for full gate |
| Gate 6 FAIL | Tenant isolation regression | Stop release; file incident |

## Long-running operations

Real-mode execute/commit must use **async** operation polling per `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md`. Do not hold synchronous HTTP on tier C paths past proxy timeouts (~45–60s). UI start-review navigation uses staged progress (`useReviewStartNavigationProgress`) — not a substitute for Gate 1 evidence.

## Attach to release evidence

After a PASS run:

1. Commit or attach `artifacts/ship-gate-evidence/<runId>/` to the release bundle slot `ship-gate-evidence`.
2. Update `docs/go-to-market/CLAIM_READINESS_STATUS.md` Gate 1 evidence link date.
3. Close assessment Gate 1 UNKNOWN in the next assessment pass.

## Related

- `ArchLucid.Cli/Commands/ShipGateEvidenceCommand.cs`
- `scripts/ci/pilot_readiness_bundle_gate_common.py` (bundle slot `ship-gate-evidence`)
- Assessment: `docs/assessments/LATEST_GPT55.md` § Tasks For Human #1
