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
    public async Task ApplyMissingFromPriorExportsAsync_finds_prior_export_when_run_id_query_is_padded()
    {
        InMemoryRunExportRecordRepository repository = new();
        const string runId = "cccccccccccccccccccccccccccccccc";

        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = runId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                AnalysisRequestJson =
                    """{"reviewBoardWhitelabelFirmDisplayName":"Padded Run Lookup Firm"}""",
            },
            CancellationToken.None);

        ConsultingDocxWhitelabelHints hints = new();

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            $"  {runId}  ",
            hints,
            repository,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Padded Run Lookup Firm");
    }

    [Fact]
    public async Task ApplyMissingFromPriorExportsAsync_copies_trimmed_firm_when_stored_json_has_padding()
    {
        InMemoryRunExportRecordRepository repository = new();
        const string runId = "dddddddddddddddddddddddddddddddd";

        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = runId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                AnalysisRequestJson =
                    """{"reviewBoardWhitelabelFirmDisplayName":"  Padded Firm Name  "}""",
            },
            CancellationToken.None);

        ConsultingDocxWhitelabelHints hints = new();

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            runId,
            hints,
            repository,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Padded Firm Name");
    }

    [Fact]
    public async Task ApplyMissingFromPriorExportsAsync_skips_prior_row_when_firm_name_is_whitespace_only_after_trim()
    {
        InMemoryRunExportRecordRepository repository = new();
        const string runId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = runId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                AnalysisRequestJson = """{"reviewBoardWhitelabelFirmDisplayName":"   "}""",
            },
            CancellationToken.None);

        ConsultingDocxWhitelabelHints hints = new();

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            runId,
            hints,
            repository,
            CancellationToken.None);

        hints.FirmDisplayName.Should().BeNull();
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
