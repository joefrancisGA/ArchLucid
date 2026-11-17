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
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        ArchitectureAnalysisExportResponse payload =
            await finalized.PostAnalysisReportMarkdownExportAsync(Client, JsonOptions);
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
