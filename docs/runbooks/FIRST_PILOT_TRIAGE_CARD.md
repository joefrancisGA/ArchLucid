> **Scope:** One-page operator card distilled from [`FIRST_PILOT_SUPPORT_TRIAGE.md`](FIRST_PILOT_SUPPORT_TRIAGE.md). Print or pin during private-beta support.

# First-pilot triage card (one page)

## Handles you need

| Handle | Where |
| --- | --- |
| `runId` | Review detail URL or `GET /v1/authority/runs/{runId}` |
| `manifestId` | Run provenance card |
| `correlationId` | API `X-Correlation-ID`, support bundle |

## 15-minute order

1. **Health** — `GET /health/ready`, `GET /version`
2. **Run** — execution mode, governance warnings, commit-blocking coverage
3. **Timeline** — `GET /v1/authority/runs/{runId}/pipeline-timeline`
4. **Audit** — operator Audit UI or `GET /v1/audit/search` (internal CSV only)
5. **Bundle** — `archlucid support-bundle --run-id <runId> --zip` → read `triage-index.md`
6. **Proof** — `go-no-go-summary.json` if proof folder exists
7. **Escalate** — correlation id + run id + PASS/WARN/HOLD + `limitations.md`; **no raw secrets**

## Severity sketch

| Level | When |
| --- | --- |
| **SEV1** | Multi-tenant commit path down or data loss |
| **SEV2** | Single-tenant execute/commit degraded; workaround exists |
| **SEV3** | One-user workflow; no data risk |

## Private-beta quick checks

| Symptom | First check |
| --- | --- |
| Invite expired | `/auth/invite` recovery copy; re-issue invite |
| `/403` after sign-in | Role mapping / tenant scope |
| Blank after deep link | `returnUrl` + session storage |
| Run stuck > N min | Worker queue + `BackgroundJobs` row |

Full detail: [`FIRST_PILOT_SUPPORT_TRIAGE.md`](FIRST_PILOT_SUPPORT_TRIAGE.md) · access path: [`private_beta_access_prompt_07152026.md`](../assessments/private_beta_access_prompt_07152026.md)
