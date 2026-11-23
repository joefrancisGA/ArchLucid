> **Scope:** For architecture maintainers, record the verified adoption status of existing controls; this ledger is not proof that reference-only controls are enforced in production.

# Architectural control reuse audit ledger

**Initiated:** 2026-11-22. **Scope:** existing architecture controls, audited one at a time. Do not introduce new control families until this audit establishes usage and duplication evidence.

| Control | Status | Evidence reviewed | Preliminary finding | Next action |
| --- | --- | --- | --- | --- |
| FND-018 bounded retries / circuit breaker / failure budget | **Merged #7874**; production observer is non-enforcing; targeted PR checks passed | #7779, #7856, #7874; Python contract, .NET handler path, Polly breaker, observer/tests; FND-018 handler workflow run 45202736834 | Python policy remains reference-only; Polly pre-handler rejection was incorrectly counted as a handler failure, now separately measured as `not_admitted` | Review ongoing telemetry/tenant scope before considering admission enforcement |
| FND-018 failure containment | **Audited: reference only**; strict fact-proof hardening proposed in focused PR | #7778, reference module/tests and workflow; `CentralAuthorizationDecisions`, SQL audit, SecureNow evidence gate, agent degrade path, health diagnostics, FND-016 trusted stop reader | Missing stop fact was treated as clear; truthy non-Boolean health/recovery flags could falsely pass verification. Existing .NET controls enforce distinct, real boundaries; no common live containment gate established | Validate this PR's focused Python workflow; then FND-017 conformance analyzer reuse |
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


## FND-018 bounded retry / breaker / failure budget — pre-handler rejection audit (2026-11-23)

