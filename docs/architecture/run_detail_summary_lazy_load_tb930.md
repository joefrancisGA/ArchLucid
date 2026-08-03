# TB-930 — Run-detail summary + lazy-load JSON blobs

**Status:** Shipped 2026-07-24  
**Pairs:** [hot_path_json_blob_list_inventory.md](./hot_path_json_blob_list_inventory.md) (**TB-929**)

## Problem

Buyer-polished `/reviews/[runId]` first paint used `GET …/runs/{id}/buyer-summary`, but the server still composed that response from full `GetRunDetailAsync` (findings `PayloadJson` / `FindingsJson`, context/graph/manifest/artifact bodies) and `EnrichAsync` loaded all agent `ResultJson` via `RunDetailQueryService`. The UI then often called fat `getRunDetail` again to hydrate QuickDecision findings.

## What shipped

| Surface | Before | After |
| --- | --- | --- |
| `GET …/buyer-summary` | Full authority run detail + `EnrichAsync` (`ResultJson`) | `GetRunDetailForBuyerSummaryAsync` + coverage findings + `EnrichBuyerSummaryAsync` (agent-type markers only; no `ResultJson`) |
| Findings read | `GetByIdAsync` (payloads) | `GetCoverageProjectionByIdAsync` (metadata + `PolicyRuleId` + engine failures; no `PayloadJson`) |
| Golden manifest | Loaded with artifact bodies | Manifest document only (explainability + trust); artifact bodies still skipped |
| Buyer DTO | Coverage aggregates only | + `findingSummaries` (id/severity/title/policyRuleId/…) |
| UI hydration | Default fat `getRunDetail` | Synthesize QuickDecision from `findingSummaries`; optional slim `getRunSummary` for `goldenManifestId` only |
| Inspect / expand | Finding inspect endpoints | Unchanged — still the fat-payload path |

## Measurement note (how to verify)

On a representative committed run (many findings + agent results):

1. Capture App Insights / SQL duration + response size for `GET /v1/authority/runs/{id}/buyer-summary` before/after deploy.
2. Confirm the request no longer issues `AgentResults` `ResultJson` selects or full `FindingRecords.PayloadJson` reads on the buyer-summary path (SQL profiler / dependency telemetry).
3. Confirm `GET /v1/authority/runs/{id}` (full detail) and finding inspect still return payloads for expand/export.
4. Expect cut in first-byte / deserialize CPU on buyer-summary; commit/LLM latency unchanged.

## TB-2022 follow-on (2026-08-03)

`load-run-detail-page-model.ts` always calls `getBuyerRunDetailSummary` for `/reviews/[runId]` first paint (no env gate). Fat `getRunDetail` remains for inspect/export/failure-retry surfaces only. Guard: `load-run-detail-page-model.first-paint.test.ts`.

## Out of scope (follow-ons)

- Typed scalars from JSON (**TB-931**)
- Blob offload of multi-MB LOBs (**TB-932**, V2)
