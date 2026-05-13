using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Leader-elected daily loop that permanently deletes soft-deleted <c>dbo.Projects</c> past retention and audits each
///     removed id.
/// </summary>
public sealed class ArchitectureProjectRetentionPurgeHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> optionsMonitor,
    ILogger<ArchitectureProjectRetentionPurgeHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<ArchitectureProjectRetentionPurgeHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    /// <inheritdoc />
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.ArchitectureProjectRetentionPurge,
            LoopAsync,
            stoppingToken);
    }

    private async Task LoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            ArchitectureProjectRetentionPurgeOptions opts = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(opts.IntervalHours, 1, 168));

            if (opts.Enabled)
            {
                try
                {
                    using IServiceScope scope = _scopeFactory.CreateScope();
                    IArchitectureProjectRetentionPurgeService purge =
                        scope.ServiceProvider.GetRequiredService<IArchitectureProjectRetentionPurgeService>();
                    IAuditService audit = scope.ServiceProvider.GetRequiredService<IAuditService>();

                    int days = Math.Clamp(opts.RetentionDays, 1, 365);
                    DateTimeOffset cutoff = TimeProvider.System.GetUtcNow().AddDays(-days);

                    IReadOnlyList<ArchitectureProjectPurgeDeletion> deleted =
                        await purge.PurgeExpiredAsync(cutoff, leaderToken);

                    foreach (ArchitectureProjectPurgeDeletion d in deleted)
                    {
                        await audit.LogAsync(
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
                            leaderToken);
                    }
                }
                catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    if (_logger.IsEnabled(LogLevel.Error))
                        _logger.LogError(ex, "Architecture project retention purge failed.");
                }
            }

            try
            {
                await Task.Delay(delay, leaderToken);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
