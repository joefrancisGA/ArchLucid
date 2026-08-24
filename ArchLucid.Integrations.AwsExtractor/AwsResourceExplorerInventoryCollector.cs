using Amazon.ResourceExplorer2;
using Amazon.ResourceExplorer2.Model;

namespace ArchLucid.Integrations.AwsExtractor;

internal static class AwsResourceExplorerInventoryCollector
{
    public const int MaxResultsPerSearch = 50;

    public static async Task<List<AwsInventoryResourceEntry>> CollectAsync(
        IAmazonResourceExplorer2 explorerClient,
        string regionSystemName,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(explorerClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(regionSystemName);

        List<AwsInventoryResourceEntry> resources = [];
        string? nextToken = null;

        do
        {
            SearchResponse response = await explorerClient
                .SearchAsync(
                    new SearchRequest
                    {
                        QueryString = "arn:aws:*",
                        MaxResults = MaxResultsPerSearch,
                        NextToken = nextToken
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            if (response.Resources is not null)
            {
                foreach (Resource resource in response.Resources)
                {
                    resources.Add(new AwsInventoryResourceEntry(
                        resource.Arn ?? string.Empty,
                        resource.ResourceType ?? string.Empty,
                        regionSystemName,
                        null));
                }
            }

            nextToken = response.NextToken;
        }
        while (!string.IsNullOrEmpty(nextToken));

        return resources;
    }
}
