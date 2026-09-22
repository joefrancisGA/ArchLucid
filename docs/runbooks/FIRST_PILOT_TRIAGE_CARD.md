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
| Create review returns `400` with partial findings | Capture the full response body, then retry with a fresh `requestId` and unique system name; inspect findings/constraints |
| Create review returns `409` conflict | Capture `requestId`, system name, and correlation id; verify the prior request is not being replayed and retry with a unique system name |
| Review detail says “Something went wrong” | Capture the review URL and visible page text before retrying; check API logs for the matching run id |
| Invite Send stays disabled | Capture the settings URL, visible headings, email value, and selected role |
| SCIM token page has no Create token | Confirm the settings URL and `GET /v1/admin/scim/tokens`; a `404` usually means Enterprise tier cache was not refreshed |

Full detail: [`FIRST_PILOT_SUPPORT_TRIAGE.md`](FIRST_PILOT_SUPPORT_TRIAGE.md) · access path: [`private_beta_access_prompt_07152026.md`](../assessments/private_beta_access_prompt_07152026.md)
