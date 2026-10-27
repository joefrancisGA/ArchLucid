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
    public async Task CollectFromRawPagesAsync_omits_resources_without_name()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = string.Empty,
            AssetType = "compute.googleapis.com/Instance",
            Location = "us-central1-a"
        });
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
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_omits_resources_when_name_is_whitespace_only()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "   ",
            AssetType = "compute.googleapis.com/Instance",
            Location = "us-central1-a"
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().BeEmpty();
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_trims_asset_type_when_asset_type_has_bounding_whitespace()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1",
            AssetType = " compute.googleapis.com/Instance ",
            Location = "us-central1-a"
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].ResourceType.Should().Be("compute.googleapis.com/Instance");
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_retains_resource_when_name_is_only_path_separators()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "///",
            AssetType = "compute.googleapis.com/Instance",
            Location = "us-central1-a"
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Name.Should().Be("///");
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_retains_resources_when_max_pagination_limit_reached()
    {
        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            GeneratePagesWithOneResourceAsync(65),
            CancellationToken.None);

        resources.Should().HaveCount(64);
        resources[0].Name.Should().Contain("instances/i-1");
        resources[^1].Name.Should().Contain("instances/i-64");
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_stops_at_max_pages_without_throwing()
    {
        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            GenerateEmptyPagesAsync(65),
            CancellationToken.None);

        resources.Should().BeEmpty();
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

    private static async IAsyncEnumerable<SearchAllResourcesResponse> GeneratePagesWithOneResourceAsync(int pageCount)
    {
        for (int index = 0; index < pageCount; index++)
        {
            SearchAllResourcesResponse page = new();
            page.Results.Add(new ResourceSearchResult
            {
                Name = $"//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-{index + 1}",
                AssetType = "compute.googleapis.com/Instance",
                Location = "us-central1-a"
            });

            yield return page;
            await Task.Yield();
        }
    }
}
