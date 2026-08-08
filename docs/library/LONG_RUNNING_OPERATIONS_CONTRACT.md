> **Scope:** Contributor-reference — long-running operations latency tiers and operation inventory (TB-2072); not a buyer SLA and not OpenAPI itself.

# Long-running operations — latency-tier contract

**Status:** Active (V1)  
**Backlog:** **TB-2072** (this contract) · **TB-2073**–**TB-2079** (prerequisites, unified operations API, async execute, cancel, shell activity, Tier B wait UX, latency-tier CI)  
**Audience:** Principal architects, API integrators, UI agents  
**Related:** [API_CONTRACTS.md](./API_CONTRACTS.md) · [API_PERFORMANCE_TARGETS.md](./API_PERFORMANCE_TARGETS.md) · [API_SLOS.md](./API_SLOS.md) · [FIRST_REAL_VALUE.md](./FIRST_REAL_VALUE.md) · [archlucid-ui/AGENTS.md](../../archlucid-ui/AGENTS.md)

---

## 1. Purpose

Give operators and integrators one **source of truth** for:

1. Which HTTP endpoints may **block** the request until work finishes.
2. Which endpoints must return **202 Accepted** + an operation handle (or keep a sync sibling for Simulator/CI only).
3. What **progress** fields mean — and which progress URLs **do not exist**.

Without this contract, UI spinners and sync HTTP holds diverge from production Real-mode behavior (multi-minute agent execute vs ~60s edge/proxy ceilings).

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| `GET /v1/runs/{runId}/progress` exists | Documented historically; **not** implemented. Use **TB-2074** `GET /v1/operations/{operationId}` + authority/run SSE where shipped. |
| Sync `POST .../execute` is safe behind Front Door for Real mode | Handler timeout can be minutes (`PerHandlerTimeoutSeconds` up to ~900s) while proxy/RSC ceilings are far lower (~45–60s). |
| `percentComplete` on the wire is authoritative | Prefer discrete `state`, `stepLabel`, `currentStep`/`totalSteps`, `heartbeatUtc` (**TB-2074**). Do not invent fake percentages. |
| Job GUID obscurity = tenant isolation | Poll endpoints must enforce tenant/workspace scope (**TB-2073**). |

---

## 3. Latency tiers

| Tier | Name | Client expectation | Typical wall-clock | HTTP pattern |
|------|------|--------------------|--------------------|--------------|
| **A** | Interactive | UI stays snappy; spinner optional | **&lt; 2s** p95 (CI/read hot paths often tighter — see [API_PERFORMANCE_TARGETS.md](./API_PERFORMANCE_TARGETS.md)) | Synchronous **200/4xx** |
| **B** | Extended sync | Staged wait UX allowed; still one HTTP round-trip | **~2–30s** | Synchronous **200/4xx**; UI uses staged wait / `loading.tsx` (**TB-2078**) |
| **C** | Async-required | Must not hold the edge connection for the full job | **&gt; ~30s** or unbounded agent/LLM work | Prefer **202** + `Location: /v1/operations/{id}` (**TB-2075**); keep sync routes for Simulator/CI only |
| **D** | Background / outbox | No user HTTP wait; progress via job/operation poll or SSE | Minutes–hours | Enqueue + poll `GET /v1/jobs/{id}` today; migrate toward **TB-2074** operations |

**Edge ceiling reminder (detail in TB-2073):** UI RSC fetch (~45s), `PROXY_UPSTREAM_FETCH_TIMEOUT_MS` (~60s), and Front Door / App Service origin timeouts sit **below** long Real-mode execute. Tier C work must not rely on a single sync HTTP hold through that stack.

---

## 4. Operation inventory (V1 SoT)

Update this table when routes change. Tiers are **product contract**, not k6 tag names.

| Surface | Route / channel | Tier | Progress today | Target (sibling TB) |
|---------|-----------------|------|----------------|---------------------|
| Health live/ready | `GET /health/live`, `GET /health/ready` | A | N/A | Keep sync |
| List / get run | `GET /v1/architecture/reviews`, `GET /v1/architecture/review/{runId}` | A–B | Run DTO flags | Keep sync |
| Create request | `POST /v1/architecture/request` | B–C | Run created | Sync OK for Simulator; Real may stay sync if fast path |
| Execute (sync) | `POST /v1/architecture/review/{runId}/execute` | C in Real | Blocks until agents complete | Keep for Simulator/CI |
| Execute (async) | `POST /v1/architecture/review/{runId}/execute/async` | C | **202** + `Location: /v1/operations/run:{runId}` | **Done** (**TB-2075** 2026-08-08) |
| Finalize / commit | `POST .../finalize` (and commit aliases) | B–C | Run status | Prefer sync when short; watch edge ceilings |
| Replay (sync) | `POST` replay / validate paths | C in Real | Blocks | Keep for Simulator/CI |
| Replay (async) | `POST /v1/architecture/review/{runId}/replay/async` | C | **202** + `Location: /v1/operations/run:{replayRunId}` | **Done** (**TB-2075** 2026-08-08) |
| Compare | `POST` compare / insights compare | B–C | Comparison record | Sync when bounded; async if Real regenerate is long |
| Export / DOCX / PDF jobs | Background job enqueue + `GET /v1/jobs/{jobId}` | D | `BackgroundJobInfo` state | Project into **TB-2074** operations |
| Outbox drains (retrieval, export blob, projections) | Worker / hosted services | D | Metrics / admin health | Not user-facing HTTP |
| Authority SSE / run events | Existing SSE where shipped | — | Event stream | Complements operations poll (**TB-2077**) |
| **Missing** run progress | ~~`GET /v1/runs/{runId}/progress`~~ | — | **Does not exist** | Do **not** implement under that path; use `/v1/operations/{id}` |

