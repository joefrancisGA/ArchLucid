using ArchLucid.Api.Controllers;
using ArchLucid.Application.Search;
using ArchLucid.Core.Search;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SearchControllerTests
{
    [Fact]
    public async Task SearchAsync_maps_service_result_to_response()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid policyPackId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DateTimeOffset createdUtc = DateTimeOffset.Parse("2026-06-01T12:00:00Z");

        GlobalSearchResult searchResult = new()
        {
            Runs =
            [
                new GlobalSearchRunHit
                {
                    RunId = runId,
                    Description = "Pilot run",
                    AuthorityProjectSlug = "core-pilot",
                    CreatedUtc = createdUtc
                }
            ],
            Findings =
            [
                new GlobalSearchFindingHit
                {
                    RunId = runId,
                    FindingId = "finding-1",
                    Title = "Open port",
                    Severity = "High"
                }
            ],
            PolicyPacks =
            [
                new GlobalSearchPolicyPackHit
                {
                    PolicyPackId = policyPackId,
                    Name = "Baseline",
                    IsCatalogEntry = true
                }
            ]
        };

        Mock<IGlobalSearchService> searchService = new();
        searchService
            .Setup(s => s.SearchAsync("network", 8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(searchResult);

        SearchController controller = new(searchService.Object);

        IActionResult action = await controller.SearchAsync("network", take: 8, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        GlobalSearchResponse response = ok.Value.Should().BeOfType<GlobalSearchResponse>().Subject;

        response.Runs.Should().ContainSingle();
        response.Runs[0].RunId.Should().Be(runId);
        response.Runs[0].Description.Should().Be("Pilot run");
        response.Findings.Should().ContainSingle();
        response.Findings[0].FindingId.Should().Be("finding-1");
        response.PolicyPacks.Should().ContainSingle();
        response.PolicyPacks[0].PolicyPackId.Should().Be(policyPackId);
    }

    [Fact]
    public async Task SearchAsync_null_query_uses_empty_string()
    {
        Mock<IGlobalSearchService> searchService = new();
        searchService
            .Setup(s => s.SearchAsync(string.Empty, 5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlobalSearchResult());

        SearchController controller = new(searchService.Object);

        IActionResult action = await controller.SearchAsync(q: null, take: 5, CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        searchService.Verify(
            s => s.SearchAsync(string.Empty, 5, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
