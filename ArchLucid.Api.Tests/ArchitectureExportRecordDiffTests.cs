using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Export Record Diff.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureExportRecordDiffTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareExportRecords_ReturnsDifferencesBetweenTwoExports()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        var executiveRequest = new
        {
            templateProfile = "sponsor",
            audience = "Executives",
            externalDelivery = true,
            executiveFriendly = true,
            regulatedEnvironment = false,
            needDetailedEvidence = false,
            needExecutionTraces = false,
            needDeterminismOrCompareAppendices = false,
            includeEvidence = true,
            includeExecutionTraces = false,
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

        var internalRequest = new
        {
            templateProfile = "internal",
            audience = "Internal architects",
            externalDelivery = false,
            executiveFriendly = false,
            regulatedEnvironment = false,
            needDetailedEvidence = true,
            needExecutionTraces = true,
            needDeterminismOrCompareAppendices = true,
            includeEvidence = true,
            includeExecutionTraces = true,
            includeManifest = true,
            includeDiagram = true,
            includeSummary = true,
            includeDeterminismCheck = true,
            determinismIterations = 3,
            includeManifestCompare = false,
            compareManifestVersion = (string?)null,
            includeAgentResultCompare = false,
            compareRunId = (string?)null
        };

        HttpResponseMessage executiveExport = await Client.PostAsync(
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export/docx/consulting",
            JsonContent(executiveRequest));
        await executiveExport.EnsureSuccessForTestAsync();
        HttpResponseMessage internalExport = await Client.PostAsync(
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export/docx/consulting",
            JsonContent(internalRequest));
        await internalExport.EnsureSuccessForTestAsync();
        HttpResponseMessage historyResponse = await Client.GetAsync($"/v1/architecture/review/{finalized.RunId}/exports");
                RunExportHistoryResponse? history =
            await historyResponse.ReadJsonForTestAsync<RunExportHistoryResponse>(JsonOptions);
        history.Should().NotBeNull();
        history.Exports.Should().HaveCountGreaterThanOrEqualTo(2);

        string leftId = history.Exports[0].ExportRecordId;
        string rightId = history.Exports[1].ExportRecordId;

        HttpResponseMessage compareResponse = await Client.GetAsync(
            $"/v1/architecture/review/exports/compare?leftExportRecordId={leftId}&rightExportRecordId={rightId}");        ExportRecordDiffResponse? payload =
            await compareResponse.ReadJsonForTestAsync<ExportRecordDiffResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Diff.ChangedTopLevelFields.Should().NotBeEmpty();
    }
}
