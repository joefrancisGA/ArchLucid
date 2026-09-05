using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpRemediationPatternRepository : IRemediationPatternRepository
{
    public Task InsertPatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<RemediationPatternRecord?> TryGetPatternByIdAsync(
        Guid tenantId,
        Guid patternId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<RemediationPatternRecord?>(null);

    public Task<RemediationPatternRecord?> TryGetPatternByKeyAsync(
        Guid tenantId,
        string patternKey,
        CancellationToken cancellationToken = default)
        => Task.FromResult<RemediationPatternRecord?>(null);

    public Task<RemediationPatternVersionRecord?> TryGetVersionAsync(
        Guid tenantId,
        Guid patternId,
        string version,
        CancellationToken cancellationToken = default)
        => Task.FromResult<RemediationPatternVersionRecord?>(null);

    public Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<RemediationPatternRecord>>([]);

    public Task<IReadOnlyList<RemediationPatternVersionRecord>> ListVersionsByPatternAsync(
        Guid tenantId,
        Guid patternId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<RemediationPatternVersionRecord>>([]);
}
