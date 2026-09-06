using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.Stages;

/// <inheritdoc cref="IPolicyPackPublishStage" />
public sealed class PolicyPackPublishStage(
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IPolicyPackResolverCacheInvalidator policyPackResolverCacheInvalidator,
    IPolicyPackChangeLogAppender changeLogAppender) : IPolicyPackPublishStage
{
    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly IPolicyPackVersionRepository _versionRepository =
        versionRepository ?? throw new ArgumentNullException(nameof(versionRepository));

    private readonly IPolicyPackResolverCacheInvalidator _policyPackResolverCacheInvalidator =
        policyPackResolverCacheInvalidator ?? throw new ArgumentNullException(nameof(policyPackResolverCacheInvalidator));

    private readonly IPolicyPackChangeLogAppender _changeLogAppender =
        changeLogAppender ?? throw new ArgumentNullException(nameof(changeLogAppender));

    public async Task<PolicyPackVersion> PublishVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(version);

        string normalizedJson = string.IsNullOrWhiteSpace(contentJson) ? "{}" : contentJson;

        (PolicyPackVersion packVersion, string? previousValue) =
            await _versionRepository.UpsertPublishedVersionAsync(policyPackId, version, normalizedJson, ct);

        bool isIdenticalRetry = previousValue is not null
            && string.Equals(previousValue, normalizedJson, StringComparison.Ordinal);

        if (isIdenticalRetry)
            return packVersion;

        PolicyPack pack = await _packRepository.GetByIdAsync(policyPackId, ct) ?? throw new InvalidOperationException(
            $"Policy pack '{policyPackId}' was not found. Cannot promote version '{version}' on a non-existent pack.");

        pack.CurrentVersion = version;
        pack.Status = PolicyPackStatus.Active;
        pack.ActivatedUtc = TimeProvider.System.UtcNowDateTime();
        await _packRepository.UpdateAsync(pack, ct);

        await _policyPackResolverCacheInvalidator.InvalidateTenantAsync(pack.TenantId, ct);

        await _changeLogAppender.AppendAsync(
            policyPackId,
            pack.TenantId,
            pack.WorkspaceId,
            pack.ProjectId,
            PolicyPackChangeTypes.VersionPublished,
            "system",
            previousValue,
            normalizedJson,
            $"Version '{version}' published for pack '{policyPackId}'.",
            ct);

        return packVersion;
    }
}
