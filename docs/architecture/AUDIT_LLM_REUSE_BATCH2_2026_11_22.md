# Resilience control reuse audit — second ten-point batch (2026-11-22)

Audited the following production or test-supported mechanisms against master:

1. `LlmCompletionFailureClassifier`: **confirmed** ordinary `OperationCanceledException` with a default token was classified as retryable. Fixed on this branch; retained `TaskCanceledException` without cancellation as retryable transport timeout.
2. `LlmCallResilienceDefaults`: already delegates retry classification to shared classifier; automatically benefits from correction.
3. `CircuitBreakingAgentCompletionClient.CompleteJsonAsync`: already delegates breaker classification to shared classifier.
4. `CircuitBreakingAgentCompletionClient.StreamJsonWithBreakerAsync`: records all non-cancel unsuccessful stream exits as breaker failures; further investigation needed to distinguish early enumerator disposal from real provider faults.
5. `CircuitBreakingOpenAiEmbeddingClient.EmbedAsync`: unconditionally records non-cancel exceptions as breaker failures, unlike completion client; potential semantic-terminal divergence. **No change** until shared classifier dependency boundary is resolved.
6. `CircuitBreakingOpenAiEmbeddingClient.EmbedManyAsync`: same divergence; no change yet.
7. `AgentCompletionJudgeChainRegistrar`: reuses shared LLM retry pipeline and completion breaker.
8. `AgentCompletionAzureScopedChainRegistrar`: reuses shared retry pipeline and completion breaker.
9. `AzureOpenAiTooManyRequestsRetry`: used by the shared retry delay generator, not independently replaced.
10. `CircuitBreakerGate`: has explicit cancellation-neutral probe semantics; reference point for other implementations.

**Change:** only #1 was refactored in this batch, with two regression tests. No new control package or risky Retrieval→AgentRuntime project dependency was introduced. #4–#6 are recorded follow-up opportunities, not confirmed equivalent defects. Test/CI outcomes pending.
