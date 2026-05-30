# First value in 20 minutes (operator)

> **Scope:** Shortest path from zero to a sponsor-safe artifact. **Depth docs:** [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) (canonical checklist).

**Mode expectation:** Steps below work in **simulator** mode without Azure OpenAI credentials. Label outputs **Simulator** unless you configured real-mode and collected live LLM evidence.

## Prerequisites (5 min)

1. API reachable (`GET /health/live` returns 200).
2. SQL persistence configured (or approved in-memory demo only — not for sponsor handoff).
3. `archlucid.json` in working directory with `apiBaseUrl` and auth (API key or scope headers).
4. Optional: `ARCHLUCID_API_KEY` in environment.

## Path (15 min)

| Step | Action | Expected output |
| --- | --- | --- |
| 1 | `dotnet run --project ArchLucid.Cli -- doctor` | Connection OK; auth mode summarized |
| 2 | Create + execute + commit one review (UI **Home** checklist or CLI `archlucid run` → execute → commit) | Committed run id |
| 3 | `dotnet run --project ArchLucid.Cli -- pilot proof-packet <runId> --out artifacts/proof-packet/<runId>` | Folder: `proof-summary.md`, `run-evidence.json`, `audit-sample.json`, `artifact-manifest.json`, `environment.json`, `limitations.md` |
| 4 | Review `proof-summary.md` **Sponsor first-page status** block | Evidence source, quality disposition, ROI basis, next action |
| 5 | Optional sponsor ZIP: `dotnet run --project ArchLucid.Cli -- buyer-proof-pack <runId> --out artifacts/buyer-proof.zip` | Email-sized ZIP for executives |

## Failure triage (stop here — do not skip)

| Symptom | Next step |
| --- | --- |
| SQL / ready failures | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) → health/ready |
| Auth 401/403 | [`PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST.md`](PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST.md) |
| Quality gate rejected | API `supportHint` + [`QUALITY_GATE_REJECTION.md`](QUALITY_GATE_REJECTION.md) |
| No artifacts after commit | Re-run execute; confirm committed status before proof packet |
| LLM budget / quota | [`../library/OPERATIONS_LLM_QUOTA.md`](../library/OPERATIONS_LLM_QUOTA.md) |

## After this path

- Full environment proof: `./scripts/collect-first-pilot-proof.ps1 -BaseUrl <url> -RunId <runId>`
- Support bundle: `dotnet run --project ArchLucid.Cli -- support-bundle --run-id <runId> --zip`
- Depth: [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md)
