using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IAzureExtractorPackageRepository
{
    Task InsertAsync(AzureExtractorPackageRecord record, CancellationToken cancellationToken = default);
}
