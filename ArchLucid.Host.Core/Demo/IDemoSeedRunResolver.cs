using ArchLucid.Persistence.Models;

namespace ArchLucid.Host.Core.Demo;

/// <summary>
/// Resolves the latest committed demo-seed run under <see cref="DemoScopes.BuildDemoScope"/> without HTTP context.
/// </summary>
/// <remarks>
/// Never raises for missing data; returns <see langword="null"/> when no committed demo run exists in scope.
/// </remarks>
public interface IDemoSeedRunResolver
{
    /// <inheritdoc cref="DemoSeedRunResolver.ResolveLatestCommittedDemoRunAsync"/>
    Task<RunRecord?> ResolveLatestCommittedDemoRunAsync(CancellationToken cancellationToken = default);
}
