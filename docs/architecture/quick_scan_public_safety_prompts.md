# Quick Scan public safety — implementation prompts (rewritten)

> **Scope:** Agent-executable prompts for anonymous Quick Scan cost/abuse safety.  
> **Source:** Owner-pasted OpenAI suggestions (Prompts 2–12), rewritten for ArchLucid conventions and existing AI-usage stack.  
> **Assessment:** [`quick_scan_budget_safety_assessment.md`](quick_scan_budget_safety_assessment.md)  
> **Backlog:** Tech **TB-892**–**TB-902**; GTM **M-109**, **M-110**, **G-QA-05**.  
> **Rule:** Do **not** mark anonymous Quick Scan safe for public exposure until the release gate (**Prompt 12** / **TB-902**) is **GREEN** or deliberately **YELLOW** (sample-only).

---

## How to use these prompts

1. Ship in **numeric order** unless a prompt explicitly allows parallel work.
2. Each prompt is one Cursor agent session (or a tightly scoped PR). Prefer reuse of existing types (`LlmCostEstimationOptions`, `AiBudgetPreCallGuard`, `LlmDailyTenantBudgetTracker`, HotPath Redis, ASP.NET rate limiting) over greenfield platforms.
3. After each prompt: update the assessment’s “controls matrix” section (implemented vs unenforced).
4. **Fail closed** in Production / SaaS whenever anonymous execution is enabled and a required control is missing.
5. Do not weaken production controls to make tests pass.

### Sequencing map

| Prompt | Title | TB | Priority | Blocks public AI? |
|--------|-------|----|----------|-------------------|
| 0 | Sequencing & reuse constraints | — | — | Orientation |
| 1 | Assessment (already done) | — | — | Context |
| 2 | Centralized `QuickScanSafetyOptions` | **TB-892** | P0 | Yes (config gate) |
| 3 | Pricing catalog + pre-exec cost estimate | **TB-893** | P0 | Yes |
| 4 | Atomic global hourly/daily budget reservations | **TB-894** | P0 | **Yes — critical** |
| 5 | Anonymous endpoint + per-request execution bounds | **TB-895** | P0 | Yes |
| 6 | Distributed concurrency + bounded queue | **TB-896** | P0 | Yes |
| 7 | Layered identity rate limits + duplicate abuse | **TB-897** | P1 | Softens abuse; not a spend substitute |
| 8 | Emergency kill switch + fail-closed boot | **TB-898** | P0 | Yes |
| 9 | Telemetry, dashboards, reconciliation, alerts | **TB-899** | P1 | Ops readiness |
| 10 | Sample fallback + public capacity UX | **TB-900** | P0 | Required for YELLOW |
| 11 | Adversarial cost/abuse suite | **TB-901** | P0 | Yes before GREEN |
| 12 | Production-readiness gate (assessment only) | **TB-902** | P0 gate | Decision |

---

## Prompt 0 — Sequencing and reuse constraints (orientation)

**Do not implement product code in this prompt.**

Before coding Prompts 2–11, confirm:

1. Assessment conclusion remains **SAFE TO EXPOSE PUBLICLY: NO** until Prompt 12 says otherwise.
2. Prefer **dedicated** `POST /v1/marketing/quick-scan` (or equivalent) with `[AllowAnonymous]` over extending `ArchitectureQuickScanController` (`ReadAuthority` + proxy bearer). The marketing quote-request controller is the pattern for anonymous + honeypot + rate limit.
3. Reuse, do not fork:
   - `ILlmCostEstimator` / `LlmCostEstimationOptions` (extend catalog; do not invent a second USD math path)
   - `IAiBudgetPreCallGuard` / `AiUsageFeature` (add `QuickScan`)
   - Redis / HotPath coordination if already present for distributed counters
   - Existing ProblemDetails + stable extension codes
4. Monetary types: **`decimal` only**.
5. Global hourly + daily **USD** ceilings are mandatory whenever `AnonymousExecutionEnabled` is true — tenant budgets alone are insufficient.
6. UI must never select the model or supply cost limits.

---

## Prompt 1 — Assessment (completed)

Already produced: [`quick_scan_budget_safety_assessment.md`](quick_scan_budget_safety_assessment.md).

Do not re-run unless implementation has materially changed; then refresh the controls matrix only.

---

## Prompt 2 — Centralized Quick Scan safety configuration

**TB-892** · P0 · Config only; enforcement wires in later prompts.

### Objective

Create one authoritative, strongly typed, validated server-side configuration model for all Quick Scan budget, token, time, concurrency, rate, model, and feature-state limits. Client-supplied limits must never be trusted.

