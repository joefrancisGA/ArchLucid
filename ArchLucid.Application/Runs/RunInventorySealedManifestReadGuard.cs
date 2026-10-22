using ArchLucid.Application.Governance.Posture;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-60 suggestion 708: run inventory list reads fail-closed on latest committed sealed hash in scope.
/// </summary>
public static class RunInventorySealedManifestReadGuard
{
    public static Task EnsureRunInventoryReadAllowedOrThrowAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
            tenantId,
            workspaceId,
            projectId,
            runDetailQueryService,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
}
