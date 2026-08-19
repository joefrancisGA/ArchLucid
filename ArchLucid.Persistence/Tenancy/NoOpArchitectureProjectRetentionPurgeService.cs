using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>In-memory / non-SQL hosts: retention purge is a no-op.</summary>
public sealed class NoOpArchitectureProjectRetentionPurgeService : IArchitectureProjectRetentionPurgeService
{
    /// <inheritdoc />
    public Task<IReadOnlyList<ArchitectureProjectPurgeDeletion>> PurgeExpiredAsync(
        DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        _ = cutoffUtc;
        _ = ct;

        return Task.FromResult<IReadOnlyList<ArchitectureProjectPurgeDeletion>>([]);
    }
}
