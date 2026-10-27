using System.Reflection;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryRunExportRecordRepositoryReadNormalizeTests
{
    [Fact]
    public async Task GetById_trims_legacy_padded_optional_columns_on_read()
    {
        const string exportId = "exp-legacy-pad-read";
        const string paddedExportId = $"  {exportId}  ";
        const string runId = "cccccccccccccccccccccccccccccccc";
        InMemoryRunExportRecordRepository repository = new();
        RunExportRecord legacy = new()
        {
            ExportRecordId = paddedExportId,
            RunId = $"  {runId}  ",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "  legacy-report.md  ",
            Notes = "  legacy note  ",
            CreatedUtc = new DateTime(2026, 4, 5, 12, 0, 0, DateTimeKind.Utc),
        };

        FieldInfo? byExportIdField = typeof(InMemoryRunExportRecordRepository).GetField(
            "_byExportId",
            BindingFlags.Instance | BindingFlags.NonPublic);
        byExportIdField.Should().NotBeNull();
        Dictionary<string, RunExportRecord> byExportId =
            (Dictionary<string, RunExportRecord>)byExportIdField!.GetValue(repository)!;
        byExportId[exportId] = legacy;

        RunExportRecord? loaded = await repository.GetByIdAsync(paddedExportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ExportRecordId.Should().Be(exportId);
        loaded.RunId.Should().Be(runId);
        loaded.FileName.Should().Be("legacy-report.md");
        loaded.Notes.Should().Be("legacy note");
    }

    [Fact]
    public async Task GetById_matches_when_lookup_export_id_differs_only_by_casing()
    {
        const string storedExportId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string lookupExportId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        const string runId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        InMemoryRunExportRecordRepository repository = new();
        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = storedExportId,
                RunId = runId,
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "report.md",
                CreatedUtc = new DateTime(2026, 4, 6, 12, 0, 0, DateTimeKind.Utc),
            },
            CancellationToken.None);

        RunExportRecord? loaded = await repository.GetByIdAsync(lookupExportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ExportRecordId.Should().Be(storedExportId);
    }

    [Fact]
    public async Task GetById_canonicalizes_dashed_compare_run_id_on_legacy_row()
    {
        const string exportId = "exp-legacy-dashed-compare";
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid compareGuid = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        InMemoryRunExportRecordRepository repository = new();
        RunExportRecord legacy = new()
        {
            ExportRecordId = exportId,
            RunId = runGuid.ToString("N"),
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "legacy-report.md",
            CompareRunId = compareGuid.ToString("D"),
            CreatedUtc = new DateTime(2026, 4, 6, 12, 0, 0, DateTimeKind.Utc),
        };

        FieldInfo? byExportIdField = typeof(InMemoryRunExportRecordRepository).GetField(
            "_byExportId",
            BindingFlags.Instance | BindingFlags.NonPublic);
        byExportIdField.Should().NotBeNull();
        Dictionary<string, RunExportRecord> byExportId =
            (Dictionary<string, RunExportRecord>)byExportIdField!.GetValue(repository)!;
        byExportId[exportId] = legacy;

        RunExportRecord? loaded = await repository.GetByIdAsync(exportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.CompareRunId.Should().Be(compareGuid.ToString("N"));
    }
}
