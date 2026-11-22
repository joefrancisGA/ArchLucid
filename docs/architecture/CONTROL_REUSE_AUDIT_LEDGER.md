# Architectural control reuse audit ledger

**Initiated:** 2026-11-22. **Scope:** existing architecture controls, audited one at a time. Do not introduce new control families until this audit establishes usage and duplication evidence.

| Control | Status | Evidence reviewed | Preliminary finding | Next action |
| --- | --- | --- | --- | --- |
| FND-018 bounded retries / circuit breaker / failure budget | In progress | PR #7779 metadata; master code search for `fnd018_resilience_controls`; PR #7778 parent | #7779 is an unmerged draft stacked on unmerged #7778. Default-branch code search returned no matches for the new Python module. Therefore production adoption is **not established**; absence from master search does not prove no equivalent controls exist. | Inventory existing C# resilience libraries, policy registration, call sites and retry/circuit duplication; compare semantics; propose narrow reuse improvements with tests |
| FND-018 failure containment | Pending | PR #7778 metadata | Reference-only integration status requires verification | Audit after retry/budget control |
| FND-017 conformance | Pending | PRs #7766–#7776 | Existing queued verification work separate | Audit analyzer deployment, CI and rule coverage |
| FND-016 remediation safety | Pending | PRs #7758–#7764 | Stacked reference modules; production wiring unverified | Inventory consumers and duplicate safety checks |
| FND-010 authorization / audit | Pending | Recent PR sequence | Production reuse requires source review | Trace endpoint/worker authorization paths |
| FND-014 / FND-015 simulation / rollback | Pending | Existing reference modules | Reuse requires source review | Inventory simulation and rollback implementations |

## Audit acceptance criteria

For each control: document branch and SHA, exact source files inspected, definition and consumer inventory, equivalent implementations, verified defects versus opportunities, change and test evidence, and whether it is production-wired. Avoid treating a zero-result default-branch search as a repository-wide proof. Preserve fail-closed security behavior. Merge only with evidence and approved integration policy.

## First finding

FND-018 resilience controls are currently staged in PR #7779 rather than verified on master. The first priority is **usage discovery and deduplication**, not new control development. No source-code changes or production integration are authorized solely by this preliminary finding.


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
