> **Scope:** Operator cookbook — shortest path to a **passing baseline** without optional branches (Improvement #8).

# Minimum viable pilot success lane

This lane minimizes decisions and produces a **committed review package** plus **sponsor-safe proof artifacts**. Optional paths (real AOAI, full RC evidence bundle, custom integrations) come **after** this baseline passes.

## Prerequisites (one-time)

| Step | Command / doc | Pass criterion |
| --- | --- | --- |
| API reachable | `dotnet run --project ArchLucid.Cli -- doctor` | Connected + schema OK |
| SQL configured | `ConnectionStrings:ArchLucid` documented in run notes | `/health/ready` includes database healthy |
| Operator login | [OPERATOR_QUICKSTART.md](customer-facing/OPERATOR_QUICKSTART.md) | Can open operator shell |

## The five-step lane

1. **Create review** — submit one architecture request (`POST /v1/architecture/request` or operator wizard). Capture `runId`.
2. **Execute** — `POST /v1/architecture/run/{runId}/execute` (or UI equivalent) to committable state.
3. **Commit** — finalize golden manifest; confirm `goldenManifestId` on run detail.
4. **Artifacts** — `GET /v1/artifacts/manifests/{manifestId}` returns ≥ 1 descriptor.
5. **Proof packet** — `dotnet run --project ArchLucid.Cli -- pilot proof-packet <runId> --out artifacts/proof-packet/<runId>`; read `sponsor-proof-packet-index.md` and `limitations.md`.

**Time budget:** first-value timing targets PASS ≤ 10 minutes create→commit→artifact per `V1_RELEASE_CHECKLIST.md`.

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
- Differentiator talking points: [../go-to-market/DIFFERENTIATOR_EVIDENCE_MATRIX.md](../go-to-market/DIFFERENTIATOR_EVIDENCE_MATRIX.md)
