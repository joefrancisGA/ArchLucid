> **Scope:** For architecture maintainers, record the verified adoption status of existing controls; this ledger is not proof that reference-only controls are enforced in production.

# Architectural control reuse audit ledger

**Initiated:** 2026-11-22. **Scope:** existing architecture controls, audited one at a time. Do not introduce new control families until this audit establishes usage and duplication evidence.

| Control | Status | Evidence reviewed | Preliminary finding | Next action |
| --- | --- | --- | --- | --- |
| FND-018 bounded retries / circuit breaker / failure budget | Merged reference; production reuse audit ongoing | PR #7779 merged; `scripts/integration/fnd018_resilience_controls.py` and Python reference tests on master; existing C# `CircuitBreakerGate` / Polly implementations | Reference Python controls are present, but no C# production call-site adoption of the Python policy is demonstrated. Do not mistake reference integration for runtime wiring. | Reconcile retry, breaker and failure-budget semantics against C# consumers; retain existing C# controls unless a specific reuse defect is confirmed |
| FND-018 failure containment | Merged reference; production integration unverified | PR #7778 merged; `scripts/integration/fnd018_failure_containment.py` and reference workflow on master | Reference-only containment state machine; no production execution gate established | Audit separately before connecting to runtime |
| FND-017 conformance | Roslyn and Python components merged; narrow enforcement proposed | PRs #7766–#7776 merged; `ArchLucid.Core.csproj` references Roslyn analyzer; `.github/workflows/fnd017-dotnet-semantic-boundaries.yml` tests analyzers | FND017001 is scoped for error-level enforcement on Core in this audit PR; FND017002–005 remain advisory pending mode-aware baselines and CI | Obtain focused Core build + analyzer test results before merging rule enforcement |
| FND-016 remediation safety | Merged non-executing reference; production wiring unverified | PRs #7758–#7764 merged; Python reference modules and `docs/architecture/FND016_REMEDIATION_SAFETY_CONTROLLER.md` | Reference controller is non-executing and returns review-required, not execution eligibility | Inventory real service consumers; never substitute reference decisions for an authorized execution gate |
| FND-010 authorization / audit | Pending | Recent PR sequence | Production reuse requires source review | Trace endpoint/worker authorization paths |
| FND-014 / FND-015 simulation / rollback | Pending | Existing reference modules | Reuse requires source review | Inventory simulation and rollback implementations |

## Audit acceptance criteria

For each control: document branch and SHA, exact source files inspected, definition and consumer inventory, equivalent implementations, verified defects versus opportunities, change and test evidence, and whether it is production-wired. Avoid treating a zero-result default-branch search as a repository-wide proof. Preserve fail-closed security behavior. Merge only with evidence and approved integration policy.

## First finding — reconciled 2026-11-23

FND-018 Python reference controls have **merged** via PRs #7778 and #7779. They are not demonstrated production C# consumers. The first priority remains **usage discovery and deduplication**, not new control development. A merged reference implementation alone does not authorize production integration.


## Audit update — agent handler cancellation and circuit accounting (2026-11-22)

**Source:** master at audit branch creation. Inspected `ArchLucid.Core/Resilience/CircuitBreakerGate.cs`, `ArchLucid.AgentRuntime/RealAgentExecutorHandlerResiliencePipeline.cs`, `ArchLucid.AgentRuntime/RealAgentExecutorSingleHandlerExecution.cs`, `ArchLucid.AgentRuntime.Tests/AgentRuntimePackageCoverageBatch18Tests.cs`, `ArchLucid.Host.Core/Http/OutboundExternalHttpResiliencePolicy.cs`, `ArchLucid.Host.Core/Http/AzureRetailPricesHttpResiliencePolicy.cs`.

**Production consumers:** `RealAgentExecutorSingleHandlerExecution.ExecuteSingleAsync` calls the cached per-dispatch-key Polly pipeline. This is a production-oriented call site, not an FND-018 Python reference consumer. The Core `CircuitBreakerGate` and Polly pipelines have different runtime contracts and should not be mechanically substituted.

**Confirmed defect:** the agent handler circuit breaker used `Handle<Exception>()`, counting caller cancellation as an infrastructure failure; the caller cancellation could also be wrapped as `AgentExecutionFailedException`. This diverges from `CircuitBreakerGate`'s documented cancellation-neutral probe semantics.

**Narrow correction:** exclude `OperationCanceledException` from the agent circuit-breaker handled outcomes; propagate caller-requested cancellation before fallback/error wrapping. Added focused regression test for repeated cancellations not opening the breaker. The test and full CI are not yet verified.

**Next audit:** trace cancellation and exception classification through the agent timeout/LLM pipelines, then inspect tenant partitioning and policy registration. FND-018 Python controls remain reference-only; do not wire them into production without a separate integration review.


## Follow-up — distributed LLM cache cancellation (2026-11-22)

**Production wiring inspected:** `ArchLucid.Host.Composition/Configuration/ArchLucidDistributedCacheRegistrar.cs` references `ResilientDistributedLlmCompletionResponseStore`; `ArchLucid.AgentRuntime/ResilientDistributedLlmCompletionResponseStore.cs` invokes `LlmCompletionDistributedStoreResilienceDefaults.BuildCircuitBreakerPipeline`. Tests in `ArchLucid.AgentRuntime.Tests/ResilientDistributedLlmCompletionResponseStoreTests.cs`.

