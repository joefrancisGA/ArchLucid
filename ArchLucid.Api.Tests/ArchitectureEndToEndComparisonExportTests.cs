using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture End To End Comparison Export.
/// </summary>
[Trait("Category", "Slow")]
public sealed class ArchitectureEndToEndComparisonExportTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ExportRunsEndToEndComparisonMarkdown_ReturnsMarkdown()
    {
        CommittedReplayPair pair = await ArrangeCommittedPairAsync();

        EndToEndReplayComparisonExportResponse payload = await (
            await Client.GetEndToEndCompareExportMarkdownForTestAsync(pair))
            .ReadJsonForTestAsync<EndToEndReplayComparisonExportResponse>(JsonOptions);
        payload.Format.Should().Be("markdown");
        payload.Content.Should().Contain("# ArchLucid End-to-End Replay Comparison Export");
    }

    [SkippableFact]
    public async Task ExportRunsEndToEndComparisonDocx_ReturnsDocx()
    {
        CommittedReplayPair pair = await ArrangeCommittedPairAsync();

        HttpResponseMessage response =
            await Client.GetEndToEndCompareExportDocxForTestAsync(pair);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType
            .Should().Be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        byte[] bytes = await response.Content.ReadAsByteArrayAsync();
        bytes.Length.Should().BeGreaterThan(0);
    }

    [SkippableFact]
    public async Task DownloadEndToEndComparisonMarkdown_RangeRequest_Returns206PartialContent()
    {
        CommittedReplayPair pair = await ArrangeCommittedPairAsync();

        using HttpRequestMessage req = IntegrationTestRunLifecycleSupport
            .CreateEndToEndCompareExportFileRangeGetRequestForTest(pair, 0, 15);

        HttpResponseMessage response = await Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.PartialContent);
        response.Headers.AcceptRanges.ToString().Should().Contain("bytes");
        response.Content.Headers.ContentRange.Should().NotBeNull();
        byte[] body = await response.Content.ReadAsByteArrayAsync();
        body.Length.Should().Be(16);
    }
}
