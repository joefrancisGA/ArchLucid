using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Analysis Report.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureAnalysisReportTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task AnalysisReport_ReturnsUnifiedReport()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        ArchitectureAnalysisReportResponse payload = await finalized.PostAnalysisReportAsync(Client, JsonOptions);
        payload.Should().NotBeNull();
        payload.Report.Run.RunId.Should().Be(finalized.RunId);
        payload.Report.Evidence.Should().NotBeNull();
        payload.Report.ExecutionTraces.Should().NotBeEmpty();
        payload.Report.Manifest.Should().NotBeNull();
        payload.Report.Diagram.Should().Contain("flowchart ");
        payload.Report.Summary.Should().Contain("# Architecture Summary:");
    }
}
