using ArchLucid.Integrations.GcpExtractor;

using FluentAssertions;

using Google.Cloud.Asset.V1;

using Moq;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class GcpAssetInventoryCollectorTests
{
    [Fact]
    public async Task CollectAsync_throws_when_project_id_is_whitespace_only()
    {
        Mock<AssetServiceClient> client = new(MockBehavior.Strict);

        Func<Task> act = () => GcpAssetInventoryCollector.CollectAsync(
            client.Object,
            "   ",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

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
    public async Task CollectFromRawPagesAsync_trims_location_when_location_has_bounding_whitespace()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1",
            AssetType = "compute.googleapis.com/Instance",
            Location = " us-central1-a "
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Location.Should().Be("us-central1-a");
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
    public async Task CollectFromRawPagesAsync_retains_empty_resource_type_when_asset_type_is_whitespace_only()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1",
            AssetType = "   ",
            Location = "us-central1-a"
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].ResourceType.Should().BeEmpty();
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
    public async Task CollectFromRawPagesAsync_emits_empty_location_when_location_is_unset()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1",
            AssetType = "compute.googleapis.com/Instance"
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Location.Should().BeEmpty();
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_emits_empty_resource_type_when_asset_type_is_unset()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1",
            Location = "us-central1-a"
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].ResourceType.Should().BeEmpty();
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_retains_empty_location_when_location_is_whitespace_only()
    {
        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1",
            AssetType = "compute.googleapis.com/Instance",
            Location = "   "
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Location.Should().BeEmpty();
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_preserves_internal_whitespace_in_asset_name_after_trim()
    {
        const string nameWithTab =
            "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i\t1";

        SearchAllResourcesResponse page = new();
        page.Results.Add(new ResourceSearchResult
        {
            Name = $"  {nameWithTab}  ",
            AssetType = "compute.googleapis.com/Instance",
            Location = "us-central1-a"
        });

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            SinglePageAsync(page),
            CancellationToken.None);

        resources.Should().ContainSingle();
        resources[0].Name.Should().Be(nameWithTab);
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_retains_duplicate_names_across_pages_without_dedupe()
    {
        const string assetName =
            "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1";

        async IAsyncEnumerable<SearchAllResourcesResponse> PagesAsync()
        {
            for (int pageIndex = 0; pageIndex < 2; pageIndex++)
            {
                SearchAllResourcesResponse page = new();
                page.Results.Add(new ResourceSearchResult
                {
                    Name = assetName,
                    AssetType = "compute.googleapis.com/Instance",
                    Location = "us-central1-a"
                });

                yield return page;
                await Task.Yield();
            }
        }

        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            PagesAsync(),
            CancellationToken.None);

        resources.Should().HaveCount(2);
        resources.Should().OnlyContain(entry => entry.Name == assetName);
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_stops_at_max_pages_without_throwing()
    {
        List<GcpInventoryResourceEntry> resources = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            GenerateEmptyPagesAsync(65),
            CancellationToken.None);

        resources.Should().BeEmpty();
    }

    [Fact]
    public async Task CollectFromRawPagesAsync_counts_empty_pages_toward_pagination_cap_before_data_page()
    {
        async IAsyncEnumerable<SearchAllResourcesResponse> PagesWithResourceAfterEmptyPagesAsync(int emptyPageCount)
        {
            for (int index = 0; index < emptyPageCount; index++)
            {
                yield return new SearchAllResourcesResponse();
                await Task.Yield();
            }

            SearchAllResourcesResponse dataPage = new();
            dataPage.Results.Add(new ResourceSearchResult
            {
                Name = "//compute.googleapis.com/projects/demo/zones/us-central1-a/instances/i-1",
                AssetType = "compute.googleapis.com/Instance",
                Location = "us-central1-a"
            });

            yield return dataPage;
            await Task.Yield();
        }

        List<GcpInventoryResourceEntry> withinCap = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            PagesWithResourceAfterEmptyPagesAsync(63),
            CancellationToken.None);

        withinCap.Should().ContainSingle();
        withinCap[0].Name.Should().Contain("instances/i-1");

        List<GcpInventoryResourceEntry> beyondCap = await GcpAssetInventoryCollector.CollectFromRawPagesAsync(
            PagesWithResourceAfterEmptyPagesAsync(64),
            CancellationToken.None);

        beyondCap.Should().BeEmpty();
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
