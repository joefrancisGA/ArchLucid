# Azure OpenAI completion network timeout: stalled HTTP transport validation

**Date:** 2026-11-23  
**Dependency:** PR #7845 (chat SDK `NetworkTimeout` configuration), not yet merged at branch creation.

## Validation objective

Test the *actual Azure.AI.OpenAI SDK chat request pipeline* used by ArchLucid against a deliberately stalled HTTP send, without any live Azure endpoint, API secret, DNS request or external network.

## Deterministic test arrangement

`AzureOpenAiCompletionStalledTransportTests` in `ArchLucid.AgentRuntime.Tests`:

1. Constructs `AzureOpenAIClientOptions` through ArchLucid's `AzureOpenAiCompletionClient.CreateClientOptions(5s)`.
2. Uses the SDK's `HttpClientPipelineTransport` with an in-process `HttpMessageHandler` that begins an HTTP send but never returns response headers. The handler waits indefinitely until its cancellation token is signaled.
3. Sets `HttpClient.Timeout = Timeout.InfiniteTimeSpan` so only the configured **SDK network timeout** can abort the stalled request. Disables the SDK's internal retries with `ClientRetryPolicy(0)` to measure a single network operation.
4. Starts both non-streaming `CompleteChatAsync` and streaming `CompleteChatStreamingAsync` against the SDK, with an outer 20-second safety token that prevents CI hangs.
5. Asserts one HTTP send, transport cancellation observed, an error rather than success, and completion before the outer safety limit.
6. Separately cancels the caller only **after** the handler confirms the request started, verifying prompt cancellation for both completion forms.

## Scope and limitations

This is an **in-process simulated stalled HTTP connection** rather than a physical TCP socket, so it verifies the actual SDK's network-timeout policy, retry configuration, transport cancellation propagation, and streaming/non-streaming boundaries. It does not validate network stack socket teardown, TLS handshake behavior, Azure's server-side cancellation, or billing after a request is accepted.

This is test-only validation; no new timeout framework or production control is introduced.

## CI

```sh
dotnet test ArchLucid.AgentRuntime.Tests --filter FullyQualifiedName~AzureOpenAiCompletionStalledTransportTests
```

The test project targets .NET 10, uses the centrally pinned Azure.AI.OpenAI 2.1.0 and System.ClientModel 1.14.0. No local .NET SDK is available in the current execution environment; GitHub CI must confirm actual pass/fail results.

**Merge order:** First validate and merge PR #7845, then verify this test-only PR's net diff against `master`, rerun focused tests and required checks, and merge only on success. Do not bypass branch protection or run a full build directly against `master` without authorization.
