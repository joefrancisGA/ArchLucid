using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Iterates active tenants for leader-elected Executive ROI background work with ambient scope + fail-closed guard.
/// </summary>
public static class ExecutiveRoiBackgroundTenantRollup
{
    public static async Task<int> ForEachActiveTenantAsync(
        ITenantRepository tenantRepository,
        Func<ScopeContext, CancellationToken, Task> perTenantAsync,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(tenantRepository);
        ArgumentNullException.ThrowIfNull(perTenantAsync);
        ArgumentNullException.ThrowIfNull(logger);

        IReadOnlyList<TenantRecord> tenants = await tenantRepository.ListAsync(cancellationToken).ConfigureAwait(false);
        int processed = 0;

        foreach (TenantRecord tenant in tenants)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
                continue;

            TenantWorkspaceLink? workspace =
                await tenantRepository.GetFirstWorkspaceAsync(tenant.Id, cancellationToken).ConfigureAwait(false);

            if (workspace is null)
                continue;

            ScopeContext tenantScope = new()
            {
                TenantId = tenant.Id,
                WorkspaceId = workspace.WorkspaceId,
                ProjectId = workspace.DefaultProjectId,
            };

            if (!ExecutiveRoiBackgroundScopeGuard.TryValidate(tenantScope, out string reason))
            {
                ExecutiveRoiBackgroundScopeTelemetry.RecordViolation(reason);

                if (logger.IsEnabled(LogLevel.Warning))
                {
                    logger.LogWarning(
                        "Executive ROI background job skipped tenant {TenantId}: invalid scope ({Reason}).",
                        tenant.Id,
                        reason);
                }

                continue;
            }

            using (AmbientScopeContext.Push(tenantScope))
            {
                await perTenantAsync(tenantScope, cancellationToken).ConfigureAwait(false);
            }

            processed++;
        }

        return processed;
    }
}
