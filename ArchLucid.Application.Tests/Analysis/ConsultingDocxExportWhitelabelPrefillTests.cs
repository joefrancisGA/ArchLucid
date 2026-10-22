using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ConsultingDocxExportWhitelabelPrefillTests
{
    [Fact]
    public async Task ApplyMissingFromPriorExportsAsync_copies_firm_from_earlier_export_row()
    {
        InMemoryRunExportRecordRepository repository = new();
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = runId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                AnalysisRequestJson =
                    """{"reviewBoardWhitelabelFirmDisplayName":"Meridian Advisory Group","reviewBoardWhitelabelClientEngagementTitle":"Alpine Health — AI Governance Engagement"}""",
            },
            CancellationToken.None);

        ConsultingDocxWhitelabelHints hints = new();

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            runId,
            hints,
            repository,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Meridian Advisory Group");
        hints.ClientEngagementTitle.Should().Be("Alpine Health — AI Governance Engagement");
    }

    [Fact]
    public async Task ApplyMissingFromPriorExportsAsync_leaves_existing_firm_display_name_unchanged()
    {
        InMemoryRunExportRecordRepository repository = new();
        ConsultingDocxWhitelabelHints hints = new() { FirmDisplayName = "Caller Firm" };

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            hints,
            repository,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Caller Firm");
    }
}
