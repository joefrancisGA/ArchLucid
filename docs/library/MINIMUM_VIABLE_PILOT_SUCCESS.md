> **Scope:** Operator cookbook — shortest path to a **passing baseline** without optional branches (Improvement #8).

# Minimum viable pilot success lane

This lane minimizes decisions and produces a **finalized architecture package** plus **sponsor-safe proof artifacts**. Optional paths (real AOAI, full RC evidence bundle, custom integrations) come **after** this baseline passes.

## Prerequisites (one-time)

| Step | Command / doc | Pass criterion |
| --- | --- | --- |
| API reachable | `dotnet run --project ArchLucid.Cli -- doctor` | Connected + schema OK |
| SQL configured | `ConnectionStrings:ArchLucid` documented in run notes | `/health/ready` includes database healthy |
| Architect login | [OPERATOR_QUICKSTART.md](customer-facing/OPERATOR_QUICKSTART.md) | Can open architect workspace |

## The five-step lane (first-time architect — guided intake recommended)

1. **Guided intake** — open `/reviews/new`, use **Guided intake (recommended)**, enter intent/outcome/actors, admit the draft, answer or skip MUST questions, submit to spawn a review. Capture `runId`.
2. **Execute** — `POST /v1/architecture/run/{runId}/execute` (or UI equivalent) to ready-to-finalize state.
3. **Finalize** — finalize architecture package (API: `commit` / golden manifest); confirm `goldenManifestId` on review detail.
4. **Artifacts** — `GET /v1/artifacts/manifests/{manifestId}` returns ≥ 1 descriptor.
5. **Proof packet** — `dotnet run --project ArchLucid.Cli -- pilot proof-packet <runId> --out artifacts/proof-packet/<runId>`; read `sponsor-proof-packet-index.md` and `limitations.md`.

**Expert/API shortcut:** `POST /v1/architecture/request` remains valid when the architect already has a complete brief.

**Time budget:** first-value timing targets PASS ≤ 10 minutes create→finalize→artifact per `V1_RELEASE_CHECKLIST.md`.

## Strict verification (recommended before sponsor handoff)

| Gate | Command | Notes |
| --- | --- | --- |
| Release smoke (RC profile) | `.\scripts\release-smoke-rc.ps1 -ResultOut artifacts/release-smoke/result.json` | Requires SQL + Node; proves live UI↔SQL parity |
| Strict RC evidence | `.\scripts\Invoke-FirstPilotStrictPath.ps1` | Default for release candidates — non-strict is preliminary only |
| Readiness (fast) | `.\scripts\run-readiness-check.ps1` | Use when SQL not wired yet |

## Explicit non-goals for this lane

- Real Azure OpenAI / PilotStrict real-mode evidence (see [FIRST_REAL_VALUE.md](FIRST_REAL_VALUE.md) as a **second** lane).
- Full merge-blocking SQL regression (CI job — not required for first local win).
- Commerce checkout or reference-customer publication.

## When the lane fails

Copy the **`--- FAILURE (triage) ---`** block from the failing script ([PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md#when-you-report-an-issue)) and include `GET /version` + correlation id.

## Related

- V1 scope core path: [V1_SCOPE.md](V1_SCOPE.md) §4
- Differentiator talking points: [../go-to-market/DIFFERENTIATION_PROOF_PACKET.md](../go-to-market/DIFFERENTIATION_PROOF_PACKET.md#deal-cycle-heuristic-matrix)
