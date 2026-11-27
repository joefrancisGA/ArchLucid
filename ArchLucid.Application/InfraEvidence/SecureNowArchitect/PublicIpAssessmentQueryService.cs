using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class PublicIpAssessmentQueryService(
    IAzureInventorySnapshotRepository snapshots,
    IArchitectureDiagramReconciliationRepository reconciliations,
    IAuthorityQueryService authority,
    IManifestHashService manifestHashes,
    IInfraEvidenceRunReadAccess runReadAccess) : IPublicIpAssessmentQueryService
{
    public async Task<PublicIpAssessmentResponse?> TryGetAsync(
        ScopeContext scope, Guid snapshotId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty
            || scope.ProjectId == Guid.Empty || snapshotId == Guid.Empty)
            return null;

        AzureInventorySnapshotRecord? header = await snapshots.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);
        if (!MatchesScope(header, scope, snapshotId))
            return null;

        await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
            scope, snapshotId, reconciliations, authority, manifestHashes,
            (runId, ct) => runReadAccess.CanReadRunAsync(scope, runId, ct), cancellationToken);

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshots.TryGetPublicIpAssessmentInventoryAsync(scope, snapshotId, cancellationToken);

        return snapshot is not null && MatchesScope(snapshot.Header, scope, snapshotId)
            ? PublicIpAssessmentProjection.Build(snapshot, page, pageSize, cancellationToken)
            : null;
    }

    private static bool MatchesScope(AzureInventorySnapshotRecord? header, ScopeContext scope, Guid snapshotId) =>
        header is not null && header.SnapshotId == snapshotId && header.TenantId == scope.TenantId
        && header.WorkspaceId == scope.WorkspaceId && header.ProjectId == scope.ProjectId;
}
