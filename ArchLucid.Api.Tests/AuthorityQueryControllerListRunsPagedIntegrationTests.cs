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

        CursorPagedResponse<RunSummaryResponse> body =
            await finalized.ListAuthorityReviewsForProjectAsync(Client, JsonOptions);

        body.Items.Should().NotBeEmpty();
        body.RequestedTake.Should().Be(20);
    }

    [SkippableFact]
    public async Task ListRunsByProject_with_legacy_page_size_clamps_requested_take()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        CursorPagedResponse<RunSummaryResponse> body = await Client.ReadAuthorityProjectReviewsQueryAsync(
            JsonOptions,
            Uri.EscapeDataString(finalized.SystemName),
            "page=1&pageSize=10");

        body.Items.Should().NotBeEmpty();
        body.RequestedTake.Should().Be(10);
    }

    [SkippableFact]
    public async Task ListRunsInScope_includes_run_hidden_from_default_project_slug()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        CursorPagedResponse<RunSummaryResponse> defaultPage = await Client.ReadAuthorityProjectReviewsQueryAsync(
            JsonOptions,
            "default",
            "take=50");

        defaultPage.Items.Any(item => item.RunId == finalized.RunGuid)
            .Should()
            .BeFalse("create maps SystemName onto the run project slug, not 'default'");

        CursorPagedResponse<RunSummaryResponse> scopePage =
            await Client.ReadAuthorityReviewsInScopeAsync(JsonOptions);

        scopePage.Items.Any(item => item.RunId == finalized.RunGuid).Should().BeTrue();
        scopePage.RequestedTake.Should().Be(50);
    }
}
