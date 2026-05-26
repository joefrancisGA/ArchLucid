using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>Wires the RAG per-tenant tag circuit breaker into <see cref="ArchLucidInstrumentation" /> at startup.</summary>
public sealed class RetrievalTelemetryPerTenantTagCircuitBreakerPostConfigure(
    RetrievalTelemetryPerTenantTagCircuitBreaker circuitBreaker) : IPostConfigureOptions<ArchLucid.Core.Configuration.RetrievalTelemetryOptions>
{
    private readonly RetrievalTelemetryPerTenantTagCircuitBreaker _circuitBreaker =
        circuitBreaker ?? throw new ArgumentNullException(nameof(circuitBreaker));

    /// <inheritdoc />
    public void PostConfigure(string? name, ArchLucid.Core.Configuration.RetrievalTelemetryOptions options)
    {
        _ = options;
        _ = name;

        ArchLucidInstrumentation.SetRetrievalTelemetryPerTenantTagCircuitBreaker(
            _circuitBreaker.ShouldSuppressTenantIdTags);
    }
}
