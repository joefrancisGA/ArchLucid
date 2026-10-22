using System.Collections.Concurrent;

using ArchLucid.Core.Tenancy;

using Azure.Core;

using Azure.Storage.Blobs;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.BlobStore;

/// <summary>Builds or memoizes Azure <see cref="BlobServiceClient" /> instances for primary and regional ArtifactLargePayload binds.</summary>
public sealed class RegionalArtifactBlobClientFactory(
    IOptionsMonitor<ArtifactLargePayloadOptions> optionsMonitor,
    TokenCredential credential)
{
    private readonly IOptionsMonitor<ArtifactLargePayloadOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly TokenCredential _credential = credential ?? throw new ArgumentNullException(nameof(credential));

    private readonly ConcurrentDictionary<string, BlobServiceClient> _regionalMemo = new(StringComparer.OrdinalIgnoreCase);

    private string? _defaultMemoUriText;

    private BlobServiceClient? _defaultMemoClient;

    public BlobServiceClient Resolve(string normalizedTenantDataRegion)
    {
        ArtifactLargePayloadOptions snapshot = _optionsMonitor.CurrentValue;

        if (!string.Equals(snapshot.BlobProvider, "AzureBlob", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException(
                $"Regional ArtifactLargePayload routing requires ArtifactLargePayload BlobProvider AzureBlob (current '{snapshot.BlobProvider}').");

        string trimmedDefault = snapshot.AzureBlobServiceUri.Trim();

        if (trimmedDefault.Length == 0)
            throw new InvalidOperationException(
                "ArtifactLargePayload AzureBlob residency routing requires ArtifactLargePayload:AzureBlobServiceUri.");

        string region = TenantDataRegions.NormalizeOptional(normalizedTenantDataRegion);

        if (region == TenantDataRegions.Default)
            return MemoDefault(trimmedDefault);

        if (snapshot.AzureBlobServiceUriByRegion is null || snapshot.AzureBlobServiceUriByRegion.Count == 0)
            throw new InvalidOperationException(
                $"Tenant DataRegion '{region}' maps to a dedicated ArtifactLargePayload storage URI, "
                + "but ArtifactLargePayload:AzureBlobServiceUriByRegion is empty. Populate a lowercase regional key → service URI.");

        Uri? mapped = FindRegionalUri(snapshot.AzureBlobServiceUriByRegion, region);

        if (mapped is null)
            throw new InvalidOperationException(
                $"Tenant DataRegion '{region}' requires ArtifactLargePayload:AzureBlobServiceUriByRegion:{region}.");

        string memoUri = mapped.AbsoluteUri.Trim();

        return _regionalMemo.GetOrAdd(region, CreateClient(memoUri));
    }

    private BlobServiceClient MemoDefault(string trimmedDefaultUri)
    {
        if (_defaultMemoClient is not null && string.Equals(_defaultMemoUriText, trimmedDefaultUri, StringComparison.Ordinal))
            return _defaultMemoClient;

        BlobServiceClient created = CreateClient(trimmedDefaultUri);
        _defaultMemoUriText = trimmedDefaultUri;
        _defaultMemoClient = created;

        return created;
    }

    private BlobServiceClient CreateClient(string absoluteUriTrimmed)

        => new(new Uri(absoluteUriTrimmed, UriKind.Absolute), _credential);

    private static Uri? FindRegionalUri(IReadOnlyDictionary<string, string> configured, string normalizedRegionLower)
    {
        foreach (KeyValuePair<string, string> pair in configured)
        {
            if (string.IsNullOrWhiteSpace(pair.Key) || string.IsNullOrWhiteSpace(pair.Value))

                continue;

            string keyNormalized = TenantDataRegions.Normalize(pair.Key);

            if (keyNormalized.Equals(normalizedRegionLower, StringComparison.Ordinal))
                return new Uri(pair.Value.Trim(), UriKind.Absolute);
        }

        return null;
    }
}
