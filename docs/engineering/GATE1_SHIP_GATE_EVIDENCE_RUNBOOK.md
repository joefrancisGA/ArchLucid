> **Scope:** Owner-runbook for V1 ship Gate 1 — first review end-to-end with a bound inventory snapshot. Composer documents the path; **only the owner can supply a real staging `--run-id`.**

# Gate 1 — ship-gate evidence runbook (V12-04)

**Gate:** First review completes create → execute → commit → manifest + ≥1 artifact.  
**CLI:** `archlucid pilot ship-gate-evidence --run-id <guid>`  
**Status today:** **UNKNOWN** until one observed staging run completes with bind (see v12 assessment).

Two-pack compare (CIS-Azure vs SOC 2) is **G-REAL-06**, not Gate 1.

## Prerequisites

| Item | Notes |
|------|-------|
| Staging tenant + workspace scope | Same scope the pilot will use |
| API reachable from CLI | `ARCHLUCID_API_BASE_URL` or `archlucid.json` apiUrl |
| Operator UI (optional Gate 5) | `--ui-base-url` or `ARCHLUCID_UI_BASE_URL` |
| Bound inventory snapshot | Attach on architecture desk **before** execute (AS-050) |
| Career door (recommended) | Real or blocked Career path — not unlabeled Rehearsal Ready |

## Owner steps (happy path)

1. **Create or open an architecture** with a submitted draft (intake → admit → submit or Working desk path).

2. **Attach an inventory snapshot** on the architecture identity desk (`PATCH /v1/architectures/{id}/inventory-binding`). Confirm freshness row if bound (AS-052).

3. **Start and complete a first review:** create run → execute → commit → sealed manifest. Confirm at least one export artifact exists on the run.

4. **Copy the run id** (`guid`) from the review detail URL or API.

5. **Run ship-gate evidence:**

```bash
archlucid pilot ship-gate-evidence \
  --run-id <run-guid> \
  --ui-base-url https://<staging-ui-host>
```

6. **Archive artifacts** (default on when repo root resolves): `artifacts/ship-gate-evidence/{runId}/ship-gate-evidence.json` and `.md` (TB-418).

7. **Record outcome** in GTM proof ledger when Gate 1 is PASS — do not mark PASS from structural probes alone without the live run above.

## What Gate 1 checks (mechanism)

`ShipGateEvidenceRunner.BuildGate1Async` evaluates bundled `first_review_completion_contract.v1.json` signals against run detail + live probes. With a valid `--run-id`, Gate 1 becomes **PASS** or **FAIL** (not UNKNOWN) when run detail loads.

Bind changes execute output — the representative run **must** include ObservedFact merge (AS-050) or Gate 1 proof understates production behavior.

## Fastest resolution paths

| Symptom | Action |
|---------|--------|
| Gate 1 UNKNOWN | Missing or invalid `--run-id`; rerun after a completed review |
| Gate 1 FAIL on completion signals | Finish create → execute → commit; verify manifest + artifact rows |
| API connection errors | Fix `apiUrl` / bearer token; confirm `/v1/architecture/review/{runId}` returns 200 |
| Gate 5 UNKNOWN | Add `--ui-base-url` or accept UNKNOWN for API-only evidence runs |

## Explicit non-goals

- Do **not** flip host `AgentExecution:Mode` to Real (G-REAL-06).
- Do **not** treat green OpenAPI fail-fast or green typecheck as Gate 1 PASS.
- Do **not** substitute synthetic run ids or factory-only manifests for owner proof rows.

## References

- `ArchLucid.Cli/Commands/ShipGateEvidenceRunner.Gates1To3.cs`
- `docs/assessments/LATEST_GPT55-v12-post-wave22.md` §4
- `docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md` (separate JwtBearer Playwright lane)
