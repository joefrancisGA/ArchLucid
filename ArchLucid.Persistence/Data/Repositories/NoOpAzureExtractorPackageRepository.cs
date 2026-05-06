using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory hosts: uploaded Azure extractor ZIPs are not persisted to SQL.</summary>
public sealed class NoOpAzureExtractorPackageRepository : IAzureExtractorPackageRepository
{
    public Task InsertAsync(AzureExtractorPackageRecord record, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
