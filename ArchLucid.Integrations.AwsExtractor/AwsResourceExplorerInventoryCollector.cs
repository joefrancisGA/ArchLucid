using Amazon.ResourceExplorer2;
using Amazon.ResourceExplorer2.Model;

namespace ArchLucid.Integrations.AwsExtractor;

internal static class AwsResourceExplorerInventoryCollector
{
    public const int MaxResultsPerSearch = 50;
    private const int MaxPaginationRequests = 64;

    public static async Task<List<AwsInventoryResourceEntry>> CollectAsync(
        IAmazonResourceExplorer2 explorerClient,
        string regionSystemName,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(explorerClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(regionSystemName);

        List<AwsInventoryResourceEntry> resources = [];
        string? nextToken = null;
        string queryString = AwsResourceExplorerQueryString.ResolveForRegion(regionSystemName);
        HashSet<string> visitedTokens = new(StringComparer.Ordinal);
        int requestCount = 0;

        do
        {
            if (!string.IsNullOrEmpty(nextToken))
            {
                if (!visitedTokens.Add(nextToken))
                {
                    throw new InvalidOperationException(
                        "Hosted AWS extractor stopped Resource Explorer listing due to repeating NextToken.");
                }
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted AWS extractor stopped Resource Explorer listing after {MaxPaginationRequests} pages.");
            }

            SearchResponse response = await explorerClient
                .SearchAsync(
                    new SearchRequest
                    {
                        QueryString = queryString,
                        MaxResults = MaxResultsPerSearch,
                        NextToken = nextToken
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            if (response.Resources is not null)
            {
                foreach (Resource resource in response.Resources)
                {
                    string location = ResolveResourceLocation(resource, regionSystemName);

                    resources.Add(new AwsInventoryResourceEntry(
                        resource.Arn ?? string.Empty,
                        resource.ResourceType ?? string.Empty,
                        location,
                        null));
                }
            }

            nextToken = response.NextToken;
        }
        while (!string.IsNullOrEmpty(nextToken));

        return resources;
    }

    private static string ResolveResourceLocation(Resource resource, string connectionRegionSystemName)
    {
        if (!string.IsNullOrWhiteSpace(resource.Region))
        {
            return resource.Region;
        }

        return connectionRegionSystemName;
    }
}