**Confirmed issue:** the Redis cache breaker counted every exception including cancellation, while both cache read and write wrappers caught cancellation via `catch (Exception)` and attempted in-memory fallback. This could swallow caller cancellation and perform an unwanted cache write.

**Fix:** exclude `OperationCanceledException` from breaker failure accounting; rethrow cancellation when the caller's token is canceled, before fallback catches. Added regression tests for canceled reads/writes. Other Redis failures continue to degrade to in-memory cache. No new controls introduced. Tests/CI pending.


## Scope review — shared vs tenant-isolated resilience (2026-11-22)

**Observed:** `RealAgentExecutorHandlerResiliencePipeline` caches static Polly pipelines by dispatch key, timeout and options, with **no tenant identifier**. Its breaker state is therefore shared by callers with the same dispatch key in a process. `ArchLucidDistributedCacheRegistrar.RegisterLlmCompletionResponseStore` registers one singleton distributed cache wrapper and one Redis circuit breaker per host, also shared across tenants. These are confirmed scope properties, **not yet confirmed tenant-isolation vulnerabilities**: provider/Redis outage protection may intentionally be host-wide, and tenant-specific isolation may occur in other layers.

**Decision:** Do not silently change the breaker partition key to tenant ID. That could create unbounded per-tenant pipeline state and defeat host-level protection. Next inspect documented resource scope, rate limiting, tenant identity propagation, cache-key isolation and operational intent; add bounded tenant partitioning only with a source-grounded requirement and concurrency tests.

**Additional correction:** a caller may cancel while Redis concurrently throws a non-cancellation error. Cache fallback catch blocks now re-check the caller token before doing fallback work. Focused CI remains pending.


## Cache key and fallback audit (2026-11-22)

Inspected `CachingAgentCompletionClient.cs`, `LlmCompletionCacheFingerprint.cs`, `LlmCompletionResponseCacheOptions.cs`, `DistributedLlmCompletionResponseStore.cs`, `MemoryLlmCompletionResponseStore.cs`, `ArchLucidDistributedCacheRegistrar.cs`, and `AgentCompletionAzureScopedChainRegistrar.cs`. Cache keys incorporate tenant/workspace/project when `PartitionByScope=true` (default); it is configurable false, so strict tenant isolation requires validating deployment configuration and whether cross-scope reuse is permitted. No cross-tenant collision was demonstrated. Do not change key format without compatibility analysis.

**Confirmed omission:** `MemoryLlmCompletionResponseStore` ignored its cancellation tokens on read and write, undermining cancellation propagation when Redis falls back to memory. Added cancellation checks before cache access/mutation and a focused regression test. This aligns existing cache implementation with the same cancellation contract, without introducing new control packages. Tests pending.


## Legacy completion cache configuration enforcement (2026-11-22)

The two production composition paths `AgentCompletionAzureScopedChainRegistrar` and `EchoAgentCompletionPipelineRegistrar` pass configurable `LlmCompletionResponseCacheOptions.PartitionByScope` into a shared completion cache. Although defaults and `appsettings.Advanced.json` set true, configuration overrides could set false and allow identical prompts to share cache responses across tenants. Added a common `RequireScopePartitioning` validation on the existing options type and invoked it only when the legacy shared cache is actually enabled in each registrar. A false setting now rejects startup of that legacy caching path instead of silently allowing cross-scope reuse. The modern cache has separate controls and is not changed. Added an options regression test. This is a deliberate fail-closed configuration behavior change; CI and compatibility tests are pending.


## Ten-point audit batch — completion and resilience controls (2026-11-22)

This batch inspects **ten distinct mechanisms**, not ten claimed defects. All findings are from source review; test outcomes remain unverified.

| # | Mechanism inspected | Result |
|---|---|---|
| 1 | Legacy completion-cache options | Scope partition fail-closed guard committed in this PR |
| 2 | Legacy Azure OpenAI cache registration | Reuses shared options guard |
| 3 | Legacy Echo cache registration | Reuses shared options guard |
| 4 | Modern `CachingLlmCompletionClient` scope admission | **Confirmed gap:** production mode accepted `PartitionByScope=false`; now rejects it |
| 5 | Modern completion-cache hit path | Cancellation check before returning cached data added |
| 6 | Modern completion-cache post-completion path | Cancellation check before staging/writing added |
| 7 | `MemorySemanticCache` get | **Confirmed gap:** ignored cancellation; now checks |
| 8 | `MemorySemanticCache` set | **Confirmed gap:** ignored cancellation; now checks |
| 9 | `MemorySemanticCache` remove | **Confirmed gap:** ignored cancellation; now checks |
| 10 | `LlmCallResilienceDefaults` retry classification and `CircuitBreakingAgentCompletionClient` | Existing classifier and caller cancellation handling observed; no unproven refactor |

**Additional source review:** `LlmCompletionResponseCache` delegates to semantic store; `LlmCompletionCacheFingerprint` includes tenant/workspace/project when partitioning is enabled; `AgentCompletionCacheRegistrar` registers the modern decorator. Modern simulator mode remains explicitly exempt from tenant-scoped partition validation. The legacy direct cache is guarded only when enabled. Tests added for semantic-cache cancellation. CI pending.

**Next:** inspect actual CI failures and deployment overrides; do not assert tenant isolation for uninspected caches or assume every identified gap represents an exploitable cross-tenant incident.
