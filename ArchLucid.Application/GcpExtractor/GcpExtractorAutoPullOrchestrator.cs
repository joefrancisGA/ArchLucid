using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.GcpExtractor;

public interface IGcpExtractorAutoPullOrchestrator
{
    Task RunScheduledPullAsync(CancellationToken cancellationToken);
}

/// <summary>Iterates active GCP Tier-2 connections and runs hosted extraction under per-connection locks.</summary>
public sealed class GcpExtractorAutoPullOrchestrator(
    ITenantRepository tenantRepository,
    ITenantGcpConnectionRepository connectionRepository,
    IHostedGcpExtractorRunService runService,
    IDistributedCreateRunIdempotencyLock distributedLock,
    IOptionsMonitor<GcpExtractorAutoPullOptions> autoPullOptionsMonitor,
    ILogger<GcpExtractorAutoPullOrchestrator> logger) : IGcpExtractorAutoPullOrchestrator
{
    private const string SystemActor = "hosted:gcp-extractor-auto-pull";

    private const int LockWaitMilliseconds = 0;

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantGcpConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly IHostedGcpExtractorRunService _runService =
        runService ?? throw new ArgumentNullException(nameof(runService));

    private readonly IDistributedCreateRunIdempotencyLock _distributedLock =
        distributedLock ?? throw new ArgumentNullException(nameof(distributedLock));

    private readonly IOptionsMonitor<GcpExtractorAutoPullOptions> _autoPullOptionsMonitor =
        autoPullOptionsMonitor ?? throw new ArgumentNullException(nameof(autoPullOptionsMonitor));

    private readonly ILogger<GcpExtractorAutoPullOrchestrator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task RunScheduledPullAsync(CancellationToken cancellationToken)
    {
        int attempted = 0;
        int succeeded = 0;
        int failed = 0;
        int throttled = 0;
        int skippedLocked = 0;

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation("GCP extractor auto-pull pass starting.");
        }

        IReadOnlyList<TenantGcpConnectionRecord> connections = await _connectionRepository
            .ListActiveConnectionsAsync(cancellationToken)
            .ConfigureAwait(false);

        TimeSpan connectionCooldown = ResolveConnectionCooldown();

        foreach (TenantGcpConnectionRecord connection in connections)
        {
            cancellationToken.ThrowIfCancellationRequested();

            TenantRecord? tenant = await _tenantRepository
                .GetByIdAsync(connection.TenantId, cancellationToken)
                .ConfigureAwait(false);

            if (tenant is null || tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
                continue;

            TenantWorkspaceLink? link = await _tenantRepository
                .GetFirstWorkspaceAsync(connection.TenantId, cancellationToken)
                .ConfigureAwait(false);

            if (link is null)
                continue;

            ScopeContext scope = new()
            {
                TenantId = connection.TenantId,
                WorkspaceId = link.WorkspaceId,
                ProjectId = link.DefaultProjectId
            };

            using (AmbientScopeContext.Push(scope))
            {
                string lockResource =
                    $"hosted-gcp-extractor-auto-pull:{connection.TenantId:N}:{connection.ConnectionId:N}";

                IAsyncDisposable? runLock = null;

                try
                {
                    runLock = await _distributedLock
                        .AcquireExclusiveSessionLockAsync(lockResource, LockWaitMilliseconds, cancellationToken)
                        .ConfigureAwait(false);
                }
                catch (TimeoutException)
                {
                    skippedLocked++;

                    if (_logger.IsEnabled(LogLevel.Debug))
                    {
                        _logger.LogDebug(
                            "GCP extractor auto-pull skipped tenant {TenantId} connection {ConnectionId}; lock held.",
                            connection.TenantId,
                            connection.ConnectionId);
                    }

                    continue;
                }

                await using (runLock)
                {
                    attempted++;

                    try
                    {
                        HostedGcpExtractorRunResult result = await _runService
                            .RunAsync(
                                connection.TenantId,
                                connection.ConnectionId,
                                runId: null,
                                SystemActor,
                                correlationId: null,
                                cancellationToken)
                            .ConfigureAwait(false);

                        if (result.Succeeded)
                        {
                            succeeded++;

                            if (_logger.IsEnabled(LogLevel.Information))
                            {
                                _logger.LogInformation(
                                    "GCP extractor auto-pull succeeded for tenant {TenantId} project {ProjectId} ({ResourceCount} resources).",
                                    connection.TenantId,
                                    connection.ProjectId,
                                    result.ResourceCount);
                            }

                            continue;
                        }

                        failed++;

                        if (result.FailureKind == HostedGcpExtractorRunFailureKind.Throttled)
                        {
                            throttled++;

                            if (_logger.IsEnabled(LogLevel.Warning))
                            {
                                _logger.LogWarning(
                                    "GCP extractor auto-pull throttled for tenant {TenantId} project {ProjectId}; continuing pass. Detail: {Detail}",
                                    connection.TenantId,
                                    connection.ProjectId,
                                    result.FailureDetail ?? result.FailureKind.ToString());
                            }

                            continue;
                        }

                        if (_logger.IsEnabled(LogLevel.Warning))
                        {
                            _logger.LogWarning(
                                "GCP extractor auto-pull failed for tenant {TenantId} project {ProjectId}: {Detail}",
                                connection.TenantId,
                                connection.ProjectId,
                                result.FailureDetail ?? result.FailureKind.ToString());
                        }
                    }
                    catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        failed++;

                        if (_logger.IsEnabled(LogLevel.Warning))
                        {
                            _logger.LogWarning(
                                ex,
                                "GCP extractor auto-pull unexpected fault for tenant {TenantId} connection {ConnectionId}; continuing pass.",
                                connection.TenantId,
                                connection.ConnectionId);
                        }
                    }
                }

                if (connectionCooldown > TimeSpan.Zero)
                {
                    await Task.Delay(connectionCooldown, cancellationToken).ConfigureAwait(false);
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "GCP extractor auto-pull pass completed. Attempted={Attempted}, Succeeded={Succeeded}, Failed={Failed}, Throttled={Throttled}, SkippedLocked={SkippedLocked}.",
                attempted,
                succeeded,
                failed,
                throttled,
                skippedLocked);
        }
    }

    private TimeSpan ResolveConnectionCooldown()
    {
        int seconds = Math.Clamp(_autoPullOptionsMonitor.CurrentValue.ConnectionCooldownSeconds, 0, 60);

        return TimeSpan.FromSeconds(seconds);
    }
}