### Unified operation DTO (TB-2074 — shipped)

Operation ids use opaque prefixed handles: `job:{jobId}` for background exports and `run:{runId}` for architecture review pipeline state.

Minimum fields (no `percentComplete` on the wire):

| Field | Meaning |
|-------|---------|
| `operationId` | Opaque id (tenant-scoped) |
| `state` | e.g. `Pending` / `Running` / `Succeeded` / `Failed` / `Canceled` |
| `stepLabel` | Human-readable current stage |
| `currentStep` / `totalSteps` | Optional discrete progress |
| `heartbeatUtc` | Last liveness signal |
| `resultRef` | Optional link to runId / jobId / download |

---

## 5. Security

| Concern | Contract rule |
|---------|---------------|
| Tenant scope | Every poll (`/v1/jobs/{id}`, `/v1/operations/{id}`) must authorize by tenant/workspace — not GUID secrecy (**TB-2073** / **TB-2074**). |
| Cancel | `POST /v1/operations/{id}/cancel` cooperative and audited (**TB-2076** **Done** 2026-08-08). |
| Cross-tenant probe | Integration tests must reject foreign operation/job ids. |
| Cost control | Abandoned Real-mode executes should be cancelable; do not leave unbounded AOAI spend without heartbeat/cancel. |

---

## 6. Scalability / reliability / cost

| Dimension | Notes |
|-----------|-------|
| Scalability | Async Tier C reduces connection pile-up at the edge; workers absorb Real-mode fan-out. |
| Reliability | Sync Tier C through a 60s proxy produces false client failures and duplicate resubmits — prefer 202 + idempotent accept. |
| Cost | Operation state should reuse run/job rows in V1 (adapter) unless a third store is required (**TB-2074**). |
| CI | Latency-tier gate per endpoint family is **TB-2079** (after this contract). |

---

## 7. Implementation order

| Order | ID | Deliverable |
|------:|----|-------------|
| 1 | **TB-2072** | This contract (done when merged) |
| 2 | **TB-2073** | Timeout ceiling matrix + job poll tenant audit (**Done** 2026-08-07) |
| 3 | **TB-2074** | `GET /v1/operations/{operationId}` (**Done** 2026-08-07) |
| 4 | **TB-2075** | Async execute/replay 202 + `Location` (**Done** 2026-08-08) |
| 5 | **TB-2076** | Cancel (**Done** 2026-08-08) |
| 6 | **TB-2077** | Shell in-flight operations affordance (**Done** 2026-08-08) |
| 7 | **TB-2078** | Tier B staged wait UX + `loading.tsx` sweep |
| 8 | **TB-2079** | API latency-tier CI gate |

---

## 8. UI agent notes

- Do **not** invent a `/v1/runs/{id}/progress` client.
- Tier B surfaces should use staged wait / route `loading.tsx` (**TB-2078**), not infinite silent spinners.
- Tier C Real-mode execute/replay should poll operations (**TB-2074**) or existing job URLs; shell activity (**TB-2077**) tracks `Location` handles after async accept.
- Product language: prefer *architecture review* / *export* over *job* in buyer chrome; *job* remains OK on admin/diagnostic surfaces.

---

## 9. HTTP timeout ceiling matrix (TB-2073)

Documented stack limits that sit **below** long Real-mode handler work. Values are **deployed-contract references**, not buyer SLAs.

| Layer | Setting / constant | Typical ceiling | Notes |
|-------|-------------------|-------------------|-------|
| Next.js RSC / server loaders | `SERVER_UPSTREAM_FETCH_TIMEOUT_MS` | **45s** | `archlucid-ui/src/lib/server-fetch-timeouts.ts` |
| UI API proxy (JSON) | `PROXY_UPSTREAM_FETCH_TIMEOUT_MS` | **60s** | `archlucid-ui/src/app/api/proxy/[...path]/route.ts` |
| UI API proxy (multipart upload) | `PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS` | **10 min** | Large evidence uploads only |
| Azure Front Door Standard origin | `origin_response_timeout` (platform default) | **60s** when unset | This repo's `infra/terraform-edge/` does **not** override origin response timeout — treat **60s** as the edge default until explicitly configured |
| App Service / Container Apps origin | Platform / ingress defaults | **~230s** (varies by SKU) | Still below multi-minute Real-mode execute |
| Agent handler outer timeout | `AgentExecution:Resilience:PerHandlerTimeoutSeconds` | **900s** default | `ConfigurationKeyCatalog` / appsettings |

**Implication:** Tier C Real-mode `POST .../execute` and replay must not rely on a single sync HTTP round-trip through the UI proxy or Front Door without **202 + operation poll** (**TB-2075** / **TB-2074**).

### Job poll tenant scope (TB-2073)

`GET /v1/jobs/{jobId}` and `GET /v1/jobs/{jobId}/file` enforce tenant/workspace scope via `IBackgroundJobTenantAccessVerifier` (work-unit resolution + scoped run lookup). Cross-tenant probes receive **404** (not 403) to avoid job-id existence leaks.
