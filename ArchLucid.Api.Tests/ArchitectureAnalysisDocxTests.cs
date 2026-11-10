using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Analysis Docx.
/// </summary>
[Trait("Category", "Slow")]
public sealed class ArchitectureAnalysisDocxTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    private const int AsyncDocxJobPollMaxIterations = 25;

    private static readonly TimeSpan AsyncDocxJobPollDelay = TimeSpan.FromMilliseconds(200);

    [SkippableFact]
    public async Task ExportAnalysisReportDocx_ReturnsDocxFile()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        var request = new
        {
            includeEvidence = true,
            includeExecutionTraces = true,
            includeManifest = true,
            includeDiagram = true,
            includeSummary = true,
            includeDeterminismCheck = false,
            determinismIterations = 3,
            includeManifestCompare = false,
            compareManifestVersion = (string?)null,
            includeAgentResultCompare = false,
            compareRunId = (string?)null
        };

        HttpResponseMessage response = await Client.PostAsync(
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export/docx",
            JsonContent(request));

        response.Content.Headers.ContentType!.MediaType
            .Should().Be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        await response.ReadBytesForTestAsync();
    }

    [SkippableFact]
    public async Task ExportAnalysisReportDocxAsync_ReturnsJob_AndEventuallyFile()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        var request = new
        {
            includeEvidence = true,
            includeExecutionTraces = true,
            includeManifest = true,
            includeDiagram = true,
            includeSummary = true,
            includeDeterminismCheck = false,
            determinismIterations = 3,
            includeManifestCompare = false,
            compareManifestVersion = (string?)null,
            includeAgentResultCompare = false,
            compareRunId = (string?)null
        };

        HttpResponseMessage start = await Client.PostAsync(
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export/docx/async",
            JsonContent(request));

        JsonElement payload = await start.ReadJsonForTestAsync<JsonElement>(JsonOptions);
        payload.TryGetProperty("jobId", out JsonElement jobIdEl).Should().BeTrue();
        string? jobId = jobIdEl.GetString();
        jobId.Should().NotBeNullOrWhiteSpace();

        string state = await IntegrationTestJobPollSupport.PollJobUntilSucceededOrFailedAsync(
            Client,
            jobId!,
            JsonOptions,
            AsyncDocxJobPollMaxIterations,
            AsyncDocxJobPollDelay);
        state.Should().Be("Succeeded");

        HttpResponseMessage fileResp = await Client.GetAsync($"/v1/jobs/{jobId}/file");
        fileResp.Content.Headers.ContentType!.MediaType
            .Should().Be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        await fileResp.ReadBytesForTestAsync();
    }
}
