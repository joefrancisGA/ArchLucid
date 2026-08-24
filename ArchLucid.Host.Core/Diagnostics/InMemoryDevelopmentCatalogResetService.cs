using ArchLucid.Application.Diagnostics;

namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>
///     In-memory / non-SQL hosts register this stub so DI validation succeeds; reset still fails closed at runtime.
/// </summary>
public sealed class InMemoryDevelopmentCatalogResetService : IDevelopmentCatalogResetService
{
    public Task<DevelopmentCatalogResetResult> ResetToFreshInstallAsync(CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException(
            "Development catalog reset requires ArchLucid:StorageProvider=Sql.");
    }
}
