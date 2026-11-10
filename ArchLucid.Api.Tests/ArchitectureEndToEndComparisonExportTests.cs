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
        CommittedReplayPair pair = await Replay.CommitAndReplayAsync("REQ-E2E-EXPORT-001");

        EndToEndReplayComparisonExportResponse payload = await (
            await Client.GetEndToEndCompareExportMarkdownForTestAsync(pair.RunId, pair.ReplayRunId))
            .ReadJsonForTestAsync<EndToEndReplayComparisonExportResponse>(JsonOptions);
        payload.Format.Should().Be("markdown");
        payload.Content.Should().Contain("# ArchLucid End-to-End Replay Comparison Export");
    }

    [SkippableFact]
    public async Task ExportRunsEndToEndComparisonDocx_ReturnsDocx()
    {
        CommittedReplayPair pair = await Replay.CommitAndReplayAsync("REQ-E2E-EXPORT-002");

        HttpResponseMessage response =
            await Client.GetEndToEndCompareExportDocxForTestAsync(pair.RunId, pair.ReplayRunId);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType
            .Should().Be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        byte[] bytes = await response.Content.ReadAsByteArrayAsync();
        bytes.Length.Should().BeGreaterThan(0);
    }

    [SkippableFact]
    public async Task DownloadEndToEndComparisonMarkdown_RangeRequest_Returns206PartialContent()
    {
        CommittedReplayPair pair = await Replay.CommitAndReplayAsync("REQ-E2E-RANGE-001");

        using HttpRequestMessage req = IntegrationTestRunLifecycleSupport
            .CreateEndToEndCompareExportFileRangeGetRequestForTest(pair.RunId, pair.ReplayRunId, 0, 15);

        HttpResponseMessage response = await Client.SendAsync(req);

        response.StatusCode.Should().Be(HttpStatusCode.PartialContent);
        response.Headers.AcceptRanges.ToString().Should().Contain("bytes");
        response.Content.Headers.ContentRange.Should().NotBeNull();
        byte[] body = await response.Content.ReadAsByteArrayAsync();
        body.Length.Should().Be(16);
    }
}
