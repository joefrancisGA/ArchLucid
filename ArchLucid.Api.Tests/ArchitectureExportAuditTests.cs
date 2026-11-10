using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Export Audit.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureExportAuditTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ConsultingDocxExport_PersistsExportHistory()
    {
        FinalizedRun finalized = await CreateFinalizedRunAsync(TestRequestIds.ForScenario(nameof(ArchitectureExportAuditTests)));

        var request = new
        {
            templateProfile = (string?)null,
            audience = "Executives and sponsors",
            externalDelivery = true,
            executiveFriendly = true,
            regulatedEnvironment = false,
            needDetailedEvidence = false,
            needExecutionTraces = false,
            needDeterminismOrCompareAppendices = false,
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

        HttpResponseMessage exportResponse = await Client.PostAsJsonAsync(
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export/docx/consulting",
            request);

        exportResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage historyResponse = await Client.GetAsync($"/v1/architecture/review/{finalized.RunId}/exports");        RunExportHistoryResponse? payload =
            await historyResponse.ReadJsonForTestAsync<RunExportHistoryResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Exports.Should().NotBeEmpty();

        RunExportRecordDto export = payload.Exports.First();
        export.RunId.Should().Be(finalized.RunId);
        export.ExportType.Should().Be("analysis-report-consulting-docx");
        export.Format.Should().Be("docx");
        export.TemplateProfile.Should().NotBeNullOrWhiteSpace();
        export.WasAutoSelected.Should().BeTrue();
        export.IncludedEvidence.Should().BeTrue();
        export.IncludedExecutionTraces.Should().BeTrue();
        export.IncludedManifest.Should().BeTrue();
        export.IncludedDiagram.Should().BeTrue();
        export.IncludedSummary.Should().BeTrue();
        export.IncludedDeterminismCheck.Should().BeFalse();
        export.DeterminismIterations.Should().Be(3);
        export.AnalysisRequestJson.Should().NotBeNullOrWhiteSpace();
    }
}
