> **Scope:** Contributor reference — Real-mode staged Critic serialisation cost, bulkhead ceilings, and observability (**TB-2121**). Not a buyer SLA.

# Staged Critic wall-time contract

**Status:** Active (V1)  
**Backlog:** **TB-2121** (Done — metrics/docs) · **TB-2140** (Done — overlap + admission) · peers **TB-2075** (async execute) · **TB-915** / **TB-947** (scale vs TPM honesty)  
**Audience:** Performance owners, SRE, agent-runtime engineers  
**Related:** [LONG_RUNNING_OPERATIONS_CONTRACT.md](./LONG_RUNNING_OPERATIONS_CONTRACT.md) · [CONFIGURATION_REFERENCE.md](./CONFIGURATION_REFERENCE.md) · `infra/terraform-container-apps/README.md`

---

## 1. Problem

In Real mode, agent execute wall clock is dominated by Azure OpenAI latency. When `ArchLucid:Agents:StagedCriticEnabled` is **true**, `RealAgentExecutor` runs **all non-Critic agents first**, then runs **Critic** as a second serial phase. That design improves evidence quality but adds roughly **+1× the longest non-Critic agent phase** to total execute time (estimate — measure on staging).

Bulkhead defaults (`AgentExecution:Resilience:MaxConcurrentHandlers` **8**, `PerHandlerTimeoutSeconds` **900**) interact with edge/proxy ceilings (~**60s**) while handlers may run up to **15 minutes**. Async execute siblings (**TB-2075**) prevent the edge from killing Tier C work but do **not** shorten LLM wall clock.

---

## 2. Non-claims

| Do **not** claim | Why |
|------------------|-----|
| More API replicas mint AOAI TPM | TPM/RPM are account-scoped; see **TB-947** checklist and `LAUNCH_LOAD_DRILL.md`. |
| Sync execute is safe through Front Door for Real mode | Use `POST .../execute/async` + `GET /v1/operations/run:{runId}` for Tier C. |
| Staged Critic overlap is enabled | Overlap is **opt-in** via `ArchLucid:Agents:StagedCriticOverlapEnabled` and **blocked** under PilotStrict enforce/block (summary must reach Critic first). |
| `percentComplete` on operations | Use `stepLabel`, `currentStep`/`totalSteps`, `heartbeatUtc` per **TB-2074**. |

---

## 3. Configuration posture (defaults)

| Knob | Default | Role |
|------|---------|------|
| `ArchLucid:Agents:StagedCriticEnabled` | `false` | Enables two-phase batch (non-Critic → Critic). |
| `ArchLucid:Agents:StagedCriticOverlapEnabled` | `false` | When true with staged mode, runs Critic concurrently with phase 1 when quality posture allows (see §7). |
| `ArchLucid:Agents:Phase1MaxConcurrentHandlers` | `0` | Optional phase-1 admission cap during overlap (`0` = reserve one bulkhead slot for Critic). |
| `ArchLucid:Agents:CriticTimeoutSeconds` | `120` | Dedicated wall cap for Critic phase; `0` = use handler bulkhead timeout only. |
| `AgentExecution:Resilience:MaxConcurrentHandlers` | `8` | Process-wide LLM handler bulkhead. |
| `AgentExecution:Resilience:PerHandlerTimeoutSeconds` | `900` | Per-handler Polly timeout ceiling. |

**Critic timeout honesty:** When the dedicated Critic cap fires, execute continues **without** Critic output and records an evidence note (`EvidenceNoteTypes.CriticTimeout`) — not a silent success.

---

## 4. Observability (shipped **TB-2121**)

### Metrics

| Instrument | Labels | Meaning |
|------------|--------|---------|
| `archlucid_agent_execution_staged_critic_phase_duration_ms` | `phase=phase1\|phase2`, `outcome=success` | Wall time per staged batch phase in `RealAgentExecutor`. |

Use p50/p95 on staging Real cohorts to publish measured phase timings (acceptance for **TB-2121**).

### Traces

OpenTelemetry activities `AgentExecution.Phase1` and `AgentExecution.Phase2_Critic` include:

- `archlucid.run_id`
- `archlucid.staged_critic.phase_duration_ms`
- `archlucid.staged_critic.summarized_claims_count` (phase 2)

### Operations poll (`GET /v1/operations/run:{runId}`)

When task rows show serialised staged progress, `stepLabel` uses honest phase copy:

| Inferred posture | `stepLabel` |
|------------------|-------------|
| Non-Critic agents still running | `Phase 1 agents running (before Critic)` |
| Phase 1 complete, Critic not started | `Preparing Critic phase` |
| Critic executing | `Critic phase running` |

When Critic and other agents run **in parallel** (staged mode off), labels fall back to per-agent copy (`{AgentType} agent running`).

---

## 5. Security · scalability · reliability · cost

| Pillar | Notes |
|--------|-------|
| **Security** | No new HTTP surface; operation poll remains tenant-scoped (**TB-2073**). |
| **Scalability** | Serial Critic increases per-run duration; admission/bulkhead limits concurrent LLM calls — scaling replicas does not increase TPM (**TB-947**). |
| **Reliability** | Async execute + operations poll avoids proxy timeout false failures; Critic timeout fails open without blocking commit path. |
| **Cost** | Longer runs consume more AOAI tokens/time; monitor `archlucid_agent_execution_staged_critic_phase_duration_ms` and tenant budgets. |

---

## 6. Overlap decision (**TB-2140**, shipped 2026-08-10)

**Go (opt-in):** Enable `StagedCriticOverlapEnabled` on non–PilotStrict-enforce hosts (e.g. Development, WarnOnly staging) when measured phase-1 and Critic LLM times are similar and wall-clock reduction is worth the trade-off that Critic may start **before** `StagedPriorAgentsSummary` is injected.

**Quality floors (fail-closed):**

| Posture | Overlap |
|---------|---------|
| PilotStrict + `EnforceOnReject` or `BlockRunOnReject` | **Off** — serial staged path; Critic prompt always includes prior-agent summary. |
| WarnOnly / enforce off | **Allowed** when `StagedCriticOverlapEnabled` is true. |

**Behavior when overlap is on:**

1. Phase 1 (non-Critic) and Critic handlers run concurrently (`Task.WhenAll`).
2. Phase 1 uses a tighter admission cap (`Phase1MaxConcurrentHandlers` or `MaxConcurrentHandlers - 1`) to reserve bulkhead capacity for Critic.
3. Prior-agent summary is still injected when phase 1 completes (audit trail); an `StagedCriticOverlapApplied` evidence note records that Critic may have run without that summary in its prompt.
4. Operations poll falls back to per-agent labels when Critic and non-Critic are both in progress (same as unstaged parallel batches).

**Measured target (staging):** Publish Real cohort **p50/p95** from `archlucid_agent_execution_staged_critic_phase_duration_ms` before enabling overlap in production-like PilotStrict hosts. Estimate: up to **~50%** batch wall-time reduction when phase-1 max agent time ≈ Critic LLM time (overlap wall ≈ `max(phase1, phase2)` vs serial `phase1 + phase2`).

**No-go for production PilotStrict:** Keep overlap disabled; residual serial cost remains ~**+1× longest non-Critic agent** when staged mode is on without overlap.

---

## 7. Future evaluation

- TPM-aware bulkhead admission under sustained pressure (**TB-1336** ledger).
