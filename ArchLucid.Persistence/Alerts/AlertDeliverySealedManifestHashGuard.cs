using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Wave-26 suggestion 262: alert webhook delivery fail-closed on run sealed hash.</summary>
public static class AlertDeliverySealedManifestHashGuard
{
    public static async Task EnsureAlertRunSealedManifestHashOrThrowAsync(
        AlertRecord alert,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(alert);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!alert.RunId.HasValue || alert.RunId.Value == Guid.Empty)
            return;

        ScopeContext scope = new()
        {
            TenantId = alert.TenantId,
            WorkspaceId = alert.WorkspaceId,
            ProjectId = alert.ProjectId,
        };

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, alert.RunId.Value, cancellationToken);

        if (detail?.GoldenManifest is null)
        {
            throw new InvalidOperationException(
                $"Alert delivery blocked for run '{alert.RunId.Value:D}': committed golden manifest is missing.");
        }

        string computedHash = manifestHashService.ComputeHash(detail.GoldenManifest);

        if (!string.Equals(computedHash, detail.GoldenManifest.ManifestHash, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Alert delivery blocked for run '{alert.RunId.Value:D}': sealed manifest hash does not verify.");
        }
    }
}
