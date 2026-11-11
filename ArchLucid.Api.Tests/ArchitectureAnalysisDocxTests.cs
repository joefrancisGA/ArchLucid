using System.Text.Json;

using ArchLucid.Application.Jobs;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Analysis Docx.
/// </summary>
[Trait("Category", "Slow")]
public sealed class ArchitectureAnalysisDocxTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ExportAnalysisReportDocx_ReturnsDocxFile()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        HttpResponseMessage response = await finalized.PostAnalysisReportDocxHttpAsync(Client, JsonOptions);

        response.Content.Headers.ContentType!.MediaType
            .Should().Be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        await response.ReadBytesForTestAsync();
    }

    [SkippableFact]
    public async Task ExportAnalysisReportDocxAsync_ReturnsJob_AndEventuallyFile()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        HttpResponseMessage start = await finalized.PostAnalysisReportDocxAsyncJobHttpAsync(Client, JsonOptions);

        JsonElement payload = await start.ReadJsonForTestAsync<JsonElement>(JsonOptions);
        payload.TryGetProperty("jobId", out JsonElement jobIdEl).Should().BeTrue();
        string? jobId = jobIdEl.GetString();
        jobId.Should().NotBeNullOrWhiteSpace();

        BackgroundJobState terminalState = await IntegrationTestJobPollSupport.PollJobUntilTerminalStateAsync(
            Client,
            jobId!,
            JsonOptions,
            HarnessPollDefaults.BackgroundJobDefaultMaxIterations,
            HarnessPollDefaults.BackgroundJobDefaultDelay);
        terminalState.Should().Be(BackgroundJobState.Succeeded);

        HttpResponseMessage fileResp = await IntegrationTestJobPollSupport.GetJobFileHttpAsync(Client, jobId!);
        fileResp.Content.Headers.ContentType!.MediaType
            .Should().Be("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        await fileResp.ReadBytesForTestAsync();
    }
}
