using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;

public interface ICollectionRunRepository
{
    Task UpsertAsync(CollectionRun collectionRun, CancellationToken cancellationToken = default);

    Task<CollectionRun?> GetAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CollectionRun>> ListAsync(
        ScopeContext scope,
        int offset,
        int limit,
        CancellationToken cancellationToken = default);

    Task<bool> HasImportedHashAsync(
        ScopeContext scope,
        byte[] zipSha256,
        CancellationToken cancellationToken = default);
}
