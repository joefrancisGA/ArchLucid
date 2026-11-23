using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationPatternRepository
{
    // Creating a draft must persist its parent and first version together.
    Task InsertDraftWithVersionAsync(
        RemediationPatternRecord pattern,
        RemediationPatternVersionRecord firstVersion,
        CancellationToken cancellationToken = default);

    Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default);

    Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default);

    Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default);

    // Approval must update the version and current pointer in one operation.
    Task<bool> TryApproveVersionAsync(
        RemediationPatternVersionRecord approvedVersion,
        RemediationPatternStatus expectedStatus,
        CancellationToken cancellationToken = default) => Task.FromResult(false);

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

    /// <summary>
    ///     Returns only the tenant's CURRENT approved remediation PATTERN version.
    ///     This is a trusted-pattern read primitive, NOT an authorized FND-015
    ///     remediation plan or evidence that cloud execution is permitted.
    ///     Implementations must bind pattern pointer, version status and tenant
    ///     in one authoritative read, not via two stale independent lookups.
    ///     Unsupported providers fail closed rather than returning an old
    ///     approved version from a tenant-wide list.
    /// </summary>
    Task<RemediationPatternApprovedVersionRecord?> TryGetCurrentApprovedVersionAsync(
        Guid tenantId,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult<RemediationPatternApprovedVersionRecord?>(null);
    }

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
