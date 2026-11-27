using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;

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
    IOptionsMonitor<HostedAzureExtractorOptions> optionsMonitor,
    TimeProvider? timeProvider = null) : IHostedAzureExtractorRunService
{
    private readonly ITenantHostedExtractorConfigurationRepository _configurationRepository =
        configurationRepository ?? throw new ArgumentNullException(nameof(configurationRepository));

    private readonly IHostedAzureExtractorClient _hostedClient =
        hostedClient ?? throw new ArgumentNullException(nameof(hostedClient));

    private readonly IAzureExtractorIngestService _ingestService =
        ingestService ?? throw new ArgumentNullException(nameof(ingestService));

    private readonly IOptionsMonitor<HostedAzureExtractorOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<HostedAzureExtractorRunResult> RunAsync(
        Guid tenantId,
        string subscriptionId,
        Guid? runId,
        string actorId,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        HostedAzureExtractorOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled)
            return HostedAzureExtractorRunResult.CreateFeatureDisabled();

        TenantHostedExtractorConfigurationRecord? configuration = await _configurationRepository
            .TryGetAsync(tenantId, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (configuration is null)
            return HostedAzureExtractorRunResult.CreateNotConfigured();

        cancellationToken.ThrowIfCancellationRequested();
        TimeSpan budget = options.GetEffectiveCollectionTimeout();
        long collectionStartedAt = _timeProvider.GetTimestamp();
        HostedAzureExtractorCollectionResult collection;

        using (CancellationTokenSource deadline = new(budget, _timeProvider))
        using (CancellationTokenSource collectionCancellation =
            CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, deadline.Token))
        {
            try
            {
                collection = await _hostedClient
                    .CollectZipAsync(
                        new HostedAzureExtractorCollectionRequest
                        {
                            CustomerTenantId = configuration.CustomerTenantId,
                            CustomerAppId = configuration.CustomerAppId,
                            SubscriptionId = configuration.SubscriptionId,
                            IncludeCost = configuration.IncludeCost,
                            IncludeAppSettingsHosts = true,
                        },
                        collectionCancellation.Token)
                    .ConfigureAwait(false);

                cancellationToken.ThrowIfCancellationRequested();

                if (CollectionDeadlineExpired(deadline, collectionStartedAt, budget))
                {
                    // A collector that did not observe cancellation can still finish with a late package.
                    return CollectionTimeout(budget);
                }
            }
            catch (Exception ex) when (ex is OperationCanceledException or HttpRequestException
                                       || HostedAzureExtractorHttpFailureClassifier.IsArmThrottled(ex))
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (CollectionDeadlineExpired(deadline, collectionStartedAt, budget))
                    return CollectionTimeout(budget);

                if (HostedAzureExtractorHttpFailureClassifier.IsArmThrottled(ex))
                {
                    return HostedAzureExtractorRunResult.CreateThrottled(
                        HostedAzureExtractorHttpFailureClassifier.Describe(ex));
                }

                if (ex is HttpRequestException)
                {
                    return HostedAzureExtractorRunResult.CreateCollectionFailed(
                        HostedAzureExtractorHttpFailureClassifier.Describe(ex));
                }

                throw;
            }
        }

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

    private bool CollectionDeadlineExpired(CancellationTokenSource deadline, long startedAt, TimeSpan budget) =>
        deadline.IsCancellationRequested || _timeProvider.GetElapsedTime(startedAt) >= budget;

    private static HostedAzureExtractorRunResult CollectionTimeout(TimeSpan budget) =>
        HostedAzureExtractorRunResult.CreateCollectionFailed(
            $"Hosted Azure collection exceeded its {budget.TotalSeconds:0}-second deadline. No package was ingested.");
}
