using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Abstractions.Integrations;

using Google.Apis.Auth.OAuth2;
using Google.Cloud.Asset.V1;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.GcpExtractor;

[ExcludeFromCodeCoverage]
public sealed class HostedGcpExtractorClient(
    GcpWorkloadIdentityCredentialFactory credentialFactory,
    ILogger<HostedGcpExtractorClient> logger) : IHostedGcpExtractorClient
{
    private readonly GcpWorkloadIdentityCredentialFactory _credentialFactory =
        credentialFactory ?? throw new ArgumentNullException(nameof(credentialFactory));

    private readonly ILogger<HostedGcpExtractorClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<HostedGcpExtractorCollectionResult> CollectZipAsync(
        HostedGcpExtractorCollectionRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ProjectId);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.WorkloadIdentityPoolProvider);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ServiceAccountEmail);

        string projectId = request.ProjectId.Trim();
        string serviceAccountEmail = request.ServiceAccountEmail.Trim();

        GcpServiceAccountEmail.EnsureProjectMatches(projectId, serviceAccountEmail);
        GcpWorkloadIdentityPoolProvider.EnsureProjectMatches(projectId, request.WorkloadIdentityPoolProvider);

        GoogleCredential credential = _credentialFactory.CreateImpersonatedCredential(
            request.WorkloadIdentityPoolProvider,
            serviceAccountEmail);

        AssetServiceClient client = await new AssetServiceClientBuilder
        {
            Credential = credential
        }.BuildAsync(cancellationToken).ConfigureAwait(false);

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectAsync(
                client,
                projectId,
                cancellationToken)
            .ConfigureAwait(false);

        string collectorVersion = typeof(HostedGcpExtractorClient).Assembly.GetName().Version?.ToString() ?? "1.0.0";

        byte[] zipBytes = GcpInventoryZipPackager.BuildZip(
            projectId,
            collectorVersion,
            resources);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Hosted GCP extractor collected {ResourceCount} resources for project {ProjectId}.",
                resources.Count,
                projectId);
        }

        return new HostedGcpExtractorCollectionResult
        {
            ZipBytes = zipBytes,
            OriginalFileName = $"archlucid-gcp-{projectId}.zip",
            ResourceCount = resources.Count
        };
    }

}