### Deliverables

1. `QuickScanSafetyOptions` (name may match repo section style, e.g. `ArchLucid:QuickScan:Safety` or `QuickScanSafety`) with groups:
   - **Feature state:** `Enabled`, `AnonymousExecutionEnabled`, `SampleFallbackEnabled`, `EmergencyDisabled`, `EmergencyDisabledMessage`
   - **Per-request:** `MaxRequestBodyBytes`, `MaxSystemNameCharacters`, `MaxDescriptionCharacters`, `MaxInputTokens`, `MaxOutputTokens`, `MaxEstimatedCostPerRequest` (**decimal**), `MaxModelCallsPerRequest`, `MaxToolCallsPerRequest`, `MaxRetriesPerModelCall`, `MaxTotalRetriesPerRequest`, `MaxExecutionSeconds`
   - **Concurrency / queue:** `MaxConcurrentAnonymousScans`, `MaxQueuedAnonymousScans`, `QueueWaitTimeoutSeconds`
   - **Identity limits:** session / browser / IP / IP-range hourly + daily
   - **Global request limits:** anonymous hourly + daily request counts
   - **Global budget:** `MaxAnonymousSpendPerHour`, `MaxAnonymousSpendPerDay` (**decimal**), `BudgetReservationTtlMinutes`, `BudgetAccountingGracePercent`
   - **Progressive friction:** scans-before-CAPTCHA, scans-before-sign-in, flags
   - **Models:** allowed IDs, default, fallback allow-list, unit-price caps, reject unapproved selection
   - **Abuse:** duplicate window, burst thresholds
   - **Telemetry / retention:** retain full prompt/response flags, retention days
2. `IValidateOptions<QuickScanSafetyOptions>` — Production/SaaS **fail closed**:
   - If `AnonymousExecutionEnabled`: require non-null positive global hourly + daily spend ceilings, concurrency limit, input/output token limits, approved model list
   - If fallback enabled: require non-empty approved fallback list
   - Reject zero/negative durations and quantities where unsafe
   - `EmergencyDisabled` overrides `Enabled` / anonymous execution
3. Example overlays: Development, Test, **Production-safe-disabled**, **Production-safe-enabled** (deliberately conservative)
4. Unit tests for valid config, missing budgets/tokens/concurrency, invalid money, unsafe anonymous combos, emergency precedence, Production fail-closed
5. Update assessment: which options exist vs which are still unenforced

### Out of scope

Enforcing limits at runtime (Prompts 3–8). Do not enable anonymous execution in Production-safe-enabled until Prompt 12.

---

## Prompt 3 — Authoritative model pricing and request cost estimation

**TB-893** · P0 · Depends on **TB-892**.

### Objective

Before any provider call, estimate a **conservative maximum** cost using an approved pricing catalog and reject if over `MaxEstimatedCostPerRequest` or if pricing/model is unsafe.

### Deliverables

1. Pricing catalog (config and/or DB) entries: internal id, provider, provider model id, input/output/cached-input USD per token unit, effective date, currency, active flag, **approved for anonymous Quick Scan**, max context, max output, source metadata, last verified UTC
2. Narrow reusable service, e.g. `IAnonymousAiCostEstimator` / `IQuickScanCostEstimator`:
   - Estimate input tokens (system + user + orchestration overhead)
   - Reserve max output tokens
   - Include max retries and permitted fallback exposure when enabled
   - Return reserved cost breakdown (base, retry, fallback, final reserved)
3. Reject when: unknown/stale pricing, unapproved model, over per-request budget, over unit-price caps, token estimate unsafe
4. Server selects model; reject/ignore client model override
5. Fallback: only approved list; reserve max fallback cost up front; log fallback; never silent expensive substitution
6. Prefer extending `ILlmCostEstimator` rates rather than duplicating math
7. Tests: known/unknown/stale pricing, token estimation, retry/fallback exposure, decimal precision, override rejection, fail-safe when estimation fails
8. Update assessment + short architecture note (ADR or assessment appendix)

### Hard rule

**Do not call the model provider** when a safe cost estimate cannot be calculated.

---

## Prompt 4 — Atomic global hourly and daily budget reservations

**TB-894** · P0 · **Most important financial control** · Depends on **TB-892**, **TB-893**.

### Objective

No combination of distributed clients, rotating IPs, retries, concurrency, or app instances may push anonymous Quick Scan spend past configured hourly/daily ceilings beyond an explicit accounting grace percent.

### Architecture

Use a **shared atomic store** (preferred: Redis Lua / transactions, or SQL with correct isolation). Reuse existing ArchLucid distributed coordination if equivalent.

