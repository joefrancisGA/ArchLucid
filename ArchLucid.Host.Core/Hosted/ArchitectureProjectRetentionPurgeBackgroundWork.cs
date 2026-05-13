using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Shared purge pass used by <see cref="ArchitectureProjectRetentionPurgeHostedService" /> and API-hosted
///     <c>RetentionPurgeWorker</c> so soft-deleted projects are hard-deleted with one audit event per removed row.
/// </summary>
public static class ArchitectureProjectRetentionPurgeBackgroundWork
{
    /// <summary>
    ///     When <see cref="ArchitectureProjectRetentionPurgeOptions.Enabled" /> is true, runs one retention pass: hard-delete
    ///     expired rows and log each deleted project id to <see cref="IAuditService" />.
    /// </summary>
    public static async Task RunSinglePassAsync(
        IServiceScopeFactory scopeFactory,
        IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> optionsMonitor,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(optionsMonitor);
        ArgumentNullException.ThrowIfNull(logger);

        ArchitectureProjectRetentionPurgeOptions opts = optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return;

        try
        {
            using IServiceScope scope = scopeFactory.CreateScope();
            IArchitectureProjectRetentionPurgeService purge =
                scope.ServiceProvider.GetRequiredService<IArchitectureProjectRetentionPurgeService>();
            IAuditService audit = scope.ServiceProvider.GetRequiredService<IAuditService>();

            int days = Math.Clamp(opts.RetentionDays, 1, 365);
            DateTimeOffset cutoff = TimeProvider.System.GetUtcNow().AddDays(-days);

            IReadOnlyList<ArchitectureProjectPurgeDeletion> deleted =
                await purge.PurgeExpiredAsync(cutoff, cancellationToken);

            foreach (ArchitectureProjectPurgeDeletion d in deleted)
            {
                await DurableAuditLogRetry.TryLogAsync(
                    ct => audit.LogAsync(
                        new AuditEvent
                        {
                            EventType = AuditEventTypes.ArchitectureProjectHardPurgedRetention,
                            TenantId = d.TenantId,
                            WorkspaceId = d.WorkspaceId,
                            ProjectId = d.ProjectId,
                            ActorUserId = "system",
                            ActorUserName = "architecture-project-retention",
                            ExplicitActor = true,
                            DataJson = JsonSerializer.Serialize(
                                new { d.ProjectId, d.TenantId, d.WorkspaceId }),
                        },
                        ct),
                    logger,
                    $"ArchitectureProjectHardPurgedRetention:{d.ProjectId:D}",
                    cancellationToken,
                    auditEventTypeForMetrics: AuditEventTypes.ArchitectureProjectHardPurgedRetention);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Error))
                logger.LogError(ex, "Architecture project retention purge failed.");
        }
    }
}
