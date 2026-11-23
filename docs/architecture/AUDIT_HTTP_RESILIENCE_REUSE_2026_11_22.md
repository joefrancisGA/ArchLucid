# HTTP resilience reuse audit — 2026-11-22

Inspected ten implementation/registration concerns: (1) ARM named client registration, (2) Azure Retail Prices registration, (3) AWS Pricing registration, (4) GCP Billing registration, (5) ARM retry policy, (6) Retail Prices breaker/retry policy, (7) outbound integration retry policy, (8) outbound integration breaker semantics, (9) retry status classification, (10) existing outbound policy tests.

**Confirmed duplication:** `OutboundExternalHttpResiliencePolicy.ShouldRetryOutboundResponse` repeated the exact 408/429/5xx allowlist already implemented by `AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse`. Consolidated it by delegating to the existing internal helper. The 401/403 breaker-only classification in outbound integrations is intentionally preserved. Existing named-client policies and breaker configurations are not replaced or conflated.

**Tests:** focused status matrix checks 408, 429, 503 retry and 400 nonretry. CI pending.

**Related independent work:** PR #7810 extracts LLM provider status classification to Core; HTTP integration classification has a broader 5xx/408 contract, so do not merge these two policies semantically.