**Forbidden:** process memory, per-instance counters, browser state, eventually consistent read-then-write without reservation.

### Required flow

**Before provider:**

1. Compute conservative max cost (Prompt 3).
2. Atomically reserve against **both** hourly and daily buckets in one operation.
3. Reject if either would exceed.
4. Persist reservation: id, request/idempotency id, estimated max, hour/day UTC buckets, created/expiry, status.

**After provider:**

5. Commit actual cost from provider usage when available.
6. Release unused reservation.
7. Record estimate vs actual variance.

**Failure / cancel / abandon:**

8. Release safely when no provider cost incurred.
9. Reconcile partial costs if execution began.
10. TTL expiry + reconciliation; never release while provider may still bill.

### Hard requirements

- Same atomic op for hour + day
- Shared across instances
- Idempotent by request/idempotency key
- UTC bucket boundaries
- Currency on usage records
- Shared-store outage → **reject** (fail closed)
- `EmergencyDisabled` checked before reservation
- No full prompts in budget records
- Reservation IDs in logs/telemetry

### UX

Stable code `QUICK_SCAN_DEMO_CAPACITY_REACHED`. UI: “Quick Scan has reached its demonstration capacity for now.” Offer sample / sign-in / request demo. Do not expose dollar limits or provider quota errors.

### Ops

Internal metrics: configured vs reserved vs actual hourly/daily, active/expired reservations, reconciliation adjustments, rejections.

### Tests (blocking)

Unit + integration + **multi-worker concurrency stress** proving accepted reservations never exceed ceiling. Include store outage, UTC hour/day rollover, idempotency, commit/release, grace percent.

**Do not mark Done without a concurrency test that proves atomic behavior.**

---

## Prompt 5 — Anonymous endpoint + per-request execution bounds

**TB-895** · P0 · Depends on **TB-892**–**TB-894**.

### Objective

Introduce a true anonymous marketing Quick Scan path and enforce hard per-request bounds so one accepted request has predictable max cost and duration.

### Deliverables

1. **New** anonymous API route (preferred): `POST /v1/marketing/quick-scan` with `[AllowAnonymous]`, dedicated rate policy, no shared `ARCHLUCID_PROXY_BEARER_TOKEN` requirement for this path. Keep or deprecate authenticated `/v1/architecture/quick-scan` for signed-in use only — document choice.
2. Wire UI `/quick-scan` to the anonymous route (not privileged proxy auth).
3. Enforce from `QuickScanSafetyOptions`:
   - Body size before heavy deserialize where practical; system name / description char limits; normalize; reject nested/oversized JSON
   - Token estimate ≤ `MaxInputTokens`; provider + ArchLucid `MaxOutputTokens` (never `maxTokens: null`)
   - Count every provider call (including fallback) ≤ `MaxModelCallsPerRequest`
   - Tools: default **zero** for Quick Scan; no repo/integration/evidence/web tools unless explicitly approved
   - Retries: per-call + total; no retry on validation/budget; respect cancellation/deadline; include in reservation
   - Overall + provider + queue timeouts; cancel downstream; no expensive work after request ends
4. Orchestration bounds: no autonomous loops, recursive agents, dynamic tier escalation, unapproved fallback
5. Capture actual usage; reconcile vs reservation
6. Stable error codes; preserve form data in UI; no auto-resubmit
7. Set `AmbientAiUsageFeatureScope` to **`AiUsageFeature.QuickScan`** (add enum value)
8. Tests for all bounds + cancellation + override rejection + reservation cleanup
9. Update assessment with proven max calls, tokens, retries, seconds, estimated USD per request

---

## Prompt 6 — Distributed concurrency limits and bounded queue

**TB-896** · P0 · Depends on **TB-894**, **TB-895**.

### Objective

Bursts must not create uncontrolled simultaneous model calls or rapid cost spikes.

### Deliverables

1. Distributed `MaxConcurrentAnonymousScans` with lease acquire/renew/release/expire (not in-process-only semaphore)
2. Bounded queue: `MaxQueuedAnonymousScans`, `QueueWaitTimeoutSeconds`; reject when full
3. Documented safe sequence (preferred):
   - Cheap validation + identity checks
   - Cost estimate
   - Enter bounded queue
   - Acquire concurrency lease
   - Reserve budget **immediately before** provider execution
4. Queueing must not bypass global request or identity limits
5. Cancel: dequeue; do not start after cancel; do not hold budget for abandoned queue entries
6. Codes: `QUICK_SCAN_BUSY`, `QUICK_SCAN_QUEUE_FULL`, `QUICK_SCAN_QUEUE_TIMEOUT`
7. Calm capacity UX + sample offer
8. Metrics: active scans, slots, queue depth/wait, rejections, lease expirations, abandoned
9. **Multi-instance** load tests proving concurrency and queue bounds

