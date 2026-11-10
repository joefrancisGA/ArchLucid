using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Analysis Export.
/// </summary>
[Trait("Category", "Slow")]
public sealed class ArchitectureAnalysisExportTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ExportAnalysisReport_ReturnsMarkdown()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync(nameof(ArchitectureAnalysisExportTests));
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
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export",
            JsonContent(request));        ArchitectureAnalysisExportResponse? payload =
            await response.ReadJsonForTestAsync<ArchitectureAnalysisExportResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.RunId.Should().Be(finalized.RunId);
        payload.Format.Should().Be("markdown");
        payload.FileName.Should().Be($"analysis_{finalized.RunId}.md");
        payload.Content.Should().NotBeNullOrWhiteSpace();

        string[] lines = payload.Content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        lines[0].Trim().Should().Be("# ArchLucid Analysis Report");

        payload.Content.Should().Contain("## Evidence Package");
        payload.Content.Should().Contain("## Architecture Manifest");
        payload.Content.Should().Contain("## Agent Execution Traces");
        payload.Content.Should().Contain("## Architecture Summary");
    }
}
