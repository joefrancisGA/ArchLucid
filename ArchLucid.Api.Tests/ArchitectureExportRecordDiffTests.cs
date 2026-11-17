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

        HttpResponseMessage executiveExport = await finalized.PostAnalysisReportConsultingDocxHttpAsync(
            Client,
            JsonOptions,
            HarnessConsultingExportRequestFactory.CreateExecutiveSponsorBody());
        await executiveExport.EnsureSuccessForTestAsync();

        HttpResponseMessage internalExport = await finalized.PostAnalysisReportConsultingDocxHttpAsync(
            Client,
            JsonOptions,
            HarnessConsultingExportRequestFactory.CreateInternalArchitectBody());
        await internalExport.EnsureSuccessForTestAsync();

        RunExportHistoryResponse history = await finalized.GetExportsHistoryAsync(Client, JsonOptions);
        history.Exports.Should().HaveCountGreaterThanOrEqualTo(2);

        string leftId = history.Exports[0].ExportRecordId;
        string rightId = history.Exports[1].ExportRecordId;

        HttpResponseMessage compareResponse =
            await finalized.GetExportRecordDiffHttpAsync(Client, leftId, rightId);

        ExportRecordDiffResponse? payload =
            await compareResponse.ReadJsonForTestAsync<ExportRecordDiffResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Diff.ChangedTopLevelFields.Should().NotBeEmpty();
    }
}
