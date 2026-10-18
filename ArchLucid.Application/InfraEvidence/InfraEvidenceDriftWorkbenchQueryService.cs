using ArchLucid.Application.Governance;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class InfraEvidenceDriftWorkbenchQueryService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureInventoryDiffRepository diffRepository,
    IArchitectureDiagramReconciliationRepository reconciliationRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : IInfraEvidenceDriftWorkbenchQueryService
{
    private readonly IAzureInventorySnapshotRepository _snapshotRepository =
        snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));

    private readonly IAzureInventoryDiffRepository _diffRepository =
        diffRepository ?? throw new ArgumentNullException(nameof(diffRepository));

    private readonly IArchitectureDiagramReconciliationRepository _reconciliationRepository =
        reconciliationRepository ?? throw new ArgumentNullException(nameof(reconciliationRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    public async Task<PagedResponse<AzureInventorySnapshotRecord>> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (IReadOnlyList<AzureInventorySnapshotRecord> items, int totalCount) =
            await _snapshotRepository.ListSnapshotsAsync(scope, page, pageSize, subscriptionId, cancellationToken);

        IReadOnlyList<Guid> snapshotIds = items
            .Select(snapshot => snapshot.SnapshotId)
            .ToList();

        IReadOnlyList<ArchitectureDiagramReconciliationSnapshotRunRecord> snapshotRuns =
            await _reconciliationRepository.ListRunIdsBySnapshotIdsAsync(
                scope.TenantId,
                snapshotIds,
                cancellationToken);

        HashSet<Guid> distinctRunIds = snapshotRuns
            .Select(row => row.RunId)
            .Where(runId => runId != Guid.Empty)
            .ToHashSet();

        await GovernanceDispositionSealedManifestGuard.EnsureDistinctRunsSealedManifestHashOrThrowAsync(
            distinctRunIds.ToList(),
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        return PagedResponseBuilder.FromDatabasePage(items, totalCount, page, pageSize);
    }

    public async Task<IReadOnlyList<AzureInventoryDiffSummaryRecord>?> ListDiffsForSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
            return null;

        AzureInventorySnapshotRecord? snapshot =
            await _snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
            return null;

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope,
            snapshotId,
            _reconciliationRepository,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        return await _diffRepository.ListDiffsBySnapshotIdAsync(scope, snapshotId, cancellationToken);
    }

    public async Task<PagedResponse<AzureInventoryChangeRecord>?> ListChangesForDiffAsync(
        ScopeContext scope,
        Guid diffId,
        int page,
        int pageSize,
        Guid? cloudResourceId = null,
        bool includeUnchanged = false,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (diffId == Guid.Empty)
            return null;

        AzureInventoryDiffSummaryRecord? diff =
            await _diffRepository.TryGetByDiffIdAsync(scope, diffId, cancellationToken);

        if (diff is null)
            return null;

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope,
            diff.SnapshotAId,
            _reconciliationRepository,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope,
            diff.SnapshotBId,
            _reconciliationRepository,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        IReadOnlyList<AzureInventoryChangeRecord> existingChanges =
            await _diffRepository.ListChangesByDiffIdAsync(scope, diffId, cancellationToken);

        IEnumerable<AzureInventoryChangeRecord> visibleChanges = existingChanges.Where(IsVisibleChange);

        if (includeUnchanged)
        {
            IReadOnlyList<AzureInventoryResourceRecord>? resourcesA =
                await _snapshotRepository.ListResourcesBySnapshotIdAsync(scope, diff.SnapshotAId, cancellationToken);

            IReadOnlyList<AzureInventoryResourceRecord>? resourcesB =
                await _snapshotRepository.ListResourcesBySnapshotIdAsync(scope, diff.SnapshotBId, cancellationToken);

            if (resourcesA is null || resourcesB is null)
            {
                return null;
            }

            HashSet<string> changedAzureResourceIds = existingChanges
                .Select(change => change.AzureResourceId)
                .Where(azureResourceId => !string.IsNullOrWhiteSpace(azureResourceId))
                .Select(azureResourceId => azureResourceId!)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            List<AzureInventoryChangeRecord> unchangedChanges =
                AzureInventoryDiffUnchangedBuilder.BuildUnchangedResourceChanges(
                    resourcesA,
                    resourcesB,
                    diffId,
                    diff.SnapshotAId,
                    diff.SnapshotBId,
                    changedAzureResourceIds);

            visibleChanges = visibleChanges.Concat(unchangedChanges);
        }

        if (cloudResourceId is Guid resourceId && resourceId != Guid.Empty)
        {
            visibleChanges = visibleChanges.Where(change => change.CloudResourceId == resourceId);
        }

        List<AzureInventoryChangeRecord> orderedChanges = visibleChanges
            .OrderBy(change => change.AzureResourceId, StringComparer.Ordinal)
            .ThenBy(change => change.ChangeType)
            .ThenBy(change => change.Property, StringComparer.Ordinal)
            .ToList();

        return PagedResponseBuilder.Build(orderedChanges, page, pageSize);
    }

    public async Task<PagedResponse<AzureInventoryChangeRecord>?> ListInventoryRowsForSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        int page,
        int pageSize,
        Guid? cloudResourceId = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
        {
            return null;
        }

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope,
            snapshotId,
            _reconciliationRepository,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        IReadOnlyList<AzureInventoryResourceRecord>? resources =
            await _snapshotRepository.ListResourcesBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (resources is null)
        {
            return null;
        }

        IEnumerable<AzureInventoryResourceRecord> visibleResources = resources
            .Where(resource => !AzureInventoryNeverShowArmTypes.ShouldOmitResource(
                resource.ResourceType,
                resource.AzureResourceId));

        if (cloudResourceId is Guid resourceId && resourceId != Guid.Empty)
        {
            visibleResources = visibleResources.Where(resource => resource.CloudResourceId == resourceId);
        }

        List<AzureInventoryChangeRecord> items = visibleResources
            .OrderBy(resource => resource.AzureResourceId, StringComparer.Ordinal)
            .Select(resource => AzureInventorySnapshotInventoryRowMapper.MapResource(snapshotId, resource))
            .ToList();

        return PagedResponseBuilder.Build(items, page, pageSize);
    }

    private static bool IsVisibleChange(AzureInventoryChangeRecord change)
    {
        return !AzureInventoryNeverShowArmTypes.ShouldOmitAzureResourceId(change.AzureResourceId);
    }
}
