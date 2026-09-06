using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

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

        foreach (AzureInventorySnapshotRecord snapshot in items)
        {
            await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
                scope,
                snapshot.SnapshotId,
                _reconciliationRepository,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }

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

        (IReadOnlyList<AzureInventoryChangeRecord> items, int totalCount) =
            await _diffRepository.ListChangesByDiffIdPagedAsync(
                scope,
                diffId,
                page,
                pageSize,
                cloudResourceId,
                cancellationToken);

        return PagedResponseBuilder.FromDatabasePage(items, totalCount, page, pageSize);
    }
}
