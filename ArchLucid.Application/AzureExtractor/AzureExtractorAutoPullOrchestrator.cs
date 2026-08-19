using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AzureExtractor;

public interface IAzureExtractorAutoPullOrchestrator
{
    Task RunScheduledPullAsync(CancellationToken cancellationToken);
}

/// <summary>Iterates tenants with hosted extractor configuration and runs Tier-2 pull under per-subscription locks.</summary>
public sealed class AzureExtractorAutoPullOrchestrator(
    ITenantRepository tenantRepository,
    ITenantHostedExtractorConfigurationRepository configurationRepository,
    IHostedAzureExtractorRunService runService,
    IDistributedCreateRunIdempotencyLock distributedLock,
    IOptionsMonitor<AzureExtractorAutoPullOptions> autoPullOptionsMonitor,
    ILogger<AzureExtractorAutoPullOrchestrator> logger) : IAzureExtractorAutoPullOrchestrator
{
    private const string SystemActor = "hosted:azure-extractor-auto-pull";

    private const int LockWaitMilliseconds = 0;

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantHostedExtractorConfigurationRepository _configurationRepository =
        configurationRepository ?? throw new ArgumentNullException(nameof(configurationRepository));

    private readonly IHostedAzureExtractorRunService _runService =
        runService ?? throw new ArgumentNullException(nameof(runService));

    private readonly IDistributedCreateRunIdempotencyLock _distributedLock =
        distributedLock ?? throw new ArgumentNullException(nameof(distributedLock));

    private readonly IOptionsMonitor<AzureExtractorAutoPullOptions> _autoPullOptionsMonitor =
        autoPullOptionsMonitor ?? throw new ArgumentNullException(nameof(autoPullOptionsMonitor));

    private readonly ILogger<AzureExtractorAutoPullOrchestrator> _logger =
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
            _logger.LogInformation("Azure extractor auto-pull pass starting.");
        }

        IReadOnlyList<TenantRecord> tenants = await _tenantRepository.ListAsync(cancellationToken);
        TimeSpan subscriptionCooldown = ResolveSubscriptionCooldown();

        foreach (TenantRecord tenant in tenants)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
                continue;

            TenantWorkspaceLink? link = await _tenantRepository.GetFirstWorkspaceAsync(tenant.Id, cancellationToken);

            if (link is null)
                continue;

            ScopeContext scope = new()
            {
                TenantId = tenant.Id,
                WorkspaceId = link.WorkspaceId,
                ProjectId = link.DefaultProjectId
            };

            using (AmbientScopeContext.Push(scope))
            {
                IReadOnlyList<TenantHostedExtractorConfigurationRecord> configs =
                    await _configurationRepository.ListByTenantAsync(tenant.Id, cancellationToken);

                foreach (TenantHostedExtractorConfigurationRecord config in configs)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    string lockResource =
                        $"hosted-azure-extractor-auto-pull:{tenant.Id:N}:{config.SubscriptionId}";

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
                                "Azure extractor auto-pull skipped tenant {TenantId} subscription {SubscriptionId}; another run holds the lock.",
                                tenant.Id,
                                config.SubscriptionId);
                        }

                        continue;
                    }

                    await using (runLock)
                    {
                        attempted++;

                        try
                        {
                            HostedAzureExtractorRunResult result = await _runService
                                .RunAsync(
                                    tenant.Id,
                                    config.SubscriptionId,
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
                                        "Azure extractor auto-pull succeeded for tenant {TenantId} subscription {SubscriptionId} ({ResourceCount} resources).",
                                        tenant.Id,
                                        config.SubscriptionId,
                                        result.ResourceCount);
                                }

                                continue;
                            }

                            failed++;

                            if (result.FailureKind == HostedAzureExtractorRunFailureKind.Throttled)
                            {
                                throttled++;

                                if (_logger.IsEnabled(LogLevel.Warning))
                                {
                                    _logger.LogWarning(
                                        "Azure extractor auto-pull throttled for tenant {TenantId} subscription {SubscriptionId} after ARM retries; continuing pass. Detail: {Detail}",
                                        tenant.Id,
                                        config.SubscriptionId,
                                        result.FailureDetail ?? result.FailureKind.ToString());
                                }

                                continue;
                            }

                            if (_logger.IsEnabled(LogLevel.Warning))
                            {
                                _logger.LogWarning(
                                    "Azure extractor auto-pull failed for tenant {TenantId} subscription {SubscriptionId}: {Detail}",
                                    tenant.Id,
                                    config.SubscriptionId,
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
                                    "Azure extractor auto-pull unexpected fault for tenant {TenantId} subscription {SubscriptionId}; continuing pass.",
                                    tenant.Id,
                                    config.SubscriptionId);
                            }
                        }
                    }

                    if (subscriptionCooldown > TimeSpan.Zero)
                    {
                        await Task.Delay(subscriptionCooldown, cancellationToken).ConfigureAwait(false);
                    }
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Azure extractor auto-pull pass completed. Attempted={Attempted}, Succeeded={Succeeded}, Failed={Failed}, Throttled={Throttled}, SkippedLocked={SkippedLocked}.",
                attempted,
                succeeded,
                failed,
                throttled,
                skippedLocked);
        }
    }

    private TimeSpan ResolveSubscriptionCooldown()
    {
        int seconds = Math.Clamp(_autoPullOptionsMonitor.CurrentValue.SubscriptionCooldownSeconds, 0, 60);

        return TimeSpan.FromSeconds(seconds);
    }
}
