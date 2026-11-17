using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

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
    public async Task ApplyMissingFromPriorExportsAsync_finds_prior_export_when_run_id_query_has_trailing_line_break()
    {
        InMemoryRunExportRecordRepository repository = new();
        const string runId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = runId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                AnalysisRequestJson =
                    """{"reviewBoardWhitelabelFirmDisplayName":"Line Break Lookup Firm"}""",
            },
            CancellationToken.None);

        ConsultingDocxWhitelabelHints hints = new();

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            $"{runId}\n",
            hints,
            repository,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Line Break Lookup Firm");
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
    public async Task ApplyMissingFromPriorExportsAsync_does_not_copy_footer_attribution_without_firm_display_name()
    {
        InMemoryRunExportRecordRepository repository = new();
        const string runId = "ffffffffffffffffffffffffffffffff";

        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = runId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                AnalysisRequestJson =
                    """{"reviewBoardWhitelabelFooterAttribution":"  Prepared by Contoso  "}""",
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
    public async Task ApplyMissingFromPriorExportsAsync_copies_engagement_when_hints_engagement_is_empty_string()
    {
        InMemoryRunExportRecordRepository repository = new();
        const string runId = "11111111111111111111111111111111";

        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = runId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                AnalysisRequestJson =
                    """{"reviewBoardWhitelabelFirmDisplayName":"Prior Firm","reviewBoardWhitelabelClientEngagementTitle":"Prior Engagement"}""",
            },
            CancellationToken.None);

        ConsultingDocxWhitelabelHints hints = new() { ClientEngagementTitle = string.Empty };

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            runId,
            hints,
            repository,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Prior Firm");
        hints.ClientEngagementTitle.Should().Be("Prior Engagement");
    }

    [Fact]
    public async Task ApplyMissingFromPriorExportsAsync_finds_prior_export_when_run_id_query_uses_dashed_guid()
    {
        Guid runKey = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string canonicalRunId = runKey.ToString("N");
        string dashedRunId = runKey.ToString("D");

        InMemoryRunExportRecordRepository repository = new();
        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = canonicalRunId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                AnalysisRequestJson =
                    """{"reviewBoardWhitelabelFirmDisplayName":"Dashed Route Firm"}""",
            },
            CancellationToken.None);

        ConsultingDocxWhitelabelHints hints = new();

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            dashedRunId,
            hints,
            repository,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Dashed Route Firm");
    }

    [Fact]
    public async Task ApplyMissingFromPriorExportsAsync_queries_canonical_run_id_when_route_uses_dashed_guid_with_padding()
    {
        Guid runKey = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string canonicalRunId = runKey.ToString("N");
        string dashedPaddedRunId = $"{runKey:D}  ";

        RunExportRecord prior = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = canonicalRunId,
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "seed.md",
            AnalysisRequestJson = """{"reviewBoardWhitelabelFirmDisplayName":"Canonical Lookup Firm"}""",
        };

        Mock<IRunExportRecordRepository> repository = new();
        repository
            .Setup(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([prior]);
        repository
            .Setup(r => r.GetByRunIdAsync(It.Is<string>(id => id != canonicalRunId), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RunExportRecord>());

        ConsultingDocxWhitelabelHints hints = new();

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            dashedPaddedRunId,
            hints,
            repository.Object,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Canonical Lookup Firm");
        repository.Verify(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CompareQuality_ApplyMissingFromPriorExportsAsync_finds_prior_export_when_repository_matches_only_alternate_run_id_key()
    {
        Guid runKey = Guid.Parse("34343434-3434-3434-3434-343434343434");
        string canonicalRunId = runKey.ToString("N");
        string legacyUpperRunId = canonicalRunId.ToUpperInvariant();

        RunExportRecord prior = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = canonicalRunId,
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "seed.md",
            AnalysisRequestJson = """{"reviewBoardWhitelabelFirmDisplayName":"Alternate Key Firm"}""",
        };

        Mock<IRunExportRecordRepository> repository = new();
        repository
            .Setup(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([prior]);

        ConsultingDocxWhitelabelHints hints = new();

        await ConsultingDocxExportWhitelabelPrefill.ApplyMissingFromPriorExportsAsync(
            canonicalRunId,
            hints,
            repository.Object,
            CancellationToken.None);

        hints.FirmDisplayName.Should().Be("Alternate Key Firm");
        repository.Verify(r => r.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()), Times.Once);
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
