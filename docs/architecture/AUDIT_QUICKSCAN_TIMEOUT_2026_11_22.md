# Quick Scan timeout and cancellation audit — 2026-11-22

## Verified implementation gap

`QuickScanService.ScanAsync` had created a new linked cancellation source and started `MaxProcessingDurationSeconds` for **every** LLM retry. The option is documented as a **hard processing timeout**, so retries could multiply the overall wall-clock limit.

The service also caught `OperationCanceledException` in the general retry handler when there were further attempts. A caller-initiated cancellation could therefore trigger another model call rather than terminating the request.

## Narrow repair

- Start one linked cancellation source and one timeout before entering the scan's retry loop.
- Give every attempt the same linked token and stop retrying when the aggregate budget expires.
- Propagate caller cancellation immediately and prevent late provider responses from being reported as successful after deadline expiry.
- Distinguish provider-initiated cancellation from the scan budget expiring.
- Preserve effective request limits, configured attempt count, parsing behavior, and existing terminal error policy.

## Regression cases

`ArchLucid.AgentRuntime.Tests/QuickScan/QuickScanServiceCoverageTests.cs`:
1. `ScanAsync_propagates_caller_cancellation_without_retrying`
2. `ScanAsync_reuses_one_linked_deadline_token_across_retries`
3. `ScanAsync_global_deadline_stops_retry_loop_after_first_timeout` (5-second real deadline)
4. `ScanAsync_provider_initiated_cancellation_is_not_a_processing_timeout`

## Validation

The patch is independent of the half-open circuit-breaker changes in PRs #7815 and #7820. Run focused .NET unit tests and required PR CI before merging. No local .NET test suite has been executed in this audit.