Do not mark production-ready from single-instance tests alone.

---

## Prompt 7 — Layered identity rate limiting and duplicate-abuse detection

**TB-897** · P1 · Depends on **TB-895**; **does not replace TB-894**.

### Objective

Reduce automated abuse without claiming IP throttling is financial safety. Global spend ceilings remain authoritative for money.

### Deliverables

1. Layered identity signals (privacy-minimized): anonymous session, signed browser id, IP, normalized IP range, auth user/email when present, CAPTCHA state, UA risk, request + payload similarity fingerprints
2. Distributed counters for session/browser/IP/IP-range/global request hourly+daily limits
3. Duplicate / near-duplicate / burst detection via normalized hashes (not raw prompts)
4. Progressive friction: anonymous → CAPTCHA → sign-in/verified email → reject until reset
5. Trusted-proxy-only `X-Forwarded-For`; safe IPv4/IPv6 normalization; tamper-resistant browser ids
6. Codes: `QUICK_SCAN_RATE_LIMITED`, `QUICK_SCAN_CAPTCHA_REQUIRED`, `QUICK_SCAN_SIGN_IN_REQUIRED`, `QUICK_SCAN_DUPLICATE_LIMIT`, `QUICK_SCAN_SUSPICIOUS_ACTIVITY`
7. Calm UX copy; do not publish exact thresholds
8. Tests for each layer + multi-instance + no raw-prompt leakage
9. Assessment update: explicitly “abuse controls ≠ spend ceiling”

Reuse Cloudflare Turnstile patterns from email OTP where CAPTCHA is required.

---

## Prompt 8 — Emergency kill switch and production fail-closed behavior

**TB-898** · P0 · Depends on **TB-892**; integrate with **TB-894**–**TB-896**.

### Objective

Authorized operators stop all **new** anonymous AI executions within seconds without redeploying.

### Deliverables

1. States: Enabled / Disabled / Emergency disabled / Sample-only
2. Emergency overrides flags, routes, caches, UI state
3. Check before queue, lease, reservation, and immediately before provider
4. In-flight: configurable finish-vs-cancel; default safer; document
5. Admin mutation path (or existing remote config) with strong auth, audit (actor, timestamps, previous/new, reason)
6. Short cache + invalidation; fail closed if state unreadable
7. UI: no AI submit in emergency/sample-only; static sample path; no polling storm
8. Startup: invalid Production safety config → disable anonymous AI, keep sample, critical alert
9. Tests for override, cache, multi-instance, authz, fail-closed, sample-only zero provider calls
10. Runbook: `docs/operations/quick-scan-emergency-shutdown.md`

---

## Prompt 9 — Cost telemetry, dashboards, reconciliation, and alerts

**TB-899** · P1 · Depends on **TB-894**, **TB-895**.

### Objective

Near-real-time operator visibility into volume, reserved vs actual spend, models, anomalies, and reconciliation health.

### Deliverables

1. Quick Scan usage record fields (request/reservation ids, safe identity hashes, timings, status, models, tokens, costs, retries, fallback, CAPTCHA/sign-in state) — **no** full prompts/responses unless governed retention explicitly on
2. Metrics: volume, financial, safety, abuse families listed in source Prompt 9
3. Internal admin dashboard (authorized only): feature/kill state, hourly/daily spend vs ceiling, reserved vs actual, queue, models, reconciliation, last pricing verification
4. Alerts: Critical / High / Medium thresholds per source Prompt 9
5. Scheduled reconciliation job with auditable summary
6. Tests for completeness, no raw prompt logging, authz, alerts, reconciliation edge cases
7. Runbook: `docs/operations/quick-scan-budget-monitoring.md`

---

## Prompt 10 — Safe sample fallback and public capacity states

**TB-900** · P0 for public/YELLOW · Depends on **TB-892**, **TB-898**; pairs with GTM **M-109**.

### Objective

Demonstrate product value when anonymous AI is off, limited, or unavailable — **zero** runtime provider calls in sample mode.

### Deliverables

1. ≥1 high-quality precomputed sample architecture analysis (clearly labeled; never presented as analysis of the visitor’s submission)
2. Available when: anonymous disabled, kill switch, hourly/daily budget exhausted, queue full, provider unavailable, invalid safety config
3. Public states with plain language + sample/sign-in/demo CTAs:
   - Available / Verification required / Anonymous limit / Busy / Demonstration capacity / Sample-only / Temporarily unavailable
