using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Integrations.AzureExtractor;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AzureExtractor;

public interface IHostedAzureExtractorRunService
{
    Task<HostedAzureExtractorRunResult> RunAsync(
        Guid tenantId,
        string subscriptionId,
        Guid? runId,
        string actorId,
        string? correlationId,
        CancellationToken cancellationToken);
}

public sealed class HostedAzureExtractorRunService(
    ITenantHostedExtractorConfigurationRepository configurationRepository,
    IHostedAzureExtractorClient hostedClient,
    IAzureExtractorIngestService ingestService,
    IOptionsMonitor<HostedAzureExtractorOptions> optionsMonitor) : IHostedAzureExtractorRunService
{
    private readonly ITenantHostedExtractorConfigurationRepository _configurationRepository =
        configurationRepository ?? throw new ArgumentNullException(nameof(configurationRepository));

    private readonly IHostedAzureExtractorClient _hostedClient =
        hostedClient ?? throw new ArgumentNullException(nameof(hostedClient));

    private readonly IAzureExtractorIngestService _ingestService =
        ingestService ?? throw new ArgumentNullException(nameof(ingestService));

    private readonly IOptionsMonitor<HostedAzureExtractorOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public async Task<HostedAzureExtractorRunResult> RunAsync(
        Guid tenantId,
        string subscriptionId,
        Guid? runId,
        string actorId,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        if (!_optionsMonitor.CurrentValue.Enabled)
            return HostedAzureExtractorRunResult.CreateFeatureDisabled();

        TenantHostedExtractorConfigurationRecord? configuration = await _configurationRepository
            .TryGetAsync(tenantId, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (configuration is null)
            return HostedAzureExtractorRunResult.CreateNotConfigured();

        HostedAzureExtractorCollectionResult collection = await _hostedClient
            .CollectZipAsync(
                new HostedAzureExtractorCollectionRequest
                {
                    CustomerTenantId = configuration.CustomerTenantId,
                    CustomerAppId = configuration.CustomerAppId,
                    SubscriptionId = configuration.SubscriptionId,
                    IncludeCost = configuration.IncludeCost
                },
                cancellationToken)
            .ConfigureAwait(false);

        AzureExtractorIngestResult ingestResult = await _ingestService
            .IngestZipBytesAsync(
                collection.ZipBytes,
                collection.OriginalFileName,
                runId,
                cancellationToken,
                correlationId,
                AzureExtractorUploadLimits.MaxZipBytes)
            .ConfigureAwait(false);

        if (!ingestResult.Succeeded)
        {
            return HostedAzureExtractorRunResult.CreateIngestFailed(
                ingestResult.FailureDetail ?? "Hosted extractor ingest failed.");
        }

        return HostedAzureExtractorRunResult.CreateSuccess(
            ingestResult.PackageId!.Value,
            collection.ResourceCount);
    }
}
