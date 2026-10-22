using ArchLucid.Application.Governance.Posture;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance.Coverage;

/// <summary>
///     Wave-60 suggestion 710: coverage preview POST fail-closed on latest committed sealed hash in scope.
/// </summary>
public static class GovernanceCoveragePreviewSealedManifestHashGuard
{
    public static Task EnsureCoveragePreviewAllowedOrThrowAsync(
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
