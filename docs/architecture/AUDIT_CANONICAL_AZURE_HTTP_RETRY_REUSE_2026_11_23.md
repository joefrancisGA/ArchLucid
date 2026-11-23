# Canonical Azure public HTTP retry reuse — 2026-11-23

## Source-grounded finding
Two assemblies contained independent Polly v8 retry pipeline constructors with equivalent status/transport classification and backoff:
- `ArchLucid.Core/Http/AzureRmAndRetailPricesHttpRetryPolicy.cs`
- `ArchLucid.Host.Core/Http/AzureRmAndRetailPricesHttpRetryPolicy.cs`

The Host.Core implementation additionally emits a distinct HTTP 429 warning including `Retry-After`, and its internal status predicate is reused by the outbound integration and Azure Retail Prices circuit-breaker policies. These contracts must be preserved.

## Narrow reuse correction
- Core owns the **only** `AzureRmAndRetailPricesHttpRetryPolicy` Polly retry builder and status predicate (HTTP 408, 429 and 5xx, and `HttpRequestException`). Three retries, default exponential backoff, and cancellation propagation are unchanged.
- Core accepts an optional retry-logging callback, replacing rather than duplicating its default warning logging for callers with specialized telemetry. The public existing overloads remain.
- Host.Core retains its public `Create` overloads and `MaxRetryAttempts` constant as a compatibility facade; they delegate to Core while retaining the Host.Core HTTP 429 / `Retry-After` log format. Its internal status helper also delegates to Core.
- No added dependencies: Host.Core already references Core. Production DI registration and CLI call sites are not rewritten.

## Production and adjacent consumers inspected
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AzureArmHttpClients.cs`: Azure ARM named client uses Core retry; Retail Prices uses the dedicated `AzureRetailPricesHttpResiliencePolicy` (adds its breaker).
- `ArchLucid.Host.Composition/Startup/Modules/HostedCloudExtractorCompositionModule.cs`: hosted Azure ARM read clients use Core.
- `ArchLucid.Cli/Commands/CostEstimateCommand.Inputs.cs`: CLI Retail Prices handler uses Core retry without `IHttpClientFactory`.
- `ArchLucid.Host.Core/Http/AzureRetailPricesHttpResiliencePolicy.cs`: dedicated retry+breaker remains separate; existing shared Host predicate now forwards to Core.
- `ArchLucid.Host.Core/Http/OutboundExternalHttpResiliencePolicy.cs`: retains integration-specific breaker handling of 401/403 and existing options; its retry status predicate now transitively comes from Core.
- `ArchLucid.Host.Core/Services/Delivery/WebhookOutboundHttpRetryPolicy.cs`: different integration policy; not silently replaced.

This change does **not** imply all outbound services should share an identical breaker or rate limit, or that Azure OpenAI SDK `NetworkTimeout` / provider retry is interchangeable with an ordinary HTTP status-based policy.

## Regression evidence and enforcement
`.github/workflows/azure-http-retry-reuse-focused.yml` runs:
1. Core safety/network transport tests including 408, 429, 502, 503, 400/404 and transport retries.
2. `AzureHttpRetryCanonicalReuseTests`: side-by-side Core/Host status matrix, three-retry budget, transport recovery, caller cancellation, single enhanced HTTP 429 warning, and a source-level guard that rejects a second Host.Core Polly retry builder.
3. Existing outbound integration breaker tests and Host.Core package contract tests.

The source-level guard is intentionally narrow: it detects this confirmed duplicate reappearing but is not a whole-repository analyzer. Any broader conformance rule should inspect new call sites and use compiler/semantic evidence before being made mandatory. No full master build is triggered by this workflow.

## Merge boundary
Keep this PR independent of Azure OpenAI chat SDK timeout PR #7845 and other architecture PRs. Review against current master and merge only after required CI and focused tests succeed.
