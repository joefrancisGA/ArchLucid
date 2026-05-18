using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Host.Core.Services;

/// <summary>Default <see cref="IPolicyPackCatalogAdminService"/> backed by pack/version repositories and the catalog table.</summary>
public sealed class PolicyPackCatalogAdminService(
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IPolicyPackCatalogRepository catalogRepository) : IPolicyPackCatalogAdminService
{
    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly IPolicyPackVersionRepository _versionRepository =
        versionRepository ?? throw new ArgumentNullException(nameof(versionRepository));

    private readonly IPolicyPackCatalogRepository _catalogRepository =
        catalogRepository ?? throw new ArgumentNullException(nameof(catalogRepository));

    /// <inheritdoc />
    public async Task<PolicyPackCatalogEntryDetail?> TryPromoteFromSourcePackAsync(
        ScopeContext scope,
        Guid sourcePolicyPackId,
        string? version,
        CancellationToken ct)
    {
        PolicyPack? pack = await _packRepository.GetByIdAsync(sourcePolicyPackId, ct);

        if (pack is null ||
            pack.TenantId != scope.TenantId ||
            pack.WorkspaceId != scope.WorkspaceId ||
            pack.ProjectId != scope.ProjectId)
            return null;

        string versionKey = string.IsNullOrWhiteSpace(version) ? pack.CurrentVersion.Trim() : version.Trim();
        PolicyPackVersion? versionRow = await _versionRepository.GetByPackAndVersionAsync(sourcePolicyPackId, versionKey, ct);

        if (versionRow is null || string.IsNullOrWhiteSpace(versionRow.ContentJson))
            return null;

        return await _catalogRepository.UpsertPromotedFromSnapshotAsync(
            sourcePolicyPackId,
            pack.Name,
            pack.Description ?? "",
            pack.PackType,
            versionKey,
            versionRow.ContentJson,
            ct);
    }

    /// <inheritdoc />
    public Task<bool> TryDemoteAsync(Guid policyPackCatalogEntryId, CancellationToken ct) =>
        _catalogRepository.TryDemoteAsync(policyPackCatalogEntryId, ct);
}
