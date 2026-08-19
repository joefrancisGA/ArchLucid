using System.Diagnostics.CodeAnalysis;

using Amazon;
using Amazon.ResourceExplorer2;
using Amazon.ResourceExplorer2.Model;
using Amazon.Runtime;
using Amazon.SecurityToken;
using Amazon.SecurityToken.Model;

using ArchLucid.Contracts.Abstractions.Integrations;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AwsExtractor;

[ExcludeFromCodeCoverage]
public sealed class HostedAwsExtractorClient(
    IAwsOidcWebIdentityTokenProvider webIdentityTokenProvider,
    ILogger<HostedAwsExtractorClient> logger) : IHostedAwsExtractorClient
{
    private const int MaxResultsPerSearch = 50;

    private readonly IAwsOidcWebIdentityTokenProvider _webIdentityTokenProvider =
        webIdentityTokenProvider ?? throw new ArgumentNullException(nameof(webIdentityTokenProvider));

    private readonly ILogger<HostedAwsExtractorClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<HostedAwsExtractorCollectionResult> CollectZipAsync(
        HostedAwsExtractorCollectionRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.AccountId);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Region);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.RoleArn);

        string webIdentityToken = await _webIdentityTokenProvider
            .GetWebIdentityTokenAsync(cancellationToken)
            .ConfigureAwait(false);

        RegionEndpoint region = RegionEndpoint.GetBySystemName(request.Region.Trim());

        SessionAWSCredentials sessionCredentials = await AssumeRoleAsync(
                request.RoleArn.Trim(),
                webIdentityToken,
                region,
                cancellationToken)
            .ConfigureAwait(false);

        List<AwsInventoryResourceEntry> resources = await SearchResourcesAsync(
                sessionCredentials,
                region,
                cancellationToken)
            .ConfigureAwait(false);

        string collectorVersion = typeof(HostedAwsExtractorClient).Assembly.GetName().Version?.ToString() ?? "1.0.0";

        byte[] zipBytes = AwsInventoryZipPackager.BuildZip(
            request.AccountId.Trim(),
            collectorVersion,
            resources);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Hosted AWS extractor collected {ResourceCount} resources for account {AccountId} in {Region}.",
                resources.Count,
                request.AccountId,
                request.Region);
        }

        return new HostedAwsExtractorCollectionResult
        {
            ZipBytes = zipBytes,
            OriginalFileName = $"archlucid-aws-{request.AccountId.Trim()}.zip",
            ResourceCount = resources.Count
        };
    }

    private static async Task<SessionAWSCredentials> AssumeRoleAsync(
        string roleArn,
        string webIdentityToken,
        RegionEndpoint region,
        CancellationToken cancellationToken)
    {
        using AmazonSecurityTokenServiceClient stsClient = new(RegionEndpoint.USEast1);

        AssumeRoleWithWebIdentityResponse response = await stsClient
            .AssumeRoleWithWebIdentityAsync(
                new AssumeRoleWithWebIdentityRequest
                {
                    RoleArn = roleArn,
                    RoleSessionName = "archlucid-aws-extractor",
                    WebIdentityToken = webIdentityToken,
                    DurationSeconds = 3600
                },
                cancellationToken)
            .ConfigureAwait(false);

        if (response.Credentials is null)
            throw new InvalidOperationException("AWS STS AssumeRoleWithWebIdentity returned no credentials.");

        return new SessionAWSCredentials(
            response.Credentials.AccessKeyId,
            response.Credentials.SecretAccessKey,
            response.Credentials.SessionToken);
    }

    private static async Task<List<AwsInventoryResourceEntry>> SearchResourcesAsync(
        SessionAWSCredentials sessionCredentials,
        RegionEndpoint region,
        CancellationToken cancellationToken)
    {
        using AmazonResourceExplorer2Client explorerClient = new(sessionCredentials, region);

        SearchResponse response = await explorerClient
            .SearchAsync(
                new SearchRequest
                {
                    QueryString = "arn:aws:*",
                    MaxResults = MaxResultsPerSearch
                },
                cancellationToken)
            .ConfigureAwait(false);

        List<AwsInventoryResourceEntry> resources = new();

        if (response.Resources is null)
            return resources;

        foreach (Resource resource in response.Resources)
        {
            resources.Add(new AwsInventoryResourceEntry(
                resource.Arn ?? string.Empty,
                resource.ResourceType ?? string.Empty,
                region.SystemName,
                null));
        }

        return resources;
    }
}
