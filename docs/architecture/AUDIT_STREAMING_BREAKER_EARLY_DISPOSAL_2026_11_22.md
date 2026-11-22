# Streaming completion circuit breaker investigation — 2026-11-22

**Confirmed source defect:** `CircuitBreakingAgentCompletionClient.StreamJsonWithBreakerAsync` used a `finally` branch that called `RecordFailure` whenever the stream did not reach natural completion and the caller's token was not canceled. A consumer that stopped reading after its first chunk (normal `await foreach` break) could therefore open the shared provider circuit without any upstream failure.

**Fix:** iterate the underlying stream with an explicit async enumerator and capture exceptions from `MoveNextAsync`. Distinguish normal exhaustion (success), early consumer disposal or cancellation (neutral), semantic-terminal provider errors (neutral), and retryable transport faults (breaker failure) using existing `LlmCompletionFailureClassifier`. No new control abstraction.

**Tests:** early disposal repeated twice with threshold 1 should leave gate closed; transport exception should open it. CI pending. The classifier's default-token cancellation fix is independently proposed in PR #7805 and is not a prerequisite for early-disposal protection.

**Follow-up:** verify streaming disposal exceptions and retry classification against CI; avoid merging without validation.
