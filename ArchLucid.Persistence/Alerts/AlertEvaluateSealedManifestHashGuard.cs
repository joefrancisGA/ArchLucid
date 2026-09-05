using ArchLucid.Core.Alerts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Wave-27 suggestions 263–264: production alert evaluation fail-closed on run sealed hash.</summary>
public static class AlertEvaluateSealedManifestHashGuard
{
    public static Task EnsureContextRunSealedManifestHashOrThrowAsync(
        AlertEvaluationContext context,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!context.RunId.HasValue || context.RunId.Value == Guid.Empty)
            return Task.CompletedTask;

        AlertRecord probe = new()
        {
            TenantId = context.TenantId,
            WorkspaceId = context.WorkspaceId,
            ProjectId = context.ProjectId,
            RunId = context.RunId,
        };

        return AlertDeliverySealedManifestHashGuard.EnsureAlertRunSealedManifestHashOrThrowAsync(
            probe,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
