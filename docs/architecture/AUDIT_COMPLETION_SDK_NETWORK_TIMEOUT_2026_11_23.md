> **Scope:** Engineering audit of Azure OpenAI chat completion SDK transport timeout configuration and reuse; not a guarantee of end-to-end request deadlines.

# Completion transport timeout reuse audit — 2026-11-23

## Confirmed gap

`ArchLucid.Retrieval/Embedding/AzureOpenAiEmbeddingClient` already constructs `AzureOpenAIClientOptions` with an explicit `NetworkTimeout` (default 15 seconds). `ArchLucid.AgentRuntime/AzureOpenAiCompletionClient` constructed both API-key and managed-identity SDK clients without an explicit network timeout. That allowed completion transport behavior to depend on a library default rather than a reviewed ArchLucid resilience setting.

## Narrow correction

- Reuse the **existing Azure OpenAI SDK** `AzureOpenAIClientOptions.NetworkTimeout` facility in both completion authentication paths (no custom HTTP client, no `Task.WhenAny` wrapper).
- Define `AzureOpenAI:CompletionNetworkTimeoutSeconds`, default 60, valid 5–180; validate startup configuration and clamp defensively for option consumers.
- Apply the same setting to default and cached deployment clients, regional fallbacks, judge-only clients, and tenant BYO connections. Direct standalone/probe constructions receive the same bounded 60-second default.
- Leave preexisting Polly retry limits, API/schema fallback, rate-limiting, streaming safety and usage accounting unchanged.

## Behavioral scope

`NetworkTimeout` applies to an **individual SDK network operation**. It is not a guaranteed wall-clock deadline across outer Polly retries, Azure HTTP 429 waits, structured-output fallbacks, multiple fallback deployments, or an entire streaming conversation. The SDK/network stack can abort a stalled operation; it cannot guarantee cancellation of provider-side processing after Azure receives the request. Do not add `Task.WhenAny` without transport disposal: detaching an unfinished task can increase resource consumption rather than prevent it.

The option is fixed when constructing an SDK client; host restart/client recreation is required for changes to existing singleton clients. Existing higher-level cancellation tokens remain authoritative.

## Focused regression coverage

- `ArchLucid.Core.Tests/Configuration/AzureOpenAiOptionsTests.cs`: default and defensive clamping
- `ArchLucid.AgentRuntime.Tests/Configuration/AzureOpenAiOptionsValidatorTests.cs`: accepted boundary values and invalid configuration
- `ArchLucid.AgentRuntime.Tests/Configuration/AzureOpenAiCompletionNetworkTimeoutTests.cs`: effective SDK `NetworkTimeout` default, explicit override and invalid values

## Validation

```sh
dotnet test ArchLucid.Core.Tests --filter FullyQualifiedName~AzureOpenAiOptionsTests
dotnet test ArchLucid.AgentRuntime.Tests --filter 'FullyQualifiedName~AzureOpenAiOptionsValidatorTests|FullyQualifiedName~AzureOpenAiCompletionNetworkTimeoutTests'
```

No .NET SDK exists in this execution container. Review GitHub focused and required CI checks on the PR before merge. Do not run a full build on `master` without the owner's explicit request. The change is independent of pending resilience PRs #7815, #7820, #7823, #7824 and #7825; verify eventual merge diff against current master before landing.
