using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Alerts;

/// <summary>Wave-27 suggestions 266–267: resolve verified manifestHash for alert integration event payloads.</summary>
public static class AlertIntegrationEventManifestHashResolver
{
    public static async Task<string?> TryResolveVerifiedManifestHashAsync(
        AlertRecord alert,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(alert);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!alert.RunId.HasValue || alert.RunId.Value == Guid.Empty)
            return null;

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
                $"Alert integration event blocked for run '{alert.RunId.Value:D}': committed golden manifest is missing.");
        }

        string computedHash = manifestHashService.ComputeHash(detail.GoldenManifest);

        if (!string.Equals(computedHash, detail.GoldenManifest.ManifestHash, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Alert integration event blocked for run '{alert.RunId.Value:D}': sealed manifest hash does not verify.");
        }

        return detail.GoldenManifest.ManifestHash;
    }
}
