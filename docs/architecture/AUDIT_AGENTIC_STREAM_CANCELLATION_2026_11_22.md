# Agentic retrieval and streaming cancellation audit — November 22, 2026

## Scope

Review existing cancellation and deadline handling in agentic retrieval query rewriting / HyDE / retrieval critique and in buffered + live streaming completion adapters. Preserve all current content-safety, metering, and circuit-breaker controls.

## Verified gaps

1. `AgenticRetrievalCompletionClient.TryCompleteWithExpansionBudgetAsync` passed a linked cancellation token to the provider, but accepted a late successful reply without rechecking the caller token or the expansion deadline. A non-cooperative provider could return stale results after either cancellation boundary.
2. `AgentCompletionStreamingBridge` did not check consumer cancellation when yielding simulated chunks after a buffered completion, or when relaying a non-cooperative live stream. Canceled streams could continue producing chunks.
3. The accounting decorator's simulated streaming fallback and content-safety decorator's post-scan buffered replay also did not check cancellation between chunks.

## Targeted reuse repairs

- Recheck both caller cancellation and linked expansion deadline immediately after agentic completion returns; preserve fallback heuristics on budget expiration, propagate caller cancellation, and distinguish provider cancellation from deadline expiration.
- Make `AgentCompletionStreamingBridge` enforce cancellation at entry, before forwarding live chunks, after a live stream closes, and before each simulated chunk.
- Add matching checks to `LlmCompletionAccountingClient.Stream` buffered replay and `ContentSafetyEnforcingAgentCompletionClient` post-verification replay.

These repairs require no new retry, timeout, quota, or cancellation framework and do not modify existing content-safety admission decisions.

## Regression cases

- Agentic retrieval: late non-cooperative completion after 1-second budget is discarded; caller cancellation wins over late success or non-cancellation provider error.
- Streaming bridge: canceled buffered completion rejected before first chunk; canceled simulated streaming stops between chunks; non-cooperative live streaming stops after cancellation.
- Content safety: cancellation during a successful output scan prevents buffered content from being replayed.
- Accounting: cancellation during a non-streaming completion prevents subsequent simulated streaming output.

## Validation

Run `dotnet test ArchLucid.AgentRuntime.Tests --filter 'FullyQualifiedName~AgenticRetrievalCompletionClientTests|FullyQualifiedName~AgentCompletionStreamingBridgeCancellationTests|FullyQualifiedName~ContentSafetyEnforcingAgentCompletionClientTests|FullyQualifiedName~AgentRuntimePackageCoverageBatch16Tests'` and required CI checks before merging.

No local .NET SDK is available in the current execution environment. Do not interpret code inspection as a passing test run. The work is independent of PRs #7815, #7820, and #7823, which must retain their own CI/merge sequencing.
