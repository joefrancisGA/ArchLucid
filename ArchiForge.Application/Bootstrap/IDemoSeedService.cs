namespace ArchiForge.Application.Bootstrap;

/// <summary>
/// Seeds a deterministic Contoso Retail Modernization demo dataset into the primary ArchiForge SQL/SQLite store.
/// Safe to call multiple times: existing rows are skipped.
/// </summary>
public interface IDemoSeedService
{
    /// <summary>Creates demo request, runs, manifests, governance workflow rows, and a sample export record when missing.</summary>
    Task SeedAsync(CancellationToken cancellationToken = default);
}
