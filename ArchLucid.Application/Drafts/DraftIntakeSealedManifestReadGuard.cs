using ArchLucid.Application.Runs;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Drafts;

/// <summary>
///     Wave-61 suggestions 717–720: draft intake reads fail-closed on latest committed sealed hash in scope.
/// </summary>
public static class DraftIntakeSealedManifestReadGuard
{
    public static Task EnsureDraftIntakeReadAllowedOrThrowAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        RunInventorySealedManifestReadGuard.EnsureRunInventoryReadAllowedOrThrowAsync(
            tenantId,
            workspaceId,
            projectId,
            runDetailQueryService,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
}
