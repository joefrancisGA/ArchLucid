using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.AzureExtractor;

public interface IAzureExtractorAutoPullOrchestrator
{
    Task RunScheduledPullAsync(CancellationToken cancellationToken);
}

/// <summary>Iterates tenants with hosted extractor configuration and runs Tier-2 pull (Batch 6).</summary>
public sealed class AzureExtractorAutoPullOrchestrator(
    ITenantRepository tenantRepository,
    ITenantHostedExtractorConfigurationRepository configurationRepository,
    IHostedAzureExtractorRunService runService,
    ILogger<AzureExtractorAutoPullOrchestrator> logger) : IAzureExtractorAutoPullOrchestrator
{
    private const string SystemActor = "hosted:azure-extractor-auto-pull";

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantHostedExtractorConfigurationRepository _configurationRepository =
        configurationRepository ?? throw new ArgumentNullException(nameof(configurationRepository));

    private readonly IHostedAzureExtractorRunService _runService =
        runService ?? throw new ArgumentNullException(nameof(runService));

    private readonly ILogger<AzureExtractorAutoPullOrchestrator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task RunScheduledPullAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<TenantRecord> tenants = await _tenantRepository.ListAsync(cancellationToken);

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

                    HostedAzureExtractorRunResult result = await _runService
                        .RunAsync(
                            tenant.Id,
                            config.SubscriptionId,
                            runId: null,
                            SystemActor,
                            correlationId: null,
                            cancellationToken)
                        .ConfigureAwait(false);

                    if (_logger.IsEnabled(LogLevel.Information) && result.Succeeded)
                    {
                        _logger.LogInformation(
                            "Azure extractor auto-pull succeeded for tenant {TenantId} subscription {SubscriptionId} ({ResourceCount} resources).",
                            tenant.Id,
                            config.SubscriptionId,
                            result.ResourceCount);
                    }

                    if (!result.Succeeded && _logger.IsEnabled(LogLevel.Warning))
                    {
                        _logger.LogWarning(
                            "Azure extractor auto-pull failed for tenant {TenantId} subscription {SubscriptionId}: {Detail}",
                            tenant.Id,
                            config.SubscriptionId,
                            result.FailureDetail ?? result.FailureKind.ToString());
                    }
                }
            }
        }
    }
}