4. No automatic retry of rejected AI requests
5. Sample content covers summary, positives, risks, missing controls, reliability/security/cost/ops, prioritized next steps, “full review is more extensive”
6. Conversion tracking: sample viewed, source state, sign-in / demo / workspace conversion
7. Tests: zero provider calls; budget/kill/queue → sample; no user content injection into sample; labeling; no auto-resubmit

---

## Prompt 11 — Adversarial security, abuse, and cost testing

**TB-901** · P0 · Depends on **TB-894**–**TB-898**, **TB-900**.

### Objective

Attempt to defeat every implemented budget, rate, token, concurrency, idempotency, and kill-switch control. Do not weaken production controls to pass.

### Scenarios

Cover floods, duplicate submission, concurrency races, token attacks, retry amplification, model escalation, budget-store failure, kill-switch attacks, proxy/identity forgery, privacy leakage — as in source Prompt 11.

### Success criteria

- Accepted reservations never exceed hourly/daily ceilings
- Concurrency and queue never exceed maxima
- Single request cannot exceed call/token/retry/time budget
- Shared-store failure / unknown pricing / unapproved model block execution
- Emergency disable blocks new provider calls
- Duplicates do not double-reserve
- Sample-only = zero runtime AI
- No unbounded spending path

### Output

`.local/owner/quick_scan_adversarial_test_report.md` — scenarios, results, proven/failed controls, residual risk, reproduction, release-blocking failures.

---

## Prompt 12 — Final production-readiness gate (assessment only)

**TB-902** · P0 gate · **Do not fix failures in this prompt.**

### Objective

Evidence-based release recommendation using implementation, config, infra, dashboards, tests, runbooks, and adversarial report.

### Method

Mark each criterion **PROVEN / PARTIALLY PROVEN / NOT PROVEN / NOT APPLICABLE** with exact evidence for PROVEN.

Cover financial safety, traffic/abuse, execution safety, operations, privacy, testing matrices from source Prompt 12.

### Output

`.local/owner/quick_scan_public_release_gate.md` with:

- Sponsor conclusion
- Full evidence matrix
- Remaining weaknesses
- Maximum proven hourly / daily / per-request loss
- Residual risk
- Required remediation
- Exactly one decision:
  - **GREEN** — SAFE FOR CONTROLLED PUBLIC RELEASE
  - **YELLOW** — SAMPLE-ONLY PUBLIC RELEASE
  - **RED** — DO NOT EXPOSE PUBLICLY

### Forced RED or YELLOW

If any of these are not **PROVEN**: atomic global hourly spend, atomic global daily spend, per-request token+cost bound, distributed concurrency, emergency kill switch, fail-closed shared-store, approved-model enforcement, sample fallback, adversarial concurrency test.

Do not award GREEN from design intent or docs alone.

---

## Rewrites vs original OpenAI prompts (summary)

| Change | Why |
|--------|-----|
| Added Prompt 0 reuse constraints | ArchLucid already has cost/budget/rate primitives — avoid parallel platforms |
| Folded anonymous endpoint into Prompt 5 | Assessment’s critical gap (proxy bearer + `ReadAuthority`) must ship with bounds |
| Explicit TB / GTM IDs | Trackable in `TECH_BACKLOG.md` / `GTM_BACKLOG.md` |
| Prefer Redis/SQL already in stack | Aligns with HotPath / tenant budget patterns |
| Turnstile reuse | Existing email-OTP bot challenge |
| `AiUsageFeature.QuickScan` | Fixes default `ReviewAnalysis` mis-attribution |
| Sample fallback as P0 for YELLOW | Matches assessment release posture |
| Shorter agent-facing acceptance | Originals were excellent but too long for one session |

---

## Related files (current baseline)

| Path | Role |
|------|------|
| `archlucid-ui/src/app/(marketing)/quick-scan/QuickScanClient.tsx` | Marketing UI |
| `archlucid-ui/src/app/api/proxy/[...path]/route.ts` | BFF (privileged today) |
| `ArchLucid.Api/Controllers/Authority/ArchitectureQuickScanController.cs` | Authenticated quick scan |
| `ArchLucid.Api/Controllers/Marketing/MarketingPricingQuoteRequestController.cs` | Anonymous marketing pattern |
| `ArchLucid.AgentRuntime/QuickScan/QuickScanService.cs` | Single LLM pass |
| `ArchLucid.Application/AiUsage/AiBudgetPreCallGuard.cs` | Pre-call budget gate |
| `ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs` | Token metering |
| `quick_scan_budget_safety_assessment.md` | Safety assessment (this folder) |
