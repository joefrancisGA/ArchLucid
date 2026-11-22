# Provider retry and fallback cancellation audit — 2026-11-22

## Objective

Verify that Azure OpenAI provider retries, parameter-compatibility retries, and multi-provider fallback routing do not **start additional provider requests after an operation's linked cancellation token is signaled**.

## Confirmed gaps

- `AzureOpenAiCompletionClient.CompleteChatOnceAsync` and `StreamChatCoreAsync` pass a token to underlying SDK calls and their HTTP 429 delays, but previously had no explicit cancellation checks at the outer HTTP-400 parameter retry loop or inner HTTP-429 attempt loop. A non-cooperative SDK could report a retryable 400/429 after cancellation and allow the next request to start.
- The structured-output schema-to-JSON fallback similarly retried a 400 even if cancellation arrived while the first provider request completed.
- `AgentCompletionFallbackChain` and its outer `FallbackAgentCompletionClient` lacked cancellation rechecks between eligible failures and the next provider, and after a provider returned late success. A canceled operation could therefore start further fallback requests or return stale results.
- Streaming failover and provider token emission also needed a cancellation check after non-cooperative `MoveNextAsync`/response delivery and before each emitted chunk.

## Focused reuse repair

1. Check the existing cancellation token at the start of every provider HTTP 400/429 retry iteration, before scheduling a 429 delay, after each SDK request, and before structured-schema fallback.
2. Check the token before each fallback provider attempt, after each late provider response, and before streaming failover transitions/observations.
3. Check the token before emitting model chunks and before recording a successful completion outcome.
4. Preserve 429 Retry-After semantics, existing retry attempt caps, the fallback-eligibility classifier, content-safety and accounting layers. No new retry framework or cancellation token ownership was introduced.

## Added regression tests

`ArchLucid.AgentRuntime.Tests/FallbackCancellationBoundaryTests.cs` verifies:
- Late primary HTTP 429 after cancellation never invokes secondary.
- Cancellation while first fallback fails prevents a second fallback call.
- Late primary success after cancellation is not returned.
- Streaming primary failure after cancellation does not start fallback.
- Cancellation during first streaming fallback prevents the next fallback stream.

Existing `AzureOpenAiTooManyRequestsRetryTests`, `FallbackAgentCompletionClientTests` and agent runtime tests should be rerun to check unchanged normal retry behavior.

## Validation / merge gate

```sh
dotnet test ArchLucid.AgentRuntime.Tests --filter 'FullyQualifiedName~FallbackCancellationBoundaryTests|FullyQualifiedName~FallbackAgentCompletionClientTests|FullyQualifiedName~AzureOpenAiTooManyRequestsRetryTests'
```

The current execution container has no .NET SDK. Source inspection is not equivalent to a passing build or tests. Merge only after focused and required GitHub Actions checks pass. This change is on its own branch and must not overwrite PRs #7815, #7820, #7823 or #7824, which have independent completion tasks.

## Scope caveat

Cancellation is cooperative: the checks prevent **subsequent** attempts and **late output**, but they cannot forcibly terminate an already-running SDK transport that ignores cancellation. That would require a separate transport-level timeout/abort audit.