- **Master baseline:** `37ff2b7a42282c8f57f3ae16f40fdceff90ad3a1`; **audit branch:** `audit/fnd018-handler-admission-budget-20261123`. Relevant merged PRs: [#7778](https://github.com/joefrancisGA/ArchLucid/pull/7778), [#7779](https://github.com/joefrancisGA/ArchLucid/pull/7779), [#7856](https://github.com/joefrancisGA/ArchLucid/pull/7856); see also recent HTTP reuse PRs [#7810](https://github.com/joefrancisGA/ArchLucid/pull/7810), [#7813](https://github.com/joefrancisGA/ArchLucid/pull/7813), and the canonical Azure HTTP policy consolidation documented in `AUDIT_CANONICAL_AZURE_HTTP_RETRY_REUSE_2026_11_23.md`. None is a substitute for this handler-boundary audit.
- **Reference files inspected on master:** `scripts/integration/fnd018_resilience_controls.py`; `scripts/tests/test_fnd018_resilience_controls.py`; `docs/architecture/FND018_RESILIENCE_CONTROLS.md`. These define a deterministic non-executing Python model; the Python retry/circuit/failure-budget functions are **not** demonstrated as runtime C# call sites.
- **Production files inspected:** `ArchLucid.AgentRuntime/RealAgentExecutorSingleHandlerExecution.cs`, `RealAgentExecutorHandlerResiliencePipeline.cs`, `AgentHandlerFailureBudgetObserver.cs`, `AgentHandlerConcurrencyGate.cs`, `IAgentHandlerConcurrencyGate.cs`, `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.Agent.cs`. Focused tests: `ArchLucid.AgentRuntime.Tests/AgentHandlerFailureBudgetObserverTests.cs`, `AgentRuntimePackageCoverageBatch18Tests.cs`. CI path: `.github/workflows/fnd018-handler-failure-budget-observation.yml` (PR-branch only). Master search additionally found existing `CircuitBreakerGate`, LLM/retrieval breaker decorators and existing HTTP retry/circuit implementations; no blanket replacement is justified because the policies have distinct service contracts.
- **Wiring proof:** `RealAgentExecutorSingleHandlerExecution.ExecuteSingleAsync` invokes the concurrency gate, then a per-dispatch-key Polly timeout/circuit pipeline; `ObserveOutcome` records the completed handler outcome into the bounded (64 keys, 60 seconds, 5 requests/5 failures) process-local observer. An exhausted budget emits telemetry but **never** rejects execution. FND-018 Python `budget_allows` is not wired to admission; this must not be misrepresented as enforcement.
- **Confirmed narrow defect:** `catch (Exception)` previously observed `Failure` even when the concurrency gate or already-open Polly breaker rejected before the handler delegate ran. This exhausts an attempted-*handler* failure budget with no handler attempt, obscuring true failures and overstating handler degradation. This is distinct from a real timeout after entry, which must still count as a failure.
- **Correction proposed in this branch:** atomically mark entry into the existing handler callback. On a pre-entry exception record `NotAdmitted` as a bounded metric outcome with **no budget sample**; count failures normally after entry, including timeout and degraded fallback. Caller cancellation remains neutral. No change to admission, fallback, retry, breaker configuration, security authorization, or execution. Both prior success/failure metrics and a new neutral `not_admitted` value remain bounded by enum labels rather than IDs.
- **Test evidence:** added observer regression for zero allocation/no threshold consumption on rejection; added Polly breaker-open test proving its rejected call does not enter handler callback and observation remains at two actual failures. The earlier #7856 focused workflow run `45141316545` reported success, but is not evidence for **this** branch. This branch's targeted workflow/CI remains **pending** until the new PR is checked. Do not merge without verifying focused tests and required checks. No full `master` build was dispatched.
- **Remaining questions:** failures originating inside handlers may themselves be `BrokenCircuitException`; those still count, correctly, because the delegate was entered. Future budget enforcement would require a separate safety, tenant-scope, and recovery review; avoid treating process-local metrics as a distributed budget. Search coverage was default-branch code search plus explicit named PR/branch inspection; it is not a claim that every feature branch was exhaustively indexed.
- **Next control:** FND-018 failure containment ([#7778](https://github.com/joefrancisGA/ArchLucid/pull/7778)): map security-critical vs degradable dependencies and the independent recovery signal contract to real fail-closed execution and health-gating paths before modifying them. Then FND-017 conformance analyzers, FND-016 remediation safety, FND-010 authorization/audit, FND-014/015.

## FND-018 failure containment — verified production-boundary reuse audit (2026-11-23)

- **Baseline:** master `72039ec70221af94d891ef2045b85bae2b5ce185`; **branch:** `audit/fnd018-containment-evidence-proof-20261123`. Reference PR [#7778](https://github.com/joefrancisGA/ArchLucid/pull/7778) was merged, as was bounded-resilience PR [#7779](https://github.com/joefrancisGA/ArchLucid/pull/7779). Prior handler accounting PR [#7874](https://github.com/joefrancisGA/ArchLucid/pull/7874) merged; its FND-018 handler observation workflow [run 45202736834](https://github.com/joefrancisGA/ArchLucid/actions/runs/45202736834) and containment reference workflow [run 45202736596](https://github.com/joefrancisGA/ArchLucid/actions/runs/45202736596) both succeeded. Other combined CI checks for that PR SHA were pending/queued when last inspected: do not characterize overall CI as green.
- **Definition and Python consumers inspected:** `scripts/integration/fnd018_failure_containment.py`, `scripts/tests/test_fnd018_failure_containment.py`, `docs/architecture/FND018_FAILURE_CONTAINMENT.md`, `.github/workflows/fnd018-failure-containment.yml`, plus default-branch code searches for `assess_containment`, `transition_recovery` and `fnd018_failure_containment`. The latter found only reference module, dedicated tests and workflow/documentation; **no production Python or .NET invocation of the reference engine was demonstrated**. Search covers indexed master plus these named files, not all potential unindexed PR branches. Explicitly avoid the stronger claim of total repository nonuse.
- **Real C# call sites and equivalent mechanisms inspected:** `ArchLucid.Api/Security/CentralAuthorizationDecisions.cs` verifies authenticated identity, scope, entitlement/policy and calls mandatory audit before any allow; `ArchLucid.Api/Security/SqlCentralAuthorizationAudit.cs` invokes `dbo.AppendAuthorizationDecision`; `ArchLucid.Api/Security/EvidenceReadAuthorizationGate.cs` wraps the central service; `ArchLucid.Api/Controllers/Planning/GraphController.Snapshot.cs` authorizes SecureNow anchor and resolved run before graph access and checks sealed manifests. `ArchLucid.Application/Governance/FinalizeReadinessService.cs` and `ArchLucid.Application/Runs/Orchestration/CommitOutputIntegrityService.cs` use evidence-referential integrity for finalize/commit (not a general read authorization proof). `ArchLucid.AgentRuntime/RealAgentExecutorSingleHandlerExecution.cs` and `RealAgentExecutorHandlerResiliencePipeline.cs` implement non-Critic-only degradation, critical Critic termination and Polly circuit/timeout (not reference-model recovery). `ArchLucid.Host.Core/Health/CircuitBreakerHealthCheck.cs` and `ArchLucid.Host.Composition/Startup/Modules/DataHealthJobsCompositionModule.HealthChecks.cs` expose diagnostic breaker state without readiness admission or independent health proof. Do not replace these separate contracts with a single new control.
- **Cross-control reuse checked:** `scripts/integration/fnd016_trusted_stop_reader.py`, `scripts/integration/fnd016_remediation_safety_controller.py`, `docs/architecture/FND016_RECOVERY_EMERGENCY_STOP.md`, and SQL `ArchLucid.Persistence/Migrations/356_RemediationEmergencyStop.sql`. FND-016 defines fail-closed, tenant/project-scoped emergency-stop data and reference gates but explicitly lacks production SQL adapters/executor wiring; its reference is not an authoritative runtime recovery/stop service.
- **Confirmed reference-contract defects:** (1) `FailureFacts.emergency_stop_active=False` silently treated absent stop verification as a cleared stop and could authorize reference-model planning/AI even though stop state was unknown; (2) truthy non-Boolean values (for example `"false"` or integer `1`) were accepted for `authorization_verified`, `audit_writable`, `evidence_verified` and `independent_recovery_verified`. These are real fail-open *reference evaluation* defects, **not evidence of a production exploit**, since production invocation has not been established.
- **Narrow proposed fix:** missing stop now defaults to unknown; only explicit Boolean `False` clears it; unknown/active permits verified evidence viewing only. Authorization, audit, evidence and independent recovery require literal `True`. No new control family, external dependency, production DI wiring, approval shortcut, autonomous remediation or master full build. Added targeted tests for missing/ambiguous stop, untrusted Boolean-like proofs and recovery hysteresis. Existing positive-path and critical-isolation tests remain.
- **Validation status:** this branch's `python -m unittest discover -s scripts/tests -p 'test_fnd018_failure_containment.py' -v` and existing FND-018 containment PR workflow are **pending** at ledger authoring time. Do not merge until tests and required PR checks pass. Python changes are reference-only; SecureNow 1.0 runtime behavior remains untouched.
- **Next control:** FND-017 conformance analyzer adoption and enforcement breadth. Start with the actual `ArchLucid.Core.csproj` analyzer reference, `ArchLucid.Analyzers` rules and PR branch diffs, and verify which analyzer diagnostics are enforced versus advisory before changing any compile gate.
