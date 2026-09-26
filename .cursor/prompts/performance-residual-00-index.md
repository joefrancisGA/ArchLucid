<!-- Performance residual — Luna / Composer prompts. Paste one numbered file per session.
     Origin: 2026-09-26. Easy bundle, cache, and async-wait waves are already shipped.
     These prompts cover the measured leftovers only.
     Do not implement from this index. -->

# Performance residual — Luna / Composer prompt set (PP-01–PP-03)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/performance-residual-0N-*.md` file per session.

Canonical wave doc: [`docs/architecture/PERFORMANCE_RESIDUAL_COMPOSER_PROMPTS.md`](../../docs/architecture/PERFORMANCE_RESIDUAL_COMPOSER_PROMPTS.md).

**Base:** current `master`. Do not branch from an old performance-wave branch.

## What is already shipped — do not redo

Conditional GET, hot-path single-flight, prompt-cache prefix ordering and telemetry, Server GC / Tiered PGO, source-generated JSON, TanStack persistence, Web Worker INP offload, leader election, Critic overlap, tier escalation on quality-gate retry, unified `GET /v1/operations/{operationId}`, Real-mode 202 execute, shell in-flight, run-scoped LLM budget admit inside the agent loop, and the operator-home proxy budget (3–5 GETs). **TB-2302** bootstrap bundling is a **no-go**. Daytime-wait prompts **DW-001–DW-024** already cover perceived wait. Do not re-run them.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Review detail First Load JS** | `/architecture/reviews/[reviewId]` is **4588.8 kB** in `archlucid-ui/performance/first-load-js-baseline.v1.json` (raised 2026-08-22 after growth). Deferred-chunk manifests exist and did not hold that number down. | The route’s initial JS is at least **400 kB** under the number you measure at the start of the session. Tolerance stays **25 kB**. | **PP-01** (Composer 2.5) |
| **Alerts inbox First Load JS** | `/governance/alerts` is **2149.9 kB**. The inbox manifest defers only the context panel and dialogs. | That route’s initial JS is at least **200 kB** under the number you measure at the start of the session. | **PP-02** (Composer 2.5) |
| **Prompt-cache prefix lock** | Agent user prompts have a byte-stable static prefix. Ask checks that the static prefix appears. A new composer can still put a run id first. | If any user-prompt composer emits a run id, tenant id, or timestamp before its static prefix, a unit test fails. If every composer is already locked, stop. | **PP-03** (GPT-5.6 Luna) |

## What this set does not change

Do not raise `min_replicas`, CPU, memory, ReadyToRun, or `PublishTrimmed`. Do not turn on Redis to fix cold start. Do not add API replicas to create Azure OpenAI TPM. Do not add `GET /v1/operator/bootstrap`. Do not invent `GET /v1/runs/{id}/progress`. Do not collapse review workspace tabs into a More menu. Do not move LOB JSON to blob storage. Do not reopen **TB-135** / **TB-136** or GTM **M-90** / **M-44** / **M-91** / **M-92**.

## Run order

**01 and 03 may run in parallel.** **02 after 01**, because both edit `first-load-js-baseline.v1.json`.

Each implementation prompt ends **before commit**. The owner looks, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Model | Branch to create |
|---|------|--------|------------------|
| 01 | `performance-residual-01-review-detail-first-load.md` | Composer 2.5 | `pp/01-review-detail-first-load` |
| 02 | `performance-residual-02-alerts-inbox-first-load.md` | Composer 2.5 | `pp/02-alerts-inbox-first-load` |
| 03 | `performance-residual-03-prompt-cache-prefix-ratchet.md` | GPT-5.6 Luna | `pp/03-prompt-cache-prefix-ratchet` |
