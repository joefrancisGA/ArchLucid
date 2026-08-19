using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     Minimal <see cref="IHostApplicationLifetime" /> for composition DI tests (no generic host builder).
/// </summary>
public sealed class CompositionTestHostApplicationLifetime : IHostApplicationLifetime
{
    public CancellationToken ApplicationStarted { get; } = CancellationToken.None;

    public CancellationToken ApplicationStopping { get; } = CancellationToken.None;

    public CancellationToken ApplicationStopped { get; } = CancellationToken.None;

    public void StopApplication()
    {
    }
}
