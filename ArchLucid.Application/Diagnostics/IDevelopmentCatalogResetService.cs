namespace ArchLucid.Application.Diagnostics;

/// <summary>
///     Reinitializes the local development SQL catalog to the post-install baseline (migrations, schema bootstrap,
///     default scope rows, and optional showcase demo seed).
/// </summary>
public interface IDevelopmentCatalogResetService
{
    /// <summary>
    ///     Drops and recreates the configured development tenant catalog, then replays the same startup persistence
    ///     pipeline used on first install.
    /// </summary>
    Task<DevelopmentCatalogResetResult> ResetToFreshInstallAsync(CancellationToken cancellationToken = default);
}

/// <summary>Outcome for <see cref="IDevelopmentCatalogResetService.ResetToFreshInstallAsync" />.</summary>
public sealed class DevelopmentCatalogResetResult
{
    public required string CatalogName { get; init; }

    public bool DemoSeedApplied { get; init; }
}
