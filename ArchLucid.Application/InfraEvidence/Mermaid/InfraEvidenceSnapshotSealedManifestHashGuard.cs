using ArchLucid.Application.Governance;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Wave-34 suggestions 395–396: infra snapshot export fail-closed when run-cited via diagram reconciliation.</summary>
public static class InfraEvidenceSnapshotSealedManifestHashGuard
{
    public static async Task EnsureRunCitedSnapshotSealedOrThrowAsync(
        ScopeContext scope,
        Guid snapshotId,
        IArchitectureDiagramReconciliationRepository reconciliationRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
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
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}
