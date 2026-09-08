using Google.Api.Gax;
using Google.Cloud.Asset.V1;

namespace ArchLucid.Integrations.GcpExtractor;

internal static class GcpAssetInventoryCollector
{
    public const int MaxResultsPerSearch = 50;
    private const int MaxPaginationRequests = 64;

    public static async Task<List<GcpInventoryResourceEntry>> CollectAsync(
        AssetServiceClient client,
        string projectId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(projectId);

        SearchAllResourcesRequest request = new()
        {
            Scope = $"projects/{projectId}",
            PageSize = MaxResultsPerSearch
        };

        PagedAsyncEnumerable<SearchAllResourcesResponse, ResourceSearchResult> paged =
            client.SearchAllResourcesAsync(request);

        return await CollectFromRawPagesAsync(
                paged.AsRawResponses(),
                cancellationToken)
            .ConfigureAwait(false);
    }

    internal static async Task<List<GcpInventoryResourceEntry>> CollectFromRawPagesAsync(
        IAsyncEnumerable<SearchAllResourcesResponse> pages,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(pages);

        List<GcpInventoryResourceEntry> resources = [];
        int requestCount = 0;

        await foreach (SearchAllResourcesResponse page in pages.WithCancellation(cancellationToken).ConfigureAwait(false))
        {
            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted GCP extractor stopped Asset search listing after {MaxPaginationRequests} pages.");
            }

            foreach (ResourceSearchResult item in page.Results)
            {
                resources.Add(new GcpInventoryResourceEntry(
                    item.Name ?? string.Empty,
                    item.AssetType ?? string.Empty,
                    item.Location ?? string.Empty,
                    null));
            }
        }

        return resources;
    }
}
