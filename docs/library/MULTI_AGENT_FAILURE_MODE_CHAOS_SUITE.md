# Multi-agent failure-mode chaos suite (TB-945)

> **Scope:** Contributor-reference — deterministic run-level failure scenarios that lock **TB-937**–**TB-944** semantics. Not production Simmy fault injection (**TB-914**).

## Why

Transport Polly/CB chaos (`CHAOS_TESTING.md`) does not prove partial-run status, selective re-execute idempotency, run-scoped budget admission, or poisoned completion-cache bust behavior. **TB-945** adds a CI-blocking suite so those regressions fail loudly.

## Scenario map

| Backlog | Scenario | Where exercised |
| --- | --- | --- |
| **TB-937** | Incomplete quad-agent batch → `PartiallyCompleted`; commit blocked | `MultiAgentFailureModeChaosSuiteTests.TB937_incomplete_quad_agent_batch_sets_PartiallyCompleted_and_blocks_commit` |
| **TB-937** / **TB-939** | Mid-run budget deny after agent 1 → partial persist + `FailedPartial` | `...TB939_mid_run_budget_deny_persists_topology_and_sets_FailedPartial` |
| **TB-939** | Pre-batch budget deny → executor not invoked | `...TB939_pre_batch_budget_deny_does_not_invoke_executor` |
| **TB-939** | Executor failure releases held reservation (no commit) | `...TB939_executor_failure_releases_held_reservation_without_commit` |
| **TB-938** | Selective resume skips persisted topology (no double-bill) | `...TB938_selective_resume_skips_persisted_topology_and_re_invokes_only_failed_agents` |
| **TB-940** | Poisoned cache hit busts entry and recalls provider | `LlmCompletionCacheAdmissionTests.TB940_poison_cache_hit_busts_and_calls_provider_again` |
| **TB-941**–**TB-944** | Per-step spend cap, downstream consistency, zombie reconcile, semantic failure class | Covered by dedicated Done rows; suite does not duplicate — see `POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md` |

## CI

| Step | Command |
| --- | --- |
| Inventory guard | `python3 scripts/ci/assert_multi_agent_failure_chaos_suite.py` |
| Application suite | `dotnet test ArchLucid.Application.Tests --filter "ChaosSuite=TB-945"` |
| Poison cache (TB-940) | `dotnet test ArchLucid.AgentRuntime.Tests --filter "ChaosSuite=TB-945"` |

Main CI runs the inventory guard after agent eval corpus checks. Full .NET regression includes the Application.Tests assembly.

## Related

- [`CHAOS_TESTING.md`](CHAOS_TESTING.md) — Simmy transport chaos
- [`POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md`](POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md) — shipped vs residual owners
- [`docs/runbooks/AGENT_EXECUTION_FAILURES.md`](../runbooks/AGENT_EXECUTION_FAILURES.md) — operator triage
