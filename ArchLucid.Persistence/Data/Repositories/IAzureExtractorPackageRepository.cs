using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IAzureExtractorPackageRepository
{
    Task InsertAsync(AzureExtractorPackageRecord record, CancellationToken cancellationToken = default);

    Task<AzureExtractorPackageProvenance?> TryGetLatestProvenanceByRunIdAsync(
        ScopeContext scope,

        Guid runId,

        CancellationToken cancellationToken = default);
}
