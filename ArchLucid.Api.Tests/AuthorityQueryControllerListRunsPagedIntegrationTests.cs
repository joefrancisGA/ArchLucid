using System.Net;

using ArchLucid.Api.Contracts;
using ArchLucid.Core.Pagination;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <see cref="ArchLucid.Api.Controllers.Authority.AuthorityQueryController.ListRunsByProject" />:
///     <see cref="CursorPagedResponse{T}" /> (keyset + legacy page/size clamping) after a committed authority run exists.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AuthorityQueryControllerListRunsPagedIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ListRunsByProject_without_page_returns_cursor_paged_envelope()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/projects/{Uri.EscapeDataString(finalized.SystemName)}/reviews?take=20");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        CursorPagedResponse<RunSummaryResponse> body =
            await response.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(JsonOptions);

        body.Items.Should().NotBeEmpty();
        body.RequestedTake.Should().Be(20);
    }

    [SkippableFact]
    public async Task ListRunsByProject_with_legacy_page_size_clamps_requested_take()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        HttpResponseMessage response = await Client.GetAsync(
            $"/v1/authority/projects/{Uri.EscapeDataString(finalized.SystemName)}/reviews?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        CursorPagedResponse<RunSummaryResponse> body =
            await response.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(JsonOptions);

        body.Items.Should().NotBeEmpty();
        body.RequestedTake.Should().Be(10);
    }

    [SkippableFact]
    public async Task ListRunsInScope_includes_run_hidden_from_default_project_slug()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        HttpResponseMessage defaultSlugResponse =
            await Client.GetAsync("/v1/authority/projects/default/reviews?take=50");
        defaultSlugResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        CursorPagedResponse<RunSummaryResponse> defaultPage =
            await defaultSlugResponse.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(JsonOptions);

        defaultPage.Items.Any(item => item.RunId == finalized.RunGuid)
            .Should()
            .BeFalse("create maps SystemName onto the run project slug, not 'default'");

        HttpResponseMessage scopeResponse = await Client.GetAsync("/v1/authority/reviews?take=50");
        scopeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        CursorPagedResponse<RunSummaryResponse> scopePage =
            await scopeResponse.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(JsonOptions);

        scopePage.Items.Any(item => item.RunId == finalized.RunGuid).Should().BeTrue();
        scopePage.RequestedTake.Should().Be(50);
    }
}
