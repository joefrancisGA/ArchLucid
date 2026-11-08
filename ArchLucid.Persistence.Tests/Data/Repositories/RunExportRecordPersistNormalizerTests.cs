using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class RunExportRecordPersistNormalizerTests
{
    [Fact]
    public void NormalizeLoadedRecord_trims_run_id_and_optional_string_columns()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "exp-1",
            RunId = "  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  ",
            ExportType = "  ArchitectureAnalysis  ",
            Format = "  Markdown  ",
            FileName = "  report.md  ",
            CompareManifestVersion = "  v1  ",
        };

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(record);

        record.RunId.Should().Be("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        record.ExportType.Should().Be("ArchitectureAnalysis");
        record.Format.Should().Be("Markdown");
        record.FileName.Should().Be("report.md");
        record.CompareManifestVersion.Should().Be("v1");
    }

    [Fact]
    public void NormalizeLoadedRecord_nulls_whitespace_only_optional_strings()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "exp-2",
            RunId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "report.md",
            Notes = "   ",
            TemplateProfile = "  ",
        };

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(record);

        record.Notes.Should().BeNull();
        record.TemplateProfile.Should().BeNull();
    }

    [Fact]
    public void NormalizeLoadedRecord_trims_export_record_id_and_required_string_columns()
    {
        RunExportRecord record = new()
        {
            ExportRecordId = "  exp-trim-id  ",
            RunId = "  dddddddddddddddddddddddddddddddd  ",
            ExportType = "  ArchitectureAnalysis  ",
            Format = "  Markdown  ",
            FileName = "  report.md  ",
        };

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(record);

        record.ExportRecordId.Should().Be("exp-trim-id");
        record.ExportType.Should().Be("ArchitectureAnalysis");
        record.Format.Should().Be("Markdown");
        record.FileName.Should().Be("report.md");
    }

    [Fact]
    public void NormalizeLoadedRecord_canonicalizes_dashed_run_id_and_compare_run_id()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid compareGuid = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        RunExportRecord record = new()
        {
            ExportRecordId = "exp-canonical-read",
            RunId = $"  {runGuid:D}  ",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "report.md",
            CompareRunId = $"  {compareGuid:D}  ",
        };

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(record);

        record.RunId.Should().Be(runGuid.ToString("N"));
        record.CompareRunId.Should().Be(compareGuid.ToString("N"));
    }
}
