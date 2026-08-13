> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Worker rolling deploy — drain / handoff / kill

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (2026-08-10) — **TB-1563** / GTM **M-292**/**M-293**. Pair honesty CI **TB-1564** **Done** (2026-08-12).

**Verdict (one line):** A Worker revision roll is **soft drain (~45s) then kill**, not a live handoff of in-flight work. Durable Worker work (**authority outbox**, durable jobs, other leased loops) **reclaims after lease/stuck expiry** on a peer. Long-running **agent LLM execute is API-sync today** — Worker ZDT does **not** protect it. No product max-run-duration is sized to survive a deploy; the baked-in stop budget is **`HostOptions.ShutdownTimeout = 45s`** (ACA `terminationGracePeriodSeconds` unset in Terraform).

---

## 1. What happens on old revision deactivate

| Step | Behavior |
|------|----------|
| New revision starts | CD `az containerapp update`; new replica polls SQL/queues |
| Old replica SIGTERM | .NET Generic Host → `ApplicationStopping` |
| Cooperative stop | Hosted services cancel; host waits ≤ **45s** (`AddArchLucidGracefulShutdown`) |
| Hard stop | Process abort; ACA grace **not pinned** in TF |
| Peer resume | Lease/`LockedUntilUtc` or stuck-Running watchdog — **delayed reclaim**, not live handoff |

**CD “zero downtime”** = dequeue **capacity** continues — **not** continuity of a single in-flight unit of work.

---

## 2. Machines (do not conflate)

| Machine | Host | On revision kill |
|---------|------|------------------|
| **A — Authority SQL outbox** | Worker | Cancel mid-entry; row stays leased until TTL (default **900s**) → peer reclaim |
| **B — Durable background jobs** | Worker (Durable mode) | Crash leaves `Running`; watchdog resets after **~10 min** |
| **C — Leader-elected loops** | Worker | Release leadership lease (**~90s**); loop ownership handoff only |
| **D — Agent LLM execute** | **API** (request-sync) | **Out of Worker ZDT scope**; stuck/silent-partial without **TB-943** |
| **E — Digests / archival / outboxes** | Worker | Same soft-stop → kill → lease/retry family |

Until **TB-1311** ships async agent execute to Worker, “runs executing on the old Worker revision” usually means **A/B/C/E**, not LLM execute.

---

## 3. Duration assumptions (what is baked in)

| Knob | Value | Meaning |
|------|-------|---------|
| `HostOptions.ShutdownTimeout` | **45s** | Max cooperative drain |
| ACA `terminationGracePeriodSeconds` | **`worker_termination_grace_period_seconds` default 60** (TB-961) | Sized above `HostOptions.ShutdownTimeout` **45s** |
| Authority outbox lease | Default **900s** | Peer reclaim delay after hard kill |
| Background job stuck Running | **~10 min** | Reclaim crashed workers |
| `stale_in_flight_runs` | **> 1 hour** | **Warning only** — does not auto-fail |
| Max review / execute wall-clock | **None** | No deploy-safe product max duration |

---

## 4. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Worker rolling deploy drains in-flight reviews to completion” | ≤45s soft stop, then kill |
| “In-flight runs hand off live to the new revision” | Lease reclaim only — delayed |
| “Zero-downtime Worker = zero interrupted work” | Capacity continuity ≠ work continuity |
| “Worker resumes agent LLM execute after revision kill” | Execute is API-sync; Worker resumes authority outbox |
| “Orphaned AgentTasks always become Failed/Partial on deploy” | Needs **TB-943** |
| “Terraform pins termination grace / ZDT Worker contract” | Unset; image `ignore_changes` |
| “`stale_in_flight_runs` heals stuck runs” | Observability only |
| “Canary protects Worker jobs like API traffic” | Canary is API ingress-weighted |

---

## 5. Related owners

| ID | Role |
|----|------|
| **TB-961** | **Done** — SIGTERM drain gate + lease release + TF grace |
| Open **TB-960** / **TB-962** | Failure-semantics contract / staging kill drill |
| Open **TB-943** / Done **TB-1523** / **M-277** | Execute stuck / crash-recovery map |
| Open **TB-1311** / **M-231** | Async agent execute → Worker |
| Done **TB-1563** / **M-292** | This Worker rolling-deploy claim map |

---

## CI anchors for **TB-1564**

| Anchor | Role |
| --- | --- |
| `scripts/ci/check_worker_rolling_deploy_drain_handoff_honesty.py` | Fail drain-to-completion, live handoff, Worker-resumes-execute, auto-orphan-fail-on-deploy, and TF-pins-grace overclaims |
| `WORKER_ROLLING_DEPLOY_DRAIN_HANDOFF_CLAIM_MAP.md` | Drift guard (this file) |
| `AddArchLucidGracefulShutdown` / `ShutdownTimeout` | ~45s cooperative stop budget |
| `CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md` | Execute vs authority outbox boundary (**TB-1523**) |

Honesty CI shipped: **TB-1564**.

---

## 6. Optional follow-ons (not required to close honesty pin)

1. ~~Ship **TB-961** drain protocol + pin ACA termination grace.~~ **Done** 2026-08-11.  
2. Eagerly clear/shorten authority lease on cooperative cancel.  
3. Align **TB-960** wording with API-sync execute until **TB-1311**.  
4. Staging replica-kill drill (**TB-962**).
