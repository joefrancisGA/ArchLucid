using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationPatternRepository
{
    Task InsertPatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default);

    Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default);

    Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default);

    Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default);

    Task<RemediationPatternRecord?> TryGetPatternByIdAsync(
        Guid tenantId,
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternRecord?> TryGetPatternByKeyAsync(
        Guid tenantId,
        string patternKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPatternVersionRecord?> TryGetVersionAsync(
        Guid tenantId,
        Guid patternId,
        string version,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<RemediationPatternVersionRecord>> TryGetVersionsAsync(
        Guid tenantId,
        IReadOnlyList<RemediationPatternVersionKey> keys,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(keys);

        List<RemediationPatternVersionRecord> versions = [];

        foreach (RemediationPatternVersionKey key in keys
                     .Where(item => item.PatternId != Guid.Empty && !string.IsNullOrWhiteSpace(item.Version))
                     .Distinct())
        {
            RemediationPatternVersionRecord? version = await TryGetVersionAsync(
                tenantId,
                key.PatternId,
                key.Version,
                cancellationToken);

            if (version is not null)
            {
                versions.Add(version);
            }
        }

        return versions;
    }

    Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPatternVersionRecord>> ListVersionsByPatternAsync(
        Guid tenantId,
        Guid patternId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPatternApprovedVersionRecord>> ListApprovedVersionsForTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);
}
