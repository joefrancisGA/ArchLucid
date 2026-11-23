# Architecture control reuse audit — Azure Retail Prices resilience (2026-11-22)

**Control audited:** Azure outbound transient HTTP status classification shared between retry and circuit-breaker policies.

**Source inspected (master):**
- `ArchLucid.Host.Core/Http/AzureRmAndRetailPricesHttpRetryPolicy.cs`
- `ArchLucid.Host.Core/Http/AzureRetailPricesHttpResiliencePolicy.cs`
- `ArchLucid.Core/Http/AzureRmAndRetailPricesHttpRetryPolicy.cs`
- `ArchLucid.Cli/Commands/CostEstimateCommand.Inputs.cs`
- `ArchLucid.Core/Costing/AzureRetailPricesCatalogClient.cs`

**Confirmed finding:** `AzureRetailPricesHttpResiliencePolicy.CountsAsCircuitBreakerFailure` duplicated the same 408, 429 and 5xx classification already implemented in `AzureRmAndRetailPricesHttpRetryPolicy.ShouldRetryHttpResponse` within the Host.Core assembly. The two copies could drift and produce inconsistent retry vs breaker behavior.

**Fix:** Delegate breaker failure classification to the existing internal Host.Core retry helper; preserve the current status-code semantics. This is a narrow production refactor, not a new architecture control.

**Validation:** Code-level equivalence inspected for the current predicate. GitHub CI/.NET test results not yet verified; do not claim a passing test run. The Core and Host.Core policy classes remain separate; further consolidation requires dependency and API compatibility analysis.

**Next audit:** Inspect call-site adoption of the shared outbound retry and circuit breaker policies across production registrations and CLI, then consider broader consolidation only where justified.
