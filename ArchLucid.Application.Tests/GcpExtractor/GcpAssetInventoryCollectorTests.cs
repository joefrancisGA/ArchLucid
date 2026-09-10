using ArchLucid.Integrations.GcpExtractor;

using FluentAssertions;

using Google.Cloud.Asset.V1;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class GcpAssetInventoryCollectorTests
{
    [Fact]
    public async Task CollectFromRawPagesAsync_maps_results_from_pages()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1",
            AssetType = "compute.googleapis.com/Instance",
            Location = "us-central1-a"
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Name.Should().Contain("instances/i-1");
        resources[0].ResourceType.Should().Be("compute.googleapis.com/Instance");
        resources[0].Location.Should().Be("us-central1-a");
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_throws_after_max_pages()
    {
        Func<Task> act = () => GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            GenerateEmptyPagesAsync(65),
            CancellationToken.None);

        InvalidOperationException exception = (await act.Should().ThrowAsync<InvalidOperationException>()).Which;

        exception.Message.Should().Contain("stopped Asset search listing after 64 pages");
    }

    private static async IAsyncEnumerable<SearchAllResourcesResponse> SinglePageAsync(
        SearchAllResourcesResponse page)
    {
        yield return page;
        await Task.CompletedTask;
    }

    private static async IAsyncEnumerable<SearchAllResourcesResponse> GenerateEmptyPagesAsync(int pageCount)
    {
        for (int index = 0; index < pageCount; index++)
        {
            yield return new SearchAllResourcesResponse();
            await Task.Yield();
        }
    }
}
