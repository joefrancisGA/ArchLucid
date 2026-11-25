using ArchLucid.Application.Governance;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Wave-34 suggestions 395–396: infra snapshot export fail-closed when run-cited via diagram reconciliation.</summary>
public static class InfraEvidenceSnapshotSealedManifestHashGuard
{
    public static Task EnsureRunCitedSnapshotSealedOrThrowAsync(
        ScopeContext scope,
        Guid snapshotId,
        IArchitectureDiagramReconciliationRepository reconciliationRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        EnsureCoreAsync(scope, snapshotId, reconciliationRepository, authorityQueryService,
            manifestHashService, null, cancellationToken);

    /// <summary>Only a readable run may cause its manifest to be loaded or invalidate this caller's snapshot read.</summary>
    public static Task EnsureRunCitedSnapshotSealedOrThrowAsync(
        ScopeContext scope,
        Guid snapshotId,
        IArchitectureDiagramReconciliationRepository reconciliationRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        Func<Guid, CancellationToken, Task<bool>> canReadRunAsync,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(canReadRunAsync);
        return EnsureCoreAsync(scope, snapshotId, reconciliationRepository, authorityQueryService,
            manifestHashService, canReadRunAsync, cancellationToken);
    }

    private static async Task EnsureCoreAsync(
        ScopeContext scope,
        Guid snapshotId,
        IArchitectureDiagramReconciliationRepository reconciliationRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        Func<Guid, CancellationToken, Task<bool>>? canReadRunAsync,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(reconciliationRepository);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (snapshotId == Guid.Empty)
            return;

        IReadOnlyList<Guid> runIds = await reconciliationRepository.ListRunIdsBySnapshotAsync(
            scope.TenantId,
            snapshotId,
            cancellationToken);

        foreach (Guid runId in runIds.Where(candidate => candidate != Guid.Empty).Distinct())
        {
            if (canReadRunAsync is not null && !await canReadRunAsync(runId, cancellationToken))
                continue;

            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}
