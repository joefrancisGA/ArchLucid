using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Diagnostics;

using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Wires <see cref="RetrievalTelemetryPerTenantTagCircuitBreaker" /> into
///     <see cref="ArchLucidInstrumentation" /> after the host is built.
/// </summary>
public sealed class RetrievalTelemetryPerTenantTagCircuitBreakerHostedService(
    RetrievalTelemetryPerTenantTagCircuitBreaker circuitBreaker) : IHostedService
{
    private readonly RetrievalTelemetryPerTenantTagCircuitBreaker _circuitBreaker =
        circuitBreaker ?? throw new ArgumentNullException(nameof(circuitBreaker));

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.SetRetrievalTelemetryPerTenantTagCircuitBreaker(
            _circuitBreaker.ShouldSuppressTenantIdTags);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
