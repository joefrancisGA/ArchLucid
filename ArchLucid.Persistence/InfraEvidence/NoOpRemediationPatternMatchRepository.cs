using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpRemediationPatternMatchRepository : IRemediationPatternMatchRepository
{
    public Task DeactivateMatchesForFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task InsertMatchResultAsync(
        RemediationPatternMatchResultRecord matchResult,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task InsertConflictAsync(
        RemediationPatternMatchConflictRecord conflict,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<RemediationPatternMatchResultRecord?>(null);

    public Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<RemediationPatternMatchResultRecord>>([]);

    public Task<IReadOnlyList<RemediationPatternMatchConflictRecord>> ListConflictsByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<RemediationPatternMatchConflictRecord>>([]);
}
