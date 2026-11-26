using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <c>GET /v1/architecture/review/{runId}/findings/export/csv</c>.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class RunFindingsCsvExportEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ExportRunFindingsCsv_WhenRunUnknown_Returns404Problem()
    {
        using HttpResponseMessage res = await Client.GetReviewFindingsExportCsvHttpAsync(
            HarnessWellKnownGuids.UnknownRunForReviewSubresource);

        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ExportRunFindingsCsv_includes_external_tracking_header_columns()
    {
        FinalizedRun review = await ArrangeFinalizedAsync();
        using HttpResponseMessage res = await review.GetFindingsExportCsvHttpAsync(Client);

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        using StringReader csv = new(await res.Content.ReadAsStringAsync());
        string? header = csv.ReadLine();
        header.Should().NotBeNullOrWhiteSpace();
        header!.Split(',').TakeLast(7).Should().Equal(
            "Provider", "ExternalKey", "ExternalUrl", "HumanReviewStatus",
            "LatestDisposition", "RevisitDueUtc", "ItsmLinkedTicketsSummary");
    }
}
