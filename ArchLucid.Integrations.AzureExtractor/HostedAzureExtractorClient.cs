using ArchLucid.Contracts.Abstractions.Integrations;

using Azure.Core;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureExtractorClient(
    IHostedAzureExtractorCredentialFactory credentialFactory,
    IHostedAzureArmReadClient armReadClient,
    ILogger<HostedAzureExtractorClient> logger) : IHostedAzureExtractorClient
{
    private const string ManagementScope = "https://management.azure.com/.default";

    private readonly IHostedAzureExtractorCredentialFactory _credentialFactory =
        credentialFactory ?? throw new ArgumentNullException(nameof(credentialFactory));

    private readonly IHostedAzureArmReadClient _armReadClient =
        armReadClient ?? throw new ArgumentNullException(nameof(armReadClient));

    private readonly ILogger<HostedAzureExtractorClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<HostedAzureExtractorCollectionResult> CollectZipAsync(
        HostedAzureExtractorCollectionRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        HostedAzureExtractorGuidValidator.RequireCollectionRequestGuids(request);

        TokenCredential credential = _credentialFactory.CreateCredential(
            request.CustomerTenantId,
            request.CustomerAppId);

        AccessToken accessToken = await credential
            .GetTokenAsync(new TokenRequestContext([ManagementScope]), cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await _armReadClient
            .ListSubscriptionResourcesAsync(accessToken.Token, request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (request.IncludeCost && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Hosted Azure extractor skipping Cost Management merge for subscription {SubscriptionId}; hosted path is GET-only on management.azure.com.",
                request.SubscriptionId);
        }

        DateTimeOffset collectionTimestampUtc = TimeProvider.System.GetUtcNow();

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            request.SubscriptionId,
            resources,
            request.IncludeCost,
            collectionTimestampUtc);

        string fileName =
            $"archlucid-hosted-azure-{request.SubscriptionId.Trim().ToLowerInvariant()}-{collectionTimestampUtc:yyyyMMddHHmmss}.zip";

        return new HostedAzureExtractorCollectionResult
        {
            ZipBytes = zipBytes,
            OriginalFileName = fileName,
            ResourceCount = resources.Count
        };
    }
}
