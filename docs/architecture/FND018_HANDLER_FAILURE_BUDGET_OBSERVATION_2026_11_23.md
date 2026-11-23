# FND-018 — production handler failure-budget observation (first integration)

**Date:** 2026-11-23  
**Baseline:** `master` at branch creation. **Integration target:** `master`. **Full solution builds:** `RC49` only, by user instruction.

## Production reuse and scope

The reference-only `scripts/integration/fnd018_resilience_controls.py` defines a 60-second failure-budget window, minimum 5 requests, and maximum 5 failures. It is a deterministic Python model; it has not been imported into the production .NET execution pipeline.

Existing production C# execution is `RealAgentExecutorSingleHandlerExecution.ExecuteSingleAsync`, which invokes `RealAgentExecutorHandlerResiliencePipeline.Resolve` for its Polly timeout/circuit-breaker policy and `dependencies.ConcurrencyGate` for bulkhead admission.

This increment **reuses** that execution boundary and the existing `ArchLucidInstrumentation` meter. It does **not** create another circuit breaker, change Polly retry classification, or connect Python to production.

## What is newly wired

- `AgentHandlerFailureBudgetObserver` owns thread-safe fixed windows per handler *dispatch key*. Threshold semantics match FND-018 reference policy: an observation window is exhausted only at **at least 5 attempted handler outcomes and at least 5 failures** in 60 seconds.
- The observer is intentionally memory-bounded to 64 dispatch keys, using oldest-observed eviction. This protects against unbounded custom handler names. Its process-local observation state is **not** a distributed tenant-wide limiter; consistent with the existing process-scoped Polly handler breaker.
- Each successful handler records one `success`; each terminal error or degraded handler-failure outcome **after handler entry** records one `failure` before the degraded-vs-terminal decision; caller-requested cancellation records `cancelled` without changing requests, failures or window state. Pre-handler concurrency/breaker rejection records `not_admitted` without consuming the handler budget. An idempotently skipped handler is not an attempt.
- `ArchLucidInstrumentation.AgentHandlerFailureBudgetObservationsTotal` increments for outcomes; `AgentHandlerFailureBudgetExhaustionsTotal` increments once on each window's first threshold crossing.
- Only the bounded `AgentType` enum is used as a metric label. No tenant IDs, user identifiers, prompt text, custom dispatch keys, run IDs or task IDs are added to the new metrics. The active handler Activity includes current requests/failures/exhausted tags when a sample is counted.

## Critical non-enforcement guarantee

**The failure budget is observation-only.** It does not stop, delay, admit, retry, reject, recover or rewrite a single handler invocation. Even an exhausted budget continues to observe calls. The reference Python policy's `budget_allows` decision is **not wired to admission**. Existing Polly and application behavior are unchanged.

There is no emergency-stop or remediation-execution authorization in this increment. Non-Critic degraded output continues to use the current `ShouldUseDegradedFallback` policy; Critic failures remain terminal, and caller cancellation remains neutral.

## Regression plan

```sh
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --configuration Release \
  --filter 'FullyQualifiedName~AgentHandlerFailureBudgetObserverTests|FullyQualifiedName~AgentRuntimePackageCoverageBatch18Tests'
```

Cover the exact fifth-failure transition, success accounting, neutral cancellation and pre-handler rejection, strict 60-second reset, backward clock safety, concurrent atomic observations, and 64-key memory bound. The admission-rejection regression must prove Polly's open breaker skips the handler delegate while the FND-018 observer keeps its prior failure count. Inspect actual PR CI and focused test output before merging. **Do not run a full solution build against master.** The real end-to-end rate of observed events and any production telemetry trends remain unverified until deployed.

## Next integration gate (not part of this PR)

Evaluate observed failure-budget trends against documented SLOs and decide whether any *future* request-admission policy is justified. Such a change would require a separate approval, per-tenant isolation review, concurrency benchmarks, and adversarial tests. Keep FND-018 recovery state machine reference-only until genuine independent health signals and recovery evidence are available.

## Audit clarification — admission versus a handler attempt (2026-11-23)

On the production single-handler path a rejected invocation may raise before the handler delegate is entered (notably an already-open Polly breaker). The previous broad catch counted such an exception as a handler failure. The focused correction in [PR #7874](https://github.com/joefrancisGA/ArchLucid/pull/7874) tracks whether the delegate was entered, emits a neutral `not_admitted` observation for pre-entry failures, and leaves the handler budget unchanged. A `BrokenCircuitException` originating *inside* an entered handler still counts as a handler failure. Admission rules, degraded fallback and Critic fail-closed behavior are not modified. Validation of this PR remains pending; no master full build was requested or launched.
