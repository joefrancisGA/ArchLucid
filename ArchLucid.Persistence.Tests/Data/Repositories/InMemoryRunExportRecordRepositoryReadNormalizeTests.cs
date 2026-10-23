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
        const string runId = "cccccccccccccccccccccccccccccccc";
        InMemoryRunExportRecordRepository repository = new();
        RunExportRecord legacy = new()
        {
            ExportRecordId = exportId,
            RunId = $"  {runId}  ",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "  legacy-report.md  ",
            CreatedUtc = new DateTime(2026, 4, 5, 12, 0, 0, DateTimeKind.Utc),
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
        loaded!.RunId.Should().Be(runId);
        loaded.FileName.Should().Be("legacy-report.md");
    }
}
